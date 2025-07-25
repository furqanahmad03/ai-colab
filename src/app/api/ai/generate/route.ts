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

            const prompt = 
              'Generate a unique coding challenge with the following specifications:\n' +
              '- Category: ' + category + '\n' +
              difficultyPrompt + '\n' +
              '- Must be completely different from these existing challenges: ' + JSON.stringify(existingChallenges.map((c: { title: string; description: string }) => c.title)) + '\n' +
              '- Must be different from these already generated: ' + JSON.stringify(generatedChallenges.map((c: GeneratedChallenge) => c.title)) + '\n\n' +
              'Return a clean, well-structured problem statement in plain text format (no markdown, no JSON, no special characters like * or `). The response should include:\n\n' +
              '1. A clear problem title\n' +
              '2. Detailed problem description with requirements\n' +
              '3. Input format and constraints\n' +
              '4. Output format\n' +
              '5. Examples with input/output pairs\n' +
              '6. Relevant programming concepts and tags\n\n' +
              'Make sure the challenge is:\n' +
              '- Focused on ' + category + ' concepts\n' +
              '- Well-structured with clear requirements\n' +
              '- Includes input/output examples\n' +
              '- Has relevant programming concepts\n' +
              '- Is unique and not similar to existing challenges\n' +
              '- If difficulty not specified, choose appropriate level based on problem complexity\n' +
              '- Written in clean, readable text that can be displayed directly in HTML';

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

            // Process the plain text response directly
            let challenge: GeneratedChallenge;
            try {
                // Extract title from the first line or generate one
                const lines = text.split('\n').filter(line => line.trim());
                const title = lines[0]?.trim() || 'Generated ' + category + ' Challenge';
                
                // Use the full text as description
                const description = text.trim();
                
                // Use the requested difficulty level, or determine based on content analysis if not specified
                let difficulty: 'EASY' | 'MEDIUM' | 'HARD' = difficultyLevel || 'MEDIUM';
                
                // Get lowercase text for analysis
                const lowerText = text.toLowerCase();
                
                // Only analyze content for difficulty if no specific difficulty was requested
                if (!difficultyLevel) {
                    if (lowerText.includes('simple') || lowerText.includes('basic') || lowerText.includes('easy')) {
                        difficulty = 'EASY';
                    } else if (lowerText.includes('complex') || lowerText.includes('advanced') || lowerText.includes('hard')) {
                        difficulty = 'HARD';
                    }
                }
                
                // Extract tags based on category and content
                const tags: string[] = [];
                if (category.includes('PF') || category.includes('Programming Fundamentals')) {
                    tags.push('Programming Fundamentals', 'Basic Concepts', 'Variables', 'Control Flow');
                } else if (category.includes('OOP') || category.includes('Object-Oriented')) {
                    tags.push('Object-Oriented Programming', 'Classes', 'Inheritance', 'Polymorphism');
                } else if (category.includes('DSA') || category.includes('Data Structures')) {
                    tags.push('Data Structures', 'Algorithms', 'Arrays', 'Sorting');
                }
                
                // Add content-based tags
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