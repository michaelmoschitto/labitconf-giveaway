import { describe, expect, it } from "bun:test";

import {
  detectAddressType,
  isValidChecksum,
  normalizeAddress,
  normalizeEthAddress,
  normalizeBitcoinAddress,
  toChecksumAddress,
  validateAddress,
  validateBitcoin,
  validateEthereum,
} from "@/lib/address-utils";

describe("address-utils", () => {
  // Test addresses
  const validAddress = "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed";
  const lowercaseAddress = "0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed";
  const uppercaseAddress = "0x5AAEB6053F3E94C9B9A09F33669435E7EF1BEAED";
  const invalidChecksumAddress = "0x5aAEB6053f3e94c9b9a09f33669435e7ef1beaed"; // Wrong checksum

  describe("normalizeAddress", () => {
    it("should convert uppercase address to lowercase", () => {
      expect(normalizeEthAddress(uppercaseAddress)).toBe(lowercaseAddress);
    });

    it("should convert checksummed address to lowercase", () => {
      expect(normalizeEthAddress(validAddress)).toBe(lowercaseAddress);
    });

    it("should keep lowercase address as lowercase", () => {
      expect(normalizeEthAddress(lowercaseAddress)).toBe(lowercaseAddress);
    });

    it("should return empty string for invalid addresses", () => {
      expect(normalizeEthAddress("")).toBe("");
      expect(normalizeEthAddress("not-an-address")).toBe("");
      expect(normalizeEthAddress("0x123")).toBe(""); // Too short
      expect(
        normalizeEthAddress("5aaeb6053f3e94c9b9a09f33669435e7ef1beaed"),
      ).toBe(
        "5aaeb6053f3e94c9b9a09f33669435e7ef1beaed", // This is a valid address
      );
    });

    it("should return empty string for non-string inputs", () => {
      expect(normalizeEthAddress(null as unknown as string)).toBe("");
      expect(normalizeEthAddress(undefined as unknown as string)).toBe("");
      expect(normalizeEthAddress(123 as unknown as string)).toBe("");
    });
  });

  describe("toChecksumAddress", () => {
    it("should convert lowercase address to checksummed format", () => {
      expect(toChecksumAddress(lowercaseAddress)).toBe(validAddress);
    });

    it("should convert uppercase address to checksummed format", () => {
      expect(toChecksumAddress(uppercaseAddress)).toBe(validAddress);
    });

    it("should keep already checksummed address unchanged", () => {
      expect(toChecksumAddress(validAddress)).toBe(validAddress);
    });

    it("should throw error for invalid addresses", () => {
      expect(() => toChecksumAddress("")).toThrow("Invalid address");
      expect(() => toChecksumAddress("not-an-address")).toThrow();
      expect(() => toChecksumAddress("0x123")).toThrow();
      // Note: ethers accepts addresses without 0x prefix and adds it
    });

    it("should throw error for non-string inputs", () => {
      expect(() => toChecksumAddress(null as unknown as string)).toThrow();
      expect(() => toChecksumAddress(undefined as unknown as string)).toThrow();
      expect(() => toChecksumAddress(123 as unknown as string)).toThrow();
    });
  });

  describe("isValidChecksum", () => {
    it("should return true for correctly checksummed address", () => {
      expect(isValidChecksum(validAddress)).toBe(true);
    });

    it("should return true for lowercase address (no checksum applied)", () => {
      expect(isValidChecksum(lowercaseAddress)).toBe(true);
    });

    it("should return true for uppercase address (no checksum applied)", () => {
      expect(isValidChecksum(uppercaseAddress)).toBe(true);
    });

    it("should return false for invalid checksum", () => {
      expect(isValidChecksum(invalidChecksumAddress)).toBe(false);
    });

    it("should return false for invalid address format", () => {
      expect(isValidChecksum("")).toBe(false);
      expect(isValidChecksum("not-an-address")).toBe(false);
      expect(isValidChecksum("0x123")).toBe(false);
    });

    it("should return false for non-string inputs", () => {
      expect(isValidChecksum(null as unknown as string)).toBe(false);
      expect(isValidChecksum(undefined as unknown as string)).toBe(false);
      expect(isValidChecksum(123 as unknown as string)).toBe(false);
    });
  });

  describe("real-world examples", () => {
    // Example from the EIP55Checksum.ts file
    const realLowercase = "0x960a00c50fbe170361561500c91fcae20edd0fbb";
    const realChecksummed = "0x960A00c50fBE170361561500c91fCAe20eDD0FBB";

    it("should normalize real address to lowercase", () => {
      expect(normalizeEthAddress(realChecksummed)).toBe(realLowercase);
      expect(normalizeEthAddress(realLowercase)).toBe(realLowercase);
    });

    it("should convert real address to checksummed format", () => {
      expect(toChecksumAddress(realLowercase)).toBe(realChecksummed);
      expect(toChecksumAddress(realChecksummed)).toBe(realChecksummed);
    });

    it("should validate real checksummed address", () => {
      expect(isValidChecksum(realChecksummed)).toBe(true);
      expect(isValidChecksum(realLowercase)).toBe(true);
    });

    it("should detect invalid checksum on real address", () => {
      const invalidReal = "0x960A00C50fbe170361561500c91fcae20edd0fbb";
      expect(isValidChecksum(invalidReal)).toBe(false);
    });
  });

  describe("validateEthereum", () => {
    it("should validate correct ethereum addresses", () => {
      expect(validateEthereum(validAddress)).toBe(true);
      expect(validateEthereum(lowercaseAddress)).toBe(true);
      expect(validateEthereum(uppercaseAddress)).toBe(true);
    });

    it("should reject invalid ethereum addresses", () => {
      expect(validateEthereum("")).toBe(false);
      expect(validateEthereum("not-an-address")).toBe(false);
      expect(validateEthereum("0x123")).toBe(false);
    });

    it("should reject non-string inputs", () => {
      expect(validateEthereum(null as unknown as string)).toBe(false);
      expect(validateEthereum(undefined as unknown as string)).toBe(false);
      expect(validateEthereum(123 as unknown as string)).toBe(false);
    });
  });
});

