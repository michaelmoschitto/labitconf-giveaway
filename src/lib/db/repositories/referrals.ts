import "server-only";
import { supabaseAdmin } from "@/lib/db/client";

import type { Database } from "@/lib/db/types";

export type CreditReferralArgs =
  Database["public"]["Functions"]["credit_referral"]["Args"];
export type CreditSocialShareArgs =
  Database["public"]["Functions"]["credit_social_share"]["Args"];
export type ReferralResult =
  Database["public"]["Functions"]["credit_referral"]["Returns"];

export const creditReferral = async (
  args: CreditReferralArgs,
): Promise<ReferralResult> => {
  const { data, error } = await supabaseAdmin.rpc("credit_referral", args);

  if (error) {
    throw new Error(`Failed to credit referral: ${error.message}`);
  }

  return data;
};

export const creditSocialShare = async (
  args: CreditSocialShareArgs,
): Promise<ReferralResult> => {
  const { data, error } = await supabaseAdmin.rpc("credit_social_share", args);

  if (error) {
    throw new Error(`Failed to credit social share: ${error.message}`);
  }

  return data;
};
