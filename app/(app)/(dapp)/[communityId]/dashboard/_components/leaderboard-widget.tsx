"use client";

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MemberProfileHover } from "@/components/member/member-profile-hover";

interface MemberItem {
  id: string;
  role: string;
  balance: string | number | bigint;
  allocation?: string | number | bigint;
  name?: string | null;
  user: { name: string | null; address: string };
  memberTags?: { id: string; tag: { id: string; label: string; slug: string } }[];
}

function toNumber(v: string | number | bigint | null | undefined) {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return v;
  if (typeof v === "bigint") return Number(v);
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default function LeaderboardWidget({ members, tokenSymbol }: { members: MemberItem[]; tokenSymbol?: string }) {
  const sym = tokenSymbol || "TOKEN";
  const top = [...members]
    .sort((a, b) => toNumber(b.balance) - toNumber(a.balance))
    .slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Top Earners</CardTitle>
        <CardDescription>By balance ({sym})</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {top.length === 0 ? (
          <p className="text-sm text-muted-foreground">No members.</p>
        ) : (
          top.map((m, idx) => {
            const label = m.name || m.user.name || m.user.address;
            const initials = label
              .split(" ")
              .map((s) => s[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();
            return (
              <div key={m.id} className="flex items-center gap-3">
                <span className="w-5 text-xs text-muted-foreground">{idx + 1}</span>
                <MemberProfileHover member={m}>
                  <Avatar className="h-7 w-7">
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                </MemberProfileHover>
                <div className="flex-1 truncate text-sm">{label}</div>
                <div className="text-sm font-medium">
                  {toNumber(m.balance).toLocaleString()} {sym}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
