"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icons } from "@/components/ui/icons";
import { Footer } from "../components/Footer";
import {
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Circle,
} from "lucide-react";
import { toast } from "sonner";

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

// Skeleton Components
const StatsCardSkeleton = () => (
  <div className="bg-gray-900 rounded-xl p-6 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="h-4 bg-gray-800 rounded w-24 mb-2"></div>
        <div className="h-8 bg-gray-800 rounded w-16"></div>
      </div>
      <div className="h-8 w-8 bg-gray-800 rounded"></div>
    </div>
  </div>
);

const TodayChallengeSkeleton = () => (
  <div className="bg-gray-900 rounded-xl shadow-xl animate-pulse">
    <div className="p-6 border-b border-gray-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-gray-800 rounded-lg"></div>
          <div>
            <div className="h-6 bg-gray-800 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-800 rounded w-24"></div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="h-6 bg-gray-800 rounded w-8 mb-1"></div>
            <div className="h-3 bg-gray-800 rounded w-16"></div>
          </div>
          <div className="h-6 bg-gray-800 rounded w-16"></div>
          <div className="h-9 bg-gray-800 rounded w-20"></div>
        </div>
      </div>
    </div>
    <div className="p-6">
      <div className="h-4 bg-gray-800 rounded w-full mb-2"></div>
      <div className="h-4 bg-gray-800 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-800 rounded w-1/2 mb-4"></div>
      <div className="flex gap-2">
        <div className="h-6 bg-gray-800 rounded w-16"></div>
        <div className="h-6 bg-gray-800 rounded w-20"></div>
        <div className="h-6 bg-gray-800 rounded w-14"></div>
      </div>
    </div>
  </div>
);

