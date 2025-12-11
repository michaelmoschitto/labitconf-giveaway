import { NextRequest, NextResponse } from "next/server";

import {
  detectAddressType,
  toChecksumAddress,
  validateAddress,
} from "@/lib/address-utils";

export const runtime = "edge";

/**
 * GET /api/mezo/validate?wallet=...
 * Validates if a wallet address exists on Mezo network
 * Supports both Ethereum and Bitcoin addresses
 * This is a server-side proxy to avoid CORS issues when calling Mezo API from the browser
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const walletAddress = searchParams.get("wallet");

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 },
      );
    }

    if (!validateAddress(walletAddress)) {
      return NextResponse.json(
        { error: "Invalid wallet address format" },
        { status: 400 },
      );
    }

    // Mezo API requires EIP-55 checksummed addresses for ETH, and as-is for BTC
    const addressType = detectAddressType(walletAddress);
    const formattedAddress =
      addressType === "ethereum"
        ? toChecksumAddress(walletAddress)
        : walletAddress;

    const mezoResponse = await fetch(
      `https://api.mezo.org/accounts/${formattedAddress}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      },
    );

    // Return the validation result
    return NextResponse.json(
      {
        exists: mezoResponse.ok,
        wallet: formattedAddress,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Mezo validation error:", error);
    return NextResponse.json(
      { error: "Failed to validate wallet on Mezo", exists: false },
      { status: 500 },
    );
  }
}
