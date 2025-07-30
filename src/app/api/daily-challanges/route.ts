import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import { promptData } from '@/lib/prompts';

const prisma = new PrismaClient();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ChallengeDescription {
  problemStatement: string;
  inputFormat: string;
  constraints: string;
  outputFormat: string;
  examples: Array<{
    input: string;
    output: string;
    explanation: string;
  }>;
}

interface GeneratedChallenge {
  title: string;
  description: ChallengeDescription;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  tags: string[];
}

interface AIResponse {
  challenges: GeneratedChallenge[];
}

async function generateDailyChallenge(): Promise<GeneratedChallenge> {
  const difficulties = ['EASY', 'MEDIUM', 'HARD'];
  const randomDifficulty = difficulties[Math.floor(Math.random() * difficulties.length)];

  // Get existing daily challenges to avoid duplicates
  const existingDailyChallenges = await prisma.dailyChallenge.findMany({
    include: {
      challenge: true
    }
  });

  const existingTitles = existingDailyChallenges.map(dc => dc.challenge.title);

  // Prepare the prompt
  const difficultyDesc = promptData.difficultyDescriptions[randomDifficulty as keyof typeof promptData.difficultyDescriptions];

  const userPrompt = promptData.dailyChallengeUserPromptTemplate
    .replace('{difficultyLevel}', difficultyDesc)
    .replace('{existingChallenges}', JSON.stringify(existingTitles))
    .replace('{alreadyGenerated}', JSON.stringify([]));

  // Call OpenAI API
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: promptData.dailyChallengeSystemPrompt
      },
      {
        role: "user",
        content: userPrompt
      }
    ],
    temperature: 0.7,
    max_tokens: 3000,
  });

  const responseText = completion.choices[0]?.message?.content;
  
  if (!responseText) {
    throw new Error('Empty response from OpenAI');
  }

  // Parse the JSON response
  let aiResponse: AIResponse;
  try {
    // Extract JSON from the response (in case there's extra text)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    aiResponse = JSON.parse(jsonMatch[0]);
  } catch (parseError) {
    console.log('Failed to parse OpenAI response:', responseText);
    console.log('Parse error:', parseError);
    throw new Error('Failed to parse AI response');
  }

  if (!aiResponse.challenges || !Array.isArray(aiResponse.challenges) || aiResponse.challenges.length === 0) {
    throw new Error('Invalid response structure');
  }

  const challenge = aiResponse.challenges[0];

  // Validate challenge structure
  if (!challenge.title || !challenge.description || !challenge.difficulty || !challenge.tags) {
    throw new Error('Invalid challenge structure');
  }

  // Validate description structure
  const desc = challenge.description;
  if (!desc.problemStatement || !desc.inputFormat || !desc.constraints || !desc.outputFormat || !desc.examples) {
    throw new Error('Invalid description structure');
  }

  // Validate difficulty
  if (!['EASY', 'MEDIUM', 'HARD'].includes(challenge.difficulty)) {
    challenge.difficulty = randomDifficulty as 'EASY' | 'MEDIUM' | 'HARD';
  }

  // Ensure daily challenge tags are included
  if (!challenge.tags.includes('daily-practice')) {
    challenge.tags.push('daily-practice');
  }
  if (!challenge.tags.includes('fundamentals')) {
    challenge.tags.push('fundamentals');
  }

  return challenge;
}

async function getOrCreateSystemUser() {
  // Try to find existing system user
  let systemUser = await prisma.user.findFirst({
    where: {
      email: 'system@daily-challenge.com',
    },
  });

  // If not found, create one
  if (!systemUser) {
    systemUser = await prisma.user.create({
      data: {
        email: 'system@daily-challenge.com',
        name: 'Daily Challenge System',
        role: 'ADMIN',
      },
    });
  }

  return systemUser;
}

async function isChallengeDuplicate(title: string, description: string): Promise<boolean> {
  const existingDailyChallenges = await prisma.dailyChallenge.findMany({
    include: {
      challenge: true
    }
  });

  return existingDailyChallenges.some((dailyChallenge) => {
    const challenge = dailyChallenge.challenge;
    const titleSimilarity = challenge.title.toLowerCase().includes(title.toLowerCase()) || 
                           title.toLowerCase().includes(challenge.title.toLowerCase());
    const descriptionSimilarity = typeof challenge.description === 'string' && 
                                 (challenge.description.toLowerCase().includes(description.toLowerCase()) ||
                                 description.toLowerCase().includes(challenge.description.toLowerCase()));
    
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

    // Use a transaction to prevent race conditions
    return await prisma.$transaction(async (tx) => {
      // Check if daily challenge exists for today (within transaction)
      const existingDailyChallenge = await tx.dailyChallenge.findFirst({
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

      // Generate a new daily challenge
      let newDailyChallenge: any = null;
      let attempts = 0;
      const maxAttempts = 5;

      while (attempts < maxAttempts) {
        attempts++;
        
        try {
          const generatedChallenge = await generateDailyChallenge();
          
          // Check if this challenge is a duplicate (within transaction)
          const isDuplicate = await isChallengeDuplicate(generatedChallenge.title, generatedChallenge.description.problemStatement);
          
          if (isDuplicate) {
            console.log(`Attempt ${attempts}: Duplicate challenge detected, regenerating...`);
            continue;
          }

          // Format description for database storage
          const formattedDescription = `${generatedChallenge.description.problemStatement}\n\nInput Format:\n${generatedChallenge.description.inputFormat}\n\nConstraints:\n${generatedChallenge.description.constraints}\n\nOutput Format:\n${generatedChallenge.description.outputFormat}\n\nExamples:\n${generatedChallenge.description.examples.map((ex, i) => `Example ${i + 1}:\nInput: ${ex.input}\nOutput: ${ex.output}\nExplanation: ${ex.explanation}`).join('\n\n')}`;

          // Create the challenge first (within transaction)
          const newChallenge = await tx.challenge.create({
            data: {
              title: generatedChallenge.title,
              description: formattedDescription,
              difficulty: generatedChallenge.difficulty,
              tags: generatedChallenge.tags,
              createdById: systemUser.id,
              isDaily: true,
            },
          });

          // Create the daily challenge entry (within transaction)
          newDailyChallenge = await tx.dailyChallenge.create({
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

          console.log(`✅ Daily challenge generated successfully on attempt ${attempts}`);
          break;

        } catch (error) {
          console.error(`❌ Error on attempt ${attempts}:`, error);
          
          // Check if it's a unique constraint violation (race condition)
          if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
            console.log('Race condition detected - another request created the daily challenge');
            
            // Try to fetch the existing daily challenge
            const existingChallenge = await tx.dailyChallenge.findFirst({
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

            if (existingChallenge) {
              return NextResponse.json({
                dailyChallenge: existingChallenge.challenge,
                date: today.toISOString().split('T')[0],
                message: 'Daily challenge created by another request'
              });
            }
          }
          
          if (attempts === maxAttempts) {
            throw new Error(`Failed to generate daily challenge after ${maxAttempts} attempts`);
          }
        }
      }

      if (!newDailyChallenge) {
        throw new Error('Failed to generate daily challenge');
      }

      return NextResponse.json({
        dailyChallenge: newDailyChallenge.challenge,
        date: today.toISOString().split('T')[0],
        message: 'New daily challenge generated successfully'
      });
    });

  } catch (error) {
    console.error('Error in daily challenge generation:', error);
    return NextResponse.json(
      { error: 'Failed to generate daily challenge' },
      { status: 500 }
    );
  }
}
