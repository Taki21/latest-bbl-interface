"use client";

import { formatEther } from "viem";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

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
}

/**
 * Displays a clickable table of tasks.
 * Columns: Name, Status, Priority, Deadline, Budget.
 * Calls onSelect when you click a row.
 */
export function TasksTable({ tasks, onSelect }: TasksTableProps) {
  const statusVariant = {
    not_started: "destructive",
    in_progress: "secondary",
    under_review: "warning",
    completed: "success",
  } as const;

  const priorityVariant = {
    low: "default",
    medium: "warning",
    high: "destructive",
  } as const;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Deadline</TableHead>
          <TableHead className="text-right">Budget</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((task) => (
          <TableRow
            key={task.id}
            onClick={() => onSelect(task)}
            className="cursor-pointer hover:bg-muted"
          >
            <TableCell>{task.name}</TableCell>
            <TableCell>
              <Badge variant={statusVariant[task.status]}>
                {task.status.replace("_", " ")}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant={priorityVariant[task.priority]}>
                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
              </Badge>
            </TableCell>
            <TableCell>
              {new Date(task.deadline).toLocaleDateString()}
            </TableCell>
            <TableCell className="text-right">
              {task.balance.toString()} TOKEN
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
