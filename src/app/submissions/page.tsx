"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AuthenticatedNavbar } from "../components/AuthenticatedNavbar";
import { Footer } from "../components/Footer";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Eye,
  ArrowLeft,
  Loader2,
  Trophy,
  Calendar,
  Code,
  Search,
} from "lucide-react";

type SubmissionStatus = "PASS" | "FAIL" | "PENDING" | "ERROR";

interface Submission {
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
  challenge: {
    id: string;
    title: string;
    description: string;
    difficulty: "EASY" | "MEDIUM" | "HARD";
    tags: string[];
  };
}

interface GroupedSubmissions {
  [challengeId: string]: {
    challenge: {
      id: string;
      title: string;
      difficulty: "EASY" | "MEDIUM" | "HARD";
      tags: string[];
    };
    submissions: Submission[];
  };
}

export default function SubmissionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [groupedSubmissions, setGroupedSubmissions] = useState<GroupedSubmissions>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (session?.user?.id) {
      fetchSubmissions();
    }
  }, [session, status, router]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/submissions?userId=${session?.user?.id}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch submissions");
      }

      const data = await response.json();
      setSubmissions(data.submissions || []);
      
      // Group submissions by challenge
      const grouped = data.submissions.reduce((acc: GroupedSubmissions, submission: Submission) => {
        const challengeId = submission.challengeId;
        
        if (!acc[challengeId]) {
          acc[challengeId] = {
            challenge: submission.challenge,
            submissions: []
          };
        }
        
        acc[challengeId].submissions.push(submission);
        return acc;
      }, {});

      setGroupedSubmissions(grouped);
    } catch (err) {
      console.error("Error fetching submissions:", err);
      setError("Failed to load submissions");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: SubmissionStatus) => {
    switch (status) {
      case "PASS":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "FAIL":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "ERROR":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case "PENDING":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: SubmissionStatus) => {
    switch (status) {
      case "PASS":
        return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
      case "FAIL":
        return "text-red-500 bg-red-500/10 border-red-500/20";
      case "ERROR":
        return "text-orange-500 bg-orange-500/10 border-orange-500/20";
      case "PENDING":
        return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
      default:
        return "text-gray-500 bg-gray-500/10 border-gray-500/20";
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "EASY":
        return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
      case "MEDIUM":
        return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
      case "HARD":
        return "text-red-400 bg-red-400/10 border-red-400/20";
      default:
        return "text-gray-400 bg-gray-400/10 border-gray-400/20";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter submissions based on search query
  const filteredGroupedSubmissions = Object.entries(groupedSubmissions).reduce((acc, [challengeId, data]) => {
    const problemName = data.challenge.title.toLowerCase();
    const searchLower = searchQuery.toLowerCase();
    
    if (searchQuery === "" || problemName.includes(searchLower)) {
      acc[challengeId] = data;
    }
    
    return acc;
  }, {} as GroupedSubmissions);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen w-full bg-black bg-gradient-to-b from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-400 mx-auto" />
          <p className="text-white text-xl">Loading your submissions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full bg-black bg-gradient-to-b from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-16 w-16 text-red-400 mx-auto" />
          <h1 className="text-2xl font-bold text-white mb-4">Error Loading Submissions</h1>
          <p className="text-gray-300 mb-6">{error}</p>
          <Button onClick={fetchSubmissions} className="bg-emerald-500 hover:bg-emerald-600">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <AuthenticatedNavbar />
      <div className="min-h-screen w-full bg-black bg-gradient-to-b from-black via-gray-900 to-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/problems")}
                className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Problems
              </Button>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white tracking-tight">
                  My <span className="text-emerald-400">Submissions</span>
                </h1>
                <p className="text-gray-300 mt-2">
                  View all your coding challenge submissions and track your progress
                </p>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by problem name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent w-64"
                />
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm font-medium">Total Submissions</p>
                    <p className="text-2xl font-bold text-white">{submissions.length}</p>
                  </div>
                  <Code className="h-8 w-8 text-emerald-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm font-medium">Problems Attempted</p>
                    <p className="text-2xl font-bold text-white">{Object.keys(groupedSubmissions).length}</p>
                  </div>
                  <Trophy className="h-8 w-8 text-yellow-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm font-medium">Successful</p>
                    <p className="text-2xl font-bold text-emerald-400">
                      {submissions.filter(s => s.result === "PASS").length}
                    </p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm font-medium">Success Rate</p>
                    <p className="text-2xl font-bold text-blue-400">
                      {submissions.length > 0 
                        ? Math.round((submissions.filter(s => s.result === "PASS").length / submissions.length) * 100)
                        : 0}%
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Submissions by Problem */}
          {Object.keys(filteredGroupedSubmissions).length === 0 ? (
                          <Card className="bg-gray-900/50 border-gray-800">
                <CardContent className="p-12 text-center">
                  <Code className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {searchQuery ? "No Matching Submissions" : "No Submissions Yet"}
                  </h3>
                  <p className="text-gray-400 mb-6">
                    {searchQuery 
                      ? `No submissions found for "${searchQuery}". Try a different search term.`
                      : "Start solving problems to see your submission history here."
                    }
                  </p>
                  {searchQuery ? (
                    <Button 
                      onClick={() => setSearchQuery("")}
                      className="bg-emerald-500 hover:bg-emerald-600"
                    >
                      Clear Search
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => router.push("/problems")}
                      className="bg-emerald-500 hover:bg-emerald-600"
                    >
                      Browse Problems
                    </Button>
                  )}
                </CardContent>
              </Card>
          ) : (
            <div className="space-y-6">
              {Object.entries(filteredGroupedSubmissions).map(([challengeId, data]) => (
                <Card key={challengeId} className="bg-gray-900/50 border-gray-800 hover:border-gray-700 transition-colors">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <h3 className="text-xl font-bold text-white mb-2">
                            {data.challenge.title}
                          </h3>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={getDifficultyColor(data.challenge.difficulty)}
                            >
                              {data.challenge.difficulty}
                            </Badge>
                            <span className="text-gray-400 text-sm">
                              {data.submissions.length} submission{data.submissions.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/problems/${challengeId}`)}
                        className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Problem
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3">
                      {data.submissions
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .map((submission) => (
                          <div
                            key={submission.id}
                            className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors cursor-pointer"
                            onClick={() => router.push(`/submissions/${submission.id}`)}
                          >
                            <div className="flex items-center gap-4">
                              {getStatusIcon(submission.result)}
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge
                                    variant="outline"
                                    className={getStatusColor(submission.result)}
                                  >
                                    {submission.result}
                                  </Badge>
                                  <span className="text-gray-400 text-sm">
                                    {submission.language}
                                  </span>
                                </div>
                                <p className="text-gray-300 text-sm">
                                  {formatDate(submission.createdAt)}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm">
                              {submission.score !== null && (
                                <span className="text-emerald-400 font-medium">
                                  Score: {submission.score}
                                </span>
                              )}
                              {submission.runtime !== null && (
                                <span className="text-gray-400">
                                  {submission.runtime}ms
                                </span>
                              )}
                              {submission.memory !== null && (
                                <span className="text-gray-400">
                                  {submission.memory}MB
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
} 