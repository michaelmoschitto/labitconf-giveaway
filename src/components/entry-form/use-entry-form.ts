"use client";

import { useEffect, useState } from "react";

import {
  detectAddressType,
  isValidChecksum,
  normalizeAddress,
  validateAddress,
} from "@/lib/address-utils";
import { clearReferralCookie, getReferralCookie } from "@/lib/cookies";

import type { EntryFormDictionary } from "@/components/entry-form/types";

interface FormData {
  walletAddress: string;
  referralCode: string;
  position: number;
  totalEntries: number;
}

type ValidationState = "idle" | "validating" | "valid" | "invalid";

export const validateWalletAddress = (address: string): boolean => {
  return validateAddress(address);
};

export const validateEmail = (email: string): boolean => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const getValidationError = (
  address: string,
  dict: EntryFormDictionary,
): string => {
  if (!address) return "";
  if (!validateWalletAddress(address)) {
    return dict.errors.invalidWalletFormat;
  }
  return "";
};

export const validateWalletOnMezo = async (
  address: string,
): Promise<boolean> => {
  try {
    const response = await fetch(
      `/api/mezo/validate?wallet=${encodeURIComponent(address)}`,
      {
        method: "GET",
      },
    );

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.exists;
  } catch (error) {
    console.error("Error validating wallet on Mezo:", error);
    return false;
  }
};

export const checkWalletDuplicate = async (
  address: string,
): Promise<boolean> => {
  try {
    const response = await fetch(
      `/api/entries/check?wallet=${encodeURIComponent(address)}`,
      {
        method: "GET",
      },
    );
    if (!response.ok) {
      return false;
    }
    const data = await response.json();
    return data.exists;
  } catch (error) {
    console.error("Error checking wallet duplicate:", error);
    return false;
  }
};

