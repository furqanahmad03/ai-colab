import { processAIContent, formatForDatabase } from "./utils";

// The actual AI response you received
export const realAIResponse = `
You are tasked with building a system to reassemble a message from a stream of network packets. Due to network latency and routing, these packets can arrive out of their original order. Each packet contains a unique, non-negative integer sequence_number and a payload (a string part of the message).

Your system should process these packets and reconstruct the message by emitting payloads in their correct sequence number order. The key challenge is to handle out-of-order arrivals and only emit contiguous blocks of payloads as soon as they become available, starting from the next_expected_sequence_number.

Initially, the next_expected_sequence_number is 0. When a packet with the current next_expected_sequence_number arrives, its payload should be immediately emitted. Then, you should check if the packet with next_expected_sequence_number + 1 is already available (from a previously stored out-of-order arrival). If it is, emit that payload, increment next_expected_sequence_number, and continue this process until you hit a missing packet. Any packets arriving with a sequence number less than the current next_expected_sequence_number should be ignored (assumed duplicate or already processed). Packets with sequence numbers greater than next_expected_sequence_number should be stored (buffered) and processed when their turn comes.

The function should process a given list of Packet objects in the order they appear in the list (representing their arrival order) and return a list of all emitted payloads in their reassembled order.

**Input:**
packets: A list of Packet objects. Each Packet has two attributes:
    - sequence_number: An integer (>= 0) representing the packet's order.
    - payload: A string containing a part of the message.

**Output:**
A List[str] containing the reassembled payloads in their correct order.

**Constraints:**
- 0 <= sequence_number <= 10^5
- 1 <= len(payload) <= 100
- 1 <= len(packets) <= 10^4
- All sequence_numbers in the input list are unique within the given packets list (i.e., no two Packet objects in the input list will have the same sequence_number).

**Example:**

**Packet Class Definition (for reference):**
class Packet:
    def __init__(self, seq_num: int, payload: str):
        self.sequence_number = seq_num
        self.payload = payload

**Input:**
packets = [
  Packet(sequence_number=2, payload="world!"),
  Packet(sequence_number=0, payload="Hello,"),
  Packet(sequence_number=4, payload="How"),
  Packet(sequence_number=1, payload=" beautiful"),
  Packet(sequence_number=3, payload=" are you?")
]

**Expected Output:**
["Hello,", " beautiful", "world!", " are you?", "How"]

**Explanation of Example Trace:**
1. Initial: next_expected_sequence_number = 0, buffered_packets = {}, reassembled_message = []
2. Process Packet(seq=2, payload="world!"): seq=2 > next_expected_seq=0. Store: buffered_packets = {2: "world!"}.
3. Process Packet(seq=0, payload="Hello,"): seq=0 == next_expected_seq=0.
   * Add "Hello," to reassembled_message. reassembled_message = ["Hello,"].
   * Increment next_expected_sequence_number to 1.
   * Check for seq=1: Not in buffered_packets. Stop emitting contiguous block.
4. Process Packet(seq=4, payload="How"): seq=4 > next_expected_seq=1. Store: buffered_packets = {2: "world!", 4: "How"}.
5. Process Packet(seq=1, payload=" beautiful"): seq=1 == next_expected_seq=1.
   * Add " beautiful" to reassembled_message. reassembled_message = ["Hello,", " beautiful"].
   * Increment next_expected_sequence_number to 2.
   * Check for seq=2: Found "world!" in buffered_packets.
       * Add "world!" to reassembled_message. reassembled_message = ["Hello,", " beautiful", "world!"].
       * Remove seq=2 from buffered_packets.
       * Increment next_expected_sequence_number to 3.
   * Check for seq=3: Not in buffered_packets. Stop emitting contiguous block.
6. Process Packet(seq=3, payload=" are you?"): seq=3 == next_expected_seq=3.
   * Add " are you?" to reassembled_message. reassembled_message = ["Hello,", " beautiful", "world!", " are you?"].
   * Increment next_expected_sequence_number to 4.
   * Check for seq=4: Found "How" in buffered_packets.
       * Add "How" to reassembled_message. reassembled_message = ["Hello,", " beautiful", "world!", " are you?", "How"].
       * Remove seq=4 from buffered_packets.
       * Increment next_expected_sequence_number to 5.
   * Check for seq=5: Not in buffered_packets. Stop emitting contiguous block.

Final reassembled_message: ["Hello,", " beautiful", "world!", " are you?", "How"]
`;

