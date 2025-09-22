"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNowStrict } from "date-fns";
import { CheckCircle2, ListTodo, FolderGit2 } from "lucide-react";

interface TaskItem {
  id: string;
  name: string;
  status: string;
  updatedAt?: string | null;
  createdAt?: string | null;
}

interface ProjectItem {
  id: string;
  title: string;
  updatedAt?: string | null;
}

interface Props {
  tasks: TaskItem[];
  projects: ProjectItem[];
}

function toDate(s?: string | null) {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export default function ActivityFeed({ tasks, projects }: Props) {
  const taskEvents = tasks.map((t) => ({
    id: `t-${t.id}`,
    type: "task" as const,
    title: t.name,
    status: t.status,
    at: toDate(t.updatedAt) || toDate(t.createdAt) || new Date(0),
  }));
  const projectEvents = projects.map((p) => ({
    id: `p-${p.id}`,
    type: "project" as const,
    title: p.title,
    at: toDate(p.updatedAt) || new Date(0),
  }));
  const items = [...taskEvents, ...projectEvents]
    .filter((e) => e.at)
    .sort((a, b) => +b.at! - +a.at!)
    .slice(0, 6);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent activity.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2 truncate">
                {item.type === "project" ? (
                  <FolderGit2 className="h-4 w-4 text-primary" />
                ) : (
                  <ListTodo className="h-4 w-4 text-primary" />
                )}
                <span className="truncate text-sm">{item.title}</span>
              </div>
              {"status" in item && item.status ? (
                <Badge variant="secondary" className="ml-2 shrink-0">
                  {item.status.replace(/_/g, " ")}
                </Badge>
              ) : (
                <span className="text-xs text-muted-foreground ml-2 shrink-0">
                  {formatDistanceToNowStrict(item.at!)}
                </span>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

