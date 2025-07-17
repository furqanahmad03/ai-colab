"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Brain, Sword, Laptop2, Timer, BarChart3 } from "lucide-react";

const features = [
  {
    icon: <Brain className="w-6 h-6 text-emerald-400" />,
    title: "AI-Powered Challenges",
    description: "Generate unique, never-before-seen coding problems using the Gemini API.",
  },
  {
    icon: <Sword className="w-6 h-6 text-emerald-400" />,
    title: "Daily CodeWars",
    description: "Compete daily by solving new challenges and climbing the leaderboard.",
  },
  {
    icon: <Laptop2 className="w-6 h-6 text-emerald-400" />,
    title: "Practice Arena",
    description: "Browse past challenges and sharpen your skills with instant feedback.",
  },
  {
    icon: <Timer className="w-6 h-6 text-emerald-400" />,
    title: "Real-Time Evaluation",
    description: "Submit code and instantly see test results, performance score, and accuracy.",
  },
  {
    icon: <BarChart3 className="w-6 h-6 text-emerald-400" />,
    title: "Performance Tracking",
    description: "View your history, progress, and performance stats over time.",
  },
];

export function Features() {
  return (
    <section id="features" className="w-full py-20 bg-transparent">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 drop-shadow-lg">Why <span className="text-emerald-400">AI CodeLab</span>?</h2>
        <p className="text-gray-300 mb-12">
          Everything you need to level up your coding skills — powered by AI.
        </p>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Card key={index} className="text-left bg-gray-900 border border-gray-800 rounded-xl shadow-md hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10 transition-all">
              <CardContent className="p-6">
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-emerald-400 transition-colors duration-200">{feature.title}</h3>
                <p className="text-sm text-gray-300">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
