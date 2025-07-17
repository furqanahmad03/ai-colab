"use client";

import { Lightbulb, Code2, BarChart2 } from "lucide-react";

const steps = [
  {
    icon: <Lightbulb className="w-6 h-6 text-emerald-400" />,
    title: "1. Generate or Pick a Challenge",
    description: "Start by generating a new problem using Gemini AI, or choose from daily or practice challenges.",
  },
  {
    icon: <Code2 className="w-6 h-6 text-emerald-400" />,
    title: "2. Solve It in Our Built-in Editor",
    description: "Write, run, and submit your code in real-time. Get immediate feedback on correctness and performance.",
  },
  {
    icon: <BarChart2 className="w-6 h-6 text-emerald-400" />,
    title: "3. View Results & Climb Leaderboards",
    description: "See how your solution ranks and track your growth through performance history and scores.",
  },
];

export function HowItWorks() {
  return (
    <section className="w-full py-20 bg-transparent shadow-lg">
      <div className="max-w-5xl mx-auto px-6 text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 drop-shadow-lg">How It Works</h2>
        <p className="text-gray-300 mb-12">
          3 simple steps to sharpen your skills and compete with coders worldwide.
        </p>

        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={index} className="text-left bg-gray-900 border border-gray-800 rounded-xl shadow-md hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10 transition-all p-6">
              <div className="mb-4">{step.icon}</div>
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-emerald-400 transition-colors duration-200">{step.title}</h3>
              <p className="text-sm text-gray-300">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
