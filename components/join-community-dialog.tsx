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
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export interface JoinCommunityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JoinCommunityDialog({
  open,
  onOpenChange,
}: JoinCommunityDialogProps) {
  const router = useRouter();
  const { address } = useAccount();

  const [code, setCode] = useState(Array(8).fill(""));
  const [name, setName] = useState("");

  const handleCodeChange = (index: number, value: string) => {
    const sanitized = value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

    if (!sanitized) {
      const clearedCode = [...code];
      clearedCode[index] = "";
      setCode(clearedCode);
      return;
    }

    const chars = sanitized.slice(0, code.length - index).split("");
    const newCode = [...code];
    chars.forEach((char, charIndex) => {
      newCode[index + charIndex] = char;
    });
    setCode(newCode);

    const nextIndex = index + chars.length;
    if (nextIndex < code.length) {
      const next = document.getElementById(`code-${nextIndex}`) as HTMLInputElement;
      next?.focus();
    }
  };

  const handlePaste = (
    index: number,
    event: React.ClipboardEvent<HTMLInputElement>,
  ) => {
    event.preventDefault();
    const pasted = event.clipboardData
      .getData("text")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase();

    if (!pasted) return;

    const chars = pasted.slice(0, code.length - index).split("");
    const newCode = [...code];
    chars.forEach((char, charIndex) => {
      newCode[index + charIndex] = char;
    });
    setCode(newCode);

    const nextIndex = index + chars.length;
    if (nextIndex < code.length) {
      const next = document.getElementById(`code-${nextIndex}`) as HTMLInputElement;
      next?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      const prev = document.getElementById(`code-${index - 1}`) as HTMLInputElement;
      prev?.focus();
    }
  };

  const joinCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return alert("Connect wallet first!");

    const joinCode = code.join("");
    try {
      const res = await fetch("/api/community/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ joinCode, address, name }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to join community");
      }

      const community = await res.json();
      router.push(`/${community.id}/dashboard`);
      onOpenChange(false);
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Join Community
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={joinCommunity} className="space-y-6">
          <div className="space-y-4">
            <Label htmlFor="name">Your Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-4">
            <Label htmlFor="code-0">Community Code</Label>
            <div className="flex justify-center space-x-2">
              {code.map((digit, index) => (
                <input
                  key={index}
                  id={`code-${index}`}
                  type="text"
                  inputMode="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={(e) => handlePaste(index, e)}
                  className="w-10 h-12 text-center text-2xl border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  pattern="[a-zA-Z0-9]"
                  required
                />
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="submit"
              className="w-full"
              disabled={code.some((d) => !d) || !name.trim()}
            >
              Join Community
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
