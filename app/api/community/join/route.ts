import { NextResponse } from "next/server";
import { prisma, safeJson } from "@/lib/prisma";
import { MemberRole } from "@prisma/client";

/**
 * =============================================================================
 *  POST /api/community/join
 *
 *  Body JSON → { joinCode: string; address: string }
 *
 *  • Looks up Community by joinCode (case‑insensitive).
 *  • Finds User by wallet address.
 *  • Creates Member row (role Default) if not already present.
 *  • Returns the Community JSON (bigint‑safe).
 * =============================================================================
 */
export async function POST(req: Request) {
  try {
    const { joinCode, address, name } = await req.json();

    if (!joinCode || !address || !name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const code = joinCode.toLowerCase();

    // ── Fetch community ───────────────────────────────────────────────────
    const community = await prisma.community.findFirst({
      where: { joinCode: code },
    });

    if (!community) {
      return NextResponse.json({ error: "Invalid join code" }, { status: 404 });
    }

    // ── Fetch user by wallet address ──────────────────────────────────────
    const user = await prisma.user.findUnique({ where: { address }, select: { id: true } });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ── Check membership ──────────────────────────────────────────────────
    const existing = await prisma.member.findFirst({
      where: { userId: user.id, communityId: community.id },
    });

    if (!existing) {
      await prisma.member.create({
        data: {
          userId: user.id,
          communityId: community.id,
          balance: BigInt(0),
          role: MemberRole.Default,
          name,
        },
      });
    } else if (!existing.name) {
      await prisma.member.update({
        where: { id: existing.id },
        data: { name },
      });
    }

    return NextResponse.json(safeJson(community), { status: 200 });
  } catch (err) {
    console.error("/api/community/join error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
