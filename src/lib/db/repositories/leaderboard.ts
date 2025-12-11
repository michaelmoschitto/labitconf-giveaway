import "server-only";
import { normalizeAddress } from "@/lib/address-utils";
import { supabasePublic } from "@/lib/db/client";

import type { Database } from "@/lib/db/types";

export type LeaderboardEntry =
  Database["public"]["Functions"]["get_leaderboard"]["Returns"][number];
export type UserPosition =
  Database["public"]["Functions"]["get_user_position"]["Returns"][number];

export const getLeaderboard = async (
  limit: number = 10,
): Promise<LeaderboardEntry[]> => {
  const { data, error } = await supabasePublic.rpc("get_leaderboard", {
    limit_count: limit,
  });

  if (error) {
    throw new Error(`Failed to fetch leaderboard: ${error.message}`);
  }

  return data ?? [];
};

export const getUserPosition = async (
  walletAddress: string,
): Promise<UserPosition | null> => {
  const normalizedAddress = normalizeAddress(walletAddress);

  const { data, error } = await supabasePublic.rpc("get_user_position", {
    user_wallet: normalizedAddress,
  });

  if (error) {
    throw new Error(`Failed to fetch user position: ${error.message}`);
  }

  return data?.[0] ?? null;
};
