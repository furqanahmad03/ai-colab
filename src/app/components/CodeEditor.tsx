"use client";

import { useState, useRef } from "react";
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

const defaultCode = `function solution(input) {
  // Your code here
  console.log("Hello World");
  return input;
}

// Test your solution
solution("test");`;

interface CodeEditorProps {
  problemId: string;
  testCases: TestCase[];
  onSubmit?: (code: string) => void;
}

export default function CodeEditor({
  problemId,
  testCases,
  onSubmit,
}: CodeEditorProps) {
  const [code, setCode] = useState<string>(defaultCode);
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [consoleOutput, setConsoleOutput] = useState<string>("");
  const [showResults, setShowResults] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const editorRef = useRef<any>(null);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  const simulateCodeExecution = async (
    code: string,
    testCase: TestCase
  ): Promise<TestResult> => {
    await new Promise((resolve) => setTimeout(resolve, 100 + Math.random() * 200));
    let actualOutput = "";
    let passed = false;
    let executionTime = Math.floor(Math.random() * 50) + 10; // 10-60ms
    let error = "";
    try {
      // Only support JavaScript execution
      // eslint-disable-next-line no-new-func
      const log: string[] = [];
      const customConsole = { log: (msg: any) => log.push(String(msg)) };
      // eslint-disable-next-line no-new-func
      Function("console", code)(customConsole);
      actualOutput = log.join("\n");
      passed = actualOutput.trim() === testCase.expectedOutput.trim();
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
      for (const testCase of testCases) {
        const result = await simulateCodeExecution(code, testCase);
        results.push(result);
      }
      setTestResults(results);
      setShowResults(true);
      const passedCount = results.filter((r) => r.passed).length;
      const totalCount = results.length;
      setConsoleOutput(
        `Executed ${totalCount} test cases. ${passedCount} passed, ${
          totalCount - passedCount
        } failed.`
      );
    } catch (error) {
      setConsoleOutput("Error: Failed to execute code");
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (onSubmit && !isSubmitting) {
      setIsSubmitting(true);
      try {
        await onSubmit(code);
      } finally {
        setIsSubmitting(false);
      }
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
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Code Editor</CardTitle>
            <span className="text-sm font-medium text-emerald-400">JavaScript Only</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Editor
              height="400px"
              language="javascript"
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
      <div className="flex items-center gap-3">
        <Button
          onClick={runCode}
          disabled={isRunning || isSubmitting || !code.trim()}
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
          disabled={isRunning || isSubmitting || !code.trim()}
          className="flex items-center gap-2"
        >
          {isSubmitting ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Terminal className="h-4 w-4" />
          )}
          {isSubmitting ? "Submitting..." : "Submit Solution"}
        </Button>
      </div>
      {consoleOutput && (
        <Card className="bg-black border border-gray-800 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-emerald-400">
              <Terminal className="h-4 w-4" />
              Terminal Output
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-black border border-gray-800 p-4 rounded-md font-mono text-sm text-green-400 min-h-[40px]">
              {consoleOutput}
            </div>
          </CardContent>
        </Card>
      )}
      {showResults && testResults.length > 0 && (
        <Card className="bg-black border border-gray-800 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-emerald-400">
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
                    "p-4 rounded-lg border flex flex-col gap-2",
                    result.passed
                      ? "bg-emerald-950/40 border-emerald-800"
                      : "bg-red-950/40 border-red-800"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getResultIcon(result.passed)}
                      <span className="font-medium text-sm text-white">
                        Test Case {index + 1}
                      </span>
                      <Badge
                        variant={result.passed ? "default" : "destructive"}
                        className={result.passed ? "bg-emerald-500 text-black" : "bg-red-500 text-white"}
                      >
                        {result.passed ? "PASSED" : "FAILED"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="h-3 w-3" />
                      {result.executionTime}ms
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="font-medium text-gray-400">Input: </span>
                      <code className="bg-gray-900 text-emerald-300 px-2 py-1 rounded font-mono border border-gray-800 block">
                        {result.input}
                      </code>
                    </div>
                    <div>
                      <span className="font-medium text-gray-400">Expected: </span>
                      <code className="bg-gray-900 text-emerald-300 px-2 py-1 rounded font-mono border border-gray-800 block">
                        {result.expectedOutput}
                      </code>
                    </div>
                    <div>
                      <span className="font-medium text-gray-400">Actual: </span>
                      <code
                        className={cn(
                          "px-2 py-1 rounded font-mono border block",
                          result.passed
                            ? "bg-gray-900 text-emerald-400 border-emerald-800"
                            : "bg-gray-900 text-red-400 border-red-800"
                        )}
                      >
                        {result.actualOutput || "No output"}
                      </code>
                    </div>
                  </div>
                  {result.error && (
                    <div className="text-red-400 text-xs mt-2">
                      <span className="font-medium">Error: </span>
                      {result.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
