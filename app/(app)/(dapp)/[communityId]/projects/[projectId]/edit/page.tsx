"use client";

import ProjectEditForm from "@/components/project/project-edit-form";
import { useAccount } from "wagmi";
import { useParams } from "next/navigation";

export default function EditProjectPage() {
  const { address } = useAccount();
  const { communityId, projectId } = useParams<{
    communityId: string;
    projectId: string;
  }>();

  if (!address) return null; // or redirect to login

  return (
    <div className="container max-w-lg py-8">
      <ProjectEditForm
        communityId={communityId}
        projectId={projectId}
        callerAddress={address}
        onSaved={() => history.back()}
      />
    </div>
  );
}
