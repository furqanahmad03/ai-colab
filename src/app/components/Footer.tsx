"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export function Footer() {
  const [currentYear, setCurrentYear] = useState("2024");

  useEffect(() => {
    setCurrentYear(new Date().getFullYear().toString());
  }, []);

  return (
    <footer className="bg-black border-t border-gray-800 mt-10 rounded-t-xl shadow-lg">
      <div className="max-w-6xl mx-auto px-6 py-10 grid gap-6 sm:grid-cols-2 md:grid-cols-4 text-sm text-gray-300">
        <div>
          <h4 className="text-white font-semibold mb-2">AI <span className="text-emerald-400">CodeLab</span></h4>
          <p>
            An AI-powered platform to practice, compete, and grow your coding skills.
          </p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-2">Navigation</h4>
          <ul className="space-y-1">
            <li><Link href="/" className="hover:text-emerald-400 transition-colors">Home</Link></li>
            <li><Link href="/feature" className="hover:text-emerald-400 transition-colors">Features</Link></li>
            <li><Link href="/daily" className="hover:text-emerald-400 transition-colors">Daily CodeWar</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-2">Community</h4>
          <ul className="space-y-1">
            <li><Link href="/leaderboard" className="hover:text-emerald-400 transition-colors">Leaderboard</Link></li>
            <li><Link href="/login" className="hover:text-emerald-400 transition-colors">Sign In</Link></li>
            <li><Link href="/signup" className="hover:text-emerald-400 transition-colors">Sign Up</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-2">More</h4>
          <ul className="space-y-1">
            <li><a href="https://github.com" target="_blank" className="hover:text-emerald-400 transition-colors">GitHub</a></li>
            <li><a href="#" className="hover:text-emerald-400 transition-colors">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-emerald-400 transition-colors">Terms of Service</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-800 text-center text-xs text-gray-500 py-4">
        &copy; {currentYear} <span className="text-white font-semibold">AI CodeLab</span>. All rights reserved.
      </div>
    </footer>
  );
}
