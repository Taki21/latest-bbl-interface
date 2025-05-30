// File: components/team-switcher.tsx
"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { ChevronsUpDown, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAccount } from "wagmi";
import { useRouter }  from "next/navigation";

interface Community {
  id: string;
  name: string;
  joinCode: string;
}

interface UserMember {
  community: Community;
}

interface UserResponse {
  members: UserMember[];
}

interface Team {
  id: string;
  name: string;
  plan: string;
  logo: React.ComponentType<any>;
}

export function TeamSwitcher() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const { isMobile } = useSidebar();

  const [teams, setTeams]           = useState<Team[]>([]);
  const [activeTeam, setActiveTeam] = useState<Team | null>(null);

  // Fetch once on mount
  useEffect(() => {
    if (!isConnected || !address) return;

    fetch(`/api/user/get?address=${address}`)
      .then((res) => res.json())
      .then((data: UserResponse) => {
        const mapped: Team[] = data.members.map(({ community }) => ({
          id:   community.id,
          name: community.name,
          plan: community.joinCode ?? "",
          logo: ChevronsUpDown,
        }));

        setTeams(mapped);

        // set an in-memory default if nothing selected yet
        if (!activeTeam && mapped.length) {
          setActiveTeam(mapped[0]);
        }
      })
      .catch(console.error);
  }, [isConnected, address]);

  // nothing to render until we've loaded teams
  if (!isConnected || !activeTeam) {
    return null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <activeTeam.logo className="h-4 w-4" />
              </div>
              <div className="ml-2 flex-1 text-left text-sm leading-tight">
                <div className="truncate font-semibold">{activeTeam.name}</div>
                <div className="truncate text-xs">{activeTeam.plan}</div>
              </div>
              <ChevronsUpDown className="ml-auto h-4 w-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-[14rem] rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="px-3 pt-2 text-xs text-muted-foreground">
              Communities
            </DropdownMenuLabel>

            {teams.map((team, idx) => (
              <DropdownMenuItem
                key={team.id}
                onClick={() => {
                  setActiveTeam(team);
                  router.push(`/${team.id}/dashboard`);
                }}
                className="flex items-center gap-2 px-3 py-2 text-sm"
              >
                <team.logo className="h-4 w-4" />
                {team.name}
                <DropdownMenuShortcut>⌘{idx + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator className="my-1" />

            <DropdownMenuItem className="flex items-center gap-2 px-3 py-2 text-sm">
              <Plus className="h-4 w-4" />
              <span className="font-medium text-muted-foreground">
                Add community
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
