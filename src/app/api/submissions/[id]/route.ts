import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { GoogleGenAI } from '@google/genai';

const prisma = new PrismaClient();
const ai = new GoogleGenAI({});

interface SubmissionRequest {
  userId: string;
  code: string;
  language: string;
}

async function evaluateSubmission(submissionId: string) {
  try {
    // Get the submission with challenge details
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        challenge: {
          select: {
            title: true,
            description: true,
            difficulty: true,
            tags: true,
          },
        },
      },
    });

    if (!submission) {
      throw new Error('Submission not found');
    }

    // Create evaluation prompt
    const prompt = `
Evaluate the following code submission for a coding challenge:

**Challenge Title:** ${submission.challenge.title}
**Challenge Description:** ${submission.challenge.description}
**Difficulty:** ${submission.challenge.difficulty}
**Tags:** ${submission.challenge.tags.join(', ')}

**Submitted Code (${submission.language}):**
\`\`\`${submission.language}
${submission.code}
\`\`\`

Please evaluate this code and provide a response in the following JSON format:
{
  "result": "PASS|FAIL|ERROR",
  "score": 85,
  "feedback": "Detailed feedback about the solution",
  "runtime": 0.15,
  "memory": 12.5,
  "testCasesPassed": 3,
  "totalTestCases": 5,
  "issues": ["Issue 1", "Issue 2"],
  "suggestions": ["Suggestion 1", "Suggestion 2"]
}

Evaluation criteria:
- Correctness: Does the code solve the problem correctly?
- Efficiency: Is the solution efficient in terms of time and space complexity?
- Code quality: Is the code readable, well-structured, and follows best practices?
- Edge cases: Does the code handle edge cases properly?
- For ${submission.challenge.difficulty} difficulty level, consider appropriate expectations.

Return only the JSON response, no additional text.
`;

    // Get AI evaluation
    const model = ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    const response = await model;
    const text = response.text || '';

    if (!text) {
      throw new Error('Failed to get AI evaluation');
    }

    // Parse AI response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    let jsonString = jsonMatch[0];
    jsonString = jsonString.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
    jsonString = jsonString.replace(/,(\s*[}\]])/g, '$1');
    
    const evaluation = JSON.parse(jsonString);

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
    console.error('Error in evaluation:', error);
    throw error;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: challengeId } = params;
    let body: SubmissionRequest;
    
    try {
      body = await request.json();
    } catch (jsonError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { userId, code, language } = body;

    if (!userId || !code || !language) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, code, language' },
        { status: 400 }
      );
    }

    // Verify that the challenge exists
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      );
    }

    // Create the submission
    const submission = await prisma.submission.create({
      data: {
        userId,
        challengeId,
        code,
        language,
        result: 'PENDING',
      },
    });

    // Automatically evaluate the submission
    try {
      const { evaluation, submission: updatedSubmission } = await evaluateSubmission(submission.id);
      
      return NextResponse.json({
        message: 'Submission created and evaluated successfully',
        submission: updatedSubmission,
        evaluation,
      });
    } catch (evaluationError) {
      // If evaluation fails, still return the submission but with error info
      console.error('Evaluation failed:', evaluationError);
      return NextResponse.json({
        message: 'Submission created successfully, but evaluation failed',
        submission,
        evaluationError: 'Failed to evaluate submission',
      });
    }

  } catch (error) {
    console.error('Error creating submission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: challengeId } = params;

    // Verify that the challenge exists
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
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
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      challenge,
      submissions,
    });

  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
