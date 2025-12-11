"use client";

import Image from "next/image";
import Link from "next/link";

import { ConnectWalletButton } from "@/components/connect-wallet";
import { cn } from "@/lib/utils";

interface NavigationProps {
  lang?: string;
  dict?: {
    giveaway?: {
      prizes?: string;
      howItWorks?: string;
      leaderboard?: string;
      enterNow?: string;
    };
    navigation?: {
      connectWallet?: string;
    };
    connectWallet?: {
      title: string;
      walletLabel: string;
      walletPlaceholder: string;
      connect: string;
      cancel: string;
      walletNotFound: string;
      enterWallet: string;
      checkingWallet: string;
    };
  };
}

const Navigation = ({ lang = "en", dict }: NavigationProps) => {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      // For snap scroll, we need to scroll the parent container
      const snapContainer = document.querySelector(".snap-y");
      if (snapContainer) {
        const elementTop = element.offsetTop;
        snapContainer.scrollTo({
          top: elementTop,
          behavior: "smooth",
        });
      } else {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Mezo Logo */}
          <Link
            href={`/${lang}`}
            className="flex flex-col md:flex-row items-center md:items-center md:space-x-3 space-y-1 md:space-y-0"
          >
            <Image
              src="/Mezo Logo and Marks/Mezo Logo.svg"
              alt="Mezo"
              width={100}
              height={32}
              className="h-7 w-auto"
            />
            <span className="text-xs font-medium tracking-wide text-foreground">
              × LABITCONF
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => scrollToSection("prizes")}
              className="text-sm font-medium text-foreground hover:bg-foreground hover:text-background px-4 py-2 rounded-full transition-all duration-300"
            >
              {dict?.giveaway?.prizes || "Premios"}
            </button>
            <button
              onClick={() => scrollToSection("how-it-works")}
              className="text-sm font-medium text-foreground hover:bg-foreground hover:text-background px-4 py-2 rounded-full transition-all duration-300"
            >
              {dict?.giveaway?.howItWorks || "Cómo Funciona"}
            </button>
            <button
              onClick={() => scrollToSection("leaderboard")}
              className="text-sm font-medium text-foreground hover:bg-foreground hover:text-background px-4 py-2 rounded-full transition-all duration-300"
            >
              {dict?.giveaway?.leaderboard || "Clasificación"}
            </button>
            <button
              onClick={() => scrollToSection("entry-form")}
              className="text-sm font-medium text-foreground hover:bg-foreground hover:text-background px-4 py-2 rounded-full transition-all duration-300"
            >
              {dict?.giveaway?.enterNow || "Participar"}
            </button>
          </div>

          <div className="flex items-center space-x-4">
            {dict?.connectWallet && dict?.navigation?.connectWallet && (
              <ConnectWalletButton
                dict={{
                  buttonText: dict.navigation.connectWallet,
                  modal: dict.connectWallet,
                }}
                className={cn(
                  "rounded-full px-6 py-2 font-medium",
                  "bg-foreground text-background hover:bg-foreground/90",
                  "transition-all duration-300",
                )}
              />
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
