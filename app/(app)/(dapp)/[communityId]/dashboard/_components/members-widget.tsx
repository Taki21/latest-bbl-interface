
"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MemberProfileHover } from "@/components/member/member-profile-hover";

interface Props {
  members: {
    id: string;
    role: string;
    name?: string | null;
    user: { name: string | null; address: string };
    memberTags?: { id: string; tag: { id: string; label: string; slug: string } }[];
  }[];
}

export default function MembersWidget({ members }: Props) {
  const sorted = [...members].sort((a, b) => a.role.localeCompare(b.role));
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Team Members</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sorted.slice(0, 6).map((m) => {
          const initials = (m.name || m.user.name || m.user.address)
            .split(" ")
            .map((s) => s[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();
          return (
            <div key={m.id} className="flex items-center gap-3">
              <MemberProfileHover member={m}>
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </MemberProfileHover>
              <div className="flex-1">
                <p className="truncate text-sm font-medium">
                  {m.name || m.user.name || m.user.address}
                </p>
                <p className="text-xs text-muted-foreground">{m.role}</p>
              </div>
            </div>
          );
        })}
        {members.length > 6 && (
          <p className="text-xs text-muted-foreground">
            + {members.length - 6} more …
          </p>
        )}
      </CardContent>
    </Card>
  );
}
