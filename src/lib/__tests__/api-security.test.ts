/**
 * Unit tests for API security utilities
 */

import { describe, it, expect, afterEach } from "bun:test";

import {
  getCorsHeaders,
  handleCorsPrelight,
  isOriginAllowed,
  rateLimitResponse,
  secureErrorResponse,
  secureJsonResponse,
} from "@/lib/api-security";

describe("API Security", () => {
  const originalAllowedOrigins = process.env.ALLOWED_ORIGINS;

  afterEach(() => {
    process.env.ALLOWED_ORIGINS = originalAllowedOrigins;
  });

  describe("isOriginAllowed", () => {
    it("should allow requests with no origin (curl, Postman)", () => {
      expect(isOriginAllowed(null)).toBe(true);
    });

    it("should allow configured origins", () => {
      process.env.ALLOWED_ORIGINS = "https://example.com,https://test.com";

      expect(isOriginAllowed("https://example.com")).toBe(true);
      expect(isOriginAllowed("https://test.com")).toBe(true);
    });

    it("should block unconfigured origins", () => {
      process.env.ALLOWED_ORIGINS = "https://example.com";

      expect(isOriginAllowed("https://malicious.com")).toBe(false);
    });
  });

  describe("getCorsHeaders", () => {
    it("should return basic CORS headers", () => {
      const headers = getCorsHeaders(null) as Record<string, string>;

      expect(headers["Access-Control-Allow-Methods"]).toBe(
        "GET, POST, OPTIONS",
      );
      expect(headers["Access-Control-Allow-Headers"]).toBe(
        "Content-Type, Authorization",
      );
      expect(headers["Access-Control-Max-Age"]).toBe("86400");
    });

    it("should include origin header for allowed origins", () => {
      process.env.ALLOWED_ORIGINS = "https://example.com";

      const headers = getCorsHeaders("https://example.com") as Record<
        string,
        string
      >;

      expect(headers["Access-Control-Allow-Origin"]).toBe(
        "https://example.com",
      );
      expect(headers["Access-Control-Allow-Credentials"]).toBe("true");
    });

    it("should not include origin header for disallowed origins", () => {
      process.env.ALLOWED_ORIGINS = "https://example.com";

      const headers = getCorsHeaders("https://malicious.com") as Record<
        string,
        string
      >;

      expect(headers["Access-Control-Allow-Origin"]).toBeUndefined();
    });
  });

  describe("handleCorsPrelight", () => {
    it("should return null for non-OPTIONS requests", () => {
      const request = new Request("https://api.example.com/test", {
        method: "GET",
      });

      const response = handleCorsPrelight(request);
      expect(response).toBeNull();
    });

    it("should return 204 for allowed OPTIONS requests", () => {
      process.env.ALLOWED_ORIGINS = "https://example.com";

      const request = new Request("https://api.example.com/test", {
        method: "OPTIONS",
        headers: {
          origin: "https://example.com",
        },
      });

      const response = handleCorsPrelight(request);

      expect(response).not.toBeNull();
      expect(response?.status).toBe(204);
    });

    it("should return 403 for disallowed OPTIONS requests", () => {
      process.env.ALLOWED_ORIGINS = "https://example.com";

      const request = new Request("https://api.example.com/test", {
        method: "OPTIONS",
        headers: {
          origin: "https://malicious.com",
        },
      });

      const response = handleCorsPrelight(request);

      expect(response).not.toBeNull();
      expect(response?.status).toBe(403);
    });
  });

  describe("secureJsonResponse", () => {
    it("should include security headers", async () => {
      const request = new Request("https://api.example.com/test");
      const data = { message: "test" };

      const response = secureJsonResponse(data, request);

      expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
      expect(response.headers.get("X-Frame-Options")).toBe("DENY");
      expect(response.headers.get("X-XSS-Protection")).toBe("1; mode=block");
      expect(response.headers.get("Content-Type")).toBe("application/json");
    });

    it("should include CORS headers for allowed origins", () => {
      process.env.ALLOWED_ORIGINS = "https://example.com";

      const request = new Request("https://api.example.com/test", {
        headers: {
          origin: "https://example.com",
        },
      });

      const response = secureJsonResponse({ data: "test" }, request);

      expect(response.headers.get("Access-Control-Allow-Origin")).toBe(
        "https://example.com",
      );
    });

    it("should return correct status code", () => {
      const request = new Request("https://api.example.com/test");

      const response = secureJsonResponse({ data: "test" }, request, {
        status: 201,
      });

      expect(response.status).toBe(201);
    });

    it("should include custom headers", () => {
      const request = new Request("https://api.example.com/test");

      const response = secureJsonResponse({ data: "test" }, request, {
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      expect(response.headers.get("Cache-Control")).toBe("no-cache");
    });
  });

  describe("secureErrorResponse", () => {
    it("should format error correctly", async () => {
      const request = new Request("https://api.example.com/test");

      const response = secureErrorResponse(
        {
          message: "Test error",
          code: "TEST_ERROR",
          status: 400,
        },
        request,
      );

      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body).toEqual({
        success: false,
        error: "Test error",
        code: "TEST_ERROR",
      });
    });

    it("should default to 500 status", async () => {
      const request = new Request("https://api.example.com/test");

      const response = secureErrorResponse(
        {
          message: "Test error",
        },
        request,
      );

      expect(response.status).toBe(500);

      const body = await response.json();
      expect(body.code).toBe("INTERNAL_ERROR");
    });

    it("should include security headers", () => {
      const request = new Request("https://api.example.com/test");

      const response = secureErrorResponse(
        {
          message: "Test error",
          status: 400,
        },
        request,
      );

      expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
      expect(response.headers.get("X-Frame-Options")).toBe("DENY");
    });
  });

  describe("rateLimitResponse", () => {
    it("should return 429 status", () => {
      const request = new Request("https://api.example.com/test");
      const resetAt = new Date(Date.now() + 60000);

      const response = rateLimitResponse(request, resetAt);

      expect(response.status).toBe(429);
    });

    it("should include Retry-After header", () => {
      const request = new Request("https://api.example.com/test");
      const resetAt = new Date(Date.now() + 60000); // 60 seconds from now

      const response = rateLimitResponse(request, resetAt);

      const retryAfter = response.headers.get("Retry-After");
      expect(retryAfter).toBeTruthy();

      const seconds = parseInt(retryAfter ?? "0", 10);
      expect(seconds).toBeGreaterThan(50);
      expect(seconds).toBeLessThanOrEqual(60);
    });

    it("should include error details in body", async () => {
      const request = new Request("https://api.example.com/test");
      const resetAt = new Date(Date.now() + 60000);

      const response = rateLimitResponse(request, resetAt);

      const body = await response.json();
      expect(body).toEqual({
        success: false,
        error: "Too many requests. Please try again later.",
        code: "RATE_LIMIT_EXCEEDED",
        resetAt: resetAt.toISOString(),
      });
    });
  });
});
