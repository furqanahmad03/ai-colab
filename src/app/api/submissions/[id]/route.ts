import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, Submission } from "@prisma/client";
import OpenAI from "openai";
import { promptData } from "@/lib/prompts";

const prisma = new PrismaClient();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface SubmissionRequest {
  userId: string;
  code: string;
  language: string;
}

interface AIEvaluationResponse {
  result: "PASS" | "FAIL" | "ERROR" | "PENDING";
  score: number;
  runtime?: number;
  memory?: number;
  explanation: string;
}

async function evaluateSubmission(
  submissionId: string
): Promise<{ evaluation: AIEvaluationResponse; submission: Submission }> {
  try {
    console.log("🤖 Starting AI evaluation for submission:", submissionId);

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        challenge: true,
        user: true,
      },
    });

    if (!submission) {
      throw new Error("Submission not found");
    }

    console.log(
      "📝 Evaluating code for challenge:",
      submission.challenge.title
    );

    // Parse challenge description to extract components
    const description = submission.challenge.description;

    // Handle both string and JSON object descriptions
    let descriptionText = "";
    if (typeof description === "string") {
      descriptionText = description;
    } else if (typeof description === "object" && description !== null) {
      // If it's a JSON object, extract the problem statement
      const descObj = description as { problemStatement: string };
      descriptionText = descObj.problemStatement || JSON.stringify(description);
    } else {
      descriptionText = String(description);
    }

    const lines = descriptionText.split("\n");

    let problemStatement = "";
    let inputFormat = "";
    let constraints = "";
    let outputFormat = "";
    let examples = "";

    let currentSection = "";
    for (const line of lines) {
      if (line.includes("Problem Statement:")) {
        currentSection = "problemStatement";
        problemStatement = line.replace("Problem Statement:", "").trim();
      } else if (line.includes("Input Format:")) {
        currentSection = "inputFormat";
        inputFormat = line.replace("Input Format:", "").trim();
      } else if (line.includes("Constraints:")) {
        currentSection = "constraints";
        constraints = line.replace("Constraints:", "").trim();
      } else if (line.includes("Output Format:")) {
        currentSection = "outputFormat";
        outputFormat = line.replace("Output Format:", "").trim();
      } else if (line.includes("Examples:")) {
        currentSection = "examples";
        examples = line.replace("Examples:", "").trim();
      } else if (line.trim() && currentSection) {
        // Append to current section
        switch (currentSection) {
          case "problemStatement":
            problemStatement += "\n" + line.trim();
            break;
          case "inputFormat":
            inputFormat += "\n" + line.trim();
            break;
          case "constraints":
            constraints += "\n" + line.trim();
            break;
          case "outputFormat":
            outputFormat += "\n" + line.trim();
            break;
          case "examples":
            examples += "\n" + line.trim();
            break;
        }
      }
    }

    // Debug: Check if promptData is available
    console.log("🔍 Debug - promptData keys:", Object.keys(promptData));
    console.log(
      "🔍 Debug - submissionEvaluationUserPrompt exists:",
      !!promptData.submissionEvaluationUserPrompt
    );

    if (!promptData.submissionEvaluationUserPrompt) {
      throw new Error("submissionEvaluationUserPrompt not found in promptData");
    }

    // Create user prompt using the template
    const userPrompt = promptData.submissionEvaluationUserPrompt
      .replace("{title}", submission.challenge.title)
      .replace("{problemStatement}", problemStatement)
      .replace("{inputFormat}", inputFormat)
      .replace("{constraints}", constraints)
      .replace("{outputFormat}", outputFormat)
      .replace("{examples}", examples)
      .replace("{language}", submission.language)
      .replace("{code}", submission.code);

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: promptData.submissionEvaluationSystemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      temperature: 0.1,
      max_tokens: 500,
    });

    const responseText = completion.choices[0]?.message?.content;

    if (!responseText) {
      throw new Error("Empty response from OpenAI");
    }

    // Parse the JSON response (should be clean JSON from our prompt)
    let evaluation: AIEvaluationResponse;
    try {
      evaluation = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", responseText);
      throw new Error("Failed to parse AI evaluation response");
    }

    // Validate the response structure
    if (
      !evaluation.result ||
      !["PASS", "FAIL", "ERROR", "PENDING"].includes(evaluation.result)
    ) {
      throw new Error("Invalid result in AI response");
    }

    if (
      typeof evaluation.score !== "number" ||
      evaluation.score < 0 ||
      evaluation.score > 100
    ) {
      throw new Error("Invalid score in AI response");
    }

    // Update submission with evaluation results
    const updatedSubmission = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        result: evaluation.result,
        score: evaluation.score,
        runtime: evaluation.runtime || null,
        memory: evaluation.memory || null,
      },
    });

    console.log("✅ AI evaluation completed:", evaluation);

    return { evaluation, submission: updatedSubmission };
  } catch (error) {
    console.error("💥 Error in AI evaluation:", error);
    throw error instanceof Error
      ? error
      : new Error("Unknown evaluation error");
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: challengeId } = await params;
    console.log("🚀 Starting submission process for challenge:", challengeId);

    let body: SubmissionRequest;

    try {
      body = await request.json();
      console.log("📥 Request body parsed successfully:", {
        userId: body.userId,
        language: body.language,
        codeLength: body.code?.length,
      });
    } catch (jsonError) {
      console.error("❌ JSON parsing error:", jsonError);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { userId, code, language } = body;

    if (!userId || !code || !language) {
      console.error("❌ Missing required fields:", {
        userId: !!userId,
        code: !!code,
        language: !!language,
      });
      return NextResponse.json(
        { error: "Missing required fields: userId, code, language" },
        { status: 400 }
      );
    }

    console.log("✅ All required fields present");

    // Verify that the challenge exists
    console.log("🔍 Looking for challenge with ID:", challengeId);
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      console.error("❌ Challenge not found:", challengeId);
      return NextResponse.json(
        { error: "Challenge not found" },
        { status: 404 }
      );
    }

    console.log("✅ Challenge found:", {
      id: challenge.id,
      title: challenge.title,
      difficulty: challenge.difficulty,
    });

    // Create the submission
    console.log("💾 Creating submission in database...");
    const submission = await prisma.submission.create({
      data: {
        userId,
        challengeId,
        code,
        language,
        result: "PENDING",
      },
    });

    console.log("✅ Submission created successfully:", {
      id: submission.id,
      userId: submission.userId,
      challengeId: submission.challengeId,
    });

    // Automatically evaluate the submission using AI
    console.log("🤖 Starting AI submission evaluation...");
    try {
      const { evaluation, submission: updatedSubmission } =
        await evaluateSubmission(submission.id);

      console.log("✅ AI evaluation completed successfully:", evaluation);

      return NextResponse.json({
        message: "Submission created and evaluated successfully",
        submission: updatedSubmission,
        evaluation,
      });
    } catch (evaluationError) {
      // If evaluation fails, still return the submission but with error info
      console.error("⚠️ AI evaluation failed:", evaluationError);
      return NextResponse.json({
        message: "Submission created successfully, but AI evaluation failed",
        submission,
        evaluationError: "Failed to evaluate submission with AI",
      });
    }
  } catch (error) {
    console.error("💥 CRITICAL ERROR in submission endpoint:", error);
    console.error("Error details:", {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      cause: error instanceof Error ? error.cause : undefined,
    });

    return NextResponse.json(
      {
        error: "Internal server error",
        details:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // 'submission' or 'challenge'
    const userId = searchParams.get("userId"); // Get userId from query params

    console.log("🔍 GET request for ID:", id, "Type:", type);

    // If type=submission, fetch a specific submission
    if (type === "submission" || id.length === 24) {
      console.log("📝 Fetching individual submission...");

      // Find the specific submission
      const submission = await prisma.submission.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          challenge: {
            select: {
              id: true,
              title: true,
              description: true,
              difficulty: true,
              tags: true,
            },
          },
        },
      });

      if (!submission) {
        console.log("❌ Submission not found:", id);
        return NextResponse.json(
          { error: "Submission not found" },
          { status: 404 }
        );
      }

      // Check if the submission belongs to the requesting user
      if (userId && submission.userId !== userId) {
        console.log("❌ Access denied - Submission doesn't belong to user:", {
          submissionUserId: submission.userId,
          requestingUserId: userId,
        });
        return NextResponse.json(
          { error: "Access denied - This submission doesn't belong to you" },
          { status: 403 }
        );
      }

      console.log("✅ Submission found:", {
        id: submission.id,
        result: submission.result,
        score: submission.score,
        challenge: submission.challenge.title,
      });

      return NextResponse.json({
        submission,
        message: "Submission fetched successfully",
      });
    }

    // Otherwise, fetch all submissions for a challenge (original behavior)
    console.log("📊 Fetching submissions for challenge...");

    const challengeId = id;

    // Verify that the challenge exists
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      return NextResponse.json(
        { error: "Challenge not found" },
        { status: 404 }
      );
    }

    const submissions = await prisma.submission.findMany({
      where: {
        challengeId: challengeId,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      challenge,
      submissions,
    });
  } catch (error) {
    console.error("💥 Error in GET endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
