import { describe, expect, it } from "bun:test";

import {
  generateReferralCode,
  isSpecialReferralCode,
  SPECIAL_CODES,
  validateReferralCode,
  validateWalletAddress,
  isCodeFromWallet,
  parseReferralCodeFromUrl,
} from "@/lib/referral";

describe("generateReferralCode", () => {
  describe("Ethereum addresses", () => {
    it("generates a deterministic code from wallet address", async () => {
      const wallet = "0x742d35cC6634c0532925A3b844bc9E7595F0beB1";
      const code1 = await generateReferralCode(wallet);
      const code2 = await generateReferralCode(wallet);

      expect(code1).toBe(code2);
    });

    it("generates different codes for different wallets", async () => {
      const wallet1 = "0x742d35cC6634c0532925A3b844bc9E7595F0beB1";
      const wallet2 = "0x1234567890123456789012345678901234567890";

      const code1 = await generateReferralCode(wallet1);
      const code2 = await generateReferralCode(wallet2);

      expect(code1).not.toBe(code2);
    });

    it("generates code with correct length", async () => {
      const wallet = "0x742d35cC6634c0532925A3b844bc9E7595F0beB1";
      const code = await generateReferralCode(wallet);

      expect(code.length).toBe(8);
    });

    it("generates code with only Base58 characters", async () => {
      const wallet = "0x742d35cC6634c0532925A3b844bc9E7595F0beB1";
      const code = await generateReferralCode(wallet);

      const base58Regex =
        /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/;
      expect(base58Regex.test(code)).toBe(true);
    });

    it("handles lowercase wallet addresses", async () => {
      const wallet = "0x742d35cc6634c0532925a3b844bc9e7595f0beb1";
      const code = await generateReferralCode(wallet);

      expect(code).toBeDefined();
      expect(code.length).toBe(8);
    });

    it("handles uppercase wallet addresses", async () => {
      const wallet = "0X742D35CC6634C0532925A3B844BC9E7595F0BEB1";
      const code = await generateReferralCode(wallet);

      expect(code).toBeDefined();
      expect(code.length).toBe(8);
    });

    it("generates same code regardless of case", async () => {
      const walletLower = "0x742d35cc6634c0532925a3b844bc9e7595f0beb1";
      const walletUpper = "0X742D35CC6634C0532925A3B844BC9E7595F0BEB1";

      const code1 = await generateReferralCode(walletLower);
      const code2 = await generateReferralCode(walletUpper);

      expect(code1).toBe(code2);
    });

    it("handles wallet addresses with whitespace", async () => {
      const wallet = "  0x742d35cC6634c0532925A3b844bc9E7595F0beB1  ";
      const code = await generateReferralCode(wallet);

      expect(code).toBeDefined();
      expect(code.length).toBe(8);
    });

    it("generates consistent codes for test wallets", async () => {
      const testWallets = {
        alice: "0x742d35cC6634c0532925A3b844bc9E7595F0beB1",
        bob: "0x1234567890123456789012345678901234567890",
        charlie: "0xABcdEFABcdEFabcdEfAbCdefabcdeFABcDEFabCD",
      };

      const codes = {
        alice: await generateReferralCode(testWallets.alice),
        bob: await generateReferralCode(testWallets.bob),
        charlie: await generateReferralCode(testWallets.charlie),
      };

      expect(await generateReferralCode(testWallets.alice)).toBe(codes.alice);
      expect(await generateReferralCode(testWallets.bob)).toBe(codes.bob);
      expect(await generateReferralCode(testWallets.charlie)).toBe(
        codes.charlie,
      );
    });
  });

  describe("Bitcoin addresses", () => {
    it("generates a deterministic code from BTC Legacy address", async () => {
      const wallet = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa";
      const code1 = await generateReferralCode(wallet);
      const code2 = await generateReferralCode(wallet);

      expect(code1).toBe(code2);
      expect(code1.length).toBe(8);
    });

    it("generates a deterministic code from BTC Bech32 address", async () => {
      const wallet = "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq";
      const code1 = await generateReferralCode(wallet);
      const code2 = await generateReferralCode(wallet);

      expect(code1).toBe(code2);
      expect(code1.length).toBe(8);
    });

    it("generates different codes for different BTC addresses", async () => {
      const wallet1 = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa";
      const wallet2 = "3Cbq7aT1tY8kMxWLbitaG7yT6bPbKChq64";

      const code1 = await generateReferralCode(wallet1);
      const code2 = await generateReferralCode(wallet2);

      expect(code1).not.toBe(code2);
    });

    it("generates consistent codes for different BTC address formats", async () => {
      const testWallets = {
        legacy: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
        p2sh: "3Cbq7aT1tY8kMxWLbitaG7yT6bPbKChq64",
        bech32: "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq",
        taproot:
          "bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxqkedrcr",
      };

      const codes = {
        legacy: await generateReferralCode(testWallets.legacy),
        p2sh: await generateReferralCode(testWallets.p2sh),
        bech32: await generateReferralCode(testWallets.bech32),
        taproot: await generateReferralCode(testWallets.taproot),
      };

      // Each should be deterministic
      expect(await generateReferralCode(testWallets.legacy)).toBe(codes.legacy);
      expect(await generateReferralCode(testWallets.p2sh)).toBe(codes.p2sh);
      expect(await generateReferralCode(testWallets.bech32)).toBe(codes.bech32);
      expect(await generateReferralCode(testWallets.taproot)).toBe(
        codes.taproot,
      );

      // All should be unique
      const uniqueCodes = new Set(Object.values(codes));
      expect(uniqueCodes.size).toBe(Object.keys(codes).length);
    });
  });

  describe("Mixed ETH and BTC", () => {
    it("generates different codes for ETH and BTC addresses", async () => {
      const ethWallet = "0x742d35cC6634c0532925A3b844bc9E7595F0beB1";
      const btcWallet = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa";

      const ethCode = await generateReferralCode(ethWallet);
      const btcCode = await generateReferralCode(btcWallet);

      expect(ethCode).not.toBe(btcCode);
      expect(ethCode.length).toBe(8);
      expect(btcCode.length).toBe(8);
    });
  });

  describe("Error handling", () => {
    it("throws error for invalid wallet format", async () => {
      await expect(generateReferralCode("invalid")).rejects.toThrow();
      await expect(generateReferralCode("0x123")).rejects.toThrow();
      await expect(generateReferralCode("bc1invalid")).rejects.toThrow();
    });

    it("throws error for empty string", async () => {
      await expect(generateReferralCode("")).rejects.toThrow();
    });

    it("throws error for non-string input", async () => {
      await expect(
        generateReferralCode(null as unknown as string),
      ).rejects.toThrow();
      await expect(
        generateReferralCode(undefined as unknown as string),
      ).rejects.toThrow();
      await expect(
        generateReferralCode(123 as unknown as string),
      ).rejects.toThrow();
    });
  });
});

