"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const COLUMNS = [
  { key: "not_started",  label: "Not Started",  dot: "bg-slate-400" },
  { key: "in_progress",  label: "In Progress",  dot: "bg-blue-500"  },
  { key: "under_review", label: "Under Review", dot: "bg-amber-500" },
  { key: "completed",    label: "Completed",    dot: "bg-green-500" },
] as const;

const priorityVariant: Record<string, "default" | "warning" | "destructive"> = {
  low: "default",
  medium: "warning",
  high: "destructive",
};

interface User {
  id: string;
  name: string | null;
  address: string;
  email: string | null;
}

interface Task {
  id: string;
  name: string;
  status: string;
  priority: string;
  balance: string | number | bigint;
  deadline: string;
  creator: User;
  members: User[];
}

interface KanbanBoardProps {
  tasks: Task[];
  onSelect: (task: Task) => void;
  selectedTaskId?: string | null;
}

export function KanbanBoard({ tasks, onSelect, selectedTaskId }: KanbanBoardProps) {
  return (
    <div className="grid grid-cols-4 gap-3 min-h-[300px] overflow-x-auto">
      {COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.key);
        return (
          <div key={col.key} className="flex flex-col gap-2 min-w-[180px]">
            <div className="flex items-center gap-2 pb-2 border-b">
              <span className={cn("h-2 w-2 rounded-full shrink-0", col.dot)} />
              <span className="text-sm font-semibold truncate">{col.label}</span>
              <span className="ml-auto text-xs text-muted-foreground tabular-nums">{colTasks.length}</span>
            </div>

            <div className="flex flex-col gap-2">
              {colTasks.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  data-kanban-card="true"
                  onClick={() => onSelect(task)}
                  className={cn(
                    "w-full text-left rounded-lg border bg-card p-3 shadow-sm hover:shadow-md transition-all space-y-2",
                    selectedTaskId === task.id
                      ? "ring-2 ring-primary border-primary/30"
                      : "hover:border-muted-foreground/30"
                  )}
                >
                  <p className="text-sm font-medium leading-snug">{task.name}</p>

                  <div className="flex items-center justify-between gap-1">
                    <Badge variant={priorityVariant[task.priority] ?? "default"} className="text-xs h-5 px-1.5">
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(task.deadline).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </span>
                  </div>

                  {task.members.length > 0 && (
                    <div className="flex -space-x-1.5">
                      {task.members.slice(0, 4).map((m) => (
                        <div
                          key={m.id}
                          title={m.name || m.address}
                          className="h-5 w-5 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[9px] font-semibold uppercase"
                        >
                          {(m.name || m.address).charAt(0)}
                        </div>
                      ))}
                      {task.members.length > 4 && (
                        <div className="h-5 w-5 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[9px]">
                          +{task.members.length - 4}
                        </div>
                      )}
                    </div>
                  )}
                </button>
              ))}

              {colTasks.length === 0 && (
                <div className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
                  No tasks
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
