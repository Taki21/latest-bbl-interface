import { NextResponse } from "next/server";
import { prisma, safeJson } from "@/lib/prisma";
import { MemberRole } from "@prisma/client";

export async function POST(
  req: Request,
  ctx: { params: { communityId: string } }
) {
  try {
    const { memberId, newRole, address } = await req.json();
    if (!memberId || !newRole || !address) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Only Owner or Professor can change roles
    const caller = await prisma.member.findFirst({
      where: {
        communityId: ctx.params.communityId,
        user: { address },
      },
      select: { role: true },
    });
    if (
      !caller ||
      (caller.role !== MemberRole.Owner &&
        caller.role !== MemberRole.Professor)
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Can't change your own role
    const target = await prisma.member.findUnique({
      where: { id: memberId },
      select: { user: { select: { address: true } }, communityId: true },
    });
    if (
      !target ||
      target.communityId !== ctx.params.communityId ||
      target.user.address.toLowerCase() === address.toLowerCase()
    ) {
      return NextResponse.json(
        { error: "Invalid target or cannot change own role" },
        { status: 400 }
      );
    }

    // Update role
    const updated = await prisma.member.update({
      where: { id: memberId },
      data: { role: newRole as MemberRole },
      select: {
        id: true,
        role: true,
        user: { select: { id: true, name: true, address: true, email: true } },
      },
    });

    return NextResponse.json(safeJson(updated), { status: 200 });
  } catch (err) {
    console.error("changeRole error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
