"use client";

import { useEffect, useState } from "react";
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
import { Button } from "@/components/ui/button";

// interface DappLayoutProps {
//   children: React.ReactNode;
// }

export default function DappLayout({ children }) {
  const { isConnected, address } = useAccount();
  const { ready, authenticated } = usePrivy();
  const router = useRouter();
  const params = useParams();
  const communityId = (params?.communityId) ?? "";
  const [profileIncomplete, setProfileIncomplete] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    if (!communityId || !address) return;
    let cancelled = false;
    fetch(`/api/community/${communityId}/members`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.members)
          ? data.members
          : [];
        const me = list.find((member) =>
          member.user?.address?.toLowerCase() === address.toLowerCase()
        );
        setProfileIncomplete(!me?.memberTags?.length);
      })
      .catch(() => setProfileIncomplete(false));
    return () => {
      cancelled = true;
    };
  }, [communityId, address]);

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

  const showBanner = profileIncomplete && !bannerDismissed;
  const settingsHref = communityId ? `/${communityId}/settings` : "/";

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
        {showBanner && (
          <div className="px-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <div className="flex-1">
                <p className="font-medium">Complete your profile</p>
                <p className="text-xs text-amber-900/80">
                  Add education, major, and a short bio so teammates know who you are.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => router.push(settingsHref)}
                >
                  Go to settings
                </Button>
                <button
                  type="button"
                  className="text-xs text-amber-900/70 hover:text-amber-900"
                  onClick={() => setBannerDismissed(true)}
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
