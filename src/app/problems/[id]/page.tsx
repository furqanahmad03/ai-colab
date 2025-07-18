"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  cn,
  processAIContent,
  parseMultiplePackets,
  reassemblePackets,
} from "@/lib/utils";
import CodeEditor from "../../components/CodeEditor";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Lock,
  Trophy,
  Timer,
  Play,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { Footer } from "../../components/Footer";
import { useState, useEffect } from "react";

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
  description: string;
  difficulty: Difficulty;
  tags: string[];
  createdById?: string;
  createdBy?: {
    name: string;
    email: string;
  };
  isDaily: boolean;
  submissions: any[];
  _count: {
    submissions: number;
  };
  createdAt: string;
  // AI-generated content might have these additional fields
  aiGeneratedContent?: string;
  rawContent?: string;
  examples?: any[];
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

// Enhanced transform function with AI content processing
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

  // Process AI-generated content if available
  let processedContent = null;
  let finalDescription = apiChallenge.description;
  let finalProblemStatement = apiChallenge.description;
  let finalExamples = apiChallenge.examples || [];
  let finalConstraints = apiChallenge.constraints || [];

  // Check if we have AI-generated content to process
  if (apiChallenge.aiGeneratedContent || apiChallenge.rawContent) {
    const rawContent =
      apiChallenge.aiGeneratedContent || apiChallenge.rawContent || "";

    console.log(
      "🤖 Processing AI-generated content:",
      rawContent.substring(0, 200) + "..."
    );

    try {
      // First, check if content contains packets
      const packets = parseMultiplePackets(rawContent);

      if (packets.length > 0) {
        console.log("📦 Found packets:", packets.length);
        // Reassemble packets if found
        const reassembledContent = reassemblePackets(packets);
        console.log("🔄 Reassembled content:", reassembledContent);

        // Process the reassembled content
        processedContent = processAIContent(reassembledContent);
      } else {
        // Process raw content directly
        processedContent = processAIContent(rawContent);
      }

      console.log("✨ Processed AI content:", processedContent);

      // Use processed content
      if (processedContent) {
        finalDescription =
          processedContent.description || apiChallenge.description;
        finalProblemStatement =
          processedContent.problemStatement ||
          processedContent.description ||
          apiChallenge.description;
        finalExamples =
          processedContent.examples.length > 0
            ? processedContent.examples
            : finalExamples;
        finalConstraints =
          processedContent.constraints.length > 0
            ? processedContent.constraints
            : finalConstraints;
      }
    } catch (error) {
      console.error("❌ Error processing AI content:", error);
      // Fall back to original content
      finalDescription = apiChallenge.description;
      finalProblemStatement = apiChallenge.description;
    }
  }

  // Determine category based on tags or processed content
  let category = "pf"; // default
  const allTags = [...apiChallenge.tags, ...(processedContent?.tags || [])];

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

  // Generate fallback examples if none exist
  if (finalExamples.length === 0) {
    finalExamples = getMockExamples(apiChallenge.difficulty);
  }

  // Generate fallback constraints if none exist
  if (finalConstraints.length === 0) {
    finalConstraints = getMockConstraints(apiChallenge.difficulty);
  }

  const result: Question = {
    id: apiChallenge.id,
    title: apiChallenge.title,
    description: finalDescription,
    difficulty: apiChallenge.difficulty,
    tags: [
      ...new Set([...apiChallenge.tags, ...(processedContent?.tags || [])]),
    ], // Merge and deduplicate tags
    category,
    isCompleted: false, // You can determine this based on user's submissions
    isPremium: false, // You can set this based on your business logic
    acceptanceRate,
    solvedCount: totalSubmissions,
    problemStatement: finalProblemStatement,
    examples: finalExamples,
    constraints: finalConstraints,
  };

  console.log("✅ Final transformed question:", result);
  return result;
};

// Fallback functions for mock data
const getMockExamples = (difficulty: Difficulty) => {
  switch (difficulty) {
    case "EASY":
      return [
        {
          input: "Sample input",
          output: "Sample output",
          explanation: "This is how the solution works.",
        },
      ];
    case "MEDIUM":
      return [
        {
          input: "nums = [1,2,3], target = 4",
          output: "true",
          explanation: "Example explanation for medium problem.",
        },
        {
          input: "nums = [1,2], target = 5",
          output: "false",
          explanation: "Another example for better understanding.",
        },
      ];
    case "HARD":
      return [
        {
          input: "Complex input example",
          output: "Complex output",
          explanation: "Detailed explanation for hard problem.",
        },
        {
          input: "Edge case input",
          output: "Edge case output",
          explanation: "Edge case handling explanation.",
        },
      ];
    default:
      return [];
  }
};

const getMockConstraints = (difficulty: Difficulty) => {
  switch (difficulty) {
    case "EASY":
      return [
        "1 <= input <= 100",
        "Time complexity: O(n)",
        "Space complexity: O(1)",
      ];
    case "MEDIUM":
      return [
        "1 <= input <= 1000",
        "Time complexity: O(n log n)",
        "Space complexity: O(n)",
      ];
    case "HARD":
      return [
        "1 <= input <= 10^5",
        "Time complexity: O(n^2)",
        "Space complexity: O(n)",
      ];
    default:
      return [];
  }
};

