import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

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