"use client";

import { prizeStructure } from "@/constants";
import { ScrollRevealSection } from "@/components/scroll-reveal-section";

import type { PrizeSectionProps } from "@/components/prize-section/types";

const PrizeSectionDesktop = ({ dict }: PrizeSectionProps) => {
  const tierKeys = ["grand", "secondary", "intermediate", "base"] as const;

  return (
    <>
      {/* Header */}
      <div
        className="max-w-4xl mx-auto text-center"
        style={{ marginBottom: "clamp(1rem, 4vh, 2rem)" }}
      >
        <ScrollRevealSection>
          <h2
            className="text-5xl md:text-6xl font-medium tracking-tight"
            style={{ marginBottom: "clamp(0.5rem, 2vh, 1.5rem)" }}
          >
            <span className="text-mezo-red">{dict.prizes.title}</span>
          </h2>
          <p className="text-base md:text-lg text-foreground font-medium max-w-2xl mx-auto">
            {dict.prizes.subtitle}
          </p>
        </ScrollRevealSection>
      </div>

      {/* Prize Cards - Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 max-w-7xl mx-auto">
        {prizeStructure.map((prize, index) => {
          const tierKey = tierKeys[index];
          const tierDict = dict.prizes.tiers[tierKey];

          return (
            <ScrollRevealSection key={prize.tier} delay={index * 0.1}>
              <div
                className={`
                  group relative p-8 rounded-2xl border-2 transition-all duration-300
                  hover:scale-105 hover:shadow-lg hover:border-foreground/20
                  border-border
                  h-full flex flex-col
                `}
              >
                {/* Prize Title */}
                <div className="text-center mb-6">
                  <h3 className="text-lg font-medium text-foreground mb-2 min-h-[3.5rem] flex items-center justify-center">
                    {tierDict.title}
                  </h3>
                </div>

                {/* Prize Amount - Large & Bold */}
                <div className="text-center mb-4 flex-1 flex items-center justify-center">
                  <div className="text-4xl md:text-5xl font-bold text-mezo-red">
                    {tierDict.amount}
                  </div>
                </div>

                {/* Wallets Count (for all tiers) */}
                <div className="text-center pt-4 border-t border-border mt-auto">
                  <p className="text-sm font-medium text-muted-foreground">
                    {tierDict.winners}
                  </p>
                </div>
              </div>
            </ScrollRevealSection>
          );
        })}
      </div>

      {/* Additional Info - Clean & Minimal */}
      <ScrollRevealSection delay={0.4}>
        <div className="max-w-2xl mx-auto text-center space-y-3 text-sm text-muted-foreground">
          <p>{dict.prizes.distributionInfo}</p>
          {dict.prizes.drawDate && <p>{dict.prizes.drawDate}</p>}
        </div>
      </ScrollRevealSection>
    </>
  );
};

export default PrizeSectionDesktop;
