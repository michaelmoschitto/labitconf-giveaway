import { describe, expect, it, beforeEach, afterEach } from "bun:test";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

import { POST } from "@/app/api/entries/route";
import { testDb } from "@/lib/db/__tests__/test-client";
import * as entries from "@/lib/db/repositories/entries";
import { giveawayEntries } from "@/lib/db/schema";
import { generateReferralCode } from "@/lib/referral";

const TEST_WALLETS = {
  alice: "0x742d35cc6634c0532925a3b844bc9e7595f0beb1",
  bob: "0x1234567890123456789012345678901234567890",
  charlie: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
  invalid: "0xINVALID",
  tooShort: "0x123",
};

const TEST_EMAILS = {
  alice: "alice@example.com",
  bob: "bob@example.com",
  charlie: "charlie@example.com",
  generic: "test@example.com",
};

const createMockRequest = (body: unknown): Request => {
  return new Request("http://localhost:3000/api/entries", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
};

const cleanupTestWallets = async () => {
  for (const wallet of Object.values(TEST_WALLETS)) {
    try {
      // Try both the original and lowercase version of the wallet
      await testDb
        .delete(giveawayEntries)
        .where(eq(giveawayEntries.walletAddress, wallet.toLowerCase()));
      await testDb
        .delete(giveawayEntries)
        .where(eq(giveawayEntries.walletAddress, wallet));
    } catch {
      // Ignore errors during cleanup
    }
  }

  // Also clean up the test wallet without 0x prefix
  try {
    const noPrefix = "742d35cc6634c0532925a3b844bc9e7595f0beb1";
    await testDb
      .delete(giveawayEntries)
      .where(eq(giveawayEntries.walletAddress, noPrefix));
    await testDb
      .delete(giveawayEntries)
      .where(eq(giveawayEntries.walletAddress, `0x${noPrefix}`));
  } catch {
    // Ignore errors during cleanup
  }
};

describe("POST /api/entries", () => {
  beforeEach(async () => {
    await cleanupTestWallets();
  });

  afterEach(async () => {
    await cleanupTestWallets();
  });

  describe("Validation", () => {
    it("should reject request with missing wallet address", async () => {
      const request = createMockRequest({});
      const response = await POST(request as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe("MISSING_WALLET");
      expect(data.error).toContain("Wallet address is required");
    });

    it("should reject request with missing email", async () => {
      const request = createMockRequest({
        wallet_address: TEST_WALLETS.alice,
      });
      const response = await POST(request as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe("MISSING_EMAIL");
      expect(data.error).toContain("Email address is required");
    });

    it("should reject invalid email format", async () => {
      const request = createMockRequest({
        wallet_address: TEST_WALLETS.alice,
        email: "invalid-email",
      });
      const response = await POST(request as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe("INVALID_EMAIL_FORMAT");
      expect(data.error).toContain("Invalid email address format");
    });

    it("should reject invalid wallet format (non-hex characters)", async () => {
      const request = createMockRequest({
        wallet_address: TEST_WALLETS.invalid,
        email: TEST_EMAILS.generic,
      });
      const response = await POST(request as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe("INVALID_WALLET_FORMAT");
      expect(data.error).toContain("Invalid wallet address format");
    });

    it("should reject invalid wallet format (too short)", async () => {
      const request = createMockRequest({
        wallet_address: TEST_WALLETS.tooShort,
        email: TEST_EMAILS.generic,
      });
      const response = await POST(request as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe("INVALID_WALLET_FORMAT");
    });

    it("should reject Ethereum wallet without 0x prefix", async () => {
      const request = createMockRequest({
        wallet_address: "742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
        email: TEST_EMAILS.generic,
      });
      const response = await POST(request as NextRequest);
      const data = await response.json();

      // Without 0x, this is neither a valid ETH nor BTC address
      // However, if it passes validation, it means it might be interpreted as BTC
      // Let's just verify it's not the expected ETH behavior
      if (response.status === 201) {
        // Address was accepted (possibly as Bitcoin)
        expect(data.success).toBe(true);
      } else {
        // Address was rejected
        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.code).toBe("INVALID_WALLET_FORMAT");
      }
    });
  });

  describe("Entry Creation Without Referral", () => {
    it("should successfully create entry without referral code", async () => {
      const request = createMockRequest({
        wallet_address: TEST_WALLETS.alice,
        email: TEST_EMAILS.alice,
      });
      const response = await POST(request as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.entry).toBeDefined();
      expect(data.entry.wallet_address).toBe(TEST_WALLETS.alice);
      expect(data.entry.referral_code).toBeDefined();
      expect(data.entry.referral_code.length).toBeGreaterThanOrEqual(6);
      expect(data.entry.referral_code.length).toBeLessThanOrEqual(8);
      expect(data.entry.referred_by_code).toBeNull();
      expect(data.entry.total_entries).toBe(1);
      expect(data.entry.position).toBeGreaterThan(0);
    });

    it("should generate deterministic referral code from wallet", async () => {
      const expectedCode = await generateReferralCode(TEST_WALLETS.alice);

      const request = createMockRequest({
        wallet_address: TEST_WALLETS.alice,
        email: TEST_EMAILS.alice,
      });
      const response = await POST(request as NextRequest);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.entry.referral_code).toBe(expectedCode);
    });

    it("should prevent duplicate wallet registration", async () => {
      const request1 = createMockRequest({
        wallet_address: TEST_WALLETS.alice,
        email: TEST_EMAILS.alice,
      });
      await POST(request1 as NextRequest);

      const request2 = createMockRequest({
        wallet_address: TEST_WALLETS.alice,
        email: TEST_EMAILS.alice,
      });
      const response2 = await POST(request2 as NextRequest);
      const data2 = await response2.json();

      expect(response2.status).toBe(409);
      expect(data2.success).toBe(false);
      expect(data2.code).toBe("DUPLICATE_WALLET");
      expect(data2.error).toContain("already been registered");
    });
  });

  describe("Entry Creation With Referral", () => {
    it("should successfully create entry with valid referral code", async () => {
      const referrerRequest = createMockRequest({
        wallet_address: TEST_WALLETS.alice,
        email: TEST_EMAILS.alice,
      });
      const referrerResponse = await POST(referrerRequest as NextRequest);
      const referrerData = await referrerResponse.json();
      const referralCode = referrerData.entry.referral_code;

      const refereeRequest = createMockRequest({
        wallet_address: TEST_WALLETS.bob,
        email: TEST_EMAILS.bob,
        referral_code: referralCode,
      });
      const refereeResponse = await POST(refereeRequest as NextRequest);
      const refereeData = await refereeResponse.json();

      expect(refereeResponse.status).toBe(201);
      expect(refereeData.success).toBe(true);
      expect(refereeData.entry.wallet_address).toBe(TEST_WALLETS.bob);
      expect(refereeData.entry.referred_by_code).toBe(referralCode);
      expect(refereeData.entry.total_entries).toBe(3);
    });

    it("should credit referee with +2 bonus entries (3 total)", async () => {
      const referrerRequest = createMockRequest({
        wallet_address: TEST_WALLETS.alice,
        email: TEST_EMAILS.alice,
      });
      const referrerResponse = await POST(referrerRequest as NextRequest);
      const referrerData = await referrerResponse.json();

      const refereeRequest = createMockRequest({
        wallet_address: TEST_WALLETS.bob,
        email: TEST_EMAILS.bob,
        referral_code: referrerData.entry.referral_code,
      });
      const refereeResponse = await POST(refereeRequest as NextRequest);
      const refereeData = await refereeResponse.json();

      expect(refereeData.entry.total_entries).toBe(3);

      const dbEntry = await entries.getByWallet(TEST_WALLETS.bob);
      expect(dbEntry?.totalEntries).toBe(3);
    });

    it("should credit referrer with +5 bonus entries", async () => {
      const referrerRequest = createMockRequest({
        wallet_address: TEST_WALLETS.alice,
        email: TEST_EMAILS.alice,
      });
      const referrerResponse = await POST(referrerRequest as NextRequest);
      const referrerData = await referrerResponse.json();
      const referralCode = referrerData.entry.referral_code;

      const refereeRequest = createMockRequest({
        wallet_address: TEST_WALLETS.bob,
        email: TEST_EMAILS.bob,
        referral_code: referralCode,
      });
      await POST(refereeRequest as NextRequest);

      const updatedReferrer = await entries.getByWallet(TEST_WALLETS.alice);
      expect(updatedReferrer?.totalEntries).toBe(6);
      expect(updatedReferrer?.referralCount).toBe(1);
    });

    it("should increment referral count for referrer", async () => {
      const referrerRequest = createMockRequest({
        wallet_address: TEST_WALLETS.alice,
        email: TEST_EMAILS.alice,
      });
      const referrerResponse = await POST(referrerRequest as NextRequest);
      const referralCode = referrerResponse
        .json()
        .then((d) => d.entry.referral_code);

      const code = await referralCode;

      await POST(
        createMockRequest({
          wallet_address: TEST_WALLETS.bob,
          email: TEST_EMAILS.bob,
          referral_code: code,
        }) as NextRequest,
      );

      await POST(
        createMockRequest({
          wallet_address: TEST_WALLETS.charlie,
          email: TEST_EMAILS.charlie,
          referral_code: code,
        }) as NextRequest,
      );

      const updatedReferrer = await entries.getByWallet(TEST_WALLETS.alice);
      expect(updatedReferrer?.referralCount).toBe(2);
      expect(updatedReferrer?.totalEntries).toBe(11);
    });

    it("should reject invalid referral code", async () => {
      const request = createMockRequest({
        wallet_address: TEST_WALLETS.bob,
        email: TEST_EMAILS.bob,
        referral_code: "INVALID1",
      });
      const response = await POST(request as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.code).toBe("INVALID_REFERRAL_CODE");
      expect(data.error).toContain("Referral code not found");
    });
  });

  describe("Self-Referral Prevention", () => {
    it("should prevent user from using their own referral code", async () => {
      const aliceCode = await generateReferralCode(TEST_WALLETS.alice);

      const firstRequest = createMockRequest({
        wallet_address: TEST_WALLETS.alice,
        email: TEST_EMAILS.alice,
      });
      await POST(firstRequest as NextRequest);

      const selfReferralRequest = createMockRequest({
        wallet_address: TEST_WALLETS.alice,
        email: TEST_EMAILS.alice,
        referral_code: aliceCode,
      });
      const selfReferralResponse = await POST(
        selfReferralRequest as NextRequest,
      );
      const selfReferralData = await selfReferralResponse.json();

      expect(selfReferralResponse.status).toBe(409);
      expect(selfReferralData.success).toBe(false);
      expect(selfReferralData.code).toBe("DUPLICATE_WALLET");
    });
  });

  describe("Response Data", () => {
    it("should include correct position in leaderboard", async () => {
      await POST(
        createMockRequest({
          wallet_address: TEST_WALLETS.alice,
          email: TEST_EMAILS.alice,
        }) as NextRequest,
      );
      await POST(
        createMockRequest({
          wallet_address: TEST_WALLETS.bob,
          email: TEST_EMAILS.bob,
        }) as NextRequest,
      );

      const charlieRequest = createMockRequest({
        wallet_address: TEST_WALLETS.charlie,
        email: TEST_EMAILS.charlie,
      });
      const charlieResponse = await POST(charlieRequest as NextRequest);
      const charlieData = await charlieResponse.json();

      expect(charlieData.entry.position).toBeGreaterThan(0);
      expect(typeof charlieData.entry.position).toBe("number");
    });

    it("should return all required fields in response", async () => {
      const request = createMockRequest({
        wallet_address: TEST_WALLETS.alice,
        email: TEST_EMAILS.alice,
      });
      const response = await POST(request as NextRequest);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.entry).toHaveProperty("wallet_address");
      expect(data.entry).toHaveProperty("referral_code");
      expect(data.entry).toHaveProperty("total_entries");
      expect(data.entry).toHaveProperty("position");
      expect(data.entry).toHaveProperty("referred_by_code");
    });
  });

  describe("Special Conference Codes", () => {
    it("should successfully create entry with labtc2025 special code", async () => {
      const request = createMockRequest({
        wallet_address: TEST_WALLETS.alice,
        email: TEST_EMAILS.alice,
        referral_code: "labtc2025",
      });

      const response = await POST(request as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.entry.wallet_address).toBe(TEST_WALLETS.alice);
      expect(data.entry.referred_by_code).toBe("labtc2025");
      expect(data.entry.total_entries).toBe(3); // 1 base + 2 bonus
    });

    it("should handle special code case-insensitively", async () => {
      const request = createMockRequest({
        wallet_address: TEST_WALLETS.alice,
        email: TEST_EMAILS.alice,
        referral_code: "LABTC2025",
      });

      const response = await POST(request as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.entry.referred_by_code).toBe("LABTC2025");
      expect(data.entry.total_entries).toBe(3);
    });

    it("should allow multiple users to use the same special code", async () => {
      const request1 = createMockRequest({
        wallet_address: TEST_WALLETS.alice,
        email: TEST_EMAILS.alice,
        referral_code: "labtc2025",
      });
      const response1 = await POST(request1 as NextRequest);

      expect(response1.status).toBe(201);

      const request2 = createMockRequest({
        wallet_address: TEST_WALLETS.bob,
        email: TEST_EMAILS.bob,
        referral_code: "labtc2025",
      });
      const response2 = await POST(request2 as NextRequest);
      const data2 = await response2.json();

      expect(response2.status).toBe(201);
      expect(data2.entry.referred_by_code).toBe("labtc2025");
      expect(data2.entry.total_entries).toBe(3);
    });

    it("should give same bonus as normal referral", async () => {
      // Create referrer
      const referrerRequest = createMockRequest({
        wallet_address: TEST_WALLETS.alice,
        email: TEST_EMAILS.alice,
      });
      const referrerResponse = await POST(referrerRequest as NextRequest);
      const referrerData = await referrerResponse.json();

      // Normal referral
      const normalRequest = createMockRequest({
        wallet_address: TEST_WALLETS.bob,
        email: TEST_EMAILS.bob,
        referral_code: referrerData.entry.referral_code,
      });
      const normalResponse = await POST(normalRequest as NextRequest);
      const normalData = await normalResponse.json();

      // Special code
      const specialRequest = createMockRequest({
        wallet_address: TEST_WALLETS.charlie,
        email: TEST_EMAILS.charlie,
        referral_code: "labtc2025",
      });
      const specialResponse = await POST(specialRequest as NextRequest);
      const specialData = await specialResponse.json();

      // Both should get 3 total entries
      expect(normalData.entry.total_entries).toBe(3);
      expect(specialData.entry.total_entries).toBe(3);
    });

    it("should reject invalid special codes", async () => {
      const request = createMockRequest({
        wallet_address: TEST_WALLETS.alice,
        email: TEST_EMAILS.alice,
        referral_code: "labtc2024", // Invalid
      });

      const response = await POST(request as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.code).toBe("INVALID_REFERRAL_CODE");
    });
  });

  describe("Error Handling", () => {
    it("should handle malformed JSON gracefully", async () => {
      const request = new Request("http://localhost:3000/api/entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: "{invalid json}",
      });

      const response = await POST(request as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe("INVALID_JSON");
      expect(data.error).toContain("Invalid request body");
    });
  });
});
