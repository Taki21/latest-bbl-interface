import { NextResponse } from "next/server";
import { prisma, safeJson } from "@/lib/prisma";

/**
 * =============================================================================
 *  POST /api/user/create
 *
 *  Body JSON → { name?: string; email: string; address: string }
 *
 *  • If a user with the given **address** already exists, return that user
 *    unchanged (idempotent).
 *  • Otherwise create a fresh User row (address + email are UNIQUE).
 *  • Returns bigint‑safe JSON representation of the user.
 * =============================================================================
 */
export async function POST(req: Request) {
  try {
    const { name, email, address } = await req.json();

    if (!email || !address) {
      return NextResponse.json(
        { error: "Missing required fields: email and address" },
        { status: 400 }
      );
    }

    // ── Lookup by wallet address (primary idempotency key) ────────────────
    const existing = await prisma.user.findUnique({ where: { address } });

    if (existing) {
      console.log("[user/create] address already exists → returning existing user", { address });
      return NextResponse.json(safeJson(existing), { status: 200 });
    }

    // ── Create new user (address not found) ───────────────────────────────
    console.log("[user/create] creating new user", { email, address });

    const user = await prisma.user.create({
      data: {
        name,
        email,
        address,
        balance: BigInt(0),
      },
    });

    return NextResponse.json(safeJson(user), { status: 201 });
  } catch (err: any) {
    // Handle unique‑constraint collisions gracefully
    if (err.code === "P2002") {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 409 }
      );
    }

    console.error("/api/user/create error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
