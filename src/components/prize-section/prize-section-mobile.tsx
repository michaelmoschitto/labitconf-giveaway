"use client";

import { useState, useRef, useEffect } from "react";

import { prizeStructure } from "@/constants";

import type { PrizeSectionProps } from "@/components/prize-section/types";

const PrizeSectionMobile = ({ dict }: PrizeSectionProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const tierKeys = ["grand", "secondary", "intermediate", "base"] as const;

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const cardWidth = container.offsetWidth;
      const newIndex = Math.round(scrollLeft / cardWidth);
      setActiveIndex(newIndex);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const handleIndicatorClick = (index: number) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const cardWidth = container.offsetWidth;
    container.scrollTo({
      left: cardWidth * index,
      behavior: "smooth",
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header - Compact */}
      <div className="text-center mb-8 px-6">
        <h2 className="text-4xl font-medium tracking-tight mb-3">
          <span className="text-mezo-red">{dict.prizes.title}</span>
        </h2>
        <p className="text-sm text-foreground font-medium max-w-md mx-auto">
          {dict.prizes.subtitle}
        </p>
      </div>

      {/* Carousel Container */}
      <div className="flex-1 overflow-hidden">
        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide h-full pb-4"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {prizeStructure.map((prize, index) => {
            const tierKey = tierKeys[index];
            const tierDict = dict.prizes.tiers[tierKey];

            return (
              <div
                key={prize.tier}
                className="min-w-full snap-center flex items-center justify-center px-6"
                style={{ scrollSnapAlign: "center" }}
              >
                <div
                  className={`
                    w-full max-w-sm p-6 rounded-2xl border-2 transition-all duration-300
                    border-border
                    flex flex-col
                  `}
                >
                  {/* Prize Title */}
                  <div className="text-center mb-4">
                    <h3 className="text-base font-medium text-foreground">
                      {tierDict.title}
                    </h3>
                  </div>

                  {/* Prize Amount - Large & Bold */}
                  <div className="text-center mb-4 flex-1 flex items-center justify-center">
                    <div className="text-5xl font-bold text-mezo-red">
                      {tierDict.amount}
                    </div>
                  </div>

                  {/* Wallets Count (for all tiers) */}
                  <div className="text-center pt-3 border-t border-border">
                    <p className="text-sm font-medium text-muted-foreground">
                      {tierDict.winners}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Carousel Indicators */}
      <div className="flex justify-center gap-2 mb-4">
        {prizeStructure.map((_, index) => (
          <button
            key={index}
            onClick={() => handleIndicatorClick(index)}
            className={`
              w-2 h-2 rounded-full transition-all duration-300
              ${activeIndex === index ? "bg-primary" : "bg-muted-foreground/30"}
            `}
            aria-label={`Go to prize ${index + 1}`}
          />
        ))}
      </div>

      {/* Additional Info - Compact */}
      <div className="text-center text-xs text-muted-foreground px-6 pb-4">
        <p>
          {dict.prizes.distributionInfo}{" "}
          {dict.prizes.drawDate && dict.prizes.drawDate}
        </p>
      </div>
    </div>
  );
};

export default PrizeSectionMobile;
