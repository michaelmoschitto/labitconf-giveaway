import { NextRequest, NextResponse } from "next/server";

import { normalizeAddress } from "@/lib/address-utils";
import {
  handleCorsPrelight,
  rateLimitResponse,
  secureErrorResponse,
  secureJsonResponse,
} from "@/lib/api-security";
import * as entries from "@/lib/db/repositories/entries";
import * as leaderboard from "@/lib/db/repositories/leaderboard";
import * as referrals from "@/lib/db/repositories/referrals";
import { checkRateLimit, getClientIP, RateLimits } from "@/lib/rate-limit";
import {
  generateReferralCode,
  isSpecialReferralCode,
  validateWalletAddress,
} from "@/lib/referral";

interface CreateEntryRequest {
  wallet_address: string;
  email: string;
  referral_code?: string;
  labitconf_code?: string;
  telegram?: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  code: string;
  resetAt: string;
}

export interface SuccessResponse {
  success: true;
  entry: {
    wallet_address: string;
    referral_code: string;
    total_entries: number;
    position: number;
    referred_by_code: string | null;
  };
}

export const OPTIONS = async (request: NextRequest) => {
  return handleCorsPrelight(request) || new NextResponse(null, { status: 204 });
};

export const POST = async (
  request: NextRequest,
): Promise<NextResponse<SuccessResponse | ErrorResponse>> => {
  try {
    // Check rate limit
    const clientIP = getClientIP(request);
    const rateLimit = checkRateLimit(clientIP, RateLimits.ENTRIES);

    if (!rateLimit.allowed) {
      return rateLimitResponse<ErrorResponse>(request, rateLimit.resetAt);
    }

    // Parse JSON body with error handling
    let body: CreateEntryRequest;
    try {
      body = (await request.json()) as CreateEntryRequest;
    } catch {
      return secureErrorResponse<ErrorResponse>(
        {
          message: "Invalid request body. Please provide valid JSON.",
          code: "INVALID_JSON",
          status: 400,
        },
        request,
      );
    }
    const { wallet_address, email, referral_code, labitconf_code, telegram } =
      body;

    if (!wallet_address) {
      return secureErrorResponse<ErrorResponse>(
        {
          message: "Wallet address is required",
          code: "MISSING_WALLET",
          status: 400,
        },
        request,
      );
    }

    if (!email) {
      return secureErrorResponse<ErrorResponse>(
        {
          message: "Email address is required",
          code: "MISSING_EMAIL",
          status: 400,
        },
        request,
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return secureErrorResponse<ErrorResponse>(
        {
          message: "Invalid email address format",
          code: "INVALID_EMAIL_FORMAT",
          status: 400,
        },
        request,
      );
    }

    if (!validateWalletAddress(wallet_address)) {
      return secureErrorResponse<ErrorResponse>(
        {
          message:
            "Invalid wallet address format. Please enter a valid Ethereum or Bitcoin address",
          code: "INVALID_WALLET_FORMAT",
          status: 400,
        },
        request,
      );
    }

    const normalizedWalletAddress = normalizeAddress(wallet_address);

    const existingEntry = await entries.getByWallet(normalizedWalletAddress);
    if (existingEntry) {
      return secureErrorResponse<ErrorResponse>(
        {
          message: "This wallet address has already been registered",
          code: "DUPLICATE_WALLET",
          status: 409,
        },
        request,
      );
    }

    let referredByCode: string | undefined;
    let referrerEntry: entries.GiveawayEntry | null = null;

    if (referral_code) {
      if (isSpecialReferralCode(referral_code)) {
        referredByCode = referral_code;
      } else {
        // Normal referral code - must exist in database
        referrerEntry = await entries.getByReferralCode(referral_code);

        if (!referrerEntry) {
          return secureErrorResponse<ErrorResponse>(
            {
              message: "Referral code not found",
              code: "INVALID_REFERRAL_CODE",
              status: 404,
            },
            request,
          );
        }

        if (referrerEntry.walletAddress === normalizedWalletAddress) {
          return secureErrorResponse<ErrorResponse>(
            {
              message: "You cannot use your own referral code",
              code: "SELF_REFERRAL",
              status: 422,
            },
            request,
          );
        }

        referredByCode = referral_code;
      }
    }

    const newReferralCode = await generateReferralCode(normalizedWalletAddress);

    const baseEntries = referredByCode ? 3 : 1;

    const newEntry = await entries.create(
      normalizedWalletAddress,
      email,
      newReferralCode,
      referredByCode,
      labitconf_code,
      telegram,
      baseEntries,
    );

    if (referredByCode && referrerEntry) {
      await referrals.creditReferral({
        referrer_code: referredByCode,
        new_user_wallet: normalizedWalletAddress,
        referrer_bonus: 5,
        new_user_bonus: 0,
      });
    }

    const positionData = await leaderboard.getUserPosition(
      normalizedWalletAddress,
    );
    const position = positionData?.rank ?? 0;
    const totalEntries = positionData?.total_entries ?? 1;

    return secureJsonResponse<SuccessResponse>(
      {
        success: true,
        entry: {
          wallet_address: newEntry.walletAddress,
          referral_code: newEntry.referralCode,
          total_entries: totalEntries,
          position,
          referred_by_code: newEntry.referredByCode,
        },
      },
      request,
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating entry:", error);

    return secureErrorResponse<ErrorResponse>(
      {
        message: "An unexpected error occurred while creating your entry",
        code: "INTERNAL_ERROR",
        status: 500,
      },
      request,
    );
  }
};
