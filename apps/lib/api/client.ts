import { getApiBaseUrl, getApiClientHeaders, getRequestTimeoutMs, joinApiPath } from "@/lib/api/config";
import { ApiError, classifyApiError } from "@/lib/api/errors";
import { getAccessTokenProvider } from "@/lib/api/token-provider";
import type { ApiFailureEnvelope, ApiListEnvelope, ApiMeta, ApiSuccessEnvelope, PaginatedResponse } from "@/lib/api/types";

export interface ApiRequestOptions<TBody = unknown> {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: TBody;
  signal?: AbortSignal;
  headers?: HeadersInit;
  idempotencyKey?: string;
  workspaceId?: string;
  timeoutMs?: number;
  retry?: number;
  skipAuth?: boolean;
  skipRefresh?: boolean;
}

function mergeSignals(signal?: AbortSignal, timeoutMs = getRequestTimeoutMs()): AbortSignal {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(createAbortError("Request timed out.")), timeoutMs);

  if (signal) {
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timeout);
        controller.abort(signal.reason);
      },
      { once: true }
    );
  }

  controller.signal.addEventListener(
    "abort",
    () => {
      clearTimeout(timeout);
    },
    { once: true }
  );

  return controller.signal;
}

function createAbortError(message: string): Error {
  const error = new Error(message);
  error.name = "AbortError";
  return error;
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

function isTransientStatus(status: number): boolean {
  return status === 408 || status === 429 || status === 502 || status === 503 || status === 504;
}

function isRetriableNetworkError(error: unknown): boolean {
  return error instanceof TypeError || isAbortError(error);
}

function toJsonBody(body: unknown): BodyInit | undefined {
  if (body === undefined || body === null) {
    return undefined;
  }

  if (body instanceof FormData || body instanceof URLSearchParams || body instanceof Blob) {
    return body;
  }

  return JSON.stringify(body);
}

function extractRequestId(headers: Headers, meta?: ApiMeta): string | undefined {
  return meta?.requestId ?? headers.get("x-request-id") ?? undefined;
}

async function parseResponse(response: Response): Promise<unknown> {
  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return null;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

function normalizeApiError(response: Response, payload: unknown): ApiError {
  const envelope = (payload ?? {}) as ApiFailureEnvelope & { meta?: ApiMeta };
  const code = envelope.error?.code;
  const message = envelope.error?.message ?? `Request failed with status ${response.status}`;
  const details = envelope.error?.details;
  const requestId = extractRequestId(response.headers, envelope.meta);

  return new ApiError({
    status: response.status,
    code,
    details,
    requestId,
    message,
    kind: classifyApiError(response.status, code),
  });
}

async function fetchWithAuth<TResponse, TBody>(
  url: string,
  options: ApiRequestOptions<TBody>,
  attempt = 0
): Promise<TResponse> {
  const provider = getAccessTokenProvider();
  const token = options.skipAuth ? null : await provider.getAccessToken();
  const signal = mergeSignals(options.signal, options.timeoutMs);
  const body = toJsonBody(options.body);
  const headers = new Headers(getApiClientHeaders());
  new Headers(options.headers ?? {}).forEach((value, key) => {
    headers.set(key, value);
  });

  if (body && !(body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("Accept", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (options.idempotencyKey) {
    headers.set("Idempotency-Key", options.idempotencyKey);
  }
  if (options.workspaceId) {
    headers.set("X-Workspace-Id", options.workspaceId);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method ?? "GET",
      body,
      signal,
      credentials: "include",
      headers,
    });
  } catch (error) {
    if (attempt < (options.retry ?? 0) && isRetriableNetworkError(error)) {
      return fetchWithAuth(url, options, attempt + 1);
    }

    throw new ApiError({
      status: 0,
      message: "Network request failed.",
      kind: "network_error",
      cause: error,
    });
  }

  const payload = await parseResponse(response);

  if (response.status === 401 && attempt === 0 && !options.skipRefresh && provider.refreshAccessToken) {
    const refreshedToken = await provider.refreshAccessToken();
    if (refreshedToken) {
      return fetchWithAuth(url, options, attempt + 1);
    }
  }

  if (!response.ok) {
    const apiError = normalizeApiError(response, payload);
    if (attempt < (options.retry ?? 0) && options.method === "GET" && isTransientStatus(response.status)) {
      return fetchWithAuth(url, options, attempt + 1);
    }
    throw apiError;
  }

  const envelope = payload as ApiSuccessEnvelope<TResponse> | ApiListEnvelope<TResponse>;
  if (payload && typeof payload === "object" && "data" in (payload as Record<string, unknown>)) {
    return envelope.data as TResponse;
  }

  return payload as TResponse;
}

export async function apiRequest<TResponse, TBody = unknown>(
  path: string,
  options: ApiRequestOptions<TBody> = {}
): Promise<TResponse> {
  const baseUrl = getApiBaseUrl();
  const url = path.startsWith("http://") || path.startsWith("https://") ? path : joinApiPath(path);

  if (!baseUrl) {
    throw new ApiError({
      status: 500,
      message: "API base URL is not configured.",
      kind: "internal_error",
    });
  }

  return fetchWithAuth<TResponse, TBody>(url, options);
}

export async function apiListRequest<TItem, TBody = never>(
  path: string,
  options: ApiRequestOptions<TBody> = {},
  attempt = 0
): Promise<PaginatedResponse<TItem>> {
  const url = path.startsWith("http://") || path.startsWith("https://") ? path : joinApiPath(path);
  const provider = getAccessTokenProvider();
  const token = options.skipAuth ? null : await provider.getAccessToken();
  const signal = mergeSignals(options.signal, options.timeoutMs);
  const headers = new Headers(getApiClientHeaders());
  new Headers(options.headers ?? {}).forEach((value, key) => {
    headers.set(key, value);
  });

  headers.set("Accept", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, {
    method: options.method ?? "GET",
    signal,
    credentials: "include",
    headers,
  });

  if (response.status === 401 && attempt === 0 && !options.skipRefresh && provider.refreshAccessToken) {
    const refreshedToken = await provider.refreshAccessToken();
    if (refreshedToken) {
      return apiListRequest(path, options, attempt + 1);
    }
  }

  const payload = (await parseResponse(response)) as ApiListEnvelope<TItem> | ApiFailureEnvelope | null;

  if (!response.ok) {
    throw normalizeApiError(response, payload);
  }

  const envelope = (payload ?? { data: [], meta: {} }) as ApiListEnvelope<TItem>;

  return {
    data: envelope.data ?? [],
    meta: {
      requestId: extractRequestId(response.headers, envelope.meta),
      nextCursor: envelope.meta?.nextCursor,
      hasMore: envelope.meta?.hasMore,
    },
  };
}

export interface FooterLink {
  id: string;
  category: string;
  title: string;
  name: string;
  href: string;
  locale: string;
  position: number;
  isVisible: boolean;
}

export const footerLinksApi = {
  list(locale?: string) {
    const params = new URLSearchParams();
    if (locale) {
      params.set("locale", locale);
    }
    const suffix = params.size > 0 ? `?${params.toString()}` : "";
    return apiRequest<{ success: boolean; data?: FooterLink[] }>(`/footer-links${suffix}`);
  },
};
