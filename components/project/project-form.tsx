"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

interface CommunityMember {
  id: string;
  role: string;
  balance: string; // serialized BigInt
  user: { name: string | null; address: string };
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
  const router = useRouter();
  const { address } = useAccount();

  // form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [budget, setBudget] = useState("");
  const [maxBudget, setMaxBudget] = useState<bigint>(0n);
  const [status, setStatus] = useState<"active" | "completed" | "on_hold">("active");
  const [teamLeaderId, setTeamLeaderId] = useState("");
  const [memberIds, setMemberIds] = useState<string[]>([]);

  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load community members & find my maxBudget
  useEffect(() => {
    fetch(`/api/community/${communityId}/members`)
      .then((r) => r.json())
      .then((data: CommunityMember[]) => {
        setMembers(data);
        const me = data.find((m) => m.user.address.toLowerCase() === creatorAddress.toLowerCase());
        if (me) {
          setMaxBudget(BigInt(me.balance));
          setBudget(""); // reset when loaded
        }
        if (data.length) setTeamLeaderId(data[0].id);
      })
      .catch(console.error);
  }, [communityId, creatorAddress]);

  const toggleMember = (id: string) =>
    setMemberIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !deadline || !teamLeaderId) return;
    // ensure budget within range
    const alloc = BigInt(budget || "0");
    if (alloc > maxBudget) {
      setError(`Max available is ${maxBudget} TOKEN`);
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
            title: title.trim(),
            description: description.trim(),
            deadline,
            balance: alloc.toString(),
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
    <form onSubmit={submit} className="space-y-5">
      {/* Title */}
      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium">
          Title<span className="text-destructive">*</span>
        </label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label htmlFor="desc" className="text-sm font-medium">
          Description
        </label>
        <Textarea
          id="desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>

      {/* Deadline & Budget */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="deadline" className="text-sm font-medium">
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
          <label htmlFor="budget" className="text-sm font-medium">
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

      {/* Status */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Status</label>
        <select
          className="w-full rounded border p-2"
          value={status}
          onChange={(e) =>
            setStatus(e.target.value as "active" | "completed" | "on_hold")
          }
        >
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="on_hold">On Hold</option>
        </select>
      </div>

      {/* Team Leader */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Team Leader</label>
        <select
          className="w-full rounded border p-2"
          value={teamLeaderId}
          onChange={(e) => setTeamLeaderId(e.target.value)}
        >
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.user.name || m.user.address}
            </option>
          ))}
        </select>
      </div>

      {/* Members Multi-Select */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Members</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              {memberIds.length
                ? `${memberIds.length} selected`
                : "Select members"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="max-h-60 overflow-auto p-2">
            <div className="flex flex-col space-y-1">
              {members.map((m) => (
                <label
                  key={m.id}
                  className="flex items-center space-x-2 rounded px-2 py-1 hover:bg-muted"
                >
                  <Checkbox
                    checked={memberIds.includes(m.id)}
                    onCheckedChange={() => toggleMember(m.id)}
                  />
                  <span>{m.user.name || m.user.address}</span>
                </label>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Creating…" : "Create Project"}
      </Button>
    </form>
  );
}
