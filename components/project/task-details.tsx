// File: components/project/task-details.tsx
"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useParams, useRouter } from "next/navigation";
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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical, Pencil, Share2 } from "lucide-react";

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
  refresh: () => void;
}

export function TaskDetails({ task, refresh }: TaskDetailsProps) {
  const { communityId, projectId } = useParams<{
    communityId: string;
    projectId: string;
  }>();
  const { address: currentAddress } = useAccount();
  const router = useRouter();


  const [role, setRole] = useState<string | null>(null);
  const [meId, setMeId] = useState<string | null>(null);
  const [projCreatorId, setProjCreatorId] = useState<string | null>(null);
  const [projTeamLeaderId, setProjTeamLeaderId] = useState<string | null>(null);

  // fetch my member record + role
  useEffect(() => {
    if (!communityId || !currentAddress) return;
    fetch(`/api/community/${communityId}/members`)
      .then((r) => r.json())
      .then((data: any) => {
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.members)
          ? data.members
          : [];
        const me = list.find(
          (m) =>
            m.user.address.toLowerCase() ===
            currentAddress.toLowerCase()
        );
        if (me) {
          setRole(me.role);
          setMeId(me.id);
        }
      })
      .catch(console.error);
  }, [communityId, currentAddress]);

  // fetch project metadata (creatorId & teamLeaderId)
  useEffect(() => {
    if (!communityId || !projectId) return;
    fetch(`/api/community/${communityId}/projects/${projectId}`)
      .then((r) => r.json())
      .then((p: any) => {
        setProjCreatorId(p.creatorId);
        setProjTeamLeaderId(p.teamLeaderId);
      })
      .catch(console.error);
  }, [communityId, projectId]);

  // determine if we show the menu
  const canEdit =
    role === "Owner" ||
    role === "Supervisor" ||
    meId === projCreatorId ||
    meId === projTeamLeaderId;

  // share helper
  const [copied, setCopied] = useState(false);
  const share = async () => {
    const href = `/${communityId}/projects/${projectId}?task=${task.id}`;
    const url = window.location.origin + href;
    try {
      if (navigator.share) {
        await navigator.share({ title: task.name, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }
    } catch {}
  };

  const creatorName = task.creator.name ?? task.creator.address;
  const creatorInitials = creatorName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const isAssigned = task.members.some(
    (m) => m.address.toLowerCase() === currentAddress?.toLowerCase()
  );

  const canApprove =
    task.status === "under_review" &&
    (role === "Supervisor" || role === "Owner" || meId === projTeamLeaderId);

  const startTask = async () => {
    const res = await fetch(
      `/api/community/${communityId}/projects/${projectId}/tasks/${task.id}/start`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: currentAddress }),
      }
    );
    if (res.ok) {
      refresh();
    }
  };

  const finishTask = async () => {
    const res = await fetch(
      `/api/community/${communityId}/projects/${projectId}/tasks/${task.id}/finish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: currentAddress }),
      }
    );
    if (res.ok) {
      refresh();
    }
  };

  const approveTask = async () => {
    const res = await fetch(
      `/api/community/${communityId}/projects/${projectId}/tasks/${task.id}/approve`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: currentAddress }),
      }
    );
    if (res.ok) {
      refresh();
    }
  };

  return (
    <Card className="relative">
      {/* 3-dots menu */}
      {canEdit && (
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
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={share}>
              <Share2 className="mr-2 h-4 w-4" />
              {copied ? "Copied!" : "Share"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
                onClick={() =>
                  router.push(
                    `/${communityId}/projects/${projectId}/tasks/${task.id}/edit`
                  )
                }
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

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
              {task.priority.charAt(0).toUpperCase() +
                task.priority.slice(1)}
            </Badge>
          </div>
        </div>

        {/* Budget & Deadline */}
        <div className="flex space-x-4">
          <div>
            <p className="text-xs text-muted-foreground">Budget</p>
            <p className="font-medium">
              {task.balance.toString()} TOKEN
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
            <p className="text-xs text-muted-foreground">
              Created by
            </p>
            <p className="font-medium">{creatorName}</p>
          </div>
        </div>

        {/* Assigned Members */}
        <div>
          <p className="text-xs text-muted-foreground">
            Assigned to
          </p>
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

        {/* Action Button */}
        {isAssigned && task.status === "not_started" && (
          <Button onClick={startTask}>Start Task</Button>
        )}
        {isAssigned && task.status === "in_progress" && (
          <Button onClick={finishTask}>Finish Task</Button>
        )}
        {canApprove && (
          <Button onClick={approveTask}>Approve</Button>
        )}
      </CardContent>
    </Card>
  );
}
