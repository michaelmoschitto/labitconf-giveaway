import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";
import { NextResponse } from "next/server";

import { REFERRAL_COOKIE_CONFIG } from "@/lib/cookies";
import { validateReferralCode } from "@/lib/referral";

import type { NextRequest } from "next/server";

const locales = ["en", "es"];
const defaultLocale = "es";

const getLocale = (request: NextRequest): string => {
  const acceptLanguage = request.headers.get("accept-language");
  if (!acceptLanguage) return defaultLocale;

  const headers = { "accept-language": acceptLanguage };
  const languages = new Negotiator({ headers }).languages();

  try {
    return match(languages, locales, defaultLocale);
  } catch {
    return defaultLocale;
  }
};

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Handle /labtc2025, /en/labtc2025, /es/labtc2025
  if (
    pathname === "/labtc2025" ||
    pathname === "/en/labtc2025" ||
    pathname === "/es/labtc2025"
  ) {
    const locale = pathname.startsWith("/en")
      ? "en"
      : pathname.startsWith("/es")
        ? "es"
        : getLocale(request);
    request.nextUrl.pathname = `/${locale}`;
    request.nextUrl.searchParams.set("ref", "labtc2025");
    return NextResponse.redirect(request.nextUrl);
  }

  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  );

  const referralCode = searchParams.get("ref");
  const shouldSetCookie = referralCode && validateReferralCode(referralCode);
  const shouldClearCookie =
    !referralCode && request.cookies.has(REFERRAL_COOKIE_CONFIG.name);

  let response: NextResponse;

  if (!pathnameHasLocale) {
    const locale = getLocale(request);
    request.nextUrl.pathname = `/${locale}${pathname}`;
    response = NextResponse.redirect(request.nextUrl);
  } else {
    response = NextResponse.next();
  }

  if (shouldSetCookie) {
    response.cookies.set({
      name: REFERRAL_COOKIE_CONFIG.name,
      value: referralCode,
      maxAge: REFERRAL_COOKIE_CONFIG.maxAge,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  } else if (shouldClearCookie) {
    response.cookies.delete(REFERRAL_COOKIE_CONFIG.name);
  }

  return response;
}

export const config = {
  matcher: [
    // Skip all internal paths (_next, api, static files)
    "/((?!_next|api|favicon.ico|.*\\..*|[\\w-]+\\.\\w+).*)",
    // Explicitly include root path
    "/",
  ],
};
