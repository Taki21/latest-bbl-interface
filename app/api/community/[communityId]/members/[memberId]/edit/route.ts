import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MemberRole } from "@prisma/client";

export async function POST(
  req: Request,
  { params }: { params: { communityId: string; memberId: string } }
) {
  try {
    const { name, address } = await req.json();
    if (!name || !address)
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const caller = await prisma.member.findFirst({
      where: { communityId: params.communityId, user: { address } },
      select: { id: true, role: true },
    });
    if (!caller)
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const isAdmin =
      caller.role === MemberRole.Owner || caller.role === MemberRole.Professor;
    const isSelf = caller.id === params.memberId;
    if (!isAdmin && !isSelf)
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    await prisma.member.update({
      where: { id: params.memberId },
      data: { name },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("edit-member error", err);
    return NextResponse.json({ error: "Internal" }, { status: 500 });
  }
}
