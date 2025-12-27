// Core configuration and client options
export interface MailerConfig {
  apiKey?: string;
  jwt?: string;
  baseURL?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  userAgent?: string;
}

// API response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: ApiError;
  timestamp?: string;
}

// Error structure
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// Pagination metadata
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Email-related types
export interface SendEmailOptions {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  bodyText?: string;
  bodyHTML?: string;
  priority?: "low" | "normal" | "high";
  draft?: boolean;
  attachments?: EmailAttachment[];
  headers?: Record<string, string>;
  replyTo?: string;
  from?: string;
}

export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
  contentId?: string;
  disposition?: "inline" | "attachment";
}

export interface BulkEmailOptions {
  emails: SendEmailOptions[];
  options?: {
    sendSequentially?: boolean;
    stopOnError?: boolean;
  };
}

export interface BulkEmailResult {
  results: EmailSendResult[];
  total: number;
  successful: number;
  failed: number;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  recipient?: string;
}

// Domain-related types
export interface Domain {
  id: string;
  name: string;
  displayName?: string;
  description?: string;
  isActive: boolean;
  isVerified: boolean;
  maxUsers: number;
  maxEmailsPerDay: number;
  maxStorageMB: number;
  dkimSelector?: string;
  dkimPublicKey?: string;
  spfRecord?: string;
  dmarcRecord?: string;
  createdAt: string;
  updatedAt: string;
  verifiedAt?: string;
}

export interface CreateDomainRequest {
  name: string;
  displayName?: string;
  description?: string;
  maxUsers?: number;
  maxEmailsPerDay?: number;
  maxStorageMB?: number;
}

export interface UpdateDomainRequest {
  displayName?: string;
  description?: string;
  isActive?: boolean;
  maxUsers?: number;
  maxEmailsPerDay?: number;
  maxStorageMB?: number;
}

export interface DomainStats {
  total: number;
  active: number;
  verified: number;
  unverified: number;
  totalUsers: number;
  totalEmailsPerDay: number;
}

export interface DomainQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  isVerified?: boolean;
  sortBy?: "name" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

// DNS Record types
export interface DnsRecord {
  id: string;
  domainId: string;
  type: "A" | "AAAA" | "MX" | "TXT" | "CNAME" | "SRV" | "CAA";
  name: string;
  value: string;
  ttl?: number;
  priority?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MailServerConfig {
  host: string;
  port: number;
  tls: boolean;
  auth: {
    username: string;
    password: string;
  };
  maxConnections?: number;
  timeout?: number;
}

// Statistics and metrics
export interface StatsOptions {
  period?: "hour" | "day" | "week" | "month" | "year";
  startDate?: string;
  endDate?: string;
  domainId?: string;
}

export interface EmailStats {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  totalPending: number;
  deliveryRate: number;
  averageDeliveryTime: number;
  sentByPeriod: StatsPoint[];
  failuresByReason: Record<string, number>;
}

export interface DomainUsageStats {
  domainId: string;
  domainName: string;
  emailsSent: number;
  emailsDelivered: number;
  emailsFailed: number;
  storageUsed: number;
  activeUsers: number;
  period: string;
}

export interface StatsPoint {
  timestamp: string;
  count: number;
}

export interface QueueStatus {
  pending: number;
  processing: number;
  sent: number;
  failed: number;
  deferred: number;
  total: number;
}

export interface QueuedMessage {
  id: string;
  from: string;
  to: string[];
  subject: string;
  status: "pending" | "processing" | "sent" | "failed" | "deferred";
  priority: string;
  attempts: number;
  lastAttempt?: string;
  nextAttempt?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

// Authentication types
export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  permissions: string[];
  iat: number;
  exp: number;
}

export interface ApiKeyInfo {
  id: string;
  name: string;
  permissions: string[];
  isActive: boolean;
  expiresAt?: string;
  createdAt: string;
  lastUsedAt?: string;
}

export interface CreateApiKeyRequest {
  name: string;
  permissions: string[];
  expiresAt?: string;
}

export interface ApiKeyUsageStats {
  keyId: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  requestsByEndpoint: Record<string, number>;
  requestsByDay: StatsPoint[];
  period: string;
}

// SMTP session types
export interface SmtpSession {
  id: string;
  clientIP: string;
  hostname: string;
  status: "active" | "completed" | "error";
  messageCount: number;
  bytesTransferred: number;
  startTime: string;
  endTime?: string;
  errorMessage?: string;
}

export interface SmtpConnectionTest {
  host: string;
  port: number;
  connected: boolean;
  latency: string;
  tlsVersion?: string;
  authMethods?: string[];
  errorMessage?: string;
}

// Validation types
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface EmailValidationResult extends ValidationResult {
  email: string;
  domain: string;
  isDisposable: boolean;
  isFreeProvider: boolean;
  mxRecords?: string[];
  hasMxRecords: boolean;
}

// Webhook types
export interface WebhookConfig {
  id: string;
  url: string;
  events: string[];
  secret?: string;
  isActive: boolean;
  retryAttempts: number;
  timeout: number;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookEvent {
  id: string;
  type: string;
  data: Record<string, any>;
  timestamp: string;
  retryCount: number;
  status: "pending" | "delivered" | "failed";
}

// Client events
export interface ClientEvent {
  type: "request" | "response" | "error" | "retry";
  data: any;
  timestamp: string;
}

// Export all types for convenience
export * from "./constants";
