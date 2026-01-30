// File: app/(app)/onboarding/onboarding.tsx
"use client";

import { FormEvent, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { Building2, Rocket } from "lucide-react";
import WelcomePage from "./welcome";
import GetStartedPage from "./get-started";
import { usePrivy } from "@privy-io/react-auth";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  communities?: Community[];
  members?: { community: Community }[];
}
interface ExistsResponse {
  exists: boolean;
  user?: RawUserResponse;
}
interface UserObj {
  id: string;
  name: string;
  email: string | null;
  address: string;
  communities: Community[];
}

function normalizeUser(raw: RawUserResponse): UserObj {
  const communities = Array.isArray(raw.communities)
    ? raw.communities
    : Array.isArray(raw.members)
      ? raw.members.map((m) => m.community)
      : [];

  return {
    id: raw.id,
    name: raw.name,
    email: raw.email,
    address: raw.address,
    communities,
  };
}

export default function Onboarding() {
  const { address, isConnected } = useAccount();
  const { user: privyUser } = usePrivy();
  const privyEmail = (privyUser as any)?.email?.address ?? privyUser?.email ?? privyUser?.google?.email ?? null;

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, [, privyEmail ]);

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserObj | null>(null);
  const [showGetStarted, setShowGetStarted] = useState(false);
  const [needsName, setNeedsName] = useState(false);
  const [nameSubmitting, setNameSubmitting] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [lookupNonce, setLookupNonce] = useState(0);

  useEffect(() => {
    if (!isConnected || !address || !privyUser || user) {
      if (!isConnected || !address || !privyUser) {
        setLoading(false);
      }
      return;
    }

    const email = privyEmail;
    if (!email) {
      console.log("No email found for Privy user:", privyUser);
      setNeedsName(false);
      setLoading(false);
      setApiError("We couldn't find an email for your account. Please reconnect and try again.");
      return;
    }

    let cancelled = false;

    const lookupUser = async () => {
      setLoading(true);
      setNeedsName(false);
      setNameError(null);
      setApiError(null);

      try {
        const params = new URLSearchParams({ email, address });
        const res = await fetch(`/api/user/exists?${params.toString()}`);
        const payload = await res.json().catch(() => ({}));

        if (!res.ok) {
          const message =
            payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
              ? payload.error
              : `Failed to verify user (status ${res.status})`;
          throw new Error(message);
        }

        console.log("User lookup response:", payload);

        if (cancelled) return;

        const data = payload as ExistsResponse;
        if (data.exists && data.user) {
          setUser(normalizeUser(data.user));
          setNeedsName(false);
        } else {
          setNeedsName(true);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setApiError(err instanceof Error ? err.message : "Failed to verify user");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    lookupUser();

    return () => {
      cancelled = true;
    };
  }, [isConnected, address, privyUser, privyEmail, user, lookupNonce]);

  const handleNameSubmit = async (submittedName: string) => {
    if (!privyEmail || !address) {
      setNameError("Missing account information. Please reconnect and try again.");
      return;
    }

    const trimmed = submittedName.trim();
    if (!trimmed) {
      setNameError("Please enter a name.");
      return;
    }

    setNameSubmitting(true);
    setNameError(null);

    try {
      const res = await fetch("/api/user/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmed,
          email: privyEmail,
          address,
        }),
      });

      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        const message =
          payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
            ? payload.error
            : "Failed to save your name";
        throw new Error(message);
      }

      const createdUser = normalizeUser(payload as RawUserResponse);
      setUser(createdUser);
      setNeedsName(false);
      setApiError(null);
    } catch (err) {
      console.error(err);
      setNameError(err instanceof Error ? err.message : "Failed to save your name");
    } finally {
      setNameSubmitting(false);
    }
  };

  const handleRetry = () => {
    setApiError(null);
    setLookupNonce((nonce) => nonce + 1);
  };

  if (!mounted || !isConnected) return null;

  if (apiError) {
    console.error("Onboarding error:", apiError);
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <Card className="w-full max-w-md border border-destructive/20 bg-destructive/5">
          <CardHeader>
            <CardTitle>Something went wrong</CardTitle>
            <CardDescription>{apiError}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-end">
            <Button onClick={handleRetry}>Try again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="animate-pulse text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (needsName) {
    return (
      <NameCaptureCard
        email={privyEmail ?? ""}
        defaultName={privyUser?.name ?? ""}
        submitting={nameSubmitting}
        error={nameError}
        onSubmit={handleNameSubmit}
      />
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Preparing your workspace…</p>
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

  const communities = user.communities;
  if (communities.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <WelcomePage setGetStarted={setShowGetStarted} />
      </div>
    );
  }

  return (
    <div className="relative isolate min-h-screen overflow-x-hidden bg-background/80 pt-16 lg:pt-24">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[-1] h-[380px] overflow-hidden">
        <div className="mx-auto h-full max-w-7xl px-4 lg:px-6">
          <div className="aspect-[3/1] w-full rounded-full bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 blur-3xl" />
        </div>
      </div>

      <header className="mx-auto max-w-3xl px-4 text-center lg:px-0">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
          Welcome back{user.name ? `, ${user.name}` : ""}!
        </h1>
        <p className="mt-3 text-muted-foreground lg:text-lg">
          These are your communities — jump in or continue onboarding.
        </p>
      </header>

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
          <Button size="lg" onClick={() => setShowGetStarted(true)}>
            Create or Join a Community
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

interface NameCaptureCardProps {
  email: string;
  defaultName?: string;
  submitting: boolean;
  error?: string | null;
  onSubmit: (name: string) => Promise<void> | void;
}

function NameCaptureCard({
  email,
  defaultName = "",
  submitting,
  error,
  onSubmit,
}: NameCaptureCardProps) {
  const [value, setValue] = useState(defaultName);

  useEffect(() => {
    setValue(defaultName);
  }, [defaultName]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit(value.trim());
  };

  const isDisabled = submitting || value.trim().length === 0;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/20 px-4">
      <Card className="w-full max-w-md border border-border/60 shadow-lg shadow-primary/10">
        <CardHeader className="space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Rocket className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-2xl">Welcome! What should we call you?</CardTitle>
            <CardDescription>
              We’ll use this name across BBL so teammates know who just joined.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Your name</Label>
              <Input
                id="name"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder="Ada Lovelace"
                autoComplete="name"
                autoFocus
                disabled={submitting}
              />
            </div>
            {email ? (
              <p className="text-xs text-muted-foreground">
                Signing in as <span className="font-medium">{email}</span>
              </p>
            ) : null}
            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : null}
            <Button type="submit" className="w-full" disabled={isDisabled}>
              {submitting ? "Saving…" : "Continue"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
