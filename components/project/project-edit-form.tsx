"use client";

import { useEffect, useMemo, useState } from "react";
import { Button }      from "@/components/ui/button";
import { Input }       from "@/components/ui/input";
import { Textarea }    from "@/components/ui/textarea";
import { Badge }       from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Checkbox }    from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Plus }        from "lucide-react";
import { useAccount }  from "wagmi";

interface Member {
  id: string;
  role: string;
  allocation: string;         // BigInt serialized
  balance: string;            // task/project balance? (unused here)
  name?: string | null;
  user: { name: string | null; address: string; id: string };
  community: { id: string };
}

interface Tag {
  id: string;
  label: string;
  slug: string;
}

interface ProjectPayload {
  id: string;
  title:       string;
  description: string;
  deadline:    string;
  status:      "active" | "completed" | "on_hold";
  balance:     string;
  teamLeaderId: string;
  members:     { id: string }[];
  tags?:       Tag[];
}

interface Props {
  communityId:   string;
  projectId:     string;
  callerAddress: string;
  onSaved:       () => void;
}

const sortTags = (tags: Tag[]) =>
  [...tags].sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { sensitivity: "base" })
  );

export default function ProjectEditForm({
  communityId,
  projectId,
  callerAddress,
  onSaved,
}: Props) {
  const { address } = useAccount();

  /* ── Form state ───────────────────────────────────────────────── */
  const [title, setTitle]           = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline]     = useState("");
  const [status, setStatus]         = useState<"active" | "completed" | "on_hold">("active");
  const [budget, setBudget]         = useState("");    // integer string
  const [teamLeaderId, setTeamLeaderId] = useState("");
  const [memberIds, setMemberIds]       = useState<string[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  /* ── Reference data ───────────────────────────────────────────── */
  const [members, setMembers]       = useState<Member[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [myAllocation, setMyAllocation] = useState<bigint>(0n);

  /* ── UI state ─────────────────────────────────────────────────── */
  const [loading, setLoading]       = useState(false);
  const [err, setErr]               = useState<string | null>(null);
  const [tagErr, setTagErr]         = useState<string | null>(null);
  const [createTagOpen, setCreateTagOpen] = useState(false);
  const [newTagLabel, setNewTagLabel] = useState("");
  const [tagSubmitting, setTagSubmitting] = useState(false);

  const actorAddress = callerAddress || address || "";

  const selectedTags = useMemo(
    () => availableTags.filter((tag) => selectedTagIds.includes(tag.id)),
    [availableTags, selectedTagIds]
  );

  const toggleMember = (id: string) =>
    setMemberIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const toggleTag = (id: string) =>
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const memberLabel = (id: string) =>
    members.find((m) => m.id === id)?.name ||
    members.find((m) => m.id === id)?.user.name ||
    members.find((m) => m.id === id)?.user.address ||
    "—";

  /* ── 1) Load only **your** Member record for allocation ───────── */
  useEffect(() => {
    if (!callerAddress) return;
    fetch(`/api/user/get?address=${callerAddress}`)
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error || res.statusText);
        return res.json();
      })
      .then((user: { members: Member[] }) => {
        const me = user.members.find((m) => m.community.id === communityId);
        if (!me) {
          throw new Error("Not a member of this community");
        }
        setMyAllocation(BigInt(me.allocation));
      })
      .catch((e) => {
        console.error(e);
        setErr(e.message);
      });
  }, [callerAddress, communityId]);

  /* ── 2) Load community tags ───────────────────────────────────── */
  useEffect(() => {
    fetch(`/api/community/${communityId}/tags`)
      .then((res) => {
        if (!res.ok) throw res;
        return res.json();
      })
      .then((tags: Tag[]) => {
        if (Array.isArray(tags)) {
          const filtered = tags.filter((tag) => !tag.slug?.startsWith("member-"));
          setAvailableTags(sortTags(filtered));
        }
      })
      .catch(() => setAvailableTags([]));
  }, [communityId]);

  /* ── 3) Load project details & full member list ───────────────── */
  useEffect(() => {
    const loadAll = async () => {
      try {
        const [projRes, memRes] = await Promise.all([
          fetch(`/api/community/${communityId}/projects/${projectId}`),
          fetch(`/api/community/${communityId}/members`),
        ]);
        if (!projRes.ok) {
          const e = await projRes.json();
          throw new Error(e.error || "Failed to load project");
        }
        if (!memRes.ok) {
          const e = await memRes.json();
          throw new Error(e.error || "Failed to load members");
        }

        const proj = (await projRes.json()) as ProjectPayload;
        const memData = await memRes.json();
        const mems: Member[] = Array.isArray(memData)
          ? memData
          : Array.isArray(memData?.members)
          ? memData.members
          : [];

        // Populate form defaults
        setTitle(proj.title);
        setDescription(proj.description);
        setDeadline(proj.deadline.split("T")[0]);
        setStatus(proj.status);
        setBudget(proj.balance.toString());
        setTeamLeaderId(proj.teamLeaderId);

        const userIds = proj.members.map((m) => m.id);
        setMemberIds(
          mems
            .filter((m) => userIds.includes(m.user.id))
            .map((m) => m.id)
        );
        setMembers(mems);

        const tagList = Array.isArray(proj.tags) ? proj.tags : [];
        setSelectedTagIds(tagList.map((tag) => tag.id));
      } catch (err: any) {
        console.error(err);
        setErr(err.message);
      }
    };
    loadAll();
  }, [communityId, projectId]);

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    const label = newTagLabel.trim();
    if (!label) return;
    if (!actorAddress) {
      setTagErr("Connect your wallet to create tags");
      return;
    }

    setTagSubmitting(true);
    setTagErr(null);

    try {
      const res = await fetch(`/api/community/${communityId}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, address: actorAddress }),
      });

      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || "Failed to create tag");
      }

      const created: Tag = await res.json();
      setAvailableTags((prev) => {
        if (prev.some((tag) => tag.id === created.id)) return prev;
        return sortTags([...prev, created]);
      });
      setSelectedTagIds((prev) =>
        prev.includes(created.id) ? prev : [...prev, created.id]
      );
      setNewTagLabel("");
      setCreateTagOpen(false);
    } catch (error: any) {
      setTagErr(error.message);
    } finally {
      setTagSubmitting(false);
    }
  };

  /* ── 4) Submit updated project ────────────────────────────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErr(null);

    try {
      const res = await fetch(
        `/api/community/${communityId}/projects/${projectId}/edit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title:         title.trim(),
            description:   description.trim(),
            deadline,
            status,
            balance:       budget,
            teamLeaderId,
            memberIds,
            tagIds:        selectedTagIds,
            address:       callerAddress,
          }),
        }
      );
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || "Failed to save changes");
      }
      onSaved();
    } catch (err: any) {
      console.error(err);
      setErr(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TooltipProvider>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium">Title</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium">Description</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        {/* Deadline */}
        <div>
          <label className="block text-sm font-medium">Deadline</label>
          <Input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            required
          />
        </div>

        {/* Allocation & Budget */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">
            Your allocation: {myAllocation.toString()} TOKEN
          </p>
          <Input
            type="number"
            min={0}
            max={myAllocation.toString()}
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="Budget (TOKEN)"
          />
        </div>

        {/* Status */}
        <Select value={status} onValueChange={(v) => setStatus(v as any)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="on_hold">On Hold</SelectItem>
          </SelectContent>
        </Select>

        {/* Team Leader */}
        <Select value={teamLeaderId} onValueChange={(v) => setTeamLeaderId(v)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Team Leader">
              {memberLabel(teamLeaderId)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {members.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name || m.user.name || m.user.address}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Members Multi-Select */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              {memberIds.length
                ? `${memberIds.length} selected`
                : "Select members"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="max-h-60 overflow-auto p-2">
            {members.map((m) => (
              <label
                key={m.id}
                className="flex items-center space-x-2 py-1 hover:bg-muted"
              >
                <Checkbox
                  checked={memberIds.includes(m.id)}
                  onCheckedChange={() => toggleMember(m.id)}
                />
                <span>{m.name || m.user.name || m.user.address}</span>
              </label>
            ))}
          </PopoverContent>
        </Popover>

        {/* Tags */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Tags</label>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex-1 justify-between">
                  {selectedTagIds.length
                    ? `${selectedTagIds.length} selected`
                    : "Select tags"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 max-h-64 overflow-auto p-2 space-y-1">
                {availableTags.length ? (
                  availableTags.map((tag) => (
                    <label
                      key={tag.id}
                      className="flex items-center space-x-2 py-1"
                    >
                      <Checkbox
                        checked={selectedTagIds.includes(tag.id)}
                        onCheckedChange={() => toggleTag(tag.id)}
                      />
                      <span>{tag.label}</span>
                    </label>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No tags yet.</p>
                )}
              </PopoverContent>
            </Popover>

            <Tooltip>
              <TooltipTrigger asChild>
                <Popover open={createTagOpen} onOpenChange={setCreateTagOpen}>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" size="icon">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-60 space-y-3">
                    <form className="space-y-3" onSubmit={handleCreateTag}>
                      <Input
                        autoFocus
                        value={newTagLabel}
                        onChange={(e) => setNewTagLabel(e.target.value)}
                        placeholder="Tag name"
                      />
                      <Button
                        type="submit"
                        size="sm"
                        disabled={tagSubmitting || !newTagLabel.trim()}
                        className="w-full"
                      >
                        {tagSubmitting ? "Creating…" : "Create"}
                      </Button>
                    </form>
                  </PopoverContent>
                </Popover>
              </TooltipTrigger>
              <TooltipContent>Create tag</TooltipContent>
            </Tooltip>
          </div>

          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedTags.map((tag) => (
                <Badge key={tag.id} variant="secondary">
                  {tag.label}
                </Badge>
              ))}
            </div>
          )}
          {tagErr && <p className="text-xs text-destructive">{tagErr}</p>}
        </div>

        {err && <p className="text-sm text-destructive">{err}</p>}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Saving…" : "Save Changes"}
        </Button>
      </form>
    </TooltipProvider>
  );
}
