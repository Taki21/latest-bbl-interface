// File: app/api/community/[communityId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma, safeJson } from "@/lib/prisma";

/**
 * GET /api/community/[communityId]
 * Returns the entire community object, including:
 *   • creator (User)
 *   • members (with their User)
 *   • projects (with members, tasks, leader, creator)
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { communityId: string } }
) {
  const { communityId } = params;

  if (!communityId) {
    return NextResponse.json(
      { error: "Community ID is required" },
      { status: 400 }
    );
  }

  try {
    const community = await prisma.community.findUnique({
      where: { id: communityId },
      include: {
        creator: true,
        members: {
          include: {
            user: true,
            memberTags: {
              include: {
                tag: {
                  select: { id: true, label: true, slug: true },
                },
              },
            },
          },
        },
        projects: {
          include: {
            members: {
              include: {
                user: true,
                memberTags: {
                  include: {
                    tag: {
                      select: { id: true, label: true, slug: true },
                    },
                  },
                },
              },
            },
            tasks: {
              include: {
                creator: {
                  include: {
                    user: true,
                    memberTags: {
                      include: {
                        tag: {
                          select: { id: true, label: true, slug: true },
                        },
                      },
                    },
                  },
                },
                members: {
                  include: {
                    user: true,
                    memberTags: {
                      include: {
                        tag: {
                          select: { id: true, label: true, slug: true },
                        },
                      },
                    },
                  },
                },
              },
            },
            teamLeader: {
              include: {
                user: true,
                memberTags: {
                  include: {
                    tag: {
                      select: { id: true, label: true, slug: true },
                    },
                  },
                },
              },
            },
            creator: {
              include: {
                user: true,
                memberTags: {
                  include: {
                    tag: {
                      select: { id: true, label: true, slug: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!community) {
      return NextResponse.json(
        { error: "Community not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(safeJson(community), { status: 200 });
  } catch (err) {
    console.error("Error fetching community:", err);
    return NextResponse.json(
      { error: "Failed to fetch community" },
      { status: 500 }
    );
  }
}
