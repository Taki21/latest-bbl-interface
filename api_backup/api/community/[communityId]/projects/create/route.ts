import { NextResponse } from "next/server";
import { prisma, safeJson } from "@/lib/prisma";
import { MemberRole } from "@prisma/client";

export async function POST(
  req: Request,
  ctx: { params: { communityId: string } }
) {
  try {
    const {
      title,
      description = "",
      deadline,
      balance,          // integer tokens to allocate
      status = "active",
      creatorAddress,
      teamLeaderId,
      memberIds = [],
    } = await req.json();

    // Validate
    if (!title || !deadline || balance == null || !creatorAddress || !teamLeaderId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const communityId = ctx.params.communityId;
    const allocation = BigInt(balance);           // whole tokens
    const allocationStr = allocation.toString();

    // 1) Find creator’s user & member row
    const user = await prisma.user.findUnique({
      where: { address: creatorAddress },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const me = await prisma.member.findFirst({
      where: { userId: user.id, communityId },
      select: { id: true, role: true, balance: true },
    });
    if (!me || (me.role !== MemberRole.Owner && me.role !== MemberRole.Professor)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    if (me.balance < allocation) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    }

    // 2) Ensure teamLeader is in this community
    const tl = await prisma.member.findUnique({
      where: { id: teamLeaderId },
      select: { id: true, role: true, communityId: true },
    });
    if (!tl || tl.communityId !== communityId) {
      return NextResponse.json({ error: "Invalid teamLeader" }, { status: 400 });
    }

    // 3) Ensure all memberIds belong to this community
    const validMembers = await prisma.member.findMany({
      where: { id: { in: memberIds }, communityId },
      select: { id: true },
    });
    if (validMembers.length !== memberIds.length) {
      return NextResponse.json({ error: "Invalid member list" }, { status: 400 });
    }

    // 4) Run transaction: deduct from professor, create project with balance
    const [_, project] = await prisma.$transaction([
      // decrement professor balance
      prisma.member.update({
        where: { id: me.id },
        data: { balance: { decrement: allocationStr } },
      }),
      // create project
      prisma.project.create({
        data: {
          title,
          description,
          deadline,
          status,
          balance: allocation,
          communityId,
          ownerId: user.id,
          creatorId: me.id,
          teamLeaderId,
          members: { connect: validMembers.map((m) => ({ id: m.id })) },
        },
      }),
    ]);

    // 5) If teamLeader was default Member → promote to TeamLeader
    if (tl.role === MemberRole.Member) {
      await prisma.member.update({
        where: { id: teamLeaderId },
        data: { role: MemberRole.TeamLeader },
      });
    }

    return NextResponse.json(safeJson(project), { status: 201 });
  } catch (err) {
    console.error("create-project error", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
