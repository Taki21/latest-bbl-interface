// File: app/api/community/[communityId]/members/route.ts
import { NextResponse } from "next/server";
import { prisma, safeJson } from "@/lib/prisma";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ communityId: string }> }
) {
  // ✅ Await the params promise before using it
  const { communityId } = await ctx.params;

  try {
    // Fetch each member's core info plus their current allocation
    const raw = await prisma.member.findMany({
      where: { communityId },
      select: {
        id:         true,
        role:       true,
        balance:    true,
        allocation: true,      // BigInt field on Member
        user: {
          select: {
            id:      true,
            name:    true,
            address: true,
            email:   true,
          },
        },
      },
      orderBy: { role: "asc" },
    });

    // Return JSON–safe data
    const members = raw.map((m) => ({
      id:         m.id,
      role:       m.role,
      balance:    m.balance,      // BigInt
      allocation: m.allocation,   // BigInt
      user:       m.user,
    }));

    return NextResponse.json(safeJson(members), { status: 200 });
  } catch (err) {
    console.error("GET /api/community/[communityId]/members error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
