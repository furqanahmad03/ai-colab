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
  },

  submissionEvaluationSystemPrompt: `
You are a precise and honest AI coding judge.

You evaluate submitted code against a coding challenge by checking correctness, edge cases, constraints, and expected behavior.

Return a strict, structured result as JSON using only these allowed values for "result":
- "PASS": if the solution is fully correct
- "FAIL": if the solution gives incorrect output
- "ERROR": if the solution crashes or doesn't compile
- "PENDING": only if you're uncertain and cannot judge

Do not include any markdown, explanation text, or formatting — only a raw JSON object.
`,

  submissionEvaluationUserPrompt: `
Evaluate the following user submission.

### Challenge Title
{title}

### Description
Problem Statement:
{problemStatement}

Input Format:
{inputFormat}

Constraints:
{constraints}

Output Format:
{outputFormat}

Examples:
{examples}

### Language
{language}

### User Code
{code}

### Return JSON in this exact format:

{
  "result": "PASS" | "FAIL" | "ERROR" | "PENDING",
  "score": number,            // Between 0 and 100
  "runtime": number,          // Optional, in milliseconds
  "memory": number,           // Optional, in megabytes
  "explanation": "Brief explanation of why the result was chosen"
}

Judging Guidelines:
- Use only the allowed result values
- If the code matches the expected output for all test cases: result is "PASS"
- If the output is wrong or partially correct: result is "FAIL"
- If code crashes, fails to run, or contains syntax errors: result is "ERROR"
- If you're unable to evaluate the code: result is "PENDING"
- You must simulate typical test cases based on examples and constraints
- Do not return extra commentary or markdown — just valid JSON
`
} as const;