import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Get today's date at midnight (start of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get tomorrow's date at midnight (end of day)
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find today's daily challenge
    const dailyChallenge = await prisma.challenge.findFirst({
      where: {
        isDaily: true,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
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
    });

    if (!dailyChallenge) {
      return NextResponse.json(
        { 
          error: 'No daily challenge found for today',
          message: 'Daily challenge not available for today'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      dailyChallenge,
      date: today.toISOString().split('T')[0], // Return date in YYYY-MM-DD format
    });

  } catch (error) {
    console.error('Error fetching daily challenge:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
