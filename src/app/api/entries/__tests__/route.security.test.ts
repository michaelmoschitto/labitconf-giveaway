/**
 * Security integration tests for /api/entries endpoint
 */

import { describe, expect, it, beforeEach, afterEach } from "bun:test";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

import { POST } from "@/app/api/entries/route";
import { testDb } from "@/lib/db/__tests__/test-client";
import { giveawayEntries } from "@/lib/db/schema";
import { clearRateLimitStore } from "@/lib/rate-limit";

const cleanupTestWallet = async (wallet: string) => {
  try {
    await testDb
      .delete(giveawayEntries)
      .where(eq(giveawayEntries.walletAddress, wallet));
  } catch {
    // Ignore errors during cleanup
  }
};

describe("/api/entries - Security", () => {
  const originalAllowedOrigins = process.env.ALLOWED_ORIGINS;

  beforeEach(() => {
    clearRateLimitStore();
    // Allow localhost for CORS tests
    process.env.ALLOWED_ORIGINS = "http://localhost:3000";
  });

  afterEach(async () => {
    // Restore original ALLOWED_ORIGINS
    process.env.ALLOWED_ORIGINS = originalAllowedOrigins;

    // Cleanup test wallets after each test (normalized to lowercase)
    await cleanupTestWallet("0x742d35cc6634c0532925a3b844bc9e7595f0beb1");
    await cleanupTestWallet("0x1111111111111111111111111111111111111111");
    await cleanupTestWallet("0x2222222222222222222222222222222222222222");
    await cleanupTestWallet("0x3333333333333333333333333333333333333333");
    await cleanupTestWallet("0x4444444444444444444444444444444444444444");
    for (let i = 0; i < 51; i++) {
      await cleanupTestWallet(`0x${i.toString().padStart(40, "0")}`);
    }
    await cleanupTestWallet("0xffffffffffffffffffffffffffffffffffffffff");
  });

  describe("CORS Headers", () => {
    it("should include CORS headers in successful response", async () => {
      const request = new NextRequest(
        "https://labitconf-giveaway.vercel.app/api/entries",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            origin: "http://localhost:3000",
          },
          body: JSON.stringify({
            wallet_address: "0x742d35cc6634c0532925a3b844bc9e7595f0beb1",
            email: "test@example.com",
          }),
        },
      );

      const response = await POST(request);

      expect(response.headers.get("Access-Control-Allow-Origin")).toBeTruthy();
      expect(response.headers.get("Access-Control-Allow-Methods")).toBeTruthy();
    });

    it("should include security headers in response", async () => {
      const request = new NextRequest(
        "https://labitconf-giveaway.vercel.app/api/entries",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            wallet_address: "0x742d35cc6634c0532925a3b844bc9e7595f0beb1",
            email: "test@example.com",
          }),
        },
      );

      const response = await POST(request);

      expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
      expect(response.headers.get("X-Frame-Options")).toBe("DENY");
      expect(response.headers.get("X-XSS-Protection")).toBe("1; mode=block");
    });
  });

  describe("Rate Limiting", () => {
    it("should allow multiple requests within limit (50/hour)", async () => {
      const createRequest = (wallet: string, email: string) =>
        new NextRequest("https://labitconf-giveaway.vercel.app/api/entries", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-real-ip": "192.168.1.1",
          },
          body: JSON.stringify({ wallet_address: wallet, email }),
        });

      // First few requests should succeed (limit is 50/hour)
      const response1 = await POST(
        createRequest(
          "0x1111111111111111111111111111111111111111",
          "test1@example.com",
        ),
      );
      expect(response1.status).toBe(201);

      const response2 = await POST(
        createRequest(
          "0x2222222222222222222222222222222222222222",
          "test2@example.com",
        ),
      );
      expect(response2.status).toBe(201);

      const response3 = await POST(
        createRequest(
          "0x3333333333333333333333333333333333333333",
          "test3@example.com",
        ),
      );
      expect(response3.status).toBe(201);
    });

    it("should block requests after limit exceeded (50/hour)", async () => {
      const createRequest = (wallet: string, _index: number) =>
        new NextRequest("https://labitconf-giveaway.vercel.app/api/entries", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-real-ip": "192.168.1.2",
          },
          body: JSON.stringify({
            wallet_address: wallet,
            email: `test${_index}@example.com`,
          }),
        });

      // Make 50 requests to hit the limit (actual limit is 50/hour)
      for (let i = 0; i < 50; i++) {
        const wallet = `0x${i.toString().padStart(40, "0")}`;
        await POST(createRequest(wallet, i));
      }

      // 51st request should be rate limited
      const response51 = await POST(
        createRequest("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF", 51),
      );

      expect(response51.status).toBe(429);

      const body = await response51.json();
      expect(body.code).toBe("RATE_LIMIT_EXCEEDED");
      expect(body.success).toBe(false);
      expect(response51.headers.get("Retry-After")).toBeTruthy();
    });

    it("should track different IPs independently", async () => {
      // Make 3 requests from IP1
      const createRequestIP1 = (wallet: string, email: string) =>
        new NextRequest("https://labitconf-giveaway.vercel.app/api/entries", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-real-ip": "192.168.1.100",
          },
          body: JSON.stringify({ wallet_address: wallet, email }),
        });

      await POST(
        createRequestIP1(
          "0x1111111111111111111111111111111111111111",
          "test1@example.com",
        ),
      );
      await POST(
        createRequestIP1(
          "0x2222222222222222222222222222222222222222",
          "test2@example.com",
        ),
      );
      await POST(
        createRequestIP1(
          "0x3333333333333333333333333333333333333333",
          "test3@example.com",
        ),
      );

      // IP2 should still be allowed
      const requestIP2 = new NextRequest(
        "https://labitconf-giveaway.vercel.app/api/entries",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-real-ip": "192.168.1.200",
          },
          body: JSON.stringify({
            wallet_address: "0x4444444444444444444444444444444444444444",
            email: "test4@example.com",
          }),
        },
      );

      const response = await POST(requestIP2);
      expect(response.status).toBe(201);
    });
  });

  describe("Error Response Security", () => {
    it("should not leak sensitive information in errors", async () => {
      // Test with malformed JSON to trigger error handling
      const request = new Request(
        "https://labitconf-giveaway.vercel.app/api/entries",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: "{invalid json}",
        },
      );

      const response = await POST(request as NextRequest);

      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.error).not.toContain("postgresql");
      expect(body.error).not.toContain("database");
      expect(body.error).not.toContain("secret");
      expect(body.code).toBe("INVALID_JSON");
      // Should return clear, non-sensitive error message
      expect(body.error).toContain("Invalid request body");
    });

    it("should return consistent error format", async () => {
      const request = new NextRequest(
        "https://labitconf-giveaway.vercel.app/api/entries",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            wallet_address: "", // Invalid: empty wallet
          }),
        },
      );

      const response = await POST(request);

      const body = await response.json();
      expect(body).toHaveProperty("success");
      expect(body).toHaveProperty("error");
      expect(body).toHaveProperty("code");
      expect(body.success).toBe(false);
    });
  });

  describe("Input Validation", () => {
    it("should validate wallet address format", async () => {
      const request = new NextRequest(
        "https://labitconf-giveaway.vercel.app/api/entries",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            wallet_address: "invalid-wallet",
            email: "test@example.com",
          }),
        },
      );

      const response = await POST(request);

      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.code).toBe("INVALID_WALLET_FORMAT");
    });

    it("should require wallet address", async () => {
      const request = new NextRequest(
        "https://labitconf-giveaway.vercel.app/api/entries",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        },
      );

      const response = await POST(request);

      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.code).toBe("MISSING_WALLET");
    });
  });
});
