import { NextResponse } from "next/server";
import { prisma, safeJson } from "@/lib/prisma";

export async function GET(
  _req: Request,
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
    // 1) load the task
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        members: { select: { id: true } },
      },
    });
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // 2) load the project balance
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { balance: true },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // 3) load ALL community members (for the multi-select)
    const members = await prisma.member.findMany({
      where: { communityId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            address: true,
            email: true,
          },
        },
      },
    });

    // 4) return everything, serializing BigInts via safeJson
    return NextResponse.json(
      safeJson({
        task,
        projectBalance: project.balance,
        members,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("GET task error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
