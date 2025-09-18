// File: app/api/community/[communityId]/projects/[projectId]/tasks/[taskId]/edit/route.ts

import { NextResponse } from "next/server";
import { prisma, safeJson } from "@/lib/prisma";
import { MemberRole } from "@prisma/client";

export async function POST(
  req: Request,
  ctx: { params: Promise<{
    communityId: string;
    projectId: string;
    taskId: string;
  }> }
) {
  const { communityId, projectId, taskId } = await ctx.params;

  try {
    const {
      name,
      description = "",
      status,
      priority,
      deadline,
      balance,        // new task allocation as string
      creatorAddress, // must match task.owner
      memberIds = [],
    } = await req.json();

    if (!name || !deadline || balance == null || !creatorAddress) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const newAlloc = BigInt(balance);

    // 1) Fetch existing task & its balance
    const oldTask = await prisma.task.findUnique({
      where: { id: taskId },
      select: { balance: true, projectId: true, creatorId: true },
    });
    if (!oldTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // 2) Authorization: only Owner/Supervisor/TeamLeader or task.creator
    const me = await prisma.member.findFirst({
      where: {
        communityId,
        user: { address: creatorAddress },
      },
      select: { id: true, role: true },
    });
    if (!me) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 });
    }
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { teamLeaderId: true, balance: true },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    const isCreator = oldTask.creatorId === me.id;
    const isAdmin =
      me.role === MemberRole.Owner ||
      me.role === MemberRole.Supervisor ||
      me.id === project.teamLeaderId;
    if (!isCreator && !isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // 3) Compute how much to move between project ↔ task
    const oldAlloc = BigInt(oldTask.balance);
    let projectDelta = oldAlloc - newAlloc; 
    // if positive → project.balance += projectDelta
    // if negative → project.balance -= (-projectDelta)
    if (projectDelta < 0n && project.balance < -projectDelta) {
      return NextResponse.json(
        { error: "Insufficient project funds" },
        { status: 400 }
      );
    }

    // 4) Validate memberIds
    const valid = await prisma.member.findMany({
      where: { id: { in: memberIds }, communityId },
      select: { id: true },
    });
    if (valid.length !== memberIds.length) {
      return NextResponse.json({ error: "Invalid members list" }, { status: 400 });
    }

    // 5) Do it in a transaction
    const [updatedProj, updatedTask] = await prisma.$transaction([
      prisma.project.update({
        where: { id: projectId },
        data: {
          balance:
            projectDelta > 0n
              ? { increment: projectDelta.toString() }
              : { decrement: (-projectDelta).toString() },
        },
      }),
      prisma.task.update({
        where: { id: taskId },
        data: {
          name,
          description,
          status,
          priority,
          deadline,
          balance: newAlloc,
          members: { set: valid.map((m) => ({ id: m.id })) },
        },
      }),
    ]);

    // 6) return JSON
    return NextResponse.json(safeJson(updatedTask), { status: 200 });
  } catch (err) {
    console.error("edit-task error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
