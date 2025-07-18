import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Packet-based AI Response Utilities
export interface AIPacket {
  seq: number;
  payload: string;
  timestamp?: number;
  id?: string;
}

export interface PacketBuffer {
  bufferedPackets: Map<number, string>;
  nextExpectedSeq: number;
  reassembledMessage: string[];
  isComplete: boolean;
  totalExpected?: number;
}

export class AIPacketReassembler {
  private buffer: PacketBuffer;
  private onChunkReady?: (chunk: string) => void;
  private onComplete?: (fullMessage: string) => void;

  constructor(
    onChunkReady?: (chunk: string) => void,
    onComplete?: (fullMessage: string) => void
  ) {
    this.buffer = {
      bufferedPackets: new Map(),
      nextExpectedSeq: 0,
      reassembledMessage: [],
      isComplete: false,
    };
    this.onChunkReady = onChunkReady;
    this.onComplete = onComplete;
  }

  // Process a single packet
  processPacket(packet: AIPacket): void {
    const { seq, payload } = packet;

    // If this is the next expected packet, add it immediately
    if (seq === this.buffer.nextExpectedSeq) {
      this.buffer.reassembledMessage.push(payload);
      this.buffer.nextExpectedSeq++;

      // Emit the chunk if callback is provided
      if (this.onChunkReady) {
        this.onChunkReady(payload);
      }

      // Check if we can emit any buffered packets
      this.emitBufferedPackets();
    } else {
      // Buffer out-of-order packet
      this.buffer.bufferedPackets.set(seq, payload);
    }
  }

  // Process multiple packets at once
  processPackets(packets: AIPacket[]): string[] {
    packets.forEach((packet) => this.processPacket(packet));
    return this.buffer.reassembledMessage;
  }

  // Emit contiguous buffered packets
  private emitBufferedPackets(): void {
    while (this.buffer.bufferedPackets.has(this.buffer.nextExpectedSeq)) {
      const payload = this.buffer.bufferedPackets.get(
        this.buffer.nextExpectedSeq
      )!;
      this.buffer.reassembledMessage.push(payload);
      this.buffer.bufferedPackets.delete(this.buffer.nextExpectedSeq);
      this.buffer.nextExpectedSeq++;

      // Emit the chunk if callback is provided
      if (this.onChunkReady) {
        this.onChunkReady(payload);
      }
    }
  }

  // Force completion and return full message
  complete(): string {
    // Add any remaining buffered packets (even if out of order)
    const remainingPackets = Array.from(this.buffer.bufferedPackets.entries())
      .sort(([a], [b]) => a - b)
      .map(([_, payload]) => payload);

    this.buffer.reassembledMessage.push(...remainingPackets);
    this.buffer.isComplete = true;

    const fullMessage = this.buffer.reassembledMessage.join("");

    if (this.onComplete) {
      this.onComplete(fullMessage);
    }

    return fullMessage;
  }

  // Get current state
  getState(): PacketBuffer {
    return { ...this.buffer };
  }

  // Reset buffer
  reset(): void {
    this.buffer = {
      bufferedPackets: new Map(),
      nextExpectedSeq: 0,
      reassembledMessage: [],
      isComplete: false,
    };
  }
}

// Utility functions for common packet parsing scenarios
export function parsePacketString(packetString: string): AIPacket | null {
  // Parse: Packet(sequence_number=2, payload="world!")
  const match = packetString.match(
    /Packet\(.*?sequence_number=(\d+).*?payload="([^"]*)".*?\)/i
  );
  if (match) {
    return {
      seq: parseInt(match[1]),
      payload: match[2],
      timestamp: Date.now(),
    };
  }
  return null;
}

export function parseMultiplePackets(input: string): AIPacket[] {
  const packets: AIPacket[] = [];
  const packetRegex =
    /Packet\([^)]*sequence_number=(\d+)[^)]*payload="([^"]*)"[^)]*\)/gi;
  let match;

  while ((match = packetRegex.exec(input)) !== null) {
    packets.push({
      seq: parseInt(match[1]),
      payload: match[2],
      timestamp: Date.now(),
    });
  }

  return packets;
}

