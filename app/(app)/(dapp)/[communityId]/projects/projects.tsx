"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useAccount } from "wagmi";
import {
  Filter,
  MoreHorizontal,
  Plus,
  Share2,
  ListTodo,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import ProjectForm from "@/components/project/project-form";
import ProjectEditForm from "@/components/project/project-edit-form";
import type { Project as PrismaProject } from "@prisma/client";

interface Tag {
  id: string;
  label: string;
  slug: string;
}

interface Project extends PrismaProject {
  creatorAddress?: string | null;
  creator?: { address?: string | null };
  supervisor?: string | null;
  supervisorAddress?: string | null;
  teamLeaderAddress?: string | null;
  members: { id: string }[];
  tasks: { id: string; status: string }[];
  tags?: Tag[];
}

export default function ProjectsPage() {
  const { communityId } = useParams<{ communityId: string }>();
  const { address } = useAccount();

  const [projects, setProjects] = useState<Project[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);

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
    if (debouncedSearch) {
      params.set("search", debouncedSearch);
    }
    const query = params.toString();

    fetch(`/api/community/${communityId}/projects${query ? `?${query}` : ""}`)
      .then((r) => r.json())
      .then(setProjects);
  }, [communityId, selectedTagIds, debouncedSearch]);

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 300);
    return () => clearTimeout(handle);
  }, [searchQuery]);

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
          const filtered = data.filter((tag) => !tag.slug?.startsWith("member-"));
          const sorted = [...filtered].sort((a, b) =>
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

  const isAdmin = role === "Owner" || role === "Supervisor";
  const canCreate = isAdmin;

  const toggleTagFilter = (id: string) =>
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]
    );

  const clearFilters = () => setSelectedTagIds([]);

  const handleEditProject = (projectId: string) => {
    if (!address) return;
    setEditingProjectId(projectId);
  };

  const handleEditSaved = () => {
    setEditingProjectId(null);
    refresh();
  };

  /* ─── render ──────────────────────────────────── */
  return (
    <div className="py-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Projects</h1>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
            <Input
              value={searchQuery}
              placeholder="Search projects"
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full sm:w-64"
            />
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
                  <Button type="button" size="sm" onClick={() => setFilterOpen(false)}>
                    Apply
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

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

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[28rem]">Project</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Supervisor</TableHead>
              <TableHead>Team Leader</TableHead>
              <TableHead className="text-center">Members</TableHead>
              <TableHead className="text-center">Tasks</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead>Deadline</TableHead>
              <TableHead className="w-12" aria-label="Row actions" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  No projects yet.
                </TableCell>
              </TableRow>
            ) : (
              projects.map((project) => (
                <ProjectTableRow
                  key={project.id}
                  communityId={communityId}
                  project={project}
                  currentAddress={address}
                  isAdmin={isAdmin}
                  onDelete={refresh}
                  onEdit={handleEditProject}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

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

      {/* Edit Project Dialog */}
      <Dialog
        open={Boolean(editingProjectId)}
        onOpenChange={(next) => {
          if (!next) setEditingProjectId(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>

          {editingProjectId ? (
            address ? (
              <ProjectEditForm
                key={editingProjectId}
                communityId={communityId}
                projectId={editingProjectId}
                callerAddress={address}
                onSaved={handleEditSaved}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Connect your wallet to edit projects.
              </p>
            )
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ProjectTableRowProps {
  communityId: string | undefined;
  project: Project;
  currentAddress?: string | null;
  isAdmin: boolean;
  onDelete?: () => void;
  onEdit?: (projectId: string) => void;
}

function ProjectTableRow({
  communityId,
  project,
  currentAddress,
  isAdmin,
  onDelete,
  onEdit,
}: ProjectTableRowProps) {
  const href = communityId ? `/${communityId}/projects/${project.id}` : "#";
  const creatorAddress = project.creatorAddress ?? project.creator?.address ?? "";
  const meIsCreator =
    currentAddress &&
    creatorAddress &&
    currentAddress.toLowerCase() === creatorAddress.toLowerCase();
  const canEdit = isAdmin || meIsCreator;
  const canDelete = canEdit;

  const supervisorName = (project.supervisor ?? "").trim() || "-";
  const supervisorAddress = project.supervisorAddress ?? creatorAddress ?? "";
  const teamLeaderName = (project.teamLeader ?? "").trim() || "-";
  const teamLeaderAddress = project.teamLeaderAddress ?? null;
  const initials =
    (teamLeaderName !== "-" ? teamLeaderName : project.title)
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase())
      .join("")
      .slice(0, 2) || "?";

  const totalTasks = project.tasks.length;
  const doneTasks = project.tasks.filter((task) => isTaskDone(task.status)).length;
  const tasksLabel =
    totalTasks === 0
      ? "-"
      : doneTasks === totalTasks
      ? "All done"
      : `${doneTasks}/${totalTasks} done`;

  const handleDelete = async () => {
    if (!communityId || !currentAddress) return;
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
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <TableRow className="group">
      <TableCell className="py-4">
        <Link href={href} className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="font-medium leading-none group-hover:text-primary">
                {project.title}
              </p>
              {project.description ? (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {project.description}
                </p>
              ) : null}
            </div>
          </div>
          {project.tags?.length ? (
            <div className="flex flex-wrap gap-1 pl-11">
              {project.tags.map((tag) => (
                <Badge key={tag.id} variant="secondary" className="text-xs">
                  {tag.label}
                </Badge>
              ))}
            </div>
          ) : null}
        </Link>
      </TableCell>
      <TableCell>
        <StatusBadge status={project.status} />
      </TableCell>
      <TableCell>
        <div className="font-medium">{supervisorName}</div>
        {supervisorAddress ? (
          <p className="text-xs text-muted-foreground">
            {shortenAddress(supervisorAddress)}
          </p>
        ) : null}
      </TableCell>
      <TableCell>
        <div className="font-medium">{teamLeaderName}</div>
        {teamLeaderAddress ? (
          <p className="text-xs text-muted-foreground">
            {shortenAddress(teamLeaderAddress)}
          </p>
        ) : null}
      </TableCell>
      <TableCell className="text-center font-medium">
        {project.members.length}
      </TableCell>
      <TableCell className="text-center text-sm text-muted-foreground">
        {tasksLabel}
      </TableCell>
      <TableCell className="whitespace-nowrap font-mono text-xs">
        {formatBalance(project.balance)}
      </TableCell>
      <TableCell className="whitespace-nowrap text-sm">
        {formatDeadline(project.deadline)}
      </TableCell>
      <TableCell>
        <ProjectRowActions
          canEdit={canEdit}
          canDelete={canDelete}
          href={href}
          projectTitle={project.title}
          onDelete={handleDelete}
          onEdit={onEdit ? () => onEdit(project.id) : undefined}
        />
      </TableCell>
    </TableRow>
  );
}

function ProjectRowActions({
  canEdit,
  canDelete,
  href,
  projectTitle,
  onDelete,
  onEdit,
}: {
  canEdit: boolean;
  canDelete: boolean;
  href: string;
  projectTitle: string;
  onDelete: () => Promise<void> | void;
  onEdit?: () => void;
}) {
  const share = async () => {
    const url = window.location.origin + href;
    try {
      if (navigator.share) {
        await navigator.share({ title: projectTitle, url });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open project actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {canEdit ? (
          <DropdownMenuItem
            onSelect={() => {
              onEdit?.();
            }}
            disabled={!onEdit}
            className="flex items-center"
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit project
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem asChild>
          <Link href={href} className="flex items-center">
            <ListTodo className="mr-2 h-4 w-4" />
            View tasks
          </Link>
        </DropdownMenuItem>
        {canDelete ? (
          <DropdownMenuItem onClick={onDelete} className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={share}>
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = (status ?? "").replace(/_/g, " ").trim() || "unknown";
  const variant = getStatusVariant(status ?? "");
  return (
    <Badge className={cn("capitalize", variant)} variant="outline">
      {normalized.toLowerCase()}
    </Badge>
  );
}

function getStatusVariant(status: string) {
  const key = (status ?? "").toLowerCase();
  switch (key) {
    case "completed":
    case "complete":
    case "done":
      return "border-green-500/60 bg-green-500/10 text-green-600 dark:text-green-400";
    case "in_progress":
    case "active":
      return "border-blue-500/60 bg-blue-500/10 text-blue-600 dark:text-blue-400";
    case "on_hold":
    case "blocked":
      return "border-amber-500/60 bg-amber-500/10 text-amber-600 dark:text-amber-400";
    case "todo":
    case "not_started":
      return "border-muted text-muted-foreground";
    default:
      return "border-muted text-muted-foreground";
  }
}

function isTaskDone(status: string | null | undefined) {
  const normalized = (status ?? "").toLowerCase();
  return normalized === "done" || normalized === "completed" || normalized === "complete";
}

function formatBalance(balance: Project["balance"]) {
  if (balance === null || balance === undefined) return "-";
  if (typeof balance === "bigint") return `${balance.toString()} BBL`;
  if (typeof balance === "number") return `${balance} BBL`;
  if (typeof balance === "string") {
    return /[a-zA-Z]/.test(balance) ? balance : `${balance} BBL`;
  }
  if (typeof balance === "object" && balance !== null && "toString" in balance) {
    const value = (balance as { toString: () => string }).toString();
    return /[a-zA-Z]/.test(value) ? value : `${value} BBL`;
  }
  return "-";
}

function formatDeadline(deadline: string | Date) {
  if (!deadline) return "-";
  const date = deadline instanceof Date ? deadline : new Date(deadline);
  if (Number.isNaN(date.getTime())) {
    return typeof deadline === "string" ? deadline : deadline.toString();
  }
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function shortenAddress(address: string) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
