"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, Lock, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { Footer } from "../components/Footer";

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
}

const getDifficultyTextColor = (difficulty: Difficulty) => {
  switch (difficulty) {
    case "EASY":
      return "text-emerald-400";
    case "MEDIUM":
      return "text-yellow-400";
    case "HARD":
      return "text-rose-400";
    default:
      return "text-gray-400";
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
}

const categories = ["pf", "dsa", "oop"];

export default function ProblemsPage() {
  const router = useRouter();

  // Enhanced question objects with LeetCode-like properties
  const questions: Question[] = [
    // Programming Fundamentals (pf) - 4 questions
    {
      id: "1",
      title: "Hello World",
      description: "Write a program that prints 'Hello World'",
      difficulty: "EASY",
      tags: ["basics", "output"],
      category: "pf",
      isCompleted: true,
      acceptanceRate: 95.2,
      solvedCount: 1250000,
    },
    {
      id: "2",
      title: "Sum of Two Numbers",
      description: "Calculate the sum of two given numbers",
      difficulty: "EASY",
      tags: ["arithmetic", "basics"],
      category: "pf",
      isCompleted: true,
      acceptanceRate: 88.7,
      solvedCount: 890000,
    },
    {
      id: "3",
      title: "FizzBuzz",
      description:
        "Print numbers 1 to 100, replacing multiples of 3 with 'Fizz', multiples of 5 with 'Buzz', and multiples of both with 'FizzBuzz'",
      difficulty: "EASY",
      tags: ["loops", "conditionals"],
      category: "pf",
      acceptanceRate: 72.4,
      solvedCount: 560000,
    },
    {
      id: "4",
      title: "Palindrome Check",
      description: "Check if a given string is a palindrome",
      difficulty: "MEDIUM",
      tags: ["strings", "algorithms"],
      category: "pf",
      acceptanceRate: 65.8,
      solvedCount: 420000,
    },

    // Data Structures & Algorithms (dsa) - 4 questions
    {
      id: "5",
      title: "Two Sum",
      description: "Find two numbers in an array that add up to a target sum",
      difficulty: "EASY",
      tags: ["arrays", "hash-map"],
      category: "dsa",
      isCompleted: true,
      acceptanceRate: 49.2,
      solvedCount: 2100000,
    },
    {
      id: "6",
      title: "Binary Search",
      description: "Implement binary search on a sorted array",
      difficulty: "MEDIUM",
      tags: ["searching", "divide-conquer"],
      category: "dsa",
      acceptanceRate: 58.3,
      solvedCount: 780000,
    },
    {
      id: "7",
      title: "Merge Sort",
      description: "Implement the merge sort algorithm",
      difficulty: "MEDIUM",
      tags: ["sorting", "recursion"],
      category: "dsa",
      acceptanceRate: 71.5,
      solvedCount: 340000,
    },
    {
      id: "8",
      title: "Longest Common Subsequence",
      description: "Find the longest common subsequence between two strings",
      difficulty: "HARD",
      tags: ["dynamic-programming", "strings"],
      category: "dsa",
      isPremium: true,
      acceptanceRate: 42.1,
      solvedCount: 180000,
    },

    // Object-Oriented Programming (oop) - 4 questions
    {
      id: "9",
      title: "Design a Calculator",
      description: "Create a calculator class with basic arithmetic operations",
      difficulty: "EASY",
      tags: ["classes", "methods"],
      category: "oop",
      acceptanceRate: 76.9,
      solvedCount: 290000,
    },
    {
      id: "10",
      title: "Animal Hierarchy",
      description: "Design an animal class hierarchy with inheritance",
      difficulty: "MEDIUM",
      tags: ["inheritance", "polymorphism"],
      category: "oop",
      isCompleted: true,
      acceptanceRate: 69.2,
      solvedCount: 210000,
    },
    {
      id: "11",
      title: "Banking System",
      description: "Design a banking system with accounts and transactions",
      difficulty: "MEDIUM",
      tags: ["encapsulation", "abstraction"],
      category: "oop",
      acceptanceRate: 54.7,
      solvedCount: 150000,
    },
    {
      id: "12",
      title: "Design Patterns Implementation",
      description:
        "Implement common design patterns (Singleton, Factory, Observer)",
      difficulty: "HARD",
      tags: ["design-patterns", "architecture"],
      category: "oop",
      isPremium: true,
      acceptanceRate: 38.5,
      solvedCount: 95000,
    },
  ];

  const groupedQuestions = categories.reduce((acc, category) => {
    acc[category] = questions.filter((q) => q.category === category);
    return acc;
  }, {} as Record<string, Question[]>);

  const handleProblemClick = (problemId: string) => {
    router.push(`/problems/${problemId}`);
  };

  return (
    <div className="min-h-screen w-full bg-black bg-gradient-to-b from-black via-gray-900 to-black">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground tracking-tight">
                  Problems
                </h1>
              </div>
              <div className="flex items-center space-x-3">
                <Trophy className="h-6 w-6 text-yellow-500" />
                <div className="text-sm">
                  <div className="text-foreground font-semibold">
                    4/12 Solved
                  </div>
                  <div className="text-muted-foreground">33.3% Complete</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Problems List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {Object.entries(groupedQuestions).map(
            ([category, categoryQuestions]) => (
              <div key={category} className="space-y-4">
                <div className="flex items-center gap-4">
                  <Badge
                    variant="outline"
                    className="border-border text-muted-foreground bg-muted/50 px-3 py-1 text-xs font-semibold uppercase tracking-wider"
                  >
                    {category}
                  </Badge>
                  <h2 className="text-2xl font-semibold text-foreground">
                    {getCategoryTitle(category)}
                  </h2>
                  <span className="text-muted-foreground text-sm">
                    ({categoryQuestions.length} problems)
                  </span>
                  <Separator className="flex-1" />
                </div>

                <div className="overflow-x-auto rounded-lg border border-border shadow-sm bg-card">
                  <table className="w-full min-w-[700px]">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left py-4 px-4 sm:px-6 font-medium text-muted-foreground uppercase tracking-wider text-xs w-12">
                          Status
                        </th>
                        <th className="text-left py-4 px-4 sm:px-6 font-medium text-muted-foreground uppercase tracking-wider text-xs">
                          Title
                        </th>
                        <th className="text-left py-4 px-4 sm:px-6 font-medium text-muted-foreground uppercase tracking-wider text-xs w-24">
                          Difficulty
                        </th>
                        <th className="text-left py-4 px-4 sm:px-6 font-medium text-muted-foreground uppercase tracking-wider text-xs">
                          Acceptance
                        </th>
                        <th className="text-left py-4 px-4 sm:px-6 font-medium text-muted-foreground uppercase tracking-wider text-xs">
                          Tags
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoryQuestions.map((question) => (
                        <tr
                          key={question.id}
                          onClick={() => handleProblemClick(question.id)}
                          className={cn(
                            "border-b border-border group hover:bg-muted/50 transition-colors duration-200 cursor-pointer"
                          )}
                        >
                          <td className="py-4 px-4 sm:px-6">
                            <div className="flex items-center justify-center">
                              {question.isCompleted ? (
                                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                              ) : question.isPremium ? (
                                <Lock className="h-4 w-4 text-yellow-500" />
                              ) : (
                                <Circle className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4 sm:px-6">
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  "font-medium group-hover:text-primary transition-colors duration-200",
                                  question.isCompleted
                                    ? "text-emerald-400"
                                    : "text-foreground"
                                )}
                              >
                                {question.title}
                              </span>
                              {question.isPremium && (
                                <Lock className="h-3 w-3 text-yellow-500" />
                              )}
                            </div>
                            <div className="text-muted-foreground text-sm mt-1 line-clamp-2">
                              {question.description}
                            </div>
                          </td>
                          <td className="py-4 px-4 sm:px-6">
                            <Badge
                              variant="outline"
                              className={cn(
                                "border-0 font-medium text-xs",
                                getDifficultyTextColor(question.difficulty)
                              )}
                            >
                              {question.difficulty}
                            </Badge>
                          </td>
                          <td className="py-4 px-4 sm:px-6">
                            <div className="text-sm">
                              <div className="text-foreground font-medium">
                                {question.acceptanceRate}%
                              </div>
                              <div className="text-muted-foreground text-xs">
                                {question.solvedCount?.toLocaleString()} solved
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 sm:px-6">
                            <div className="flex flex-wrap gap-1">
                              {question.tags.slice(0, 3).map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="secondary"
                                  className="text-xs px-2 py-0.5 bg-muted text-muted-foreground hover:bg-muted/80"
                                >
                                  {tag}
                                </Badge>
                              ))}
                              {question.tags.length > 3 && (
                                <Badge
                                  variant="secondary"
                                  className="text-xs px-2 py-0.5 bg-muted text-muted-foreground"
                                >
                                  +{question.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
