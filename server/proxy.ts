export function serverProxy(request: Request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Only handle server API routes
  if (!pathname.startsWith("/api/v1/")) {
    return null; // Let Next.js handle it
  }

  const backendUrl = process.env.BACKEND_URL || "http://localhost:8080";

  // Create new URL for backend
  const backendApiUrl = new URL(pathname, backendUrl);

  // Copy query parameters
  url.searchParams.forEach((value, key) => {
    backendApiUrl.searchParams.set(key, value);
  });

  // Prepare headers for backend request
  const headers = new Headers(request.headers);

  // Forward authentication headers
  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    headers.set("Authorization", authHeader);
  }

  // Forward client info for logging
  headers.set("X-Forwarded-For", request.headers.get("x-forwarded-for") || "");
  headers.set(
    "X-Forwarded-Proto",
    request.headers.get("x-forwarded-proto") || "http",
  );
  headers.set("User-Agent", request.headers.get("user-agent") || "");

  // Add server-specific headers
  headers.set("X-Proxy-Service", "aether-server");
  headers.set("X-Proxy-Version", "1.0.0");

  // Create and return backend request
  return new Request(backendApiUrl, {
    method: request.method,
    headers,
    body: request.body,
    redirect: "manual",
  });
}

export const serverProxyConfig = {
  matcher: ["/api/v1/:path*"],
};