const ProblemsTableSkeleton = () => (
  <div className="bg-gray-900 rounded-xl shadow-xl animate-pulse">
    <div className="p-6 border-b border-gray-800 flex items-center justify-between">
      <div className="h-8 bg-gray-800 rounded w-32"></div>
      <div className="h-9 bg-gray-800 rounded w-20"></div>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-800">
            <th className="text-left py-4 px-6">
              <div className="h-4 bg-gray-800 rounded w-16"></div>
            </th>
            <th className="text-left py-4 px-6">
              <div className="h-4 bg-gray-800 rounded w-20"></div>
            </th>
            <th className="text-left py-4 px-6">
              <div className="h-4 bg-gray-800 rounded w-24"></div>
            </th>
            <th className="text-left py-4 px-6">
              <div className="h-4 bg-gray-800 rounded w-16"></div>
            </th>
            <th className="text-left py-4 px-6">
              <div className="h-4 bg-gray-800 rounded w-20"></div>
            </th>
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3].map((i) => (
            <tr key={i} className="border-b border-gray-800">
              <td className="py-5 px-6">
                <div className="flex items-center">
                  <div className="h-4 w-4 bg-gray-800 rounded mr-2"></div>
                  <div className="h-4 bg-gray-800 rounded w-16"></div>
                </div>
              </td>
              <td className="py-5 px-6">
                <div className="h-4 bg-gray-800 rounded w-32"></div>
              </td>
              <td className="py-5 px-6">
                <div className="h-4 bg-gray-800 rounded w-16"></div>
              </td>
              <td className="py-5 px-6">
                <div className="h-4 bg-gray-800 rounded w-8"></div>
              </td>
              <td className="py-5 px-6">
                <div className="h-6 bg-gray-800 rounded w-12"></div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default function DashboardPage() {
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [userProblems, setUserProblems] = useState<ApiChallenge[]>([]);
  const [isLoadingProblems, setIsLoadingProblems] = useState(false);
  const [hasFetchedProblems, setHasFetchedProblems] = useState(false);
  const [userStats, setUserStats] = useState({
    problemsSolved: 0,
    totalPoints: 0,
    rank: "Bronze",
  });
  const [todayChallenge, setTodayChallenge] = useState<ApiChallenge | null>(
    null
  );
  const [isLoadingTodayChallenge, setIsLoadingTodayChallenge] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();

  // Create user object from session
  const user = {
    name: session?.user?.name || "User",
    avatar: session?.user?.name?.charAt(0)?.toUpperCase() || "U",
    email: session?.user?.email || "",
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Reset fetch state when user changes
  useEffect(() => {
    if (session?.user?.id) {
      setHasFetchedProblems(false);
      setUserProblems([]);
      setTodayChallenge(null);
    }
  }, [session?.user?.id]);

  const fetchUserProblems = useCallback(async () => {
    if (!session?.user?.id || hasFetchedProblems || isLoadingProblems) return;

    try {
      setIsLoadingProblems(true);
      setHasFetchedProblems(true);

      const response = await fetch(`/api/challenges?userId=${session.user.id}`);
      const data = await response.json();

      if (response.ok) {
        // Take only the latest 5 problems
        setUserProblems((data.challenges || []).slice(0, 5));

        // Calculate user stats from created problems
        calculateUserStats(data.challenges || []);

        // Also fetch all user submissions for complete stats
        fetchUserSubmissions();
      } else {
        console.error("Failed to fetch user problems:", data.error);
      }
    } catch (error) {
      console.error("Error fetching user problems:", error);
    } finally {
      setIsLoadingProblems(false);
    }
  }, [session?.user?.id, hasFetchedProblems, isLoadingProblems]);

  const fetchUserSubmissions = async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch(
        `/api/submissions?userId=${session.user.id}`
      );
      const data = await response.json();

      if (response.ok) {
        console.log("All user submissions:", data.submissions);
        calculateCompleteUserStats(data.submissions || []);
      } else {
        console.error("Failed to fetch user submissions:", data.error);
      }
    } catch (error) {
      console.error("Error fetching user submissions:", error);
    }
  };

  const calculateCompleteUserStats = (
    submissions: Array<{
      score: number | null;
      result: string;
      challengeId: string;
    }>
  ) => {
    let problemsSolved = 0;
    let totalPoints = 0;
    const solvedProblemIds = new Set();

    console.log(
      "Calculating complete stats from submissions:",
      submissions.length
    );

    submissions.forEach((submission) => {
      console.log("Processing submission:", submission);

      // Sum up ALL submissions and their scores
      if (submission.score !== null && submission.score !== undefined) {
        totalPoints += submission.score;
        console.log(
          "Added points from submission:",
          submission.score,
          "total now:",
          totalPoints
        );
      }

      // Count problems solved (only PASS submissions count as solved)
      if (submission.result === "PASS") {
        if (!solvedProblemIds.has(submission.challengeId)) {
          solvedProblemIds.add(submission.challengeId);
          problemsSolved++;
        }
      }
    });

    console.log(
      "Complete stats - problemsSolved:",
      problemsSolved,
      "totalPoints:",
      totalPoints
    );

    // Determine rank based on total points
    let rank = "Bronze";
    if (totalPoints >= 5000) {
      rank = "Legend";
    } else if (totalPoints >= 3000) {
      rank = "Premium";
    } else if (totalPoints >= 2000) {
      rank = "Gold";
    } else if (totalPoints >= 1000) {
      rank = "Silver";
    }

    setUserStats({
      problemsSolved,
      totalPoints,
      rank,
    });
  };

  const calculateUserStats = (challenges: ApiChallenge[]) => {
    let problemsSolved = 0;
    let totalPoints = 0;

    console.log("Calculating stats for challenges:", challenges.length);
    console.log("Challenges data:", challenges);

    challenges.forEach((challenge) => {
      console.log("Processing challenge:", challenge.title);
      console.log("Submissions:", challenge.submissions);

      if (challenge.submissions.length > 0) {
        const latestSubmission = challenge.submissions[0];
        console.log("Latest submission:", latestSubmission);

        if (latestSubmission.result === "PASS") {
          problemsSolved++;
          console.log("Problem solved, score:", latestSubmission.score);
          if (latestSubmission.score !== null) {
            totalPoints += latestSubmission.score;
            console.log("Added points, total now:", totalPoints);
          }
        }
      }
    });

    console.log(
      "Final stats - problemsSolved:",
      problemsSolved,
      "totalPoints:",
      totalPoints
    );

    // Determine rank based on total points
    let rank = "Bronze";
    if (totalPoints >= 5000) {
      rank = "Legend";
    } else if (totalPoints >= 3000) {
      rank = "Premium";
    } else if (totalPoints >= 2000) {
      rank = "Gold";
    } else if (totalPoints >= 1000) {
      rank = "Silver";
    }

    setUserStats({
      problemsSolved,
      totalPoints,
      rank,
    });
  };

  const fetchTodayChallenge = useCallback(async () => {
    if (!session?.user?.id || isLoadingTodayChallenge) return;

    try {
      setIsLoadingTodayChallenge(true);

      const response = await fetch("/api/daily-challanges");
      const data = await response.json();

      if (response.ok && data.dailyChallenge) {
        setTodayChallenge(data.dailyChallenge);
      } else {
        console.error("Failed to fetch today's challenge:", data.error);
      }
    } catch (error) {
      console.error("Error fetching today's challenge:", error);
    } finally {
      setIsLoadingTodayChallenge(false);
    }
  }, [session?.user?.id, isLoadingTodayChallenge]);

  // Fetch user's problems when session is available (only once per session)
  useEffect(() => {
    if (session?.user?.id && !hasFetchedProblems && !isLoadingProblems) {
      fetchUserProblems();
      fetchTodayChallenge();
    }
  }, [
    session?.user?.id,
    hasFetchedProblems,
    isLoadingProblems,
    fetchUserProblems,
    fetchTodayChallenge,
  ]);

  // Show loading while checking authentication
  if (status === "loading") {
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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "EASY":
        return "text-emerald-400";
      case "MEDIUM":
        return "text-yellow-400";
      case "HARD":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  const getStatusDisplay = (challenge: ApiChallenge) => {
    if (challenge.submissions.length === 0) {
      return {
        status: "Not Solved",
        icon: <Circle className="h-5 w-5 text-gray-400" />,
        color: "text-gray-400",
        bgColor: "bg-gray-400/10",
        badgeColor: "bg-gray-500 text-white",
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
          badgeColor: "bg-green-500 text-white",
        };
      case "FAIL":
        return {
          status: "Failed",
          icon: <XCircle className="h-5 w-5 text-rose-500" />,
          color: "text-rose-500",
          bgColor: "bg-rose-500/10",
          badgeColor: "bg-red-500 text-white",
        };
      case "ERROR":
        return {
          status: "Error",
          icon: <AlertTriangle className="h-5 w-5 text-orange-500" />,
          color: "text-orange-500",
          bgColor: "bg-orange-500/10",
          badgeColor: "bg-red-500 text-white",
        };
      case "PENDING":
        return {
          status: "Pending",
          icon: <Clock className="h-5 w-5 text-yellow-500" />,
          color: "text-yellow-500",
          bgColor: "bg-yellow-500/10",
          badgeColor: "bg-yellow-500 text-white",
        };
      default:
        return {
          status: "Unknown",
          icon: <Circle className="h-5 w-5 text-gray-400" />,
          color: "text-gray-400",
          bgColor: "bg-gray-400/10",
          badgeColor: "bg-gray-500 text-white",
        };
    }
  };

  const getCategory = (challenge: ApiChallenge) => {
    const tags = challenge.tags.map((tag) => tag.toUpperCase());

    if (
      tags.some(
        (tag) => tag.includes("PF") || tag.includes("PROGRAMMING FUNDAMENTALS")
      )
    ) {
      return "PF";
    } else if (
      tags.some((tag) => tag.includes("OOP") || tag.includes("OBJECT-ORIENTED"))
    ) {
      return "OOP";
    } else {
      return "DSA";
    }
  };

  const getPoints = (challenge: ApiChallenge) => {
    if (challenge.submissions.length === 0) {
      return 0;
    }

    const latestSubmission = challenge.submissions[0];
    if (latestSubmission.result === "PASS" && latestSubmission.score !== null) {
      return latestSubmission.score;
    }

    return 0;
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation: Check if difficulty is selected
    if (!selectedDifficulty) {
      toast.error("Please select a difficulty level (Easy, Medium, or Hard)");
      return;
    }

    // Validation: Check if at least one category is selected
    if (selectedCategories.length === 0) {
      toast.error("Please select at least one category (PF, OOP, or DSA)");
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: session.user?.id,
          difficultyLevel: selectedDifficulty,
          categories: selectedCategories,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Generated challenges:", data.generatedChallenges);
        console.log("Saved challenges:", data.savedChallenges);
        toast.success(`Successfully generated ${data.totalSaved} problem(s)!`);
        router.push("/problems");
      } else {
        console.error("Failed to generate challenges:", data.error);
        toast.error(
          data.error || "Failed to generate problem. Please try again."
        );
      }
    } catch (error) {
      console.error("Error generating challenges:", error);
      toast.error("An error occurred while generating the problem.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
  };

  const handleSeeAllProblems = () => {
    router.push("/problems");
  };

  return (
    <div className="min-h-screen w-full bg-black bg-gradient-to-b from-black via-gray-900 to-black">
      {/* Navbar */}
      <nav className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                  <Icons.zap className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-white font-semibold text-lg">
                  AI Code Lab
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-emerald-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user.avatar}
                  </span>
                </div>
                <div className="hidden md:block">
                  <p className="text-white text-sm font-medium">{user.name}</p>
                  <p className="text-gray-400 text-xs">{session.user?.email}</p>
                </div>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">
                Welcome back, {user.name}!
              </h1>
              <p className="text-gray-300 text-lg">
                Build your programming foundation with practice problems and
                challenges
              </p>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {isLoadingProblems ? (
            <>
              <StatsCardSkeleton />
              <StatsCardSkeleton />
              <StatsCardSkeleton />
            </>
          ) : (
            <>
              <div className="bg-gray-900 rounded-xl p-6 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 cursor-pointer group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">
                      Problems Solved
                    </p>
                    <p className="text-3xl font-bold text-white mt-2 group-hover:text-emerald-400 transition-colors duration-200">
                      {userStats.problemsSolved}
                    </p>
                  </div>
                  <div className="text-emerald-400 text-3xl group-hover:scale-110 transition-transform duration-200">
                    ✅
                  </div>
                </div>
              </div>
              <div className="bg-gray-900 rounded-xl p-6 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 cursor-pointer group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">
                      Points
                    </p>
                    <p className="text-3xl font-bold text-white mt-2 group-hover:text-emerald-400 transition-colors duration-200">
                      {userStats.totalPoints}
                    </p>
                  </div>
                  <div className="text-emerald-400 text-3xl group-hover:scale-110 transition-transform duration-200">
                    ⭐
                  </div>
                </div>
              </div>
              <div className="bg-gray-900 rounded-xl p-6 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 cursor-pointer group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">
                      Rank
                    </p>
                    <p className="text-3xl font-bold text-white mt-2 group-hover:text-emerald-400 transition-colors duration-200">
                      {userStats.rank}
                    </p>
                  </div>
                  <div className="text-yellow-400 text-3xl group-hover:scale-110 transition-transform duration-200">
                    🏆
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Difficulty Selection */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-6 tracking-tight">
            Practice by Difficulty
          </h2>
          <form
            onSubmit={handleGenerate}
            className="flex flex-col sm:flex-row items-center gap-4 bg-gray-900 rounded-xl p-6 max-w-3xl"
          >
            <label
              className="text-gray-300 font-medium mr-2"
              htmlFor="difficulty"
            >
              Select Difficulty:
            </label>
            <select
              id="difficulty"
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="bg-gray-800 text-white rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
            >
              <option value="">Any</option>
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
            <label className="text-gray-300 font-medium mr-2">
              Select Category:
            </label>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={() => {
                  setSelectedCategories((prev) =>
                    prev.includes("PF")
                      ? prev.filter((cat) => cat !== "PF")
                      : [...prev, "PF"]
                  );
                }}
                className={`px-4 py-2 rounded-md border border-gray-600 transition-colors ${
                  selectedCategories.includes("PF")
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                PF
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setSelectedCategories((prev) =>
                    prev.includes("OOP")
                      ? prev.filter((cat) => cat !== "OOP")
                      : [...prev, "OOP"]
                  );
                }}
                className={`px-4 py-2 rounded-md border border-gray-600 transition-colors ${
                  selectedCategories.includes("OOP")
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                OOP
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setSelectedCategories((prev) =>
                    prev.includes("DSA")
                      ? prev.filter((cat) => cat !== "DSA")
                      : [...prev, "DSA"]
                  );
                }}
                className={`px-4 py-2 rounded-md border border-gray-600 transition-colors ${
                  selectedCategories.includes("DSA")
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                DSA
              </Button>
            </div>
            <Button
              type="submit"
              disabled={
                isGenerating ||
                !selectedDifficulty ||
                selectedCategories.length === 0
              }
              className="ml-0 sm:ml-4 mt-2 sm:mt-0 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-2 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate"
              )}
            </Button>
          </form>
        </div>

        {/* Today&apos;s Challenge */}
        {isLoadingTodayChallenge ? (
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-6 tracking-tight">
              Today&apos;s Challenge
            </h2>
            <TodayChallengeSkeleton />
          </div>
        ) : todayChallenge ? (
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-6 tracking-tight">
              Today&apos;s Challenge
            </h2>
            <div className="bg-gray-900 rounded-xl shadow-xl hover:shadow-emerald-500/5 transition-all duration-300">
              <div className="p-6 border-b border-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-lg font-bold">🎯</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {todayChallenge.title}
                      </h3>
                      <p className="text-gray-400 text-sm">Daily Challenge</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">
                        {todayChallenge._count?.submissions || 0}
                      </div>
                      <div className="text-gray-400 text-sm">Submissions</div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`border font-medium ${getDifficultyColor(
                        todayChallenge.difficulty
                      )}`}
                    >
                      {todayChallenge.difficulty}
                    </Badge>
                    <Button
                      onClick={() =>
                        router.push(`/problems/${todayChallenge.id}`)
                      }
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      Solve Now
                    </Button>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <p className="text-gray-300 line-clamp-3">
                  {todayChallenge.description.length > 200
                    ? todayChallenge.description.substring(0, 200) + "..."
                    : todayChallenge.description}
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {todayChallenge.tags.slice(0, 3).map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="border-gray-700 text-gray-300 text-xs"
                    >
                      {tag}
                    </Badge>
                  ))}
                  {todayChallenge.tags.length > 3 && (
                    <Badge
                      variant="outline"
                      className="border-gray-700 text-gray-300 text-xs"
                    >
                      +{todayChallenge.tags.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Problems List */}
        {isLoadingProblems ? (
          <div className="mb-10">
            <div className="bg-gray-900 rounded-xl shadow-xl">
              <div className="p-6 border-b border-gray-800 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  Recent Problems
                </h2>
              </div>
            </div>
            <ProblemsTableSkeleton />
          </div>
        ) : (
          <div className="bg-gray-900 rounded-xl shadow-xl hover:shadow-emerald-500/5 transition-all duration-300">
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Recent Problems
              </h2>
              <Button
                onClick={handleSeeAllProblems}
                variant="outline"
                className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white flex items-center gap-2"
              >
                See All
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="overflow-x-auto">
              {userProblems.length === 0 ? (
                <div className="py-12 px-6 text-center">
                  <div className="text-gray-400 text-lg mb-2">
                    No problems created yet
                  </div>
                  <p className="text-gray-500 text-sm mb-4">
                    Generate your first problem using the form above to get
                    started!
                  </p>
                  <Button
                    onClick={() =>
                      document.getElementById("difficulty")?.focus()
                    }
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Generate Problem
                  </Button>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-400 text-sm">
                      <th className="text-left py-4 px-6 font-semibold uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-left py-4 px-6 font-semibold uppercase tracking-wider">
                        Problem
                      </th>
                      <th className="text-left py-4 px-6 font-semibold uppercase tracking-wider">
                        Difficulty
                      </th>
                      <th className="text-left py-4 px-6 font-semibold uppercase tracking-wider">
                        Points
                      </th>
                      <th className="text-left py-4 px-6 font-semibold uppercase tracking-wider">
                        Category
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {userProblems.map((problem) => {
                      const status = getStatusDisplay(problem);
                      const category = getCategory(problem);
                      const points = getPoints(problem);

                      return (
                        <tr
                          key={problem.id}
                          className="border-b border-gray-800 hover:bg-gray-800/50 hover:shadow-lg transition-all duration-200 cursor-pointer group"
                          onClick={() => router.push(`/problems/${problem.id}`)}
                        >
                          <td className="py-5 px-6">
                            <div className="flex items-center">
                              {status.icon}
                              <span className="ml-2 text-sm font-medium text-gray-300">
                                {status.status}
                              </span>
                            </div>
                          </td>
                          <td className="py-5 px-6">
                            <span className="text-white font-semibold hover:text-emerald-400 transition-colors duration-200">
                              {problem.title}
                            </span>
                          </td>
                          <td className="py-5 px-6">
                            <span
                              className={`font-semibold ${getDifficultyColor(
                                problem.difficulty
                              )}`}
                            >
                              {problem.difficulty}
                            </span>
                          </td>
                          <td className="py-5 px-6 text-gray-300 font-medium">
                            {points}
                          </td>
                          <td className="py-5 px-6">
                            <Badge
                              variant="outline"
                              className="border-gray-700 text-gray-300 group-hover:border-emerald-500/50 group-hover:text-emerald-400 transition-all duration-200"
                            >
                              {category}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
