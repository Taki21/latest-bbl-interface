import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { communityId: string, projectId: string } }
) {
  try {
    const { communityId, projectId } = params;

    if (!communityId || !projectId) {
      return NextResponse.json(
        { error: 'Community ID and Project ID are required' },
        { status: 400 }
      );
    }

    const members = await prisma.member.findMany({
      where: {
        projects: {
          some: {
            id: projectId,
            communityId
          }
        }
      },
      include: {
        user: true
      }
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error('Error fetching project members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project members' },
      { status: 500 }
    );
  }
}
