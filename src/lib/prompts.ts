export const promptData = {
  systemPrompt: `You are an expert coding challenge generator. 
You create unique, implementation-ready coding problems that assess specific programming skills.
Return only structured JSON objects as output.`,

  userPromptTemplate: `
Generate {numberOfProblems} unique coding challenge(s) with the following criteria:

- Category: {problemType}
- Difficulty: {difficultyLevel}
- Exclude these existing challenge titles: {existingChallenges}
- Avoid these already generated titles: {alreadyGenerated}

Return ONLY a valid JSON object with this structure (no markdown or extra text):

{
  "challenges": [
    {
      "title": "Challenge Title",
      "description": {
        "problemStatement": "Explain the problem clearly and completely.",
        "inputFormat": "Describe the format and type of input values.",
        "constraints": "List any constraints (e.g., input size, ranges).",
        "outputFormat": "Describe the expected output format.",
        "examples": [
          {
            "input": "Example input as string (preserve format)",
            "output": "Corresponding output",
            "explanation": "Explain why this output is correct"
          }
        ]
      },
      "difficulty": "EASY" | "MEDIUM" | "HARD",
      "tags": ["tag1", "tag2", "tag3"]
    }
  ]
}

Rules:
- Use uppercase strings for difficulty: "EASY", "MEDIUM", or "HARD"
- Format JSON exactly as shown (no markdown code blocks)
- Tags should reflect {problemType} concepts
- Examples should have valid input/output strings and helpful explanations
- Avoid repetition with provided challenge titles
- Use escape characters (\\n) where appropriate in strings
`,

  dailyChallengeSystemPrompt: `You are an expert daily coding challenge generator.
You create engaging, well-balanced daily coding problems that are suitable for a broad audience.
Daily challenges should be educational, fun, and encourage consistent practice.
Return only structured JSON objects as output.`,

  dailyChallengeUserPromptTemplate: `
Generate 1 unique daily coding challenge with the following criteria:

- Difficulty: {difficultyLevel}
- Exclude these existing challenge titles: {existingChallenges}
- Avoid these already generated titles: {alreadyGenerated}

Daily Challenge Requirements:
- Should be engaging and educational
- Suitable for daily practice and learning
- Balanced difficulty for the specified level
- Clear problem statement with practical examples
- Should cover fundamental programming concepts
- Encourage problem-solving and critical thinking

Return ONLY a valid JSON object with this structure (no markdown or extra text):

{
  "challenges": [
    {
      "title": "Daily Challenge Title",
      "description": {
        "problemStatement": "Explain the problem clearly and completely for daily practice.",
        "inputFormat": "Describe the format and type of input values.",
        "constraints": "List any constraints (e.g., input size, ranges).",
        "outputFormat": "Describe the expected output format.",
        "examples": [
          {
            "input": "Example input as string (preserve format)",
            "output": "Corresponding output",
            "explanation": "Explain why this output is correct and the learning point"
          }
        ]
      },
      "difficulty": "EASY" | "MEDIUM" | "HARD",
      "tags": ["daily-practice", "fundamentals", "problem-solving", "tag1", "tag2"]
    }
  ]
}

Rules:
- Use uppercase strings for difficulty: "EASY", "MEDIUM", or "HARD"
- Format JSON exactly as shown (no markdown code blocks)
- Include "daily-practice" and "fundamentals" in tags
- Examples should be educational and show learning points
- Avoid repetition with provided challenge titles
- Use escape characters (\\n) where appropriate in strings
- Make it engaging for daily practice
`,

  categories: {
    PF: "Programming Fundamentals (variables, control flow, functions, basic algorithms)",
    OOP: "Object-Oriented Programming (classes, inheritance, polymorphism, encapsulation)",
    DSA: "Data Structures & Algorithms (arrays, linked lists, trees, graphs, sorting, searching)",
    ALL: "Mix of Programming Fundamentals, Object-Oriented Programming, and Data Structures & Algorithms"
  },

  difficultyDescriptions: {
    EASY: "Basic concepts, simple logic, suitable for beginners",
    MEDIUM: "Intermediate concepts, moderate complexity, requires some problem-solving skills",
    HARD: "Advanced concepts, complex algorithms, requires strong problem-solving abilities"
  }
} as const;