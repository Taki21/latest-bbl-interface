import { NextResponse } from "next/server";
import { prisma, safeJson } from "@/lib/prisma";
import { MemberRole } from "@prisma/client";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ communityId: string; projectId: string; taskId: string }> }
) {
  const { communityId, projectId, taskId } = await ctx.params;

  try {
    const { address } = await req.json();
    if (!address) {
      return NextResponse.json({ error: "Missing address" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { address },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const member = await prisma.member.findFirst({
      where: { userId: user.id, communityId },
      select: { id: true, role: true },
    });
    if (!member) {
      return NextResponse.json({ error: "Not a community member" }, { status: 403 });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { teamLeaderId: true },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const isLeader = member.id === project.teamLeaderId;
    const isSupervisor = member.role === MemberRole.Supervisor || member.role === MemberRole.Owner;

    if (!isLeader && !isSupervisor) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const task = await prisma.task.findFirst({
      where: { id: taskId, projectId },
      select: { status: true, balance: true, members: { select: { id: true } } },
    });
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    if (task.status !== "under_review") {
      return NextResponse.json({ error: "Task not ready" }, { status: 400 });
    }

    const total = BigInt(task.balance);
    const count = task.members.length;
    const share = count ? total / BigInt(count) : 0n;
    const extra = count ? total % BigInt(count) : 0n;

    const ops: any[] = [];
    task.members.forEach((m, idx) => {
      let inc = share;
      if (idx < Number(extra)) inc += 1n;
      if (inc > 0n) {
        ops.push(
          prisma.member.update({
            where: { id: m.id },
            data: { balance: { increment: inc.toString() } },
          })
        );
      }
    });

    ops.unshift(
      prisma.task.update({
        where: { id: taskId },
        data: { status: "completed", balance: "0" },
      })
    );

    const [updated] = await prisma.$transaction(ops);

    return NextResponse.json(safeJson(updated), { status: 200 });
  } catch (err) {
    console.error("approve-task error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
