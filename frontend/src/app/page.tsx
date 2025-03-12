"use client";

import Image from "next/image";
import { useState } from 'react';
import FloatingIslandHeader from "../../components/FloatingIslandHeader";
import TeamMember from "../../components/TeamMember";
import TropicalButton from "../../components/TropicalButton";
import TropicalCard from "../../components/TropicalCard";
import colors from "../theme/colors";

export default function Home() {
  const [count, setCount] = useState(0);

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

  return (
    <div className="grid grid-rows-[auto_1fr_auto] min-h-screen font-[family-name:var(--font-geist-sans)] bg-gradient-to-b from-[#4CD4B0]/20 via-white to-[#FFB347]/20">
      {/* Floating Island Header */}
      <FloatingIslandHeader title="Tropical Island Team" />
      
      <main className="container mx-auto p-8 pb-20 gap-16 sm:p-20">
        <div className="flex flex-col gap-[32px] items-center sm:items-start mb-12">
          <h1 className="text-3xl font-bold" style={{ color: colors.primary }}>
            🌴 Tropical Island Team UI 🏖️
          </h1>
          
          <ol className="list-inside list-decimal text-sm/6 text-center sm:text-left font-[family-name:var(--font-geist-mono)]">
            <li className="mb-2 tracking-[-.01em]">
              Get started by editing{" "}
              <code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-[family-name:var(--font-geist-mono)] font-semibold">
                src/app/page.tsx
              </code>
              .
            </li>
            <li className="tracking-[-.01em]">
              Save and see your changes instantly.
            </li>
          </ol>

          <div className="flex gap-4 items-center flex-col sm:flex-row">
            <TropicalButton 
              variant="primary" 
              size="lg"
              className="w-full sm:w-auto"
              onClick={() => window.open("https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app", "_blank")}
            >
              <div className="flex items-center gap-2">
                <Image
                  className="dark:invert"
                  src="/vercel.svg"
                  alt="Vercel logomark"
                  width={20}
                  height={20}
                />
                Deploy now
              </div>
            </TropicalButton>
            
            <TropicalButton 
              variant="secondary" 
              size="lg"
              className="w-full sm:w-auto"
              onClick={() => window.open("https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app", "_blank")}
            >
              Read our docs
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
        
        {/* Tropical Theme Demo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* Card 1 */}
          <TropicalCard>
            <h3 className="text-xl font-semibold mb-2" style={{ color: colors.secondary }}>
              Tropical Buttons
            </h3>
            <p className="mb-4">
              Colorful buttons inspired by the island paradise theme.
            </p>
            <div className="flex flex-wrap gap-2">
              <TropicalButton variant="primary">Primary</TropicalButton>
              <TropicalButton variant="secondary">Secondary</TropicalButton>
              <TropicalButton variant="accent">Accent</TropicalButton>
            </div>
          </TropicalCard>
          
          {/* Card 2 */}
          <TropicalCard>
            <h3 className="text-xl font-semibold mb-2" style={{ color: colors.secondary }}>
              Interactive Demo
            </h3>
            <p className="mb-4">
              Click the button to count coconuts!
            </p>
            <div className="text-center">
              <div className="text-4xl mb-4">🥥 × {count}</div>
              <TropicalButton 
                onClick={() => setCount(count + 1)}
                variant="accent"
                size="md"
              >
                Collect Coconut
              </TropicalButton>
            </div>
          </TropicalCard>
          
          {/* Card 3 */}
          <TropicalCard>
            <h3 className="text-xl font-semibold mb-2" style={{ color: colors.secondary }}>
              Color Palette
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full" style={{ backgroundColor: colors.primary }}></div>
                <span>Turquoise Ocean: {colors.primary}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full" style={{ backgroundColor: colors.secondary }}></div>
                <span>Sunset Orange: {colors.secondary}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full" style={{ backgroundColor: colors.accent }}></div>
                <span>Tropical Pink: {colors.accent}</span>
              </div>
            </div>
          </TropicalCard>
        </div>
      </main>
      
      <footer className="p-6 bg-gradient-to-r from-[#4CD4B0]/20 to-[#FFB347]/20">
        <div className="container mx-auto flex gap-[24px] flex-wrap items-center justify-center">
          <a
            className="flex items-center gap-2 hover:underline hover:underline-offset-4"
            href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              aria-hidden
              src="/file.svg"
              alt="File icon"
              width={16}
              height={16}
            />
            Learn
          </a>
          <a
            className="flex items-center gap-2 hover:underline hover:underline-offset-4"
            href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              aria-hidden
              src="/window.svg"
              alt="Window icon"
              width={16}
              height={16}
            />
            Examples
          </a>
          <a
            className="flex items-center gap-2 hover:underline hover:underline-offset-4"
            href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              aria-hidden
              src="/globe.svg"
              alt="Globe icon"
              width={16}
              height={16}
            />
            Go to nextjs.org →
          </a>
        </div>
        <div className="text-center mt-4" style={{ color: colors.secondary }}>
          🌴 Tropical Island Team UI - Making work feel like a vacation! 🏖️
        </div>
      </footer>
    </div>
  );
}
