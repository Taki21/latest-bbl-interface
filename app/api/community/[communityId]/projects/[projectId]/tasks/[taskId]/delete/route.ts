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

    const user = await prisma.user.findUnique({ where: { address }, select: { id: true } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const me = await prisma.member.findFirst({
      where: { userId: user.id, communityId },
      select: { id: true, role: true },
    });
    if (!me) return NextResponse.json({ error: "Not a member" }, { status: 403 });

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { creatorId: true, balance: true, status: true },
    });
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { teamLeaderId: true },
    });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const isAdmin =
      me.role === MemberRole.Owner ||
      me.role === MemberRole.Supervisor ||
      me.id === project.teamLeaderId ||
      me.id === task.creatorId;

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Return task budget to the project before deleting
    const taskBalance = BigInt(task.balance);
    await prisma.$transaction([
      ...(taskBalance > 0n
        ? [
            prisma.project.update({
              where: { id: projectId },
              data: { balance: { increment: taskBalance.toString() } },
            }),
          ]
        : []),
      prisma.task.delete({ where: { id: taskId } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("delete-task error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