// Simple packet reassembly (for non-streaming use cases)
export function reassemblePackets(packets: AIPacket[]): string {
  const sortedPackets = packets.sort((a, b) => a.seq - b.seq);
  return sortedPackets.map((packet) => packet.payload).join("");
}

// Extract ordered message array from packets
export function extractOrderedMessages(packets: AIPacket[]): string[] {
  const sortedPackets = packets.sort((a, b) => a.seq - b.seq);
  return sortedPackets.map((packet) => packet.payload);
}

// Streaming AI Response Handler
export class AIStreamHandler {
  private reassembler: AIPacketReassembler;
  private buffer: string = "";
  private onProgress?: (progress: {
    current: number;
    total?: number;
    message: string;
  }) => void;

  constructor(
    onChunkReady?: (chunk: string) => void,
    onComplete?: (fullMessage: string) => void,
    onProgress?: (progress: {
      current: number;
      total?: number;
      message: string;
    }) => void
  ) {
    this.reassembler = new AIPacketReassembler(onChunkReady, onComplete);
    this.onProgress = onProgress;
  }

  // Handle streaming chunk
  handleChunk(chunk: string): void {
    this.buffer += chunk;

    // Try to extract complete packets from buffer
    const packets = parseMultiplePackets(this.buffer);

    if (packets.length > 0) {
      packets.forEach((packet) => this.reassembler.processPacket(packet));

      // Report progress
      if (this.onProgress) {
        const state = this.reassembler.getState();
        this.onProgress({
          current: state.reassembledMessage.length,
          message: state.reassembledMessage.join(""),
        });
      }

      // Clear processed packets from buffer
      this.buffer = this.removeProcessedPackets(this.buffer, packets);
    }
  }

  private removeProcessedPackets(buffer: string, packets: AIPacket[]): string {
    let cleanBuffer = buffer;
    packets.forEach((packet) => {
      const packetPattern = new RegExp(
        `Packet\\([^)]*sequence_number=${
          packet.seq
        }[^)]*payload="${packet.payload.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        )}"[^)]*\\)`,
        "gi"
      );
      cleanBuffer = cleanBuffer.replace(packetPattern, "");
    });
    return cleanBuffer;
  }

  // Complete the stream
  complete(): string {
    return this.reassembler.complete();
  }

  // Get current state
  getState(): PacketBuffer {
    return this.reassembler.getState();
  }
}

// AI Content Cleaning Utilities
export interface CleanedAIContent {
  title?: string;
  description: string;
  problemStatement?: string;
  examples: {
    input: string;
    output: string;
    explanation?: string;
  }[];
  constraints: string[];
  tags: string[];
  difficulty?: "EASY" | "MEDIUM" | "HARD";
}

