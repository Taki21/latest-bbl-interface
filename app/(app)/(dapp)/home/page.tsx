"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";

import Link from "next/link";
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

interface UserResponse {
  id: string;
  name: string;
  email: string | null;
  address: string;
  communities: Community[];
}

export default function HomePage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();

  const [data, setData]         = useState<UserResponse | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  /* redirect to /login when wallet disconnected */
  useEffect(() => {
    if (!isConnected) router.push("/login");
  }, [isConnected, router]);

  /* fetch user + communities */
  useEffect(() => {
    if (!isConnected || !address) return;

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetch(`/api/user/get?address=${address}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) {
          const { error } = await res.json();
          throw new Error(error || "Failed to load");
        }
        return res.json();
      })
      .then(setData)
      .catch((err) => {
        if (err.name !== "AbortError") setError(err.message);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [isConnected, address]);

  /* ───────────────────────────────────────── UI */

  if (!isConnected) return null;

  if (loading) {
    return <p className="p-4">Loading communities…</p>;
  }

  if (error) {
    return (
      <div className="p-4 text-destructive">
        <p>Error: {error}</p>
        <Button variant="outline" onClick={() => location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  const communities = data?.communities ?? [];

  return (
    <div className="container py-8 space-y-6">
      <h1 className="text-2xl font-bold">Your Communities</h1>

      {communities.length === 0 ? (
        <p>You’re not a member of any community yet.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {communities.map((c) => (
            <CommunityCard key={c.id} community={c} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ——————————————————————————————— subcomponent ——————————————————————————— */

function CommunityCard({ community }: { community: Community }) {
  return (
    <Card asChild>
      <Link href={`/${community.id}/dashboard`} className="block hover:shadow">
        <CardHeader>
          <CardTitle>{community.name}</CardTitle>
          {community.joinCode && (
            <CardDescription>Code: {community.joinCode}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Click to open dashboard
          </p>
        </CardContent>
      </Link>
    </Card>
  );
}
