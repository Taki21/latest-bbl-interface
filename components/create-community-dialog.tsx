"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export interface CreateCommunityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCommunityDialog({
  open,
  onOpenChange,
}: CreateCommunityDialogProps) {
  const router = useRouter();
  const { address } = useAccount();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    affiliation: "",
    tokenName: "",
    tokenSymbol: "",
    newMemberReward: "",
    referralReward: "",
  });

  const [success, setSuccess] = useState(false);
  const [joinCode, setJoinCode] = useState<string>("");
  const [communityId, setCommunityId] = useState<string>("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return alert("Connect your wallet first!");

    try {
      const res = await fetch("/api/community/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          newMemberReward: Number(formData.newMemberReward) || 0,
          referralReward: Number(formData.referralReward) || 0,
          creatorAddress: address,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create community");
      }

      const community = await res.json();
      setJoinCode(community.joinCode);
      setCommunityId(community.id);
      setSuccess(true);
      onOpenChange(false); // close the create dialog
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(joinCode);
    } catch (err) {
      console.error("Clipboard copy failed", err);
    }
  };

  return (
    <>
      {/* Create Community Dialog */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">
              Create Community
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Community Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter community name"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Brief description"
              />
            </div>

            {/* Affiliation */}
            <div className="space-y-2">
              <Label htmlFor="affiliation">Affiliated Organization</Label>
              <Input
                id="affiliation"
                name="affiliation"
                value={formData.affiliation}
                onChange={handleInputChange}
                placeholder="Enter organization name"
              />
            </div>

            {/* Token fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tokenName">Token Name</Label>
                <Input
                  id="tokenName"
                  name="tokenName"
                  value={formData.tokenName}
                  onChange={handleInputChange}
                  placeholder="Token"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tokenSymbol">Token Symbol</Label>
                <Input
                  id="tokenSymbol"
                  name="tokenSymbol"
                  value={formData.tokenSymbol}
                  onChange={handleInputChange}
                  placeholder="SYM"
                  required
                />
              </div>
            </div>

            {/* Rewards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newMemberReward">New-Member Reward</Label>
                <Input
                  id="newMemberReward"
                  name="newMemberReward"
                  type="number"
                  value={formData.newMemberReward}
                  onChange={handleInputChange}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="referralReward">Referral Reward</Label>
                <Input
                  id="referralReward"
                  name="referralReward"
                  type="number"
                  value={formData.referralReward}
                  onChange={handleInputChange}
                  placeholder="0"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" className="w-full">
                Create Community
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={success} onOpenChange={setSuccess}>
        <DialogContent className="sm:max-w-[400px] text-center space-y-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Community Created!
            </DialogTitle>
          </DialogHeader>

          <div>
            <p className="mb-2 text-muted-foreground">Share this join code:</p>
            <div
              onClick={copyCode}
              className="cursor-pointer select-all rounded-md border px-4 py-2 text-lg font-mono hover:bg-muted"
            >
              {joinCode}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Click code to copy</p>
          </div>

          <Button
            className="w-full"
            onClick={() => router.push(`/${communityId}/dashboard`)}
          >
            Go to Community
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