describe("Bitcoin address validation", () => {
  // Real Bitcoin addresses for testing
  const validBTCAddresses = {
    legacy: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa", // Genesis block address
    p2sh: "3Cbq7aT1tY8kMxWLbitaG7yT6bPbKChq64", // P2SH address (valid)
    bech32: "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq", // Native SegWit
    bech32m: "bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxqkedrcr", // Taproot
  };

  const invalidBTCAddresses = [
    "",
    "not-a-btc-address",
    "1InvalidBTCAddress",
    "bc1invalid",
    "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed", // ETH address
  ];

  describe("validateBitcoin", () => {
    it("should validate Legacy P2PKH addresses", () => {
      expect(validateBitcoin(validBTCAddresses.legacy)).toBe(true);
    });

    it("should validate Joey Address", () => {
      expect(
        validateBitcoin("bc1qp0q396yh72j5830m6hh4nwfjzwxhagzu95mw4n"),
      ).toBe(true);
    });

    it("should validate P2SH addresses", () => {
      expect(validateBitcoin(validBTCAddresses.p2sh)).toBe(true);
    });

    it("should validate Bech32 (SegWit) addresses", () => {
      expect(validateBitcoin(validBTCAddresses.bech32)).toBe(true);
    });

    it("should validate Bech32m (Taproot) addresses", () => {
      expect(validateBitcoin(validBTCAddresses.bech32m)).toBe(true);
    });

    it("should reject invalid Bitcoin addresses", () => {
      invalidBTCAddresses.forEach((addr) => {
        expect(validateBitcoin(addr)).toBe(false);
      });
    });

    it("should reject non-string inputs", () => {
      expect(validateBitcoin(null as unknown as string)).toBe(false);
      expect(validateBitcoin(undefined as unknown as string)).toBe(false);
      expect(validateBitcoin(123 as unknown as string)).toBe(false);
    });
  });

  describe("normalizeBitcoinAddress", () => {
    it("should preserve case for Legacy (P2PKH) addresses", () => {
      // Legacy addresses are case-sensitive (Base58Check with checksum)
      expect(normalizeBitcoinAddress(validBTCAddresses.legacy)).toBe(
        validBTCAddresses.legacy,
      );
    });

    it("should preserve case for P2SH addresses", () => {
      // P2SH addresses are case-sensitive (Base58Check with checksum)
      expect(normalizeBitcoinAddress(validBTCAddresses.p2sh)).toBe(
        validBTCAddresses.p2sh,
      );
    });

    it("should convert Bech32 addresses to lowercase", () => {
      // Bech32 addresses are case-insensitive, lowercase is conventional
      expect(normalizeBitcoinAddress(validBTCAddresses.bech32)).toBe(
        validBTCAddresses.bech32.toLowerCase(),
      );
      expect(
        normalizeBitcoinAddress(validBTCAddresses.bech32.toUpperCase()),
      ).toBe(validBTCAddresses.bech32.toLowerCase());
    });

    it("should convert Bech32m (Taproot) addresses to lowercase", () => {
      // Bech32m addresses are case-insensitive, lowercase is conventional
      expect(normalizeBitcoinAddress(validBTCAddresses.bech32m)).toBe(
        validBTCAddresses.bech32m.toLowerCase(),
      );
    });

    it("should return empty string for invalid inputs", () => {
      expect(normalizeBitcoinAddress("")).toBe("");
      expect(normalizeBitcoinAddress(null as unknown as string)).toBe("");
      expect(normalizeBitcoinAddress(undefined as unknown as string)).toBe("");
    });
  });
});

