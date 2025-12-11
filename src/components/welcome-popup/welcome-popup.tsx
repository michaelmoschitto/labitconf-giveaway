"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

import { Dialog, DialogPortal } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const POPUP_STORAGE_KEY = "hasSeenWelcomePopup";

interface WelcomePopupProps {
  dict: {
    welcomePopup: {
      title: string;
      subtitle: string;
      cta: string;
    };
  };
}

const CustomDialogOverlay = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>) => (
  <DialogPrimitive.Overlay
    className={cn("fixed inset-0 z-50 bg-black/80", className)}
    style={{ animation: "none" }}
    {...props}
  />
);

const CustomDialogContent = ({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>) => (
  <DialogPortal>
    <CustomDialogOverlay />
    <DialogPrimitive.Content
      className={cn(
        "fixed left-[50%] top-[50%] z-50 w-full max-w-4xl translate-x-[-50%] translate-y-[-50%] bg-background p-8 sm:p-12 shadow-lg sm:rounded-2xl border-2 border-border",
        className,
      )}
      style={{ animation: "none" }}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPortal>
);

export const WelcomePopup = ({ dict }: WelcomePopupProps) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const hasSeenPopup = localStorage.getItem(POPUP_STORAGE_KEY);

    if (!hasSeenPopup) {
      setOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(POPUP_STORAGE_KEY, "true");
    setOpen(false);
  };

  const handleEnterToWin = () => {
    handleClose();

    setTimeout(() => {
      const howItWorksSection = document.getElementById("how-it-works");
      if (howItWorksSection) {
        howItWorksSection.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <CustomDialogContent>
        <DialogPrimitive.Close
          className="absolute right-4 top-4 sm:right-6 sm:top-6 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
          onClick={handleClose}
        >
          <X className="h-5 w-5 sm:h-6 sm:w-6" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>

        <div className="flex flex-col items-center text-center">
          {/* Images at top */}
          <div className="flex items-center justify-center gap-6 sm:gap-8 mb-8 sm:mb-12">
            <Image
              src="/PopupAssets/Hand BTC.svg"
              alt="Bitcoin in hand"
              className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40"
              width={160}
              height={160}
              priority
            />
            <Image
              src="/PopupAssets/BTC plant.svg"
              alt="Bitcoin plant"
              className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40"
              width={160}
              height={160}
              priority
            />
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight mb-6">
            <span className="text-gradient-mezo-cosmic">
              {dict.welcomePopup.title}
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base md:text-lg text-foreground font-medium max-w-2xl mx-auto mb-8 sm:mb-10">
            {dict.welcomePopup.subtitle}
          </p>

          {/* CTA Button */}
          <button
            onClick={handleEnterToWin}
            className="group relative px-8 py-3 sm:px-10 sm:py-4 bg-foreground text-background rounded-full font-medium text-base sm:text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-foreground/20 active:scale-95"
          >
            <span className="relative z-10">{dict.welcomePopup.cta}</span>
          </button>
        </div>
      </CustomDialogContent>
    </Dialog>
  );
};
