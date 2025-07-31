"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import CodeEditor from "../../components/CodeEditor";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Lock,
  Play,
  Loader2,
  Trophy,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { Footer } from "../../components/Footer";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { AuthenticatedNavbar } from "@/app/components/AuthenticatedNavbar";

type Difficulty = "EASY" | "MEDIUM" | "HARD";

interface Question {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  tags: string[];
  category: string;
  isCompleted?: boolean;
  isPremium?: boolean;
  acceptanceRate?: number;
  solvedCount?: number;
  problemStatement?: string;
  examples?: {
    input: string;
    output: string;
    explanation?: string;
  }[];
  constraints?: string[];
}

interface ApiChallenge {
  id: string;
  title: string;
  description: string | any;
  difficulty: Difficulty;
  tags: string[];
  createdById?: string;
  createdBy?: {
    name: string;
    email: string;
  };
  isDaily: boolean;
  submissions: Array<{
    id: string;
    result: string;
    score: number | null;
    runtime: number | null;
    memory: number | null;
    createdAt: string;
  }>;
  _count: {
    submissions: number;
  };
  createdAt: string;
  aiGeneratedContent?: string;
  rawContent?: string;
  examples?: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  constraints?: string[];
}

const getDifficultyColor = (difficulty: Difficulty) => {
  switch (difficulty) {
    case "EASY":
      return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
    case "MEDIUM":
      return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
    case "HARD":
      return "text-rose-400 bg-rose-400/10 border-rose-400/20";
    default:
      return "text-gray-400 bg-gray-400/10 border-gray-400/20";
  }
};

const getCategoryTitle = (category: string) => {
  switch (category) {
    case "pf":
      return "Programming Fundamentals";
    case "dsa":
      return "Data Structures & Algorithms";
    case "oop":
      return "Object-Oriented Programming";
    default:
      return category;
  }
};

// Function to extract examples from description text
const extractExamplesFromText = (
  description: string
): Array<{
  input: string;
  output: string;
  explanation?: string;
}> => {
  const examples: Array<{
    input: string;
    output: string;
    explanation?: string;
  }> = [];

  // Split the description into lines
  const lines = description.split("\n");
  let currentExample: any = null;
  let inExampleSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check if we're entering the examples section
    if (line.toLowerCase().includes("examples:")) {
      inExampleSection = true;
      continue;
    }

    // Check if we're starting a new example
    if (inExampleSection && line.toLowerCase().includes("example")) {
      if (currentExample && currentExample.input && currentExample.output) {
        examples.push(currentExample);
      }
      currentExample = {};
      continue;
    }

    // Extract input
    if (inExampleSection && line.toLowerCase().startsWith("input:")) {
      const input = line.substring(line.indexOf(":") + 1).trim();
      if (currentExample) {
        currentExample.input = input;
      }
      continue;
    }

    // Extract output
    if (inExampleSection && line.toLowerCase().startsWith("output:")) {
      const output = line.substring(line.indexOf(":") + 1).trim();
      if (currentExample) {
        currentExample.output = output;
      }
      continue;
    }

    // Extract explanation
    if (inExampleSection && line.toLowerCase().startsWith("explanation:")) {
      let explanation = line.substring(line.indexOf(":") + 1).trim();

      // Collect multi-line explanation
      let j = i + 1;
      while (
        j < lines.length &&
        lines[j].trim() &&
        !lines[j].trim().toLowerCase().includes("example")
      ) {
        explanation += " " + lines[j].trim();
        j++;
      }

      if (currentExample) {
        currentExample.explanation = explanation;
      }
      i = j - 1; // Skip the lines we just processed
      continue;
    }
  }

  // Add the last example if it exists
  if (currentExample && currentExample.input && currentExample.output) {
    examples.push(currentExample);
  }

  console.log("🔍 Extracted examples from text:", examples);
  return examples;
};

