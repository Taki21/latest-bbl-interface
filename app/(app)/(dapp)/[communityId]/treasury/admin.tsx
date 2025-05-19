"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface Member {
  id: string;
  role: string;
  user: { name: string | null; address: string };
}

export default function TreasuryPage() {
  const { communityId } = useParams<{ communityId: string }>();
  const { address }     = useAccount();

  const [balance, setBalance]       = useState<bigint>(0n);
  const [members, setMembers]       = useState<Member[]>([]);
  const [mintAmt, setMintAmt]       = useState("");
  const [allocAmt, setAllocAmt]     = useState("");
  const [recipient, setRecipient]   = useState("");

  const fetchBalance = () =>
    fetch(`/api/community/${communityId}`)
      .then((r) => r.json())
      .then((c) => setBalance(BigInt(c.balance)));

  const fetchMembers = () =>
    fetch(`/api/community/${communityId}/members`)
      .then((r) => r.json())
      .then((m: Member[]) =>
        setMembers(m.filter((x) => x.role === "Professor" || x.role === "TeamLeader"))
      );

  useEffect(() => {
    if (communityId) {
      fetchBalance();
      fetchMembers();
    }
  }, [communityId]);

  const mint = async () => {
    if (!mintAmt) return;
    const res = await fetch(`/api/community/${communityId}/admin/mint`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: Number(mintAmt), address }),
    });
    if (res.ok) {
      setMintAmt("");
      fetchBalance();
    } else alert((await res.json()).error);
  };

  const allocate = async () => {
    if (!allocAmt || !recipient) return;
    const res = await fetch(
      `/api/community/${communityId}/admin/allocate`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId: recipient,
          amount: Number(allocAmt),
          address,
        }),
      }
    );
    if (res.ok) {
      setAllocAmt("");
      setRecipient("");
      fetchBalance();
    } else alert((await res.json()).error);
  };

  return (
    <div className="container py-8 space-y-8">
      {/* Balance Display */}
      <Card>
        <CardHeader>
          <CardTitle>Community Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{balance.toString()} TOKEN</p>
        </CardContent>
      </Card>

      {/* Mint Tokens */}
      <Card>
        <CardHeader>
          <CardTitle>Mint Tokens</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="number"
            min={0}
            placeholder="Amount"
            value={mintAmt}
            onChange={(e) => setMintAmt(e.target.value)}
          />
          <Button onClick={mint}>Mint</Button>
        </CardContent>
      </Card>

      {/* Allocate Tokens */}
      <Card>
        <CardHeader>
          <CardTitle>Allocate Tokens</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={recipient} onValueChange={setRecipient}>
            <SelectTrigger className="w-full">
              {recipient
                ? members.find((m) => m.id === recipient)?.user.name ??
                  members.find((m) => m.id === recipient)?.user.address
                : "Select Professor / Team Leader"}
            </SelectTrigger>
            <SelectContent>
              {members.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.user.name || m.user.address}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="number"
            min={0}
            placeholder="Amount"
            value={allocAmt}
            onChange={(e) => setAllocAmt(e.target.value)}
          />
          <Button onClick={allocate}>Allocate</Button>
        </CardContent>
      </Card>
    </div>
  );
}
