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

async function isChallengeDuplicate(title: string, description: string): Promise<boolean> {
  // Check if a similar challenge already exists in DailyChallenge collection
  const existingDailyChallenges = await prisma.dailyChallenge.findMany({
    include: {
      challenge: true
    }
  });

  return existingDailyChallenges.some((dailyChallenge: any) => {
    const challenge = dailyChallenge.challenge;
    const titleSimilarity = challenge.title.toLowerCase().includes(title.toLowerCase()) || 
                           title.toLowerCase().includes(challenge.title.toLowerCase());
    const descriptionSimilarity = challenge.description.toLowerCase().includes(description.toLowerCase()) ||
                                 description.toLowerCase().includes(challenge.description.toLowerCase());
    
    return titleSimilarity || descriptionSimilarity;
  });
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
    const existingDailyChallenge = await prisma.dailyChallenge.findFirst({
      where: {
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        challenge: {
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
        },
      },
    });

    // If daily challenge exists for today, return it immediately
    if (existingDailyChallenge) {
      return NextResponse.json({
        dailyChallenge: existingDailyChallenge.challenge,
        date: today.toISOString().split('T')[0],
        message: 'Returning existing daily challenge for today'
      });
    }

    // Get or create system user for daily challenges
    const systemUser = await getOrCreateSystemUser();

    // Generate a new daily challenge (regardless of whether one exists)
    let newDailyChallenge: any = null;
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      attempts++;
      
      try {
        const generatedChallenge = await generateDailyChallenge();
        
        // Check if this challenge is a duplicate
        const isDuplicate = await isChallengeDuplicate(generatedChallenge.title, generatedChallenge.description);
        
        if (isDuplicate) {
          console.log(`Attempt ${attempts}: Duplicate challenge detected, regenerating...`);
          continue;
        }

        // Create the challenge first
        const newChallenge = await prisma.challenge.create({
          data: {
            title: generatedChallenge.title,
            description: generatedChallenge.description,
            difficulty: generatedChallenge.difficulty,
            tags: generatedChallenge.tags,
            createdById: systemUser.id,
            isDaily: true,
          },
        });

        // Create the daily challenge record
        newDailyChallenge = await prisma.dailyChallenge.create({
          data: {
            challengeId: newChallenge.id,
            date: today,
          },
          include: {
            challenge: {
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
            },
          },
        });

        console.log('Generated new daily challenge:', newDailyChallenge.challenge.title);
        break; // Successfully created, exit the loop
        
      } catch (error) {
        console.error(`Error generating daily challenge (attempt ${attempts}):`, error);
        
        if (attempts === maxAttempts) {
          return NextResponse.json(
            { 
              error: 'Failed to generate daily challenge after multiple attempts',
              message: 'Unable to create daily challenge for today'
            },
            { status: 500 }
          );
        }
      }
    }

    // If we successfully created a new daily challenge
    if (newDailyChallenge) {
      return NextResponse.json({
        dailyChallenge: newDailyChallenge.challenge,
        date: today.toISOString().split('T')[0],
        message: 'Generated new daily challenge for today'
      });
    }

    // Final fallback: return error
    return NextResponse.json(
      { 
        error: 'Failed to generate daily challenge',
        message: 'Unable to provide daily challenge for today'
      },
      { status: 500 }
    );

  } catch (error) {
    console.error('Error in daily challenge API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
