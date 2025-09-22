// app/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ModeToggle } from "@/components/ToggleTheme"; // your light/dark switch
import { useRouter } from "next/navigation";
import { usePrivy, useLogin } from "@privy-io/react-auth";
import { useEffect } from "react";

export default function LandingPage() {
  const router = useRouter();
  const { ready, authenticated } = usePrivy();

  const { login } = useLogin({
    onComplete: () => router.push("/onboarding"),
    onError: (err) => console.error("Privy login failed:", err),
  });

  useEffect(() => {
    if (ready && authenticated) router.push("/onboarding");
  }, [ready, authenticated, router]);

  const disabled = !ready || (ready && authenticated);

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900 dark:bg-black dark:text-gray-100">
      {/* Header */}
      <header className="container mx-auto flex justify-between items-center py-6">
        <h1 className="text-3xl font-extrabold">Commputation</h1>
        <div className="flex items-center space-x-4">
          <ModeToggle />
          <Button variant="outline" onClick={() => login()} disabled={disabled}>Log in</Button>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-grow flex flex-col items-center justify-center text-center px-4">
        <h2 className="mt-16 text-5xl font-extrabold mb-4 text-gray-900 dark:text-gray-100">
          Build and Incentivize Your Communities
        </h2>
        <p className="text-xl text-gray-700 dark:text-gray-300 max-w-2xl mb-8">
          Create on-chain communities with token-based governance, track projects & tasks,
          and manage your treasury—all in one platform.
        </p>
        <Button size="lg" onClick={() => login()} disabled={disabled}>Get Started</Button>
      </main>

      <Separator className="my-16 border-gray-200 dark:border-gray-700" />

      {/* Features */}
      <section className="container mx-auto grid gap-6 md:grid-cols-3 px-4 pb-16">
        <Card className="">
          <CardHeader>
            <CardTitle className="text-lg">Community Management</CardTitle>
          </CardHeader>
          <CardContent className="">
            Invite members, assign roles, and set up your governance. Every member is
            on-chain from day one.
          </CardContent>
        </Card>

        <Card className="">
          <CardHeader>
            <CardTitle className="text-lg">Projects & Tasks</CardTitle>
          </CardHeader>
          <CardContent className="">
            Plan projects, delegate tasks, and allocate tokens as bounties to drive
            collaboration.
          </CardContent>
        </Card>

        <Card className="">
          <CardHeader>
            <CardTitle className="text-lg">Token Treasury</CardTitle>
          </CardHeader>
          <CardContent className="">
            Mint tokens, manage budgets, and allocate funds to projects or members with
            full transparency.
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="text-center text-sm text-gray-500 dark:text-gray-400 py-6">
        © {new Date().getFullYear()} Commputation. All rights reserved.
      </footer>
    </div>
  );
}
