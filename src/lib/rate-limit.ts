/**
 * Rate Limiting Utility
 *
 * Implements in-memory rate limiting for API routes.
 * Tracks requests by IP address and enforces configurable limits.
 *
 * Note: This is a simple in-memory implementation suitable for serverless
 * environments with moderate traffic. For high-traffic applications,
 * consider using a distributed solution like Upstash Redis.
 */

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests allowed in the time window
}

interface RequestLog {
  timestamps: number[];
  windowStart: number;
}

// In-memory store for rate limit tracking
const requestStore = new Map<string, RequestLog>();

// Cleanup interval - remove old entries every 5 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

const cleanupOldEntries = () => {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) {
    return;
  }

  const cutoffTime = now - 60 * 60 * 1000; // Remove entries older than 1 hour
  for (const [key, log] of requestStore.entries()) {
    if (log.windowStart < cutoffTime) {
      requestStore.delete(key);
    }
  }

  lastCleanup = now;
};

/**
 * Check if a request should be rate limited
 *
 * @param identifier - Unique identifier for the request (usually IP address)
 * @param config - Rate limit configuration
 * @returns Object with allowed status and retry information
 */
export const checkRateLimit = (
  identifier: string,
  config: RateLimitConfig,
): {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  limit: number;
} => {
  cleanupOldEntries();

  const now = Date.now();
  const windowStart = now - config.windowMs;

  let log = requestStore.get(identifier);

  if (!log) {
    // First request from this identifier
    log = {
      timestamps: [now],
      windowStart: now,
    };
    requestStore.set(identifier, log);

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: new Date(now + config.windowMs),
      limit: config.maxRequests,
    };
  }

  // Filter out timestamps outside the current window
  log.timestamps = log.timestamps.filter((ts) => ts > windowStart);

  // Update window start
  if (log.timestamps.length === 0) {
    log.windowStart = now;
  } else {
    log.windowStart = log.timestamps[0];
  }

  const requestCount = log.timestamps.length;
  const allowed = requestCount < config.maxRequests;

  if (allowed) {
    log.timestamps.push(now);
  }

  const resetAt = new Date(log.windowStart + config.windowMs);

  return {
    allowed,
    remaining: Math.max(
      0,
      config.maxRequests - requestCount - (allowed ? 1 : 0),
    ),
    resetAt,
    limit: config.maxRequests,
  };
};

/**
 * Rate limit configurations for different endpoints
 *
 * Limits are relaxed because:
 * - Uniqueness is enforced at DB level (one wallet per entry)
 * - Mezo API verification will be added
 * - Main goal is to prevent DOS attacks, not legitimate retries
 */
export const RateLimits = {
  // POST /api/entries - 50 requests per hour per IP
  // Generous since DB enforces wallet uniqueness
  ENTRIES: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 50,
  },

  // POST /api/social-share - 10 requests per minute per IP
  // Prevents DoS while allowing legitimate retry attempts
  SOCIAL_SHARE: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
  },

  // GET /api/leaderboard - 200 requests per minute
  // Public data, allow frequent polling
  LEADERBOARD: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 200,
  },

  // GET /api/leaderboard/position - 100 requests per minute
  // User checking their own position frequently
  POSITION: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
  },
} as const;

/**
 * Extract IP address from Next.js request
 *
 * Checks various headers in order of preference:
 * 1. x-real-ip (set by some proxies)
 * 2. x-forwarded-for (standard proxy header, takes first IP)
 * 3. Falls back to 'unknown' if no IP found
 */
export const getClientIP = (request: Request): string => {
  const headers = request.headers;

  // Check x-real-ip header
  const realIP = headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  // Check x-forwarded-for header (may contain multiple IPs)
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    // Take the first IP in the list
    return forwardedFor.split(",")[0].trim();
  }

  // Fallback
  return "unknown";
};

/**
 * Clear all rate limit data (useful for testing)
 */
export const clearRateLimitStore = () => {
  requestStore.clear();
  lastCleanup = Date.now();
};
