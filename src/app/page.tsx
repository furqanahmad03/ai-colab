import { HeroSection  } from "./components/HeroSection";
import { Navbar } from "./components/Navbar";
import { CTA } from "./components/CTA";
import { HowItWorks } from "./components/HowItWorks";
import {Footer} from "./components/Footer"
import React from 'react'

export default function HomePage()
{
 return (
  <div className="min-h-screen w-full bg-black bg-gradient-to-b from-black via-gray-900 to-black">
    <main>
      <Navbar/>
      <HeroSection/>
      <HowItWorks/>
      <CTA/>
      <Footer/>
    </main>
  </div>
 );
}
