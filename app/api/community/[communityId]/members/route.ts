// File: app/api/community/[communityId]/members/route.ts
import { NextResponse } from "next/server";
import { prisma, safeJson } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { communityId: string } }
) {
  const { communityId } = params;

  try {
    const raw = await prisma.member.findMany({
      where: { communityId },
      select: {
        id: true,
        role: true,
        balance: true,
        allocation: true,
        name: true,
        user: {
          select: {
            id: true,
            name: true,
            address: true,
            email: true,
          },
        },
        memberTags: {
          select: {
            id: true,
            tag: {
              select: {
                id: true,
                label: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: { role: "asc" },
    });

    const members = raw.map((m) => ({
      id: m.id,
      role: m.role,
      balance: m.balance,
      allocation: m.allocation,
      name: (m as any).name ?? (m as any).user?.name ?? null,
      user: m.user,
      memberTags: m.memberTags,
    }));

    return NextResponse.json(safeJson(members), { status: 200 });
  } catch (err) {
    console.error("GET /api/community/[communityId]/members primary query failed", err);

    try {
      // Fallback for older databases without the `name` column
      const raw = await prisma.member.findMany({
        where: { communityId },
        select: {
          id: true,
          role: true,
          balance: true,
          allocation: true,
          user: {
            select: {
              id: true,
              name: true,
              address: true,
              email: true,
            },
          },
          memberTags: {
            select: {
              id: true,
              tag: {
                select: {
                  id: true,
                  label: true,
                  slug: true,
                },
              },
            },
          },
        },
        orderBy: { role: "asc" },
      });

      const members = raw.map((m) => ({
        id: m.id,
        role: m.role,
        balance: m.balance,
        allocation: m.allocation,
        name: (m as any).user?.name ?? null,
        user: m.user,
        memberTags: m.memberTags,
      }));

      return NextResponse.json(safeJson(members), { status: 200 });
    } catch (err2) {
      console.error(
        "GET /api/community/[communityId]/members fallback query failed",
        err2
      );
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }
}
