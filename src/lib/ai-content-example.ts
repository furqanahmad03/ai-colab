import { 
  processAIContent, 
  formatForDatabase, 
  AIPacketReassembler,
  AIStreamHandler,
  parseMultiplePackets,
  reassemblePackets,
  extractOrderedMessages
} from './utils';

// Example of your messy AI content with out-of-order packets
const messyAIContent = `
beautiful"), Packet(sequence_number=3, payload=" are you?") ] Expected Output: ["Hello,", " beautiful", "world!", " are you?", "How"] Explanation of Example Trace: 1. Initial: next_expected_sequence_number = 0, buffered_packets = {}, reassembled_message = [] 2. Process Packet(seq=2, payload="world!"): seq=2 > next_expected_seq=0. Store: buffered_packets = {2: "world!"}. 3. Process Packet(seq=0, payload="Hello,"): seq=0 == next_expected_seq=0. * Add "Hello," to reassembled_message. reassembled_message = ["Hello,"]. * Increment next_expected_sequence_number to 1. * Check for seq=1: Not in buffered_packets. Stop emitting contiguous block. 4. Process Packet(seq=4, payload="How"): seq=4 > next_expected_seq=1. Store: buffered_packets = {2: "world!", 4: "How"}. 5. Process Packet(seq=1, payload=" beautiful"): seq=1 == next_expected_seq=1. * Add " beautiful" to reassembled_message. reassembled_message = ["Hello,", " beautiful"]. * Increment next_expected_sequence_number to 2. * Check for seq=2: Found "world!" in buffered_packets. * Add "world!" to reassembled_message. reassembled_message = ["Hello,", " beautiful", "world!"]. * Remove seq=2 from buffered_packets. * Increment next_expected_sequence_number to 3. * Check for seq=3: Not in buffered_packets. Stop
`;

// Example with cleaner packet format
const cleanerPacketContent = `
**Problem:** Packet Reassembly Algorithm

You are tasked with implementing a packet reassembly system for network communications.

**Example Input:**
Packet(sequence_number=2, payload="world!")
Packet(sequence_number=0, payload="Hello,")
Packet(sequence_number=4, payload="How")
Packet(sequence_number=1, payload=" beautiful")
Packet(sequence_number=3, payload=" are you?")

**Expected Output:**
["Hello,", " beautiful", "world!", " are you?", "How"]

**Constraints:**
- 1 <= packet_count <= 1000
- Each packet has a unique sequence number
- Packets may arrive out of order
- Time complexity: O(n log n)
- Space complexity: O(n)
`;

// ✅ Example 1: Basic packet reassembly
export function demonstrateBasicPacketReassembly() {
  console.log('=== BASIC PACKET REASSEMBLY ===');
  
  const packets = [
    { seq: 2, payload: "world!" },
    { seq: 0, payload: "Hello," },
    { seq: 1, payload: " beautiful" },
    { seq: 4, payload: "How" },
    { seq: 3, payload: " are you?" },
  ];

  // Method 1: Simple sort and join
  const orderedMessages = extractOrderedMessages(packets);
  console.log('Ordered messages:', orderedMessages);
  
  // Method 2: Reassemble to single string
  const fullMessage = reassemblePackets(packets);
  console.log('Full message:', fullMessage);
  
  return { orderedMessages, fullMessage };
}

// ✅ Example 2: Streaming packet reassembly
export function demonstrateStreamingReassembly() {
  console.log('\n=== STREAMING PACKET REASSEMBLY ===');
  
  const streamHandler = new AIStreamHandler(
    (chunk) => console.log('📦 Chunk ready:', chunk),
    (fullMessage) => console.log('✅ Complete message:', fullMessage),
    (progress) => console.log('📊 Progress:', progress)
  );

  // Simulate streaming chunks (like from AI API)
  const chunks = [
    'Some random text... Packet(sequence_number=2, payload="world!")',
    'More text... Packet(sequence_number=0, payload="Hello,")',
    'Even more... Packet(sequence_number=1, payload=" beautiful")',
    'Almost done... Packet(sequence_number=3, payload=" are you?")',
    'Final chunk... Packet(sequence_number=4, payload="How")'
  ];

  chunks.forEach((chunk, index) => {
    console.log(`\n--- Processing chunk ${index + 1} ---`);
    streamHandler.handleChunk(chunk);
  });

  const finalMessage = streamHandler.complete();
  console.log('🎯 Final assembled message:', finalMessage);
  
  return finalMessage;
}

// ✅ Example 3: Real-time packet reassembly with callbacks
export function demonstrateRealTimeReassembly() {
  console.log('\n=== REAL-TIME PACKET REASSEMBLY ===');
  
  const reassembler = new AIPacketReassembler(
    (chunk) => console.log('🔄 Real-time chunk:', chunk),
    (fullMessage) => console.log('🎉 Message complete:', fullMessage)
  );

  // Simulate packets arriving out of order
  const packetsInOrder = [
    { seq: 2, payload: "world!" },
    { seq: 0, payload: "Hello," },      // This should trigger emission
    { seq: 4, payload: "How" },
    { seq: 1, payload: " beautiful" },  // This should trigger cascading emission
    { seq: 3, payload: " are you?" }    // This should complete the sequence
  ];

  console.log('Processing packets in this order:');
  packetsInOrder.forEach((packet, index) => {
    console.log(`\n--- Step ${index + 1}: Processing packet seq=${packet.seq} ---`);
    reassembler.processPacket(packet);
    console.log('Current state:', reassembler.getState());
  });

  const finalMessage = reassembler.complete();
  return finalMessage;
}

