// File: components/project/project-form.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter }           from "next/navigation";
import { useAccount }          from "wagmi";
import { Input }               from "@/components/ui/input";
import { Textarea }            from "@/components/ui/textarea";
import { Button }              from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Checkbox }            from "@/components/ui/checkbox";

interface Member {
  id: string;
  role: string;
  allocation: string; // BigInt serialized
  community: { id: string; name: string; joinCode: string | null };
  name?: string | null;
  user?: { name: string | null; address: string };
}

interface ProjectFormProps {
  communityId: string;
  creatorAddress: string;
  onSuccess: () => void;
}

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

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

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
      .then((data: Member[]) => {
        setMembers(data);
        if (data.length) setTeamLeaderId(data[0].id);
      })
      .catch((err) => console.error(err));
  }, [communityId]);

  const toggleMember = (id: string) =>
    setMemberIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  // 3️⃣ Submit handler
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
        <select
          className="w-full rounded border p-2"
          value={teamLeaderId}
          onChange={(e) => setTeamLeaderId(e.target.value)}
          required
        >
          <option value="" disabled>
            Select a leader…
          </option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name || m.user?.name || m.user?.address}
            </option>
          ))}
        </select>
      </div>

      {/* Members Multi-Select */}
      <div>
        <label className="block text-sm font-medium">Members</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full">
              {memberIds.length
                ? `${memberIds.length} selected`
                : "Select members"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="max-h-60 overflow-auto p-2">
            {members.map((m) => (
              <label
                key={m.id}
                className="flex items-center space-x-2 py-1"
              >
                <Checkbox
                  checked={memberIds.includes(m.id)}
                  onCheckedChange={() => toggleMember(m.id)}
                />
                <span>{m.name || m.user?.name || m.user?.address}</span>
                </label>
              ))}
          </PopoverContent>
        </Popover>
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
  );
}
