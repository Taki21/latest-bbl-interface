"use client";

import React, { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useWeb3Auth } from "@/context/Web3AuthContext";
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
  const web3Auth = useWeb3Auth();

  const [user, setUser] = useState({
    name: "Guest",
    email: "",
    avatar: "",
  });
  const [role, setRole] = useState<string | null>(null);

  // Load web3Auth profile for avatar
  useEffect(() => {
    async function loadProfile() {
      try {
        const info = await web3Auth?.getUserInfo();
        if (info) {
          setUser({
            name: info.name || "Anonymous",
            email: info.email || "",
            avatar: info.profileImage || "",
          });
        }
      } catch {
        // ignore
      }
    }
    loadProfile();
  }, [walletClient, web3Auth]);

  // Fetch my community role
  useEffect(() => {
    if (!communityId || !address) return;
    fetch(`/api/community/${communityId}/members`)
      .then((r) => r.json())
      .then((members: any[]) => {
        const me = members.find(
          (m) => m.user.address.toLowerCase() === address.toLowerCase()
        );
        setRole(me?.role ?? null);
      })
      .catch(console.error);
  }, [communityId, address]);

  const isOwner = role === "Owner";

  // Primary nav
  const navMain: NavItem[] = [
    { title: "Dashboard", url: `/${communityId}/dashboard`, icon: React.Fragment },
    { title: "Projects",  url: `/${communityId}/projects`,  icon: React.Fragment },
    { title: "Members",   url: `/${communityId}/members`,   icon: React.Fragment },
  ];

  // Treasury link for Owners only
  const navProjects: ProjectNav[] = isOwner
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
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
