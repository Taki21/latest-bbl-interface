// File: app/api/community/[communityId]/admin/changeRole/route.ts

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

    // ── 1) Validate role ────────────────────────────────────────────────
    const enumValue = (MemberRole as Record<string, MemberRole>)[newRole];
    if (!enumValue) {
      return NextResponse.json(
        {
          error: `Invalid role. Must be one of ${Object.keys(MemberRole).join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

    // ── 2) Caller must be Owner or Supervisor ────────────────────────────
    const caller = await prisma.member.findFirst({
      where: {
        communityId: ctx.params.communityId,
        user: { address },
      },
      select: { role: true },
    });
    if (
      !caller ||
      (caller.role !== MemberRole.Owner && caller.role !== MemberRole.Supervisor)
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // ── 3) Prevent self-change & validate target ────────────────────────
    const target = await prisma.member.findUnique({
      where: { id: memberId },
      select: {
        communityId: true,
        user: { select: { address: true } },
      },
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

    // ── 4) Update using the enum constant ───────────────────────────────
    const updated = await prisma.member.update({
      where: { id: memberId },
      data: { role: enumValue },
      select: {
        id: true,
        role: true,
        user: { select: { id: true, name: true, address: true, email: true } },
      },
    });

    return NextResponse.json(safeJson(updated), { status: 200 });
  } catch (err) {
    console.error("changeRole error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
