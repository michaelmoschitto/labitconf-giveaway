import { NextRequest, NextResponse } from "next/server";

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
    // Check rate limit
    const clientIP = getClientIP(request);
    const rateLimit = checkRateLimit(clientIP, RateLimits.LEADERBOARD);

    if (!rateLimit.allowed) {
      return rateLimitResponse(request, rateLimit.resetAt);
    }

    const data = await leaderboard.getLeaderboard(10);

    return secureJsonResponse(
      {
        success: true,
        data,
        count: data.length,
      },
      request,
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
        },
      },
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return secureErrorResponse(
      {
        message: "Failed to fetch leaderboard",
        code: "LEADERBOARD_ERROR",
        status: 500,
      },
      request,
    );
  }
};
