import { NextResponse } from "next/server";
import { prisma, safeJson } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { communityId: string } }
) {
  try {
    // Fetch raw projects with the teamLeader relation
    const raw = await prisma.project.findMany({
      where: { communityId: params.communityId },
      include: {
        teamLeader: {
          include: {
            user: {
              select: { name: true }
            }
          }
        },
        members: {
          select: { id: true }
        },
        tasks: {
          select: { id: true, status: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    // Flatten into the shape the UI expects
    const projects = raw.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      status: p.status,
      balance: p.balance,
      deadline: p.deadline,
      teamLeader: p.teamLeader.user.name ?? "—",
      members: p.members,
      tasks: p.tasks
    }));

    return NextResponse.json(safeJson(projects));
  } catch (err) {
    console.error("GET /api/community/[communityId]/projects error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