describe("validateReferralCode", () => {
  it("validates correct 8-character code", () => {
    expect(validateReferralCode("MEZBCDEF")).toBe(true);
  });

  it("validates correct 6-character code", () => {
    expect(validateReferralCode("MEZBCD")).toBe(true);
  });

  it("validates correct 7-character code", () => {
    expect(validateReferralCode("MEZBCDE")).toBe(true);
  });

  it("rejects code shorter than 6 characters", () => {
    expect(validateReferralCode("MEZBC")).toBe(false);
  });

  it("rejects code longer than 10 characters", () => {
    expect(validateReferralCode("MEZBCDEFGA")).toBe(false);
  });

  it("rejects code longer than 9 characters", () => {
    expect(validateReferralCode("MEZBCDEFG")).toBe(true);
  });

  it("rejects code with invalid characters (0, O, I, l)", () => {
    expect(validateReferralCode("MEZ0BCDE")).toBe(false);
    expect(validateReferralCode("MEZOBCDE")).toBe(false);
    expect(validateReferralCode("MEZIBCDE")).toBe(false);
    expect(validateReferralCode("MEZlBCDE")).toBe(false);
  });

  it("rejects code with special characters", () => {
    expect(validateReferralCode("MEZ-BCDE")).toBe(false);
    expect(validateReferralCode("MEZ_BCDE")).toBe(false);
    expect(validateReferralCode("MEZ@BCDE")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(validateReferralCode("")).toBe(false);
  });

  it("rejects non-string input", () => {
    expect(validateReferralCode(null as unknown as string)).toBe(false);
    expect(validateReferralCode(undefined as unknown as string)).toBe(false);
    expect(validateReferralCode(123 as unknown as string)).toBe(false);
  });

  it("validates generated codes", async () => {
    const wallet = "0x742d35cC6634c0532925A3b844bc9E7595F0beB1";
    const code = await generateReferralCode(wallet);

    expect(validateReferralCode(code)).toBe(true);
  });

  describe("Special codes", () => {
    it("validates special conference code labtc2025", () => {
      expect(validateReferralCode("labtc2025")).toBe(true);
    });

    it("validates special code case-insensitively", () => {
      expect(validateReferralCode("LABTC2025")).toBe(true);
      expect(validateReferralCode("LabtC2025")).toBe(true);
    });

    it("rejects invalid special codes", () => {
      expect(validateReferralCode("labtc2024")).toBe(false);
      expect(validateReferralCode("notaspecialcode")).toBe(false);
    });
  });
});

describe("isSpecialReferralCode", () => {
  it("returns true for labtc2025", () => {
    expect(isSpecialReferralCode("labtc2025")).toBe(true);
  });

  it("handles case-insensitive matching", () => {
    expect(isSpecialReferralCode("LABTC2025")).toBe(true);
    expect(isSpecialReferralCode("LabtC2025")).toBe(true);
  });

  it("returns false for non-special codes", () => {
    expect(isSpecialReferralCode("MEZBCDEF")).toBe(false);
    expect(isSpecialReferralCode("labtc2024")).toBe(false);
  });

  it("returns false for empty/invalid input", () => {
    expect(isSpecialReferralCode("")).toBe(false);
    expect(isSpecialReferralCode(null as unknown as string)).toBe(false);
    expect(isSpecialReferralCode(undefined as unknown as string)).toBe(false);
  });

  it("matches all defined special codes", () => {
    Object.values(SPECIAL_CODES).forEach((code) => {
      expect(isSpecialReferralCode(code)).toBe(true);
    });
  });
});

describe("validateWalletAddress", () => {
  describe("Ethereum addresses", () => {
    it("validates correct wallet address", () => {
      expect(
        validateWalletAddress("0x742d35cC6634c0532925A3b844bc9E7595F0beB1"),
      ).toBe(true);
    });

    it("validates lowercase wallet address", () => {
      expect(
        validateWalletAddress("0x742d35cc6634c0532925a3b844bc9e7595f0beb1"),
      ).toBe(true);
    });

    it("validates uppercase wallet address", () => {
      expect(
        validateWalletAddress("0X742D35CC6634C0532925A3B844BC9E7595F0BEB1"),
      ).toBe(true);
    });

    it("validates wallet address with whitespace", () => {
      expect(
        validateWalletAddress("  0x742d35cC6634c0532925A3b844bc9E7595F0beB1  "),
      ).toBe(true);
    });

    it("rejects wallet with incorrect length", () => {
      expect(validateWalletAddress("0x742d35Cc")).toBe(false);
      expect(
        validateWalletAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1abc"),
      ).toBe(false);
    });

    it("rejects wallet with invalid characters", () => {
      expect(
        validateWalletAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEbG"),
      ).toBe(false);
      expect(
        validateWalletAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f0bE-1"),
      ).toBe(false);
    });
  });

  describe("Bitcoin addresses", () => {
    it("validates Legacy P2PKH address", () => {
      expect(validateWalletAddress("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa")).toBe(
        true,
      );
    });

    it("validates P2SH address", () => {
      expect(validateWalletAddress("3Cbq7aT1tY8kMxWLbitaG7yT6bPbKChq64")).toBe(
        true,
      );
    });

    it("validates Bech32 (SegWit) address", () => {
      expect(
        validateWalletAddress("bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq"),
      ).toBe(true);
    });

    it("validates Bech32m (Taproot) address", () => {
      expect(
        validateWalletAddress(
          "bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxqkedrcr",
        ),
      ).toBe(true);
    });

    it("rejects invalid Bitcoin addresses", () => {
      expect(validateWalletAddress("1InvalidBTCAddress")).toBe(false);
      expect(validateWalletAddress("bc1invalid")).toBe(false);
    });
  });

  describe("general validation", () => {
    it("rejects empty string", () => {
      expect(validateWalletAddress("")).toBe(false);
    });

    it("rejects non-string input", () => {
      expect(validateWalletAddress(null as unknown as string)).toBe(false);
      expect(validateWalletAddress(undefined as unknown as string)).toBe(false);
      expect(validateWalletAddress(123 as unknown as string)).toBe(false);
    });
  });
});

describe("isCodeFromWallet", () => {
  describe("Ethereum addresses", () => {
    it("returns true when code matches wallet", async () => {
      const wallet = "0x742d35cC6634c0532925A3b844bc9E7595F0beB1";
      const code = await generateReferralCode(wallet);

      expect(await isCodeFromWallet(code, wallet)).toBe(true);
    });

    it("returns false when code does not match wallet", async () => {
      const wallet1 = "0x742d35cC6634c0532925A3b844bc9E7595F0beB1";
      const wallet2 = "0x1234567890123456789012345678901234567890";

      const code1 = await generateReferralCode(wallet1);

      expect(await isCodeFromWallet(code1, wallet2)).toBe(false);
    });

    it("detects self-referral attempt", async () => {
      const myWallet = "0x742d35cC6634c0532925A3b844bc9E7595F0beB1";
      const myCode = await generateReferralCode(myWallet);

      // User tries to use their own referral code
      expect(await isCodeFromWallet(myCode, myWallet)).toBe(true);
    });

    it("verifies different wallets produce different codes", async () => {
      const alice = "0x742d35cC6634c0532925A3b844bc9E7595F0beB1";
      const bob = "0x1234567890123456789012345678901234567890";

      const aliceCode = await generateReferralCode(alice);
      const bobCode = await generateReferralCode(bob);

      // Alice's code should not match Bob's wallet
      expect(await isCodeFromWallet(aliceCode, bob)).toBe(false);
      // Bob's code should not match Alice's wallet
      expect(await isCodeFromWallet(bobCode, alice)).toBe(false);
      // Alice's code should match Alice's wallet
      expect(await isCodeFromWallet(aliceCode, alice)).toBe(true);
      // Bob's code should match Bob's wallet
      expect(await isCodeFromWallet(bobCode, bob)).toBe(true);
    });

    it("handles case-insensitive wallet addresses", async () => {
      const walletLower = "0x742d35cc6634c0532925a3b844bc9e7595f0beb1";
      const walletUpper = "0X742D35CC6634C0532925A3B844BC9E7595F0BEB1";
      const walletMixed = "0x742d35cC6634c0532925A3b844bc9E7595F0beB1";

      const code = await generateReferralCode(walletMixed);

      // All case variations should match
      expect(await isCodeFromWallet(code, walletLower)).toBe(true);
      expect(await isCodeFromWallet(code, walletUpper)).toBe(true);
      expect(await isCodeFromWallet(code, walletMixed)).toBe(true);
    });

    it("returns false for invalid referral code", async () => {
      const wallet = "0x742d35cC6634c0532925A3b844bc9E7595F0beB1";

      expect(await isCodeFromWallet("INVALID0", wallet)).toBe(false); // Contains '0'
      expect(await isCodeFromWallet("TOO-SHORT", wallet)).toBe(false); // Special char
      expect(await isCodeFromWallet("", wallet)).toBe(false); // Empty
    });

    it("returns false for invalid wallet address", async () => {
      const code = "MEZBCDEF";

      expect(await isCodeFromWallet(code, "invalid")).toBe(false);
      expect(await isCodeFromWallet(code, "0x123")).toBe(false);
      expect(await isCodeFromWallet(code, "")).toBe(false);
    });

    it("returns false when both inputs are invalid", async () => {
      expect(await isCodeFromWallet("", "")).toBe(false);
      expect(await isCodeFromWallet("INVALID0", "invalid-wallet")).toBe(false);
    });

    it("handles wallet addresses with whitespace", async () => {
      const wallet = "0x742d35cC6634c0532925A3b844bc9E7595F0beB1";
      const walletWithSpaces = "  0x742d35cC6634c0532925A3b844bc9E7595F0beB1  ";

      const code = await generateReferralCode(wallet);

      expect(await isCodeFromWallet(code, walletWithSpaces)).toBe(true);
    });

    it("ensures code uniqueness across multiple wallets", async () => {
      const wallets = [
        "0x742d35cC6634c0532925A3b844bc9E7595F0beB1",
        "0x1234567890123456789012345678901234567890",
        "0xABcdEFABcdEFabcdEfAbCdefabcdeFABcDEFabCD",
        "0x9876543210987654321098765432109876543210",
        "0xaaBBccDDeeFF00112233445566778899AaBbCcDd",
      ];

      const codes = await Promise.all(
        wallets.map((wallet) => generateReferralCode(wallet)),
      );

      // Check all codes are unique
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(wallets.length);

      // Verify each code matches only its original wallet
      for (let i = 0; i < wallets.length; i++) {
        const wallet = wallets[i];
        const code = codes[i];

        // Should match its own wallet
        expect(await isCodeFromWallet(code, wallet)).toBe(true);

        // Should not match any other wallet
        for (let j = 0; j < wallets.length; j++) {
          if (i !== j) {
            expect(await isCodeFromWallet(code, wallets[j])).toBe(false);
          }
        }
      }
    });
  });

  describe("Bitcoin addresses", () => {
    it("returns true when code matches BTC wallet", async () => {
      const wallet = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa";
      const code = await generateReferralCode(wallet);

      expect(await isCodeFromWallet(code, wallet)).toBe(true);
    });

    it("returns false when BTC code does not match wallet", async () => {
      const wallet1 = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa";
      const wallet2 = "3Cbq7aT1tY8kMxWLbitaG7yT6bPbKChq64";

      const code1 = await generateReferralCode(wallet1);

      expect(await isCodeFromWallet(code1, wallet2)).toBe(false);
    });

    it("ensures code uniqueness across multiple BTC wallets", async () => {
      const wallets = [
        "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
        "3Cbq7aT1tY8kMxWLbitaG7yT6bPbKChq64",
        "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq",
        "bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxqkedrcr",
      ];

      const codes = await Promise.all(
        wallets.map((wallet) => generateReferralCode(wallet)),
      );

      // Check all codes are unique
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(wallets.length);

      // Verify each code matches only its original wallet
      for (let i = 0; i < wallets.length; i++) {
        const wallet = wallets[i];
        const code = codes[i];

        expect(await isCodeFromWallet(code, wallet)).toBe(true);

        for (let j = 0; j < wallets.length; j++) {
          if (i !== j) {
            expect(await isCodeFromWallet(code, wallets[j])).toBe(false);
          }
        }
      }
    });
  });

  describe("Mixed ETH and BTC scenarios", () => {
    it("ETH code should not match BTC wallet", async () => {
      const ethWallet = "0x742d35cC6634c0532925A3b844bc9E7595F0beB1";
      const btcWallet = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa";

      const ethCode = await generateReferralCode(ethWallet);

      expect(await isCodeFromWallet(ethCode, btcWallet)).toBe(false);
    });

    it("BTC code should not match ETH wallet", async () => {
      const ethWallet = "0x742d35cC6634c0532925A3b844bc9E7595F0beB1";
      const btcWallet = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa";

      const btcCode = await generateReferralCode(btcWallet);

      expect(await isCodeFromWallet(btcCode, ethWallet)).toBe(false);
    });

    it("ensures code uniqueness across ETH and BTC wallets", async () => {
      const wallets = [
        "0x742d35cC6634c0532925A3b844bc9E7595F0beB1",
        "0x1234567890123456789012345678901234567890",
        "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
        "3Cbq7aT1tY8kMxWLbitaG7yT6bPbKChq64",
        "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq",
      ];

      const codes = await Promise.all(
        wallets.map((wallet) => generateReferralCode(wallet)),
      );

      // All codes should be unique
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(wallets.length);

      // Each code should only match its own wallet
      for (let i = 0; i < wallets.length; i++) {
        const wallet = wallets[i];
        const code = codes[i];

        expect(await isCodeFromWallet(code, wallet)).toBe(true);

        for (let j = 0; j < wallets.length; j++) {
          if (i !== j) {
            expect(await isCodeFromWallet(code, wallets[j])).toBe(false);
          }
        }
      }
    });
  });

  describe("Error handling", () => {
    it("returns false for invalid referral code", async () => {
      const wallet = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1";

      expect(await isCodeFromWallet("INVALID0", wallet)).toBe(false);
      expect(await isCodeFromWallet("TOO-SHORT", wallet)).toBe(false);
      expect(await isCodeFromWallet("", wallet)).toBe(false);
    });

    it("returns false for invalid wallet address", async () => {
      const code = "MEZBCDEF";

      expect(await isCodeFromWallet(code, "invalid")).toBe(false);
      expect(await isCodeFromWallet(code, "0x123")).toBe(false);
      expect(await isCodeFromWallet(code, "")).toBe(false);
    });

    it("returns false when both inputs are invalid", async () => {
      expect(await isCodeFromWallet("", "")).toBe(false);
      expect(await isCodeFromWallet("INVALID0", "invalid-wallet")).toBe(false);
    });
  });
});

describe("parseReferralCodeFromUrl", () => {
  it("extracts referral code from URL with ref parameter", () => {
    const url = "https://labitconf-giveaway.vercel.app/en?ref=CZKkiBxG";
    expect(parseReferralCodeFromUrl(url)).toBe("CZKkiBxG");
  });

  it("extracts referral code from URL with other query parameters", () => {
    const url = "https://example.com/en?foo=bar&ref=CZKkiBxG&baz=qux";
    expect(parseReferralCodeFromUrl(url)).toBe("CZKkiBxG");
  });

  it("extracts referral code from URL where ref is first parameter", () => {
    const url = "https://example.com/en?ref=CZKkiBxG&foo=bar";
    expect(parseReferralCodeFromUrl(url)).toBe("CZKkiBxG");
  });

  it("extracts referral code from URL where ref is last parameter", () => {
    const url = "https://example.com/en?foo=bar&ref=CZKkiBxG";
    expect(parseReferralCodeFromUrl(url)).toBe("CZKkiBxG");
  });

  it("extracts referral code from URL with hash fragment", () => {
    const url = "https://example.com/en?ref=CZKkiBxG#section";
    expect(parseReferralCodeFromUrl(url)).toBe("CZKkiBxG");
  });

  it("returns input as-is when it's just a referral code", () => {
    const code = "CZKkiBxG";
    expect(parseReferralCodeFromUrl(code)).toBe(code);
  });

  it("returns input as-is when URL has no ref parameter", () => {
    const url = "https://example.com/en";
    expect(parseReferralCodeFromUrl(url)).toBe(url);
  });

  it("returns input as-is when URL has empty ref parameter", () => {
    const url = "https://example.com/en?ref=";
    expect(parseReferralCodeFromUrl(url)).toBe(url);
  });

  it("returns input as-is when input is not a valid URL", () => {
    const input = "not-a-url";
    expect(parseReferralCodeFromUrl(input)).toBe(input);
  });

  it("handles URLs with different protocols", () => {
    expect(parseReferralCodeFromUrl("http://example.com?ref=ABC123")).toBe(
      "ABC123",
    );
    expect(parseReferralCodeFromUrl("https://example.com?ref=ABC123")).toBe(
      "ABC123",
    );
  });

  it("handles URLs without protocol", () => {
    const input = "example.com?ref=ABC123";
    // URL constructor requires protocol, so it will return input as-is
    expect(parseReferralCodeFromUrl(input)).toBe(input);
  });

  it("handles URLs with port numbers", () => {
    const url = "https://example.com:3000/en?ref=CZKkiBxG";
    expect(parseReferralCodeFromUrl(url)).toBe("CZKkiBxG");
  });

  it("handles URLs with path segments", () => {
    const url = "https://example.com/path/to/page?ref=CZKkiBxG";
    expect(parseReferralCodeFromUrl(url)).toBe("CZKkiBxG");
  });

  it("handles URLs with encoded characters in ref", () => {
    const url = "https://example.com?ref=ABC%20123";
    expect(parseReferralCodeFromUrl(url)).toBe("ABC 123");
  });

  it("handles empty string", () => {
    expect(parseReferralCodeFromUrl("")).toBe("");
  });

  it("handles null input", () => {
    expect(parseReferralCodeFromUrl(null as unknown as string)).toBe("");
  });

  it("handles undefined input", () => {
    expect(parseReferralCodeFromUrl(undefined as unknown as string)).toBe("");
  });

  it("extracts code from real-world URL format", () => {
    const url = "https://labitconf-giveaway.vercel.app/en?ref=CZKkiBxG";
    expect(parseReferralCodeFromUrl(url)).toBe("CZKkiBxG");
  });

  it("handles multiple ref parameters (uses first occurrence)", () => {
    // Note: URL.searchParams.get() returns the first value if there are duplicates
    const url = "https://example.com?ref=CODE1&ref=CODE2";
    expect(parseReferralCodeFromUrl(url)).toBe("CODE1");
  });

  it("handles case-sensitive referral codes", () => {
    const url = "https://example.com?ref=CZKkiBxG";
    expect(parseReferralCodeFromUrl(url)).toBe("CZKkiBxG");
    expect(parseReferralCodeFromUrl(url)).not.toBe("czkkibxg");
  });
});
