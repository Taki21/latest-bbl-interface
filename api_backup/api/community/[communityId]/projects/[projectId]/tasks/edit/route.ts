import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { communityId: string, projectId: string } }
) {
  try {
    const { communityId, projectId } = params;
    const { task } = await request.json();

    // Validate required fields
    if (!communityId || !projectId || !task || !task.id || !task.name || 
        !task.description || !task.status || !task.priority || 
        !task.deadline || !task.creator) {
      return NextResponse.json(
        { error: 'Missing required task fields' },
        { status: 400 }
      );
    }

    // Update task in database
    const updatedTask = await prisma.task.update({
      where: { 
        id: task.id,
        projectId
      },
      data: {
        name: task.name,
        description: task.description,
        status: task.status === 'not-started' ? 'not_started' : 
                task.status === 'in-progress' ? 'in_progress' : 
                task.status === 'under-review' ? 'under_review' : 'completed',
        priority: task.priority,
        balance: BigInt(task.balance.toString()),
        deadline: new Date(task.deadline),
        members: {
          set: task.member.map((member: any) => ({ id: member.id }))
        }
      }
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}
