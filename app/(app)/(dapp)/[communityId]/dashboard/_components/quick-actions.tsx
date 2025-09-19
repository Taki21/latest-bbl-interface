"use client";

import Link from "next/link";
import { useState } from "react";
import { useAccount } from "wagmi";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Plus, Users, Landmark, Share2 } from "lucide-react";
import ProjectForm from "@/components/project/project-form";

interface Props {
  communityId: string;
  canCreateProject?: boolean;
}

export default function QuickActions({ communityId, canCreateProject }: Props) {
  const { address } = useAccount();
  const [open, setOpen] = useState(false);

  const share = async () => {
    const url = `${window.location.origin}/${communityId}/dashboard`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Dashboard", url });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 sm:grid-cols-2">
        {canCreateProject ? (
          <Button className="justify-start" onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Project
          </Button>
        ) : null}
        <Button asChild variant="secondary" className="justify-start">
          <Link href={`/${communityId}/members`}>
            <Users className="mr-2 h-4 w-4" /> Manage Members
          </Link>
        </Button>
        <Button asChild variant="outline" className="justify-start">
          <Link href={`/${communityId}/treasury`}>
            <Landmark className="mr-2 h-4 w-4" /> Treasury
          </Link>
        </Button>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" className="justify-start" onClick={share}>
                <Share2 className="mr-2 h-4 w-4" /> Share Dashboard
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy or share the dashboard link</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Create Project Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Project</DialogTitle>
            </DialogHeader>
            <ProjectForm
              communityId={communityId}
              creatorAddress={address ?? ""}
              onSuccess={() => setOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
