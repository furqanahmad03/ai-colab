import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { GoogleGenAI } from '@google/genai';

const prisma = new PrismaClient();

const ai = new GoogleGenAI({});

interface GenerateRequest {
  userId: string;
  numberOfChallenges: number;
  difficultyLevel?: 'EASY' | 'MEDIUM' | 'HARD';
}

interface GeneratedChallenge {
  title: string;
  description: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  tags: string[];
}

export async function POST(request: NextRequest) {
  try {
    let body: GenerateRequest;
    
    try {
      body = await request.json();
    } catch (jsonError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body. Please check your request format.' },
        { status: 400 }
      );
    }

    const { userId, numberOfChallenges, difficultyLevel } = body;
    console.log(userId, numberOfChallenges, difficultyLevel);

    if (!userId || !numberOfChallenges) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, numberOfChallenges' },
        { status: 400 }
      );
    }

    if (numberOfChallenges < 1 || numberOfChallenges > 10) {
      return NextResponse.json(
        { error: 'numberOfChallenges must be between 1 and 10' },
        { status: 400 }
      );
    }

    const existingChallenges = await prisma.challenge.findMany({
      where: {
        createdById: userId,
      },
      select: {
        title: true,
        description: true,
      },
    });

    const categories = ['Programming Fundamentals (PF)', 'Object-Oriented Programming (OOP)', 'Data Structures & Algorithms (DSA)'];
    const generatedChallenges: GeneratedChallenge[] = [];
    const maxAttemptsPerProblem = 5; // Maximum attempts to generate a single problem

    // Generate problems for each category
    for (const category of categories) {
      for (let i = 0; i < numberOfChallenges; i++) {
        let attempts = 0;
        let challengeGenerated = false;

        while (!challengeGenerated && attempts < maxAttemptsPerProblem) {
          attempts++;

          try {
            let difficultyPrompt = '';
            if (difficultyLevel) {
              difficultyPrompt = `- Difficulty: ${difficultyLevel}`;
            } else {
              difficultyPrompt = `- Difficulty: You decide the appropriate difficulty level (EASY, MEDIUM, or HARD) based on the complexity of the problem`;
            }

            const prompt = `
Generate a unique coding challenge with the following specifications:
- Category: ${category}
${difficultyPrompt}
- Must be completely different from these existing challenges: ${JSON.stringify(existingChallenges.map((c: { title: string; description: string }) => c.title))}
- Must be different from these already generated: ${JSON.stringify(generatedChallenges.map((c: GeneratedChallenge) => c.title))}

Return the response in this exact JSON format:
{
  "title": "Challenge Title",
  "description": "Detailed problem description with requirements, constraints, and examples",
  "difficulty": "EASY|MEDIUM|HARD",
  "tags": ["tag1", "tag2", "tag3"]
}

Make sure the challenge is:
- Focused on ${category} concepts
- Well-structured with clear requirements
- Includes input/output examples
- Has relevant programming tags
- Is unique and not similar to existing challenges
- If difficulty not specified, choose appropriate level based on problem complexity
`;

            const model = ai.models.generateContent({
              model: "gemini-2.5-flash",
              contents: prompt,
            });
            const response = await model;
            const text = response.text || '';

            if (!text) {
              console.log('Empty response from Gemini');
              continue;
            }

            // Extract JSON from response with better error handling
            let challenge: GeneratedChallenge;
            try {
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (!jsonMatch) {
                    console.log('Failed to extract JSON from Gemini response:', text);
                    continue;
                }

                // Try to clean and parse the JSON
                let jsonString = jsonMatch[0];
                
                // Remove any markdown formatting
                jsonString = jsonString.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
                
                // Try to fix common JSON issues
                jsonString = jsonString.replace(/,(\s*[}\]])/g, '$1'); // Remove trailing commas
                jsonString = jsonString.replace(/([^"\\])\s*"/g, '$1"'); // Fix unescaped quotes
                
                challenge = JSON.parse(jsonString);
            } catch (parseError) {
                console.log('Failed to parse JSON from Gemini response:', text);
                console.log('Parse error:', parseError);
                continue;
            }

            if (!challenge.title || !challenge.description || !challenge.difficulty || !challenge.tags) {
              console.log('Invalid challenge structure:', challenge);
              continue;
            }

            const isDuplicate = existingChallenges.some((existing: { title: string; description: string }) => 
              existing.title.toLowerCase() === challenge.title.toLowerCase() ||
              existing.description.toLowerCase() === challenge.description.toLowerCase()
            );

            const isAlreadyGenerated = generatedChallenges.some((generated: GeneratedChallenge) =>
              generated.title.toLowerCase() === challenge.title.toLowerCase() ||
              generated.description.toLowerCase() === challenge.description.toLowerCase()
            );

            if (!isDuplicate && !isAlreadyGenerated) {
              generatedChallenges.push(challenge);
              challengeGenerated = true;
            } else {
              console.log(`Duplicate detected for ${category}, regenerating...`);
            }

          } catch (error) {
            console.error('Error generating challenge:', error);
            continue;
          }
        }

        if (!challengeGenerated) {
          console.log(`Failed to generate unique challenge for ${category} after ${maxAttemptsPerProblem} attempts`);
        }
      }
    }

    if (generatedChallenges.length === 0) {
      return NextResponse.json(
        { error: 'Failed to generate any unique challenges after multiple attempts' },
        { status: 500 }
      );
    }

    const savedChallenges = [];
    
    // Save all generated challenges to database
    for (const challenge of generatedChallenges) {
      try {
        const savedChallenge = await prisma.challenge.create({
          data: {
            title: challenge.title,
            description: challenge.description,
            difficulty: challenge.difficulty,
            tags: challenge.tags,
            createdById: userId,
            isDaily: false,
          },
        });
        savedChallenges.push(savedChallenge);
      } catch (error) {
        console.error('Error saving challenge:', error);
      }
    }

    return NextResponse.json({
      generatedChallenges: generatedChallenges,
      savedChallenges: savedChallenges,
      message: `Successfully generated ${savedChallenges.length} unique challenges (${numberOfChallenges} each for PF, OOP, and DSA)`,
      challenges: savedChallenges,
      totalGenerated: generatedChallenges.length,
      totalSaved: savedChallenges.length,
      breakdown: {
        requested: numberOfChallenges,
        totalGenerated: generatedChallenges.length,
        perCategory: numberOfChallenges
      }
    });

  } catch (error) {
    console.error('Error in generate challenges:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}