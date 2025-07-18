"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Cpu,
  Trophy,
  RefreshCw,
  Home,
  Eye,
} from "lucide-react";
import { useState } from "react";

type SubmissionStatus = "pass" | "fail" | "incomplete" | "error";

interface SubmissionResult {
  status: SubmissionStatus;
  score: number;
  runtime: number;
  memory: number;
  testCasesPassed: number;
  totalTestCases: number;
  difficulty: "Easy" | "Medium" | "Hard";
  problemTitle: string;
  language: string;
  submissionTime: string;
}

export default function SubmissionPage() {
  const router = useRouter();

  // Dummy data - in real app this would come from API/props
  const dummyResults: SubmissionResult[] = [
    {
      status: "pass",
      score: 100,
      runtime: 45,
      memory: 12.5,
      testCasesPassed: 15,
      totalTestCases: 15,
      difficulty: "Medium",
      problemTitle: "Two Sum",
      language: "JavaScript",
      submissionTime: "2 minutes ago"
    },
    {
      status: "fail",
      score: 67,
      runtime: 120,
      memory: 18.3,
      testCasesPassed: 10,
      totalTestCases: 15,
      difficulty: "Hard",
      problemTitle: "Median of Two Sorted Arrays",
      language: "Python",
      submissionTime: "5 minutes ago"
    },
    {
      status: "incomplete",
      score: 33,
      runtime: 200,
      memory: 25.1,
      testCasesPassed: 5,
      totalTestCases: 15,
      difficulty: "Easy",
      problemTitle: "Valid Parentheses",
      language: "Java",
      submissionTime: "10 minutes ago"
    },
    {
      status: "error",
      score: 0,
      runtime: 0,
      memory: 0,
      testCasesPassed: 0,
      totalTestCases: 12,
      difficulty: "Medium",
      problemTitle: "Longest Palindromic Substring",
      language: "C++",
      submissionTime: "15 minutes ago"
    }
  ];

  const [currentResult] = useState<SubmissionResult>(dummyResults[0]);

  const getStatusConfig = (status: SubmissionStatus) => {
    switch (status) {
      case "pass":
        return {
          icon: <CheckCircle className="w-16 h-16 text-emerald-400" />,
          title: "🎉 Congratulations!",
          subtitle: "All test cases passed successfully",
          titleColor: "text-emerald-400",
          bgGradient: "from-emerald-400/5 to-emerald-500/5",
          borderColor: "border-emerald-400/20"
        };
      case "fail":
        return {
          icon: <XCircle className="w-16 h-16 text-rose-400" />,
          title: "❌ Solution Failed",
          subtitle: "Some test cases didn't pass",
          titleColor: "text-rose-400",
          bgGradient: "from-rose-400/5 to-rose-500/5",
          borderColor: "border-rose-400/20"
        };
      case "incomplete":
        return {
          icon: <AlertTriangle className="w-16 h-16 text-yellow-400" />,
          title: "⚠️ Partial Success",
          subtitle: "You're on the right track!",
          titleColor: "text-yellow-400",
          bgGradient: "from-yellow-400/5 to-yellow-500/5",
          borderColor: "border-yellow-400/20"
        };
      case "error":
        return {
          icon: <XCircle className="w-16 h-16 text-rose-500" />,
          title: "💥 Runtime Error",
          subtitle: "Your code encountered an error",
          titleColor: "text-rose-500",
          bgGradient: "from-rose-500/5 to-rose-600/5",
          borderColor: "border-rose-500/20"
        };
    }
  };

  const statusConfig = getStatusConfig(currentResult.status);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy": return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
      case "Medium": return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
      case "Hard": return "text-rose-400 bg-rose-400/10 border-rose-400/20";
      default: return "text-gray-400 bg-gray-400/10 border-gray-400/20";
    }
  };

  return (
    <div className="min-h-screen w-full bg-black bg-gradient-to-b from-black via-gray-900 to-black flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-lg">
            Submission <span className="text-emerald-400">Results</span>
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Here's how your solution performed on the challenge
          </p>
        </div>

        {/* Main Result Card */}
        <Card className={`border-2 ${statusConfig.borderColor} bg-gradient-to-br ${statusConfig.bgGradient} backdrop-blur-sm shadow-2xl bg-gray-900/50`}>
          <CardHeader className="text-center space-y-6 pb-8">
            <div className="flex justify-center">
              {statusConfig.icon}
            </div>
            <div className="space-y-2">
              <h2 className={`text-3xl font-extrabold ${statusConfig.titleColor} tracking-tight`}>
                {statusConfig.title}
              </h2>
              <p className="text-gray-300 text-lg">
                {statusConfig.subtitle}
              </p>
            </div>
            
            {/* Problem Info */}
            <div className="flex items-center justify-center gap-4 pt-4">
              <Badge variant="outline" className={getDifficultyColor(currentResult.difficulty)}>
                {currentResult.difficulty}
              </Badge>
              <Badge variant="outline" className="text-emerald-400 bg-emerald-400/10 border-emerald-400/20">
                {currentResult.language}
              </Badge>
            </div>
          </CardHeader>

          <Separator className="bg-gray-700/50" />

          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Score */}
              <div className="bg-gray-900/80 rounded-lg p-6 border border-gray-700/50 hover:border-emerald-400/30 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <Trophy className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-medium text-gray-300">Score</span>
                </div>
                <div className="text-3xl font-bold text-white">
                  {currentResult.score}
                  <span className="text-lg text-gray-400">/100</span>
                </div>
              </div>

              {/* Runtime */}
              <div className="bg-gray-900/80 rounded-lg p-6 border border-gray-700/50 hover:border-emerald-400/30 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <Clock className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-medium text-gray-300">Runtime</span>
                </div>
                <div className="text-3xl font-bold text-white">
                  {currentResult.runtime}
                  <span className="text-lg text-gray-400">ms</span>
                </div>
              </div>

              {/* Memory */}
              <div className="bg-gray-900/80 rounded-lg p-6 border border-gray-700/50 hover:border-emerald-400/30 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <Cpu className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-medium text-gray-300">Memory</span>
                </div>
                <div className="text-3xl font-bold text-white">
                  {currentResult.memory}
                  <span className="text-lg text-gray-400">MB</span>
                </div>
              </div>

              {/* Test Cases */}
              <div className="bg-gray-900/80 rounded-lg p-6 border border-gray-700/50 hover:border-emerald-400/30 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-medium text-gray-300">Test Cases</span>
                </div>
                <div className="text-3xl font-bold text-white">
                  {currentResult.testCasesPassed}
                  <span className="text-lg text-gray-400">/{currentResult.totalTestCases}</span>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-8 space-y-3">
              <div className="flex justify-between text-sm text-gray-300">
                <span>Test Cases Progress</span>
                <span className="text-emerald-400 font-medium">{Math.round((currentResult.testCasesPassed / currentResult.totalTestCases) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-700/50 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-3 rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${(currentResult.testCasesPassed / currentResult.totalTestCases) * 100}%` }}
                />
              </div>
            </div>

            {/* Problem Title */}
            <div className="mt-8 text-center">
              <h3 className="text-2xl font-bold text-white mb-2">
                {currentResult.problemTitle}
              </h3>
              <p className="text-gray-400">
                Submitted {currentResult.submissionTime}
              </p>
            </div>
          </CardContent>

          <Separator className="bg-gray-700/50" />

          <CardFooter className="p-8">
            <div className="flex flex-col sm:flex-row justify-center gap-4 w-full">
              <Button
                variant="outline"
                onClick={() => router.push("/submission/latest")}
                className="flex items-center gap-2 bg-gray-900/80 border-gray-700 hover:bg-gray-800/80 hover:border-emerald-400/50 text-gray-300 hover:text-white transition-all"
              >
                <Eye className="w-4 h-4" />
                View Details
              </Button>
              
              <Button
                variant="outline"
                onClick={() => router.push("/daily")}
                className="flex items-center gap-2 bg-emerald-500/10 border-emerald-400/30 hover:bg-emerald-500/20 hover:border-emerald-400/50 text-emerald-400 hover:text-emerald-300 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
              
              <Button
                onClick={() => router.push("/problems")}
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-black font-semibold shadow-lg transition-all"
              >
                <Home className="w-4 h-4" />
                Back to Challenges
              </Button>
            </div>
          </CardFooter>
        </Card>

        {/* Additional Stats */}
        <Card className="bg-gray-900/80 border-gray-700/50 backdrop-blur-sm">
          <CardContent className="p-8">
            <h3 className="text-xl font-bold text-white mb-6 text-center">
              Your <span className="text-emerald-400">Performance</span> Overview
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
                <div className="text-3xl font-bold text-emerald-400 mb-2">92%</div>
                <div className="text-gray-300 text-sm">Success Rate</div>
              </div>
              <div className="text-center p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
                <div className="text-3xl font-bold text-emerald-400 mb-2">15</div>
                <div className="text-gray-300 text-sm">Total Submissions</div>
              </div>
              <div className="text-center p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
                <div className="text-3xl font-bold text-emerald-400 mb-2">8</div>
                <div className="text-gray-300 text-sm">Problems Solved</div>
              </div>
              <div className="text-center p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
                <div className="text-3xl font-bold text-emerald-400 mb-2">1,250</div>
                <div className="text-gray-300 text-sm">Points Earned</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
