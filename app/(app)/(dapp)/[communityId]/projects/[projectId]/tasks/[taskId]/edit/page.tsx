"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAccount } from "wagmi";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import TaskEditForm from "@/components/project/task-edit-form";

export default function TaskEditPage() {
  const { communityId, projectId, taskId } = useParams<{
    communityId: string;
    projectId: string;
    taskId: string;
  }>();
  const { address } = useAccount();
  const router = useRouter();
  const [open, setOpen] = useState(true);

  const handleClose = () => {
    setOpen(false);
    router.back();
  };

  const handleSuccess = () => {
    setOpen(false);
    router.push(`/${communityId}/projects/${projectId}`);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        <TaskEditForm
          communityId={communityId!}
          projectId={projectId!}
          taskId={taskId!}
          creatorAddress={address || ""}
          onSuccess={handleSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}
