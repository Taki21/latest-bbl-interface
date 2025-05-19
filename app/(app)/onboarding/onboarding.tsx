"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useConnect, useDisconnect, useWalletClient } from "wagmi";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FaApple, FaGoogle } from "react-icons/fa";
import GetStartedPage from "./get-started";
import WelcomePage from "./welcome";
import { useWeb3Auth } from "@/context/Web3AuthContext";

export default function Onboarding() {
  const router = useRouter();

  const { address, connector, isConnected } = useAccount();
  const { connect, connectors, error } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: walletClient } = useWalletClient();
  const web3Auth = useWeb3Auth();

  const [getStarted, setGetStarted] = useState(false);

  useEffect(() => {
    const getUserInfo = async () => {
      let userInfo: { name?: string; email?: string } | null = null;

      try {
        userInfo = await web3Auth?.getUserInfo();
      } catch (e) {
        console.log(
          "Cannot get userInfo first time, likely web3Auth not fully updated"
        );
      }
      console.log("/onboarding, userInfo", userInfo);

      if (userInfo) {
        const { name, email } = userInfo;

        /* ------------------------------------------------------------------
         *  Send a POST request to /api/user/create with name, email, address
         * ------------------------------------------------------------------ */
        try {
          const res = await fetch("/api/user/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name,
              email,
              address, // wallet address from wagmi
            }),
          });

          if (!res.ok) {
            const text = await res.text();
            console.error("Failed to create user:", text);
            return;
          }

          const createdUser = await res.json();
          console.log("User created (or already exists):", createdUser);

          // If creation succeeds, take the user to the next step
          setGetStarted(true);
        } catch (err) {
          console.error("Error creating user:", err);
        }
      }
    };

    if (walletClient) {
      getUserInfo();
    }
  }, [walletClient, address, web3Auth]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      {getStarted ? (
        <GetStartedPage />
      ) : (
        <WelcomePage setGetStarted={setGetStarted} />
      )}
    </div>
  );
}