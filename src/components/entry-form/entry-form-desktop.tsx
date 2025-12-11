"use client";

import {
  AlertTriangle,
  Check,
  Copy,
  ExternalLink,
  Loader2,
  Share2,
  X,
} from "lucide-react";
import Image from "next/image";

import { useEntryForm } from "@/components/entry-form/use-entry-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { clearReferralCookie } from "@/lib/cookies";
import { parseReferralCodeFromUrl, validateReferralCode } from "@/lib/referral";
import { cn } from "@/lib/utils";

import type { EntryFormComponentProps } from "@/components/entry-form/types";

export const EntryFormDesktop = ({ dict, lang }: EntryFormComponentProps) => {
  const {
    walletAddress,
    setWalletAddress,
    email,
    setEmail,
    telegram,
    setTelegram,
    error,
    validationState,
    emailValidationState,
    emailError,
    isSubmitting,
    isSuccessOpen,
    setIsSuccessOpen,
    formData,
    isCopied,
    referralLink,
    referralCodeFromCookie,
    setReferralCodeFromCookie,
    manualReferralCode,
    setManualReferralCode,
    referralCodeError,
    setReferralCodeError,
    isMezoValidated,
    checksumWarning,
    handleSubmit,
    handleCopyLink,
    handleShareOnX,
    handleViewLeaderboard,
    handleWalletBlur,
  } = useEntryForm(dict, lang);

  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">
      {/* Floating Elements - Mix of Bitcoin & Mezo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-32 left-12 opacity-12"
          style={{
            transform: "rotate(-25deg)",
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
          className="absolute bottom-32 right-8 text-6xl opacity-12"
          style={{ transform: "rotate(40deg)" }}
        >
          ₿
        </div>
        <div
          className="absolute top-20 right-24 opacity-12"
          style={{ transform: "rotate(-15deg)", width: "80px", height: "80px" }}
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
          className="absolute bottom-16 left-20 text-6xl opacity-12"
          style={{ transform: "rotate(25deg)" }}
        >
          ₿
        </div>
      </div>

      <div className="container mx-auto px-6 max-w-2xl relative z-10">
        <div className="text-center mb-6">
          <h2 className="text-5xl md:text-6xl font-medium tracking-tight mb-3">
            <span className="text-mezo-red">{dict.form.confirmYourEntry}</span>
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Form Container */}
          <div className="bg-foreground/[0.02] backdrop-blur-sm rounded-3xl p-6 space-y-4 border border-border">
            {/* Wallet Address */}
            <div className="space-y-2">
              <Label
                htmlFor="wallet"
                className="text-sm uppercase tracking-wider text-muted-foreground/60 font-medium"
              >
                {dict.form.walletAddressLabel}
              </Label>
              <div
                className={cn(
                  "relative rounded-md transition-all duration-300",
                  validationState === "valid" &&
                    "p-[1px] bg-gradient-to-r from-[#FF0066] via-[#FF0033] to-[#FF0000]",
                  validationState === "invalid" && "p-[1px] bg-red-500/20",
                  (validationState === "idle" ||
                    validationState === "validating") &&
                    "p-[1px] bg-border",
                )}
              >
                <input
                  id="wallet"
                  type="text"
                  name="wallet-address"
                  autoComplete="username"
                  placeholder={dict.form.walletAddress}
                  value={walletAddress}
                  onChange={(e) => {
                    setWalletAddress(e.target.value);
                  }}
                  onBlur={handleWalletBlur}
                  className="w-full h-12 px-3 pr-12 text-base input-background border-0 rounded-md transition-all duration-300 placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 [&:-webkit-autofill]:[-webkit-text-security:none]"
                  disabled={isSubmitting}
                  aria-invalid={validationState === "invalid"}
                  aria-describedby={error ? "wallet-error" : undefined}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {validationState === "validating" && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/40" />
                  )}
                  {validationState === "valid" && (
                    <Check className="h-4 w-4 text-mezo-red" />
                  )}
                  {validationState === "invalid" && walletAddress && (
                    <X className="h-4 w-4 text-red-500/40" />
                  )}
                </div>
              </div>
              {error && (
                <p
                  id="wallet-error"
                  className="text-xs text-red-400/70"
                  role="alert"
                >
                  {error}
                </p>
              )}
              {checksumWarning && !error && (
                <p
                  className="text-xs text-orange-500/70 flex items-center gap-1"
                  role="alert"
                >
                  <AlertTriangle className="h-3 w-3" />
                  {checksumWarning}
                </p>
              )}
            </div>

            {/* Email Address */}
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm uppercase tracking-wider text-muted-foreground/60 font-medium"
              >
                {dict.form.emailLabel}
              </Label>
              <div
                className={cn(
                  "relative rounded-md transition-all duration-300",
                  emailValidationState === "valid" &&
                    "p-[1px] bg-gradient-to-r from-[#FF0066] via-[#FF0033] to-[#FF0000]",
                  emailValidationState === "invalid" && "p-[1px] bg-red-500/20",
                  (emailValidationState === "idle" ||
                    emailValidationState === "validating") &&
                    "p-[1px] bg-border",
                )}
              >
                <input
                  id="email"
                  type="email"
                  placeholder={dict.form.emailPlaceholder}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                  }}
                  className="w-full h-12 px-3 pr-12 text-base input-background border-0 rounded-md placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isSubmitting}
                  aria-invalid={emailValidationState === "invalid"}
                  aria-describedby={emailError ? "email-error" : undefined}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {emailValidationState === "validating" && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/40" />
                  )}
                  {emailValidationState === "valid" && (
                    <Check className="h-4 w-4 text-mezo-red" />
                  )}
                  {emailValidationState === "invalid" && email && (
                    <X className="h-4 w-4 text-red-500/40" />
                  )}
                </div>
              </div>
              {emailError && (
                <p
                  id="email-error"
                  className="text-xs text-red-400/70"
                  role="alert"
                >
                  {emailError}
                </p>
              )}
            </div>

            {/* Telegram */}
            <div className="space-y-2">
              <Label
                htmlFor="telegram"
                className="text-sm uppercase tracking-wider text-muted-foreground/60 font-medium"
              >
                {dict.form.telegramLabel}
              </Label>
              <div className="relative rounded-md p-[1px] bg-border transition-all duration-300">
                <input
                  id="telegram"
                  type="text"
                  placeholder={dict.form.telegramPlaceholder}
                  value={telegram}
                  onChange={(e) => {
                    setTelegram(e.target.value);
                  }}
                  className="w-full h-12 px-3 text-base input-background border-0 rounded-md placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Referral Code */}
            <div className="space-y-2">
              <Label
                htmlFor="referral"
                className="text-sm uppercase tracking-wider text-muted-foreground/60 font-medium"
              >
                {dict.form.haveReferralCode}
              </Label>
              <div className="relative rounded-md p-[1px] bg-border transition-all duration-300">
                <input
                  id="referral"
                  type="text"
                  placeholder={dict.form.referralCodePlaceholder}
                  value={manualReferralCode}
                  onChange={(e) => {
                    const value = e.target.value;
                    setManualReferralCode(value);
                    setReferralCodeError("");

                    if (!value) {
                      clearReferralCookie();
                      setReferralCodeFromCookie(null);
                    }
                  }}
                  onBlur={(e) => {
                    const value = e.target.value;
                    if (value && !validateReferralCode(value)) {
                      setReferralCodeError(dict.form.invalidReferralCodeFormat);
                    }
                  }}
                  onPaste={(e) => {
                    const pastedText = e.clipboardData.getData("text");
                    const parsedCode = parseReferralCodeFromUrl(pastedText);
                    const truncatedCode = parsedCode.slice(0, 9);
                    e.preventDefault();
                    setManualReferralCode(truncatedCode);
                    setReferralCodeError("");

                    if (truncatedCode && !validateReferralCode(truncatedCode)) {
                      setReferralCodeError(dict.form.invalidReferralCodeFormat);
                    }
                  }}
                  maxLength={9}
                  className="w-full h-12 px-3 text-base input-background border-0 rounded-md placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isSubmitting}
                />
              </div>
              {referralCodeFromCookie && (
                <p className="text-xs text-mezo-red flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  {dict.form.referralCodeFromLink}: {referralCodeFromCookie}
                </p>
              )}
              {referralCodeError && (
                <p className="text-xs text-red-400/70" role="alert">
                  {referralCodeError}
                </p>
              )}
            </div>

            {/* Create Mezo Wallet CTA - Prominent Button */}
            <div className="space-y-3">
              <p className="text-sm text-center text-white/60">
                {dict.form.dontHaveWallet}
              </p>
              <a
                href="https://mezo.org/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (validationState === "valid") {
                    e.preventDefault();
                  }
                }}
                className={cn(
                  "block w-full h-14 text-base font-medium transition-all duration-300",
                  "flex items-center justify-center gap-2",
                  "rounded-[4px] text-white hover:scale-[1.01] bg-mezo-red hover:bg-mezo-red-hover",
                  validationState === "valid" &&
                    "opacity-40 cursor-not-allowed pointer-events-none",
                )}
              >
                {dict.form.createWalletHere}
                <ExternalLink className="h-5 w-5" />
              </a>
            </div>

            {/* Submit Button */}
            <div className="pt-0">
              <Button
                type="submit"
                size="lg"
                disabled={
                  isSubmitting ||
                  validationState !== "valid" ||
                  !isMezoValidated ||
                  emailValidationState !== "valid" ||
                  !!referralCodeError
                }
                className={cn(
                  "w-full h-14 text-base font-medium transition-all duration-300",
                  "rounded-[4px] text-white bg-mezo-red hover:bg-mezo-red-hover",
                  "disabled:opacity-30 disabled:cursor-not-allowed",
                )}
              >
                {isSubmitting
                  ? dict.form.submittingEntry
                  : manualReferralCode
                    ? `${dict.form.confirmEntryWithReflink} ${manualReferralCode}`
                    : dict.form.confirmEntry}
              </Button>
            </div>

            {/* Privacy Policy Link */}
            <div className="pt-4 text-center">
              <p className="text-xs text-muted-foreground">
                {dict.form.privacyPolicy}{" "}
                <a
                  href="https://mezo.org/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-mezo-red hover:underline"
                >
                  {dict.form.privacyPolicyLink}
                </a>
              </p>
            </div>
          </div>
        </form>
      </div>

      {/* Success Modal */}
      <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
        <DialogContent className="sm:max-w-lg border-2 border-border bg-background">
          <DialogHeader className="space-y-6 text-center">
            <DialogTitle className="text-4xl font-medium">
              <span className="text-mezo-red">{dict.form.successTitle}</span>
            </DialogTitle>
            <DialogDescription className="text-lg text-muted-foreground">
              {dict.form.successDescription}
            </DialogDescription>
          </DialogHeader>

          {formData && (
            <div className="space-y-8 py-6">
              {/* Current Stats */}
              <div className="flex justify-center gap-16 py-8 bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl">
                <div className="text-center">
                  <p className="text-sm uppercase tracking-wider text-muted-foreground mb-3">
                    {dict.form.currentPosition}
                  </p>
                  <p className="text-5xl font-bold text-mezo-red">
                    #{formData.position}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm uppercase tracking-wider text-muted-foreground mb-3">
                    {dict.form.totalEntries}
                  </p>
                  <p className="text-5xl font-bold text-mezo-red">
                    {formData.totalEntries}
                  </p>
                </div>
              </div>

              {/* Deposit Info */}
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  {dict.form.depositInfo}
                </p>
              </div>

              {/* Invite Friends */}
              <div className="space-y-4">
                <div>
                  <p className="font-medium text-base mb-1 text-foreground">
                    {dict.form.inviteFriends}
                  </p>
                  <p className="text-sm text-mezo-red">
                    {dict.form.inviteFriendsBonus}
                  </p>
                </div>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={referralLink}
                    className="flex-1 h-10 px-3 font-mono text-xs bg-foreground/5 border-0 rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-mezo-red/20"
                  />
                  <Button
                    onClick={handleCopyLink}
                    variant="outline"
                    size="icon"
                    className="shrink-0 border-0 bg-foreground/5 hover:bg-foreground/10"
                    aria-label={dict.form.copyLink}
                  >
                    {isCopied ? (
                      <Check className="h-4 w-4 text-mezo-red" />
                    ) : (
                      <Copy className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {isCopied && (
                  <p className="text-xs text-mezo-red">
                    {dict.form.linkCopied}
                  </p>
                )}
              </div>

              {/* Share on X */}
              <div className="space-y-4">
                <div>
                  <p className="font-medium text-base mb-1 text-foreground">
                    {dict.form.shareOnX}
                  </p>
                  <p className="text-sm text-mezo-red">
                    {dict.form.shareOnXBonus}
                  </p>
                </div>
                <Button
                  onClick={handleShareOnX}
                  variant="outline"
                  className="w-full border-0 bg-foreground/5 hover:bg-foreground/10 h-12 text-foreground"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  {dict.form.shareOnX}
                </Button>
              </div>

              {/* View Leaderboard */}
              <Button
                onClick={handleViewLeaderboard}
                size="lg"
                className={cn(
                  "w-full h-14 text-base font-bold mt-8",
                  "text-white rounded-[4px] bg-mezo-red hover:bg-mezo-red-hover",
                )}
              >
                {dict.form.viewLeaderboard}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};
