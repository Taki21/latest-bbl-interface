
"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatEther } from "viem";

interface Props {
  projects: {
    id: string;
    title: string;
    status: string;
    balance: string;
    tasks: { status: string }[];
    updatedAt?: string | null;
  }[];
}

export default function ProjectsWidget({ projects }: Props) {
  const latest = [...projects].sort(
    (a, b) => Date.parse(b.updatedAt ?? '') - Date.parse(a.updatedAt ?? '')
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Projects</CardTitle>
        <CardDescription>Last 3 updated</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {latest.slice(0, 3).map((p) => {
          const done = p.tasks.filter((t) => t.status === "completed").length;
          const pct = p.tasks.length ? (done / p.tasks.length) * 100 : 0;
          return (
            <div key={p.id} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>{p.title}</span>
                <span>{p.balance} TOKEN</span>
              </div>
              <Progress value={pct} />
            </div>
          );
        })}
        {projects.length === 0 && (
          <p className="text-sm text-muted-foreground">No projects yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
