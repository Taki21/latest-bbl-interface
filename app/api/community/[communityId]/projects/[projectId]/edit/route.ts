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
      tagIds = [],
    } = await req.json();

    if (
      !title ||
      !deadline ||
      !teamLeaderId ||
      !address ||
      balance == null ||
      !Array.isArray(memberIds) ||
      !Array.isArray(tagIds)
    ) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const memberIdList = memberIds as string[];
    const rawTagIdList = tagIds as string[];
    const newBudget = BigInt(balance);

    /* ── 2) Load project & authorize caller ─────────────────────── */
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        creator: { include: { user: { select: { address: true } } } },
        projectTags: { select: { tagId: true } },
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
      callerMember.role === MemberRole.Supervisor;
    const isCreator =
      project.creator.user.address.toLowerCase() === address.toLowerCase();

    if (!isAdmin && !isCreator) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    /* ── 3) Validate selected members ───────────────────────────── */
    const memberList = memberIdList.length
      ? await prisma.member.findMany({
          where: { id: { in: memberIdList }, communityId },
          select: { id: true },
        })
      : [];
    if (memberList.length !== memberIdList.length) {
      return NextResponse.json({ error: "Invalid member list" }, { status: 400 });
    }

    /* ── 4) Normalize + validate tags ───────────────────────────── */
    const trimmedTagIds = rawTagIdList
      .filter((id: any): id is string => typeof id === "string")
      .map((id) => id.trim())
      .filter(Boolean);
    if (trimmedTagIds.length !== rawTagIdList.length) {
      return NextResponse.json({ error: "Invalid tag list" }, { status: 400 });
    }
    const uniqueTagIds = Array.from(new Set(trimmedTagIds));
    const validTags = uniqueTagIds.length
      ? await prisma.tag.findMany({
          where: { id: { in: uniqueTagIds }, communityId },
          select: { id: true },
        })
      : [];
    if (validTags.length !== uniqueTagIds.length) {
      return NextResponse.json({ error: "Invalid tag list" }, { status: 400 });
    }

    /* ── 5) Compute allocation delta ────────────────────────────── */
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

    /* ── 6) Build caller-allocation update if needed ───────────── */
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

    /* ── 7) Prepare tag mutation ops ───────────────────────────── */
    const deleteTagsOp = uniqueTagIds.length
      ? prisma.projectTag.deleteMany({
          where: {
            projectId,
            communityId,
            tagId: { notIn: uniqueTagIds },
          },
        })
      : prisma.projectTag.deleteMany({
          where: { projectId, communityId },
        });
    const createTagsOp = uniqueTagIds.length
      ? prisma.projectTag.createMany({
          data: uniqueTagIds.map((tagId) => ({
            communityId,
            projectId,
            tagId,
          })),
          skipDuplicates: true,
        })
      : null;

    /* ── 8) Perform atomic transaction ──────────────────────────── */
    const txnOps = [
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
            set: memberIdList.map((id) => ({ id })),
          },
        },
        include: {
          projectTags: {
            include: { tag: { select: { id: true, slug: true, label: true } } },
          },
        },
      }),
      prisma.member.updateMany({
        where: { id: teamLeaderId, role: MemberRole.Default },
        data: { role: MemberRole.Team_Leader },
      }),
      deleteTagsOp,
    ];
    if (createTagsOp) txnOps.push(createTagsOp);
    if (callerUpdate) txnOps.push(callerUpdate);

    const [updatedProject] = await prisma.$transaction(txnOps as any);

    const serialized = {
      ...updatedProject,
      tags: updatedProject.projectTags.map((pt: any) => pt.tag),
    };

    return NextResponse.json(safeJson(serialized), { status: 200 });
  } catch (err) {
    console.error("edit-project error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
