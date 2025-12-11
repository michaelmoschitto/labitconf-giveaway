"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface HeroSectionProps {
  dict: {
    hero: {
      headline: string;
      headlinePart1: string;
      headlinePart2: string;
      prizeAmount: string;
      subheadline: string;
      totalPrize: string;
      prizePool: string;
      inBitcoin: string;
      timeRemaining: string;
      timeEnding: string;
      days: string;
      hours: string;
      minutes: string;
      seconds: string;
      winners: string;
      winner: string;
      enterGiveaway: string;
      prizeBreakdown: string;
      grandPrize: string;
      runnerUp: string;
      topPrizes: string;
      morePrizes: string;
      getStarted: string;
    };
  };
}

const HeroSection = ({ dict }: HeroSectionProps) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const handleGetStarted = () => {
    const howItWorksSection = document.getElementById("how-it-works");
    if (howItWorksSection) {
      howItWorksSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    const targetDate = new Date("2025-12-01T00:00:00-05:00").getTime(); // December 1, 2025 at 00:00 EST

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
        );
        const minutes = Math.floor(
          (difference % (1000 * 60 * 60)) / (1000 * 60),
        );
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      {/* Floating Elements - Mix of Bitcoin & Mezo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Left Side - Mixed */}
        <FloatingElement
          delay={0}
          top="10%"
          left="5%"
          size="120px"
          rotation={-15}
        >
          ₿
        </FloatingElement>
        <FloatingElement
          delay={4}
          bottom="20%"
          left="10%"
          size="100px"
          rotation={-25}
          isMezo
        />
        <FloatingElement
          delay={3}
          top="60%"
          left="15%"
          size="70px"
          rotation={-30}
          isMezo
        />

        {/* Right Side - Mixed */}
        <FloatingElement
          delay={2}
          top="15%"
          right="8%"
          size="80px"
          rotation={25}
        >
          ₿
        </FloatingElement>
        <FloatingElement
          delay={1}
          bottom="15%"
          right="12%"
          size="90px"
          rotation={15}
          isMezo
        />
        <FloatingElement
          delay={5}
          top="40%"
          right="18%"
          size="110px"
          rotation={20}
        >
          ₿
        </FloatingElement>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 sm:px-8 py-4 sm:py-24 md:py-28 relative z-10">
        <div className="max-w-5xl mx-auto text-center space-y-4 sm:space-y-10 md:space-y-12">
          {/* Main Headline */}
          <div className="space-y-2 sm:space-y-5 md:space-y-6 animate-fade-in-up">
            <h1
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold italic tracking-tight leading-[1.05]"
              style={{
                fontFamily: "'Riforma LL Sub', 'Riforma LL', sans-serif",
              }}
            >
              <span className="text-foreground">{dict.hero.headlinePart1}</span>
              <span className="block text-gradient-mezo-total mt-1 sm:mt-3 md:mt-4">
                {dict.hero.prizeAmount}
              </span>
              <span
                className="block mt-1 sm:mt-3 md:mt-4"
                style={{ color: "#FF004D" }}
              >
                {dict.hero.headlinePart2}
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xs sm:text-sm md:text-base text-foreground font-light tracking-wide">
              {dict.hero.subheadline}
            </p>
          </div>

          {/* Countdown Timer - Minimalistic */}
          <div
            className="flex items-center justify-center gap-2 sm:gap-6 md:gap-12 animate-fade-in-up"
            style={{ animationDelay: "0.2s" }}
          >
            <TimeDigit value={timeLeft.days} label={dict.hero.days} />
            <Separator />
            <TimeDigit value={timeLeft.hours} label={dict.hero.hours} />
            <Separator />
            <TimeDigit value={timeLeft.minutes} label={dict.hero.minutes} />
            <Separator />
            <TimeDigit value={timeLeft.seconds} label={dict.hero.seconds} />
          </div>

          {/* Get Started Button */}
          <div
            className="pt-6 sm:pt-8 md:pt-10 animate-fade-in-up"
            style={{ animationDelay: "0.4s" }}
          >
            <button
              onClick={handleGetStarted}
              className="group relative px-8 py-3 sm:px-10 sm:py-4 text-white rounded-full font-medium text-base sm:text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl active:scale-95 bg-mezo-red hover:bg-mezo-red-hover"
              aria-label={dict.hero.getStarted}
            >
              <span className="relative z-10">{dict.hero.getStarted}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

// Time Digit Component - Clean & Minimal
interface TimeDigitProps {
  value: number;
  label: string;
}

const TimeDigit = ({ value, label }: TimeDigitProps) => {
  const formatNumber = (num: number) => num.toString().padStart(2, "0");

  return (
    <div className="flex flex-col items-center space-y-0.5 sm:space-y-1 min-w-0">
      <div className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-light tracking-tight tabular-nums text-foreground">
        {formatNumber(value)}
      </div>
      <div className="text-[8px] sm:text-[10px] uppercase tracking-wide text-muted-foreground whitespace-nowrap">
        {label}
      </div>
    </div>
  );
};

// Separator
const Separator = () => {
  return (
    <div className="text-lg sm:text-2xl md:text-3xl font-light text-muted-foreground/30 flex-shrink-0">
      :
    </div>
  );
};

// Floating Element Component
interface FloatingElementProps {
  children?: React.ReactNode;
  delay: number;
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  size?: string;
  rotation?: number;
  isMezo?: boolean;
}

const FloatingElement = ({
  children,
  delay: _delay,
  top,
  bottom,
  left,
  right,
  size = "100px",
  rotation = 0,
  isMezo = false,
}: FloatingElementProps) => {
  if (isMezo) {
    const sizeNum = parseInt(size);
    return (
      <div
        className="absolute opacity-12 hover:opacity-25 transition-opacity duration-500"
        style={{
          top,
          bottom,
          left,
          right,
          transform: `rotate(${rotation}deg)`,
          width: size,
          height: size,
        }}
      >
        <Image
          src="/Mezo Logo and Marks/Mezo Logo Circle.svg"
          alt=""
          width={sizeNum}
          height={sizeNum}
          className="w-full h-full"
        />
      </div>
    );
  }

  return (
    <div
      className="absolute opacity-12 hover:opacity-25 transition-opacity duration-500"
      style={{
        top,
        bottom,
        left,
        right,
        fontSize: size,
        transform: `rotate(${rotation}deg)`,
      }}
    >
      {children}
    </div>
  );
};

export default HeroSection;
