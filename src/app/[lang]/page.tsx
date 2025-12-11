import { Suspense } from "react";

import { DarkModeToggle } from "@/components/dark-mode-toggle";
import { EntryFormSection } from "@/components/entry-form";
import { HeroSection } from "@/components/hero";
import { HowItWorksSection } from "@/components/how-it-works";
import { LanguageToggle } from "@/components/language-toggle";
import { LeaderboardSection } from "@/components/leaderboard";
import Navigation from "@/components/navigation";
import { PrizeSection } from "@/components/prize-section";
import { getDictionary, type Locale } from "@/lib/dictionaries";

interface PageProps {
  params: Promise<{ lang: string }>;
}

export default async function Home({ params }: PageProps) {
  const { lang } = await params;
  const validLang = lang === "en" || lang === "es" ? (lang as Locale) : "es";
  const dict = await getDictionary(validLang);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Navigation lang={validLang} dict={dict} />

      <DarkModeToggle />

      <div className="fixed bottom-4 right-4 z-[60]">
        <Suspense fallback={<div className="min-w-[70px] h-10" />}>
          <LanguageToggle currentLang={validLang} />
        </Suspense>
      </div>

      {/* Snap Scroll Container */}
      <div className="snap-y snap-mandatory overflow-y-scroll h-screen snap-container">
        {/* Hero Section */}
        <section id="hero" className="snap-start snap-section">
          <HeroSection dict={dict} />
        </section>

        {/* Prizes Section */}
        <section
          id="prizes"
          className="snap-start snap-section relative overflow-hidden bg-background"
        >
          <PrizeSection dict={dict} />
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="snap-start snap-section">
          <HowItWorksSection dict={dict} />
        </section>

        {/* Leaderboard Section */}
        <section
          id="leaderboard"
          className="snap-start snap-section relative overflow-hidden bg-background"
        >
          <LeaderboardSection dict={dict} lang={validLang} />
        </section>

        {/* Entry Form Section */}
        <section
          id="entry-form"
          className="snap-start snap-section relative overflow-hidden bg-background"
        >
          <EntryFormSection dict={dict} lang={validLang} />
        </section>
      </div>
    </div>
  );
}
