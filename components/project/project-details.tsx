"use client";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MemberProfileHover } from "@/components/member/member-profile-hover";

interface User {
  id: string;
  name: string | null;
  address: string;
  email: string | null;
}

interface MemberTagLink {
  id: string;
  tag: { id: string; label: string; slug: string };
}

interface MemberProfile {
  id: string;
  name?: string | null;
  role?: string | null;
  user: User;
  memberTags?: MemberTagLink[];
}

interface ProjectDetailsProps {
  project: {
    id: string;
    title: string;
    description?: string;
    status: string;
    balance: string | number | bigint;
    deadline: string;
    teamLeader: MemberProfile | null;
    members: MemberProfile[];
    tasks: { id: string; name: string }[];
    tags?: { id: string; label: string; slug: string }[];
  };
}

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active:    "default",
  completed: "secondary",
  on_hold:   "outline",
};

export function ProjectDetails({ project }: ProjectDetailsProps) {
  const leader = project.teamLeader;
  const name = leader?.name ?? leader?.user?.name ?? leader?.user?.address ?? "—";
  const initials = name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="space-y-2 pb-4 border-b">
      {/* Title row */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-lg font-bold leading-tight truncate">{project.title}</h1>
          {project.description && (
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{project.description}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          <Badge variant={statusVariant[project.status] ?? "default"} className="capitalize">
            {project.status.replace("_", " ")}
          </Badge>
          {project.tags?.map((tag) => (
            <Badge key={tag.id} variant="secondary">{tag.label}</Badge>
          ))}
        </div>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted-foreground">
        <MemberProfileHover member={leader}>
          <span className="flex items-center gap-1.5 cursor-default">
            <Avatar className="h-5 w-5">
              <AvatarImage src={undefined} alt={name} />
              <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
            </Avatar>
            <span className="text-foreground font-medium">{name}</span>
          </span>
        </MemberProfileHover>
        <span>{project.members.length} members</span>
        <span>{project.tasks.length} tasks</span>
        <span>Due {new Date(project.deadline).toLocaleDateString()}</span>
        <span>{project.balance.toString()} TOKEN</span>
      </div>
    </div>
  );
}
