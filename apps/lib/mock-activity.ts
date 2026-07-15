import { ActivityEvent, ActivityEventType, EventStatus } from "@/app/types/activity";

const USERS = [
  { id: "usr_1", email: "alice.chen@aether.io", name: "Alice Chen" },
  { id: "usr_2", email: "marcus.johnson@acme.com", name: "Marcus Johnson" },
  { id: "usr_3", email: "sarah.williams@techcorp.net", name: "Sarah Williams" },
  { id: "usr_4", email: "david.kim@startup.io", name: "David Kim" },
  { id: "usr_5", email: "emma.rodriguez@enterprise.com", name: "Emma Rodriguez" },
  { id: "usr_6", email: "james.wilson@agency.co", name: "James Wilson" },
  { id: "usr_7", email: "olivia.martinez@fintech.com", name: "Olivia Martinez" },
  { id: "usr_8", email: "william.brown@health.org", name: "William Brown" },
];

const APPLICATIONS = [
  { id: "app_1", name: "Dashboard Web" },
  { id: "app_2", name: "Mobile App" },
  { id: "app_3", name: "API Gateway" },
  { id: "app_4", name: "Admin Portal" },
  { id: "app_5", name: "CLI Tool" },
  { id: "app_6", name: "SSO Integration" },
];

const DEVICES = [
  "Chrome 122 / macOS",
  "Firefox 123 / Windows 11",
  "Safari 17 / macOS",
  "Chrome 122 / iOS 17",
  "Edge 122 / Windows 10",
  "Postman v10",
  "curl 8.4",
];

const IP_ADDRESSES = [
  "192.168.1.42",
  "10.0.0.15",
  "172.16.0.100",
  "203.0.113.42",
  "198.51.100.17",
  "8.8.8.8",
];

const AGENTS = [
  "auth-verification-agent",
  "vault-access-agent",
  "session-manager-agent",
  "mfa-validation-agent",
  "audit-logger-agent",
];

