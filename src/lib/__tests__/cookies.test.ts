import { describe, expect, it, beforeEach, afterEach } from "bun:test";

import {
  setReferralCookie,
  getReferralCookie,
  clearReferralCookie,
  setReferralCookieHeader,
  getReferralCookieFromHeader,
  REFERRAL_COOKIE_CONFIG,
} from "@/lib/cookies";

describe("Client-side cookie utilities", () => {
  beforeEach(() => {
    if (typeof document !== "undefined") {
      document.cookie.split(";").forEach((cookie) => {
        const name = cookie.split("=")[0].trim();
        document.cookie = `${name}=; Max-Age=0; Path=/`;
      });
    }
  });

  afterEach(() => {
    if (typeof document !== "undefined") {
      clearReferralCookie();
    }
  });

  describe("setReferralCookie", () => {
    it("sets cookie with correct name and value", () => {
      if (typeof document === "undefined") {
        console.log("Skipping browser-only test in Node environment");
        return;
      }

      const code = "MEZBCDEF";
      setReferralCookie(code);

      const cookie = getReferralCookie();
      expect(cookie).toBe(code);
    });

    it("throws error for empty code", () => {
      expect(() => setReferralCookie("")).toThrow();
    });

    it("throws error for non-string code", () => {
      expect(() => setReferralCookie(null as unknown as string)).toThrow();
      expect(() => setReferralCookie(undefined as unknown as string)).toThrow();
      expect(() => setReferralCookie(123 as unknown as string)).toThrow();
    });

    it("handles special characters in code", () => {
      if (typeof document === "undefined") {
        console.log("Skipping browser-only test in Node environment");
        return;
      }

      const code = "MEZ+BC/DE=";
      setReferralCookie(code);

      const cookie = getReferralCookie();
      expect(cookie).toBe(code);
    });
  });

  describe("getReferralCookie", () => {
    it("returns null when cookie doesn't exist", () => {
      if (typeof document === "undefined") {
        expect(getReferralCookie()).toBe(null);
        return;
      }

      const cookie = getReferralCookie();
      expect(cookie).toBe(null);
    });

    it("returns cookie value when it exists", () => {
      if (typeof document === "undefined") {
        console.log("Skipping browser-only test in Node environment");
        return;
      }

      const code = "MEZBCDEF";
      setReferralCookie(code);

      const cookie = getReferralCookie();
      expect(cookie).toBe(code);
    });

    it("returns null in server environment", () => {
      const originalDocument = global.document;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).document = undefined;

      const cookie = getReferralCookie();
      expect(cookie).toBe(null);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).document = originalDocument;
    });
  });

  describe("clearReferralCookie", () => {
    it("removes cookie", () => {
      if (typeof document === "undefined") {
        console.log("Skipping browser-only test in Node environment");
        return;
      }

      const code = "MEZBCDEF";
      setReferralCookie(code);

      expect(getReferralCookie()).toBe(code);

      clearReferralCookie();

      expect(getReferralCookie()).toBe(null);
    });

    it("handles clearing non-existent cookie", () => {
      if (typeof document === "undefined") {
        console.log("Skipping browser-only test in Node environment");
        return;
      }

      clearReferralCookie();

      expect(getReferralCookie()).toBe(null);
    });
  });
});

describe("Server-side cookie utilities", () => {
  describe("setReferralCookieHeader", () => {
    it("generates correct Set-Cookie header", () => {
      const code = "MEZBCDEF";
      const header = setReferralCookieHeader(code);

      expect(header).toContain(`${REFERRAL_COOKIE_CONFIG.name}=${code}`);
      expect(header).toContain(`Max-Age=${REFERRAL_COOKIE_CONFIG.maxAge}`);
      expect(header).toContain("Path=/");
      expect(header).toContain("SameSite=Lax");
    });

    it("throws error for empty code", () => {
      expect(() => setReferralCookieHeader("")).toThrow();
    });

    it("throws error for non-string code", () => {
      expect(() =>
        setReferralCookieHeader(null as unknown as string),
      ).toThrow();
      expect(() =>
        setReferralCookieHeader(undefined as unknown as string),
      ).toThrow();
      expect(() => setReferralCookieHeader(123 as unknown as string)).toThrow();
    });

    it("encodes special characters", () => {
      const code = "MEZ+BC/DE=";
      const header = setReferralCookieHeader(code);

      expect(header).toContain(encodeURIComponent(code));
    });
  });

  describe("getReferralCookieFromHeader", () => {
    it("extracts cookie from header string", () => {
      const code = "MEZBCDEF";
      const cookieHeader = `${REFERRAL_COOKIE_CONFIG.name}=${code}`;

      const result = getReferralCookieFromHeader(cookieHeader);

      expect(result).toBe(code);
    });

    it("extracts cookie from header with multiple cookies", () => {
      const code = "MEZBCDEF";
      const cookieHeader = `other_cookie=value1; ${REFERRAL_COOKIE_CONFIG.name}=${code}; another_cookie=value2`;

      const result = getReferralCookieFromHeader(cookieHeader);

      expect(result).toBe(code);
    });

    it("returns null when cookie not in header", () => {
      const cookieHeader = "other_cookie=value1; another_cookie=value2";

      const result = getReferralCookieFromHeader(cookieHeader);

      expect(result).toBe(null);
    });

    it("returns null for null header", () => {
      const result = getReferralCookieFromHeader(null);

      expect(result).toBe(null);
    });

    it("returns null for empty header", () => {
      const result = getReferralCookieFromHeader("");

      expect(result).toBe(null);
    });

    it("decodes encoded values", () => {
      const code = "MEZ+BC/DE=";
      const cookieHeader = `${REFERRAL_COOKIE_CONFIG.name}=${encodeURIComponent(code)}`;

      const result = getReferralCookieFromHeader(cookieHeader);

      expect(result).toBe(code);
    });

    it("handles cookie with spaces in header", () => {
      const code = "MEZBCDEF";
      const cookieHeader = `  ${REFERRAL_COOKIE_CONFIG.name}=${code}  `;

      const result = getReferralCookieFromHeader(cookieHeader);

      expect(result).toBe(code);
    });
  });
});

describe("REFERRAL_COOKIE_CONFIG", () => {
  it("has correct cookie name", () => {
    expect(REFERRAL_COOKIE_CONFIG.name).toBe("mezo_referral");
  });

  it("has 24-hour maxAge", () => {
    const expectedMaxAge = 24 * 60 * 60; // 24 hours in seconds
    expect(REFERRAL_COOKIE_CONFIG.maxAge).toBe(expectedMaxAge);
  });
});
