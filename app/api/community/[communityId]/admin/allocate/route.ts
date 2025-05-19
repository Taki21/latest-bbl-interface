import { NextResponse } from "next/server";
import { prisma, safeJson } from "@/lib/prisma";
import { MemberRole } from "@prisma/client";

export async function POST(
  req: Request,
  ctx: { params: { communityId: string } }
) {
  try {
    const { recipientId, amount, address } = await req.json(); // amount = whole tokens
    if (!recipientId || !amount || !address) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const value = BigInt(amount).toString();

    // 1) Caller must be Owner
    const caller = await prisma.member.findFirst({
      where: { communityId: ctx.params.communityId, user: { address } },
      select: { role: true },
    });
    if (!caller || caller.role !== MemberRole.Owner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // 2) Recipient must be Professor or TeamLeader
    const recipient = await prisma.member.findUnique({
      where: { id: recipientId },
      select: { id: true, role: true, communityId: true },
    });
    if (
      !recipient ||
      recipient.communityId !== ctx.params.communityId ||
      (recipient.role !== MemberRole.Professor &&
        recipient.role !== MemberRole.TeamLeader)
    ) {
      return NextResponse.json({ error: "Invalid recipient" }, { status: 400 });
    }

    // 3) Check community has enough balance
    const community = await prisma.community.findUnique({
      where: { id: ctx.params.communityId },
      select: { balance: true },
    });
    if (!community || community.balance < BigInt(value)) {
      return NextResponse.json(
        { error: "Insufficient community balance" },
        { status: 400 }
      );
    }

    // 4) Transaction: decrement community.balance + create Allocation
    const [updatedCommunity, allocation] = await prisma.$transaction([
      prisma.community.update({
        where: { id: ctx.params.communityId },
        data: { balance: { decrement: value } },
        select: { id: true, balance: true },
      }),
      prisma.allocation.create({
        data: {
          community: { connect: { id: ctx.params.communityId } },
          member: { connect: { id: recipientId } },
          amount: BigInt(amount),
        },
      }),
    ]);

    return NextResponse.json(
      safeJson({ community: updatedCommunity, allocation }),
      { status: 200 }
    );
  } catch (err) {
    console.error("allocate error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