describe("Unified address validation", () => {
  const ethAddress = "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed";
  const btcLegacy = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa";
  const btcBech32 = "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq";

  describe("detectAddressType", () => {
    it("should detect Ethereum addresses", () => {
      expect(detectAddressType(ethAddress)).toBe("ethereum");
      expect(
        detectAddressType("0x960a00c50fbe170361561500c91fcae20edd0fbb"),
      ).toBe("ethereum");
    });

    it("should detect Bitcoin addresses", () => {
      expect(detectAddressType(btcLegacy)).toBe("bitcoin");
      expect(detectAddressType(btcBech32)).toBe("bitcoin");
      expect(detectAddressType("3Cbq7aT1tY8kMxWLbitaG7yT6bPbKChq64")).toBe(
        "bitcoin",
      );
    });

    it("should throw error for invalid inputs", () => {
      expect(() => detectAddressType("")).toThrow();
      expect(() => detectAddressType(null as unknown as string)).toThrow();
      expect(() => detectAddressType(undefined as unknown as string)).toThrow();
      expect(() => detectAddressType(123 as unknown as string)).toThrow();
    });
  });

  describe("validateAddress", () => {
    it("should validate Ethereum addresses", () => {
      expect(validateAddress(ethAddress)).toBe(true);
      expect(
        validateAddress("0x960a00c50fbe170361561500c91fcae20edd0fbb"),
      ).toBe(true);
    });

    it("should validate Bitcoin addresses (all formats)", () => {
      expect(validateAddress(btcLegacy)).toBe(true);
      expect(validateAddress(btcBech32)).toBe(true);
      expect(validateAddress("3Cbq7aT1tY8kMxWLbitaG7yT6bPbKChq64")).toBe(true);
      expect(
        validateAddress(
          "bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxqkedrcr",
        ),
      ).toBe(true);
    });

    it("should reject invalid addresses", () => {
      expect(validateAddress("")).toBe(false);
      expect(validateAddress("not-an-address")).toBe(false);
      expect(validateAddress("0x123")).toBe(false);
      expect(validateAddress("bc1invalid")).toBe(false);
    });

    it("should reject non-string inputs", () => {
      expect(validateAddress(null as unknown as string)).toBe(false);
      expect(validateAddress(undefined as unknown as string)).toBe(false);
      expect(validateAddress(123 as unknown as string)).toBe(false);
    });
  });

  describe("mixed address scenarios", () => {
    it("should not validate ETH address as BTC", () => {
      expect(validateBitcoin(ethAddress)).toBe(false);
    });

    it("should not validate BTC address as ETH", () => {
      expect(validateEthereum(btcLegacy)).toBe(false);
      expect(validateEthereum(btcBech32)).toBe(false);
    });

    it("should correctly route addresses to proper validators", () => {
      // ETH should go to validateEthereum
      expect(validateAddress(ethAddress)).toBe(validateEthereum(ethAddress));

      // BTC should go to validateBitcoin
      expect(validateAddress(btcLegacy)).toBe(validateBitcoin(btcLegacy));
      expect(validateAddress(btcBech32)).toBe(validateBitcoin(btcBech32));
    });
  });

  describe("normalizeAddress", () => {
    it("should normalize Ethereum addresses to lowercase", () => {
      const mixedCase = "0x742d35Cc6634C0532925a3b844Bc9e7595f0beb1";
      const expected = "0x742d35cc6634c0532925a3b844bc9e7595f0beb1";
      expect(normalizeAddress(mixedCase)).toBe(expected);
    });

    it("should normalize Bech32 Bitcoin addresses to lowercase", () => {
      const mixedCase = "BC1QP0Q396YH72J5830M6HH4NWFJZWXHAGZU95MW4N";
      const expected = "bc1qp0q396yh72j5830m6hh4nwfjzwxhagzu95mw4n";
      expect(normalizeAddress(mixedCase)).toBe(expected);
    });

    it("should normalize Bech32m (Taproot) Bitcoin addresses to lowercase", () => {
      const taproot =
        "bc1p5d7rjq7g6rdk2yhzks9smlaqtedr4dekq08ge8ztwac72sfr9rusxg3297";
      expect(normalizeAddress(taproot)).toBe(taproot.toLowerCase());
    });

    it("should preserve case for Bitcoin Legacy (P2PKH) addresses", () => {
      const legacy = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa";
      expect(normalizeAddress(legacy)).toBe(legacy);
    });

    it("should preserve case for Bitcoin P2SH addresses", () => {
      const p2sh = "3Cbq7aT1tY8kMxWLbitaG7yT6bPbKChq64";
      expect(normalizeAddress(p2sh)).toBe(p2sh);
    });

    it("should handle addresses with leading/trailing whitespace", () => {
      const ethWithSpace = "  0x742d35Cc6634C0532925a3b844Bc9e7595f0beb1  ";
      const btcWithSpace = "  bc1qp0q396yh72j5830m6hh4nwfjzwxhagzu95mw4n  ";

      expect(normalizeAddress(ethWithSpace)).toBe(
        "0x742d35cc6634c0532925a3b844bc9e7595f0beb1",
      );
      expect(normalizeAddress(btcWithSpace)).toBe(
        "bc1qp0q396yh72j5830m6hh4nwfjzwxhagzu95mw4n",
      );
    });

    it("should throw on invalid addresses", () => {
      expect(() => normalizeAddress("invalid")).toThrow();
      expect(() => normalizeAddress("0xInvalidAddress")).toThrow();
      expect(() => normalizeAddress("not-an-address")).toThrow();
    });

    it("should throw on empty or null input", () => {
      expect(() => normalizeAddress("")).toThrow("must be a non-empty string");
      expect(() => normalizeAddress(null as unknown as string)).toThrow(
        "must be a non-empty string",
      );
      expect(() => normalizeAddress(undefined as unknown as string)).toThrow(
        "must be a non-empty string",
      );
    });

    it("should correctly detect and normalize Ethereum vs Bitcoin", () => {
      const ethAddresses = [
        "0x742d35Cc6634C0532925a3b844Bc9e7595f0beb1",
        "0x0000000000000000000000000000000000000000",
      ];

      const btcAddresses = [
        "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
        "bc1qp0q396yh72j5830m6hh4nwfjzwxhagzu95mw4n",
        "3Cbq7aT1tY8kMxWLbitaG7yT6bPbKChq64",
      ];

      // All Ethereum should be lowercase
      ethAddresses.forEach((addr) => {
        const normalized = normalizeAddress(addr);
        expect(normalized).toBe(normalized.toLowerCase());
      });

      // Bitcoin normalization depends on type
      btcAddresses.forEach((addr) => {
        const normalized = normalizeAddress(addr);
        expect(normalized).toBeDefined();
        // Bech32 should be lowercase, Legacy/P2SH preserves case
        if (addr.toLowerCase().startsWith("bc1")) {
          expect(normalized).toBe(normalized.toLowerCase());
        }
      });
    });

    it("should be idempotent (normalizing twice gives same result)", () => {
      const addresses = [
        "0x742d35Cc6634C0532925a3b844Bc9e7595f0beb1",
        "bc1qp0q396yh72j5830m6hh4nwfjzwxhagzu95mw4n",
        "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
      ];

      addresses.forEach((addr) => {
        const normalized1 = normalizeAddress(addr);
        const normalized2 = normalizeAddress(normalized1);
        expect(normalized1).toBe(normalized2);
      });
    });

    it("should handle the bug case: Joey's Bitcoin address", () => {
      const joeyAddress = "bc1qp0q396yh72j5830m6hh4nwfjzwxhagzu95mw4n";
      const normalized = normalizeAddress(joeyAddress);

      expect(normalized).toBe(joeyAddress);
      expect(normalized).toBe("bc1qp0q396yh72j5830m6hh4nwfjzwxhagzu95mw4n");
    });
  });
});
