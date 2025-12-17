"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAccount } from "wagmi";
import { ProjectDetails } from "@/components/project/project-details";
import { TasksTable }    from "@/components/project/tasks-table";
import { TaskDetails }   from "@/components/project/task-details";
import { Button }        from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import TaskForm         from "@/components/project/task-form";

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

interface Tag {
  id: string;
  label: string;
  slug: string;
}

interface Task {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  priority: string;
  balance: string | number | bigint;
  deadline: string;
  creator: User;
  members: User[];
}

interface Project {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  balance: string | number | bigint;
  deadline: string;
  teamLeader: MemberProfile | null;
  members: MemberProfile[];
  tasks: Task[];
  tags?: Tag[];
}

export default function ProjectPage() {
  const { communityId, projectId } = useParams<{
    communityId: string;
    projectId: string;
  }>();
  const { address } = useAccount();

  const [project, setProject]       = useState<Project | null>(null);
  const [selectedTask, setSelected] = useState<Task | null>(null);
  const [role, setRole]             = useState<string | null>(null);
  const [error, setError]           = useState<string | null>(null);
  const [open, setOpen]             = useState(false);

  const refresh = () => {
    if (!communityId || !projectId) return;
    fetch(`/api/community/${communityId}/projects/${projectId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load project");
        return r.json();
      })
      .then((data: Project) => {
        setProject(data);
        setSelected((prev) => {
          if (!prev) return data.tasks[0] ?? null;
          return data.tasks.find((t) => t.id === prev.id) ?? data.tasks[0] ?? null;
        });
      })
      .catch((err) => setError(err.message));
  };

  // load project
  useEffect(refresh, [communityId, projectId]);

  // load my role
  useEffect(() => {
    if (!communityId || !address) return;
    fetch(`/api/community/${communityId}/members`)
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.members)
          ? data.members
          : [];
        const me = list.find(
          (m: any) =>
            m.user.address.toLowerCase() === address.toLowerCase()
        );
        if (me) setRole(me.role);
      });
  }, [communityId, address]);

  if (error) return <p className="text-destructive p-4">{error}</p>;
  if (!project) return <p className="p-4">Loading...</p>;

  // only Owner, Supervisor, or teamLeader can create tasks
  const teamLeaderAddress = project.teamLeader?.user?.address?.toLowerCase();
  const canCreateTask =
    role === "Owner" ||
    role === "Supervisor" ||
    (teamLeaderAddress && teamLeaderAddress === address?.toLowerCase());

  return (
    <div className="py-8 space-y-8">
      <ProjectDetails project={project} />

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Tasks</h2>
        {canCreateTask && (
          <Button onClick={() => setOpen(true)}>Create Task</Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TasksTable tasks={project.tasks} onSelect={setSelected} />
        {selectedTask && <TaskDetails task={selectedTask} refresh={refresh} />}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
          </DialogHeader>
          <TaskForm
            communityId={communityId}
            projectId={projectId}
            creatorAddress={address ?? ""}
            onSuccess={() => {
              setOpen(false);
              refresh();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
