"use client";

import Link from "next/link";
import { formatEther } from "viem";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";

export interface ProjectCardProps {
  communityId: string;
  project: {
    id: string;
    title: string;
    description?: string;
    status: string;
    balance: string | number | bigint;
    deadline: string;
    teamLeader: string;
    members: { id: string }[];
    tasks: { id: string; status: string }[];
  };
}

export function ProjectCard({ communityId, project }: ProjectCardProps) {
  const initials = project.teamLeader
    .split(" ")
    .map((n) => n[0])
    .join("");

  return (
    <Card asChild>
      <Link href={`/${communityId}/projects/${project.id}`}>
        <CardHeader className="space-y-1">
          <CardTitle>{project.title}</CardTitle>
          {project.description && (
            <p className="text-sm text-muted-foreground">
              {project.description}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xs text-muted-foreground">Team Leader</p>
              <p className="text-sm">{project.teamLeader}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Members</p>
              <p className="text-sm">{project.members.length}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tasks</p>
              <p className="text-sm">{project.tasks.length}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Budget</p>
              <p className="text-sm">
                {formatEther(project.balance.toString())} TOKEN
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Deadline</p>
              <p className="text-sm">{new Date(project.deadline).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="text-sm capitalize">{project.status.replace("_", " ")}</p>
            </div>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
