import { NextResponse } from "next/server";
import { prisma, safeJson } from "@/lib/prisma";
import { MemberRole } from "@prisma/client";

export async function POST(
  req: Request,
  ctx: { params: { communityId: string } }
) {
  try {
    const { amount, address } = await req.json(); // amount = whole tokens
    if (!amount || !address) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const valueStr = BigInt(amount).toString(); // ← no *10**18

    // Caller must be Owner
    const member = await prisma.member.findFirst({
      where: { communityId: ctx.params.communityId, user: { address } },
      select: { role: true },
    });
    if (!member || member.role !== MemberRole.Owner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Increment community balance
    const community = await prisma.community.update({
      where: { id: ctx.params.communityId },
      data: { balance: { increment: valueStr } },
      select: { id: true, balance: true },
    });

    return NextResponse.json(safeJson(community), { status: 200 });
  } catch (err) {
    console.error("mint error", err);
    return NextResponse.json({ error: "Internal" }, { status: 500 });
  }
}
