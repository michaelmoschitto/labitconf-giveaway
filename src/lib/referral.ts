import { normalizeAddress, validateAddress } from "@/lib/address-utils";

const BASE58_ALPHABET =
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const CODE_LENGTH = 8;

/**
 * Special referral codes for events/promotions
 * These codes don't require an existing referrer but still give bonus entries
 */
export const SPECIAL_CODES = {
  LABTC_2025: "labtc2025",
} as const;

/**
 * Check if a code is a special event/promotion code
 */
export const isSpecialReferralCode = (code: string): boolean => {
  if (!code || typeof code !== "string") {
    return false;
  }
  return (Object.values(SPECIAL_CODES) as string[]).includes(
    code.toLowerCase(),
  );
};

/**
 * Generates a deterministic referral code from a wallet address
 * Same wallet always produces the same code
 * Format: 8 character Base58 string (e.g., "MEZBCDEFG")
 */
export const generateReferralCode = async (
  walletAddress: string,
): Promise<string> => {
  if (!walletAddress || typeof walletAddress !== "string") {
    throw new Error("Invalid wallet address: must be a non-empty string");
  }

  if (!validateAddress(walletAddress)) {
    throw new Error(
      "Invalid wallet address format: must be a valid Ethereum or Bitcoin address",
    );
  }

  const normalized = normalizeAddress(walletAddress);

  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  let code = "";
  let num = BigInt(
    `0x${hashArray
      .slice(0, 8)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")}`,
  );

  while (code.length < CODE_LENGTH) {
    const remainder = Number(num % BigInt(BASE58_ALPHABET.length));
    code = BASE58_ALPHABET[remainder] + code;
    num = num / BigInt(BASE58_ALPHABET.length);
  }

  return code.slice(-CODE_LENGTH);
};

export const validateReferralCode = (code: string): boolean => {
  if (!code || typeof code !== "string") {
    return false;
  }

  if (isSpecialReferralCode(code)) {
    return true;
  }

  if (code.length < 6 || code.length > 9) {
    return false;
  }

  return [...code].every((char) => BASE58_ALPHABET.includes(char));
};

export const validateWalletAddress = (address: string): boolean => {
  return validateAddress(address);
};

export const isCodeFromWallet = async (
  code: string,
  walletAddress: string,
): Promise<boolean> => {
  if (!validateReferralCode(code) || !validateWalletAddress(walletAddress)) {
    return false;
  }

  try {
    const generatedCode = await generateReferralCode(walletAddress);
    return generatedCode === code;
  } catch {
    return false;
  }
};

/**
 * Parses referral code from a URL or returns the input as-is
 * If the input is a URL with a 'ref' query parameter, extracts the code
 * Otherwise, returns the input unchanged (useful when user pastes just the code)
 *
 * @param input - URL string or referral code
 * @returns The referral code extracted from URL or the original input
 *
 * @example
 * parseReferralCodeFromUrl("https://example.com/en?ref=CZKkiBxG") // "CZKkiBxG"
 * parseReferralCodeFromUrl("CZKkiBxG") // "CZKkiBxG"
 * parseReferralCodeFromUrl("https://example.com/en") // "https://example.com/en"
 */
export const parseReferralCodeFromUrl = (input: string): string => {
  if (!input || typeof input !== "string") {
    return input || "";
  }

  try {
    const url = new URL(input);
    const refCode = url.searchParams.get("ref");
    if (refCode) {
      return refCode;
    }
  } catch {
    // Not a valid URL, return input as-is
  }

  return input;
};
