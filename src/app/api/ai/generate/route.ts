import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";
import { promptData } from "../../../../lib/prompts";

const prisma = new PrismaClient();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Check if OpenAI API key is configured
if (!process.env.OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY is not configured");
}

interface GenerateRequest {
  userId: string;
  difficultyLevel: "EASY" | "MEDIUM" | "HARD";
  categories: ("PF" | "OOP" | "DSA")[];
}

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
  difficulty: "EASY" | "MEDIUM" | "HARD";
  tags: string[];
}

interface AIResponse {
  challenges: GeneratedChallenge[];
}

export async function POST(request: NextRequest) {
  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error:
            "OpenAI API key is not configured. Please set OPENAI_API_KEY environment variable.",
        },
        { status: 500 }
      );
    }

    const body: GenerateRequest = await request.json();
    const { userId, difficultyLevel, categories } = body;

    // Validation
    if (!userId || !difficultyLevel || !categories || categories.length === 0) {
      return NextResponse.json(
        {
          error: "Missing required fields: userId, difficultyLevel, categories",
        },
        { status: 400 }
      );
    }

    if (!["EASY", "MEDIUM", "HARD"].includes(difficultyLevel)) {
      return NextResponse.json(
        { error: "difficultyLevel must be one of: EASY, MEDIUM, HARD" },
        { status: 400 }
      );
    }

    if (categories.length > 3) {
      return NextResponse.json(
        { error: "Maximum 3 categories allowed" },
        { status: 400 }
      );
    }

    const validCategories = ["PF", "OOP", "DSA"];
    if (!categories.every((cat) => validCategories.includes(cat))) {
      return NextResponse.json(
        { error: "categories must be one or more of: PF, OOP, DSA" },
        { status: 400 }
      );
    }

    // Get existing challenges from database
    const existingChallenges = await prisma.challenge.findMany({
      where: {
        createdById: userId,
      },
      select: {
        title: true,
        description: true,
      },
    });

    const generatedChallenges: GeneratedChallenge[] = [];
    const maxAttemptsPerProblem = 5;

    // Generate one problem for each selected category
    for (const category of categories) {
      let attempts = 0;
      let challengeGenerated = false;

      while (!challengeGenerated && attempts < maxAttemptsPerProblem) {
        attempts++;

        try {
          // Prepare the prompt
          const categoryDescription =
            promptData.categories[
              category as keyof typeof promptData.categories
            ];
          const difficultyDesc =
            promptData.difficultyDescriptions[
              difficultyLevel as keyof typeof promptData.difficultyDescriptions
            ];

          const userPrompt = promptData.userPromptTemplate
            .replace("{numberOfProblems}", "1")
            .replace("{problemType}", categoryDescription)
            .replace("{difficultyLevel}", difficultyDesc)
            .replace(
              "{existingChallenges}",
              JSON.stringify(existingChallenges.map((c) => c.title))
            )
            .replace(
              "{alreadyGenerated}",
              JSON.stringify(generatedChallenges.map((c) => c.title))
            );

          // Call OpenAI API
          const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: promptData.systemPrompt,
              },
              {
                role: "user",
                content: userPrompt,
              },
            ],
            temperature: 0.7,
            max_tokens: 3000,
          });

          const responseText = completion.choices[0]?.message?.content;

          if (!responseText) {
            console.log("Empty response from OpenAI");
            continue;
          }

          // Parse the JSON response
          let aiResponse: AIResponse;
          try {
            // Extract JSON from the response (in case there's extra text)
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
              console.log("No JSON found in response:", responseText);
              continue;
            }

            aiResponse = JSON.parse(jsonMatch[0]);
          } catch (parseError) {
            console.log("Failed to parse OpenAI response:", responseText);
            console.log("Parse error:", parseError);
            continue;
          }

          if (
            !aiResponse.challenges ||
            !Array.isArray(aiResponse.challenges) ||
            aiResponse.challenges.length === 0
          ) {
            console.log("Invalid response structure:", aiResponse);
            continue;
          }

          const challenge = aiResponse.challenges[0];

          // Validate challenge structure
          if (
            !challenge.title ||
            !challenge.description ||
            !challenge.difficulty ||
            !challenge.tags
          ) {
            console.log("Invalid challenge structure:", challenge);
            continue;
          }

          // Validate description structure
          const desc = challenge.description;
          if (
            !desc.problemStatement ||
            !desc.inputFormat ||
            !desc.constraints ||
            !desc.outputFormat ||
            !desc.examples
          ) {
            console.log("Invalid description structure:", desc);
            continue;
          }

          // Validate difficulty
          if (!["EASY", "MEDIUM", "HARD"].includes(challenge.difficulty)) {
            challenge.difficulty = difficultyLevel;
          }

          // Check for duplicates
          const isDuplicate = existingChallenges.some(
            (existing) =>
              existing.title.toLowerCase() === challenge.title.toLowerCase() ||
              (typeof existing.description === "string" &&
                existing.description.toLowerCase() ===
                  challenge.description.problemStatement.toLowerCase())
          );

          const isAlreadyGenerated = generatedChallenges.some(
            (generated) =>
              generated.title.toLowerCase() === challenge.title.toLowerCase() ||
              generated.description.problemStatement.toLowerCase() ===
                challenge.description.problemStatement.toLowerCase()
          );

          if (!isDuplicate && !isAlreadyGenerated) {
            generatedChallenges.push(challenge);
            challengeGenerated = true;
          } else {
            console.log(`Duplicate detected for ${category}, regenerating...`);
          }
        } catch (error) {
          console.error("Error generating challenge:", error);
          continue;
        }
      }

      if (!challengeGenerated) {
        console.log(
          `Failed to generate unique challenge for ${category} after ${maxAttemptsPerProblem} attempts`
        );
      }
    }

    if (generatedChallenges.length === 0) {
      return NextResponse.json(
        {
          error:
            "Failed to generate any unique challenges after multiple attempts",
        },
        { status: 500 }
      );
    }

    const savedChallenges = [];

    // Save all generated challenges to database
    for (const challenge of generatedChallenges) {
      try {
        // Format description for database storage
        const formattedDescription = `${
          challenge.description.problemStatement
        }\n\nInput Format:\n${
          challenge.description.inputFormat
        }\n\nConstraints:\n${
          challenge.description.constraints
        }\n\nOutput Format:\n${
          challenge.description.outputFormat
        }\n\nExamples:\n${challenge.description.examples
          .map(
            (ex, i) =>
              `Example ${i + 1}:\nInput: ${ex.input}\nOutput: ${
                ex.output
              }\nExplanation: ${ex.explanation}`
          )
          .join("\n\n")}`;

        const savedChallenge = await prisma.challenge.create({
          data: {
            title: challenge.title,
            description: formattedDescription,
            difficulty: challenge.difficulty,
            tags: challenge.tags,
            createdById: userId,
            isDaily: false,
          },
        });
        savedChallenges.push(savedChallenge);
      } catch (error) {
        console.error("Error saving challenge:", error);
      }
    }

    return NextResponse.json({
      generatedChallenges: generatedChallenges,
      savedChallenges: savedChallenges,
      message: `Successfully generated ${savedChallenges.length} unique challenges`,
      challenges: savedChallenges,
      totalGenerated: generatedChallenges.length,
      totalSaved: savedChallenges.length,
      breakdown: {
        requestedCategories: categories,
        difficultyLevel: difficultyLevel,
        totalGenerated: generatedChallenges.length,
        perCategory: 1,
      },
    });
  } catch (error) {
    console.error("Error in generate challenges:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
