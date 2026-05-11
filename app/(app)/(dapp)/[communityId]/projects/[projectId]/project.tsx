"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useAccount } from "wagmi";
import { LayoutGrid, List, X } from "lucide-react";
import { ProjectDetails } from "@/components/project/project-details";
import { TasksTable }    from "@/components/project/tasks-table";
import { TaskDetails }   from "@/components/project/task-details";
import { KanbanBoard }   from "@/components/project/kanban-board";
import { Button }        from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import TaskForm from "@/components/project/task-form";
import { cn } from "@/lib/utils";

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

type View = "classic" | "kanban";

export default function ProjectPage() {
  const { communityId, projectId } = useParams<{
    communityId: string;
    projectId: string;
  }>();
  const { address } = useAccount();

  const [project, setProject]       = useState<Project | null>(null);
  const [selectedTask, setSelected] = useState<Task | null>(null);
  const [role, setRole]             = useState<string | null>(null);
  const [myMemberId, setMyMemberId] = useState<string | null>(null);
  const [error, setError]           = useState<string | null>(null);
  const [open, setOpen]             = useState(false);
  const [view, setView]             = useState<View>("kanban");
  const panelRef                    = useRef<HTMLDivElement>(null);

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
          if (!prev) return null;
          return data.tasks.find((t) => t.id === prev.id) ?? null;
        });
      })
      .catch((err) => setError(err.message));
  };

  useEffect(refresh, [communityId, projectId]);

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
          (m: any) => m.user.address.toLowerCase() === address.toLowerCase()
        );
        if (me) { setRole(me.role); setMyMemberId(me.id); }
      });
  }, [communityId, address]);

  // Close sliding panel when clicking outside it (kanban mode)
  useEffect(() => {
    if (!selectedTask || view !== "kanban") return;
    let active = false;
    const timer = setTimeout(() => {
      active = true;
    }, 50);
    const handler = (e: MouseEvent) => {
      if (!active) return;
      const target = e.target as Element;
      if (panelRef.current?.contains(target)) return;
      if (target.closest("[data-kanban-card]")) return;
      setSelected(null);
    };
    document.addEventListener("mousedown", handler);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handler);
    };
  }, [selectedTask?.id, view]);

  if (error) return <p className="text-destructive p-4">{error}</p>;
  if (!project) return <p className="p-4">Loading...</p>;

  // Match exactly what the API checks: me.id === project.teamLeaderId
  const canCreateTask =
    role === "Owner" ||
    role === "Supervisor" ||
    (myMemberId !== null && project.teamLeader?.id === myMemberId);

  return (
    <div className="py-4 space-y-4">
      <ProjectDetails project={project} />

      {/* Tasks header with view toggle */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Tasks</h2>
        <div className="flex items-center gap-3">
          {/* Segmented view toggle */}
          <div className="flex items-center rounded-md border bg-muted p-0.5">
            <button
              type="button"
              onClick={() => { setView("kanban"); setSelected(null); }}
              className={cn(
                "flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-sm transition-colors",
                view === "kanban"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
              <span>Board</span>
            </button>
            <button
              type="button"
              onClick={() => setView("classic")}
              className={cn(
                "flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-sm transition-colors",
                view === "classic"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List className="h-4 w-4" />
              <span>List</span>
            </button>
          </div>

          {canCreateTask && (
            <Button onClick={() => setOpen(true)}>Create Task</Button>
          )}
        </div>
      </div>

      {/* Classic list view */}
      {view === "classic" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TasksTable tasks={project.tasks} onSelect={setSelected} selectedTaskId={selectedTask?.id} />
          {selectedTask && <TaskDetails task={selectedTask} refresh={refresh} />}
        </div>
      )}

      {/* Kanban board view */}
      {view === "kanban" && (
        <KanbanBoard
          tasks={project.tasks}
          onSelect={setSelected}
          selectedTaskId={selectedTask?.id}
        />
      )}

      {/* Sliding detail panel — kanban only */}
      <div
        ref={panelRef}
        className={cn(
          "fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[560px] bg-background border-l shadow-2xl transition-transform duration-300 ease-in-out overflow-y-auto",
          view === "kanban" && selectedTask ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="relative min-h-full">
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="absolute right-4 top-4 z-10 rounded-md p-1 opacity-60 hover:opacity-100 hover:bg-muted transition-opacity"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
          {selectedTask && <TaskDetails task={selectedTask} refresh={refresh} />}
        </div>
      </div>

      {/* Create task dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
          </DialogHeader>
          <TaskForm
            communityId={communityId}
            projectId={projectId}
            creatorAddress={address ?? ""}
            projectMembers={project.members}
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
