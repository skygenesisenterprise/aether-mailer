import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  DEFAULT_PLATFORM_ROUTE,
  LOGIN_ROUTE,
  isAuthRoute,
  isPlatformRoute,
} from "@/lib/routes";

const PROTECTED_PATHS = ["/dashboard", "/user"];
const REFRESH_COOKIE_NAME = process.env.AUTH_REFRESH_COOKIE_NAME ?? "aether_account_refresh";

function isLocalDevelopment(request: NextRequest): boolean {
  if (process.env.NODE_ENV !== "development") {
    return false;
  }

  const hostname = request.nextUrl.hostname;
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function isValidJWT(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split(".");
  return parts.length === 3;
}

function hasSessionCookie(request: NextRequest): boolean {
  return Boolean(request.cookies.get(REFRESH_COOKIE_NAME)?.value);
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/") {
    const targetUrl = new URL(
      hasSessionCookie(request) ? DEFAULT_PLATFORM_ROUTE : LOGIN_ROUTE,
      request.url
    );
    return NextResponse.redirect(targetUrl);
  }

  if (isLocalDevelopment(request) && isPlatformRoute(pathname)) {
    return NextResponse.next();
  }

  if (isAuthRoute(pathname)) {
    if (hasSessionCookie(request)) {
      return NextResponse.redirect(new URL(DEFAULT_PLATFORM_ROUTE, request.url));
    }
    return NextResponse.next();
  }

  const isProtectedPath = PROTECTED_PATHS.some((path) => pathname.startsWith(path));
  if (isProtectedPath) {
    const authCookie = request.cookies.get("auth_token");
    const isValid = isValidJWT(authCookie?.value) || hasSessionCookie(request);

    if (!isValid) {
      const loginUrl = new URL(LOGIN_ROUTE, request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (isPlatformRoute(pathname) && !hasSessionCookie(request) && !isLocalDevelopment(request)) {
    const loginUrl = new URL(LOGIN_ROUTE, request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|health).*)"],
};
