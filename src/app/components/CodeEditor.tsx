"use client";

import { useState, useRef, useEffect } from "react";
import { Editor } from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Play,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Terminal,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Language = "javascript" | "python" | "c" | "cpp";

interface TestCase {
  input: string;
  expectedOutput: string;
  description?: string;
}

interface TestResult {
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  executionTime: number;
  error?: string;
}

const languageConfigs = {
  javascript: {
    name: "JavaScript",
    defaultCode: `function solution(input) {
    // Your code here
    console.log("Hello World");
    return input;
}

// Test your solution
solution("test");`,
    extension: "js",
    monacoLang: "javascript",
  },
  python: {
    name: "Python",
    defaultCode: `def solution(input_data):
    # Your code here
    print("Hello World")
    return input_data

# Test your solution
solution("test")`,
    extension: "py",
    monacoLang: "python",
  },
  c: {
    name: "C",
    defaultCode: `#include <stdio.h>
#include <stdlib.h>

int main() {
    // Your code here
    printf("Hello World\\n");
    return 0;
}`,
    extension: "c",
    monacoLang: "c",
  },
  cpp: {
    name: "C++",
    defaultCode: `#include <iostream>
#include <vector>
#include <string>

using namespace std;

int main() {
    // Your code here
    cout << "Hello World" << endl;
    return 0;
}`,
    extension: "cpp",
    monacoLang: "cpp",
  },
};

interface CodeEditorProps {
  problemId: string;
  testCases: TestCase[];
  onSubmit?: (code: string, language: Language) => void;
}

