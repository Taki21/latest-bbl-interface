"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useAccount } from "wagmi";
import { Filter, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "@/components/project/project-card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import ProjectForm from "@/components/project/project-form";
import type { Project as PrismaProject } from "@prisma/client";

interface Tag {
  id: string;
  label: string;
  slug: string;
}

interface Project extends PrismaProject {
  creatorAddress: string;           // make sure your API returns this
  members: { id: string }[];
  tasks: { id: string; status: string }[];
  tags?: Tag[];
}

export default function ProjectsPage() {
  const { communityId } = useParams<{ communityId: string }>();
  const { address }     = useAccount();

  const [projects, setProjects] = useState<Project[]>([]);
  const [role, setRole]         = useState<string | null>(null);
  const [open, setOpen]         = useState(false);
  const [tags, setTags]         = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);

  const selectedTags = useMemo(
    () => tags.filter((tag) => selectedTagIds.includes(tag.id)),
    [tags, selectedTagIds]
  );

  const refresh = useCallback(() => {
    if (!communityId) return;
    const params = new URLSearchParams();
    if (selectedTagIds.length) {
      params.set("tagIds", selectedTagIds.join(","));
    }
    const query = params.toString();
    fetch(`/api/community/${communityId}/projects${query ? `?${query}` : ''}`)
      .then((r) => r.json())
      .then(setProjects);
  }, [communityId, selectedTagIds]);

  /* ─── load projects ───────────────────────────── */
  useEffect(() => {
    refresh();
  }, [refresh]);

  /* ─── load available tags ─────────────────────── */
  useEffect(() => {
    if (!communityId) return;
    fetch(`/api/community/${communityId}/tags`)
      .then((res) => {
        if (!res.ok) throw res;
        return res.json();
      })
      .then((data: Tag[]) => {
        if (Array.isArray(data)) {
          const sorted = [...data].sort((a, b) =>
            a.label.localeCompare(b.label, undefined, { sensitivity: "base" })
          );
          setTags(sorted);
        }
      })
      .catch(() => setTags([]));
  }, [communityId]);

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

  const isAdmin    = role === "Owner" || role === "Supervisor";
  const canCreate  = isAdmin;

  const toggleTagFilter = (id: string) =>
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]
    );

  const clearFilters = () => setSelectedTagIds([]);

  /* ─── render ──────────────────────────────────── */
  return (
    <div className="container py-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Projects</h1>
        <div className="flex items-center gap-2">
          <Popover open={filterOpen} onOpenChange={setFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span>Filter</span>
                {selectedTagIds.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {selectedTagIds.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-60 space-y-2">
              <p className="text-sm font-medium">Filter by tag</p>
              <div className="max-h-64 overflow-auto space-y-1">
                {tags.length ? (
                  tags.map((tag) => (
                    <label
                      key={tag.id}
                      className="flex items-center space-x-2 rounded px-2 py-1 hover:bg-muted"
                    >
                      <Checkbox
                        checked={selectedTagIds.includes(tag.id)}
                        onCheckedChange={() => toggleTagFilter(tag.id)}
                      />
                      <span>{tag.label}</span>
                    </label>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No tags available.</p>
                )}
              </div>
              <div className="flex justify-between gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={!selectedTagIds.length}
                  onClick={() => {
                    clearFilters();
                    setFilterOpen(false);
                  }}
                >
                  Clear
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setFilterOpen(false)}
                >
                  Apply
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {canCreate && (
            <Button onClick={() => setOpen(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Project
            </Button>
          )}
        </div>
      </div>

      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <Badge key={tag.id} variant="secondary">
              {tag.label}
            </Badge>
          ))}
        </div>
      )}

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
