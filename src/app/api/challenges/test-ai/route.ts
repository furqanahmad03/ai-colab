import { NextRequest, NextResponse } from "next/server";

// Real AI response from the user
const realAIResponse = `
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

// Mock messy AI content (simulating corrupted/fragmented responses)
const mockMessyAIContent = `
...fragmented content...
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
...content appears to be cut off or corrupted...
`;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "real";

    // Choose which type of AI content to return
    let aiContent: string;
    let challengeTitle: string;

    switch (type) {
      case "messy":
        aiContent = mockMessyAIContent;
        challengeTitle = "Messy Packet Reassembly (Fragmented AI Response)";
        break;
      case "real":
      default:
        aiContent = realAIResponse;
        challengeTitle = "Packet Reassembly System";
        break;
    }

    // Mock challenge data with AI-generated content
    const mockChallenge = {
      id: `test-ai-challenge-${type}`,
      title: challengeTitle,
      description:
        "Build a system to reassemble messages from out-of-order network packets.",
      difficulty: "MEDIUM",
      tags: ["algorithm", "data-structures", "network", "packet", "sorting"],
      createdById: "ai-system",
      createdBy: {
        name: "AI System",
        email: "ai@codelab.com",
      },
      isDaily: false,
      submissions: [
        { id: "sub1", result: "PASS", userId: "user1" },
        { id: "sub2", result: "FAIL", userId: "user2" },
        { id: "sub3", result: "PASS", userId: "user3" },
        { id: "sub4", result: "PASS", userId: "user4" },
      ],
      _count: {
        submissions: 4,
      },
      createdAt: new Date().toISOString(),
      // AI-generated content fields - this is where the magic happens
      aiGeneratedContent: aiContent,
      rawContent: aiContent,
      // Pre-populated examples and constraints for fallback
      examples: [
        {
          input:
            'packets = [Packet(2, "world!"), Packet(0, "Hello,"), Packet(4, "How"), Packet(1, " beautiful"), Packet(3, " are you?")]',
          output: '["Hello,", " beautiful", "world!", " are you?", "How"]',
          explanation:
            "Packets are processed in arrival order but emitted in sequence number order. The system buffers out-of-order packets and emits them when their turn comes.",
        },
      ],
      constraints: [
        "0 <= sequence_number <= 10^5",
        "1 <= len(payload) <= 100",
        "1 <= len(packets) <= 10^4",
        "All sequence_numbers are unique within the input list",
        "Time complexity: O(n log n) where n is the number of packets",
        "Space complexity: O(n) for buffering out-of-order packets",
      ],
    };

    return NextResponse.json({
      challenge: mockChallenge,
      metadata: {
        isAIGenerated: true,
        contentType: type,
        processingRequired: true,
        hasPackets: aiContent.includes("Packet("),
        aiResponseLength: aiContent.length,
        timestamp: new Date().toISOString(),
        processingInstructions: {
          step1: "Check for packet format in aiGeneratedContent",
          step2: "Parse and reassemble if packets found",
          step3:
            "Extract structured content (description, examples, constraints)",
          step4: "Display in problem page with enhanced formatting",
        },
      },
    });
  } catch (error) {
    console.error("Error in test AI endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST endpoint to test AI content processing
export async function POST(request: NextRequest) {
  try {
    const { content, title, type } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // Simulate processing the AI content
    const processedChallenge = {
      id: `ai-processed-${Date.now()}`,
      title: title || "AI Generated Challenge",
      description:
        "This challenge was generated by AI and processed by our packet reassembly system.",
      difficulty: "MEDIUM",
      tags: ["ai-generated", "algorithm", "packet-reassembly"],
      createdById: null,
      createdBy: null,
      isDaily: false,
      submissions: [],
      _count: { submissions: 0 },
      createdAt: new Date().toISOString(),
      aiGeneratedContent: content,
      rawContent: content,
      metadata: {
        processingType: type || "unknown",
        contentLength: content.length,
        processedAt: new Date().toISOString(),
      },
    };

    return NextResponse.json({
      challenge: processedChallenge,
      message: "AI content processed successfully",
      metadata: {
        isAIGenerated: true,
        processingRequired: true,
        contentType: type || "custom",
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error processing AI content:", error);
    return NextResponse.json(
      { error: "Failed to process AI content" },
      { status: 500 }
    );
  }
}
