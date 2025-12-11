import { NextRequest, NextResponse } from "next/server";

import { normalizeAddress } from "@/lib/address-utils";
import {
  handleCorsPrelight,
  rateLimitResponse,
  secureErrorResponse,
  secureJsonResponse,
} from "@/lib/api-security";
import * as entries from "@/lib/db/repositories/entries";
import { checkRateLimit, getClientIP, RateLimits } from "@/lib/rate-limit";
import { validateWalletAddress } from "@/lib/referral";

interface CheckWalletResponse {
  exists: boolean;
  wallet_address: string;
}

interface ErrorResponse {
  success: false;
  error: string;
  code: string;
  resetAt: string;
}

export const OPTIONS = async (request: NextRequest) => {
  return handleCorsPrelight(request) || new NextResponse(null, { status: 204 });
};

export const GET = async (
  request: NextRequest,
): Promise<NextResponse<CheckWalletResponse | ErrorResponse>> => {
  try {
    // Check rate limit
    const clientIP = getClientIP(request);
    const rateLimit = checkRateLimit(clientIP, RateLimits.LEADERBOARD);

    if (!rateLimit.allowed) {
      return rateLimitResponse<ErrorResponse>(request, rateLimit.resetAt);
    }

    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get("wallet");

    if (!walletAddress) {
      return secureErrorResponse<ErrorResponse>(
        {
          message: "Wallet address is required",
          code: "MISSING_WALLET",
          status: 400,
        },
        request,
      );
    }

    if (!validateWalletAddress(walletAddress)) {
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

    const normalizedWalletAddress = normalizeAddress(walletAddress);

    const existingEntry = await entries.getByWallet(normalizedWalletAddress);

    return secureJsonResponse<CheckWalletResponse>(
      {
        exists: existingEntry !== null,
        wallet_address: normalizedWalletAddress,
      },
      request,
    );
  } catch (error) {
    console.error("Error checking wallet:", error);

    return secureErrorResponse<ErrorResponse>(
      {
        message: "An unexpected error occurred while checking the wallet",
        code: "INTERNAL_ERROR",
        status: 500,
      },
      request,
    );
  }
};
