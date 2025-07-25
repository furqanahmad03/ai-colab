"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/ui/icons";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const { status } = useSession();

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!email || !password) {
      setError("Please fill in all required fields");
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name || null,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create account");
      } else {
        // Redirect to login page after successful signup
        router.push("/login?message=Account created successfully");
      }
    } catch (error: unknown) {
      setError("An error occurred during signup: " + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-black bg-gradient-to-b from-black via-gray-900 to-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-900 border-gray-800 shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700">
              <Icons.zap className="h-6 w-6 text-gray-400" />
            </div>
          </div>
          <CardTitle className="text-2xl text-white font-semibold">
            Sign Up
          </CardTitle>
          <CardDescription className="text-gray-400">
            Create your account to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3 text-center">
                <span className="text-red-400 text-sm">{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-300 font-medium">
                Full Name
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-gray-600 focus:ring-1 focus:ring-gray-600"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300 font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-gray-600 focus:ring-1 focus:ring-gray-600"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300 font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-gray-600 focus:ring-1 focus:ring-gray-600"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-300 font-medium">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-gray-600 focus:ring-1 focus:ring-gray-600"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 hover:border-gray-600 transition-colors font-medium"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Sign Up"
              )}
            </Button>
          </form>

          <div className="text-center pt-4">
              <p className="text-gray-400 text-sm">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                >
                  Login here
                </Link>
              </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
