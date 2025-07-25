"use client";

import { Button } from "@/components/ui/button";
import { Footer } from "../../components/Footer";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  CheckCircle,
  XCircle,
  Clock,
  Cpu,
  Trophy,
  RefreshCw,
  Home,
  Eye,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { useState, useEffect } from "react";
import { AuthenticatedNavbar } from "../../components/AuthenticatedNavbar";

type SubmissionStatus = "PASS" | "FAIL" | "PENDING" | "ERROR";

interface ApiSubmission {
  id: string;
  userId: string;
  challengeId: string;
  code: string;
  language: string;
  result: SubmissionStatus;
  score: number | null;
  runtime: number | null;
  memory: number | null;
  createdAt: string;
  user: {
    name: string | null;
    email: string;
  };
  challenge: {
    id: string;
    title: string;
    description: string;
    difficulty: "EASY" | "MEDIUM" | "HARD";
    tags: string[];
  };
}

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
  code: string;
  challengeId: string;
}

export default function SubmissionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const submissionId = params.id as string;

  const [submission, setSubmission] = useState<SubmissionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchSubmission = async () => {
      if (!submissionId) {
        setError("No submission ID provided");
        setLoading(false);
        return;
      }

      // Check if user is authenticated
      if (!session?.user?.id) {
        setError("Authentication required");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log("🔍 Fetching submission with ID:", submissionId);

        const response = await fetch(
          `/api/submissions/${submissionId}?type=submission&userId=${session.user.id}`
        );

        if (!response.ok) {
          if (response.status === 404) {
            setError("Submission not found");
          } else if (response.status === 403) {
            setError("Access denied - This submission doesn't belong to you");
          } else {
            setError("Failed to fetch submission");
          }
          return;
        }

        const data = await response.json();
        console.log("📥 Submission data received:", data);

        // Check if the submission belongs to the current user
        if (data.submission.userId !== session.user.id) {
          setError("Access denied - This submission doesn't belong to you");
          setLoading(false);
          return;
        }

        // Transform API data to match component expectations
        const transformedSubmission = transformApiSubmission(data.submission);
        setSubmission(transformedSubmission);
      } catch (err) {
        console.error("❌ Error fetching submission:", err);
        setError("An error occurred while fetching the submission");
      } finally {
        setLoading(false);
      }
    };

    fetchSubmission();
  }, [submissionId, session?.user?.id]);

  const transformApiSubmission = (
    apiSubmission: ApiSubmission
  ): SubmissionResult => {
    const score = apiSubmission.score || 0;

    // Determine total test cases based on challenge difficulty (simplified)
    const totalTestCases = 4; // Default

    // Calculate test cases passed based on result status and score
    let testCasesPassed = 0;

    if (apiSubmission.result === "PASS") {
      testCasesPassed = totalTestCases; // All passed
    } else if (apiSubmission.result === "FAIL") {
      // Some passed based on score - more realistic calculation
      if (score >= 80) {
        testCasesPassed = totalTestCases - 1; // Failed 1 test case
      } else if (score >= 60) {
        testCasesPassed = Math.ceil(totalTestCases * 0.6); // ~60% passed
      } else if (score >= 40) {
        testCasesPassed = Math.ceil(totalTestCases * 0.4); // ~40% passed
      } else if (score >= 20) {
        testCasesPassed = Math.ceil(totalTestCases * 0.2); // ~20% passed
      } else if (score > 0) {
        testCasesPassed = 1; // At least 1 passed if score > 0
      } else {
        testCasesPassed = 0; // No test cases passed
      }
    } else if (apiSubmission.result === "ERROR") {
      testCasesPassed = 0; // None passed due to error
    } else if (apiSubmission.result === "PENDING") {
      testCasesPassed = 0; // Not evaluated yet
    }

    // Format submission time
    const submissionTime = new Date(apiSubmission.createdAt).toLocaleString();

    return {
      status: apiSubmission.result,
      score,
      runtime: apiSubmission.runtime || 0,
      memory: apiSubmission.memory || 0,
      testCasesPassed,
      totalTestCases,
      difficulty:
        apiSubmission.challenge.difficulty === "EASY"
          ? "Easy"
          : apiSubmission.challenge.difficulty === "MEDIUM"
          ? "Medium"
          : "Hard",
      problemTitle: apiSubmission.challenge.title,
      language: apiSubmission.language,
      submissionTime,
      code: apiSubmission.code,
      challengeId: apiSubmission.challengeId,
    };
  };

  const getStatusConfig = (status: SubmissionStatus) => {
    switch (status) {
      case "PASS":
        return {
          icon: <CheckCircle className="w-16 h-16 text-emerald-400" />,
          title: "🎉 Congratulations!",
          subtitle: "All test cases passed successfully",
          titleColor: "text-emerald-400",
          bgGradient: "from-emerald-400/5 to-emerald-500/5",
          borderColor: "border-emerald-400/20",
        };
      case "FAIL":
        return {
          icon: <XCircle className="w-16 h-16 text-rose-400" />,
          title: "❌ Solution Failed",
          subtitle: "Some test cases didn't pass",
          titleColor: "text-rose-400",
          bgGradient: "from-rose-400/5 to-rose-500/5",
          borderColor: "border-rose-400/20",
        };
      case "PENDING":
        return {
          icon: <Clock className="w-16 h-16 text-yellow-400" />,
          title: "⏳ Processing...",
          subtitle: "Your submission is being evaluated",
          titleColor: "text-yellow-400",
          bgGradient: "from-yellow-400/5 to-yellow-500/5",
          borderColor: "border-yellow-400/20",
        };
      case "ERROR":
        return {
          icon: <XCircle className="w-16 h-16 text-rose-500" />,
          title: "💥 Runtime Error",
          subtitle: "Your code encountered an error",
          titleColor: "text-rose-500",
          bgGradient: "from-rose-500/5 to-rose-600/5",
          borderColor: "border-rose-500/20",
        };
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
      case "Medium":
        return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
      case "Hard":
        return "text-rose-400 bg-rose-400/10 border-rose-400/20";
      default:
        return "text-gray-400 bg-gray-400/10 border-gray-400/20";
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen w-full bg-black bg-gradient-to-b from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-400 mx-auto" />
          <p className="text-white text-xl">Loading submission results...</p>
          <p className="text-gray-400">Please wait while we fetch your data</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !submission) {
    return (
      <div className="min-h-screen w-full bg-black bg-gradient-to-b from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <XCircle className="h-16 w-16 text-rose-400 mx-auto" />
          <h1 className="text-2xl font-bold text-white mb-4">
            {error || "Submission Not Found"}
          </h1>
          <p className="text-gray-300 mb-6">
            {error || "The submission you're looking for doesn't exist."}
          </p>
          <Button
            onClick={() => router.push("/problems")}
            className="bg-emerald-500 hover:bg-emerald-600"
          >
            <Home className="mr-2 h-4 w-4" />
            Back to Problems
          </Button>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(submission.status);

  return (
    <>
      <AuthenticatedNavbar />
      <div className="min-h-screen w-full bg-black bg-gradient-to-b from-black via-gray-900 to-black flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-4xl space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/submissions")}
                className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Submissions
              </Button>
            </div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-lg">
              Submission <span className="text-emerald-400">Results</span>
            </h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Here&apos;s how your solution performed on the challenge
            </p>
          </div>

          {/* Main Result Card */}
          <Card
            className={`border-2 ${statusConfig.borderColor} bg-gradient-to-br ${statusConfig.bgGradient} backdrop-blur-sm shadow-2xl bg-gray-900/50`}
          >
            <CardHeader className="text-center space-y-6 pb-8">
              <div className="flex justify-center">{statusConfig.icon}</div>
              <div className="space-y-2">
                <h2
                  className={`text-3xl font-extrabold ${statusConfig.titleColor} tracking-tight`}
                >
                  {statusConfig.title}
                </h2>
                <p className="text-gray-300 text-lg">{statusConfig.subtitle}</p>
              </div>

              {/* Problem Info */}
              <div className="flex items-center justify-center gap-4 pt-4">
                <Badge
                  variant="outline"
                  className={getDifficultyColor(submission.difficulty)}
                >
                  {submission.difficulty}
                </Badge>
                <Badge
                  variant="outline"
                  className="text-emerald-400 bg-emerald-400/10 border-emerald-400/20"
                >
                  {submission.language}
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
                    <span className="text-sm font-medium text-gray-300">
                      Score
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-white">
                    {submission.score}
                    <span className="text-lg text-gray-400">/100</span>
                  </div>
                </div>

                {/* Runtime */}
                <div className="bg-gray-900/80 rounded-lg p-6 border border-gray-700/50 hover:border-emerald-400/30 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <Clock className="w-5 h-5 text-emerald-400" />
                    <span className="text-sm font-medium text-gray-300">
                      Runtime
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-white">
                    {submission.runtime}
                    <span className="text-lg text-gray-400">ms</span>
                  </div>
                </div>

                {/* Memory */}
                <div className="bg-gray-900/80 rounded-lg p-6 border border-gray-700/50 hover:border-emerald-400/30 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <Cpu className="w-5 h-5 text-emerald-400" />
                    <span className="text-sm font-medium text-gray-300">
                      Memory
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-white">
                    {submission.memory}
                    <span className="text-lg text-gray-400">MB</span>
                  </div>
                </div>

                {/* Test Cases */}
                <div className="bg-gray-900/80 rounded-lg p-6 border border-gray-700/50 hover:border-emerald-400/30 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <span className="text-sm font-medium text-gray-300">
                      Test Cases
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-white">
                    {submission.testCasesPassed}
                    <span className="text-lg text-gray-400">
                      /{submission.totalTestCases}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-8 space-y-3">
                <div className="flex justify-between text-sm text-gray-300">
                  <span>Test Cases Progress</span>
                  <span className="text-emerald-400 font-medium">
                    {Math.round(
                      (submission.testCasesPassed / submission.totalTestCases) *
                        100
                    )}
                    %
                  </span>
                </div>
                <div className="w-full bg-gray-700/50 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-3 rounded-full transition-all duration-500 shadow-sm"
                    style={{
                      width: `${
                        (submission.testCasesPassed /
                          submission.totalTestCases) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* Problem Title */}
              <div className="mt-8 text-center">
                <h3 className="text-2xl font-bold text-white mb-2">
                  {submission.problemTitle}
                </h3>
                <p className="text-gray-400">
                  Submitted {submission.submissionTime}
                </p>
              </div>
            </CardContent>

            <Separator className="bg-gray-700/50" />

            <CardFooter className="p-8">
              <div className="flex flex-col sm:flex-row justify-center gap-4 w-full">
                <Button
                  variant="outline"
                  onClick={() =>
                    router.push(`/problems/${submission.challengeId}`)
                  }
                  className="flex items-center gap-2 bg-gray-900/80 border-gray-700 hover:bg-gray-800/80 hover:border-emerald-400/50 text-gray-300 hover:text-white transition-all"
                >
                  <Eye className="w-4 h-4" />
                  View Problem
                </Button>

                <Button
                  variant="outline"
                  onClick={() => router.push("/problems")}
                  className="flex items-center gap-2 bg-emerald-500/10 border-emerald-400/30 hover:bg-emerald-500/20 hover:border-emerald-400/50 text-emerald-400 hover:text-emerald-300 transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Another
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

          {/* Code Display */}
          <Card className="bg-gray-900/80 border-gray-700/50 backdrop-blur-sm">
            <CardHeader>
              <h3 className="text-xl font-bold text-white">
                Your <span className="text-emerald-400">Solution</span>
              </h3>
            </CardHeader>
            <CardContent className="p-0">
              <pre className="bg-gray-950/50 p-6 rounded-lg overflow-x-auto text-sm text-gray-300 border border-gray-700/50">
                <code className="language-javascript">{submission.code}</code>
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </>
  );
} 