"use client";

import React, { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icons } from "@/components/ui/icons";
import { Footer } from "../components/Footer";
import { ArrowRight, CheckCircle2, XCircle, AlertTriangle, Clock, Circle } from "lucide-react";

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

export default function DashboardPage() {
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [numberOfProblems, setNumberOfProblems] = useState("1");
  const [generatedChallenges, setGeneratedChallenges] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [userProblems, setUserProblems] = useState<ApiChallenge[]>([]);
  const [isLoadingProblems, setIsLoadingProblems] = useState(false);
  const [hasFetchedProblems, setHasFetchedProblems] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch user's problems when session is available (only once per session)
  useEffect(() => {
    if (session?.user?.id && !hasFetchedProblems && !isLoadingProblems) {
      fetchUserProblems();
    }
  }, [session?.user?.id, hasFetchedProblems, isLoadingProblems]);

  // Reset fetch state when user changes
  useEffect(() => {
    if (session?.user?.id) {
      setHasFetchedProblems(false);
      setUserProblems([]);
    }
  }, [session?.user?.id]);

  const fetchUserProblems = async () => {
    if (!session?.user?.id || hasFetchedProblems || isLoadingProblems) return;
    
    try {
      setIsLoadingProblems(true);
      setHasFetchedProblems(true);
      
      const response = await fetch(`/api/challenges?userId=${session.user.id}`);
      const data = await response.json();

      if (response.ok) {
        // Take only the latest 5 problems
        setUserProblems((data.challenges || []).slice(0, 5));
      } else {
        console.error("Failed to fetch user problems:", data.error);
      }
    } catch (error) {
      console.error("Error fetching user problems:", error);
    } finally {
      setIsLoadingProblems(false);
    }
  };

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

  const user = {
    name: session.user?.name || session.user?.email || "User",
    username: session.user?.email || "user",
    avatar: session.user?.name ? session.user.name.substring(0, 2).toUpperCase() : "U",
    points: 2450,
    rank: "Gold",
    solved: 145,
    streak: 7,
  };

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
        badgeColor: "bg-gray-500 text-white"
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
          icon: <Circle className="h-5 w-5 text-gray-400" />,
          color: "text-gray-400",
          bgColor: "bg-gray-400/10",
          badgeColor: "bg-gray-500 text-white"
        };
    }
  };

  const getCategory = (challenge: ApiChallenge) => {
    const tags = challenge.tags.map(tag => tag.toUpperCase());
    
    if (tags.some(tag => tag.includes("PF") || tag.includes("PROGRAMMING FUNDAMENTALS"))) {
      return "PF";
    } else if (tags.some(tag => tag.includes("OOP") || tag.includes("OBJECT-ORIENTED"))) {
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
    setIsGenerating(true);

    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: session.user?.id,
          numberOfChallenges: parseInt(numberOfProblems, 10),
          difficultyLevel: selectedDifficulty || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setGeneratedChallenges(data.generatedChallenges || []);
        console.log(data.generatedChallenges);
        router.push("/problems");
      } else {
        console.error("Failed to generate challenges:", data.error);
      }
    } catch (error) {
      console.error("Error generating challenges:", error);
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
                <h1 className="text-white font-semibold text-lg">AI Code Lab</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-emerald-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">{user.avatar}</span>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-gray-900 rounded-xl p-6 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 cursor-pointer group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">
                  Problems Solved
                </p>
                <p className="text-3xl font-bold text-white mt-2 group-hover:text-emerald-400 transition-colors duration-200">
                  {user.solved}
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
                  Current Streak
                </p>
                <p className="text-3xl font-bold text-white mt-2 group-hover:text-emerald-400 transition-colors duration-200">
                  {user.streak}
                </p>
              </div>
              <div className="text-orange-400 text-3xl group-hover:scale-110 transition-transform duration-200">
                🔥
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
                  {user.points}
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
                  {user.rank}
                </p>
              </div>
              <div className="text-yellow-400 text-3xl group-hover:scale-110 transition-transform duration-200">
                🏆
              </div>
            </div>
          </div>
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
            <label className="text-gray-300 font-medium mr-2" htmlFor="difficulty">
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
            <label className="text-gray-300 font-medium mr-2" htmlFor="numberOfProblems">
              Number of Problems:
            </label>
            <select
              id="numberOfProblems"
              value={numberOfProblems}
              onChange={(e) => setNumberOfProblems(e.target.value)}
              className="bg-gray-800 text-white rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
            >
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
            </select>
            <Button
              type="submit"
              disabled={isGenerating}
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

        {/* Problems List */}
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
                {isLoadingProblems ? (
                  <tr>
                    <td colSpan={5} className="py-8 px-6 text-center text-gray-400">
                      Loading problems...
                    </td>
                  </tr>
                ) : userProblems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 px-6 text-center text-gray-400">
                      No problems created yet. Generate your first problem above!
                    </td>
                  </tr>
                ) : (
                  userProblems.map((problem) => {
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
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
