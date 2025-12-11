"use client";

import Image from "next/image";

import { ScrollRevealSection } from "@/components/scroll-reveal-section";

interface Step {
  number: number;
  title: string;
  description: string;
  icon: string;
}

interface HowItWorksSectionProps {
  dict: {
    howItWorks: {
      title: string;
      subtitle: string;
      maximizeOpportunities: string;
      enterNow: string;
      steps: {
        step1: { title: string; description: string; icon: string };
        step2: { title: string; description: string; icon: string };
        step3: { title: string; description: string; icon: string };
        step4: { title: string; description: string; icon: string };
      };
      bonuses: {
        referral: { entries: string; description: string };
        social: { entries: string; description: string };
      };
    };
  };
}

interface StepProps {
  step: Step;
  index: number;
}

interface StepComponentProps extends StepProps {
  bonus?: string;
  showArrow?: boolean;
  showMobileArrow?: boolean;
}

const getStepIcon = (stepNumber: number) => {
  switch (stepNumber) {
    case 1:
      return (
        <div className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto flex items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="w-full h-full text-muted-foreground transition-colors duration-300 group-hover:text-foreground"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
            />
          </svg>
        </div>
      );
    case 2:
      return (
        <div className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto flex items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="w-full h-full text-muted-foreground transition-colors duration-300 group-hover:text-foreground"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3"
            />
          </svg>
        </div>
      );
    case 3:
      return (
        <div className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto flex items-center justify-center">
          <div className="w-full h-full flex items-center justify-center text-4xl sm:text-5xl md:text-6xl text-muted-foreground transition-colors duration-300 group-hover:text-foreground">
            ₿
          </div>
        </div>
      );
    case 4:
      return (
        <div className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto flex items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="w-full h-full text-muted-foreground transition-colors duration-300 group-hover:text-foreground"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
            />
          </svg>
        </div>
      );
    default:
      return null;
  }
};

const Step = ({
  step,
  bonus,
  showArrow = true,
  showMobileArrow,
}: StepComponentProps) => {
  return (
    <div className="relative flex flex-col items-center w-full h-full">
      {/* Card - Compact on mobile, spacious on desktop */}
      <div className="group relative p-3 sm:p-6 lg:p-8 rounded-2xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:border-foreground/20 border-border w-full h-full flex flex-col">
        {/* Step Number Badge */}
        <div className="absolute -top-2.5 -left-2.5 sm:-top-3 sm:-left-3 lg:-top-4 lg:-left-4 w-9 h-9 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full bg-foreground border-2 border-background flex items-center justify-center text-sm sm:text-lg lg:text-xl font-bold tracking-tight text-background shadow-sm transition-all duration-300 group-hover:shadow-md">
          {step.number.toString().padStart(2, "0")}
        </div>

        {/* Icon */}
        <div className="text-center mb-2 sm:mb-4 lg:mb-6">
          {getStepIcon(step.number)}
        </div>

        {/* Title - Fixed height to match all cards */}
        <div className="text-center mb-1.5 sm:mb-3 lg:mb-4">
          <h3 className="text-xs sm:text-base lg:text-lg font-medium text-foreground min-h-[2rem] sm:min-h-[3rem] lg:min-h-[3.5rem] flex items-center justify-center leading-tight px-1">
            {step.title}
          </h3>
        </div>

        {/* Description - Takes available space with flex-1 */}
        <div className="text-center mb-1.5 sm:mb-3 flex-1 flex items-center justify-center">
          <p className="text-[0.7rem] sm:text-sm text-muted-foreground leading-tight sm:leading-snug px-0.5">
            {step.description}
          </p>
        </div>

        {/* Footer - Always present to maintain equal card heights */}
        <div className="text-center pt-1.5 sm:pt-3 lg:pt-4 border-t border-border mt-auto">
          {bonus ? (
            <p className="text-[0.7rem] sm:text-sm font-medium text-mezo-red min-h-[1rem] sm:min-h-[1.25rem]">
              {bonus}
            </p>
          ) : (
            <p className="text-[0.7rem] sm:text-sm font-medium text-muted-foreground opacity-0 min-h-[1rem] sm:min-h-[1.25rem]">
              &nbsp;
            </p>
          )}
        </div>
      </div>

      {/* Arrow Connector - Horizontal on desktop and between cards 1->2 and 3->4 on mobile */}
      {/* Desktop Arrow (Horizontal) - Between all cards except last */}
      {showArrow && (
        <div className="hidden lg:block absolute -right-5 top-1/2 -translate-y-1/2 pointer-events-none z-10">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-muted-foreground opacity-30"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
      )}

      {/* Mobile Arrow - Only between cards 1->2 and 3->4 */}
      {showMobileArrow && (
        <div className="lg:hidden absolute left-full top-1/2 -translate-y-1/2 -translate-x-1/2 ml-1.5 pointer-events-none z-10">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-muted-foreground opacity-30"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
      )}
    </div>
  );
};