const SECRETS = [
  "DATABASE_URL",
  "AWS_SECRET_KEY",
  "STRIPE_API_KEY",
  "SENDGRID_TOKEN",
  "JWT_PRIVATE_KEY",
  "ENCRYPTION_SALT",
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateTraceId(): string {
  return `tr_${Math.random().toString(36).substring(2, 15)}${Math.random()
    .toString(36)
    .substring(2, 15)}`;
}

function generateRequestId(): string {
  return `req_${Math.random().toString(36).substring(2, 15)}`;
}

function generateEventDescription(type: ActivityEventType, user?: (typeof USERS)[0]): string {
  const descriptions: Record<ActivityEventType, () => string> = {
    "user.login": () => `${user?.name || "User"} logged in successfully`,
    "user.logout": () => `${user?.name || "User"} logged out`,
    "user.created": () => `New user ${user?.name || "account"} was created`,
    "user.updated": () => `User ${user?.name || "profile"} was updated`,
    "user.deleted": () => `User ${user?.name || "account"} was deleted`,
    "token.issued": () => `Access token issued for ${user?.name || "user"}`,
    "token.revoked": () => `Token revoked for ${user?.name || "user"}`,
    "token.refreshed": () => `Token refreshed for ${user?.name || "user"}`,
    "api.request": () => `API request processed successfully`,
    "security.alert": () => `Security alert triggered - suspicious activity detected`,
    "security.blocked": () => `Request blocked due to security policy violation`,
    "agent.executed": () => `Agent ${randomItem(AGENTS)} executed successfully`,
    "agent.failed": () => `Agent ${randomItem(AGENTS)} execution failed`,
    "vault.secret.accessed": () => `Secret ${randomItem(SECRETS)} was accessed`,
    "vault.secret.denied": () => `Access denied to secret ${randomItem(SECRETS)}`,
    "vault.secret.created": () => `New secret ${randomItem(SECRETS)} was created`,
    "vault.secret.deleted": () => `Secret ${randomItem(SECRETS)} was deleted`,
    "application.created": () => `Application ${randomItem(APPLICATIONS).name} was created`,
    "application.updated": () => `Application ${randomItem(APPLICATIONS).name} was updated`,
    "connection.created": () => `New identity provider connection established`,
    "connection.deleted": () => `Identity provider connection removed`,
  };

  return descriptions[type]();
}

function generateMetadata(type: ActivityEventType): Record<string, unknown> {
  const baseMetadata: Record<string, unknown> = {
    environment: randomItem(["production", "staging", "development"]),
    region: randomItem(["us-east-1", "us-west-2", "eu-west-1", "ap-southeast-1"]),
  };

  switch (type) {
    case "user.login":
    case "user.logout":
      return {
        ...baseMetadata,
        authMethod: randomItem(["password", "oauth", "sso", "mfa"]),
        sessionId: `sess_${Math.random().toString(36).substring(2, 15)}`,
      };
    case "api.request":
      return {
        ...baseMetadata,
        method: randomItem(["GET", "POST", "PUT", "DELETE"]),
        endpoint: `/${randomItem(["users", "tokens", "apps", "secrets", "agents"])}`,
        statusCode: randomItem([200, 201, 400, 401, 403, 500]),
      };
    case "security.alert":
    case "security.blocked":
      return {
        ...baseMetadata,
        threatType: randomItem([
          "brute_force",
          "suspicious_ip",
          "anomalous_behavior",
          "rate_limit_exceeded",
        ]),
        severity: randomItem(["low", "medium", "high", "critical"]),
        action: type === "security.alert" ? "logged" : "blocked",
      };
    case "agent.executed":
    case "agent.failed":
      return {
        ...baseMetadata,
        agentName: randomItem(AGENTS),
        executionTime: randomInt(100, 5000),
        tokensUsed: randomInt(100, 10000),
      };
    case "vault.secret.accessed":
    case "vault.secret.denied":
      return {
        ...baseMetadata,
        secretName: randomItem(SECRETS),
        secretPath: `/secrets/${randomItem(["prod", "staging", "dev"])}/${randomItem(
          SECRETS
        ).toLowerCase()}`,
      };
    default:
      return baseMetadata;
  }
}

export function generateMockEvents(count: number, page: number = 1): ActivityEvent[] {
  const events: ActivityEvent[] = [];
  const types: ActivityEventType[] = [
    "user.login",
    "user.logout",
    "user.created",
    "user.updated",
    "token.issued",
    "token.revoked",
    "token.refreshed",
    "api.request",
    "security.alert",
    "security.blocked",
    "agent.executed",
    "agent.failed",
    "vault.secret.accessed",
    "vault.secret.denied",
    "vault.secret.created",
    "application.created",
    "connection.created",
  ];

  const statusWeights: { status: EventStatus; weight: number }[] = [
    { status: "success", weight: 75 },
    { status: "failed", weight: 15 },
    { status: "warning", weight: 7 },
    { status: "info", weight: 3 },
  ];

  function getStatus(type: ActivityEventType): EventStatus {
    if (type === "security.alert" || type === "security.blocked") {
      return type === "security.blocked" ? "failed" : "warning";
    }
    if (type === "agent.failed") return "failed";

    const rand = Math.random() * 100;
    let cumulative = 0;
    for (const { status, weight } of statusWeights) {
      cumulative += weight;
      if (rand <= cumulative) return status;
    }
    return "success";
  }

  const baseTime = Date.now();
  const pageOffset = (page - 1) * count;

  for (let i = 0; i < count; i++) {
    const type = randomItem(types);
    const hasUser = !type.startsWith("application") && !type.startsWith("connection");
    const user = hasUser ? randomItem(USERS) : undefined;
    const application = type.startsWith("application")
      ? randomItem(APPLICATIONS)
      : randomItem(APPLICATIONS);

    const timestamp = new Date(baseTime - (pageOffset + i) * randomInt(1000, 60000));

    const event: ActivityEvent = {
      id: `evt_${page}_${i}_${Math.random().toString(36).substring(2, 10)}`,
      type,
      description: generateEventDescription(type, user),
      user,
      application,
      timestamp,
      status: getStatus(type),
      metadata: generateMetadata(type),
      ipAddress: randomItem(IP_ADDRESSES),
      device: randomItem(DEVICES),
      traceId: generateTraceId(),
      requestId: generateRequestId(),
      duration:
        type === "api.request" || type.startsWith("agent") ? randomInt(50, 2000) : undefined,
      statusCode:
        type === "api.request" ? randomItem([200, 200, 200, 201, 400, 401, 403]) : undefined,
    };

    events.push(event);
  }

  return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}
