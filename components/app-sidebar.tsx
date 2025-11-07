"use client";

import React, { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { usePrivy } from "@privy-io/react-auth";
import { useWalletClient } from "wagmi";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "./team-switcher";
import { Coins } from "lucide-react";

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<any>;
}

interface ProjectNav {
  name: string;
  url: string;
  icon: React.ComponentType<any>;
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  communityId: string;
}

export function AppSidebar({ communityId, ...props }: AppSidebarProps) {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { user: privyUser } = usePrivy();

  const [user, setUser] = useState({
    name: "Guest",
    email: "",
    avatar: "",
  });
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    if (privyUser) {
      setUser({
        name: privyUser.name ?? privyUser?.google?.name ?? "User",
        email: privyUser.email ?? privyUser?.google?.email ?? "",
        avatar: privyUser.profilePictureUrl ?? privyUser?.google?.picture ?? "/avatars/shadcn.jpg",
      });
    }
  }, [privyUser, walletClient]);

  // Fetch my community role
  useEffect(() => {
    if (!communityId || !address) return;
    fetch(`/api/community/${communityId}/members`, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load members");
        return r.json();
      })
      .then((data: any) => {
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.members)
          ? data.members
          : Array.isArray(data?.data)
          ? data.data
          : [];
        const me = list.find(
          (m) => m.user.address.toLowerCase() === address.toLowerCase()
        );
        setRole(me?.role ?? null);
      })
      .catch(console.error);
  }, [communityId, address]);

  const isAdmin = role === "Owner" || role === "Supervisor";

  // Primary nav
  const navMain: NavItem[] = [
    { title: "Dashboard", url: `/${communityId}/dashboard`, icon: React.Fragment },
    { title: "Projects",  url: `/${communityId}/projects`,  icon: React.Fragment },
    { title: "Members",   url: `/${communityId}/members`,   icon: React.Fragment },
    { title: "Settings",  url: `/${communityId}/settings`,  icon: React.Fragment },
  ];

  // Treasury link for admins
  const navProjects: ProjectNav[] = isAdmin
    ? [{ name: "Treasury", url: `/${communityId}/treasury`, icon: Coins }]
    : [];

  // Bottom nav (always visible)
  const navBottom: NavItem[] = [
    { title: "Support", url: "#", icon: React.Fragment },
    { title: "Feedback", url: "#", icon: React.Fragment },
  ];

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>

      <SidebarContent className="space-y-4">
        <NavMain items={navMain} />
        {navProjects.length > 0 && <NavProjects projects={navProjects} />}

        <div className="mt-auto">
          <Separator />
          <NavSecondary items={navBottom} />
        </div>
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={user} communityId={communityId} />
      </SidebarFooter>
    </Sidebar>
  );
}
