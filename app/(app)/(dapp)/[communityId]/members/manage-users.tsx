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

interface Member {
  id: string;
  role: string;
  balance: string;
  allocated: string;
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
    fetch(`/api/community/${communityId}/members`)
      .then((r) => r.json())
      .then((data: Member[]) => {
        setMembers(data);
        const me = data.find(
          (m) => m.user.address.toLowerCase() === address?.toLowerCase()
        );
        setMyRole(me?.role ?? null);
      });

  useEffect(() => {
    if (communityId) fetchMembers();
  }, [communityId]);

  const isAdmin = myRole === "Owner"; // Only Owners may change roles

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
                  <TableCell>{m.user.name ?? "—"}</TableCell>
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
                  <TableCell className="text-right">
                    {m.balance} TOKEN
                  </TableCell>
                  <TableCell className="text-right">
                    {m.allocated} TOKEN
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
