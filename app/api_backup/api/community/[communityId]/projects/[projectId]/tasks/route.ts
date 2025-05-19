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

    const tasks = await prisma.task.findMany({
      where: { 
        projectId,
        project: {
          communityId
        }
      },
      include: {
        members: {
          include: {
            user: true
          }
        },
        creator: {
          include: {
            user: true
          }
        }
      }
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching project tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project tasks' },
      { status: 500 }
    );
  }
}
