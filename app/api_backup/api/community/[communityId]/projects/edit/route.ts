import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { communityId: string } }
) {
  try {
    const { communityId } = params;
    const { project } = await request.json();

    // Validate required fields
    if (!communityId || !project || !project.id || !project.title || 
        !project.description || !project.teamLeader || !project.deadline || 
        !project.status || !project.creator) {
      return NextResponse.json(
        { error: 'Missing required project fields' },
        { status: 400 }
      );
    }

    // Update project in database
    const updatedProject = await prisma.project.update({
      where: { 
        id: project.id,
        communityId
      },
      data: {
        title: project.title,
        description: project.description,
        balance: BigInt(project.balance.toString()),
        deadline: new Date(project.deadline),
        status: project.status === 'active' ? 'active' : 
                project.status === 'completed' ? 'completed' : 'on_hold',
        teamLeader: {
          connect: { id: project.teamLeader.id }
        },
        members: {
          set: project.members.map((member: any) => ({ id: member.id }))
        }
      }
    });

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}
