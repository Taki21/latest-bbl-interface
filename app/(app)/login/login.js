"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePrivy, useLogin } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function LoginPage() {
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
    <div className="flex flex-col lg:flex-row h-screen justify-center">
      {/* Left Side */}
      <div className="hidden lg:w-1/2 bg-[#18181B] text-white lg:flex flex-col justify-between p-6 lg:p-10">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold">CommPutation</h1>
        </div>
        <blockquote className="mt-6 lg:mt-0">
          <p className="text-sm lg:text-lg">“Some Random Quote Here.”</p>
          <footer className="mt-4 text-sm lg:text-base">Some Human</footer>
        </blockquote>
      </div>

      {/* Right Side */}
      <div className="lg:w-1/2 flex flex-col items-center justify-center p-6 lg:p-10 space-y-6">
        <div className="w-full max-w-md space-y-1 text-center">
          <h2 className="text-xl lg:text-2xl font-bold">Welcome to CommPutation!</h2>
          <p className="text-sm lg:text-base text-muted-foreground">
            Continue to sign in.
          </p>
        </div>

        <div className="w-full max-w-md space-y-6 text-center">
          <Button onClick={() => login({ loginMethods: ["google", "apple", "email", "wallet"] })}>
            Continue
          </Button>
          <p className="text-xs lg:text-sm text-muted-foreground px-8">
            By signing up with CommPutation, you agree to our{" "}
            <Link href="/terms" className="underline underline-offset-4">Terms of Service</Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline underline-offset-4">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
