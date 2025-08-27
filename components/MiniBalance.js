"use client";

import { RiCopperCoinLine } from "react-icons/ri";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function MiniBalance({ communityId }) {
  const { address } = useAccount();
  const [balance, setBalance] = useState("0");
  const [allocation, setAllocation] = useState("0");

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
          (m) => m.user.address.toLowerCase() === address.toLowerCase()
        );
        if (me) {
          setBalance(me.balance.toString());
          setAllocation(me.allocation.toString());
        }
      })
      .catch(console.error);
  }, [communityId, address]);

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center justify-center space-x-1 bg-primary py-2 pl-2 pr-3 rounded-xl text-sm cursor-default">
            <RiCopperCoinLine size={20} />
            <h1 className="font-bold">{balance} BBL</h1>
            <span className="text-xs text-primary-foreground/70">/ {allocation}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          Available / allocated tokens
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
