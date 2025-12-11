/**
 * API Security Utilities
 *
 * Provides helper functions for securing API routes including:
 * - CORS configuration
 * - Security headers
 * - Response wrappers with security headers
 */

import { NextResponse } from "next/server";

/**
 * Get allowed origins based on environment
 */
const getAllowedOrigins = (): string[] => {
  const envOrigins = process.env.ALLOWED_ORIGINS;

  // In development, allow localhost
  if (process.env.NODE_ENV === "development") {
    return [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3000",
      ...(envOrigins ? envOrigins.split(",").map((o) => o.trim()) : []),
    ];
  }

  // In production, use only configured origins
  if (envOrigins) {
    return envOrigins.split(",").map((o) => o.trim());
  }

  // Default production origin
  return ["https://labitconf-giveaway.vercel.app"];
};

/**
 * Check if origin is allowed
 */
export const isOriginAllowed = (origin: string | null): boolean => {
  if (!origin) {
    // Allow requests with no origin (like curl, Postman, server-to-server)
    return true;
  }

  const allowedOrigins = getAllowedOrigins();
  return allowedOrigins.includes(origin);
};

/**
 * Get CORS headers for a response
 */
export const getCorsHeaders = (origin: string | null): HeadersInit => {
  const headers: HeadersInit = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400", // 24 hours
  };

  if (origin && isOriginAllowed(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Credentials"] = "true";
  }

  return headers;
};

/**
 * Get security headers
 */
export const getSecurityHeaders = (): HeadersInit => {
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
  };
};

/**
 * Create a JSON response with security headers
 */
export const secureJsonResponse = <T>(
  data: T,
  request: Request,
  options?: {
    status?: number;
    headers?: HeadersInit;
  },
): NextResponse<T> => {
  const origin = request.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  const securityHeaders = getSecurityHeaders();

  const allHeaders = {
    "Content-Type": "application/json",
    ...securityHeaders,
    ...corsHeaders,
    ...(options?.headers || {}),
  };

  return NextResponse.json(data, {
    status: options?.status || 200,
    headers: allHeaders,
  });
};

/**
 * Handle CORS preflight requests
 */
export const handleCorsPrelight = (request: Request): NextResponse | null => {
  if (request.method === "OPTIONS") {
    const origin = request.headers.get("origin");

    if (!isOriginAllowed(origin)) {
      return new NextResponse(null, { status: 403 });
    }

    const corsHeaders = getCorsHeaders(origin);
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  return null;
};

/**
 * Create an error response with security headers
 */
export const secureErrorResponse = <
  T extends { success: false; error: string; code: string },
>(
  error: {
    message: string;
    code?: string;
    status?: number;
  },
  request: Request,
): NextResponse<T> => {
  return secureJsonResponse<T>(
    {
      success: false,
      error: error.message,
      code: error.code || "INTERNAL_ERROR",
    } as T,
    request,
    {
      status: error.status || 500,
    },
  );
};

/**
 * Create a rate limit exceeded response
 */
export const rateLimitResponse = <
  T extends { success: false; error: string; code: string; resetAt: string },
>(
  request: Request,
  resetAt: Date,
): NextResponse<T> => {
  const origin = request.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  const securityHeaders = getSecurityHeaders();

  return NextResponse.json(
    {
      success: false,
      error: "Too many requests. Please try again later.",
      code: "RATE_LIMIT_EXCEEDED",
      resetAt: resetAt.toISOString(),
    } as T,
    {
      status: 429,
      headers: {
        ...securityHeaders,
        ...corsHeaders,
        "Retry-After": Math.ceil(
          (resetAt.getTime() - Date.now()) / 1000,
        ).toString(),
      },
    },
  );
};
