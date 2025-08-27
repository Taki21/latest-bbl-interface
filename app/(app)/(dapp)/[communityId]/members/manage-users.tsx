"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAccount } from "wagmi";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Pencil, Trash2 } from "lucide-react";

interface Member {
  id: string;
  role: string;
  balance: string;
  allocation: string;
  name: string | null;
  user: { id: string; name: string | null; address: string; email: string | null };
}

// Enum strings exactly as Prisma expects
const roles = ["Owner", "Professor", "Team_Leader", "Default"] as const;

// Convert enum → nice label
const pretty = (r: string) =>
  r
    .toLowerCase()
    .replace("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

export default function MembersPage() {
  const { communityId } = useParams<{ communityId: string }>();
  const { address }    = useAccount();

  const [members, setMembers]   = useState<Member[]>([]);
  const [myRole, setMyRole]     = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchMembers = () =>
    fetch(`/api/community/${communityId}/members`, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load members");
        return r.json();
      })
      .then((data: any) => {
        const list: Member[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.members)
          ? data.members
          : Array.isArray(data?.data)
          ? data.data
          : [];
        setMembers(list);
        const me = list.find(
          (m) => m.user.address.toLowerCase() === address?.toLowerCase()
        );
        setMyRole(me?.role ?? null);
      })
      .catch((err) => {
        console.error(err);
        setMembers([]);
      });

  useEffect(() => {
    if (communityId) fetchMembers();
  }, [communityId, address]);

  const isAdmin = myRole === "Owner" || myRole === "Professor";

  const changeRole = async (memberId: string, newRole: string) => {
    setUpdatingId(memberId);
    try {
      const res = await fetch(
        `/api/community/${communityId}/admin/changeRole`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ memberId, newRole, address }),
        }
      );
      if (!res.ok) throw new Error((await res.json()).error || "Error");
      await fetchMembers();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const editName = async (member: Member) => {
    const name = prompt("New name", member.name ?? "");
    if (!name) return;
    try {
      const res = await fetch(
        `/api/community/${communityId}/members/${member.id}/edit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, address }),
        }
      );
      if (!res.ok) throw new Error((await res.json()).error || "Error");
      await fetchMembers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const removeMember = async (memberId: string) => {
    if (!confirm("Remove member?")) return;
    try {
      const res = await fetch(
        `/api/community/${communityId}/members/${memberId}/delete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address }),
        }
      );
      if (!res.ok) throw new Error((await res.json()).error || "Error");
      await fetchMembers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Community Members</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Wallet</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead className="text-right">Allocated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((m) => {
              const isSelf =
                m.user.address.toLowerCase() === address?.toLowerCase();
              return (
                <TableRow key={m.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span>{m.name ?? "—"}</span>
                      {isAdmin && (
                        <>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => editName(m)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeMember(m.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Remove</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs truncate max-w-[140px]">
                    {m.user.address}
                  </TableCell>
                  <TableCell>{m.user.email ?? "—"}</TableCell>
                  <TableCell>
                    {isAdmin && !isSelf ? (
                      <Select
                        value={m.role}
                        onValueChange={(v) => changeRole(m.id, v)}
                        disabled={updatingId === m.id}
                      >
                        <SelectTrigger className="w-40">
                          {updatingId === m.id ? "Updating…" : pretty(m.role)}
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((r) => (
                            <SelectItem key={r} value={r}>
                              {pretty(r)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="secondary">{pretty(m.role)}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">{m.balance} TOKEN</TableCell>
                  <TableCell className="text-right">
                    {m.allocation} TOKEN
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
