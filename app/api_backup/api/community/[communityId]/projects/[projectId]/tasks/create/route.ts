import { NextResponse } from "next/server";
import { prisma, safeJson } from "@/lib/prisma";
import { MemberRole } from "@prisma/client";

export async function POST(
  req: Request,
  ctx: { params: { communityId: string; projectId: string } }
) {
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

    // Validate
    if (!name || !deadline || balance == null || !creatorAddress) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const communityId = ctx.params.communityId;
    const projectId = ctx.params.projectId;
    const allocation = BigInt(balance);
    const allocationStr = allocation.toString();

    // 1) Lookup user & member
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
      return NextResponse.json({ error: "Not a community member" }, { status: 403 });
    }

    // 2) Fetch project & check perms
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { balance: true, teamLeaderId: true },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (
      me.role !== MemberRole.Owner &&
      me.role !== MemberRole.Professor &&
      me.id !== project.teamLeaderId
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    if (project.balance < allocation) {
      return NextResponse.json({ error: "Insufficient project funds" }, { status: 400 });
    }

    // 3) Ensure all memberIds valid
    const validMembers = await prisma.member.findMany({
      where: { id: { in: memberIds }, communityId },
      select: { id: true },
    });
    if (validMembers.length !== memberIds.length) {
      return NextResponse.json({ error: "Invalid members list" }, { status: 400 });
    }

    // 4) Transaction: deduct project balance + create task
    const [_, task] = await prisma.$transaction([
      // decrement project
      prisma.project.update({
        where: { id: projectId },
        data: { balance: { decrement: allocationStr } },
      }),
      // create the task
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
          members: { connect: validMembers.map((m) => ({ id: m.id })) },
        },
      }),
    ]);

    return NextResponse.json(safeJson(task), { status: 201 });
  } catch (err) {
    console.error("create-task error", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
