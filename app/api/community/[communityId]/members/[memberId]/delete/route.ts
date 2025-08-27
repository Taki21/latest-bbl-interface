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
      select: { role: true },
    });
    if (!caller)
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const isAdmin =
      caller.role === MemberRole.Owner || caller.role === MemberRole.Professor;
    if (!isAdmin)
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    await prisma.member.delete({ where: { id: params.memberId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("delete-member error", err);
    return NextResponse.json({ error: "Internal" }, { status: 500 });
  }
}
