"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, Clock, XCircle, AlertTriangle, Trophy } from "lucide-react";
import { Footer } from "../components/Footer";

type Difficulty = "EASY" | "MEDIUM" | "HARD";
type Result = "PENDING" | "PASS" | "FAIL" | "ERROR";

interface ApiChallenge {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  tags: string[];
  createdById: string;
  isDaily: boolean;
  createdAt: string;
  createdBy?: {
    name: string | null;
    email: string;
  };
  submissions: {
    id: string;
    result: Result;
    score: number | null;
    runtime: number | null;
    memory: number | null;
    createdAt: string;
  }[];
  _count?: {
    submissions: number;
  };
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
    case "other":
      return "Other Challenges";
    default:
      return category;
  }
}

const getStatusDisplay = (challenge: ApiChallenge) => {
  if (challenge.submissions.length === 0) {
    return {
      status: "Not Solved",
      icon: <Circle className="h-5 w-5 text-muted-foreground" />,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      badgeColor: "bg-blue-500 text-white"
    };
  }

  const latestSubmission = challenge.submissions[0];
  
  switch (latestSubmission.result) {
    case "PASS":
      return {
        status: "Accepted",
        icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
        color: "text-emerald-500",
        bgColor: "bg-emerald-500/10",
        badgeColor: "bg-green-500 text-white"
      };
    case "FAIL":
      return {
        status: "Failed",
        icon: <XCircle className="h-5 w-5 text-rose-500" />,
        color: "text-rose-500",
        bgColor: "bg-rose-500/10",
        badgeColor: "bg-red-500 text-white"
      };
    case "ERROR":
      return {
        status: "Error",
        icon: <AlertTriangle className="h-5 w-5 text-orange-500" />,
        color: "text-orange-500",
        bgColor: "bg-orange-500/10",
        badgeColor: "bg-red-500 text-white"
      };
    case "PENDING":
      return {
        status: "Pending",
        icon: <Clock className="h-5 w-5 text-yellow-500" />,
        color: "text-yellow-500",
        bgColor: "bg-yellow-500/10",
        badgeColor: "bg-yellow-500 text-white"
      };
    default:
      return {
        status: "Unknown",
        icon: <Circle className="h-5 w-5 text-muted-foreground" />,
        color: "text-muted-foreground",
        bgColor: "bg-muted/50",
        badgeColor: "bg-gray-500 text-white"
      };
  }
};

const categories = ["pf", "oop", "dsa"];