const HowItWorksSection = ({ dict }: HowItWorksSectionProps) => {
  const handleEnterNow = () => {
    const entryFormSection = document.getElementById("entry-form");
    if (entryFormSection) {
      entryFormSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Convert dictionary steps to array format
  const steps: Step[] = [
    {
      number: 1,
      title: dict.howItWorks.steps.step1.title,
      description: dict.howItWorks.steps.step1.description,
      icon: dict.howItWorks.steps.step1.icon,
    },
    {
      number: 2,
      title: dict.howItWorks.steps.step2.title,
      description: dict.howItWorks.steps.step2.description,
      icon: dict.howItWorks.steps.step2.icon,
    },
    {
      number: 3,
      title: dict.howItWorks.steps.step3.title,
      description: dict.howItWorks.steps.step3.description,
      icon: dict.howItWorks.steps.step3.icon,
    },
    {
      number: 4,
      title: dict.howItWorks.steps.step4.title,
      description: dict.howItWorks.steps.step4.description,
      icon: dict.howItWorks.steps.step4.icon,
    },
  ];

  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">
      {/* Floating Elements - Mix of Bitcoin & Mezo (Hidden on mobile) */}
      <div className="hidden sm:block absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-10 left-5 text-8xl opacity-5"
          style={{ transform: "rotate(-15deg)" }}
        >
          ₿
        </div>
        <div
          className="absolute top-15 right-8 opacity-5"
          style={{
            transform: "rotate(25deg)",
            width: "100px",
            height: "100px",
          }}
        >
          <Image
            src="/Mezo Logo and Marks/Mezo Logo Circle.svg"
            alt=""
            width={100}
            height={100}
            className="w-full h-full"
          />
        </div>
        <div
          className="absolute bottom-20 left-10 opacity-5"
          style={{
            transform: "rotate(-25deg)",
            width: "120px",
            height: "120px",
          }}
        >
          <Image
            src="/Mezo Logo and Marks/Mezo Logo Circle.svg"
            alt=""
            width={120}
            height={120}
            className="w-full h-full"
          />
        </div>
        <div
          className="absolute bottom-15 right-12 text-6xl opacity-5"
          style={{ transform: "rotate(15deg)" }}
        >
          ₿
        </div>
        <div
          className="absolute top-60 left-15 text-5xl opacity-5"
          style={{ transform: "rotate(-30deg)" }}
        >
          ₿
        </div>
        <div
          className="absolute top-40 right-18 opacity-5"
          style={{ transform: "rotate(20deg)", width: "90px", height: "90px" }}
        >
          <Image
            src="/Mezo Logo and Marks/Mezo Logo Circle.svg"
            alt=""
            width={90}
            height={90}
            className="w-full h-full"
          />
        </div>
      </div>

      <div
        className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10"
        style={{
          paddingTop: "clamp(4.5rem, 6vh, 6rem)",
          paddingBottom: "clamp(3rem, 8vh, 6rem)",
        }}
      >
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div
            className="max-w-4xl mx-auto text-center"
            style={{ marginBottom: "clamp(1rem, 4vh, 2rem)" }}
          >
            <ScrollRevealSection>
              <h2
                className="text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight"
                style={{ marginBottom: "clamp(0.5rem, 2vh, 1.5rem)" }}
              >
                <span className="text-mezo-red">{dict.howItWorks.title}</span>
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-foreground font-medium max-w-2xl mx-auto">
                {dict.howItWorks.subtitle}
              </p>
            </ScrollRevealSection>
          </div>

          {/* Steps - 2x2 Grid on Mobile, 4 Columns on Desktop */}
          <div
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 max-w-7xl mx-auto"
            style={{ marginBottom: "clamp(1.5rem, 5vh, 3rem)" }}
          >
            <ScrollRevealSection delay={0}>
              <Step step={steps[0]} index={0} showArrow showMobileArrow />
            </ScrollRevealSection>
            <ScrollRevealSection delay={0.05}>
              <Step step={steps[1]} index={1} showArrow />
            </ScrollRevealSection>
            <ScrollRevealSection delay={0.1}>
              <Step
                step={steps[2]}
                index={2}
                bonus={undefined}
                showArrow
                showMobileArrow
              />
            </ScrollRevealSection>
            <ScrollRevealSection delay={0.15}>
              <Step
                step={steps[3]}
                index={3}
                bonus={dict.howItWorks.bonuses.social.entries}
                showArrow={false}
              />
            </ScrollRevealSection>
          </div>

          {/* Enter Now Button */}
          <div
            className="text-center animate-fade-in"
            style={{
              animationDelay: "0.2s",
              marginTop: "clamp(1.5rem, 5vh, 3rem)",
            }}
          >
            <button
              onClick={handleEnterNow}
              className="h-12 px-8 text-white rounded-full font-medium text-sm transition-all duration-300 hover:scale-105 hover:shadow-2xl active:scale-95 inline-flex items-center justify-center bg-mezo-red hover:bg-mezo-red-hover"
              aria-label={dict.howItWorks.enterNow}
            >
              <span className="relative z-10">{dict.howItWorks.enterNow}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export { HowItWorksSection };
