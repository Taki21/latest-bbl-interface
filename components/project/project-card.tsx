"use client";

import Link from "next/link";
import { useState } from "react";
import { MoreVertical, Pencil, Share2, ListTodo, Trash2 } from "lucide-react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface BaseProject {
  id: string;
  title: string;
  description?: string;
  status: string;
  balance: string | number | bigint;
  deadline: string;
  teamLeader: string;
  creatorAddress?: string;
  creator?: { address: string };
  members: { id: string }[];
  tasks: { id: string; status: string }[];
  tags?: { id: string; label: string; slug: string }[];
}

export interface ProjectCardProps {
  communityId: string;
  project: BaseProject;
  currentAddress?: string | null;
  isAdmin: boolean;
  onDelete?: () => void;
}

export function ProjectCard({
  communityId,
  project,
  currentAddress,
  isAdmin,
  onDelete,
}: ProjectCardProps) {
  const [copied, setCopied] = useState(false);

  const creatorAddr =
    project.creatorAddress ?? project.creator?.address ?? "";
  const meIsCreator =
    currentAddress &&
    creatorAddr &&
    currentAddress.toLowerCase() === creatorAddr.toLowerCase();

  const canEdit = isAdmin || meIsCreator;
  const canDelete = canEdit;
  const href = `/${communityId}/projects/${project.id}`;
  const editHref = `/${communityId}/projects/${project.id}/edit`;

  const share = async () => {
    const url = window.location.origin + href;
    try {
      if (navigator.share) await navigator.share({ title: project.title, url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }
    } catch {}
  };

  const initials = project.teamLeader
    .split(" ")
    .map((n) => n[0])
    .join("");

  return (
    <Card className="relative hover:shadow-lg transition">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 opacity-70 hover:opacity-100"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {canEdit && (
            <DropdownMenuItem asChild>
              <Link href={editHref} className="flex items-center">
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem asChild>
            <Link href={href} className="flex items-center">
              <ListTodo className="mr-2 h-4 w-4" />
              View Tasks
            </Link>
          </DropdownMenuItem>
          {canDelete && (
            <DropdownMenuItem
              onClick={async () => {
                if (!currentAddress) return;
                if (!confirm("Delete project?")) return;
                try {
                  const res = await fetch(
                    `/api/community/${communityId}/projects/${project.id}/delete`,
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ address: currentAddress }),
                    }
                  );
                  if (res.ok) onDelete?.();
                } catch (e) {
                  console.error(e);
                }
              }}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={share}>
            <Share2 className="mr-2 h-4 w-4" />
            {copied ? "Copied!" : "Share"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Link href={href} className="block">
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

          {project.tags?.length ? (
            <div className="flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <Badge key={tag.id} variant="secondary">
                  {tag.label}
                </Badge>
              ))}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-4">
            <Stat label="Members" value={project.members.length} />
            <Stat label="Tasks" value={project.tasks.length} />
            <Stat
              label="Budget"
              value={`${project.balance.toString()} TOKEN`}
            />
            <Stat
              label="Deadline"
              value={new Date(project.deadline).toLocaleDateString()}
            />
            <Stat
              label="Status"
              value={project.status.replace("_", " ")}
              className="capitalize"
            />
          </div>
        </CardContent>
      </Link>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href={href}>View Tasks</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

function Stat({
  label,
  value,
  className = "",
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  );
}
