
"use client";

import { Wallet, Users2, ClipboardList, FolderGit2, Coins } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type NumLike = string | number | bigint;

export default function StatCards(props: {
  balance: NumLike;
  allocation: NumLike;
  members: NumLike;
  projects: NumLike;
  tasks: NumLike;
  tokenSymbol?: string;
}) {
  const { balance, allocation, members, projects, tasks, tokenSymbol } = props;
  const sym = tokenSymbol || "TOKEN";

  const stats: {
    key: string;
    label: string;
    value: NumLike | string;
    caption?: string;
    icon: any;
    tint: string; // tailwind color utility for icon bg
    showToken?: boolean;
  }[] = [
    {
      key: "balance",
      label: "My Balance",
      value: balance,
      caption: "Rewards earned",
      icon: Wallet,
      tint: "text-primary bg-primary/10",
      showToken: true,
    },
    {
      key: "allocation",
      label: "My Allocation",
      value: allocation,
      caption: "Tokens available to you",
      icon: Coins,
      tint: "text-amber-600 bg-amber-500/10 dark:text-amber-400",
      showToken: true,
    },
    {
      key: "members",
      label: "Members",
      value: members,
      caption: "Active members",
      icon: Users2,
      tint: "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400",
    },
    {
      key: "projects",
      label: "Projects",
      value: projects,
      caption: "Total projects",
      icon: FolderGit2,
      tint: "text-blue-600 bg-blue-500/10 dark:text-blue-400",
    },
    {
      key: "tasks",
      label: "Tasks",
      value: tasks,
      caption: "Total tasks",
      icon: ClipboardList,
      tint: "text-violet-600 bg-violet-500/10 dark:text-violet-400",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {stats.map(({ key, label, value, caption, icon: Icon, tint, showToken }) => (
        <Card key={key} className="relative overflow-hidden border-muted/60">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <p className="text-sm text-muted-foreground">{label}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-semibold tabular-nums">
                    {formatValue(value)}
                  </span>
                  {showToken ? (
                    <Badge variant="secondary" className="uppercase">
                      {sym}
                    </Badge>
                  ) : null}
                </div>
                {caption ? (
                  <p className="text-xs text-muted-foreground">{caption}</p>
                ) : null}
              </div>

              <div className={`h-10 w-10 rounded-full ${tint} flex items-center justify-center shrink-0`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function formatValue(v: NumLike | string) {
  if (typeof v === "bigint") return Number(v).toLocaleString();
  if (typeof v === "number") return v.toLocaleString();
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n.toLocaleString() : v;
  }
  return String(v ?? "—");
}
