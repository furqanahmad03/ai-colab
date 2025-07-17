import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter is required' },
        { status: 400 }
      );
    }

    const challenges = await prisma.challenge.findMany({
      where: {
        createdById: userId,
        isDaily: false, // Only return user-created challenges, not daily challenges
      },
      include: {
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            submissions: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      challenges,
    });

  } catch (error) {
    console.error('Error fetching challenges:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 