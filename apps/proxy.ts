import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  DEFAULT_PLATFORM_ROUTE,
  LOGIN_ROUTE,
  isAuthRoute,
} from "@/lib/routes";

const REFRESH_COOKIE_NAME = process.env.AUTH_REFRESH_COOKIE_NAME ?? "aether_mailer_refresh";

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

  if (isAuthRoute(pathname)) {
    if (hasSessionCookie(request)) {
      return NextResponse.redirect(new URL(DEFAULT_PLATFORM_ROUTE, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|health).*)"],
};