export default function CodeEditor({
  problemId,
  testCases,
  onSubmit,
}: CodeEditorProps) {
  const [selectedLanguage, setSelectedLanguage] =
    useState<Language>("javascript");
  const [code, setCode] = useState<string>(
    languageConfigs[selectedLanguage].defaultCode
  );
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [consoleOutput, setConsoleOutput] = useState<string>("");
  const [showResults, setShowResults] = useState(false);
  const editorRef = useRef<any>(null);

  useEffect(() => {
    setCode(languageConfigs[selectedLanguage].defaultCode);
    setTestResults([]);
    setConsoleOutput("");
    setShowResults(false);
  }, [selectedLanguage]);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  const simulateCodeExecution = async (
    code: string,
    language: Language,
    testCase: TestCase
  ): Promise<TestResult> => {
    // Simulate execution delay
    await new Promise((resolve) =>
      setTimeout(resolve, 100 + Math.random() * 200)
    );

    // Mock execution logic - in a real implementation, this would run on a backend
    let actualOutput = "";
    let passed = false;
    let executionTime = Math.floor(Math.random() * 50) + 10; // 10-60ms
    let error = "";

    try {
      // Simple mock logic for demonstration
      if (language === "javascript") {
        if (code.includes("console.log")) {
          // Extract what's being logged (very basic parsing)
          const logMatch = code.match(/console\.log\(["'](.+?)["']\)/);
          if (logMatch) {
            actualOutput = logMatch[1];
          }
        }
      } else if (language === "python") {
        if (code.includes("print")) {
          const printMatch = code.match(/print\(["'](.+?)["']\)/);
          if (printMatch) {
            actualOutput = printMatch[1];
          }
        }
      } else if (language === "c" || language === "cpp") {
        if (code.includes("printf") || code.includes("cout")) {
          const printfMatch = code.match(/printf\(["'](.+?)["']/);
          const coutMatch = code.match(/cout\s*<<\s*["'](.+?)["']/);
          if (printfMatch) {
            actualOutput = printfMatch[1].replace("\\n", "");
          } else if (coutMatch) {
            actualOutput = coutMatch[1];
          }
        }
      }

      // Check if output matches expected
      passed = actualOutput.trim() === testCase.expectedOutput.trim();

      // Simulate some errors randomly for demo
      if (Math.random() < 0.1) {
        error = "Runtime Error: Simulated error for demonstration";
        passed = false;
      }
    } catch (e) {
      error = "Execution Error: " + String(e);
      passed = false;
    }

    return {
      input: testCase.input,
      expectedOutput: testCase.expectedOutput,
      actualOutput,
      passed,
      executionTime,
      error,
    };
  };

  const runCode = async () => {
    if (!code.trim()) return;

    setIsRunning(true);
    setShowResults(false);
    setConsoleOutput("");

    try {
      const results: TestResult[] = [];

      // Run code against test cases
      for (const testCase of testCases) {
        const result = await simulateCodeExecution(
          code,
          selectedLanguage,
          testCase
        );
        results.push(result);
      }

      setTestResults(results);
      setShowResults(true);

      // Set console output
      const passedCount = results.filter((r) => r.passed).length;
      const totalCount = results.length;
      setConsoleOutput(
        `Executed ${totalCount} test cases. ${passedCount} passed, ${
          totalCount - passedCount
        } failed.`
      );
    } catch (error) {
      console.error("Error running code:", error);
      setConsoleOutput("Error: Failed to execute code");
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit(code, selectedLanguage);
    }
  };

  const getResultIcon = (passed: boolean) => {
    return passed ? (
      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  return (
    <div className="space-y-4">
      {/* Language Selection */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Code Editor</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Language:</span>
              <div className="flex gap-1">
                {Object.entries(languageConfigs).map(([key, config]) => (
                  <Button
                    key={key}
                    variant={selectedLanguage === key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedLanguage(key as Language)}
                    className="text-xs"
                  >
                    {config.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Editor
              height="400px"
              language={languageConfigs[selectedLanguage].monacoLang}
              value={code}
              onChange={(value) => setCode(value || "")}
              onMount={handleEditorDidMount}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: "on",
                roundedSelection: false,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: "on",
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <Button
          onClick={runCode}
          disabled={isRunning || !code.trim()}
          className="flex items-center gap-2"
        >
          {isRunning ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          {isRunning ? "Running..." : "Run Code"}
        </Button>

        <Button
          variant="outline"
          onClick={handleSubmit}
          disabled={!code.trim()}
          className="flex items-center gap-2"
        >
          <Terminal className="h-4 w-4" />
          Submit Solution
        </Button>
      </div>

      {/* Console Output */}
      {consoleOutput && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Terminal className="h-4 w-4" />
              Console Output
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-3 rounded-md font-mono text-sm text-black dark:text-green-400">
              {consoleOutput}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Results */}
      {showResults && testResults.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Test Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={cn(
                    "p-4 rounded-lg border",
                    result.passed
                      ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800"
                      : "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800"
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getResultIcon(result.passed)}
                      <span className="font-medium text-sm">
                        Test Case {index + 1}
                      </span>
                      <Badge
                        variant={result.passed ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {result.passed ? "PASSED" : "FAILED"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {result.executionTime}ms
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Input: </span>
                      <code className="bg-gray-100 dark:bg-gray-800 text-black dark:text-white px-2 py-1 rounded text-xs font-mono border border-gray-200 dark:border-gray-700">
                        {result.input}
                      </code>
                    </div>
                    <div>
                      <span className="font-medium">Expected: </span>
                      <code className="bg-gray-100 dark:bg-gray-800 text-black dark:text-white px-2 py-1 rounded text-xs font-mono border border-gray-200 dark:border-gray-700">
                        {result.expectedOutput}
                      </code>
                    </div>
                    <div>
                      <span className="font-medium">Actual: </span>
                      <code
                        className={cn(
                          "px-2 py-1 rounded text-xs font-mono border",
                          result.passed
                            ? "bg-gray-100 dark:bg-gray-800 text-black dark:text-white border-gray-200 dark:border-gray-700"
                            : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700"
                        )}
                      >
                        {result.actualOutput || "No output"}
                      </code>
                    </div>
                    {result.error && (
                      <div className="text-red-600 dark:text-red-400 text-xs">
                        <span className="font-medium">Error: </span>
                        {result.error}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
