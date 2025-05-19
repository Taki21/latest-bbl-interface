import { NextRequest, NextResponse } from 'next/server';
import { prisma, safeJson } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { communityId: string } }
) {
  try {
    const { communityId } = params;

    if (!communityId) {
      return NextResponse.json(
        { error: 'Community ID is required' },
        { status: 400 }
      );
    }

    const community = await prisma.community.findUnique({
      where: { id: communityId },
      include: {
        creator: true,
        members: {
          include: {
            user: true
          }
        },
        projects: {
          include: {
            members: true,
            tasks: true,
            teamLeader: true,
            creator: true
          }
        },
        allocations: {
          include: {
            member: {
              include: {
                user: true
              }
            }
          }
        }
      }
    });

    if (!community) {
      return NextResponse.json(
        { error: 'Community not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(safeJson(community), { status: 200 });
  } catch (error) {
    console.error('Error fetching community:', error);
    return NextResponse.json(
      { error: 'Failed to fetch community' },
      { status: 500 }
    );
  }
}
