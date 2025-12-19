export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  tokenType: "Bearer";
  expiresIn: number;
}

export interface LoginResponse {
  success: boolean;
  data: {
    user: UserProfile;
    tokens: AuthTokens;
  };
  message: string;
  timestamp: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  data: AuthTokens;
  message: string;
  timestamp: string;
}

export interface LogoutRequest {
  refreshToken?: string;
  allDevices?: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatar?: string;
  role: string;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt?: Date;
  emailVerifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  type: "access" | "refresh";
  iat: number;
  exp: number;
}

export interface AuthSession {
  id: string;
  userId: string;
  accessToken: string;
  refreshToken?: string;
  deviceInfo?: {
    userAgent: string;
    platform: string;
    browser: string;
    ip: string;
  };
  isActive: boolean;
  lastAccessAt: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TwoFactorSetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface TwoFactorVerifyRequest {
  token: string;
}

export interface TwoFactorEnableRequest {
  secret: string;
  token: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirmRequest {
  token: string;
  newPassword: string;
}

export interface EmailVerificationRequest {
  token: string;
}

export interface AuthMetrics {
  totalLogins: number;
  successfulLogins: number;
  failedLogins: number;
  activeSessions: number;
  passwordResetRequests: number;
  emailVerificationRequests: number;
  twoFactorEnabledUsers: number;
  lastResetAt?: Date;
}

export interface SecurityEvent {
  id: string;
  userId?: string;
  type: SecurityEventType;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum SecurityEventType {
  LOGIN_SUCCESS = "LOGIN_SUCCESS",
  LOGIN_FAILURE = "LOGIN_FAILURE",
  MULTIPLE_LOGIN_FAILURES = "MULTIPLE_LOGIN_FAILURES",
  PASSWORD_RESET_REQUESTED = "PASSWORD_RESET_REQUESTED",
  PASSWORD_RESET_COMPLETED = "PASSWORD_RESET_COMPLETED",
  EMAIL_VERIFICATION_REQUESTED = "EMAIL_VERIFICATION_REQUESTED",
  EMAIL_VERIFICATION_COMPLETED = "EMAIL_VERIFICATION_COMPLETED",
  TWO_FACTOR_ENABLED = "TWO_FACTOR_ENABLED",
  TWO_FACTOR_DISABLED = "TWO_FACTOR_DISABLED",
  SUSPICIOUS_LOGIN_ATTEMPT = "SUSPICIOUS_LOGIN_ATTEMPT",
  ACCOUNT_LOCKED = "ACCOUNT_LOCKED",
  ACCOUNT_UNLOCKED = "ACCOUNT_UNLOCKED",
  SESSION_TERMINATED = "SESSION_TERMINATED",
  PASSWORD_CHANGED = "PASSWORD_CHANGED",
  PROFILE_UPDATED = "PROFILE_UPDATED",
  ROLE_CHANGED = "ROLE_CHANGED",
}

export interface ApiKey {
  id: string;
  userId: string;
  name: string;
  key: string;
  permissions: string[];
  isActive: boolean;
  expiresAt?: Date;
  lastUsedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateApiKeyRequest {
  name: string;
  permissions: string[];
  expiresAt?: Date;
}

export interface ApiKeyResponse {
  id: string;
  name: string;
  key: string; // Only shown during creation
  permissions: string[];
  isActive: boolean;
  expiresAt?: Date;
  createdAt: Date;
  lastUsedAt?: Date;
}

export interface AuthConfig {
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    preventReuse: number;
  };
  sessionPolicy: {
    maxDuration: number; // in seconds
    inactivityTimeout: number; // in seconds
    maxConcurrentSessions: number;
  };
  twoFactorPolicy: {
    required: boolean;
    requiredRoles: string[];
    gracePeriod: number; // in days
  };
  securityPolicy: {
    maxLoginAttempts: number;
    lockoutDuration: number; // in seconds
    requireEmailVerification: boolean;
    allowRememberMe: boolean;
  };
}