const transformApiChallenge = (apiChallenge: ApiChallenge): Question => {
  console.log("🔍 Transforming API Challenge:", apiChallenge);

  // Calculate acceptance rate based on submissions
  const totalSubmissions = apiChallenge._count.submissions;
  const passedSubmissions = apiChallenge.submissions.filter(
    (sub) => sub.result === "PASS"
  ).length;
  const acceptanceRate =
    totalSubmissions > 0
      ? Math.round((passedSubmissions / totalSubmissions) * 100)
      : 0;

  // Handle description and examples
  let finalDescription = "";
  let finalExamples = [];
  let finalConstraints = [];

  // Handle nested description structure
  if (
    apiChallenge.description &&
    typeof apiChallenge.description === "object"
  ) {
    const descObj = apiChallenge.description as any;
    finalDescription = descObj.problemStatement || JSON.stringify(descObj);
    if (descObj.examples && Array.isArray(descObj.examples)) {
      finalExamples = descObj.examples;
    }
    if (descObj.constraints && Array.isArray(descObj.constraints)) {
      finalConstraints = descObj.constraints;
    }
  } else {
    finalDescription =
      typeof apiChallenge.description === "string"
        ? apiChallenge.description
        : JSON.stringify(apiChallenge.description);

    // Try to extract examples from description text
    if (typeof apiChallenge.description === "string") {
      finalExamples = extractExamplesFromText(apiChallenge.description);
    }

    // Fallback to top-level examples
    if (finalExamples.length === 0) {
      finalExamples = apiChallenge.examples || [];
    }
    finalConstraints = apiChallenge.constraints || [];
  }

  console.log("🔍 Raw API examples:", apiChallenge.examples);
  console.log("🔍 Raw API description:", apiChallenge.description);
  console.log("🔍 Final examples after processing:", finalExamples);
  console.log("🔍 Examples count:", finalExamples.length);
  console.log("🔍 First example:", finalExamples[0]);

  // Determine category based on tags
  let category = "pf"; // default
  const allTags = [...apiChallenge.tags];

  if (
    allTags.some((tag) =>
      [
        "array",
        "hash-map",
        "tree",
        "graph",
        "dp",
        "sorting",
        "dynamic-programming",
      ].includes(tag.toLowerCase())
    )
  ) {
    category = "dsa";
  } else if (
    allTags.some((tag) =>
      ["class", "inheritance", "polymorphism", "abstraction", "oop"].includes(
        tag.toLowerCase()
      )
    )
  ) {
    category = "oop";
  }

  const result: Question = {
    id: apiChallenge.id,
    title: apiChallenge.title,
    description: finalDescription,
    difficulty: apiChallenge.difficulty,
    tags: apiChallenge.tags,
    category,
    isCompleted: false,
    isPremium: false,
    acceptanceRate,
    solvedCount: totalSubmissions,
    problemStatement: finalDescription,
    examples: finalExamples,
    constraints: finalConstraints,
  };

  console.log("✅ Final transformed question:", result);
  return result;
};

