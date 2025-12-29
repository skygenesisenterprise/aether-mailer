// API constants and endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH_LOGIN: "/api/auth/login",
  AUTH_REFRESH: "/api/auth/refresh",
  AUTH_LOGOUT: "/api/auth/logout",

  // Email operations
  EMAIL_SEND: "/api/v1/smtp/email/send",
  EMAIL_BULK: "/api/v1/smtp/email/bulk",
  EMAIL_SENT: "/api/v1/smtp/email/sent",

  // Queue management
  QUEUE_STATUS: "/api/v1/smtp/queue/status",
  QUEUE_MESSAGES: "/api/v1/smtp/queue/messages",
  QUEUE_RETRY: "/api/v1/smtp/queue/messages/:id/retry",
  QUEUE_DELETE: "/api/v1/smtp/queue/messages/:id",

  // SMTP sessions
  SMTP_SESSIONS: "/api/v1/smtp/sessions",
  SMTP_SESSION: "/api/v1/smtp/sessions/:id",
  SMTP_STATS: "/api/v1/smtp/stats",
  SMTP_LOGS: "/api/v1/smtp/logs",
  SMTP_TEST: "/api/v1/smtp/test",

  // Domain management
  DOMAINS: "/api/v1/domains",
  DOMAIN: "/api/v1/domains/:id",
  DOMAIN_STATS: "/api/v1/domains/stats",
  DOMAIN_VERIFY: "/api/v1/domains/:id/verify",
  DOMAIN_AVAILABILITY: "/api/v1/domains/check-availability",
  DOMAIN_DNS: "/api/v1/domains/:id/dns",
  DOMAIN_MAIL_CONFIG: "/api/v1/domains/:id/mail-config",

  // API Keys
  API_KEYS: "/api/v1/api-keys",
  API_KEY: "/api/v1/api-keys/:id",
  API_KEY_STATS: "/api/v1/api-keys/:id/stats",
  API_KEY_SYSTEM: "/api/v1/api-keys/system",
  API_KEY_CLEANUP: "/api/v1/api-keys/cleanup",
  API_KEY_VALIDATE: "/api/v1/api-keys/validate",
} as const;

// Error codes
export const ERROR_CODES = {
  // Authentication errors
  UNAUTHORIZED: "UNAUTHORIZED",
  INVALID_API_KEY: "INVALID_API_KEY",
  EXPIRED_TOKEN: "EXPIRED_TOKEN",
  INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS",

  // Request errors
  INVALID_REQUEST: "INVALID_REQUEST",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD",
  INVALID_FORMAT: "INVALID_FORMAT",

  // Resource errors
  NOT_FOUND: "NOT_FOUND",
  ALREADY_EXISTS: "ALREADY_EXISTS",
  DOMAIN_EXISTS: "DOMAIN_EXISTS",
  DOMAIN_NOT_FOUND: "DOMAIN_NOT_FOUND",

  // Rate limiting
  RATE_LIMITED: "RATE_LIMITED",
  QUOTA_EXCEEDED: "QUOTA_EXCEEDED",

  // System errors
  INTERNAL_ERROR: "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  TIMEOUT: "TIMEOUT",

  // Email specific
  SEND_FAILED: "SEND_FAILED",
  INVALID_EMAIL: "INVALID_EMAIL",
  EMAIL_TOO_LARGE: "EMAIL_TOO_LARGE",
  ATTACHMENT_TOO_LARGE: "ATTACHMENT_TOO_LARGE",

  // Domain specific
  DOMAIN_VERIFICATION_FAILED: "DOMAIN_VERIFICATION_FAILED",
  INVALID_DNS_RECORD: "INVALID_DNS_RECORD",
  DNS_CONFIG_ERROR: "DNS_CONFIG_ERROR",
} as const;

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
  REQUEST_TIMEOUT: 408,
} as const;

// API key prefixes
export const API_KEY_PREFIXES = {
  LIVE: "sk_live",
  TEST: "sk_test",
  SYSTEM: "sk_sys",
} as const;

// User roles
export const USER_ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  DOMAIN_ADMIN: "DOMAIN_ADMIN",
  USER: "USER",
  READ_ONLY: "READ_ONLY",
} as const;

// Email priorities
export const EMAIL_PRIORITIES = {
  LOW: "low",
  NORMAL: "normal",
  HIGH: "high",
} as const;

// DNS record types
export const DNS_RECORD_TYPES = {
  A: "A",
  AAAA: "AAAA",
  MX: "MX",
  TXT: "TXT",
  CNAME: "CNAME",
  SRV: "SRV",
  CAA: "CAA",
} as const;

// SMTP session statuses
export const SMTP_SESSION_STATUSES = {
  ACTIVE: "active",
  COMPLETED: "completed",
  ERROR: "error",
} as const;

// Queue message statuses
export const QUEUE_MESSAGE_STATUSES = {
  PENDING: "pending",
  PROCESSING: "processing",
  SENT: "sent",
  FAILED: "failed",
  DEFERRED: "deferred",
} as const;

// Webhook events
export const WEBHOOK_EVENTS = {
  EMAIL_SENT: "email.sent",
  EMAIL_DELIVERED: "email.delivered",
  EMAIL_FAILED: "email.failed",
  EMAIL_OPENED: "email.opened",
  EMAIL_CLICKED: "email.clicked",
  DOMAIN_VERIFIED: "domain.verified",
  DOMAIN_CREATED: "domain.created",
  API_KEY_CREATED: "api_key.created",
  API_KEY_REVOKED: "api_key.revoked",
} as const;

// Default configuration values
export const DEFAULT_CONFIG = {
  BASE_URL: "http://localhost:8080",
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  PAGE_SIZE: 50,
  MAX_FILE_SIZE: 25 * 1024 * 1024, // 25MB
  MAX_EMAIL_SIZE: 50 * 1024 * 1024, // 50MB
} as const;

// Regular expressions
export const REGEX = {
  EMAIL:
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
  API_KEY: /^sk_(live|test|sys)_[a-zA-Z0-9]{32}$/,
  DOMAIN:
    /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?(?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?)*$/,
  JWT: /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/,
} as const;

// Export types for TypeScript
export type ApiEndpoint = (typeof API_ENDPOINTS)[keyof typeof API_ENDPOINTS];
export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
export type HttpStatus = (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS];
export type ApiKeyPrefix =
  (typeof API_KEY_PREFIXES)[keyof typeof API_KEY_PREFIXES];
export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];
export type EmailPriority =
  (typeof EMAIL_PRIORITIES)[keyof typeof EMAIL_PRIORITIES];
export type DnsRecordType =
  (typeof DNS_RECORD_TYPES)[keyof typeof DNS_RECORD_TYPES];
export type SmtpSessionStatus =
  (typeof SMTP_SESSION_STATUSES)[keyof typeof SMTP_SESSION_STATUSES];
export type QueueMessageStatus =
  (typeof QUEUE_MESSAGE_STATUSES)[keyof typeof QUEUE_MESSAGE_STATUSES];
export type WebhookEvent = (typeof WEBHOOK_EVENTS)[keyof typeof WEBHOOK_EVENTS];
export type Environment = (typeof ENVIRONMENTS)[keyof typeof ENVIRONMENTS];

// Environment types
export const ENVIRONMENTS = {
  PRODUCTION: "production",
  DEVELOPMENT: "development",
  TEST: "test",
} as const;
