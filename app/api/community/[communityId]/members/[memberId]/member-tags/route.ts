import { NextResponse } from "next/server";
import { MemberRole } from "@prisma/client";

import { prisma, safeJson } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { communityId: string; memberId: string } }
) {
  const { communityId, memberId } = params;

  try {
    const member = await prisma.member.findFirst({
      where: { id: memberId, communityId },
      select: {
        id: true,
        userId: true,
        memberTags: {
          select: {
            id: true,
            tag: {
              select: { id: true, label: true, slug: true },
            },
          },
        },
      },
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    return NextResponse.json(safeJson(member));
  } catch (err) {
    console.error(
      "GET /api/community/[communityId]/members/[memberId]/member-tags error",
      err
    );
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { communityId: string; memberId: string } }
) {
  const { communityId, memberId } = params;

  try {
    const { tagIds, address } = await req.json();
    if (!Array.isArray(tagIds) || !address) {
      return NextResponse.json(
        { error: "Invalid payload" },
        { status: 400 }
      );
    }

    const member = await prisma.member.findFirst({
      where: { id: memberId, communityId },
      select: { id: true },
    });
    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const caller = await prisma.member.findFirst({
      where: { communityId, user: { address } },
      select: { id: true, role: true },
    });
    if (!caller) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const isAdmin =
      caller.role === MemberRole.Owner || caller.role === MemberRole.Supervisor;
    const isSelf = caller.id === memberId;
    if (!isAdmin && !isSelf) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const uniqueTagIds = Array.from(new Set(tagIds)).filter(Boolean);
    if (!uniqueTagIds.length) {
      await prisma.memberTag.deleteMany({ where: { memberId } });
      return NextResponse.json({ ok: true });
    }

    const tags = await prisma.tag.findMany({
      where: { id: { in: uniqueTagIds }, communityId },
      select: { id: true, slug: true },
    });

    if (tags.length !== uniqueTagIds.length) {
      return NextResponse.json({ error: "Invalid tags" }, { status: 400 });
    }

    // Ensure all tags belong to the member namespace (member- prefix)
    if (tags.some((tag) => !tag.slug.startsWith("member"))) {
      return NextResponse.json({ error: "Invalid member tag" }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.memberTag.deleteMany({ where: { memberId } }),
      prisma.memberTag.createMany({
        data: tags.map((tag) => ({
          communityId,
          memberId,
          tagId: tag.id,
        })),
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(
      "POST /api/community/[communityId]/members/[memberId]/member-tags error",
      err
    );
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
