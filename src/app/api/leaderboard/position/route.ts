import { NextRequest, NextResponse } from "next/server";

import { normalizeAddress } from "@/lib/address-utils";
import {
  handleCorsPrelight,
  rateLimitResponse,
  secureErrorResponse,
  secureJsonResponse,
} from "@/lib/api-security";
import { leaderboard } from "@/lib/db/repositories";
import { checkRateLimit, getClientIP, RateLimits } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export const OPTIONS = async (request: NextRequest) => {
  return handleCorsPrelight(request) || new NextResponse(null, { status: 204 });
};

export const GET = async (request: NextRequest) => {
  try {
    const clientIP = getClientIP(request);
    const rateLimit = checkRateLimit(clientIP, RateLimits.POSITION);

    if (!rateLimit.allowed) {
      return rateLimitResponse(request, rateLimit.resetAt);
    }

    const walletAddress = request.nextUrl.searchParams.get("wallet");

    if (!walletAddress) {
      return secureErrorResponse(
        {
          message: "Missing wallet address parameter",
          code: "MISSING_WALLET",
          status: 400,
        },
        request,
      );
    }

    const normalizedWalletAddress = normalizeAddress(walletAddress);
    const userPosition = await leaderboard.getUserPosition(
      normalizedWalletAddress,
    );

    if (!userPosition) {
      return secureErrorResponse(
        {
          message: "User not found",
          code: "USER_NOT_FOUND",
          status: 404,
        },
        request,
      );
    }

    return secureJsonResponse(
      {
        success: true,
        data: userPosition,
      },
      request,
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=5, stale-while-revalidate=10",
        },
      },
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return secureErrorResponse(
      {
        message: "Failed to fetch user position",
        code: "POSITION_ERROR",
        status: 500,
      },
      request,
    );
  }
};
