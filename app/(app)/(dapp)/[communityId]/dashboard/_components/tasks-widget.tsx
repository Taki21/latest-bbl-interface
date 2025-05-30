
"use client";

import { formatDistanceToNowStrict } from "date-fns";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Props {
  tasks: {
    id: string;
    name: string;
    status: string;
    deadline: string;
  }[];
}

export default function TasksWidget({ tasks }: Props) {
  const open = tasks.filter((t) => t.status !== "completed");
  const soonest = open.sort(
    (a, b) => Date.parse(a.deadline) - Date.parse(b.deadline)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Upcoming Tasks</CardTitle>
        <CardDescription>Next 5 deadlines</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {soonest.slice(0, 5).map((t) => (
          <div key={t.id} className="flex items-center justify-between">
            <div className="truncate text-sm">{t.name}</div>
            <Badge variant="secondary" className="ml-2 shrink-0">
              {formatDistanceToNowStrict(new Date(t.deadline))}
            </Badge>
          </div>
        ))}
        {open.length === 0 && (
          <p className="text-sm text-muted-foreground">All tasks completed 🎉</p>
        )}
      </CardContent>
    </Card>
  );
}
