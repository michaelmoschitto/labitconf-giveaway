export * as entries from "@/lib/db/repositories/entries";
export * as leaderboard from "@/lib/db/repositories/leaderboard";
export * as referrals from "@/lib/db/repositories/referrals";

export type {
  GiveawayEntry,
  NewGiveawayEntry,
} from "@/lib/db/repositories/entries";
export type {
  LeaderboardEntry,
  UserPosition,
} from "@/lib/db/repositories/leaderboard";
export type {
  CreditReferralArgs,
  CreditSocialShareArgs,
  ReferralResult,
} from "@/lib/db/repositories/referrals";
