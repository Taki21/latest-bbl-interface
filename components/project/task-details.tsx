"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { format } from "date-fns";
import type { Block } from "@blocknote/core";
import { useAccount } from "wagmi";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
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
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Check,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  Share2,
} from "lucide-react";
import Editor from "../editor";

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
    description?: string | null;
    status: string;
    priority: string;
    balance: string | number | bigint;
    deadline: string;
    creator: User;
    members: User[];
  };
  refresh: () => void;
}

interface MemberOption {
  id: string;
  user: User;
}

const STATUS_OPTIONS = [
  { value: "not_started", label: "Not Started" },
  { value: "in_progress", label: "In Progress" },
  { value: "under_review", label: "Under Review" },
  { value: "completed", label: "Completed" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const STATUS_BADGES: Record<string, "success" | "outline" | "secondary" | "destructive"> = {
  completed: "success",
  under_review: "outline",
  in_progress: "secondary",
  not_started: "destructive",
};

const PRIORITY_BADGES: Record<string, "default" | "warning" | "destructive"> = {
  low: "default",
  medium: "warning",
  high: "destructive",
};

const safeBigInt = (value: string | number | bigint | undefined | null): bigint => {
  try {
    if (typeof value === "bigint") return value;
    if (typeof value === "number") return BigInt(value);
    if (typeof value === "string" && value.trim() !== "") {
      return BigInt(value);
    }
  } catch (err) {
    console.error("Failed to parse bigint", err);
  }
  return 0n;
};

const parseDescription = (value?: string | null): Block<any, any, any>[] | undefined => {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed as Block<any, any, any>[];
    }
  } catch (err) {
    console.warn("Task description is not JSON, falling back to plain text", err);
  }
  return undefined;
};

const textToBlocks = (value?: string | null): Block<any, any, any>[] | undefined => {
  if (!value) return undefined;
  return [
    {
      type: "paragraph",
      content: value ? [{ type: "text", text: value }] : [],
    } as Block<any, any, any>,
  ];
};

const formatDisplayDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return format(date, "PPP");
};

const getDeadlineKey = (value?: string | null) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "";
  return date.toISOString();
};