export const useEntryForm = (dict: EntryFormDictionary, lang: string) => {
  const [walletAddress, setWalletAddress] = useState("");
  const [email, setEmail] = useState("");
  const [telegram, setTelegram] = useState("");
  const [error, setError] = useState("");
  const [validationState, setValidationState] =
    useState<ValidationState>("idle");
  const [emailValidationState, setEmailValidationState] =
    useState<ValidationState>("idle");
  const [emailError, setEmailError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [referralLink, setReferralLink] = useState("");
  const [referralCodeFromCookie, setReferralCodeFromCookie] = useState<
    string | null
  >(null);
  const [manualReferralCode, setManualReferralCode] = useState("");
  const [referralCodeError, setReferralCodeError] = useState("");
  const [labitconfCode, setLabitconfCode] = useState("");
  const [isMezoValidated, setIsMezoValidated] = useState(false);
  const [checksumWarning, setChecksumWarning] = useState("");

  // Read referral code from URL or cookie on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      // First check URL query parameter (takes precedence)
      const urlParams = new URLSearchParams(window.location.search);
      const urlRef = urlParams.get("ref");

      if (urlRef) {
        setReferralCodeFromCookie(urlRef);
        setManualReferralCode(urlRef);
        return;
      }

      // Fallback to cookie
      const cookieCode = getReferralCookie();
      if (cookieCode) {
        setReferralCodeFromCookie(cookieCode);
        setManualReferralCode(cookieCode);
      }
    }
  }, []);

  // Monitor URL changes and clear cookie if no ref= parameter
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const urlRef = urlParams.get("ref");

      if (!urlRef && referralCodeFromCookie) {
        clearReferralCookie();
        setReferralCodeFromCookie(null);
        setManualReferralCode("");
      }
    }
  }, [referralCodeFromCookie]);

  // Generate referral link when form data is available
  useEffect(() => {
    if (formData && typeof window !== "undefined") {
      setReferralLink(
        `${window.location.origin}/${lang}?ref=${formData.referralCode}`,
      );
    }
  }, [formData, lang]);

  // Validate wallet address with debounce
  useEffect(() => {
    if (!walletAddress) {
      setValidationState("idle");
      setError("");
      setIsMezoValidated(false);
      setChecksumWarning("");
      return;
    }

    setValidationState("validating");
    setError("");
    setIsMezoValidated(false);
    setChecksumWarning("");

    const timeoutId = setTimeout(() => {
      const validationError = getValidationError(walletAddress, dict);

      if (validationError) {
        setValidationState("invalid");
        setError(validationError);
      } else {
        setValidationState("valid");
        setError("");

        // Check for invalid checksum (potential typo) - only for Ethereum addresses
        const addressType = detectAddressType(walletAddress);
        if (addressType === "ethereum" && !isValidChecksum(walletAddress)) {
          setChecksumWarning(dict.errors.invalidChecksum);
        }
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [walletAddress, dict]);

  // Validate email with debounce
  useEffect(() => {
    if (!email) {
      setEmailValidationState("idle");
      setEmailError("");
      return;
    }

    setEmailValidationState("validating");
    setEmailError("");

    const timeoutId = setTimeout(() => {
      if (!validateEmail(email)) {
        setEmailValidationState("invalid");
        setEmailError(dict.errors.invalidEmail);
      } else {
        setEmailValidationState("valid");
        setEmailError("");
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [email, dict]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setEmailError("");

    if (!walletAddress.trim()) {
      setError(dict.errors.walletRequired);
      setValidationState("invalid");
      return;
    }

    if (!validateWalletAddress(walletAddress)) {
      setError(dict.errors.invalidWalletFormat);
      setValidationState("invalid");
      return;
    }

    if (!email.trim()) {
      setEmailError(dict.errors.emailRequired);
      setEmailValidationState("invalid");
      return;
    }

    if (!validateEmail(email)) {
      setEmailError(dict.errors.invalidEmail);
      setEmailValidationState("invalid");
      return;
    }

    setIsSubmitting(true);

    try {
      const normalizedAddress = normalizeAddress(walletAddress);

      const payload: {
        wallet_address: string;
        email: string;
        referral_code?: string;
        labitconf_code?: string;
        telegram?: string;
      } = {
        wallet_address: normalizedAddress,
        email: email,
      };

      const finalReferralCode = manualReferralCode || referralCodeFromCookie;
      if (finalReferralCode) {
        payload.referral_code = finalReferralCode;
      }

      if (labitconfCode.trim()) {
        payload.labitconf_code = labitconfCode.trim();
      }

      if (telegram.trim()) {
        payload.telegram = telegram.trim();
      }

      const response = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === "DUPLICATE_ENTRY") {
          setError(dict.errors.duplicateWallet);
        } else if (data.code === "INVALID_REFERRAL") {
          setError(dict.errors.invalidReferralCode);
        } else if (data.code === "SELF_REFERRAL") {
          setError(dict.errors.selfReferral);
        } else {
          setError(data.error || dict.errors.walletVerificationFailed);
        }
        return;
      }

      setFormData({
        walletAddress: data.entry.wallet_address,
        referralCode: data.entry.referral_code,
        position: data.entry.position,
        totalEntries: data.entry.total_entries,
      });

      // Clear returning user flag after successful submission
      if (typeof window !== "undefined") {
        localStorage.removeItem("mezo_returning_user");
      }

      // Refresh leaderboard after successful entry
      if (window.refreshLeaderboard) {
        window.refreshLeaderboard(data.entry.wallet_address);
      }

      setIsSuccessOpen(true);
    } catch (err) {
      console.error("Form submission error:", err);
      setError(dict.errors.networkError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = async () => {
    if (referralLink) {
      try {
        await navigator.clipboard.writeText(referralLink);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (error) {
        console.error("Failed to copy link:", error);
      }
    }
  };

  const handleShareOnX = () => {
    if (!referralLink || !formData) return;

    // Open Twitter popup immediately (synchronously) to avoid mobile popup blockers
    const tweetText = encodeURIComponent(
      `${dict.form.tweetText} ${referralLink}\n\n@MezoNetwork #MezoLATAM #Labitconf2025`,
    );
    window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, "_blank");

    // Make API call in the background without blocking the popup
    fetch("/api/social-share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet_address: formData.walletAddress }),
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        return null;
      })
      .then((data) => {
        if (data) {
          setFormData((prev) =>
            prev
              ? {
                  ...prev,
                  totalEntries: data.total_entries || prev.totalEntries + 3,
                }
              : null,
          );
        }
      })
      .catch((error) => {
        console.error("Social share error:", error);
      });
  };

  const handleViewLeaderboard = () => {
    setIsSuccessOpen(false);

    if (window.refreshLeaderboard && formData?.walletAddress) {
      window.refreshLeaderboard(formData.walletAddress);
    }

    document
      .getElementById("leaderboard")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  const handleWalletBlur = async () => {
    if (!walletAddress || validationState !== "valid") {
      return;
    }

    setValidationState("validating");
    setError("");

    // Check both Mezo validation and duplicate status in parallel
    const [existsOnMezo, isDuplicate] = await Promise.all([
      validateWalletOnMezo(walletAddress),
      checkWalletDuplicate(walletAddress),
    ]);

    // Check for duplicate first (more critical error)
    if (isDuplicate) {
      setValidationState("invalid");
      setError(dict.errors.duplicateWallet);
      setIsMezoValidated(false);
      return;
    }

    // Then check Mezo existence
    if (!existsOnMezo) {
      setValidationState("invalid");
      setError(dict.errors.walletNotFoundOnMezo);
      setIsMezoValidated(false);
      return;
    }

    // All validations passed
    setValidationState("valid");
    setError("");
    setIsMezoValidated(true);
  };

  return {
    // State
    walletAddress,
    setWalletAddress,
    email,
    setEmail,
    telegram,
    setTelegram,
    error,
    setError,
    validationState,
    emailValidationState,
    emailError,
    setEmailError,
    isSubmitting,
    isSuccessOpen,
    setIsSuccessOpen,
    formData,
    setFormData,
    isCopied,
    referralLink,
    referralCodeFromCookie,
    setReferralCodeFromCookie,
    manualReferralCode,
    setManualReferralCode,
    referralCodeError,
    setReferralCodeError,
    labitconfCode,
    setLabitconfCode,
    isMezoValidated,
    checksumWarning,
    // Handlers
    handleSubmit,
    handleCopyLink,
    handleShareOnX,
    handleViewLeaderboard,
    handleWalletBlur,
  };
};
