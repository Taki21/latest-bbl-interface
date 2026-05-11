// File: components/project/project-form.tsx

"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter }           from "next/navigation";
import { useAccount }          from "wagmi";
import { Plus }                from "lucide-react";
import { cn }                  from "@/lib/utils";
import { Input }               from "@/components/ui/input";
import { Textarea }            from "@/components/ui/textarea";
import { Button }              from "@/components/ui/button";
import { Badge }               from "@/components/ui/badge";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Checkbox }            from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";

interface Member {
  id: string;
  role: string;
  allocation: string; // BigInt serialized
  community: { id: string; name: string; joinCode: string | null };
  name?: string | null;
  user?: { name: string | null; address: string };
}

interface Tag {
  id: string;
  label: string;
  slug: string;
}

interface ProjectFormProps {
  communityId: string;
  creatorAddress: string;
  onSuccess: () => void;
}

const sortTags = (tags: Tag[]) =>
  [...tags].sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { sensitivity: "base" })
  );

export default function ProjectForm({
  communityId,
  creatorAddress,
  onSuccess,
}: ProjectFormProps) {
  const router  = useRouter();
  const account = useAccount();
  const address = account.address;

  // Form state
  const [title, setTitle]           = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline]     = useState("");
  const [budget, setBudget]         = useState("");
  const [maxBudget, setMaxBudget]   = useState<bigint>(0n);
  const [status] = useState<"active" | "completed" | "on_hold">("active");
  const [teamLeaderId, setTeamLeaderId] = useState("");
  const [memberIds, setMemberIds]       = useState<string[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const [members, setMembers] = useState<Member[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [tagError, setTagError] = useState<string | null>(null);

  const [createTagOpen, setCreateTagOpen] = useState(false);
  const [newTagLabel, setNewTagLabel] = useState("");
  const [tagSubmitting, setTagSubmitting] = useState(false);
  const [teamLeaderOpen, setTeamLeaderOpen] = useState(false);
  const [teamLeaderSearch, setTeamLeaderSearch] = useState("");
  const [memberPopoverOpen, setMemberPopoverOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");

  const actorAddress = creatorAddress || address || "";

  const selectedTags = useMemo(
    () => availableTags.filter((tag) => selectedTagIds.includes(tag.id)),
    [availableTags, selectedTagIds]
  );

  // 1️⃣ Load _your_ Member record (to read your allocation)
  useEffect(() => {
    if (!creatorAddress) return;
    fetch(`/api/user/get?address=${creatorAddress}`)
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error || res.statusText);
        return res.json();
      })
      .then((user: { members: Member[] }) => {
        const me = user.members.find((m) => m.community.id === communityId);
        if (!me) throw new Error("You’re not a member of this community");
        setMaxBudget(BigInt(me.allocation));
      })
      .catch((err) => setError(err.message));
  }, [creatorAddress, communityId]);

  // 2️⃣ Load _all_ community members for the selects
  useEffect(() => {
    fetch(`/api/community/${communityId}/members`)
      .then((r) => r.json())
      .then((data: any) => {
        const list: Member[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.members)
          ? data.members
          : [];
        setMembers(list);
        if (list.length) setTeamLeaderId(list[0].id);
      })
      .catch((err) => console.error(err));
  }, [communityId]);

  // 3️⃣ Load community tags for selection
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

  const toggleMember = (id: string) =>
    setMemberIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const toggleTag = (id: string) =>
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    const label = newTagLabel.trim();
    if (!label) return;
    if (!actorAddress) {
      setTagError("Connect your wallet to create tags");
      return;
    }

    setTagSubmitting(true);
    setTagError(null);

    try {
      const res = await fetch(`/api/community/${communityId}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, address: actorAddress }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create tag");
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
    } catch (err: any) {
      setTagError(err.message);
    } finally {
      setTagSubmitting(false);
    }
  };

  // 4️⃣ Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const alloc = BigInt(budget || "0");
    if (alloc > maxBudget) {
      setError(`Max allowed: ${maxBudget} TOKEN`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/community/${communityId}/projects/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title:        title.trim(),
            description:  description.trim(),
            deadline,
            balance:      alloc.toString(),
            status,
            creatorAddress,
            teamLeaderId,
            memberIds,
            tagIds:       selectedTagIds,
          }),
        }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create project");
      }
      onSuccess();
      router.refresh();
    } catch (err: any) {
      setError(err.message);
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
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
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

        {/* Deadline & Budget */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Deadline</label>
            <Input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Budget</label>
            <Input
              type="number"
              min={0}
              max={maxBudget.toString()}
              placeholder={`Max: ${maxBudget}`}
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Team Leader */}
        <div>
          <label className="block text-sm font-medium">Team Leader</label>
          <Popover open={teamLeaderOpen} onOpenChange={(o) => { setTeamLeaderOpen(o); if (!o) setTeamLeaderSearch(""); }}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between font-normal">
                <span className="truncate">
                  {teamLeaderId
                    ? (members.find((m) => m.id === teamLeaderId) ?? members[0]) &&
                      (members.find((m) => m.id === teamLeaderId)?.name ||
                       members.find((m) => m.id === teamLeaderId)?.user?.name ||
                       members.find((m) => m.id === teamLeaderId)?.user?.address ||
                       "Select a leader…")
                    : "Select a leader…"}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-2 w-64">
              <Input
                placeholder="Search members…"
                value={teamLeaderSearch}
                onChange={(e) => setTeamLeaderSearch(e.target.value)}
                className="mb-2 h-8 text-sm"
              />
              <div className="max-h-52 overflow-auto">
                {members
                  .filter((m) => { const q = teamLeaderSearch.toLowerCase(); return !q || m.name?.toLowerCase().includes(q) || m.user?.name?.toLowerCase().includes(q) || m.user?.address?.toLowerCase().includes(q); })
                  .map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => { setTeamLeaderId(m.id); setTeamLeaderOpen(false); setTeamLeaderSearch(""); }}
                      className={cn("w-full text-left rounded px-2 py-1.5 text-sm hover:bg-muted", teamLeaderId === m.id && "bg-muted font-medium")}
                    >
                      {m.name || m.user?.name || m.user?.address}
                    </button>
                  ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Members Multi-Select */}
        <div>
          <label className="block text-sm font-medium">Members</label>
          <Popover open={memberPopoverOpen} onOpenChange={(o) => { setMemberPopoverOpen(o); if (!o) setMemberSearch(""); }}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                {memberIds.length ? `${memberIds.length} selected` : "Select members"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-2 w-64">
              <Input
                placeholder="Search members…"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="mb-2 h-8 text-sm"
              />
              <div className="max-h-48 overflow-auto">
                {members
                  .filter((m) => { const q = memberSearch.toLowerCase(); return !q || m.name?.toLowerCase().includes(q) || m.user?.name?.toLowerCase().includes(q) || m.user?.address?.toLowerCase().includes(q); })
                  .map((m) => (
                    <label key={m.id} className="flex items-center space-x-2 rounded px-2 py-1 hover:bg-muted cursor-pointer">
                      <Checkbox checked={memberIds.includes(m.id)} onCheckedChange={() => toggleMember(m.id)} />
                      <span className="text-sm truncate">{m.name || m.user?.name || m.user?.address}</span>
                    </label>
                  ))}
                {members.filter((m) => { const q = memberSearch.toLowerCase(); return !q || m.name?.toLowerCase().includes(q) || m.user?.name?.toLowerCase().includes(q) || m.user?.address?.toLowerCase().includes(q); }).length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">No members found</p>
                )}
              </div>
              <Button type="button" size="sm" className="mt-2 w-full" onClick={() => setMemberPopoverOpen(false)}>
                Apply
              </Button>
            </PopoverContent>
          </Popover>
        </div>

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
          {tagError && <p className="text-xs text-destructive">{tagError}</p>}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button
          type="submit"
          disabled={loading}
          className="w-full"
        >
          {loading ? "Creating…" : "Create Project"}
        </Button>
      </form>
    </TooltipProvider>
  );
}
