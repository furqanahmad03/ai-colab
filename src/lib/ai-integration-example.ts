import {
  processAIResponseForDatabase,
  demonstrateCompleteWorkflow,
} from "./ai-content-example";
import { AIStreamHandler } from "./utils";

// Example integration with your existing problem page
export async function handleAIGeneratedChallenge(
  rawAIResponse: string,
  challengeTitle: string,
  userId?: string
) {
  try {
    // Process the AI response
    const result = await processAIResponseForDatabase(
      rawAIResponse,
      challengeTitle,
      userId
    );

    if (!result.success) {
      throw new Error(result.error);
    }

    // The data is now ready for your Prisma database
    const { challengeData, metadata } = result;

    // Example: Save to database (uncomment when ready)
    /*
    const savedChallenge = await prisma.challenge.create({
      data: {
        title: challengeData.title,
        description: challengeData.description,
        difficulty: challengeData.difficulty,
        tags: challengeData.tags,
        createdById: challengeData.createdById,
        isDaily: challengeData.isDaily,
        // Store examples and constraints as JSON if needed
        // examples: JSON.stringify(challengeData.examples),
        // constraints: JSON.stringify(challengeData.constraints),
      }
    });
    */

    return {
      success: true,
      challengeData,
      metadata,
      message: `Challenge "${challengeTitle}" processed successfully`,
      // challengeId: savedChallenge.id // uncomment after database save
    };
  } catch (error) {
    console.error("Error handling AI challenge:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Example: Stream handling for real-time AI responses
export class AIChallengeLiveProcessor {
  private streamHandler: AIStreamHandler;
  private onUpdate: (update: { type: string; data: unknown; timestamp: string }) => void;

  constructor(onUpdate: (update: { type: string; data: unknown; timestamp: string }) => void) {
    this.onUpdate = onUpdate;
    this.streamHandler = new AIStreamHandler(
      (chunk) => this.handleChunk(chunk),
      (fullMessage) => this.handleComplete(fullMessage),
      (progress) => this.handleProgress(progress)
    );
  }

  private handleChunk(chunk: string) {
    this.onUpdate({
      type: "chunk",
      data: chunk,
      timestamp: new Date().toISOString(),
    });
  }

  private handleComplete(fullMessage: string) {
    // Process the complete message
    const result = demonstrateCompleteWorkflow(fullMessage);

    this.onUpdate({
      type: "complete",
      data: result,
      timestamp: new Date().toISOString(),
    });
  }

  private handleProgress(progress: { current: number; total?: number; message: string }) {
    this.onUpdate({
      type: "progress",
      data: progress,
      timestamp: new Date().toISOString(),
    });
  }

  // Process streaming chunk
  processChunk(chunk: string) {
    this.streamHandler.handleChunk(chunk);
  }

  // Force completion
  complete() {
    return this.streamHandler.complete();
  }
}

// Example usage in your Next.js API route
export const exampleApiIntegration = {
  // POST /api/ai/generate-challenge
  async generateChallenge(request: Request) {
    try {
      const { prompt, userId, title } = await request.json();

      // Simulate AI API call (replace with your actual AI API)
      const aiResponse = await callAIAPI(prompt);

      // Process the AI response
      const result = await handleAIGeneratedChallenge(
        aiResponse,
        title,
        userId
      );

      if (!result.success) {
        return new Response(JSON.stringify({ error: result.error }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};

// Mock AI API call (replace with your actual implementation)
async function callAIAPI(prompt: string): Promise<string> {
  // This would be your actual AI API call
  // For now, return a mock response with packets
  return `
    **Problem:** ${prompt}
    
    **Example Input:**
    Packet(sequence_number=2, payload="world!")
    Packet(sequence_number=0, payload="Hello,")
    Packet(sequence_number=1, payload=" beautiful")
    
    **Expected Output:**
    ["Hello,", " beautiful", "world!"]
    
    **Constraints:**
    - Time complexity: O(n)
    - Space complexity: O(1)
    - 1 <= n <= 1000
  `;
}

// Example React component for live AI processing
export const AIChallengeLiveComponent = {
  // This would be used in your React component
  setupLiveProcessor: (onUpdate: (update: { type: string; data: unknown; timestamp: string }) => void) => {
    const processor = new AIChallengeLiveProcessor(onUpdate);

    // Example: Process chunks as they arrive
    const chunks = [
      "Starting challenge generation...",
      'Packet(sequence_number=1, payload="Two")',
      'Packet(sequence_number=0, payload="One")',
      'Packet(sequence_number=2, payload="Three")',
      "Challenge generation complete!",
    ];

    // Simulate streaming
    let index = 0;
    const interval = setInterval(() => {
      if (index < chunks.length) {
        processor.processChunk(chunks[index]);
        index++;
      } else {
        clearInterval(interval);
        processor.complete();
      }
    }, 1000);

    return processor;
  },
};

// Example usage in your problem page component
export const problemPageIntegration = {
  // Add this to your problem page component
  async processAIContent(rawContent: string) {
    const result = await handleAIGeneratedChallenge(
      rawContent,
      "AI Generated Challenge",
      "user-id" // Replace with actual user ID
    );

    if (result.success && result.challengeData) {
      // Update your problem page with the processed data
      const { challengeData } = result;

      return {
        id: "ai-generated-id",
        title: challengeData.title,
        description: challengeData.description,
        difficulty: challengeData.difficulty,
        tags: challengeData.tags,
        examples: challengeData.examples,
        constraints: challengeData.constraints,
        // Transform to match your Question interface
        category: challengeData.tags?.includes("array") ? "dsa" : "pf",
        isCompleted: false,
        isPremium: false,
        acceptanceRate: 0,
        solvedCount: 0,
        problemStatement: challengeData.problemStatement,
      };
    }

    throw new Error(result.error);
  },
};


