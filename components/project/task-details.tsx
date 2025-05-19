"use client";

import { formatEther } from "viem";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface User {
  id: string;
  name: string | null;
  address: string;
  email: string | null;
}

interface TaskDetailsProps {
  task: {
    id: string;
    name: string;
    description?: string;
    status: string;
    priority: string;
    balance: string | number | bigint;
    deadline: string;
    creator: User;
    members: User[];
  };
}

export function TaskDetails({ task }: TaskDetailsProps) {
  const creatorName = task.creator.name ?? task.creator.address;
  const creatorInitials = creatorName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{task.name}</CardTitle>
        {task.description && (
          <CardDescription>{task.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4">
        {/* Status & Priority */}
        <div className="flex space-x-4">
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <Badge
              variant={
                task.status === "completed"
                  ? "success"
                  : task.status === "under_review"
                  ? "outline"
                  : task.status === "in_progress"
                  ? "secondary"
                  : "destructive"
              }
            >
              {task.status.replace("_", " ")}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Priority</p>
            <Badge
              variant={
                task.priority === "high"
                  ? "destructive"
                  : task.priority === "medium"
                  ? "warning"
                  : "default"
              }
            >
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </Badge>
          </div>
        </div>

        {/* Balance & Deadline */}
        <div className="flex space-x-4">
          <div>
            <p className="text-xs text-muted-foreground">Budget</p>
            <p className="font-medium">
              {formatEther(task.balance.toString())} TOKEN
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Deadline</p>
            <p className="font-medium">
              {new Date(task.deadline).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Creator */}
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={undefined} alt={creatorName} />
            <AvatarFallback>{creatorInitials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-xs text-muted-foreground">Created by</p>
            <p className="font-medium">{creatorName}</p>
          </div>
        </div>

        {/* Assigned Members */}
        <div>
          <p className="text-xs text-muted-foreground">Assigned to</p>
          <div className="flex -space-x-2">
            {task.members.map((m) => {
              const name = m.name ?? m.address;
              const initials = name
                .split(" ")
                .map((w) => w[0])
                .join("")
                .toUpperCase();
              return (
                <Avatar
                  key={m.id}
                  className="h-8 w-8 border-2 border-background"
                >
                  <AvatarImage src={undefined} alt={name} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
