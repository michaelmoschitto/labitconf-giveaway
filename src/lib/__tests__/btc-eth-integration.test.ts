import { describe, expect, it } from "bun:test";

import {
  detectAddressType,
  normalizeEthAddress,
  normalizeBitcoinAddress,
  validateAddress,
} from "@/lib/address-utils";
import { generateReferralCode, isCodeFromWallet } from "@/lib/referral";

describe("BTC/ETH Integration Tests", () => {
  // Test addresses (with valid EIP-55 checksums for ETH addresses)
  const addresses = {
    eth1: "0x742d35cC6634c0532925A3b844bc9E7595F0beB1",
    eth2: "0x1234567890123456789012345678901234567890",
    btcLegacy: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    btcP2SH: "3Cbq7aT1tY8kMxWLbitaG7yT6bPbKChq64",
    btcBech32: "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq",
    btcTaproot:
      "bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxqkedrcr",
  };

  describe("Full referral flow - ETH referrer → ETH referee", () => {
    it("should complete full ETH-to-ETH referral flow", async () => {
      // Step 1: Alice creates entry with ETH address
      const aliceAddress = addresses.eth1;
      expect(validateAddress(aliceAddress)).toBe(true);
      expect(detectAddressType(aliceAddress)).toBe("ethereum");

      // Step 2: Generate referral code for Alice
      const aliceCode = await generateReferralCode(aliceAddress);
      expect(aliceCode).toBeDefined();
      expect(aliceCode.length).toBe(8);

      // Step 3: Verify code belongs to Alice
      expect(await isCodeFromWallet(aliceCode, aliceAddress)).toBe(true);

      // Step 4: Bob creates entry with ETH address using Alice's code
      const bobAddress = addresses.eth2;
      expect(validateAddress(bobAddress)).toBe(true);
      expect(detectAddressType(bobAddress)).toBe("ethereum");

      // Step 5: Generate Bob's referral code
      const bobCode = await generateReferralCode(bobAddress);
      expect(bobCode).toBeDefined();
      expect(bobCode.length).toBe(8);

      // Step 6: Verify codes are different
      expect(aliceCode).not.toBe(bobCode);

      // Step 7: Verify Bob can't self-refer
      expect(await isCodeFromWallet(bobCode, bobAddress)).toBe(true);

      // Step 8: Verify Bob's code doesn't match Alice's wallet
      expect(await isCodeFromWallet(bobCode, aliceAddress)).toBe(false);
    });
  });

  describe("Full referral flow - BTC referrer → BTC referee", () => {
    it("should complete full BTC-to-BTC referral flow", async () => {
      // Step 1: Alice creates entry with BTC Legacy address
      const aliceAddress = addresses.btcLegacy;
      expect(validateAddress(aliceAddress)).toBe(true);
      expect(detectAddressType(aliceAddress)).toBe("bitcoin");

      // Step 2: Generate referral code for Alice
      const aliceCode = await generateReferralCode(aliceAddress);
      expect(aliceCode).toBeDefined();
      expect(aliceCode.length).toBe(8);

      // Step 3: Bob creates entry with BTC Bech32 address using Alice's code
      const bobAddress = addresses.btcBech32;
      expect(validateAddress(bobAddress)).toBe(true);
      expect(detectAddressType(bobAddress)).toBe("bitcoin");

      // Step 4: Generate Bob's referral code
      const bobCode = await generateReferralCode(bobAddress);
      expect(bobCode).toBeDefined();

      // Step 5: Verify codes are different
      expect(aliceCode).not.toBe(bobCode);

      // Step 6: Verify each code matches only its owner
      expect(await isCodeFromWallet(aliceCode, aliceAddress)).toBe(true);
      expect(await isCodeFromWallet(bobCode, bobAddress)).toBe(true);
      expect(await isCodeFromWallet(aliceCode, bobAddress)).toBe(false);
      expect(await isCodeFromWallet(bobCode, aliceAddress)).toBe(false);
    });
  });

  describe("Full referral flow - ETH referrer → BTC referee", () => {
    it("should complete full ETH-to-BTC referral flow", async () => {
      // Step 1: Alice creates entry with ETH address
      const aliceAddress = addresses.eth1;
      expect(validateAddress(aliceAddress)).toBe(true);

      // Step 2: Generate referral code for Alice (ETH)
      const aliceCode = await generateReferralCode(aliceAddress);

      // Step 3: Bob creates entry with BTC address using Alice's ETH code
      const bobAddress = addresses.btcBech32;
      expect(validateAddress(bobAddress)).toBe(true);

      // Step 4: Generate Bob's referral code (BTC)
      const bobCode = await generateReferralCode(bobAddress);

      // Step 5: Verify cross-type referral works
      expect(aliceCode).toBeDefined();
      expect(bobCode).toBeDefined();
      expect(aliceCode).not.toBe(bobCode);

      // Step 6: Verify codes match only their respective owners
      expect(await isCodeFromWallet(aliceCode, aliceAddress)).toBe(true);
      expect(await isCodeFromWallet(bobCode, bobAddress)).toBe(true);
      expect(await isCodeFromWallet(aliceCode, bobAddress)).toBe(false);
      expect(await isCodeFromWallet(bobCode, aliceAddress)).toBe(false);
    });
  });

  describe("Full referral flow - BTC referrer → ETH referee", () => {
    it("should complete full BTC-to-ETH referral flow", async () => {
      // Step 1: Alice creates entry with BTC address
      const aliceAddress = addresses.btcLegacy;
      expect(validateAddress(aliceAddress)).toBe(true);

      // Step 2: Generate referral code for Alice (BTC)
      const aliceCode = await generateReferralCode(aliceAddress);

      // Step 3: Bob creates entry with ETH address using Alice's BTC code
      const bobAddress = addresses.eth2;
      expect(validateAddress(bobAddress)).toBe(true);

      // Step 4: Generate Bob's referral code (ETH)
      const bobCode = await generateReferralCode(bobAddress);

      // Step 5: Verify cross-type referral works
      expect(aliceCode).toBeDefined();
      expect(bobCode).toBeDefined();
      expect(aliceCode).not.toBe(bobCode);

      // Step 6: Verify codes match only their respective owners
      expect(await isCodeFromWallet(aliceCode, aliceAddress)).toBe(true);
      expect(await isCodeFromWallet(bobCode, bobAddress)).toBe(true);
      expect(await isCodeFromWallet(aliceCode, bobAddress)).toBe(false);
      expect(await isCodeFromWallet(bobCode, aliceAddress)).toBe(false);
    });
  });

  describe("Address normalization consistency", () => {
    it("should normalize ETH addresses consistently", () => {
      const ethAddress = addresses.eth1;
      const normalized = normalizeEthAddress(ethAddress);

      expect(normalized).toBe(ethAddress.toLowerCase());
      expect(normalized).toHaveLength(42);
      expect(normalized.startsWith("0x")).toBe(true);
    });

    it("should normalize BTC Bech32 addresses to lowercase", () => {
      const btcBech32 = addresses.btcBech32;
      const normalized = normalizeBitcoinAddress(btcBech32);
      expect(normalized).toBe(btcBech32.toLowerCase());
    });

    it("should preserve case for BTC Legacy addresses", () => {
      const btcLegacy = addresses.btcLegacy;
      const normalized = normalizeBitcoinAddress(btcLegacy);
      expect(normalized).toBe(btcLegacy); // Keep original case
    });

    it("should produce same referral code for normalized and non-normalized addresses", async () => {
      // ETH - case-insensitive
      const ethUpper = addresses.eth1.toUpperCase();
      const ethLower = addresses.eth1.toLowerCase();
      const ethMixed = addresses.eth1;

      const code1 = await generateReferralCode(ethUpper);
      const code2 = await generateReferralCode(ethLower);
      const code3 = await generateReferralCode(ethMixed);

      expect(code1).toBe(code2);
      expect(code2).toBe(code3);

      // BTC Bech32 - case-insensitive
      const btcBech32Upper = addresses.btcBech32.toUpperCase();
      const btcBech32Lower = addresses.btcBech32.toLowerCase();

      const btcCode1 = await generateReferralCode(btcBech32Upper);
      const btcCode2 = await generateReferralCode(btcBech32Lower);

      expect(btcCode1).toBe(btcCode2);
    });
  });

  describe("Multi-user scenario with mixed address types", () => {
    it("should handle complex referral chain with mixed address types", async () => {
      // Create a referral chain: ETH → BTC → ETH → BTC
      const users = [
        { address: addresses.eth1, type: "ethereum" },
        { address: addresses.btcLegacy, type: "bitcoin" },
        { address: addresses.eth2, type: "ethereum" },
        { address: addresses.btcBech32, type: "bitcoin" },
      ];

      const codes: string[] = [];

      // Generate codes for all users
      for (const user of users) {
        expect(validateAddress(user.address)).toBe(true);
        expect(detectAddressType(user.address)).toBe(user.type);

        const code = await generateReferralCode(user.address);
        expect(code).toBeDefined();
        expect(code.length).toBe(8);

        codes.push(code);
      }

      // Verify all codes are unique
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(users.length);

      // Verify each code matches only its owner
      for (let i = 0; i < users.length; i++) {
        const userAddress = users[i].address;
        const userCode = codes[i];

        // Should match own wallet
        expect(await isCodeFromWallet(userCode, userAddress)).toBe(true);

        // Should not match any other wallet
        for (let j = 0; j < users.length; j++) {
          if (i !== j) {
            expect(await isCodeFromWallet(userCode, users[j].address)).toBe(
              false,
            );
          }
        }
      }
    });
  });

  describe("Edge cases with mixed types", () => {
    it("should handle all BTC address formats in mixed scenario", async () => {
      const btcAddresses = [
        addresses.btcLegacy,
        addresses.btcP2SH,
        addresses.btcBech32,
        addresses.btcTaproot,
      ];

      const codes = await Promise.all(
        btcAddresses.map((addr) => generateReferralCode(addr)),
      );

      // All should be valid and unique
      expect(codes).toHaveLength(btcAddresses.length);
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(btcAddresses.length);

      // Each should validate correctly
      for (let i = 0; i < btcAddresses.length; i++) {
        expect(validateAddress(btcAddresses[i])).toBe(true);
        expect(detectAddressType(btcAddresses[i])).toBe("bitcoin");
        expect(await isCodeFromWallet(codes[i], btcAddresses[i])).toBe(true);
      }
    });

    it("should prevent self-referral for both ETH and BTC", async () => {
      const ethAddress = addresses.eth1;
      const btcAddress = addresses.btcLegacy;

      const ethCode = await generateReferralCode(ethAddress);
      const btcCode = await generateReferralCode(btcAddress);

      // Detect self-referral attempts
      expect(await isCodeFromWallet(ethCode, ethAddress)).toBe(true);
      expect(await isCodeFromWallet(btcCode, btcAddress)).toBe(true);
    });

    it("should handle referral between different BTC address formats", async () => {
      // Alice uses Legacy, Bob uses Bech32
      const aliceAddress = addresses.btcLegacy;
      const bobAddress = addresses.btcBech32;

      const aliceCode = await generateReferralCode(aliceAddress);
      const bobCode = await generateReferralCode(bobAddress);

      expect(aliceCode).not.toBe(bobCode);
      expect(await isCodeFromWallet(aliceCode, aliceAddress)).toBe(true);
      expect(await isCodeFromWallet(bobCode, bobAddress)).toBe(true);
      expect(await isCodeFromWallet(aliceCode, bobAddress)).toBe(false);
      expect(await isCodeFromWallet(bobCode, aliceAddress)).toBe(false);
    });
  });

  describe("Address type detection robustness", () => {
    it("should correctly detect address types for all formats", () => {
      // Ethereum
      expect(detectAddressType(addresses.eth1)).toBe("ethereum");
      expect(detectAddressType(addresses.eth2)).toBe("ethereum");

      // Invalid short address should throw
      expect(() => detectAddressType("0xABCDEF1234567890")).toThrow();

      // Bitcoin
      expect(detectAddressType(addresses.btcLegacy)).toBe("bitcoin");
      expect(detectAddressType(addresses.btcP2SH)).toBe("bitcoin");
      expect(detectAddressType(addresses.btcBech32)).toBe("bitcoin");
      expect(detectAddressType(addresses.btcTaproot)).toBe("bitcoin");
    });

    it("should handle edge cases in address type detection", () => {
      // Empty/invalid should throw
      expect(() => detectAddressType("")).toThrow();
      expect(() => detectAddressType("not-an-address")).toThrow();

      // Validation should return false (not throw)
      expect(validateAddress("")).toBe(false);
      expect(validateAddress("not-an-address")).toBe(false);
    });
  });
});
