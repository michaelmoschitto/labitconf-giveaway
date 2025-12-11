import { getAddress, isAddress } from "ethers";
import { validate } from "multicoin-address-validator";

// ============================================
// ETHEREUM ADDRESS VALIDATION
// ============================================

export type AddressType = "ethereum" | "bitcoin";

const hasMixedCase = (address: string): boolean => {
  const withoutPrefix = address.slice(2);
  const hasUpper = withoutPrefix !== withoutPrefix.toLowerCase();
  const hasLower = withoutPrefix !== withoutPrefix.toUpperCase();
  return hasUpper && hasLower;
};

export const validateEthereum = (address: string): boolean => {
  if (!address || typeof address !== "string") {
    return false;
  }

  const trimmed = address.trim().toLowerCase();

  return isAddress(trimmed);
};

export const normalizeEthAddress = (address: string): string => {
  if (!address || typeof address !== "string") {
    return "";
  }

  const trimmed = address.trim().toLowerCase();

  if (!isAddress(trimmed)) {
    return "";
  }

  return trimmed;
};

export const toChecksumAddress = (address: string): string => {
  if (!address || typeof address !== "string") {
    throw new Error("Invalid address: must be a non-empty string");
  }

  const trimmed = normalizeEthAddress(address);
  if (!isAddress(trimmed)) {
    throw new Error(
      "Invalid address format: must be 42 characters starting with 0x",
    );
  }

  return getAddress(trimmed);
};

export const isValidChecksum = (address: string): boolean => {
  if (!address || typeof address !== "string" || !isAddress(address)) {
    return false;
  }

  if (!hasMixedCase(address)) {
    return true;
  }

  try {
    return isAddress(address);
  } catch {
    return false;
  }
};

// ============================================
// BITCOIN ADDRESS VALIDATION
// ============================================

export const validateBitcoin = (address: string): boolean => {
  if (!address || typeof address !== "string") {
    return false;
  }
  const trimmed = normalizeBitcoinAddress(address);

  // Legacy (P2PKH), P2SH, Bech32, Bech32m
  return validate(trimmed, "BTC");
};

export const normalizeBitcoinAddress = (address: string): string => {
  if (!address || typeof address !== "string") {
    return "";
  }

  // IMPORTANT: Legacy (P2PKH) and P2SH Bitcoin addresses are case-sensitive
  // because they use Base58Check encoding with checksums. Converting to lowercase
  // breaks validation. Only Bech32/Bech32m addresses are case-insensitive.
  // To maintain consistency and avoid breaking checksums, we preserve the original case.
  const trimmed = address.trim();

  // Normalize Bech32/Bech32m to lowercase (conventional format)
  if (
    trimmed.toLowerCase().startsWith("bc1") ||
    trimmed.toLowerCase().startsWith("tb1")
  ) {
    return trimmed.toLowerCase();
  }

  // Keep Legacy and P2SH addresses in their original case
  return trimmed;
};

// ============================================
// UNIFIED ADDRESS VALIDATION
// ============================================

export const detectAddressType = (address: string): AddressType => {
  if (!address || typeof address !== "string") {
    throw new Error("Invalid address: must be a non-empty string");
  }

  const trimmed = address.trim().toLowerCase();

  if (isAddress(trimmed)) {
    return "ethereum";
  }

  const isBtc = validate(address.trim(), "BTC");
  if (isBtc) return "bitcoin";

  throw new Error(
    "Invalid address: must be a valid Ethereum or Bitcoin address",
  );
};

export const validateAddress = (address: string): boolean => {
  if (!address || typeof address !== "string") {
    return false;
  }

  const trimmed = address.trim();

  try {
    const addressType = detectAddressType(trimmed);

    if (addressType === "ethereum") {
      return validateEthereum(trimmed);
    }

    return validateBitcoin(trimmed);
  } catch {
    return false;
  }
};

/**
 * Normalizes any supported address (Ethereum or Bitcoin) to its canonical format
 * - Ethereum: lowercase
 * - Bitcoin Bech32/Bech32m: lowercase
 * - Bitcoin Legacy/P2SH: preserves case (case-sensitive)
 */
export const normalizeAddress = (address: string): string => {
  if (!address || typeof address !== "string") {
    throw new Error("Invalid address: must be a non-empty string");
  }

  const addressType = detectAddressType(address);

  if (addressType === "ethereum") {
    return normalizeEthAddress(address);
  }

  return normalizeBitcoinAddress(address);
};
