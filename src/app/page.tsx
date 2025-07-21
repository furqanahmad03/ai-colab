"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { HeroSection } from "./components/HeroSection";
import { HowItWorks } from "./components/HowItWorks";
import { Features } from "./components/Feature";
import { CTA } from "./components/CTA";
import { Footer } from "./components/Footer";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    
    if (session) {
      router.push("/dashboard");
    } else {
      router.push("/");
    }
  }, [session, status, router]);

  return (
    <div className="min-h-screen w-full bg-black bg-gradient-to-b from-black via-gray-900 to-black flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center">
        <HeroSection />
        <HowItWorks />
        <Features />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}