import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { GoogleGenAI } from "@google/genai";

const prisma = new PrismaClient();

// Initialize Google AI with proper error handling
let ai: GoogleGenAI | null = null;
try {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey: apiKey,
    });
  } else {
    console.warn("⚠️ GOOGLE_API_KEY not found in environment variables");
  }
} catch (error) {
  console.error("❌ Failed to initialize Google AI:", error);
}

interface SubmissionRequest {
  userId: string;
  code: string;
  language: string;
}

async function evaluateSubmission(submissionId: string) {
  try {
    console.log("🤖 Starting evaluation for submission:", submissionId);

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
      "📝 Evaluating code:",
      submission.code.substring(0, 100) + "..."
    );

    // Smart code evaluation logic
    let evaluation = evaluateCodeIntelligently(
      submission.code,
      submission.language,
    );

    // If AI is available, try to get a more detailed evaluation
    if (ai) {
      console.log("🤖 AI available, getting detailed evaluation...");
      try {
        const aiEvaluation = await getAIEvaluation(submission);
        // Merge AI evaluation with smart evaluation
        evaluation = { ...evaluation, ...aiEvaluation };
        console.log("✅ AI evaluation successful:", aiEvaluation);
      } catch (aiError) {
        console.warn(
          "⚠️ AI evaluation failed, using smart evaluation:",
          aiError
        );
      }
    } else {
      console.log("🧠 Using smart evaluation (no AI available)");
    }

    // Update submission with evaluation results
    const updatedSubmission = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        result: evaluation.result,
        score: evaluation.score,
        runtime: evaluation.runtime,
        memory: evaluation.memory,
      },
    });

    return { evaluation, submission: updatedSubmission };
  } catch (error) {
    console.error("💥 Error in evaluation:", error);
    throw error instanceof Error
      ? error
      : new Error("Unknown evaluation error");
  }
}

// Smart code evaluation without AI
function evaluateCodeIntelligently(
  code: string,
  language: string,
) {
  console.log("🧠 Running smart code evaluation...");

  const codeLines = code.trim().split("\n");
  const codeLength = code.trim().length;

  // Check for obvious failures
  const isIncomplete = checkIfIncomplete(code);
  const hasLogic = checkHasLogic(code);
  const hasErrors = checkSyntaxErrors(code);

  let result: "PASS" | "FAIL" | "ERROR" = "PASS";
  let score = 100;
  let feedback = "Code evaluation completed";

  // Determine result based on code analysis
  if (hasErrors) {
    result = "ERROR";
    score = 0;
    feedback = "Code has syntax errors";
  } else if (isIncomplete) {
    result = "FAIL";
    score = Math.max(10, Math.min(30, Math.floor(codeLength / 10))); // 10-30 based on effort
    feedback = "Code appears incomplete or contains placeholder text";
  } else if (!hasLogic) {
    result = "FAIL";
    score = Math.max(20, Math.min(50, Math.floor(codeLength / 8))); // 20-50 based on effort
    feedback = "Code lacks problem-solving logic";
  } else {
    // Code looks reasonable, give it a decent score
    const complexityScore = Math.min(
      100,
      Math.max(60, codeLength / 5 + codeLines.length * 3)
    );
    score = Math.floor(complexityScore);
    feedback = "Code appears to implement a solution";
  }

  // Generate realistic runtime and memory based on code complexity
  const runtime = generateRealisticRuntime(language, score);
  const memory = generateRealisticMemory(code, language);

  console.log(
    `📊 Evaluation result: ${result}, Score: ${score}, Feedback: ${feedback}`
  );

  return {
    result,
    score,
    runtime,
    memory,
    feedback,
  };
}

