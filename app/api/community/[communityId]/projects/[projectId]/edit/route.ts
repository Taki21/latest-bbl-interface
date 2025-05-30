// File: app/api/community/[communityId]/projects/[projectId]/edit/route.ts
import { NextResponse } from "next/server";
import { prisma, safeJson } from "@/lib/prisma";
import { MemberRole } from "@prisma/client";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ communityId: string; projectId: string }> }
) {
  // 1) Await and extract both params
  const { communityId, projectId } = await ctx.params;

  try {
    const {
      title,
      description,
      deadline,
      status,
      teamLeaderId,
      memberIds,
      balance,   // new project budget (string)
      address,   // caller wallet address
    } = await req.json();

    if (
      !title ||
      !deadline ||
      !teamLeaderId ||
      !address ||
      balance == null
    ) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const newBudget = BigInt(balance);

    /* ── 2) Load project & authorize caller ─────────────────────── */
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        creator: { include: { user: { select: { address: true } } } },
      },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Fetch caller's Member record (allocation + role)
    const callerMember = await prisma.member.findFirst({
      where: {
        communityId,
        user: { address },
      },
      select: {
        id:         true,
        role:       true,
        allocation: true,   // <-- grab allocation field
      },
    });
    if (!callerMember) {
      return NextResponse.json({ error: "Not a community member" }, { status: 403 });
    }

    const isAdmin =
      callerMember.role === MemberRole.Owner ||
      callerMember.role === MemberRole.Professor;
    const isCreator =
      project.creator.user.address.toLowerCase() === address.toLowerCase();

    if (!isAdmin && !isCreator) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    /* ── 3) Compute allocation delta ────────────────────────────── */
    const currentBudget = BigInt(project.balance);
    let decCaller = 0n;
    let incCaller = 0n;

    if (newBudget > currentBudget) {
      decCaller = newBudget - currentBudget;
      if (callerMember.allocation < decCaller) {
        return NextResponse.json(
          { error: "Insufficient allocation" },
          { status: 400 }
        );
      }
    } else if (newBudget < currentBudget) {
      incCaller = currentBudget - newBudget;
    }

    /* ── 4) Build caller-allocation update if needed ───────────── */
    const callerUpdate =
      decCaller || incCaller
        ? prisma.member.update({
            where: { id: callerMember.id },
            data: {
              allocation: {
                ...(decCaller ? { decrement: decCaller.toString() } : {}),
                ...(incCaller ? { increment: incCaller.toString() } : {}),
              },
            },
          })
        : null;

    /* ── 5) Perform atomic transaction ──────────────────────────── */
    const txnOps: any[] = [
      // a) update project
      prisma.project.update({
        where: { id: projectId },
        data: {
          title,
          description,
          deadline,
          status,
          teamLeaderId,
          balance: newBudget.toString(),
          members: {
            set: memberIds.map((id: string) => ({ id })),
          },
        },
      }),
      // b) auto-promote a default→teamLeader if needed
      prisma.member.updateMany({
        where: { id: teamLeaderId, role: MemberRole.Default },
        data: { role: MemberRole.Team_Leader },
      }),
    ];

    if (callerUpdate) txnOps.push(callerUpdate);

    const [updatedProject] = await prisma.$transaction(txnOps);

    return NextResponse.json(safeJson(updatedProject), { status: 200 });
  } catch (err) {
    console.error("edit-project error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
