"use client";

import { Users, Twitter, Copy, Check } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

import { WalletSearch } from "@/components/leaderboard/wallet-search";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

import type { LeaderboardEntry, UserPosition } from "@/lib/db/repositories";

interface LeaderboardSectionProps {
  dict: {
    leaderboard: {
      title: string;
      columnRank: string;
      columnAddress: string;
      columnEntries: string;
      columnBadges: string;
      noResults: string;
      referrals: string;
      socialShare: string;
      yourPosition: string;
      entry: string;
      entries: string;
      searchPlaceholder: string;
      notFound: string;
      yourReflink: string;
      linkCopied: string;
      tweetText: string;
    };
  };
  lang?: string;
  connectedWallet?: string;
}

const formatAddress = (address: string): string => {
  if (address.length < 42) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const LeaderboardSection = ({
  dict,
  lang = "en",
  connectedWallet,
}: LeaderboardSectionProps) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userPosition, setUserPosition] = useState<UserPosition | null>(null);
  const [loading, setLoading] = useState(true);
  const [trackedWallet, setTrackedWalletState] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [hasShared, setHasShared] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch("/api/leaderboard");
      const data = await response.json();
      if (data.success) {
        setLeaderboard(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async (referralLink: string) => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  };

  const handleShareOnX = () => {
    if (!userPosition || hasShared || isSharing) return;

    setIsSharing(true);

    const referralLink = `${window.location.origin}/${lang}?ref=${userPosition.referral_code}`;
    const tweetText = encodeURIComponent(
      `${dict.leaderboard.tweetText} ${referralLink}\n\n@MezoNetwork #MezoLATAM #Labitconf2025`,
    );
    window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, "_blank");

    fetch("/api/social-share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet_address: userPosition.wallet_address }),
    })
      .then((response) => {
        if (response.ok) {
          setHasShared(true);
          fetchLeaderboard();
        }
        return response.json();
      })
      .catch((error) => {
        console.error("Social share error:", error);
      })
      .finally(() => {
        setIsSharing(false);
      });
  };

  useEffect(() => {
    // Initial load - refresh on page mount
    fetchLeaderboard();

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    // Expose refresh function globally so modal and entry form can call it
    window.refreshLeaderboard = (wallet: string) => {
      console.log("Refreshing leaderboard with wallet:", wallet);
      setTrackedWalletState(wallet);
      fetchLeaderboard();
    };

    return () => {
      window.removeEventListener("resize", checkMobile);
      delete window.refreshLeaderboard;
    };
  }, []);

  useEffect(() => {
    const walletToFetch = trackedWallet || connectedWallet;
    if (!walletToFetch) return;

    console.log("Fetching position for wallet:", walletToFetch);

    const fetchUserPosition = async () => {
      try {
        const response = await fetch(
          `/api/leaderboard/position?wallet=${encodeURIComponent(walletToFetch)}`,
        );
        const data = await response.json();
        if (data.success) {
          console.log("User position found:", data.data);
          setUserPosition(data.data);
          setHasShared(data.data.social_shared);
        } else {
          console.log("Position not found yet for wallet:", walletToFetch);
          setUserPosition(null);
        }
      } catch (error) {
        console.error("Failed to fetch user position:", error);
        setUserPosition(null);
      }
    };

    fetchUserPosition();
  }, [trackedWallet, connectedWallet]);

  const topCount = isMobile ? 5 : 10;
  const displayedLeaderboard = leaderboard.slice(0, topCount);
  const userInTopN = userPosition && userPosition.rank <= topCount;

  const USER_ROW_CLASSES =
    "!bg-amber-500/5 !border-2 !border-amber-500/40 hover:!bg-amber-500/5";

  const handleWalletFound = (wallet: string) => {
    setTrackedWalletState(wallet);
  };

  const handleWalletNotFound = () => {
    setUserPosition(null);
  };

  if (loading) {
    return (
      <section className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">Loading leaderboard...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-16 right-12 opacity-12"
          style={{
            transform: "rotate(45deg)",
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
          className="absolute bottom-20 left-16 text-8xl opacity-12"
          style={{ transform: "rotate(-35deg)" }}
        >
          ₿
        </div>
        <div
          className="absolute top-60 left-24 opacity-12"
          style={{ transform: "rotate(15deg)", width: "85px", height: "85px" }}
        >
          <Image
            src="/Mezo Logo and Marks/Mezo Logo Circle.svg"
            alt=""
            width={85}
            height={85}
            className="w-full h-full"
          />
        </div>
        <div
          className="absolute top-20 left-10 text-6xl opacity-12"
          style={{ transform: "rotate(-20deg)" }}
        >
          ₿
        </div>
        <div
          className="absolute bottom-32 right-16 text-7xl opacity-12"
          style={{ transform: "rotate(25deg)" }}
        >
          ₿
        </div>
      </div>

      <div className="container mx-auto px-6 py-24 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-5xl md:text-6xl font-medium tracking-tight leading-tight mb-4">
            <span className="text-mezo-red">{dict.leaderboard.title}</span>
          </h2>
        </div>

        <WalletSearch
          onWalletFound={handleWalletFound}
          onWalletNotFound={handleWalletNotFound}
          dict={{
            searchPlaceholder: dict.leaderboard.searchPlaceholder,
            notFound: dict.leaderboard.notFound,
          }}
        />

        <div className="max-w-4xl mx-auto">
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-20 text-center">
                    {dict.leaderboard.columnRank}
                  </TableHead>
                  <TableHead>{dict.leaderboard.columnAddress}</TableHead>
                  <TableHead className="text-right">
                    {dict.leaderboard.columnEntries}
                  </TableHead>
                  <TableHead className="text-right">
                    {dict.leaderboard.columnBadges}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedLeaderboard.map((entry) => {
                  const isTrackedUser =
                    trackedWallet?.toLowerCase() ===
                    entry.wallet_address.toLowerCase();
                  const isConnectedUser =
                    connectedWallet?.toLowerCase() ===
                    entry.wallet_address.toLowerCase();
                  const isCurrentUser = isTrackedUser || isConnectedUser;

                  return (
                    <TableRow
                      key={entry.rank}
                      className={cn(
                        "hover:bg-muted/30 transition-colors",
                        isCurrentUser && USER_ROW_CLASSES,
                      )}
                    >
                      <TableCell className="text-center font-bold">
                        <span
                          className={cn(
                            isCurrentUser
                              ? "text-amber-500"
                              : entry.rank === 1
                                ? "text-amber-500"
                                : entry.rank === 2
                                  ? "text-zinc-400"
                                  : entry.rank === 3
                                    ? "text-amber-700"
                                    : "text-foreground",
                          )}
                        >
                          {entry.rank}
                        </span>
                      </TableCell>

                      <TableCell className="font-mono text-sm">
                        {formatAddress(entry.wallet_address)}
                      </TableCell>

                      <TableCell className="text-right font-bold">
                        {entry.total_entries}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-3">
                          {entry.referral_count > 0 && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Users className="w-4 h-4" />
                              <span>{entry.referral_count}</span>
                            </div>
                          )}
                          {entry.social_shared && (
                            <Twitter className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {!userInTopN && userPosition && (
                  <>
                    <TableRow className="h-2 hover:bg-transparent pointer-events-none">
                      <TableCell colSpan={4} className="p-0" />
                    </TableRow>
                    <TableRow className={USER_ROW_CLASSES}>
                      <TableCell className="text-center font-bold">
                        <span className="text-amber-500">
                          {userPosition.rank}
                        </span>
                      </TableCell>

                      <TableCell className="font-mono text-sm">
                        {formatAddress(userPosition.wallet_address)}
                      </TableCell>

                      <TableCell className="text-right font-bold">
                        {userPosition.total_entries}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-3">
                          {userPosition.referral_count > 0 && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Users className="w-4 h-4" />
                              <span>{userPosition.referral_count}</span>
                            </div>
                          )}
                          {userPosition.social_shared && (
                            <Twitter className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </div>

          {userPosition && (
            <div className="mt-8 text-center space-y-2">
              <p className="text-muted-foreground">
                {dict.leaderboard.yourPosition}:{" "}
                <span className="font-bold text-amber-500">
                  #{userPosition.rank}
                </span>{" "}
                · {userPosition.total_entries}{" "}
                {userPosition.total_entries === 1
                  ? dict.leaderboard.entry
                  : dict.leaderboard.entries}
              </p>
              <div className="flex items-center justify-center gap-2">
                <p className="text-muted-foreground text-sm">
                  {dict.leaderboard.yourReflink}:{" "}
                  <span className="font-mono text-xs text-foreground bg-muted/50 px-2 py-1 rounded break-all">
                    {typeof window !== "undefined" &&
                      `${window.location.origin}/${lang}?ref=${userPosition.referral_code}`}
                  </span>
                </p>
                <Button
                  onClick={() =>
                    handleCopyLink(
                      `${window.location.origin}/${lang}?ref=${userPosition.referral_code}`,
                    )
                  }
                  variant="outline"
                  size="icon"
                  className="shrink-0 border-0 bg-foreground/5 hover:bg-foreground/10"
                  aria-label="Copy referral link"
                >
                  {isCopied ? (
                    <Check className="h-4 w-4 text-mezo-red" />
                  ) : (
                    <Copy className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
                <Button
                  onClick={handleShareOnX}
                  variant="outline"
                  size="icon"
                  disabled={hasShared || userPosition.social_shared}
                  className={cn(
                    "shrink-0 border-0",
                    hasShared || userPosition.social_shared
                      ? "bg-foreground/5 cursor-not-allowed opacity-50"
                      : "bg-foreground/5 hover:bg-foreground/10",
                  )}
                  aria-label={
                    hasShared || userPosition.social_shared
                      ? "Already shared on X"
                      : "Share on X"
                  }
                >
                  {hasShared || userPosition.social_shared ? (
                    <Check className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Twitter className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {isCopied && (
                <p className="text-xs text-mezo-red">
                  {dict.leaderboard.linkCopied}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export { LeaderboardSection };
