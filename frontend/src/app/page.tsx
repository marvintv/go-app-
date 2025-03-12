"use client";

import { useState } from 'react';
import FloatingIslandHeader from "../../components/FloatingIslandHeader";
import TeamMember from "../../components/TeamMember";
import TropicalButton from "../../components/TropicalButton";
import colors from "../theme/colors";

export default function Home() {
  // Team members data
  const teamMembers = [
    {
      name: "Alex Johnson",
      role: "Island Chief",
      image: "/vercel.svg", // Using a local image as placeholder
      initials: "AJ",
      bgColor: colors.primary,
      delay: 100
    },
    {
      name: "Sam Rivera",
      role: "Beach Explorer",
      image: "/vercel.svg", // Using a local image as placeholder
      initials: "SR",
      bgColor: colors.secondary,
      delay: 300
    },
    {
      name: "Taylor Kim",
      role: "Sunset Watcher",
      image: "/vercel.svg", // Using a local image as placeholder
      initials: "TK",
      bgColor: colors.accent,
      delay: 500
    }
  ];

  const [count, setCount] = useState(0);

  return (
    <div className="grid grid-rows-[auto_1fr_auto] min-h-screen font-[family-name:var(--font-geist-sans)] bg-gradient-to-b from-[#4CD4B0]/20 via-white to-[#FFB347]/20">
      {/* Floating Island Header */}
      <FloatingIslandHeader title="Naru Island Team" />

      {/* Coconut Counter below Floating Island Header */}
      <div className="fixed top-24 right-8 text-right z-50 bg-white/80 p-4 rounded-xl shadow-lg backdrop-blur-sm border-2 border-[#FFB347] animate-bounce">
        <div className="text-4xl font-bold" style={{ color: colors.secondary }}>
          Coconut Counter
        </div>
        <div className="text-6xl flex items-center justify-center mt-2">
          <span className="mr-2 transform hover:scale-125 transition-transform duration-200">🥥</span>
          <span>×</span>
          <span className="ml-2 font-bold" style={{ color: colors.primary }}>{count}</span>
        </div>
      </div>

      <main className="container mx-auto pt-0 p-8 pb-20 gap-16 sm:p-20 sm:pt-0 mt-[-60px]">
        <div className="flex flex-col gap-[2px] items-center mb-0 mt-[-40px]">
          <h1 className="text-3xl font-bold text-center mt-[-20px] transform translate-y-[-15px] mb-4 mx-4" style={{ color: colors.primary }}>
            🌴 Naru Island Landing 🏖️
          </h1>
          <div className="flex gap-4 items-center justify-center w-full mt-6 mb-8">
            <TropicalButton 
              variant="primary" 
              size="lg"
              className="w-full sm:w-auto text-2xl py-5 px-12 mx-12 my-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              onClick={() => window.open("https://your-metrics-dashboard-url.com", "_blank")}
            >
              Go to Metrics Dashboard
            </TropicalButton>
          </div>
        </div>
        {/* Team Members Section */}
        <div className="mb-12 py-8 px-4 rounded-xl bg-gradient-to-r from-[#4CD4B0]/10 to-[#FFB347]/10">
          <h2 className="text-2xl font-bold mb-8 text-center animate-pulse" style={{ color: colors.secondary }}>
            <span className="inline-block mr-2">🌴</span>
            Meet Our Tropical Team
            <span className="inline-block ml-2">🏝️</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 justify-items-center">
            {teamMembers.map((member, index) => (
              <TeamMember
                key={index}
                name={member.name}
                role={member.role}
                initials={member.initials}
                bgColor={member.bgColor}
                delay={member.delay}
              />
            ))}
          </div>
        </div>

        {/* Centered Button with Larger Text */}
        <div className="text-center mb-12">
          <TropicalButton 
            onClick={() => setCount(count + 1)}
            variant="accent"
            size="lg"
            className="w-full sm:w-auto text-3xl py-6 px-10 relative overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <span className="relative z-10">Add a Coconut! 🥥</span>
          </TropicalButton>
        </div>
      </main>
    </div>
  );
}
