const DEFAULT_PUBLIC_API_PATH = "/api/v1";
const DEFAULT_PUBLIC_REALTIME_PATH = "/api/v1/realtime/ws";
const DEFAULT_EXPO_DEV_API_URL = "http://meet.skygenesisenterprise.localhost/api/v1";
const DEFAULT_TIMEOUT_MS = 15_000;
const DOCKER_HOST_PATTERN = /(^|\.)((server|worker|webrtc|livekit|postgresql|redis))$/i;
const PRIVATE_IPV4_PATTERN = /^(?:10|127|169\.254|172\.(?:1[6-9]|2\d|3[0-1])|192\.168)\./;

function normalizeBaseUrl(value: string, fallback: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return fallback;
  }

  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
}

function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production";
}

function isExpoRuntime(): boolean {
  return Boolean(process.env.EXPO_OS || process.env.EXPO_ROUTER_APP_ROOT);
}

export function getApiClientSupport(): string {
  if (process.env.EXPO_OS) {
    return `expo-${process.env.EXPO_OS}`;
  }

  if (isExpoRuntime()) {
    return "expo";
  }

  if (typeof window !== "undefined") {
    return "web";
  }

  return "server";
}

export function getApiClientHeaders(): HeadersInit {
  const support = getApiClientSupport();

  return {
    "X-Aether-Client": support.startsWith("expo") ? "mobile" : support,
    "X-Aether-Client-Support": support,
  };
}

function isPrivateHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase();

  return (
    normalized === "localhost" ||
    normalized === "::1" ||
    DOCKER_HOST_PATTERN.test(normalized) ||
    PRIVATE_IPV4_PATTERN.test(normalized)
  );
}

function parseUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

export function getApiBaseUrl(): string {
  if (typeof window === "undefined") {
    return normalizeBaseUrl(
      process.env.API_INTERNAL_URL ??
        process.env.EXPO_PUBLIC_API_URL ??
        process.env.NEXT_PUBLIC_API_URL ??
        (isExpoRuntime() && !isProductionRuntime() ? DEFAULT_EXPO_DEV_API_URL : DEFAULT_PUBLIC_API_PATH),
      DEFAULT_PUBLIC_API_PATH
    );
  }

  return normalizeBaseUrl(
    process.env.EXPO_PUBLIC_API_URL ??
      process.env.NEXT_PUBLIC_API_URL ??
      (isExpoRuntime() && !isProductionRuntime() ? DEFAULT_EXPO_DEV_API_URL : DEFAULT_PUBLIC_API_PATH),
    DEFAULT_PUBLIC_API_PATH
  );
}

export function getRealtimeUrl(): string {
  const configured = normalizeBaseUrl(
    process.env.NEXT_PUBLIC_REALTIME_URL ?? DEFAULT_PUBLIC_REALTIME_PATH,
    DEFAULT_PUBLIC_REALTIME_PATH
  );

  if (configured.startsWith("ws://") || configured.startsWith("wss://")) {
    return configured;
  }

  if (typeof window === "undefined") {
    return configured;
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}${configured.startsWith("/") ? configured : `/${configured}`}`;
}

export function getRequestTimeoutMs(): number {
  const parsed = Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TIMEOUT_MS;
}

export function getMockModeEnabled(): boolean {
  return process.env.NEXT_PUBLIC_USE_PLATFORM_MOCKS === "true";
}

export function assertPublicRealtimeUrl(url: string): string {
  if (!isProductionRuntime()) {
    return url;
  }

  const parsed = parseUrl(url);
  if (!parsed) {
    return url;
  }

  if (isPrivateHostname(parsed.hostname)) {
    throw new Error(`Refusing private realtime URL in production: ${parsed.hostname}`);
  }

  return url;
}

export function assertPublicLiveKitUrl(url: string): string {
  if (!url) {
    throw new Error("Missing LiveKit signaling URL.");
  }

  const parsed = parseUrl(url);
  if (!parsed) {
    throw new Error("Invalid LiveKit signaling URL.");
  }

  if (!["wss:", "https:", "ws:", "http:"].includes(parsed.protocol)) {
    throw new Error("Unsupported LiveKit signaling protocol.");
  }

  if (isProductionRuntime() && isPrivateHostname(parsed.hostname)) {
    throw new Error(`Refusing private LiveKit URL in production: ${parsed.hostname}`);
  }

  return url;
}

export function joinApiPath(path: string): string {
  if (!path) {
    return getApiBaseUrl();
  }

  if (/^https?:\/\//.test(path)) {
    return path;
  }

  const baseUrl = getApiBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (baseUrl.startsWith("http://") || baseUrl.startsWith("https://")) {
    return `${baseUrl}${normalizedPath}`;
  }

  return `${baseUrl}${normalizedPath}`;
}
