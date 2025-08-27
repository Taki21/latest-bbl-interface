"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "@/components/project/project-card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ProjectForm from "@/components/project/project-form";
import type { Project as PrismaProject } from "@prisma/client";

interface Project extends PrismaProject {
  creatorAddress: string;           // make sure your API returns this
  members: { id: string }[];
  tasks: { id: string; status: string }[];
}

export default function ProjectsPage() {
  const { communityId } = useParams<{ communityId: string }>();
  const { address }     = useAccount();

  const [projects, setProjects] = useState<Project[]>([]);
  const [role, setRole]         = useState<string | null>(null);
  const [open, setOpen]         = useState(false);

  /* ─── helpers ─────────────────────────────────── */
  const refresh = () => {
    if (!communityId) return;
    fetch(`/api/community/${communityId}/projects`)
      .then((r) => r.json())
      .then(setProjects);
  };

  /* ─── load projects ───────────────────────────── */
  useEffect(refresh, [communityId]);

  /* ─── get my role ─────────────────────────────── */
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
          (m: any) => m.user?.address?.toLowerCase() === address.toLowerCase()
        );
        setRole(me?.role ?? null);
      });
  }, [communityId, address]);

  const isAdmin    = role === "Owner" || role === "Professor";
  const canCreate  = isAdmin;

  /* ─── render ──────────────────────────────────── */
  return (
    <div className="container py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Projects</h1>
        {canCreate && (
          <Button onClick={() => setOpen(true)}>Create Project</Button>
        )}
      </div>

      {projects.length === 0 ? (
        <p>No projects yet.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard
              key={p.id}
              communityId={communityId}
              project={p}
              currentAddress={address}
              isAdmin={isAdmin}
              onDelete={refresh}
            />
          ))}
        </div>
      )}

      {/* Create Project Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Project</DialogTitle>
          </DialogHeader>

          <ProjectForm
            communityId={communityId}
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
