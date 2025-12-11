import "server-only";
import { eq, sql } from "drizzle-orm";

import { normalizeAddress } from "@/lib/address-utils";
import { db } from "@/lib/db/client";
import { giveawayEntries } from "@/lib/db/schema";

export type GiveawayEntry = typeof giveawayEntries.$inferSelect;
export type NewGiveawayEntry = typeof giveawayEntries.$inferInsert;

export const getByWallet = async (
  walletAddress: string,
): Promise<GiveawayEntry | null> => {
  const normalizedAddress = normalizeAddress(walletAddress);

  const entries = await db
    .select()
    .from(giveawayEntries)
    .where(eq(giveawayEntries.walletAddress, normalizedAddress))
    .limit(1);

  return entries[0] ?? null;
};

export const getByReferralCode = async (
  referralCode: string,
): Promise<GiveawayEntry | null> => {
  const entries = await db
    .select()
    .from(giveawayEntries)
    .where(eq(giveawayEntries.referralCode, referralCode))
    .limit(1);

  return entries[0] ?? null;
};

export const create = async (
  walletAddress: string,
  email: string,
  referralCode: string,
  referredByCode?: string,
  labitconfCode?: string,
  telegram?: string,
  baseEntries: number = 1,
): Promise<GiveawayEntry> => {
  const [entry] = await db
    .insert(giveawayEntries)
    .values({
      walletAddress,
      email,
      referralCode,
      referredByCode: referredByCode || null,
      labitconfCode: labitconfCode || null,
      telegram: telegram || null,
      baseEntries,
    })
    .returning();

  if (!entry) {
    throw new Error("Failed to create entry");
  }

  return entry;
};

export const getTotalCount = async (): Promise<number> => {
  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(giveawayEntries);

  return result[0]?.count ?? 0;
};

export const referralCodeExists = async (
  referralCode: string,
): Promise<boolean> => {
  const entry = await getByReferralCode(referralCode);
  return entry !== null;
};
