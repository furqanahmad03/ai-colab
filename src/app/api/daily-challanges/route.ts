import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { GoogleGenAI } from '@google/genai';

const prisma = new PrismaClient();
const ai = new GoogleGenAI({});

interface GeneratedChallenge {
  title: string;
  description: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  tags: string[];
}

async function generateDailyChallenge(): Promise<GeneratedChallenge> {
  const categories = ['Programming Fundamentals (PF)', 'Object-Oriented Programming (OOP)', 'Data Structures & Algorithms (DSA)'];
  const randomCategory = categories[Math.floor(Math.random() * categories.length)];
  const difficulties = ['EASY', 'MEDIUM', 'HARD'];
  const randomDifficulty = difficulties[Math.floor(Math.random() * difficulties.length)];

  const prompt = `
Generate a unique daily coding challenge with the following specifications:
- Category: ${randomCategory}
- Difficulty: ${randomDifficulty}
- Must be engaging and suitable for daily practice
- Should be solvable in 15-30 minutes

Return the response in this exact JSON format:
{
  "title": "Challenge Title",
  "description": "Detailed problem description with requirements, constraints, and examples",
  "difficulty": "${randomDifficulty}",
  "tags": ["tag1", "tag2", "tag3"]
}

Make sure the challenge is:
- Focused on ${randomCategory} concepts
- Well-structured with clear requirements
- Includes input/output examples
- Has relevant programming tags
- Is engaging for daily practice
`;

  const model = ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });
  const response = await model;
  const text = response.text || '';

  if (!text) {
    throw new Error('Empty response from Gemini');
  }

  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to extract JSON from Gemini response');
  }

  let jsonString = jsonMatch[0];
  jsonString = jsonString.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
  jsonString = jsonString.replace(/,(\s*[}\]])/g, '$1');
  jsonString = jsonString.replace(/([^"\\])\s*"/g, '$1"');

  const challenge = JSON.parse(jsonString);

  if (!challenge.title || !challenge.description || !challenge.difficulty || !challenge.tags) {
    throw new Error('Invalid challenge structure');
  }

  return challenge;
}

async function getOrCreateSystemUser() {
  // Try to find an existing admin user
  let systemUser = await prisma.user.findFirst({
    where: {
      role: 'ADMIN'
    }
  });

  // If no admin user exists, create one
  if (!systemUser) {
    systemUser = await prisma.user.create({
      data: {
        email: 'system@codewar.com',
        name: 'System',
        role: 'ADMIN'
      }
    });
  }

  return systemUser;
}

export async function GET(request: NextRequest) {
  try {
    // Get today's date at midnight (start of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get tomorrow's date at midnight (end of day)
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check if daily challenge exists for today
    const existingDailyChallenge = await prisma.challenge.findFirst({
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

    // Get or create system user for daily challenges
    const systemUser = await getOrCreateSystemUser();

    // Generate a new daily challenge (regardless of whether one exists)
    let newDailyChallenge;
    try {
      const generatedChallenge = await generateDailyChallenge();
      
      newDailyChallenge = await prisma.challenge.create({
        data: {
          title: generatedChallenge.title,
          description: generatedChallenge.description,
          difficulty: generatedChallenge.difficulty,
          tags: generatedChallenge.tags,
          createdById: systemUser.id,
          isDaily: true,
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

      console.log('Generated new daily challenge:', newDailyChallenge.title);
    } catch (error) {
      console.error('Error generating daily challenge:', error);
      
      // If generation fails and no existing challenge, return error
      if (!existingDailyChallenge) {
        return NextResponse.json(
          { 
            error: 'Failed to generate daily challenge',
            message: 'Unable to create daily challenge for today'
          },
          { status: 500 }
        );
      }
      
      // If generation fails but existing challenge exists, return the existing one
      return NextResponse.json({
        dailyChallenge: existingDailyChallenge,
        date: today.toISOString().split('T')[0],
        message: 'Using existing daily challenge (generation failed)'
      });
    }

    return NextResponse.json({
      dailyChallenge: newDailyChallenge,
      date: today.toISOString().split('T')[0],
      message: existingDailyChallenge ? 'Generated new daily challenge (replacing existing)' : 'Generated new daily challenge'
    });

  } catch (error) {
    console.error('Error in daily challenge API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
