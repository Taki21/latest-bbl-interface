import { NextResponse } from "next/server";
import { prisma, safeJson } from "@/lib/prisma";

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
      select: { id: true },
    });
    if (!member) {
      return NextResponse.json({ error: "Not a community member" }, { status: 403 });
    }

    const task = await prisma.task.findFirst({
      where: { id: taskId, projectId },
      select: { status: true, members: { select: { id: true } } },
    });
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    if (task.status !== "in_progress") {
      return NextResponse.json({ error: "Cannot finish task" }, { status: 400 });
    }

    const assigned = task.members.some((m) => m.id === member.id);
    if (!assigned) {
      return NextResponse.json({ error: "Not assigned to task" }, { status: 403 });
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: { status: "under_review" },
    });

    return NextResponse.json(safeJson(updated), { status: 200 });
  } catch (err) {
    console.error("finish-task error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
