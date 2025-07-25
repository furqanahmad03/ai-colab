"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CTA() {
  return (
    <section className="w-full bg-transparent py-16 text-center shadow-lg">
      <div className="max-w-3xl mx-auto px-6">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 drop-shadow-lg">
          Ready to Level Up Your <span className="text-emerald-400">Coding Skills?</span>
        </h2>
        <p className="text-lg text-gray-300 mb-8">
          Join <span className="text-emerald-400 font-semibold">AI CodeLab</span> to solve smart challenges, improve with real-time feedback, and compete with coders like you — all powered by AI.
        </p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link href="/signup">
            <Button className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-xl shadow-lg transition-colors duration-200 text-lg">
              Get Started
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" className="px-8 py-3 bg-gray-900 hover:bg-gray-800 text-white border border-emerald-500 rounded-xl shadow-lg transition-colors duration-200 text-lg">
              Try Daily CodeWar
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
