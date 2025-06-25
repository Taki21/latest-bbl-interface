"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAccount } from "wagmi";

import StatCards      from "./_components/stat-cards";
import MembersWidget  from "./_components/members-widget";
import ProjectsWidget from "./_components/projects-widget";
import TasksWidget    from "./_components/tasks-widget";

interface Community {
  id: string;
  name: string;
  balance: string;
  members: { id: string; role: string; user: { name: string|null; address: string } }[];
  projects: {
    id: string;
    title: string;
    balance: string;
    updatedAt?: string;
    members: any[];
    tasks: { status: string; id: string; deadline: string; name: string }[];
  }[];
}

export default function DashboardPage() {
  const { communityId } = useParams<{ communityId: string }>();
  const { address } = useAccount();

  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [myBalance, setMyBalance]       = useState("0");
  const [myAllocation, setMyAllocation] = useState("0");

  useEffect(() => {
    if (!communityId) return;
    setLoading(true);
    fetch(`/api/community/${communityId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error || res.statusText);
        return res.json();
      })
      .then((data: Community) => {
        setCommunity(data);
        const me = data.members.find(
          (m) => m.user.address.toLowerCase() === address?.toLowerCase()
        );
        if (me) {
          setMyBalance(me.balance.toString());
          setMyAllocation(me.allocation.toString());
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [communityId, address]);

  if (loading) return <p className="p-4">Loading dashboard…</p>;
  if (error)   return <p className="p-4 text-destructive">Error: {error}</p>;
  if (!community) return <p className="p-4">No such community.</p>;

  const membersCount  = community.members.length;
  const projectsCount = community.projects.length;
  const tasksCount    = community.projects.flatMap((p) => p.tasks).length;

  return (
    <div className="container space-y-10 py-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">
          {community.name} <span className="text-muted-foreground">Dashboard</span>
        </h1>
      </header>

      <StatCards
        balance    ={myBalance}
        allocation ={myAllocation}
        members    ={membersCount}
        projects   ={projectsCount}
        tasks      ={tasksCount}
      />

      <div className="grid gap-8 lg:grid-cols-2">
        <MembersWidget members={community.members} />

        <div className="space-y-8">
          <ProjectsWidget projects={community.projects} />
          <TasksWidget tasks={community.projects.flatMap((p) => p.tasks)} />
        </div>
      </div>
    </div>
  );
}