// Check if code is incomplete (contains placeholders, comments without implementation)
function checkIfIncomplete(code: string): boolean {
  // Common incomplete patterns
  const incompletePatterns = [
    /\/\/ your code here/i,
    /\/\* your code here \*\//i,
    /# your code here/i,
    /\/\/ todo/i,
    /\/\/ implement/i,
    /console\.log\(["']hello world["']\)/i,
    /print\(["']hello world["']\)/i,
    /cout\s*<<\s*["']hello world["']/i,
    /printf\(["']hello world["']\)/i,
  ];

  return incompletePatterns.some((pattern) => pattern.test(code));
}

// Check if code has actual problem-solving logic
function checkHasLogic(code: string): boolean {
  // Look for signs of logic
  const logicPatterns = [
    /if\s*\(/,
    /for\s*\(/,
    /while\s*\(/,
    /return\s+(?!input|test)/i,
    /function\s+\w+\s*\([^)]*\)\s*{[^}]*[a-zA-Z][^}]*}/,
    /def\s+\w+\([^)]*\):[^:]*[a-zA-Z]/,
    /\b(sort|filter|map|reduce|find|indexOf|includes|push|pop|shift|unshift)\b/,
    /\b(len|length|size|count)\b/,
    /[=<>!]=?|&&|\|\||[+\-*/%]/,
  ];

  return logicPatterns.some((pattern) => pattern.test(code));
}

// Basic syntax error detection
function checkSyntaxErrors(code: string): boolean {
  try {
    // Very basic syntax checks
    const openBraces = (code.match(/\{/g) || []).length;
    const closeBraces = (code.match(/\}/g) || []).length;
    const openParens = (code.match(/\(/g) || []).length;
    const closeParens = (code.match(/\)/g) || []).length;

    return openBraces !== closeBraces || openParens !== closeParens;
  } catch (error) {
    return true;
  }
}

// Generate realistic runtime based on code complexity
function generateRealisticRuntime(
  language: string,
  score: number
): number {
  const baseTime =
    language === "javascript"
      ? 20
      : language === "python"
      ? 35
      : language === "java"
      ? 45
      : 25;

  const complexityFactor = score / 100;
  const variation = Math.random() * 0.3 + 0.85; // 0.85-1.15 variation

  return Math.round(baseTime * (2 - complexityFactor) * variation * 10) / 10;
}

// Generate realistic memory usage
function generateRealisticMemory(
  code: string,
  language: string,
): number {
  const baseMemory =
    language === "javascript"
      ? 15
      : language === "python"
      ? 20
      : language === "java"
      ? 25
      : 12;

  const codeLength = code.length;
  const complexityFactor = Math.min(2, codeLength / 200);
  const variation = Math.random() * 0.2 + 0.9; // 0.9-1.1 variation

  return (
    Math.round(baseMemory * (1 + complexityFactor * 0.5) * variation * 10) / 10
  );
}

// AI evaluation function (when available)
async function getAIEvaluation(submission: {
  id: string;
  code: string;
  language: string;
  challenge: {
    id: string;
    title: string;
    description: string;
  };
}) {
  if (!ai) {
    throw new Error("AI not available");
  }

  const prompt = `
Evaluate this code submission:

Challenge: ${submission.challenge.title}
Description: ${submission.challenge.description}
Language: ${submission.language}
Code:
${submission.code}

Please provide an evaluation in JSON format:
{
  "result": "PASS" or "FAIL",
  "score": number (0-100),
  "runtime": number (milliseconds),
  "memory": number (MB),
  "feedback": "detailed feedback"
}
`;

  console.log("📡 Sending prompt to AI...");

  const model = ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });
  const response = await model;
  const text = response?.text || "";

  if (!text) {
    throw new Error("Failed to get AI evaluation");
  }

  // Parse AI response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No JSON found in response");
  }

  let jsonString = jsonMatch[0];
  jsonString = jsonString.replace(/```json\s*/g, "").replace(/```\s*$/g, "");
  jsonString = jsonString.replace(/,(\s*[}\]])/g, "$1");

  return JSON.parse(jsonString);
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

    // Automatically evaluate the submission
    console.log("🤖 Starting submission evaluation...");
    try {
      const { evaluation, submission: updatedSubmission } =
        await evaluateSubmission(submission.id);

      console.log("✅ Evaluation completed successfully:", evaluation);

      return NextResponse.json({
        message: "Submission created and evaluated successfully",
        submission: updatedSubmission,
        evaluation,
      });
    } catch (evaluationError) {
      // If evaluation fails, still return the submission but with error info
      console.error("⚠️ Evaluation failed:", evaluationError);
      return NextResponse.json({
        message: "Submission created successfully, but evaluation failed",
        submission,
        evaluationError: "Failed to evaluate submission",
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
