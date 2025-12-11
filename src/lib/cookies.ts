const REFERRAL_COOKIE_NAME = "mezo_referral";
const COOKIE_MAX_AGE = 24 * 60 * 60; // 24 hours in seconds

interface CookieOptions {
  maxAge?: number;
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: "strict" | "lax" | "none";
}

/**
 * Sets a referral cookie with 24-hour expiry
 * Config: SameSite=Lax, Secure=true (in production), HttpOnly=false
 */
export const setReferralCookie = (code: string): void => {
  if (!code || typeof code !== "string") {
    throw new Error("Invalid referral code: must be a non-empty string");
  }

  const isProduction = process.env.NODE_ENV === "production";

  const options: CookieOptions = {
    maxAge: COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax",
    secure: isProduction,
  };

  const cookieString = `${REFERRAL_COOKIE_NAME}=${encodeURIComponent(code)}; Max-Age=${options.maxAge}; Path=${options.path}; SameSite=${options.sameSite}${options.secure ? "; Secure" : ""}`;

  if (typeof document !== "undefined") {
    document.cookie = cookieString;
  }
};

/**
 * Gets the referral cookie value
 * Returns null if cookie doesn't exist or is expired
 */
export const getReferralCookie = (): string | null => {
  if (typeof document === "undefined") {
    return null;
  }

  const cookies = document.cookie.split(";");

  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === REFERRAL_COOKIE_NAME) {
      return decodeURIComponent(value);
    }
  }

  return null;
};

/**
 * Clears the referral cookie
 */
export const clearReferralCookie = (): void => {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${REFERRAL_COOKIE_NAME}=; Max-Age=0; Path=/; SameSite=lax`;
};

/**
 * Server-side: Sets referral cookie in response headers
 * Use this in middleware or API routes
 */
export const setReferralCookieHeader = (code: string): string => {
  if (!code || typeof code !== "string") {
    throw new Error("Invalid referral code: must be a non-empty string");
  }

  const isProduction = process.env.NODE_ENV === "production";

  const parts = [
    `${REFERRAL_COOKIE_NAME}=${encodeURIComponent(code)}`,
    `Max-Age=${COOKIE_MAX_AGE}`,
    "Path=/",
    "SameSite=Lax",
  ];

  if (isProduction) {
    parts.push("Secure");
  }

  return parts.join("; ");
};

/**
 * Server-side: Gets referral cookie from request headers
 * Use this in middleware or API routes
 */
export const getReferralCookieFromHeader = (
  cookieHeader: string | null,
): string | null => {
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(";");

  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === REFERRAL_COOKIE_NAME) {
      return decodeURIComponent(value);
    }
  }

  return null;
};

export const REFERRAL_COOKIE_CONFIG = {
  name: REFERRAL_COOKIE_NAME,
  maxAge: COOKIE_MAX_AGE,
} as const;
