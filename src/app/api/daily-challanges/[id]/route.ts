import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const dailyChallenge = await prisma.challenge.findFirst({
      where: {
        id: id,
        isDaily: true,
      },
      select: {
        id: true,
        title: true,
        description: true,
        difficulty: true,
        tags: true,
        isDaily: true,
        createdAt: true,
        _count: {
          select: {
            submissions: true,
          },
        },
      },
    });

    if (!dailyChallenge) {
      return NextResponse.json(
        { error: 'Daily challenge not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      dailyChallenge,
    });

  } catch (error) {
    console.error('Error fetching daily challenge:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
