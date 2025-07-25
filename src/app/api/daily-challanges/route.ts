import { NextResponse } from 'next/server';
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

  const prompt = 
    'Generate a unique daily coding challenge with the following specifications:\n' +
    '- Category: ' + randomCategory + '\n' +
    '- Difficulty: ' + randomDifficulty + '\n' +
    '- Must be engaging and suitable for daily practice\n' +
    '- Should be solvable in 15-30 minutes\n\n' +
    'Return a clean, well-structured problem statement in plain text format (no markdown, no JSON, no special characters like * or `). The response should include:\n\n' +
    '1. A clear problem title\n' +
    '2. Detailed problem description with requirements\n' +
    '3. Input format and constraints\n' +
    '4. Output format\n' +
    '5. Examples with input/output pairs\n' +
    '6. Relevant programming concepts and tags\n\n' +
    'Make sure the challenge is:\n' +
    '- Focused on ' + randomCategory + ' concepts\n' +
    '- Well-structured with clear requirements\n' +
    '- Includes input/output examples\n' +
    '- Has relevant programming concepts\n' +
    '- Is engaging for daily practice\n' +
    '- Written in clean, readable text that can be displayed directly in HTML';

  const model = ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });
  const response = await model;
  const text = response.text || '';

  if (!text) {
    throw new Error('Empty response from Gemini');
  }

  // Process the plain text response directly
  let challenge: GeneratedChallenge;
  try {
    // Extract title from the first line or generate one
    const lines = text.split('\n').filter(line => line.trim());
    const title = lines[0]?.trim() || 'Generated Daily Challenge';
    
    // Use the full text as description
    const description = text.trim();
    
    // Use the specified difficulty
    const difficulty: 'EASY' | 'MEDIUM' | 'HARD' = randomDifficulty as 'EASY' | 'MEDIUM' | 'HARD';
    
    // Extract tags based on category and content
    const tags: string[] = [];
    if (randomCategory.includes('PF') || randomCategory.includes('Programming Fundamentals')) {
      tags.push('Programming Fundamentals', 'Basic Concepts', 'Variables', 'Control Flow');
    } else if (randomCategory.includes('OOP') || randomCategory.includes('Object-Oriented')) {
      tags.push('Object-Oriented Programming', 'Classes', 'Inheritance', 'Polymorphism');
    } else if (randomCategory.includes('DSA') || randomCategory.includes('Data Structures')) {
      tags.push('Data Structures', 'Algorithms', 'Arrays', 'Sorting');
    }
    
    // Add content-based tags
    const lowerText = text.toLowerCase();
    if (lowerText.includes('array')) tags.push('Arrays');
    if (lowerText.includes('string')) tags.push('Strings');
    if (lowerText.includes('tree')) tags.push('Trees');
    if (lowerText.includes('graph')) tags.push('Graphs');
    if (lowerText.includes('dynamic programming') || lowerText.includes('dp')) tags.push('Dynamic Programming');
    if (lowerText.includes('recursion')) tags.push('Recursion');
    if (lowerText.includes('sorting')) tags.push('Sorting');
    if (lowerText.includes('searching')) tags.push('Searching');
    
    challenge = {
      title,
      description,
      difficulty,
      tags: [...new Set(tags)] // Remove duplicates
    };
  } catch (parseError) {
    console.log('Failed to process Gemini response:', text);
    console.log('Parse error:', parseError);
    throw new Error('Failed to process AI response');
  }

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

  return existingDailyChallenges.some((dailyChallenge: {
    challenge: {
      title: string;
      description: string;
    };
  }) => {
    const challenge = dailyChallenge.challenge;
    const titleSimilarity = challenge.title.toLowerCase().includes(title.toLowerCase()) || 
                           title.toLowerCase().includes(challenge.title.toLowerCase());
    const descriptionSimilarity = challenge.description.toLowerCase().includes(description.toLowerCase()) ||
                                 description.toLowerCase().includes(challenge.description.toLowerCase());
    
    return titleSimilarity || descriptionSimilarity;
  });
}

export async function GET() {
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
    let newDailyChallenge: unknown = null;
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
        try {
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
        } catch (createError: unknown) {
          // If it's a unique constraint violation, it means another request already created today's challenge
          if ((createError as { code?: string }).code === 'P2002') {
            console.log('Daily challenge already exists for today, fetching existing one...');
            
            // Delete the challenge we just created since we can't link it to daily challenge
            await prisma.challenge.delete({
              where: { id: newChallenge.id }
            });
            
            // Fetch the existing daily challenge
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
            
            if (existingDailyChallenge) {
              return NextResponse.json({
                dailyChallenge: existingDailyChallenge.challenge,
                date: today.toISOString().split('T')[0],
                message: 'Returning existing daily challenge for today'
              });
            }
          }
          
          // Re-throw other errors
          throw createError;
        }

        console.log('Generated new daily challenge:', (newDailyChallenge as { challenge: { title: string } }).challenge.title);
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
        dailyChallenge: (newDailyChallenge as { challenge: { title: string } }).challenge,
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
