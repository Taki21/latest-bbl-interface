"use client";

import { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAccount } from "wagmi";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import WalletButton from "@/components/Wallet";
import { ModeToggle } from "@/components/ToggleTheme";
import MiniBalance from "@/components/MiniBalance";

/* ---- TEMP: tell TS that SidebarProvider is a component accepting children -- */
const TypedSidebarProvider =
  SidebarProvider as unknown as React.ComponentType<{
    children: ReactNode;
  }>;
/* ------------------------------------------------------------------------- */

interface DappLayoutProps {
  children: React.ReactNode;
}

export default function DappLayout({ children }: DappLayoutProps) {
  const { isConnected } = useAccount();
  const router = useRouter();
  const params = useParams();
  const communityId = (params?.communityId as string) ?? "";

  useEffect(() => {
    if (!isConnected) {
      router.push("/login");
    }
  }, [isConnected, router]);

  if (!isConnected) return null;

  return (
    <TypedSidebarProvider>
      <AppSidebar communityId={communityId} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 justify-between pr-4">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">Platform</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Dashboard</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center gap-2">
            <ModeToggle />
            <MiniBalance />
            <WalletButton />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
      </SidebarInset>
    </TypedSidebarProvider>
  );
}
