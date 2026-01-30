"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useParams, usePathname } from "next/navigation";
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
  const pathname = usePathname();
  const communityId = (params?.communityId) ?? "";
  const [profileIncomplete, setProfileIncomplete] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const breadcrumbs = useMemo(() => {
    const labelMap = {
      dashboard: "Dashboard",
      projects: "Projects",
      members: "Members",
      settings: "Settings",
      treasury: "Treasury",
      admin: "Admin",
    };

    const formatSegment = (segment) => {
      const decoded = decodeURIComponent(segment);
      const pretty = decoded.replace(/[-_]/g, " ");
      return pretty.replace(/\b\w/g, (char) => char.toUpperCase());
    };

    const segments = pathname ? pathname.split("/").filter(Boolean) : [];
    const startIndex =
      communityId && segments[0] === communityId ? 1 : 0;
    const routeSegments = segments.slice(startIndex);
    const items = [];

    let href = communityId ? `/${communityId}` : "";
    routeSegments.forEach((segment, index) => {
      href += `/${segment}`;
      const prevSegment = routeSegments[index - 1];
      const label = labelMap[segment]
        ? labelMap[segment]
        : formatSegment(segment);
      const isLast = index === routeSegments.length - 1;
      items.push({
        label: prevSegment === "projects" && segment.length > 20 ? "Project" : label,
        href: isLast ? null : href,
        isCurrent: isLast,
      });
    });

    return items;
  }, [communityId, pathname]);

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
                {breadcrumbs.map((crumb, index) => {
                  const isLast = index === breadcrumbs.length - 1;
                  const hideOnMobile = false;
                  return (
                    <Fragment key={`${crumb.label}-${index}`}>
                      <BreadcrumbItem className={hideOnMobile ? "hidden md:block" : undefined}>
                        {crumb.isCurrent || !crumb.href ? (
                          <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink asChild>
                            <Link href={crumb.href}>{crumb.label}</Link>
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                      {!isLast && (
                        <BreadcrumbSeparator className={hideOnMobile ? "hidden md:block" : undefined} />
                      )}
                    </Fragment>
                  );
                })}
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
