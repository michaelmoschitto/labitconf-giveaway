"use client";

import { useScrollReveal } from "@/hooks/use-scroll-reveal";

interface ScrollRevealSectionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export const ScrollRevealSection = ({
  children,
  className = "",
  delay = 0,
}: ScrollRevealSectionProps) => {
  const { ref, isVisible } = useScrollReveal({
    threshold: 0.2,
    rootMargin: "0px 0px -80px 0px",
  });

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${className}`}
      style={{
        transitionDelay: isVisible ? `${delay}ms` : "0ms",
      }}
    >
      {children}
    </div>
  );
};