// ✅ Example 4: Parse and clean messy AI content
export function demonstrateMessyContentCleaning() {
  console.log('\n=== CLEANING MESSY AI CONTENT ===');
  
  console.log('Original messy content:');
  console.log(messyAIContent);
  
  // Extract packets from messy content
  const packets = parseMultiplePackets(messyAIContent);
  console.log('\nExtracted packets:', packets);
  
  // Reassemble and clean
  const cleanedContent = processAIContent(messyAIContent);
  console.log('\nCleaned content:', JSON.stringify(cleanedContent, null, 2));
  
  // Format for database
  const dbReady = formatForDatabase(cleanedContent, 'Packet Reassembly Challenge');
  console.log('\nDatabase-ready format:', JSON.stringify(dbReady, null, 2));
  
  return dbReady;
}

// ✅ Example 5: Handle different packet formats
export function demonstrateVariousPacketFormats() {
  console.log('\n=== HANDLING VARIOUS PACKET FORMATS ===');
  
  const variousFormats = [
    'Packet(sequence_number=0, payload="Hello")',
    'Packet(payload="world", sequence_number=1)',
    'Packet(   sequence_number=2,   payload="!"   )',
    'Packet(sequence_number=3,payload="How")',
    'Packet(sequence_number=4, payload="are you?")'
  ];

  variousFormats.forEach(format => {
    const packets = parseMultiplePackets(format);
    console.log(`Format: ${format}`);
    console.log(`Parsed:`, packets);
  });
  
  // Parse all at once
  const allPackets = parseMultiplePackets(variousFormats.join(' '));
  const reassembled = reassemblePackets(allPackets);
  console.log('\nReassembled message:', reassembled);
  
  return reassembled;
}

// ✅ Complete workflow example
export function demonstrateCompleteWorkflow(rawAIContent: string) {
  console.log('\n=== COMPLETE AI CONTENT PROCESSING WORKFLOW ===');
  
  try {
    // Step 1: Extract packets if they exist
    const packets = parseMultiplePackets(rawAIContent);
    console.log('Step 1 - Extracted packets:', packets.length);
    
    // Step 2: Reassemble if we have packets
    let processedContent = rawAIContent;
    if (packets.length > 0) {
      processedContent = reassemblePackets(packets);
      console.log('Step 2 - Reassembled content length:', processedContent.length);
    }
    
    // Step 3: Clean and structure the content
    const cleanedContent = processAIContent(processedContent);
    console.log('Step 3 - Cleaned content structure:', Object.keys(cleanedContent));
    
    // Step 4: Format for database
    const dbReady = formatForDatabase(cleanedContent, 'AI Generated Challenge');
    console.log('Step 4 - Database ready with difficulty:', dbReady.difficulty);
    
    // Step 5: Return ready-to-save data
    return {
      success: true,
      data: dbReady,
      metadata: {
        hadPackets: packets.length > 0,
        packetCount: packets.length,
        processedLength: processedContent.length,
        tags: cleanedContent.tags
      }
    };
    
  } catch (error) {
    console.error('Error in workflow:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    };
  }
}

// ✅ API Integration example
export async function processAIResponseForDatabase(
  aiResponse: string,
  title: string,
  userId?: string
) {
  console.log('\n=== AI RESPONSE → DATABASE PROCESSING ===');
  
  try {
    // Use the complete workflow
    const result = demonstrateCompleteWorkflow(aiResponse);
    
    if (!result.success) {
      throw new Error(result.error);
    }
    
    // Add user context
    const challengeData = {
      ...result.data,
      createdById: userId || null,
      isDaily: false,
      metadata: result.metadata
    };
    
    console.log('Ready for database insertion:', challengeData);
    
    // Here you would typically save to database:
    // const savedChallenge = await prisma.challenge.create({
    //   data: challengeData
    // });
    
    return {
      success: true,
      challengeData,
      metadata: result.metadata
    };
    
  } catch (error) {
    console.error('Error processing AI response:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// All functions are already exported individually above

// Main demonstration function
export default function runAllDemonstrations() {
  console.log('🚀 Running all AI content processing demonstrations...\n');
  
  demonstrateBasicPacketReassembly();
  demonstrateStreamingReassembly();
  demonstrateRealTimeReassembly();
  demonstrateMessyContentCleaning();
  demonstrateVariousPacketFormats();
  
  const workflowResult = demonstrateCompleteWorkflow(cleanerPacketContent);
  console.log('\n🎯 Complete workflow result:', workflowResult);
  
  return workflowResult;
}
