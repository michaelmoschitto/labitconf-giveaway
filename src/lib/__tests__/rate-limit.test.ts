/**
 * Unit tests for rate limiting functionality
 */

import { describe, it, expect, beforeEach } from "bun:test";

import {
  checkRateLimit,
  clearRateLimitStore,
  getClientIP,
  RateLimits,
} from "@/lib/rate-limit";

describe("Rate Limiter", () => {
  beforeEach(() => {
    // Clear rate limit store before each test
    clearRateLimitStore();
  });

  describe("checkRateLimit", () => {
    it("should allow first request", () => {
      const result = checkRateLimit("test-ip", RateLimits.ENTRIES);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(49); // 50 limit - 1 used
      expect(result.limit).toBe(50);
    });

    it("should track remaining requests correctly", () => {
      const ip = "test-ip-2";

      // First request
      const result1 = checkRateLimit(ip, RateLimits.ENTRIES);
      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(49);

      // Second request
      const result2 = checkRateLimit(ip, RateLimits.ENTRIES);
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(48);

      // Third request
      const result3 = checkRateLimit(ip, RateLimits.ENTRIES);
      expect(result3.allowed).toBe(true);
      expect(result3.remaining).toBe(47);
    });

    it("should block requests after limit is reached", () => {
      const ip = "test-ip-3";
      // Use a small limit for testing
      const testLimit = { windowMs: 60000, maxRequests: 3 };

      // Make 3 requests (the limit)
      checkRateLimit(ip, testLimit);
      checkRateLimit(ip, testLimit);
      checkRateLimit(ip, testLimit);

      // Fourth request should be blocked
      const result = checkRateLimit(ip, testLimit);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("should reset after time window expires", async () => {
      const ip = "test-ip-4";
      const shortWindow = { windowMs: 100, maxRequests: 2 }; // 100ms window

      // Make 2 requests (hit limit)
      checkRateLimit(ip, shortWindow);
      checkRateLimit(ip, shortWindow);

      // Third should be blocked
      let result = checkRateLimit(ip, shortWindow);
      expect(result.allowed).toBe(false);

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Should be allowed again
      result = checkRateLimit(ip, shortWindow);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(1);
    });

    it("should track different IPs independently", () => {
      const ip1 = "ip-1";
      const ip2 = "ip-2";
      // Use a small limit for testing
      const testLimit = { windowMs: 60000, maxRequests: 3 };

      // Make requests from ip1
      checkRateLimit(ip1, testLimit);
      checkRateLimit(ip1, testLimit);
      checkRateLimit(ip1, testLimit);

      // ip1 should be blocked
      const result1 = checkRateLimit(ip1, testLimit);
      expect(result1.allowed).toBe(false);

      // ip2 should still be allowed
      const result2 = checkRateLimit(ip2, testLimit);
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(2);
    });

    it("should provide correct resetAt timestamp", () => {
      const ip = "test-ip-5";
      const now = Date.now();

      const result = checkRateLimit(ip, RateLimits.ENTRIES);

      // resetAt should be approximately now + windowMs
      const expectedReset = now + RateLimits.ENTRIES.windowMs;
      const actualReset = result.resetAt.getTime();

      // Allow 100ms tolerance
      expect(actualReset).toBeGreaterThanOrEqual(expectedReset - 100);
      expect(actualReset).toBeLessThanOrEqual(expectedReset + 100);
    });
  });

  describe("getClientIP", () => {
    it("should extract IP from x-real-ip header", () => {
      const request = new Request("https://example.com", {
        headers: {
          "x-real-ip": "192.168.1.1",
        },
      });

      const ip = getClientIP(request);
      expect(ip).toBe("192.168.1.1");
    });

    it("should extract IP from x-forwarded-for header", () => {
      const request = new Request("https://example.com", {
        headers: {
          "x-forwarded-for": "192.168.1.2, 10.0.0.1",
        },
      });

      const ip = getClientIP(request);
      expect(ip).toBe("192.168.1.2"); // Should take first IP
    });

    it("should prefer x-real-ip over x-forwarded-for", () => {
      const request = new Request("https://example.com", {
        headers: {
          "x-real-ip": "192.168.1.1",
          "x-forwarded-for": "192.168.1.2",
        },
      });

      const ip = getClientIP(request);
      expect(ip).toBe("192.168.1.1");
    });

    it("should return 'unknown' if no IP headers present", () => {
      const request = new Request("https://example.com");

      const ip = getClientIP(request);
      expect(ip).toBe("unknown");
    });

    it("should handle x-forwarded-for with whitespace", () => {
      const request = new Request("https://example.com", {
        headers: {
          "x-forwarded-for": "  192.168.1.3  , 10.0.0.2",
        },
      });

      const ip = getClientIP(request);
      expect(ip).toBe("192.168.1.3");
    });
  });

  describe("RateLimits configuration", () => {
    it("should have correct ENTRIES rate limit", () => {
      expect(RateLimits.ENTRIES).toEqual({
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 50,
      });
    });

    it("should have correct LEADERBOARD rate limit", () => {
      expect(RateLimits.LEADERBOARD).toEqual({
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 200,
      });
    });

    it("should have correct POSITION rate limit", () => {
      expect(RateLimits.POSITION).toEqual({
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 100,
      });
    });
  });

  describe("clearRateLimitStore", () => {
    it("should clear all rate limit data", () => {
      const ip = "test-ip-clear";

      // Make some requests
      checkRateLimit(ip, RateLimits.ENTRIES);
      checkRateLimit(ip, RateLimits.ENTRIES);

      // Clear the store
      clearRateLimitStore();

      // Should be back to full limit
      const result = checkRateLimit(ip, RateLimits.ENTRIES);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(49); // 50 - 1
    });
  });
});