// Function to demonstrate processing this AI response
export function demonstrateRealAIProcessing() {
  console.log("🤖 Processing Real AI Response...\n");

  console.log("📥 Original AI Response:");
  console.log(realAIResponse.substring(0, 300) + "...\n");

  try {
    // Process the AI content
    const processedContent = processAIContent(realAIResponse);

    console.log("✨ Processed Content:");
    console.log("📝 Description:", processedContent.description);
    console.log("🎯 Difficulty:", processedContent.difficulty);
    console.log("🏷️ Tags:", processedContent.tags);
    console.log("📋 Examples:", processedContent.examples.length);
    console.log("⚡ Constraints:", processedContent.constraints.length);

    console.log("\n📋 Extracted Examples:");
    processedContent.examples.forEach((example, index) => {
      console.log(`Example ${index + 1}:`);
      console.log(`  Input: ${example.input}`);
      console.log(`  Output: ${example.output}`);
      console.log(
        `  Explanation: ${example.explanation?.substring(0, 100)}...`
      );
    });

    console.log("\n⚡ Extracted Constraints:");
    processedContent.constraints.forEach((constraint, index) => {
      console.log(`${index + 1}. ${constraint}`);
    });

    // Format for database
    const dbReady = formatForDatabase(
      processedContent,
      "Packet Reassembly System"
    );

    console.log("\n💾 Database-Ready Format:");
    console.log({
      title: dbReady.title,
      difficulty: dbReady.difficulty,
      tags: dbReady.tags,
      exampleCount: dbReady.examples.length,
      constraintCount: dbReady.constraints.length,
      isAIGenerated: dbReady.isAIGenerated,
    });

    return {
      processedContent,
      dbReady,
    };
  } catch (error) {
    console.error("❌ Error processing AI response:", error);
    return null;
  }
}

// Transform for your problem page
export function transformForProblemPage() {
  console.log("\n🔄 Transforming for Problem Page...\n");

  const processedContent = processAIContent(realAIResponse);

  // This is what would appear on your problem page
  const problemPageData = {
    id: "ai-packet-reassembly",
    title: "Packet Reassembly System",
    description: processedContent.description,
    difficulty: processedContent.difficulty as "EASY" | "MEDIUM" | "HARD",
    tags: processedContent.tags,
    category: "dsa", // Detected from tags
    isCompleted: false,
    isPremium: false,
    acceptanceRate: 0,
    solvedCount: 0,
    problemStatement:
      processedContent.problemStatement || processedContent.description,
    examples: processedContent.examples,
    constraints: processedContent.constraints,
  };

  console.log("🎯 Problem Page Data:", problemPageData);

  return problemPageData;
}

// Show the comparison
export function showBeforeAfterComparison() {
  console.log("\n🔍 Before vs After Comparison:\n");

  console.log("❌ BEFORE (Raw AI Response):");
  console.log("- Unstructured text blob");
  console.log("- Mixed formatting (markdown, code, plain text)");
  console.log("- No clear separation of components");
  console.log("- Difficult to extract specific fields");

  console.log("\n✅ AFTER (Processed Content):");
  const processed = processAIContent(realAIResponse);
  console.log(
    "- Clean description:",
    processed.description.substring(0, 100) + "..."
  );
  console.log("- Structured examples:", processed.examples.length);
  console.log("- Organized constraints:", processed.constraints.length);
  console.log("- Auto-detected difficulty:", processed.difficulty);
  console.log("- Smart tags:", processed.tags.join(", "));

  console.log("\n🎨 UI Display:");
  console.log("- Professional problem description");
  console.log("- Clean example boxes with syntax highlighting");
  console.log("- Organized constraints list");
  console.log("- Color-coded difficulty badges");
  console.log("- Clickable tag system");

  return processed;
}

// Mock API response with this content
export const mockAPIResponseWithRealAI = {
  challenge: {
    id: "packet-reassembly-challenge",
    title: "Packet Reassembly System",
    description: "Build a system to reassemble messages from network packets.",
    difficulty: "MEDIUM" as const,
    tags: ["algorithm", "data-structures"],
    createdById: "ai-system",
    createdBy: {
      name: "AI System",
      email: "ai@codelab.com",
    },
    isDaily: false,
    submissions: [],
    _count: { submissions: 0 },
    createdAt: new Date().toISOString(),
    // This is the key field that contains the AI response
    aiGeneratedContent: realAIResponse,
    rawContent: realAIResponse,
  },
};

// Export everything for testing
export default {
  realAIResponse,
  demonstrateRealAIProcessing,
  transformForProblemPage,
  showBeforeAfterComparison,
  mockAPIResponseWithRealAI,
};
