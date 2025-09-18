// File: app/api/community/[communityId]/projects/[projectId]/tasks/[taskId]/edit/route.ts

import { NextResponse } from "next/server";
import { prisma, safeJson } from "@/lib/prisma";
import { MemberRole } from "@prisma/client";

export async function POST(
  req: Request,
  ctx: {
    params: Promise<{
      communityId: string;
      projectId: string;
      taskId: string;
    }>;
  }
) {
  const { communityId, projectId, taskId } = await ctx.params;

  try {
    const payload = await req.json();
    const {
      name,
      description,
      status,
      priority,
      deadline,
      balance,
      creatorAddress,
      memberIds,
    } = payload ?? {};

    if (!creatorAddress) {
      return NextResponse.json(
        { error: "Missing creator address" },
        { status: 400 }
      );
    }

    const oldTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        members: { select: { id: true } },
      },
    });
    if (!oldTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

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

    const updateData: any = {};

    if (name !== undefined) {
      const nextName = typeof name === "string" ? name.trim() : "";
      if (!nextName) {
        return NextResponse.json(
          { error: "Task name cannot be empty" },
          { status: 400 }
        );
      }
      updateData.name = nextName;
    }

    if (description !== undefined) {
      updateData.description = typeof description === "string" ? description : "";
    }

    if (status !== undefined) {
      updateData.status = status;
    }

    if (priority !== undefined) {
      updateData.priority = priority;
    }

    if (deadline !== undefined) {
      const nextDeadline = typeof deadline === "string" ? deadline.trim() : "";
      if (!nextDeadline) {
        return NextResponse.json(
          { error: "Deadline cannot be empty" },
          { status: 400 }
        );
      }
      updateData.deadline = nextDeadline;
    }

    const balanceProvided = balance !== undefined && balance !== null;
    const oldAlloc = BigInt(oldTask.balance);
    let projectDelta = 0n;

    if (balanceProvided) {
      const nextAlloc = BigInt(balance);
      if (nextAlloc < 0n) {
        return NextResponse.json(
          { error: "Budget must be positive" },
          { status: 400 }
        );
      }

      projectDelta = oldAlloc - nextAlloc;
      if (projectDelta < 0n && project.balance < -projectDelta) {
        return NextResponse.json(
          { error: "Insufficient project funds" },
          { status: 400 }
        );
      }

      updateData.balance = nextAlloc;
    }

    let membersProvided = false;
    if (memberIds !== undefined) {
      if (!Array.isArray(memberIds)) {
        return NextResponse.json(
          { error: "memberIds must be an array" },
          { status: 400 }
        );
      }
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
      membersProvided = true;
      updateData.members = {
        set: validMembers.map((m) => ({ id: m.id })),
      };
    }

    if (
      Object.keys(updateData).length === 0 &&
      !balanceProvided &&
      !membersProvided
    ) {
      return NextResponse.json(safeJson(oldTask), { status: 200 });
    }

    const tx: any[] = [];
    let updatedBalance = project.balance;

    if (balanceProvided) {
      if (projectDelta > 0n) {
        tx.push(
          prisma.project.update({
            where: { id: projectId },
            data: {
              balance: { increment: projectDelta.toString() },
            },
          })
        );
      } else if (projectDelta < 0n) {
        tx.push(
          prisma.project.update({
            where: { id: projectId },
            data: {
              balance: { decrement: (-projectDelta).toString() },
            },
          })
        );
      }
    }

    tx.push(
      prisma.task.update({
        where: { id: taskId },
        data: updateData,
        include: {
          members: {
            select: {
              id: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  address: true,
                  email: true,
                },
              },
            },
          },
          creator: {
            select: {
              id: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  address: true,
                  email: true,
                },
              },
            },
          },
        },
      })
    );

    const results = await prisma.$transaction(tx);
    const updatedTask = results[results.length - 1];
    if (balanceProvided) {
      if (tx.length === 2) {
        updatedBalance = results[0].balance;
      } else {
        updatedBalance =
          projectDelta > 0n
            ? project.balance + projectDelta
            : project.balance - (-projectDelta);
      }
    }

    return NextResponse.json(
      safeJson({
        task: updatedTask,
        projectBalance: updatedBalance,
      })
    );
  } catch (err) {
    console.error("edit-task error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