export default function ProblemsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [challenges, setChallenges] = useState<ApiChallenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch challenges when session is available
  useEffect(() => {
    if (session?.user?.id) {
      fetchChallenges();
    }
  }, [session]);

  const fetchChallenges = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/challenges?userId=${session?.user?.id}`);
      const data = await response.json();

      if (response.ok) {
        setChallenges(data.challenges || []);
      } else {
        setError(data.error || "Failed to fetch challenges");
      }
    } catch (error) {
      console.error("Error fetching challenges:", error);
      setError("Failed to fetch challenges");
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking authentication
  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen w-full bg-black bg-gradient-to-b from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!session) {
    return null;
  }

  // Group challenges by category
  const groupedQuestions = categories.reduce((acc, category) => {
    acc[category] = challenges.filter((challenge) => {
      const tags = challenge.tags.map(tag => tag.toUpperCase());
      switch (category) {
        case "pf":
          return tags.some(tag => tag.includes("PF") || tag.includes("PROGRAMMING FUNDAMENTALS"));
        case "oop":
          return tags.some(tag => tag.includes("OOP") || tag.includes("OBJECT-ORIENTED"));
        case "dsa":
          return tags.some(tag => tag.includes("DSA") || tag.includes("DATA STRUCTURES") || tag.includes("ALGORITHMS"));
        default:
          return false;
      }
    });
    return acc;
  }, {} as Record<string, ApiChallenge[]>);

  // Add a "Other" category for challenges that don't fit PF, OOP, or DSA
  const otherChallenges = challenges.filter((challenge) => {
    const tags = challenge.tags.map(tag => tag.toUpperCase());
    return !tags.some(tag => 
      tag.includes("PF") || tag.includes("PROGRAMMING FUNDAMENTALS") ||
      tag.includes("DSA") || tag.includes("DATA STRUCTURES") || tag.includes("ALGORITHMS") ||
      tag.includes("OOP") || tag.includes("OBJECT-ORIENTED")
    );
  });

  if (otherChallenges.length > 0) {
    groupedQuestions["other"] = otherChallenges;
  }

  const handleProblemClick = (problemId: string) => {
    router.push(`/problems/${problemId}`);
  };

  // Calculate solved count
  const solvedCount = challenges.filter(challenge => 
    challenge.submissions.length > 0 && challenge.submissions[0].result === "PASS"
  ).length;

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
                {error && (
                  <p className="text-red-400 text-sm mt-2">{error}</p>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <Trophy className="h-6 w-6 text-yellow-500" />
                <div className="text-sm">
                  <div className="text-foreground font-semibold">
                    {solvedCount}/{challenges.length} Solved
                  </div>
                  <div className="text-muted-foreground">
                    {challenges.length > 0 ? `${Math.round((solvedCount / challenges.length) * 100)}% Complete` : "No challenges yet"}
                  </div>
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
                  <table className="w-full min-w-[700px] table-fixed">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left py-4 px-4 sm:px-6 font-medium text-muted-foreground uppercase tracking-wider text-xs w-1/3">
                          Title
                        </th>
                        <th className="text-left py-4 px-4 sm:px-6 font-medium text-muted-foreground uppercase tracking-wider text-xs w-24">
                          Difficulty
                        </th>
                        <th className="text-left py-4 px-4 sm:px-6 font-medium text-muted-foreground uppercase tracking-wider text-xs w-24">
                          Status
                        </th>
                        <th className="text-left py-4 px-4 sm:px-6 font-medium text-muted-foreground uppercase tracking-wider text-xs w-48">
                          Tags
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoryQuestions.length > 0 ? (
                        categoryQuestions.map((challenge) => {
                          const status = getStatusDisplay(challenge);
                          return (
                            <tr
                              key={challenge.id}
                              onClick={() => handleProblemClick(challenge.id)}
                              className={cn(
                                "border-b border-border group hover:bg-muted/50 transition-colors duration-200 cursor-pointer"
                              )}
                            >
                              <td className="py-4 px-4 sm:px-6 w-1/3">
                                <span
                                  className={cn(
                                    "font-medium group-hover:text-primary transition-colors duration-200",
                                    status.color
                                  )}
                                >
                                  {challenge.title}
                                </span>
                              </td>
                              <td className="py-4 px-4 sm:px-6 w-24">
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "border-0 font-medium text-xs",
                                    getDifficultyTextColor(challenge.difficulty)
                                  )}
                                >
                                  {challenge.difficulty}
                                </Badge>
                              </td>
                              <td className="py-4 px-4 sm:px-6 w-24">
                                <div className="flex items-center justify-start">
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "text-xs font-semibold",
                                      status.badgeColor
                                    )}
                                  >
                                    {status.status}
                                  </Badge>
                                </div>
                              </td>
                              <td className="py-4 px-4 sm:px-6 w-48">
                                <div className="flex flex-wrap gap-1">
                                  {challenge.tags.slice(0, 3).map((tag: string) => (
                                    <Badge
                                      key={tag}
                                      variant="secondary"
                                      className="text-xs px-2 py-0.5 bg-muted text-muted-foreground hover:bg-muted/80"
                                    >
                                      {tag}
                                    </Badge>
                                  ))}
                                  {challenge.tags.length > 3 && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs px-2 py-0.5 bg-muted text-muted-foreground"
                                    >
                                      +{challenge.tags.length - 3}
                                    </Badge>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-8 px-4 sm:px-6 text-center text-muted-foreground">
                            No problems in this category yet.
                          </td>
                        </tr>
                      )}
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
