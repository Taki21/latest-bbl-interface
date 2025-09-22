import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MemberRole } from "@prisma/client";

export async function POST(
  req: Request,
  { params }: { params: { communityId: string; memberId: string } }
) {
  try {
    const { address } = await req.json();
    if (!address)
      return NextResponse.json({ error: "Missing address" }, { status: 400 });

    const caller = await prisma.member.findFirst({
      where: { communityId: params.communityId, user: { address } },
      select: { id: true, role: true },
    });
    if (!caller)
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const isAdmin =
      caller.role === MemberRole.Owner || caller.role === MemberRole.Supervisor;
    if (!isAdmin)
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    if (caller.id === params.memberId)
      return NextResponse.json(
        { error: "Cannot remove yourself" },
        { status: 400 }
      );

    await prisma.project.updateMany({
      where: { teamLeaderId: params.memberId },
      data: { teamLeaderId: caller.id },
    });
    await prisma.project.updateMany({
      where: { creatorId: params.memberId },
      data: { creatorId: caller.id },
    });
    await prisma.task.updateMany({
      where: { creatorId: params.memberId },
      data: { creatorId: caller.id },
    });

    await prisma.member.delete({ where: { id: params.memberId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("delete-member error", err);
    return NextResponse.json({ error: "Internal" }, { status: 500 });
  }
}