export function TaskDetails({ task, refresh }: TaskDetailsProps) {
  const { toast } = useToast();
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

  const [taskState, setTaskState] = useState(task);
  const [projectBalance, setProjectBalance] = useState<bigint>(0n);
  const [communityMembers, setCommunityMembers] = useState<MemberOption[]>([]);
  const [assignedMemberIds, setAssignedMemberIds] = useState<string[]>([]);
  const [metaLoading, setMetaLoading] = useState(false);

  const [copied, setCopied] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [draftName, setDraftName] = useState(task.name);
  const [savingField, setSavingField] = useState<string | null>(null);

  const taskBalance = useMemo(() => safeBigInt(taskState.balance), [taskState.balance]);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [draftBudget, setDraftBudget] = useState(taskBalance.toString());

  const parsedDeadline = useMemo(() => {
    const date = taskState.deadline ? new Date(taskState.deadline) : null;
    if (!date || Number.isNaN(date.getTime())) return null;
    return date;
  }, [taskState.deadline]);
  const deadlineKey = useMemo(() => getDeadlineKey(taskState.deadline), [taskState.deadline]);
  const [deadlineOpen, setDeadlineOpen] = useState(false);
  const [draftDeadline, setDraftDeadline] = useState<Date | null>(parsedDeadline);

  const initialBlocks = useMemo(() => {
    return (
      parseDescription(taskState.description) ??
      textToBlocks(taskState.description) ??
      []
    );
  }, [taskState.description]);
  const serializedInitialBlocks = useMemo(
    () => JSON.stringify(initialBlocks ?? []),
    [initialBlocks]
  );
  const [draftBlocks, setDraftBlocks] = useState<Block<any, any, any>[] | undefined>(initialBlocks);
  const [editorDirty, setEditorDirty] = useState(false);

  // sync local task state when parent task changes
  useEffect(() => {
    setTaskState(task);
  }, [task]);

  useEffect(() => {
    if (!editingTitle) {
      setDraftName(taskState.name);
    }
  }, [taskState.name, editingTitle]);

  useEffect(() => {
    if (!budgetOpen) {
      setDraftBudget(taskBalance.toString());
    }
  }, [taskBalance, budgetOpen]);

  useEffect(() => {
    if (!deadlineOpen) {
      setDraftDeadline(parsedDeadline);
    }
  }, [deadlineKey, parsedDeadline, deadlineOpen]);

  useEffect(() => {
    setDraftBlocks(initialBlocks);
    setEditorDirty(false);
  }, [serializedInitialBlocks]);

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
          (m: any) =>
            m.user.address?.toLowerCase() === currentAddress.toLowerCase()
        );
        if (me) {
          setRole(me.role);
          setMeId(me.id);
        }
      })
      .catch((err) => console.error("Failed to load member role", err));
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
      .catch((err) => console.error("Failed to load project metadata", err));
  }, [communityId, projectId]);

  // fetch project balance + community members for assignments
  useEffect(() => {
    if (!communityId || !projectId || !taskState.id) return;
    let cancelled = false;
    setMetaLoading(true);
    fetch(
      `/api/community/${communityId}/projects/${projectId}/tasks/${taskState.id}`
    )
      .then(async (r) => {
        if (!r.ok) {
          const { error } = await r.json();
          throw new Error(error || "Failed to load task details");
        }
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        try {
          setProjectBalance(safeBigInt(data.projectBalance));
        } catch {
          setProjectBalance(0n);
        }
        const memberList: MemberOption[] = Array.isArray(data.members)
          ? data.members.map((m: any) => ({ id: m.id, user: m.user }))
          : [];
        setCommunityMembers(memberList);
        const selectedIds: string[] = Array.isArray(data.task?.members)
          ? data.task.members.map((m: any) => m.id)
          : [];
        setAssignedMemberIds(selectedIds);

        const enrichedMembers = selectedIds
          .map((id) => memberList.find((member) => member.id === id)?.user)
          .filter(Boolean) as User[];

        setTaskState((prev) => ({
          ...prev,
          name: data.task?.name ?? prev.name,
          description: data.task?.description ?? prev.description,
          status: data.task?.status ?? prev.status,
          priority: data.task?.priority ?? prev.priority,
          deadline: data.task?.deadline ?? prev.deadline,
          balance: data.task?.balance ?? prev.balance,
          members: enrichedMembers.length ? enrichedMembers : prev.members,
        }));
      })
      .catch((err) => console.error("Failed to load task metadata", err))
      .finally(() => {
        if (!cancelled) setMetaLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [communityId, projectId, taskState.id]);

  const canEdit =
    (role === "Owner" ||
      role === "Supervisor" ||
      meId === projCreatorId ||
      meId === projTeamLeaderId) &&
    Boolean(currentAddress);

  const share = useCallback(async () => {
    const href = `/${communityId}/projects/${projectId}?task=${taskState.id}`;
    const url = window.location.origin + href;
    try {
      if (navigator.share) {
        await navigator.share({ title: taskState.name, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }
    } catch (err) {
      console.error("share error", err);
    }
  }, [communityId, projectId, taskState.id, taskState.name]);

  const creatorName = taskState.creator.name ?? taskState.creator.address;
  const creatorInitials = creatorName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const memberLookup = useMemo(() => {
    const map = new Map<string, MemberOption>();
    communityMembers.forEach((member) => {
      map.set(member.user.id, member);
      map.set(member.user.address.toLowerCase(), member);
    });
    return map;
  }, [communityMembers]);

  const assignedMembersDetailed = useMemo(() => {
    if (assignedMemberIds.length) {
      const list = assignedMemberIds
        .map((id) => communityMembers.find((member) => member.id === id))
        .filter((m): m is MemberOption => Boolean(m));
      if (list.length) return list;
    }
    return taskState.members
      .map(
        (user) =>
          memberLookup.get(user.id) ||
          memberLookup.get(user.address.toLowerCase())
      )
      .filter((m): m is MemberOption => Boolean(m));
  }, [assignedMemberIds, communityMembers, memberLookup, taskState.members]);

  const availableMembers = useMemo(() => {
    const assignedSet = new Set(assignedMembersDetailed.map((m) => m.id));
    return communityMembers.filter((member) => !assignedSet.has(member.id));
  }, [communityMembers, assignedMembersDetailed]);

  const isAssigned = useMemo(() => {
    return taskState.members.some(
      (m) => m.address.toLowerCase() === currentAddress?.toLowerCase()
    );
  }, [taskState.members, currentAddress]);

  const canApprove =
    taskState.status === "under_review" &&
    (role === "Supervisor" || role === "Owner" || meId === projTeamLeaderId);

  const patchTask = useCallback(
    async (
      updates: Record<string, any>,
      options?: { field?: string; memberIds?: string[] }
    ) => {
      if (!communityId || !projectId || !taskState.id || !currentAddress) {
        toast({
          title: "Action unavailable",
          description: "Connect your wallet and try again.",
          variant: "destructive",
        });
        return;
      }

      const field = options?.field;
      if (field) setSavingField(field);
      const body: Record<string, any> = {
        ...updates,
        creatorAddress: currentAddress,
      };
      if (options?.memberIds) {
        body.memberIds = options.memberIds;
      }

      try {
        const res = await fetch(
          `/api/community/${communityId}/projects/${projectId}/tasks/${taskState.id}/edit`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        );
        if (!res.ok) {
          const data = await res.json().catch(() => ({ error: "Update failed" }));
          throw new Error(data.error || "Update failed");
        }
        const data = await res.json();
        if (data?.task) {
          const nextMembers: User[] = Array.isArray(data.task.members)
            ? data.task.members
                .map((m: any) => m.user)
                .filter(Boolean)
            : taskState.members;
          setTaskState((prev) => ({
            ...prev,
            ...data.task,
            creator: data.task.creator?.user ?? prev.creator,
            members: nextMembers,
          }));
          if (Array.isArray(data.task.members)) {
            setAssignedMemberIds(data.task.members.map((m: any) => m.id));
          }
        }
        if (data?.projectBalance !== undefined) {
          setProjectBalance(safeBigInt(data.projectBalance));
        }
        refresh();
      } catch (err: any) {
        toast({
          title: "Update failed",
          description: err?.message || "Something went wrong",
          variant: "destructive",
        });
        throw err;
      } finally {
        if (field) {
          setSavingField((current) => (current === field ? null : current));
        }
      }
    },
    [
      communityId,
      projectId,
      taskState.id,
      currentAddress,
      refresh,
      toast,
    ]
  );

  const handleTitleSave = async () => {
    const nextName = draftName.trim();
    if (!nextName || savingField === "name") return;
    await patchTask({ name: nextName }, { field: "name" });
    setEditingTitle(false);
  };

  const handleStatusChange = async (value: string) => {
    if (value === taskState.status) return;
    await patchTask({ status: value }, { field: "status" });
  };

  const handlePriorityChange = async (value: string) => {
    if (value === taskState.priority) return;
    await patchTask({ priority: value }, { field: "priority" });
  };

  const handleBudgetSave = async () => {
    try {
      const nextBudget = BigInt(draftBudget);
      const maxBudget = projectBalance + taskBalance;
      if (nextBudget > maxBudget) {
        toast({
          title: "Budget too high",
          description: `Max available is ${maxBudget.toString()} TOKEN`,
          variant: "destructive",
        });
        return;
      }
      await patchTask(
        { balance: nextBudget.toString() },
        { field: "balance" }
      );
      setBudgetOpen(false);
    } catch (err) {
      toast({
        title: "Invalid amount",
        description: "Budget must be a whole number",
        variant: "destructive",
      });
    }
  };

  const handleDeadlineSave = async () => {
    if (!draftDeadline) return;
    const formatted = format(draftDeadline, "yyyy-MM-dd");
    await patchTask({ deadline: formatted }, { field: "deadline" });
    setDeadlineOpen(false);
  };

  const handleAddMember = async (memberId: string) => {
    const currentIds = assignedMemberIds.length
      ? assignedMemberIds
      : assignedMembersDetailed.map((m) => m.id);
    const updated = Array.from(new Set([...currentIds, memberId]));
    await patchTask({}, { field: "members", memberIds: updated });
  };

  const handleRemoveMember = async (memberId: string) => {
    const currentIds = assignedMemberIds.length
      ? assignedMemberIds
      : assignedMembersDetailed.map((m) => m.id);
    const updated = currentIds.filter((id) => id !== memberId);
    await patchTask({}, { field: "members", memberIds: updated });
  };

  const handleEditorChange = useCallback(
    (blocks: Block<any, any, any>[]) => {
      if (!canEdit) return;
      setDraftBlocks(blocks);
      setEditorDirty(true);
    },
    [canEdit]
  );

  const handleDescriptionSave = async () => {
    const serialized = JSON.stringify(draftBlocks ?? []);
    await patchTask({ description: serialized }, { field: "description" });
    setEditorDirty(false);
  };

  const startTask = async () => {
    const res = await fetch(
      `/api/community/${communityId}/projects/${projectId}/tasks/${taskState.id}/start`,
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
      `/api/community/${communityId}/projects/${projectId}/tasks/${taskState.id}/finish`,
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
      `/api/community/${communityId}/projects/${projectId}/tasks/${taskState.id}/approve`,
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
      {/* {canEdit && (
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
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={share}>
              <Share2 className="mr-2 h-4 w-4" />
              {copied ? "Copied!" : "Share"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() =>
                router.push(
                  `/${communityId}/projects/${projectId}/tasks/${taskState.id}/edit`
                )
              }
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )} */}

      <CardHeader className="pb-0 space-y-4">
        {editingTitle ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleTitleSave}
                disabled={!draftName.trim() || savingField === "name"}
              >
                {savingField === "name" && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditingTitle(false);
                  setDraftName(taskState.name);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2">
            <CardTitle className="flex-1 text-2xl">
              {taskState.name}
            </CardTitle>
            {canEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setEditingTitle(true);
                  setDraftName(taskState.name);
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="px-0 space-y-6">
        <div className="space-y-3">
          {metaLoading ? (
            <div className="px-6 text-sm text-muted-foreground">Loading editor…</div>
          ) : (
            <>
              <Editor
                initialContent={initialBlocks}
                editable={canEdit}
                onChange={handleEditorChange}
                className="rounded-md"
              />
              {canEdit && (
                <div className="pl-6 flex">
                  <Button
                    size="sm"
                    onClick={handleDescriptionSave}
                    disabled={!editorDirty || savingField === "description"}
                  >
                    {savingField === "description" && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save Description
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="px-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Status</p>
            {canEdit ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button"
                    className={cn(
                      "inline-flex items-center gap-2 rounded-md border px-3 py-1 text-sm",
                      "transition hover:bg-muted",
                      "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    )}
                    disabled={savingField === "status"}
                  >
                    <Badge variant={STATUS_BADGES[taskState.status] ?? "secondary"}>
                      {STATUS_OPTIONS.find((o) => o.value === taskState.status)?.label ??
                        taskState.status.replace("_", " ")}
                    </Badge>
                    <Pencil className="h-3.5 w-3.5 opacity-70" />
                    {savingField === "status" && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-44">
                  {STATUS_OPTIONS.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => handleStatusChange(option.value)}
                      className="flex items-center justify-between"
                    >
                      <span>{option.label}</span>
                      {taskState.status === option.value && (
                        <Check className="h-4 w-4" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Badge variant={STATUS_BADGES[taskState.status] ?? "secondary"}>
                {STATUS_OPTIONS.find((o) => o.value === taskState.status)?.label ??
                  taskState.status.replace("_", " ")}
              </Badge>
            )}
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Priority</p>
            {canEdit ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button"
                    className={cn(
                      "inline-flex items-center gap-2 rounded-md border px-3 py-1 text-sm",
                      "transition hover:bg-muted",
                      "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    )}
                    disabled={savingField === "priority"}
                  >
                    <Badge variant={PRIORITY_BADGES[taskState.priority] ?? "default"}>
                      {PRIORITY_OPTIONS.find((o) => o.value === taskState.priority)?.label ??
                        taskState.priority.charAt(0).toUpperCase() +
                          taskState.priority.slice(1)}
                    </Badge>
                    <Pencil className="h-3.5 w-3.5 opacity-70" />
                    {savingField === "priority" && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-40">
                  {PRIORITY_OPTIONS.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => handlePriorityChange(option.value)}
                      className="flex items-center justify-between"
                    >
                      <span>{option.label}</span>
                      {taskState.priority === option.value && (
                        <Check className="h-4 w-4" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Badge variant={PRIORITY_BADGES[taskState.priority] ?? "default"}>
                {PRIORITY_OPTIONS.find((o) => o.value === taskState.priority)?.label ??
                  taskState.priority.charAt(0).toUpperCase() +
                    taskState.priority.slice(1)}
              </Badge>
            )}
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Budget</p>
            {canEdit ? (
              <Popover open={budgetOpen} onOpenChange={setBudgetOpen}>
                <PopoverTrigger asChild>
                  <button type="button"
                    className={cn(
                      "inline-flex items-center gap-2 rounded-md border px-3 py-1 text-sm",
                      "transition hover:bg-muted",
                      "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    )}
                    disabled={savingField === "balance"}
                  >
                    <span>{taskBalance.toString()} TOKEN</span>
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 space-y-3">
                  <div className="space-y-2">
                    <Input
                      type="number"
                      value={draftBudget}
                      onChange={(e) => setDraftBudget(e.target.value)}
                      min={0}
                    />
                    <p className="text-xs text-muted-foreground">
                      Available: {(projectBalance + taskBalance).toString()} TOKEN
                    </p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setDraftBudget(taskBalance.toString());
                        setBudgetOpen(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleBudgetSave}
                      disabled={savingField === "balance"}
                    >
                      {savingField === "balance" && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Save
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            ) : (
              <p className="font-medium">{taskBalance.toString()} TOKEN</p>
            )}
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Deadline</p>
            {canEdit ? (
              <Popover open={deadlineOpen} onOpenChange={setDeadlineOpen}>
                <PopoverTrigger asChild>
                  <button type="button"
                    className={cn(
                      "inline-flex items-center gap-2 rounded-md border px-3 py-1 text-sm",
                      "transition hover:bg-muted",
                      "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    )}
                    disabled={savingField === "deadline"}
                  >
                    <span>{formatDisplayDate(taskState.deadline)}</span>
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={draftDeadline ?? undefined}
                    onSelect={(date) => setDraftDeadline(date ?? null)}
                    initialFocus
                  />
                  <div className="flex justify-end gap-2 border-t p-3">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setDraftDeadline(parsedDeadline);
                        setDeadlineOpen(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleDeadlineSave}
                      disabled={!draftDeadline || savingField === "deadline"}
                    >
                      {savingField === "deadline" && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Save
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            ) : (
              <p className="font-medium">{formatDisplayDate(taskState.deadline)}</p>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={undefined} alt={creatorName} />
              <AvatarFallback>{creatorInitials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xs text-muted-foreground">Created by</p>
              <p className="font-medium">{creatorName}</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Assigned to</p>
            <div className="flex flex-wrap items-center gap-2">
              {assignedMembersDetailed.length ? (
                assignedMembersDetailed.map((member) => {
                  const name = member.user.name ?? member.user.address;
                  const initials = name
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .toUpperCase();
                  const avatar = (
                    <Avatar className="h-8 w-8 border-2 border-background">
                      <AvatarImage src={undefined} alt={name} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                  );

                  if (!canEdit) {
                    return (
                      <div key={member.id} title={name}>
                        {avatar}
                      </div>
                    );
                  }

                  return (
                    <DropdownMenu key={member.id}>
                      <DropdownMenuTrigger asChild>
                        <button type="button" title={name}>{avatar}</button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-36">
                        <DropdownMenuItem
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          Remove User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">
                  {metaLoading ? "Loading members…" : "No members assigned"}
                </p>
              )}

              {canEdit && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={!availableMembers.length || metaLoading}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    {availableMembers.length ? (
                      availableMembers.map((member) => (
                        <DropdownMenuItem
                          key={member.id}
                          onClick={() => handleAddMember(member.id)}
                        >
                          {member.user.name || member.user.address}
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <DropdownMenuItem disabled>
                        Everyone is assigned
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 space-y-2">
          {isAssigned && taskState.status === "not_started" && (
            <Button onClick={startTask}>Start Task</Button>
          )}
          {isAssigned && taskState.status === "in_progress" && (
            <Button onClick={finishTask}>Finish Task</Button>
          )}
          {canApprove && (
            <Button onClick={approveTask}>Approve</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
