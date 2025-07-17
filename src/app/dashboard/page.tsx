"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icons } from "@/components/ui/icons";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const router = useRouter();

  const user = {
    name: "Saad Bin Ather",
    username: "saad_ather",
    avatar: "SA",
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

  return (
    <div className="min-h-screen bg-black">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">
                Learn Programming Skills
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
    </div>
  );
}
