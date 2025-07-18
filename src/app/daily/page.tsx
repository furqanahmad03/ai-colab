"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import CodeEditor from "../components/CodeEditor";
import {
  ArrowLeft,
  Circle,
  Trophy,
  Play,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Footer } from "../components/Footer";

type Difficulty = "EASY" | "MEDIUM" | "HARD";

interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  tags: string[];
  createdBy?: {
    name: string | null;
    email: string;
  };
  _count?: {
    submissions: number;
  };
  createdAt: string;
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

export default function Page() {
  const router = useRouter();
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallenge | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDailyChallenge();
    // eslint-disable-next-line
  }, []);

  const fetchDailyChallenge = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/daily-challanges');
      const data = await response.json();

      if (response.ok) {
        setDailyChallenge(data.dailyChallenge);
      } else {
        setError(data.error || 'Failed to fetch daily challenge');
      }
    } catch (error) {
      console.error('Error fetching daily challenge:', error);
      setError('Failed to fetch daily challenge');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-foreground mb-4">
            Loading Daily Challenge...
          </div>
          <div className="text-muted-foreground">
            Generating today's challenge for you
          </div>
        </div>
      </div>
    );
  }

  if (error || !dailyChallenge) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            {error || 'Daily Challenge Not Found'}
          </h1>
          <p className="text-muted-foreground mb-6">
            {error || "Unable to load today's daily challenge."}
          </p>
          <div className="space-x-4">
            <Button onClick={() => fetchDailyChallenge()}>
              Try Again
            </Button>
            <Button variant="outline" onClick={() => router.push("/problems")}> 
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Problems
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
                  <Circle className="h-5 w-5 text-muted-foreground" />
                  <h1 className="text-2xl font-bold text-foreground">
                    {dailyChallenge.title}
                  </h1>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge
                  variant="outline"
                  className={cn(
                    "border font-medium",
                    getDifficultyColor(dailyChallenge.difficulty)
                  )}
                >
                  {dailyChallenge.difficulty}
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
                <p className="text-muted-foreground">{dailyChallenge.description}</p>
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
                        getDifficultyColor(dailyChallenge.difficulty)
                      )}
                    >
                      {dailyChallenge.difficulty}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Submissions:</span>
                    <span className="text-sm text-muted-foreground">
                      {dailyChallenge._count?.submissions || 0}
                    </span>
                  </div>
                </div>

                <Separator />

                <div>
                  <span className="text-sm font-medium mb-2 block">Tags:</span>
                  <div className="flex flex-wrap gap-2">
                    {dailyChallenge.tags.map((tag) => (
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
                      Daily Challenge
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Today's challenge - solve it to improve your skills
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Code Editor */}
          <div className="space-y-6">
            <CodeEditor
              problemId={dailyChallenge.id}
              testCases={[]}
              onSubmit={(code) => {
                console.log("Submitting solution:", {
                  code,
                  questionId: dailyChallenge.id,
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
