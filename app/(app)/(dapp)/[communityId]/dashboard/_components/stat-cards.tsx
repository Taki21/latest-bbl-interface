
"use client";

import { Wallet, Users2, ClipboardList, FolderGit2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function StatCards(props: {
  balance: string;
  members: number;
  projects: number;
  tasks: number;
}) {
  const { balance, members, projects, tasks } = props;
  const stats = [
    { label: "Treasury", val: `${balance} TOKEN`, icon: Wallet },
    { label: "Members",  val: members,           icon: Users2 },
    { label: "Projects", val: projects,          icon: FolderGit2 },
    { label: "Tasks",    val: tasks,             icon: ClipboardList },
  ];

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map(({ label, val, icon: Icon }) => (
        <Card key={label} className="hover:shadow-md transition">
          <CardHeader className="flex-row items-center gap-4 pb-2">
            <Icon className="h-6 w-6 text-primary" />
            <CardTitle>{label}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-2xl font-semibold">{val}</CardContent>
        </Card>
      ))}
    </div>
  );
}
