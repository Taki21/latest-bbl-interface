import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MemberRole } from "@prisma/client";

export async function POST(
  req: Request,
  ctx: { params: { communityId: string; projectId: string } }
) {
  try {
    const { address } = await req.json();
    if (!address)
      return NextResponse.json({ error: "Missing address" }, { status: 400 });

    /* auth */
    const project = await prisma.project.findUnique({
      where: { id: ctx.params.projectId },
      select: { creator: { select: { user: { select: { address: true } } } } },
    });
    if (!project)
      return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const caller = await prisma.member.findFirst({
      where: {
        communityId: ctx.params.communityId,
        user: { address },
      },
      select: { role: true },
    });

    const isAdmin =
      caller?.role === MemberRole.Owner || caller?.role === MemberRole.Supervisor;
    const isCreator =
      project.creator.user.address.toLowerCase() === address.toLowerCase();

    if (!isAdmin && !isCreator)
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    await prisma.task.deleteMany({ where: { projectId: ctx.params.projectId } });
    await prisma.project.delete({ where: { id: ctx.params.projectId } });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("delete-project error", err);
    return NextResponse.json({ error: "Internal" }, { status: 500 });
  }
}
