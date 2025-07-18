// Demo: How your AI response gets processed
const realAIResponse = `
You are tasked with building a system to reassemble a message from a stream of network packets. Due to network latency and routing, these packets can arrive out of their original order. Each packet contains a unique, non-negative integer sequence_number and a payload (a string part of the message).

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

**Example:**
Packet(sequence_number=2, payload="world!")
Packet(sequence_number=0, payload="Hello,")
Packet(sequence_number=4, payload="How")
Packet(sequence_number=1, payload=" beautiful")
Packet(sequence_number=3, payload=" are you?")

**Expected Output:**
["Hello,", " beautiful", "world!", " are you?", "How"]
`;

// Simple extraction functions (simplified version of the utils)
function extractDescription(content) {
  const firstSentence = content.split(".")[0];
  return firstSentence.replace(/\*/g, "").trim();
}

function extractExamples(content) {
  const examples = [];

  // Look for input/output patterns
  const inputMatch = content.match(
    /Packet\(sequence_number=\d+, payload="[^"]*"\)/g
  );
  const outputMatch = content.match(/\["[^"]*"(?:, "[^"]*")*\]/);

  if (inputMatch && outputMatch) {
    examples.push({
      input: inputMatch.slice(0, 3).join(", ") + "...",
      output: outputMatch[0],
      explanation:
        "Packets are processed in arrival order but emitted in sequence number order.",
    });
  }

  return examples;
}

function extractConstraints(content) {
  const constraints = [];
  const constraintPattern = /- .+ <= .+/g;
  const matches = content.match(constraintPattern);

  if (matches) {
    constraints.push(...matches.map((m) => m.replace("- ", "")));
  }

  return constraints;
}

function extractTags(content) {
  const tags = [];
  const lowerContent = content.toLowerCase();

  if (lowerContent.includes("packet")) tags.push("packet");
  if (lowerContent.includes("network")) tags.push("network");
  if (lowerContent.includes("reassemble")) tags.push("algorithm");
  if (lowerContent.includes("sequence")) tags.push("sorting");
  if (lowerContent.includes("order")) tags.push("data-structures");

  return tags;
}

function extractDifficulty(content) {
  const lowerContent = content.toLowerCase();

  if (lowerContent.includes("easy") || lowerContent.includes("simple"))
    return "EASY";
  if (lowerContent.includes("hard") || lowerContent.includes("complex"))
    return "HARD";

  // Count complexity indicators
  const complexityWords = [
    "algorithm",
    "buffer",
    "sequence",
    "contiguous",
    "latency",
  ];
  const count = complexityWords.filter((word) =>
    lowerContent.includes(word)
  ).length;

  return count >= 2 ? "MEDIUM" : "EASY";
}

// Process the AI response
console.log("🤖 Processing your real AI response...\n");

const processed = {
  description: extractDescription(realAIResponse),
  examples: extractExamples(realAIResponse),
  constraints: extractConstraints(realAIResponse),
  tags: extractTags(realAIResponse),
  difficulty: extractDifficulty(realAIResponse),
};

console.log("✅ Processed Result:");
console.log("📝 Description:", processed.description);
console.log("🎯 Difficulty:", processed.difficulty);
console.log("🏷️ Tags:", processed.tags.join(", "));
console.log("📋 Examples:", processed.examples.length);
console.log("⚡ Constraints:", processed.constraints.length);

if (processed.examples.length > 0) {
  console.log("\n📋 Example Details:");
  processed.examples.forEach((example, i) => {
    console.log(`  ${i + 1}. Input: ${example.input}`);
    console.log(`     Output: ${example.output}`);
    console.log(`     Explanation: ${example.explanation}`);
  });
}

if (processed.constraints.length > 0) {
  console.log("\n⚡ Constraint Details:");
  processed.constraints.forEach((constraint, i) => {
    console.log(`  ${i + 1}. ${constraint}`);
  });
}

console.log("\n🎨 How this appears on your problem page:");
console.log("- Clean, formatted problem description");
console.log("- Syntax-highlighted example input/output boxes");
console.log("- Organized constraints list");
console.log("- Color-coded difficulty badge");
console.log("- Clickable tag system");
console.log("- Professional UI matching your existing design");

console.log("\n🚀 Ready for database storage and display!");

module.exports = { processed, realAIResponse };
