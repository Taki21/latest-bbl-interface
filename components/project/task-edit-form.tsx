"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface Member {
  id: string;
  name?: string | null;
  user: { name: string | null; address: string };
}

interface TaskEditFormProps {
  communityId: string;
  projectId: string;
  taskId: string;
  creatorAddress: string;
  onSuccess: () => void;
}

export default function TaskEditForm({
  communityId,
  projectId,
  taskId,
  creatorAddress,
  onSuccess,
}: TaskEditFormProps) {
  const router = useRouter();
  const { address } = useAccount();

  // form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<
    "not_started" | "in_progress" | "under_review" | "completed"
  >("not_started");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [deadline, setDeadline] = useState("");
  const [budget, setBudget] = useState("");
  const [maxBudget, setMaxBudget] = useState<bigint>(0n);

  const [members, setMembers] = useState<Member[]>([]);
  const [memberIds, setMemberIds] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [memberPopoverOpen, setMemberPopoverOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");

  // Load task + projectBalance + community members
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          `/api/community/${communityId}/projects/${projectId}/tasks/${taskId}`
        );
        if (!res.ok) throw new Error("Failed to load task");
        const { task, projectBalance, members: mems } = await res.json();

        // populate form fields
        setName(task.name);
        setDescription(task.description || "");
        setStatus(task.status);
        setPriority(task.priority);
        setDeadline(task.deadline.split("T")[0]);
        const oldBal = BigInt(task.balance);
        setBudget(oldBal.toString());
        setMemberIds(task.members.map((m: any) => m.id));

        // maxBudget = project.balance + old task allocation
        setMaxBudget(oldBal + BigInt(projectBalance));

        // community members list
        setMembers(mems);
        setInitialized(true);
      } catch (err) {
        console.error(err);
        setError("Failed to initialize form");
      }
    }
    load();
  }, [communityId, projectId, taskId]);

  const toggleMember = (id: string) =>
    setMemberIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !deadline) return;

    const alloc = BigInt(budget || "0");
    if (alloc > maxBudget) {
      setError(`Max available is ${maxBudget} TOKEN`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/community/${communityId}/projects/${projectId}/tasks/${taskId}/edit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim(),
            status,
            priority,
            deadline,
            balance: alloc.toString(),
            creatorAddress,
            memberIds,
          }),
        }
      );
      if (!res.ok) {
        const { error: msg } = await res.json();
        throw new Error(msg || "Failed to save");
      }
      onSuccess();
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!initialized) {
    return <p className="p-4">Loading…</p>;
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {/* Name */}
      <div className="space-y-2">
        <label htmlFor="name" className="block text-sm font-medium">
          Name<span className="text-destructive">*</span>
        </label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label htmlFor="desc" className="block text-sm font-medium">
          Description
        </label>
        <Textarea
          id="desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>

      {/* Status & Priority */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium">Status</label>
          <Select value={status} onValueChange={(v) => setStatus(v as any)}>
            <SelectTrigger className="w-full" />
            <SelectContent>
              <SelectItem value="not_started">Not Started</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium">Priority</label>
          <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
            <SelectTrigger className="w-full" />
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Deadline & Budget */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="deadline" className="block text-sm font-medium">
            Deadline<span className="text-destructive">*</span>
          </label>
          <Input
            id="deadline"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="budget" className="block text-sm font-medium">
            Budget<span className="text-destructive">*</span>
          </label>
          <Input
            id="budget"
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

      {/* Members Multi-Select */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Assign Members</label>
        <Popover
          open={memberPopoverOpen}
          onOpenChange={(open) => { setMemberPopoverOpen(open); if (!open) setMemberSearch(""); }}
        >
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
            <div className="flex flex-col space-y-1 max-h-48 overflow-auto">
              {members
                .filter((m) => {
                  const q = memberSearch.toLowerCase();
                  return !q || m.name?.toLowerCase().includes(q) || m.user.name?.toLowerCase().includes(q) || m.user.address?.toLowerCase().includes(q);
                })
                .map((m) => (
                  <label
                    key={m.id}
                    className="flex items-center space-x-2 rounded px-2 py-1 hover:bg-muted cursor-pointer"
                  >
                    <Checkbox
                      checked={memberIds.includes(m.id)}
                      onCheckedChange={() => toggleMember(m.id)}
                    />
                    <span className="text-sm truncate">{m.name || m.user.name || m.user.address}</span>
                  </label>
                ))}
              {members.filter((m) => {
                const q = memberSearch.toLowerCase();
                return !q || m.name?.toLowerCase().includes(q) || m.user.name?.toLowerCase().includes(q) || m.user.address?.toLowerCase().includes(q);
              }).length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">No members found</p>
              )}
            </div>
            <Button
              type="button"
              size="sm"
              className="mt-2 w-full"
              onClick={() => setMemberPopoverOpen(false)}
            >
              Apply
            </Button>
          </PopoverContent>
        </Popover>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Saving…" : "Save Changes"}
      </Button>
    </form>
  );
}
