import { NextResponse } from "next/server";
import { prisma, safeJson } from "@/lib/prisma";
import { MemberRole } from "@prisma/client";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ communityId: string; projectId: string; taskId: string }> }
) {
  const { communityId, projectId, taskId } = await ctx.params;

  try {
    const {
      name,
      description = "",
      status,
      priority,
      deadline,
      balance,
      creatorAddress,
      memberIds = [],
    } = await req.json();

    if (!name || !deadline || balance == null || !creatorAddress) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const newBal = BigInt(balance);

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
      return NextResponse.json(
        { error: "Not a community member" },
        { status: 403 }
      );
    }

    // 2) Fetch project & task
    const [project, oldTask] = await Promise.all([
      prisma.project.findUnique({
        where: { id: projectId },
        select: { balance: true, teamLeaderId: true },
      }),
      prisma.task.findUnique({
        where: { id: taskId },
        select: { balance: true, creatorId: true },
      }),
    ]);
    if (!project || !oldTask) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // 3) Check permissions
    const allowed =
      me.role === MemberRole.Owner ||
      me.role === MemberRole.Professor ||
      me.id === project.teamLeaderId ||
      me.id === oldTask.creatorId;
    if (!allowed) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // 4) Compute project balance adjustment
    const oldBal = BigInt(oldTask.balance);
    let projectUpdate: any = {};
    if (newBal > oldBal) {
      const diff = newBal - oldBal;
      if (project.balance < diff) {
        return NextResponse.json(
          { error: "Insufficient project funds" },
          { status: 400 }
        );
      }
      projectUpdate = { balance: { decrement: diff.toString() } };
    } else if (newBal < oldBal) {
      const diff = oldBal - newBal;
      projectUpdate = { balance: { increment: diff.toString() } };
    }

    // 5) Validate assigned members
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

    // 6) Transaction: update project balance (if needed) + update task
    const tx: any[] = [];
    if (Object.keys(projectUpdate).length) {
      tx.push(
        prisma.project.update({
          where: { id: projectId },
          data: projectUpdate,
        })
      );
    }
    tx.push(
      prisma.task.update({
        where: { id: taskId },
        data: {
          name,
          description,
          status,
          priority,
          deadline,
          balance: newBal,
          members: {
            set: validMembers.map((m) => ({ id: m.id })),
          },
        },
      })
    );

    const [, updatedTask] = await prisma.$transaction(tx);

    return NextResponse.json(safeJson(updatedTask), { status: 200 });
  } catch (err) {
    console.error("edit-task error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
