"use client";

import { Loader2, Search, X } from "lucide-react";
import { useEffect, useState } from "react";

import { validateAddress } from "@/lib/address-utils";
import { cn } from "@/lib/utils";

interface WalletSearchProps {
  onWalletFound: (wallet: string) => void;
  onWalletNotFound: () => void;
  dict: {
    searchPlaceholder: string;
    notFound: string;
  };
}

const validateWalletAddress = (address: string): boolean => {
  return validateAddress(address);
};

export const WalletSearch = ({
  onWalletFound,
  onWalletNotFound,
  dict,
}: WalletSearchProps) => {
  const [searchValue, setSearchValue] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");
  const [validationState, setValidationState] = useState<
    "idle" | "validating" | "valid" | "invalid"
  >("idle");

  useEffect(() => {
    if (!searchValue) {
      setValidationState("idle");
      setError("");
      return;
    }

    setValidationState("validating");
    setError("");

    const timeoutId = setTimeout(async () => {
      if (!validateWalletAddress(searchValue)) {
        setValidationState("invalid");
        return;
      }

      setValidationState("valid");
      setIsSearching(true);

      try {
        const response = await fetch(
          `/api/leaderboard/position?wallet=${searchValue}`,
        );
        const data = await response.json();

        if (data.success && data.data) {
          onWalletFound(searchValue.toLowerCase());
        } else {
          setError(dict.notFound);
          onWalletNotFound();
        }
      } catch (err) {
        console.error("Search error:", err);
        setError(dict.notFound);
        onWalletNotFound();
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchValue, dict, onWalletFound, onWalletNotFound]);

  const handleClear = () => {
    setSearchValue("");
    setError("");
    setValidationState("idle");
    onWalletNotFound();
  };

  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      <div
        className={cn(
          "relative rounded-md transition-all duration-300",
          validationState === "valid" &&
            "p-[1px] bg-gradient-to-r from-[#FF0066] via-[#FF0033] to-[#FF0000]",
          validationState === "invalid" && "p-[1px] bg-red-500/20",
          (validationState === "idle" || validationState === "validating") &&
            "p-[1px] bg-border",
        )}
      >
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground/60" />
          </div>

          <input
            type="text"
            placeholder={dict.searchPlaceholder}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-full h-12 pl-10 pr-10 text-sm input-background border-0 rounded-md placeholder:text-muted-foreground focus:outline-none"
          />

          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isSearching || validationState === "validating" ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/40" />
            ) : searchValue ? (
              <button
                onClick={handleClear}
                className="text-muted-foreground/60 hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-400/70 mt-2 text-center" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};
