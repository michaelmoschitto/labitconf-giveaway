import { describe, expect, it, beforeEach, afterEach } from "bun:test";
import { eq, or } from "drizzle-orm";
import { NextRequest } from "next/server";

import { GET } from "@/app/api/entries/check/route";
import { normalizeAddress } from "@/lib/address-utils";
import { testDb } from "@/lib/db/__tests__/test-client";
import { giveawayEntries } from "@/lib/db/schema";

const generateUniqueWallet = () => {
  const randomBytes = crypto.getRandomValues(new Uint8Array(20));
  const hex = Array.from(randomBytes, (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
  return `0x${hex}`;
};

const TEST_WALLETS = {
  registered: generateUniqueWallet(),
  unregistered: generateUniqueWallet(),
  invalid: "invalid",
};

const NORMALIZED_WALLETS = {
  registered: normalizeAddress(TEST_WALLETS.registered),
  unregistered: normalizeAddress(TEST_WALLETS.unregistered),
};

describe("GET /api/entries/check", () => {
  beforeEach(async () => {
    try {
      await testDb
        .delete(giveawayEntries)
        .where(
          or(
            eq(giveawayEntries.walletAddress, NORMALIZED_WALLETS.registered),
            eq(giveawayEntries.walletAddress, NORMALIZED_WALLETS.unregistered),
          ),
        );
    } catch {}

    await new Promise((resolve) => setTimeout(resolve, 10));

    await testDb.insert(giveawayEntries).values({
      walletAddress: NORMALIZED_WALLETS.registered,
      email: "test-check-route@example.com",
      referralCode: "CHK123DEF",
      referredByCode: null,
    });
  });

  afterEach(async () => {
    try {
      await testDb
        .delete(giveawayEntries)
        .where(
          or(
            eq(giveawayEntries.walletAddress, NORMALIZED_WALLETS.registered),
            eq(giveawayEntries.walletAddress, NORMALIZED_WALLETS.unregistered),
          ),
        );
    } catch {}
  });

  it("should return exists: true when wallet is already registered", async () => {
    const request = new NextRequest(
      `http://localhost:3000/api/entries/check?wallet=${TEST_WALLETS.registered}`,
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.exists).toBe(true);
    expect(data.wallet_address).toBe(NORMALIZED_WALLETS.registered);
  });

  it("should return 400 when wallet parameter is missing", async () => {
    const request = new NextRequest("http://localhost:3000/api/entries/check");

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe("MISSING_WALLET");
  });

  it("should return 400 when wallet format is invalid", async () => {
    const request = new NextRequest(
      `http://localhost:3000/api/entries/check?wallet=${TEST_WALLETS.invalid}`,
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe("INVALID_WALLET_FORMAT");
  });
});
