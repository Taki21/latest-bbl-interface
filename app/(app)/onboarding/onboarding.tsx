// File: app/(app)/onboarding/onboarding.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter }            from "next/navigation";
import { useAccount, useWalletClient } from "wagmi";
import { Building2, Rocket }    from "lucide-react";
import WelcomePage              from "./welcome";
import GetStartedPage           from "./get-started";
import { usePrivy }             from "@privy-io/react-auth";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Community {
  id: string;
  name: string;
  joinCode: string | null;
}
interface RawUserResponse {
  id: string;
  name: string;
  email: string | null;
  address: string;
  // could be one or the other:
  communities?: Community[];
  members?: { community: Community }[];
}
interface UserObj {
  id: string;
  name: string;
  email: string | null;
  address: string;
  communities: Community[];
}

export default function Onboarding() {
  const { address, isConnected } = useAccount();
  const { data: walletClient }   = useWalletClient();
  const { user: privyUser }      = usePrivy();
  const router                   = useRouter();

  // ─── Hooks (no conditional) ───────────────────────────────────────
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true) }, []);

  const [loading, setLoading]               = useState(true);
  const [user, setUser]                     = useState<UserObj | null>(null);
  const [showGetStarted, setShowGetStarted] = useState(false);

  useEffect(() => {
    if (!isConnected || !walletClient || !address) return;

    (async () => {
      try {
        // ensure user record exists
        const profile = privyUser;
        if (profile) {
          await fetch("/api/user/create", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({
              name:    profile.name,
              email:   profile.email,
              address,
            }),
          });
        }

        // fetch the raw user JSON
        const res = await fetch(`/api/user/get?address=${address}`);
        if (!res.ok) throw new Error("Failed to load user");
        const raw: RawUserResponse = await res.json();

        // normalize to communities[]
        let comms: Community[] = [];
        if (Array.isArray(raw.communities)) {
          comms = raw.communities;
        } else if (Array.isArray(raw.members)) {
          comms = raw.members.map((m) => m.community);
        }

        setUser({
          id:          raw.id,
          name:        raw.name,
          email:       raw.email,
          address:     raw.address,
          communities: comms,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [isConnected, walletClient, address, privyUser]);

  // ─── Early returns ───────────────────────────────────────────────
  if (!mounted) return null;
  if (!isConnected) return null;
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="animate-pulse text-muted-foreground">Loading…</p>
      </div>
    );
  }
  if (showGetStarted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <GetStartedPage />
      </div>
    );
  }

  // now we have user
  const communities = user?.communities ?? [];
  if (communities.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <WelcomePage setGetStarted={setShowGetStarted} />
      </div>
    );
  }

  // ─── return grid of community cards ──────────────────────────────
  return (
    <div className="relative isolate min-h-screen overflow-x-hidden bg-background/80 pt-16 lg:pt-24">
      {/* background blur */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[-1] h-[380px] overflow-hidden">
        <div className="mx-auto h-full max-w-7xl px-4 lg:px-6">
          <div className="aspect-[3/1] w-full rounded-full bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 blur-3xl" />
        </div>
      </div>

      {/* hero */}
      <header className="mx-auto max-w-3xl px-4 text-center lg:px-0">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
          Welcome back{user?.name ? `, ${user.name}` : ""}!
        </h1>
        <p className="mt-3 text-muted-foreground lg:text-lg">
          These are your communities — jump in or continue onboarding.
        </p>
      </header>

      {/* communities grid */}
      <main className="mx-auto mt-12 grid max-w-7xl gap-12 px-4 lg:mt-16 lg:px-6">
        <section>
          <h2 className="mb-4 text-xl font-semibold">Your Communities</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {communities.map((c) => (
              <CommunityCard key={c.id} community={c} />
            ))}
          </div>
        </section>
        <section className="mx-auto flex flex-col items-center gap-4">
          {/* <Rocket className="h-9 w-9 text-primary animate-bounce-slow" /> */}
          <Button size="lg" onClick={() => setShowGetStarted(true)}>
            Join a Community
          </Button>
        </section>
      </main>
    </div>
  );
}

function CommunityCard({ community }: { community: Community }) {
  return (
    <Card className="group relative overflow-hidden rounded-2xl shadow-lg shadow-primary/10 transition hover:shadow-primary/30">
      <span className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-br from-primary/40 to-secondary/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <a
        href={`/${community.id}/dashboard`}
        className="relative block h-full rounded-2xl p-6"
      >
        <CardHeader className="flex-row items-center gap-4 p-0 pb-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-muted transition group-hover:scale-110">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="leading-snug">{community.name}</CardTitle>
            {community.joinCode && (
              <CardDescription className="text-xs">
                Code • {community.joinCode}
              </CardDescription>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0 pt-4">
          <Button size="sm" variant="outline">
            Open
          </Button>
        </CardContent>
      </a>
    </Card>
  );
}
