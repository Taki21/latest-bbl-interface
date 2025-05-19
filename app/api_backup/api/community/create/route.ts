import { NextResponse } from "next/server";
import { prisma, safeJson } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { MemberRole } from "@prisma/client";

/**
 * =============================================================================
 *  POST /api/community/create
 *
 *  Body JSON → {
 *    name: string;
 *    description?: string;
 *    affiliation?: string;
 *    tokenName: string;
 *    tokenSymbol: string;
 *    newMemberReward?: number;
 *    referralReward?: number;
 *    creatorAddress: string;
 * }
 *
 *  • Finds the creator by wallet address.
 *  • Creates Community, then inserts creator as first Member (Owner).
 *  • Returns the Community JSON (bigint-safe).
 * =============================================================================
 */
export async function POST(req: Request) {
  try {
    const {
      name,
      description,
      affiliation,
      tokenName,
      tokenSymbol,
      newMemberReward = 0,
      referralReward = 0,
      creatorAddress,
    } = await req.json();

    if (!name || !tokenName || !tokenSymbol || !creatorAddress) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // ── Lookup creator user by wallet address ─────────────────────────────
    const creator = await prisma.user.findUnique({
      where: { address: creatorAddress },
      select: { id: true },
    });

    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    // ── Create Community first ────────────────────────────────────────────
    const community = await prisma.community.create({
      data: {
        joinCode: randomBytes(4).toString("hex"), // 8‑char code
        name,
        description,
        affiliation,
        tokenName,
        tokenSymbol,
        newMemberReward,
        referralReward,
        balance: BigInt(0),
        creatorId: creator.id,
      },
    });

    // ── Add creator as a Member (role Owner) ──────────────────────────────
    await prisma.member.create({
      data: {
        userId: creator.id,
        communityId: community.id,
        balance: BigInt(0),
        role: MemberRole.Owner,
      },
    });

    return NextResponse.json(safeJson(community), { status: 201 });
  } catch (err) {
    console.error("/api/community/create error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
