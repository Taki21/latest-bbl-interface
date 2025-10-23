// File: app/api/community/[communityId]/projects/create/route.ts
import { NextResponse } from "next/server";
import { prisma, safeJson } from "@/lib/prisma";
import { MemberRole } from "@prisma/client";

export async function POST(
  req: Request,
  { params }: { params: { communityId: string } }
) {
  const { communityId } = params;

  try {
    const {
      title,
      description = "",
      deadline,
      balance,        // integer tokens to allocate
      status = "active",
      creatorAddress,
      teamLeaderId,
      memberIds = [],
      tagIds = [],
    } = await req.json();

    // 0) Basic validation
    if (!title || !deadline || balance == null || !creatorAddress || !teamLeaderId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!Array.isArray(memberIds) || !Array.isArray(tagIds)) {
      return NextResponse.json({ error: "Invalid payload format" }, { status: 400 });
    }

    const allocation = BigInt(balance);
    const allocationStr = allocation.toString();

    // 1) Load the creator's User → Member record
    const user = await prisma.user.findUnique({
      where: { address: creatorAddress },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const me = await prisma.member.findFirst({
      where: { userId: user.id, communityId },
      select: { id: true, role: true, allocation: true },
    });
    if (
      !me ||
      (me.role !== MemberRole.Owner && me.role !== MemberRole.Supervisor)
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    if (me.allocation < allocation) {
      return NextResponse.json({ error: "Insufficient allocation" }, { status: 400 });
    }

    // 2) Ensure teamLeader is in the same community
    const tl = await prisma.member.findUnique({
      where: { id: teamLeaderId },
      select: { id: true, role: true, communityId: true },
    });
    if (!tl || tl.communityId !== communityId) {
      return NextResponse.json({ error: "Invalid team leader" }, { status: 400 });
    }

    // 3) Validate all selected memberIds
    const validMembers = memberIds.length
      ? await prisma.member.findMany({
          where: { id: { in: memberIds }, communityId },
          select: { id: true },
        })
      : [];
    if (validMembers.length !== memberIds.length) {
      return NextResponse.json({ error: "Invalid member list" }, { status: 400 });
    }

    // 4) Validate project tags (dedupe + ensure community match)
    const trimmedTagIds = tagIds
      .filter((id: any): id is string => typeof id === "string")
      .map((id) => id.trim())
      .filter(Boolean);
    if (trimmedTagIds.length !== tagIds.length) {
      return NextResponse.json({ error: "Invalid tag list" }, { status: 400 });
    }
    const uniqueTagIds = Array.from(new Set(trimmedTagIds));
    const validTags = uniqueTagIds.length
      ? await prisma.tag.findMany({
          where: { id: { in: uniqueTagIds }, communityId },
          select: { id: true },
        })
      : [];
    if (validTags.length !== uniqueTagIds.length) {
      return NextResponse.json({ error: "Invalid tag list" }, { status: 400 });
    }

    // 5) Transaction:
    //    a) decrement creator.allocation
    //    b) create new project with its balance = allocation
    const [_, project] = await prisma.$transaction([
      prisma.member.update({
        where: { id: me.id },
        data: { allocation: { decrement: allocationStr } },
      }),
      prisma.project.create({
        data: {
          title,
          description,
          deadline,
          status,
          balance: allocation,
          communityId,
          ownerId:    user.id,
          creatorId:  me.id,
          teamLeaderId,
          members: {
            connect: validMembers.map((m) => ({ id: m.id })),
          },
          ...(uniqueTagIds.length
            ? {
                projectTags: {
                  createMany: {
                    data: uniqueTagIds.map((tagId) => ({
                      communityId,
                      tagId,
                    })),
                    skipDuplicates: true,
                  },
                },
              }
            : {}),
        },
        include: {
          projectTags: {
            include: {
              tag: { select: { id: true, slug: true, label: true } },
            },
          },
        },
      }),
    ]);

    // 6) Auto-promote default member → team leader if needed
    if (tl.role === MemberRole.Default) {
      await prisma.member.update({
        where: { id: teamLeaderId },
        data: { role: MemberRole.Team_Leader },
      });
    }

    const serialized = {
      ...project,
      tags: project.projectTags.map((pt) => pt.tag),
    };

    return NextResponse.json(safeJson(serialized), { status: 201 });
  } catch (err) {
    console.error("create-project error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
