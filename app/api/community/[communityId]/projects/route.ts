import { NextResponse } from "next/server";
import { prisma, safeJson } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ communityId: string }> }
) {
  const routeParams = await params;

  try {
    const url = new URL(req.url);
    const tagFilters = new Set<string>();

    // Support both ?tagId=... and ?tagIds=comma,separated
    url.searchParams.getAll("tagId").forEach((value) => {
      if (typeof value === "string") {
        const trimmed = value.trim();
        if (trimmed) tagFilters.add(trimmed);
      }
    });
    const csv = url.searchParams.get("tagIds");
    if (csv) {
      csv.split(/[,\s]+/)
        .map((value) => value.trim())
        .filter(Boolean)
        .forEach((value) => tagFilters.add(value));
    }

    const tagIdList = Array.from(tagFilters);

    const where: Prisma.ProjectWhereInput = {
      communityId: routeParams.communityId,
    };

    if (tagIdList.length) {
      where.AND = tagIdList.map((tagId) => ({
        projectTags: {
          some: { tagId },
        },
      }));
    }

    // Fetch raw projects with the teamLeader relation
    const raw = await prisma.project.findMany({
      where,
      include: {
        teamLeader: {
          include: {
            user: {
              select: { name: true, address: true },
            },
          },
        },
        creator: {
          include: {
            user: {
              select: { name: true, address: true },
            },
          },
        },
        members: {
          select: { id: true },
        },
        tasks: {
          select: { id: true, status: true },
        },
        projectTags: {
          include: {
            tag: { select: { id: true, slug: true, label: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Flatten into the shape the UI expects
    const projects = raw.map((p) => {
      const supervisorName = p.creator?.name ?? p.creator?.user?.name ?? "—";
      const supervisorAddress = p.creator?.user?.address ?? null;
      const teamLeaderName = p.teamLeader?.name ?? p.teamLeader?.user?.name ?? "—";
      const teamLeaderAddress = p.teamLeader?.user?.address ?? null;

      return {
        id: p.id,
        title: p.title,
        description: p.description,
        status: p.status,
        balance: p.balance,
        deadline: p.deadline,
        teamLeader: teamLeaderName,
        teamLeaderAddress,
        supervisor: supervisorName,
        supervisorAddress,
        creatorAddress: supervisorAddress,
        members: p.members,
        tasks: p.tasks,
        tags: p.projectTags.map((pt) => pt.tag),
      };
    });

    return NextResponse.json(safeJson(projects));
  } catch (err) {
    console.error("GET /api/community/[communityId]/projects error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
