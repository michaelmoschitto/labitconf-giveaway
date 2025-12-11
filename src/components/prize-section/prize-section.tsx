"use client";

import Image from "next/image";

import PrizeSectionDesktop from "@/components/prize-section/prize-section-desktop";
import PrizeSectionMobile from "@/components/prize-section/prize-section-mobile";

import type { PrizeSectionProps } from "@/components/prize-section/types";

const PrizeSection = ({ dict }: PrizeSectionProps) => {
  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">
      {/* Floating Elements - Mix of Bitcoin & Mezo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-20 left-8 opacity-12"
          style={{
            transform: "rotate(-20deg)",
            width: "110px",
            height: "110px",
          }}
        >
          <Image
            src="/Mezo Logo and Marks/Mezo Logo Circle.svg"
            alt=""
            width={110}
            height={110}
            className="w-full h-full"
          />
        </div>
        <div
          className="absolute bottom-24 right-10 text-6xl opacity-12"
          style={{ transform: "rotate(30deg)" }}
        >
          ₿
        </div>
        <div
          className="absolute top-40 right-20 opacity-12"
          style={{ transform: "rotate(-10deg)", width: "80px", height: "80px" }}
        >
          <Image
            src="/Mezo Logo and Marks/Mezo Logo Circle.svg"
            alt=""
            width={80}
            height={80}
            className="w-full h-full"
          />
        </div>
        <div
          className="absolute bottom-40 left-20 text-7xl opacity-12"
          style={{ transform: "rotate(15deg)" }}
        >
          ₿
        </div>
      </div>

      {/* Desktop View */}
      <div
        className="hidden lg:block container mx-auto px-6 relative z-10"
        style={{
          paddingTop: "clamp(4.5rem, 6vh, 6rem)",
          paddingBottom: "clamp(3rem, 8vh, 6rem)",
        }}
      >
        <PrizeSectionDesktop dict={dict} />
      </div>

      {/* Mobile View - Carousel */}
      <div className="lg:hidden w-full h-full relative z-10 py-8">
        <PrizeSectionMobile dict={dict} />
      </div>
    </section>
  );
};

export default PrizeSection;
