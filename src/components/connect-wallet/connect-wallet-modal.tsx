"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { normalizeAddress } from "@/lib/address-utils";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    refreshLeaderboard?: (address: string) => void;
  }
}

interface ConnectWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  dict: {
    title: string;
    walletLabel: string;
    walletPlaceholder: string;
    connect: string;
    cancel: string;
    walletNotFound: string;
    enterWallet: string;
    checkingWallet: string;
  };
}

const ConnectWalletModal = ({
  isOpen,
  onClose,
  dict,
}: ConnectWalletModalProps) => {
  const [walletAddress, setWalletAddress] = useState("");
  const [error, setError] = useState("");
  const [isChecking, setIsChecking] = useState(false);

  const scrollToLeaderboard = () => {
    const element = document.getElementById("leaderboard");
    if (element) {
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

  const handleConnect = async () => {
    setError("");

    if (!walletAddress.trim()) {
      setError(dict.enterWallet);
      return;
    }

    setIsChecking(true);

    try {
      const normalizedAddress = normalizeAddress(walletAddress);
      const response = await fetch(
        `/api/entries/check?wallet=${encodeURIComponent(normalizedAddress)}`,
      );

      if (!response.ok) {
        setError(dict.walletNotFound);
        return;
      }

      const data = await response.json();

      if (!data.exists) {
        setError(dict.walletNotFound);
        return;
      }

      if (window.refreshLeaderboard) {
        window.refreshLeaderboard(normalizedAddress);
      }

      handleClose();
      setTimeout(() => {
        scrollToLeaderboard();
      }, 300);
    } catch (err) {
      console.error("Error checking wallet:", err);
      setError(dict.walletNotFound);
    } finally {
      setIsChecking(false);
    }
  };

  const handleClose = () => {
    setWalletAddress("");
    setError("");
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isChecking) {
      handleConnect();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-lg rounded-3xl border-2 border-border bg-background p-6 sm:p-8">
        <DialogHeader className="space-y-4 mb-6">
          <DialogTitle className="text-3xl sm:text-4xl font-medium tracking-tight">
            <span className="text-gradient-mezo-cosmic">{dict.title}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label
              htmlFor="wallet-connect"
              className="text-sm uppercase tracking-wider text-muted-foreground/60 font-medium"
            >
              {dict.walletLabel}
            </Label>
            <div className="relative rounded-md p-[1px] bg-border transition-all duration-300">
              <input
                id="wallet-connect"
                type="text"
                placeholder={dict.walletPlaceholder}
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full h-12 px-3 pr-12 text-base input-background border-0 rounded-md placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isChecking}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isChecking && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/40" />
                )}
              </div>
            </div>
            {error && (
              <p className="text-xs text-red-400/70" role="alert">
                {error}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <Button
              onClick={handleConnect}
              disabled={isChecking}
              className={cn(
                "w-full h-14 text-base font-medium transition-all duration-300",
                "!bg-foreground hover:!bg-foreground/90 !text-background rounded-full",
                "disabled:opacity-30 disabled:cursor-not-allowed hover:scale-[1.01]",
              )}
            >
              {isChecking ? dict.checkingWallet : dict.connect}
            </Button>
            {!isChecking && (
              <button
                type="button"
                onClick={handleClose}
                className="text-sm text-muted-foreground/60 hover:text-muted-foreground transition-colors"
              >
                {dict.cancel}
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export { ConnectWalletModal };
