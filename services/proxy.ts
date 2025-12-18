export function servicesProxy(request: Request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Only handle service endpoints
  if (!pathname.startsWith("/api/services/")) {
    return null; // Let Next.js handle it
  }

  // Extract service name from path
  const pathParts = pathname.split("/");
  const serviceName = pathParts[3]; // /api/services/{serviceName}/...

  if (!serviceName) {
    return null;
  }

  // Service port mapping
  const servicePorts: Record<string, number> = {
    email: 8081,
    smtp: 8082,
    imap: 8083,
    filter: 8084,
    queue: 8085,
    auth: 8086,
    storage: 8087,
    notification: 8088,
  };

  const servicePort = servicePorts[serviceName] || 8080;
  const serviceUrl =
    process.env.SERVICES_BASE_URL || `http://localhost:${servicePort}`;

  // Remove /api/services/{serviceName} prefix
  const servicePath = "/" + pathParts.slice(4).join("/");
  const serviceApiUrl = new URL(servicePath, serviceUrl);

  // Copy query parameters
  url.searchParams.forEach((value, key) => {
    serviceApiUrl.searchParams.set(key, value);
  });

  // Prepare headers for service request
  const headers = new Headers(request.headers);

  // Forward authentication for service-to-service communication
  const authToken = request.headers.get("authorization");
  if (authToken) {
    headers.set("Authorization", authToken);
  }

  // Add service mesh headers
  headers.set("X-Service-Name", serviceName);
  headers.set("X-Service-Version", "1.0.0");
  headers.set("X-Request-ID", crypto.randomUUID());
  headers.set("X-Forwarded-For", request.headers.get("x-forwarded-for") || "");
  headers.set(
    "X-Forwarded-Proto",
    request.headers.get("x-forwarded-proto") || "http",
  );

  // Add service authentication if configured
  const serviceToken =
    process.env[`${serviceName.toUpperCase()}_SERVICE_TOKEN`];
  if (serviceToken) {
    headers.set("X-Service-Token", serviceToken);
  }

  // Create and return service request
  return new Request(serviceApiUrl, {
    method: request.method,
    headers,
    body: request.body,
    redirect: "manual",
  });
}

export const servicesProxyConfig = {
  matcher: ["/api/services/:path*"],
};
