export const LOGIN_ROUTE = "/login";
export const DEFAULT_PLATFORM_ROUTE = "/dash/management/overview";

export const AUTH_ROUTES = [
  LOGIN_ROUTE,
  "/forgot-password",
  "/reset-password",
] as const;

export const PLATFORM_ROUTES = [
  "/manage",
  "/settings",
  "/monitoring",
  DEFAULT_PLATFORM_ROUTE,
] as const;

export function isExactRoute(pathname: string, route: string): boolean {
  return pathname === route;
}

export function isNestedRoute(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(`${route}/`);
}

export function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((route) => isExactRoute(pathname, route));
}

export function isPlatformRoute(pathname: string): boolean {
  return PLATFORM_ROUTES.some((route) => isNestedRoute(pathname, route));
}
