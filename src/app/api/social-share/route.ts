import { NextRequest } from "next/server";

import {
  rateLimitResponse,
  secureErrorResponse,
  secureJsonResponse,
} from "@/lib/api-security";
import * as referrals from "@/lib/db/repositories/referrals";
import { checkRateLimit, getClientIP, RateLimits } from "@/lib/rate-limit";

export const POST = async (request: NextRequest) => {
  const clientIP = getClientIP(request);
  const rateLimit = checkRateLimit(clientIP, RateLimits.SOCIAL_SHARE);

  if (!rateLimit.allowed) {
    return rateLimitResponse(request, rateLimit.resetAt);
  }

  try {
    const body = await request.json();
    const { wallet_address } = body;

    if (!wallet_address) {
      return secureErrorResponse(
        {
          message: "Wallet address required",
          code: "MISSING_WALLET",
          status: 400,
        },
        request,
      );
    }

    const result = await referrals.creditSocialShare({
      user_wallet: wallet_address,
      bonus: 3,
    });

    if (!result.success) {
      return secureErrorResponse(
        {
          message: result.error || "Failed to credit social share",
          code: "SOCIAL_SHARE_ERROR",
          status: 500,
        },
        request,
      );
    }

    return secureJsonResponse(
      {
        success: true,
        entries_added: 3,
      },
      request,
    );
  } catch (error) {
    console.error("Social share credit error:", error);

    if (
      error instanceof Error &&
      error.message.includes("already received social share bonus")
    ) {
      return secureErrorResponse(
        {
          message: "Social share bonus already claimed",
          code: "DUPLICATE_SOCIAL_SHARE",
          status: 400,
        },
        request,
      );
    }

    return secureErrorResponse(
      {
        message: "Failed to credit social share",
        code: "SOCIAL_SHARE_ERROR",
        status: 500,
      },
      request,
    );
  }
};
