"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAccount } from "wagmi";
import { usePrivy } from "@privy-io/react-auth";
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

// interface DappLayoutProps {
//   children: React.ReactNode;
// }

export default function DappLayout({ children }) {
  const { isConnected } = useAccount();
  const { ready, authenticated } = usePrivy();
  const router = useRouter();
  const params = useParams();
  const communityId = (params?.communityId) ?? "";

  // Redirect to landing only once Privy is ready and user is not authenticated
  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/");
    }
  }, [ready, authenticated, router]);

  // Wait for Privy to initialize; avoid premature redirect loops
  if (!ready) return null;
  if (!authenticated) return null;
  // Hide content until wallet reconnects; Wagmi auto-reconnect is enabled in Providers
  if (!isConnected) return null;

  return (
    <SidebarProvider>
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
            <MiniBalance communityId={communityId} />
            <WalletButton />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
