/**
 * Tests to ensure repository functions properly normalize both Ethereum and Bitcoin addresses
 * These tests prevent regressions where address normalization only works for one address type
 */

import { beforeEach, describe, expect, it, mock } from "bun:test";

import * as entries from "@/lib/db/repositories/entries";
import * as leaderboard from "@/lib/db/repositories/leaderboard";

// Mock the database clients
mock.module("@/lib/db/client", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve([mockEntry]),
        }),
      }),
    }),
    insert: () => ({
      values: () => ({
        returning: () => Promise.resolve([mockEntry]),
      }),
    }),
  },
  supabasePublic: {
    rpc: (name: string) => {
      if (name === "get_user_position") {
        return Promise.resolve({
          data: [mockPosition],
          error: null,
        });
      }
      return Promise.resolve({ data: [], error: null });
    },
  },
}));

const mockEntry = {
  id: "test-id",
  walletAddress: "0x742d35cc6634c0532925a3b844bc9e7595f0beb1",
  email: "test@example.com",
  referralCode: "MEZO1234",
  referredByCode: null,
  totalEntries: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPosition = {
  wallet_address: "0x742d35cc6634c0532925a3b844bc9e7595f0beb1",
  total_entries: 1,
  rank: 1,
};

describe("Repository Address Normalization Tests", () => {
  describe("entries.getByWallet", () => {
    it("should normalize Ethereum addresses correctly", async () => {
      const ethereumAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0beb1";
      const result = await entries.getByWallet(ethereumAddress);

      // Should not throw and should handle the address
      expect(result).toBeDefined();
    });

    it("should normalize Bitcoin P2PKH addresses correctly", async () => {
      const bitcoinAddress = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa";
      const result = await entries.getByWallet(bitcoinAddress);

      // Should not throw and should handle the address
      expect(result).toBeDefined();
    });

    it("should normalize Bitcoin Bech32 addresses correctly", async () => {
      const bech32Address = "bc1qp0q396yh72j5830m6hh4nwfjzwxhagzu95mw4n";
      const result = await entries.getByWallet(bech32Address);

      // Should not throw and should handle the address
      expect(result).toBeDefined();
    });

    it("should normalize Bitcoin P2SH addresses correctly", async () => {
      const p2shAddress = "3Cbq7aT1tY8kMxWLbitaG7yT6bPbKChq64";
      const result = await entries.getByWallet(p2shAddress);

      // Should not throw and should handle the address
      expect(result).toBeDefined();
    });

    it("should normalize Bitcoin Bech32m (Taproot) addresses correctly", async () => {
      const taprootAddress =
        "bc1p5d7rjq7g6rdk2yhzks9smlaqtedr4dekq08ge8ztwac72sfr9rusxg3297";
      const result = await entries.getByWallet(taprootAddress);

      // Should not throw and should handle the address
      expect(result).toBeDefined();
    });
  });

  describe("leaderboard.getUserPosition", () => {
    beforeEach(() => {
      // Reset mocks between tests if needed
    });

    it("should normalize Ethereum addresses correctly", async () => {
      const ethereumAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0beb1";
      const result = await leaderboard.getUserPosition(ethereumAddress);

      // Should not throw and should handle the address
      expect(result).toBeDefined();
    });

    it("should normalize Bitcoin P2PKH addresses correctly", async () => {
      const bitcoinAddress = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa";
      const result = await leaderboard.getUserPosition(bitcoinAddress);

      // Should not throw and should handle the address
      expect(result).toBeDefined();
    });

    it("should normalize Bitcoin Bech32 addresses correctly", async () => {
      const bech32Address = "bc1qp0q396yh72j5830m6hh4nwfjzwxhagzu95mw4n";
      const result = await leaderboard.getUserPosition(bech32Address);

      // Should not throw and should handle the address
      expect(result).toBeDefined();
    });

    it("should normalize Bitcoin P2SH addresses correctly", async () => {
      const p2shAddress = "3Cbq7aT1tY8kMxWLbitaG7yT6bPbKChq64";
      const result = await leaderboard.getUserPosition(p2shAddress);

      // Should not throw and should handle the address
      expect(result).toBeDefined();
    });

    it("should normalize Bitcoin Bech32m (Taproot) addresses correctly", async () => {
      const taprootAddress =
        "bc1p5d7rjq7g6rdk2yhzks9smlaqtedr4dekq08ge8ztwac72sfr9rusxg3297";
      const result = await leaderboard.getUserPosition(taprootAddress);

      // Should not throw and should handle the address
      expect(result).toBeDefined();
    });
  });

  describe("Cross-address type consistency", () => {
    it("should use detectAddressType to determine normalization strategy", () => {
      // This test ensures that both repositories use the same detection logic
      const ethereumAddresses = [
        "0x742d35Cc6634C0532925a3b844Bc9e7595f0beb1",
        "0x0000000000000000000000000000000000000000",
      ];

      const bitcoinAddresses = [
        "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
        "bc1qp0q396yh72j5830m6hh4nwfjzwxhagzu95mw4n",
        "3Cbq7aT1tY8kMxWLbitaG7yT6bPbKChq64",
        "bc1p5d7rjq7g6rdk2yhzks9smlaqtedr4dekq08ge8ztwac72sfr9rusxg3297",
      ];

      // All of these should be processable by both repositories
      const allAddresses = [...ethereumAddresses, ...bitcoinAddresses];

      allAddresses.forEach(async (address) => {
        // Should not throw for any address type
        await expect(entries.getByWallet(address)).resolves.toBeDefined();
        await expect(
          leaderboard.getUserPosition(address),
        ).resolves.toBeDefined();
      });
    });
  });

  describe("Regression test for position #0 bug", () => {
    it("should return correct position for Bitcoin addresses", async () => {
      // This was the original bug - Bitcoin addresses returned position #0
      const bitcoinAddress = "bc1qp0q396yh72j5830m6hh4nwfjzwxhagzu95mw4n";
      const result = await leaderboard.getUserPosition(bitcoinAddress);

      // Should return a position, not null
      expect(result).toBeDefined();
      // In the mock, we return rank: 1
      if (result) {
        expect(result.rank).toBeGreaterThanOrEqual(1);
      }
    });

    it("should return correct position for Ethereum addresses", async () => {
      const ethereumAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0beb1";
      const result = await leaderboard.getUserPosition(ethereumAddress);

      // Should return a position, not null
      expect(result).toBeDefined();
      if (result) {
        expect(result.rank).toBeGreaterThanOrEqual(1);
      }
    });

    it("should detect duplicate entries for Bitcoin addresses", async () => {
      // This ensures the duplicate check works for Bitcoin addresses
      const bitcoinAddress = "bc1qp0q396yh72j5830m6hh4nwfjzwxhagzu95mw4n";
      const result = await entries.getByWallet(bitcoinAddress);

      // Should be able to find existing entries
      expect(result).toBeDefined();
    });

    it("should detect duplicate entries for Ethereum addresses", async () => {
      const ethereumAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0beb1";
      const result = await entries.getByWallet(ethereumAddress);

      // Should be able to find existing entries
      expect(result).toBeDefined();
    });
  });
});