// Helper function to render markdown-like formatting
const renderFormattedText = (text: string) => {
  if (!text) return text;

  // Split text by markdown patterns while preserving the delimiters
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);

  return parts.map((part, index) => {
    // Check if it's bold text (**text**)
    if (part.startsWith("**") && part.endsWith("**")) {
      const boldText = part.slice(2, -2);
      return (
        <strong key={index} className="font-bold text-white">
          {boldText}
        </strong>
      );
    }

    // Check if it's code text (`text`) - now with italic styling
    if (part.startsWith("`") && part.endsWith("`")) {
      const codeText = part.slice(1, -1);
      return (
        <code
          key={index}
          className="text-sm bg-slate-800 text-emerald-400 px-1 py-0.5 rounded font-mono italic"
        >
          {codeText}
        </code>
      );
    }

    // Return plain text
    return part;
  });
};

export default function ProblemPage() {
  const router = useRouter();
  const params = useParams();
  const problemId = params.id as string;

  const [problem, setProblem] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    const fetchChallenge = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log("🚀 Fetching challenge with ID:", problemId);

        const response = await fetch(`/api/challenges/${problemId}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError("Challenge not found");
          } else {
            setError("Failed to fetch challenge");
          }
          return;
        }

        const data = await response.json();
        console.log("📥 Raw API response:", data);

        // Store debug info
        setDebugInfo({
          rawApiResponse: data,
          timestamp: new Date().toISOString(),
        });

        const transformedProblem = transformApiChallenge(data.challenge);
        setProblem(transformedProblem);
      } catch (err) {
        console.error("❌ Error fetching challenge:", err);
        setError("An error occurred while fetching the challenge");
      } finally {
        setLoading(false);
      }
    };

    if (problemId) {
      fetchChallenge();
    }
  }, [problemId]);

  // Debug function to show processed content
  const showDebugInfo = () => {
    if (debugInfo) {
      console.log("🔍 Debug Info:", debugInfo);
      console.log("📊 Current Problem State:", problem);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen w-full bg-black bg-gradient-to-b from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-400 mx-auto" />
          <p className="text-white">Loading challenge...</p>
          <p className="text-gray-400 text-sm">Processing AI content...</p>
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
          {debugInfo && (
            <Button variant="outline" onClick={showDebugInfo} className="ml-4">
              Show Debug Info
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-black bg-gradient-to-b from-black via-gray-900 to-black">
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
                  {problem.isCompleted ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : problem.isPremium ? (
                    <Lock className="h-4 w-4 text-yellow-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                  <h1 className="text-2xl font-bold text-foreground">
                    {problem.title}
                  </h1>
                  {problem.isPremium && (
                    <Lock className="h-4 w-4 text-yellow-500" />
                  )}
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
                {/* Debug button - remove in production */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={showDebugInfo}
                  className="text-xs"
                >
                  🔍 Debug
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
                <CardTitle className="flex items-center gap-2">
                  Problem Description
                  {/* Show indicator if AI-processed */}
                  {debugInfo?.rawApiResponse?.challenge?.aiGeneratedContent && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-purple-500/10 text-purple-400 border-purple-500/20"
                    >
                      AI-Generated
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="prose prose-invert max-w-none">
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {renderFormattedText(problem.description)}
                  </p>
                </div>

                {problem.problemStatement &&
                  problem.problemStatement !== problem.description && (
                    <div>
                      <h3 className="font-semibold mb-2">Problem Statement</h3>
                      <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                        <p className="text-sm text-gray-300 whitespace-pre-wrap">
                          {renderFormattedText(problem.problemStatement)}
                        </p>
                      </div>
                    </div>
                  )}

                {problem.examples && problem.examples.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Examples</h3>
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
                                {example.input}
                              </code>
                            </div>
                            <div>
                              <span className="font-medium text-emerald-400">
                                Output:{" "}
                              </span>
                              <code className="text-sm bg-slate-800 text-gray-300 px-2 py-1 rounded">
                                {example.output}
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

            {/* Problem Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>Problem Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Difficulty:</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "border font-medium",
                        getDifficultyColor(problem.difficulty)
                      )}
                    >
                      {problem.difficulty}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Category:</span>
                    <span className="text-sm text-muted-foreground">
                      {getCategoryTitle(problem.category)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Acceptance Rate:
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {problem.acceptanceRate}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Solved Count:</span>
                    <span className="text-sm text-muted-foreground">
                      {problem.solvedCount?.toLocaleString()}
                    </span>
                  </div>
                </div>

                <Separator />

                <div>
                  <span className="text-sm font-medium mb-2 block">Tags:</span>
                  <div className="flex flex-wrap gap-2">
                    {problem.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    <span className="font-medium text-sm">
                      {problem.isCompleted ? "Completed" : "Not Started"}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {problem.isCompleted
                      ? "You have solved this problem"
                      : "Start solving to track your progress"}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Code Editor */}
          <div className="space-y-6">
            <CodeEditor
              problemId={problemId}
              testCases={
                problem.examples?.map((example) => ({
                  input: example.input,
                  expectedOutput: example.output,
                  description: example.explanation,
                })) || []
              }
              onSubmit={(code) => {
                console.log("Submitting solution:", {
                  code,
                  problemId,
                  title: problem.title,
                  difficulty: problem.difficulty,
                });
                // Navigate to submission page after submitting
                router.push("/submission");
              }}
            />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