export default function ProblemPage() {
  const router = useRouter();
  const params = useParams();
  const problemId = params.id as string;
  const { data: session, status } = useSession();

  const [problem, setProblem] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchChallenge = async () => {
      if (!session?.user?.id) {
        setError("Authentication required");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log("🚀 Fetching challenge with ID:", problemId);

        const response = await fetch(
          `/api/challenges/${problemId}?userId=${session.user.id}`
        );

        if (!response.ok) {
          if (response.status === 404) {
            setError("Challenge not found");
          } else if (response.status === 403) {
            setError(
              "Access denied - You don't have permission to view this challenge"
            );
          } else {
            setError("Failed to fetch challenge");
          }
          return;
        }

        const data = await response.json();
        console.log("📥 Raw API response:", data);

        const transformedProblem = transformApiChallenge(data.challenge);
        console.log(
          "📋 Transformed problem examples:",
          transformedProblem.examples
        );
        setProblem(transformedProblem);
      } catch (err) {
        console.error("❌ Error fetching challenge:", err);
        setError("An error occurred while fetching the challenge");
      } finally {
        setLoading(false);
      }
    };

    if (problemId && session?.user?.id) {
      fetchChallenge();
    }
  }, [problemId, session?.user?.id]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen w-full bg-black bg-gradient-to-b from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-400 mx-auto" />
          <p className="text-white">Loading challenge...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !problem) {
    return (
      <div className="min-h-screen w-full bg-black bg-gradient-to-b from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-white mb-4">
            {error || "Challenge Not Found"}
          </h1>
          <p className="text-gray-300 mb-6">
            {error || "The challenge you're looking for doesn't exist."}
          </p>
          <Button
            onClick={() => router.push("/problems")}
            className="bg-emerald-500 hover:bg-emerald-600"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Problems
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-black bg-gradient-to-b from-black via-gray-900 to-black">
      <AuthenticatedNavbar />
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/problems")}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-foreground">
                    {problem.title}
                  </h1>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge
                  variant="outline"
                  className={cn(
                    "border font-medium",
                    getDifficultyColor(problem.difficulty)
                  )}
                >
                  {problem.difficulty}
                </Badge>
                <Button size="sm">
                  <Play className="mr-2 h-4 w-4" />
                  Start Solving
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - Problem Description */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Problem Description</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="prose prose-invert max-w-none">
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {problem.description}
                  </p>
                </div>

                {problem.examples && problem.examples.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">
                      Examples ({problem.examples.length})
                    </h3>
                    <div className="space-y-4">
                      {problem.examples.map((example, index) => (
                        <div
                          key={index}
                          className="bg-muted/50 p-4 rounded-lg border border-slate-700"
                        >
                          <div className="space-y-2">
                            <div>
                              <span className="font-medium text-emerald-400">
                                Input:{" "}
                              </span>
                              <code className="text-sm bg-slate-800 text-gray-300 px-2 py-1 rounded">
                                {example.input || "No input provided"}
                              </code>
                            </div>
                            <div>
                              <span className="font-medium text-emerald-400">
                                Output:{" "}
                              </span>
                              <code className="text-sm bg-slate-800 text-gray-300 px-2 py-1 rounded">
                                {example.output || "No output provided"}
                              </code>
                            </div>
                            {example.explanation && (
                              <div>
                                <span className="font-medium text-emerald-400">
                                  Explanation:{" "}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  {example.explanation}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(!problem.examples || problem.examples.length === 0) && (
                  <div>
                    <h3 className="font-semibold mb-3">Examples</h3>
                    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                      <p className="text-sm text-gray-400">
                        No examples provided for this problem.
                      </p>
                    </div>
                  </div>
                )}

                {problem.constraints && problem.constraints.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Constraints</h3>
                    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                        {problem.constraints.map((constraint, index) => (
                          <li key={index}>{constraint}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Code Editor */}
          <div className="space-y-6">
            <CodeEditor
              testCases={
                problem.examples?.map((example) => ({
                  input: example.input,
                  expectedOutput: example.output,
                  description: example.explanation,
                })) || []
              }
              onSubmit={async (code, language = "javascript") => {
                console.log("Submitting solution:", {
                  code,
                  problemId,
                  title: problem.title,
                  difficulty: problem.difficulty,
                });

                try {
                  const userId = session?.user?.id;

                  if (!userId) {
                    throw new Error("User not authenticated");
                  }

                  // Make API call to submit the solution
                  const response = await fetch(
                    `/api/submissions/${problemId}`,
                    {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        userId,
                        code,
                        language,
                      }),
                    }
                  );

                  if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(
                      errorData.error || "Failed to submit solution"
                    );
                  }

                  const result = await response.json();
                  router.push(`/submissions/${result.submission.id}`);
                } catch (error) {
                  console.error("Error submitting solution:", error);
                  alert(
                    `Error submitting solution: ${
                      error instanceof Error
                        ? error.message
                        : "Unknown error occurred"
                    }`
                  );
                }
              }}
            />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
