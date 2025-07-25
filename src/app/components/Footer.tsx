"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Code, Trophy, Users, BookOpen } from "lucide-react";

export function Footer() {
  const [currentYear, setCurrentYear] = useState("2024");

  useEffect(() => {
    setCurrentYear(new Date().getFullYear().toString());
  }, []);

  return (
    <footer className="bg-black border-t border-gray-800 mt-10 rounded-t-xl shadow-lg">
      <div className="max-w-6xl mx-auto px-6 py-10 grid gap-6 sm:grid-cols-2 md:grid-cols-4 text-sm text-gray-300">
        <div>
          <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Code className="h-5 w-5 text-emerald-400" />
            AI <span className="text-emerald-400">CodeLab</span>
          </h4>
          <p className="text-gray-400 leading-relaxed">
            Master coding with AI-generated challenges. Practice, compete, and grow your programming skills with personalized problems.
          </p>
        </div>
        
        <div>
          <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-emerald-400" />
            Learn
          </h4>
          <ul className="space-y-2">
            <li><Link href="/problems" className="hover:text-emerald-400 transition-colors">Practice Problems</Link></li>
            <li><Link href="/dashboard" className="hover:text-emerald-400 transition-colors">Your Dashboard</Link></li>
            <li><Link href="/submission" className="hover:text-emerald-400 transition-colors">View Submissions</Link></li>
          </ul>
        </div>
        
        <div>
          <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-emerald-400" />
            Compete
          </h4>
          <ul className="space-y-2">
            <li><Link href="/problems" className="hover:text-emerald-400 transition-colors">Daily Challenges</Link></li>
            <li><Link href="/dashboard" className="hover:text-emerald-400 transition-colors">Track Progress</Link></li>
            <li><Link href="/submissions" className="hover:text-emerald-400 transition-colors">View all Submissions</Link></li>
          </ul>
        </div>
        
        <div>
          <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-emerald-400" />
            Account
          </h4>
          <ul className="space-y-2">
            <li><Link href="/login" className="hover:text-emerald-400 transition-colors">Sign In</Link></li>
            <li><Link href="/signup" className="hover:text-emerald-400 transition-colors">Sign Up</Link></li>
            <li><Link href="/dashboard" className="hover:text-emerald-400 transition-colors">Profile</Link></li>
          </ul>
        </div>
      </div>
      
      <div className="border-t border-gray-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center text-xs text-gray-500">
          <div>
            &copy; {currentYear} <span className="text-white font-semibold">AI CodeLab</span>. All rights reserved.
          </div>
          <div className="flex items-center gap-4 mt-2 sm:mt-0">
            <span className="text-gray-600">Built with Next.js & Prisma</span>
            <span className="text-gray-600">Powered by Google Gemini AI</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
