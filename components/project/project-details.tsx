"use client";

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

interface ProjectDetailsProps {
  project: {
    id: string;
    title: string;
    description?: string;
    status: string;
    balance: string | number | bigint;
    deadline: string;
    teamLeader: User;
    members: User[];
    tasks: { id: string; name: string }[];
    tags?: { id: string; label: string; slug: string }[];
  };
}

export function ProjectDetails({ project }: ProjectDetailsProps) {
  const name = project.teamLeader.name ?? project.teamLeader.address ?? "—";
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{project.title}</CardTitle>
        {project.description && (
          <CardDescription>{project.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Project Manager */}
        <div className="flex items-center space-x-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={undefined} alt={name} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm text-muted-foreground">Project Manager</p>
            <p className="font-medium">{name}</p>
          </div>
        </div>

        {/* Members Count */}
        <div>
          <p className="text-sm text-muted-foreground">Members</p>
          <p className="font-medium">{project.members.length}</p>
        </div>

        {/* Tasks Count */}
        <div>
          <p className="text-sm text-muted-foreground">Tasks</p>
          <p className="font-medium">{project.tasks.length}</p>
        </div>

        {/* Budget */}
        <div>
          <p className="text-sm text-muted-foreground">Budget</p>
          <p className="font-medium">
            {project.balance.toString()} TOKEN
          </p>
        </div>

        {/* Deadline */}
        <div>
          <p className="text-sm text-muted-foreground">Deadline</p>
          <p className="font-medium">
            {new Date(project.deadline).toLocaleDateString()}
          </p>
        </div>

        {/* Status */}
        <div>
          <p className="text-sm text-muted-foreground">Status</p>
          <p className="font-medium capitalize">
            {project.status.replace("_", " ")}
          </p>
        </div>

        {project.tags?.length ? (
          <div className="md:col-span-3">
            <p className="text-sm text-muted-foreground">Tags</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <Badge key={tag.id} variant="secondary">
                  {tag.label}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
