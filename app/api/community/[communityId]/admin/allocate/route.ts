// File: app/api/community/[communityId]/admin/allocate/route.ts

import { NextResponse } from "next/server";
import { prisma, safeJson } from "@/lib/prisma";
import { MemberRole } from "@prisma/client";

export async function POST(
  req: Request,
  { params }: { params: { communityId: string } }
) {
  const { communityId } = params;

  try {
    const { recipientId, amount, address } = await req.json();
    if (!recipientId || !amount || !address) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const value = BigInt(amount);

    // 1) Caller must be Owner
    const caller = await prisma.member.findFirst({
      where: { communityId, user: { address } },
      select: { role: true },
    });
    if (!caller || caller.role !== MemberRole.Owner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // 2) Recipient must be Professor or Team Leader
    const recipient = await prisma.member.findUnique({
      where: { id: recipientId },
      select: { role: true, communityId: true },
    });
    if (
      !recipient ||
      recipient.communityId !== communityId ||
      (recipient.role !== MemberRole.Professor &&
        recipient.role !== MemberRole.Team_Leader)
    ) {
      return NextResponse.json({ error: "Invalid recipient" }, { status: 400 });
    }

    // 3) Check community has enough balance
    const community = await prisma.community.findUnique({
      where: { id: communityId },
      select: { balance: true },
    });
    if (!community || community.balance < value) {
      return NextResponse.json(
        { error: "Insufficient community balance" },
        { status: 400 }
      );
    }

    // 4) Transaction: decrement community.balance + increment member.allocation
    const [updatedCommunity, updatedMember] = await prisma.$transaction([
      prisma.community.update({
        where: { id: communityId },
        data: { balance: { decrement: value.toString() } },
        select: { id: true, balance: true },
      }),
      prisma.member.update({
        where: { id: recipientId },
        data: {
          allocation: { increment: value.toString() },
        },
        select: { id: true, allocation: true },
      }),
    ]);

    return NextResponse.json(
      safeJson({
        community: updatedCommunity,
        member: updatedMember,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("allocate error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
