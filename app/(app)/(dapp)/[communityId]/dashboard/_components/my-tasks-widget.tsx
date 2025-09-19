"use client";

import { formatDistanceToNowStrict } from "date-fns";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MemberLike { user?: { address?: string | null } | null }
interface TaskItem {
  id: string;
  name: string;
  status: string;
  deadline: string;
  members?: MemberLike[];
}

export default function MyTasksWidget({ tasks, myAddress }: { tasks: TaskItem[]; myAddress?: string | null }) {
  const addr = (myAddress || "").toLowerCase();
  const assigned = tasks.filter((t) =>
    Array.isArray(t.members) && t.members.some((m) => m?.user?.address?.toLowerCase() === addr)
  );
  const open = assigned.filter((t) => (t.status || "").toLowerCase() !== "completed");
  const soonest = open.sort((a, b) => Date.parse(a.deadline) - Date.parse(b.deadline));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">My Upcoming Tasks</CardTitle>
        <CardDescription>Next 5 deadlines</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {addr && soonest.length > 0 ? (
          soonest.slice(0, 5).map((t) => (
            <div key={t.id} className="flex items-center justify-between">
              <div className="truncate text-sm">{t.name}</div>
              <Badge variant="secondary" className="ml-2 shrink-0">
                {formatDistanceToNowStrict(new Date(t.deadline))}
              </Badge>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No upcoming tasks assigned.</p>
        )}
      </CardContent>
    </Card>
  );
}

