import { NextResponse } from "next/server";
import { prisma, safeJson } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ communityId: string; projectId: string }> }
) {
  const routeParams = await params;

  try {
    const { communityId, projectId } = routeParams;

    const project = await prisma.project.findFirst({
      where: { id: projectId, communityId },
      include: {
        teamLeader: {
          select: {
            id: true,
            name: true,
            role: true,
            memberTags: {
              select: {
                id: true,
                tag: { select: { id: true, label: true, slug: true } },
              },
            },
            user: {
              select: { id: true, name: true, address: true, email: true },
            },
          },
        },
        members: {
          select: {
            id: true,
            name: true,
            role: true,
            memberTags: {
              select: {
                id: true,
                tag: { select: { id: true, label: true, slug: true } },
              },
            },
            user: { select: { id: true, name: true, address: true, email: true } },
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            role: true,
            memberTags: {
              select: {
                id: true,
                tag: { select: { id: true, label: true, slug: true } },
              },
            },
            user: { select: { id: true, name: true, address: true, email: true } },
          },
        },
        // all tasks, with creator + members
        tasks: {
          select: {
            id: true,
            name: true,
            description: true,
            status: true,
            priority: true,
            balance: true,
            deadline: true,
            creator: {
              select: {
                id: true,
                user: {
                  select: { id: true, name: true, address: true, email: true },
                },
              },
            },
            members: {
              select: {
                id: true,
                user: {
                  select: { id: true, name: true, address: true, email: true },
                },
              },
            },
          },
        },
        projectTags: {
          include: {
            tag: { select: { id: true, slug: true, label: true } },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // massage shape for UI
    const out = {
      ...project,
      teamLeader: project.teamLeader
        ? {
            id: project.teamLeader.id,
            name: project.teamLeader.name ?? project.teamLeader.user?.name ?? null,
            role: project.teamLeader.role ?? null,
            user: project.teamLeader.user,
            memberTags: project.teamLeader.memberTags,
          }
        : null,
      creator: project.creator
        ? {
            id: project.creator.id,
            name: project.creator.name ?? project.creator.user?.name ?? null,
            role: project.creator.role ?? null,
            user: project.creator.user,
            memberTags: project.creator.memberTags,
          }
        : null,
      members: project.members.map((m) => ({
        id: m.id,
        name: m.name ?? m.user?.name ?? null,
        role: m.role ?? null,
        user: m.user,
        memberTags: m.memberTags,
      })),
      tasks: project.tasks.map((t) => ({
        ...t,
        creator: t.creator.user,
        members: t.members.map((m) => m.user),
      })),
      tags: project.projectTags.map((pt) => pt.tag),
    };

    return NextResponse.json(safeJson(out));
  } catch (err) {
    console.error("GET /api/community/[communityId]/projects/[projectId] error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
