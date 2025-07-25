import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Check if userId is provided (authentication check)
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const challenge = await prisma.challenge.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
        submissions: {
          where: {
            userId: userId, // Only include user's own submissions
          },
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            submissions: true,
          },
        },
      },
    });

    if (!challenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      );
    }

    // Authorization check: Users can access challenges they created or daily challenges
    // For now, allow access to all challenges, but filter submissions to user's own
    // You can add more restrictive logic here if needed
    const canAccess = challenge.isDaily || challenge.createdById === userId;
    
    if (!canAccess) {
      return NextResponse.json(
        { error: 'Access denied - You don\'t have permission to view this challenge' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      challenge,
    });

  } catch (error) {
    console.error('Error fetching challenge:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 