"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import CodeEditor from "../components/CodeEditor";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Lock,
  Trophy,
  Timer,
  Play,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Footer } from "../components/Footer";

export default function Page() {
  const router = useRouter();
  const [challenge, setChallenge] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch("/api/daily-challanges")
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || "Failed to fetch daily challenge");
        }
        return res.json();
      })
      .then((data) => {
        setChallenge(data.dailyChallenge);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <span className="text-white text-lg">Loading daily challenge...</span>
      </div>
    );
  }

  if (error || !challenge) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">No Daily Challenge</h1>
          <p className="text-gray-400 mb-6">{error || "No challenge available for today."}</p>
          <Button onClick={() => router.push("/")}> 
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
      </div>
    );
  }

  // Map API data to your expected structure if needed
  const question = {
    id: challenge.id,
    title: challenge.title,
    description: challenge.description,
    difficulty: challenge.difficulty || "EASY",
    tags: challenge.tags || [],
    category: challenge.category || "",
    isCompleted: false,
    isPremium: false,
    acceptanceRate: challenge.acceptanceRate || 0,
    solvedCount: challenge._count?.submissions || 0,
    problemStatement: challenge.problemStatement || "",
    examples: challenge.examples || [
      {
        input: "No input required",
        output: "",
        explanation: "",
      },
    ],
    constraints: challenge.constraints || [],
  };

  const getDifficultyColor = (difficulty: string) => {
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/")}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <div className="flex items-center gap-2">
                  {question.isCompleted ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : question.isPremium ? (
                    <Lock className="h-4 w-4 text-yellow-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                  <h1 className="text-2xl font-bold text-foreground">
                    {question.title}
                  </h1>
                  {question.isPremium && (
                    <Lock className="h-4 w-4 text-yellow-500" />
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge
                  variant="outline"
                  className={cn(
                    "border font-medium",
                    getDifficultyColor(question.difficulty)
                  )}
                >
                  {question.difficulty}
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
                <CardTitle className="flex items-center gap-2">
                  Problem Description
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">{question.description}</p>

                {question.problemStatement && (
                  <div>
                    <h3 className="font-semibold mb-2">Problem Statement</h3>
                    <p className="text-sm text-muted-foreground">
                      {question.problemStatement}
                    </p>
                  </div>
                )}

                {question.examples && question.examples.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Examples</h3>
                    <div className="space-y-4">
                      {question.examples.map((example: any, index: number) => (
                        <div key={index} className="bg-muted/50 p-4 rounded-lg">
                          <div className="space-y-2">
                            <div>
                              <span className="font-medium">Input: </span>
                              <code className="text-sm bg-muted px-2 py-1 rounded">
                                {example.input}
                              </code>
                            </div>
                            <div>
                              <span className="font-medium">Output: </span>
                              <code className="text-sm bg-muted px-2 py-1 rounded">
                                {example.output}
                              </code>
                            </div>
                            {example.explanation && (
                              <div>
                                <span className="font-medium">
                                  Explanation: {" "}
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

                {question.constraints && question.constraints.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Constraints</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      {question.constraints.map((constraint: string, index: number) => (
                        <li key={index}>{constraint}</li>
                      ))}
                    </ul>
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
                        getDifficultyColor(question.difficulty)
                      )}
                    >
                      {question.difficulty}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Category:</span>
                    <span className="text-sm text-muted-foreground">
                      {getCategoryTitle(question.category)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Acceptance Rate:
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {question.acceptanceRate}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Solved Count:</span>
                    <span className="text-sm text-muted-foreground">
                      {question.solvedCount?.toLocaleString()}
                    </span>
                  </div>
                </div>

                <Separator />

                <div>
                  <span className="text-sm font-medium mb-2 block">Tags:</span>
                  <div className="flex flex-wrap gap-2">
                    {question.tags.map((tag: string) => (
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
                      {question.isCompleted ? "Completed" : "Not Started"}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {question.isCompleted
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
              problemId={question.id}
              testCases={
                question.examples?.map((example: any, index: number) => ({
                  input: example.input,
                  expectedOutput: example.output,
                  description: example.explanation,
                })) || []
              }
              onSubmit={(code) => {
                console.log("Submitting solution:", {
                  code,
                  questionId: question.id,
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
