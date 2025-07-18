"use client";

import React, { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icons } from "@/components/ui/icons";
import { Footer } from "../components/Footer";

export default function DashboardPage() {
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

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

  const problems = [
    {
      title: "Two Sum",
      difficulty: "Easy",
      acceptance: "49.2%",
      solved: true,
      category: "Array",
      points: 10,
    },
    {
      title: "Add Two Numbers",
      difficulty: "Medium",
      acceptance: "38.1%",
      solved: false,
      category: "Linked List",
      points: 25,
    },
    {
      title: "Longest Substring Without Repeating Characters",
      difficulty: "Medium",
      acceptance: "33.8%",
      solved: true,
      category: "String",
      points: 25,
    },
    {
      title: "Median of Two Sorted Arrays",
      difficulty: "Hard",
      acceptance: "35.2%",
      solved: false,
      category: "Binary Search",
      points: 50,
    },
    {
      title: "Valid Parentheses",
      difficulty: "Easy",
      acceptance: "40.8%",
      solved: true,
      category: "Stack",
      points: 10,
    },
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "text-emerald-400";
      case "Medium":
        return "text-yellow-400";
      case "Hard":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    // Optionally, you can pass the selected difficulty as a query param
    if (selectedDifficulty) {
      router.push(`/problems?difficulty=${selectedDifficulty}`);
    } else {
      router.push("/problems");
    }
  };

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
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
            className="flex flex-col sm:flex-row items-center gap-4 bg-gray-900 rounded-xl p-6 max-w-xl"
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
            <Button
              type="submit"
              className="ml-0 sm:ml-4 mt-2 sm:mt-0 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-2 rounded-md transition"
            >
              Generate
            </Button>
          </form>
        </div>

        {/* Problems List */}
        <div className="bg-gray-900 rounded-xl shadow-xl hover:shadow-emerald-500/5 transition-all duration-300">
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Recent Problems
            </h2>
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
                    Acceptance
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
                {problems.map((problem, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-800 hover:bg-gray-800/50 hover:shadow-lg transition-all duration-200 cursor-pointer group"
                  >
                    <td className="py-5 px-6">
                      {problem.solved ? (
                        <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                          <Icons.check className="w-3 h-3 text-white" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 border-2 border-gray-600 rounded-full group-hover:border-emerald-500 transition-colors duration-200"></div>
                      )}
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
                      {problem.acceptance}
                    </td>
                    <td className="py-5 px-6 text-gray-300 font-medium">
                      {problem.points}
                    </td>
                    <td className="py-5 px-6">
                      <Badge
                        variant="outline"
                        className="border-gray-700 text-gray-300 group-hover:border-emerald-500/50 group-hover:text-emerald-400 transition-all duration-200"
                      >
                        {problem.category}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