export function cleanAIGeneratedContent(rawContent: string): CleanedAIContent {
  // First, try to reassemble any packets in the content
  const packets = parseMultiplePackets(rawContent);
  let processedContent = rawContent;

  if (packets.length > 0) {
    const reassembledMessage = reassemblePackets(packets);
    processedContent = reassembledMessage;
  }

  // Remove excessive whitespace and normalize line breaks
  let cleaned = processedContent
    .replace(/\s+/g, " ")
    .replace(/\n\s*\n/g, "\n")
    .trim();

  // Remove markdown formatting
  cleaned = cleaned
    .replace(/\*\*([^*]+)\*\*/g, "$1") // Bold
    .replace(/\*([^*]+)\*/g, "$1") // Italic
    .replace(/`([^`]+)`/g, "$1") // Inline code
    .replace(/```[\s\S]*?```/g, "") // Code blocks
    .replace(/#{1,6}\s*/g, "") // Headers
    .replace(/^\s*[\-\+\*]\s+/gm, "") // List items
    .replace(/^\s*\d+\.\s+/gm, "") // Numbered lists
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1"); // Links

  return {
    description: extractDescription(cleaned),
    problemStatement: extractProblemStatement(cleaned),
    examples: extractExamples(cleaned),
    constraints: extractConstraints(cleaned),
    tags: extractTags(cleaned),
    difficulty: extractDifficulty(cleaned),
  };
}

function extractDescription(content: string): string {
  // Look for description patterns
  const descriptionMatch = content.match(
    /(?:description|problem|task):\s*([^.!?]*[.!?])/i
  );
  if (descriptionMatch) {
    return cleanText(descriptionMatch[1]);
  }

  // If no explicit description, use the first sentence
  const firstSentence = content.match(/^([^.!?]*[.!?])/);
  return firstSentence
    ? cleanText(firstSentence[1])
    : cleanText(content.substring(0, 200));
}

function extractProblemStatement(content: string): string | undefined {
  const patterns = [
    /(?:problem statement|statement|task):\s*([^]*?)(?=example|input|output|constraint|$)/i,
    /(?:given|you are|implement|write|create|find)([^]*?)(?=example|input|output|constraint|$)/i,
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      return cleanText(match[1]);
    }
  }

  return undefined;
}

function extractExamples(
  content: string
): Array<{ input: string; output: string; explanation?: string }> {
  const examples: Array<{
    input: string;
    output: string;
    explanation?: string;
  }> = [];

  // Pattern 1: Input/Output pairs
  const inputOutputPattern =
    /(?:input|given):\s*([^]*?)(?:output|expected|result):\s*([^]*?)(?=explanation|example|input|constraint|$)/gi;
  let match;

  while ((match = inputOutputPattern.exec(content)) !== null) {
    const input = cleanText(match[1]);
    const output = cleanText(match[2]);

    if (input && output) {
      // Look for explanation after this example
      const explanationMatch = content
        .substring(match.index + match[0].length)
        .match(
          /(?:explanation|because|reason):\s*([^]*?)(?=example|input|output|constraint|$)/i
        );

      examples.push({
        input,
        output,
        explanation: explanationMatch
          ? cleanText(explanationMatch[1])
          : undefined,
      });
    }
  }

  // Pattern 2: Extract from packet/function call examples
  const packetPattern = /Packet\([^)]*payload\s*=\s*"([^"]*)"[^)]*\)/g;
  const packets: string[] = [];

  while ((match = packetPattern.exec(content)) !== null) {
    packets.push(match[1]);
  }

  if (packets.length > 0) {
    // Look for expected output
    const expectedOutputMatch = content.match(
      /expected output:\s*\[([^\]]+)\]/i
    );
    if (expectedOutputMatch) {
      const expectedOutput = expectedOutputMatch[1]
        .split(",")
        .map((item) => item.trim().replace(/['"]/g, ""))
        .join(", ");

      examples.push({
        input: `Packets: ${packets.join(", ")}`,
        output: `[${expectedOutput}]`,
        explanation: extractExplanationFromTrace(content),
      });
    }
  }

  return examples.length > 0 ? examples : generateDefaultExamples();
}

function extractConstraints(content: string): string[] {
  const constraints: string[] = [];

  // Look for constraint patterns
  const constraintPatterns = [
    /(?:constraint|limit|bound|requirement)s?:\s*([^]*?)(?=example|input|output|$)/i,
    /(?:time complexity|space complexity|memory):\s*([^]*?)(?=example|input|output|$)/i,
    /(?:\d+\s*<=?\s*[^<>=]*<=?\s*\d+)/g,
  ];

  for (const pattern of constraintPatterns) {
    const matches = content.match(pattern);
    if (matches) {
      if (Array.isArray(matches)) {
        constraints.push(...matches.map((m) => cleanText(m)));
      } else {
        constraints.push(cleanText(matches));
      }
    }
  }

  return constraints.length > 0
    ? constraints
    : ["No specific constraints provided"];
}

function extractTags(content: string): string[] {
  const tags: string[] = [];

  // Common programming concepts
  const conceptMap = {
    array: ["array", "list", "sequence"],
    string: ["string", "text", "character"],
    hash: ["hash", "map", "dictionary"],
    tree: ["tree", "binary tree", "bst"],
    graph: ["graph", "node", "edge"],
    sorting: ["sort", "order", "arrange"],
    search: ["search", "find", "locate"],
    "dynamic-programming": ["dp", "dynamic programming", "memoization"],
    greedy: ["greedy", "optimal"],
    recursion: ["recursive", "recursion"],
    stack: ["stack", "lifo"],
    queue: ["queue", "fifo"],
    packet: ["packet", "network", "protocol"],
    sequence: ["sequence", "order", "sequential"],
  };

  const lowerContent = content.toLowerCase();

  for (const [tag, keywords] of Object.entries(conceptMap)) {
    if (keywords.some((keyword) => lowerContent.includes(keyword))) {
      tags.push(tag);
    }
  }

  return tags.length > 0 ? tags : ["algorithm", "problem-solving"];
}

function extractDifficulty(
  content: string
): "EASY" | "MEDIUM" | "HARD" | undefined {
  const lowerContent = content.toLowerCase();

  if (
    lowerContent.includes("easy") ||
    lowerContent.includes("basic") ||
    lowerContent.includes("simple")
  ) {
    return "EASY";
  }

  if (
    lowerContent.includes("hard") ||
    lowerContent.includes("difficult") ||
    lowerContent.includes("complex")
  ) {
    return "HARD";
  }

  if (
    lowerContent.includes("medium") ||
    lowerContent.includes("intermediate")
  ) {
    return "MEDIUM";
  }

  // Default based on content complexity
  const complexityIndicators = [
    "optimization",
    "algorithm",
    "data structure",
    "complexity",
    "efficient",
    "optimal",
    "dynamic programming",
    "graph",
  ];

  const foundIndicators = complexityIndicators.filter((indicator) =>
    lowerContent.includes(indicator)
  ).length;

  if (foundIndicators >= 3) return "HARD";
  if (foundIndicators >= 1) return "MEDIUM";
  return "EASY";
}

function extractExplanationFromTrace(content: string): string | undefined {
  const traceMatch = content.match(
    /explanation of example trace:\s*([^]*?)(?=example|input|output|constraint|$)/i
  );
  if (traceMatch) {
    return cleanText(traceMatch[1]);
  }

  const stepMatch = content.match(
    /(?:step|process|trace):\s*([^]*?)(?=example|input|output|constraint|$)/i
  );
  return stepMatch ? cleanText(stepMatch[1]) : undefined;
}

function cleanText(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/^\s*[\-\+\*]\s*/, "")
    .replace(/^\s*\d+\.\s*/, "")
    .replace(/[`*_]/g, "")
    .trim();
}

function generateDefaultExamples(): Array<{
  input: string;
  output: string;
  explanation?: string;
}> {
  return [
    {
      input: "Sample input",
      output: "Sample output",
      explanation:
        "This is a sample example demonstrating the expected behavior.",
    },
  ];
}

// Usage helper function
export function processAIContent(rawContent: string): CleanedAIContent {
  try {
    return cleanAIGeneratedContent(rawContent);
  } catch (error) {
    console.error("Error processing AI content:", error);
    return {
      description: "Error processing AI-generated content",
      examples: generateDefaultExamples(),
      constraints: ["No constraints specified"],
      tags: ["problem-solving"],
    };
  }
}

// Format for database storage
export function formatForDatabase(
  cleanedContent: CleanedAIContent,
  title: string
) {
  return {
    title,
    description: cleanedContent.description,
    problemStatement:
      cleanedContent.problemStatement || cleanedContent.description,
    difficulty: cleanedContent.difficulty || "MEDIUM",
    tags: cleanedContent.tags,
    examples: cleanedContent.examples,
    constraints: cleanedContent.constraints,
    // Add additional fields as needed
    createdAt: new Date().toISOString(),
    isAIGenerated: true,
  };
}
