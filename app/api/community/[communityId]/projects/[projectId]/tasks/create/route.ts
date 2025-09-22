// File: app/api/community/[communityId]/projects/[projectId]/tasks/create/route.ts

import { NextResponse } from "next/server";
import { prisma, safeJson } from "@/lib/prisma";
import { MemberRole } from "@prisma/client";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ communityId: string; projectId: string }> }
) {
  const { communityId, projectId } = await ctx.params;

  try {
    const {
      name,
      description = "",
      status,
      priority,
      deadline,
      balance,         // integer tokens to allocate to task
      creatorAddress,
      memberIds = [],
    } = await req.json();

    // 1) Validate required fields
    if (!name || !deadline || balance == null || !creatorAddress) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const allocation    = BigInt(balance);
    const allocationStr = allocation.toString();

    // 2) Lookup User → Member
    const user = await prisma.user.findUnique({
      where: { address: creatorAddress },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const me = await prisma.member.findFirst({
      where: { userId: user.id, communityId },
      select: { id: true, role: true },
    });
    if (!me) {
      return NextResponse.json(
        { error: "Not a community member" },
        { status: 403 }
      );
    }

    // 3) Fetch project & check permissions + funds
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { balance: true, teamLeaderId: true },
    });
    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }
    if (
      me.role !== MemberRole.Owner &&
      me.role !== MemberRole.Supervisor &&
      me.id !== project.teamLeaderId
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    if (project.balance < allocation) {
      return NextResponse.json(
        { error: "Insufficient project funds" },
        { status: 400 }
      );
    }

    // 4) Validate memberIds
    const validMembers = await prisma.member.findMany({
      where: { id: { in: memberIds }, communityId },
      select: { id: true },
    });
    if (validMembers.length !== memberIds.length) {
      return NextResponse.json(
        { error: "Invalid members list" },
        { status: 400 }
      );
    }

    // 5) Run transaction:  
    //    a) decrement project.balance  
    //    b) create task (including required ownerId)  
    const [, task] = await prisma.$transaction([
      prisma.project.update({
        where: { id: projectId },
        data: { balance: { decrement: allocationStr } },
      }),
      prisma.task.create({
        data: {
          name,
          description,
          status,
          priority,
          deadline,
          balance: allocation,
          projectId,
          creatorId: me.id,
          ownerId:   user.id,       // ← REQUIRED: satisfy `owner` relation
          members: {
            connect: validMembers.map((m) => ({ id: m.id })),
          },
        },
      }),
    ]);

    return NextResponse.json(safeJson(task), { status: 201 });
  } catch (err) {
    console.error("create-task error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
