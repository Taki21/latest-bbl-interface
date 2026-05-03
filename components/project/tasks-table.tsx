"use client";

import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  name: string | null;
  address: string;
  email: string | null;
}

interface Task {
  id: string;
  name: string;
  status: "not_started" | "in_progress" | "under_review" | "completed";
  priority: "low" | "medium" | "high";
  balance: string | number | bigint;
  deadline: string;
  creator: User;
  members: User[];
}

interface TasksTableProps {
  tasks: Task[];
  onSelect: (task: Task) => void;
  selectedTaskId?: string | null;
}

function statusStyle(status: string) {
  switch (status) {
    case "completed":    return "border-green-500/60 bg-green-500/10 text-green-600 dark:text-green-400";
    case "in_progress":  return "border-blue-500/60 bg-blue-500/10 text-blue-600 dark:text-blue-400";
    case "under_review": return "border-amber-500/60 bg-amber-500/10 text-amber-600 dark:text-amber-400";
    default:             return "border-muted text-muted-foreground";
  }
}

function priorityStyle(priority: string) {
  switch (priority) {
    case "high":   return "border-red-500/60 bg-red-500/10 text-red-600 dark:text-red-400";
    case "medium": return "border-amber-500/60 bg-amber-500/10 text-amber-600 dark:text-amber-400";
    default:       return "border-muted text-muted-foreground";
  }
}

function formatDeadline(deadline: string) {
  if (!deadline) return "—";
  const d = new Date(deadline);
  if (isNaN(d.getTime())) return deadline;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function TasksTable({ tasks, onSelect, selectedTaskId }: TasksTableProps) {
  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Task</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Assigned</TableHead>
            <TableHead>Deadline</TableHead>
            <TableHead className="text-right">Budget</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                No tasks yet.
              </TableCell>
            </TableRow>
          ) : (
            tasks.map((task) => {
              const initials = task.name
                .split(" ")
                .filter(Boolean)
                .map((w) => w[0].toUpperCase())
                .join("")
                .slice(0, 2);

              return (
                <TableRow
                  key={task.id}
                  onClick={() => onSelect(task)}
                  className={cn(
                    "group cursor-pointer",
                    selectedTaskId === task.id && "bg-muted/50"
                  )}
                >
                  {/* Task name */}
                  <TableCell className="py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium leading-none group-hover:text-primary">
                        {task.name}
                      </span>
                    </div>
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <Badge variant="outline" className={cn("capitalize", statusStyle(task.status))}>
                      {task.status.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>

                  {/* Priority */}
                  <TableCell>
                    <Badge variant="outline" className={cn("capitalize", priorityStyle(task.priority))}>
                      {task.priority}
                    </Badge>
                  </TableCell>

                  {/* Assigned members */}
                  <TableCell>
                    {task.members.length > 0 ? (
                      <div className="flex -space-x-1.5">
                        {task.members.slice(0, 4).map((m) => (
                          <Avatar key={m.id} className="h-6 w-6 border-2 border-background">
                            <AvatarFallback className="text-[10px]">
                              {(m.name || m.address).charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {task.members.length > 4 && (
                          <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] text-muted-foreground">
                            +{task.members.length - 4}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  {/* Deadline */}
                  <TableCell className="whitespace-nowrap text-sm">
                    {formatDeadline(task.deadline)}
                  </TableCell>

                  {/* Budget */}
                  <TableCell className="text-right font-mono text-xs whitespace-nowrap">
                    {task.balance.toString()} BBL
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
