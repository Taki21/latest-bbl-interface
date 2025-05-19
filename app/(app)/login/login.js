"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FaApple, FaGoogle } from "react-icons/fa";

export default function LoginPage() {
  const router = useRouter();

  const { address, connector, isConnected } = useAccount();
  const { connect, connectors, error } = useConnect();
  const { disconnect } = useDisconnect();

  const signInWithGoogle = () => {
    const googleConnector = connectors[0];
    console.log(googleConnector);
    connect({ connector: googleConnector });
  };

  const signInWithApple = () => {
    const appleConnector = connectors[1];
    console.log(appleConnector);
    connect({ connector: appleConnector });
  }

  useEffect(() => {
    if (isConnected) {
      router.push("/onboarding");
    }
  }, [isConnected, router]);

  return (
    <div className="flex flex-col lg:flex-row h-screen justify-center">
      {/* Left Side */}
      <div className="hidden lg:w-1/2 bg-[#18181B] text-white lg:flex flex-col justify-between p-6 lg:p-10">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold">CommPutation</h1>
        </div>
        <blockquote className="mt-6 lg:mt-0">
          <p className="text-sm lg:text-lg">
            “Some Random Quote Here.”
          </p>
          <footer className="mt-4 text-sm lg:text-base">Some Human</footer>
        </blockquote>
      </div>

      {/* Right Side */}
      <div className="lg:w-1/2 flex flex-col items-center justify-center p-6 lg:p-10 space-y-6">

        <div className="w-full max-w-md space-y-1 text-center">
          <h2 className="text-xl lg:text-2xl font-bold">Welcome to CommPutation!</h2>
          <p className="text-sm lg:text-base text-muted-foreground">
            Sign in with your Google account to continue.
          </p>
        </div>

        <div className="w-full max-w-md space-y-6 text-center">
          <div className="space-y-3">
            <Button
              onClick={() => signInWithGoogle()}
              className="w-full bg-primary text-foreground py-3"
            >
              <FaGoogle />
              Login With Google
            </Button>
            <Button
              onClick={() => signInWithApple()}
              className="w-full bg-foreground text-background py-3"
            >
              <FaApple />
              Login With Apple
            </Button>
          </div>
          <p className="text-xs lg:text-sm text-muted-foreground px-8">
            By signing up with CommPutation, you agree to our{" "}
            <Link href="/terms" className="underline underline-offset-4">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline underline-offset-4">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
