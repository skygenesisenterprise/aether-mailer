export interface User {
  id: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatar?: string;
  role: UserRole;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt?: Date;
  passwordChangedAt?: Date;
  emailVerifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface CreateUserRequest {
  email: string;
  username?: string;
  password: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface UpdateUserRequest {
  username?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatar?: string;
  role?: UserRole;
  isActive?: boolean;
  isEmailVerified?: boolean;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface ConfirmResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface UpdateProfileRequest {
  username?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatar?: string;
}

export interface UserLoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface UserLoginResponse {
  user: Omit<User, "password">;
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

export interface UserSession {
  id: string;
  userId: string;
  token: string;
  refreshToken?: string;
  userAgent?: string;
  ipAddress?: string;
  isActive: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
}

export interface UserQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  isActive?: boolean;
  isEmailVerified?: boolean;
  sortBy?: "email" | "createdAt" | "updatedAt" | "lastLoginAt";
  sortOrder?: "asc" | "desc";
}

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  emailVerified: number;
  emailUnverified: number;
  byRole: Record<UserRole, number>;
}

export interface UserActivity {
  id: string;
  userId: string;
  action: UserActivityType;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

export enum UserRole {
  ADMIN = "ADMIN",
  DOMAIN_ADMIN = "DOMAIN_ADMIN",
  USER = "USER",
  VIEWER = "VIEWER",
}

export enum UserActivityType {
  LOGIN = "LOGIN",
  LOGOUT = "LOGOUT",
  PASSWORD_CHANGED = "PASSWORD_CHANGED",
  PROFILE_UPDATED = "PROFILE_UPDATED",
  EMAIL_VERIFIED = "EMAIL_VERIFIED",
  ACCOUNT_CREATED = "ACCOUNT_CREATED",
  ACCOUNT_ACTIVATED = "ACCOUNT_ACTIVATED",
  ACCOUNT_DEACTIVATED = "ACCOUNT_DEACTIVATED",
  PASSWORD_RESET_REQUESTED = "PASSWORD_RESET_REQUESTED",
  PASSWORD_RESET_COMPLETED = "PASSWORD_RESET_COMPLETED",
}

export interface UserPreferences {
  id: string;
  userId: string;
  theme: "light" | "dark" | "system";
  language: string;
  timezone: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  twoFactorEnabled: boolean;
  preferences: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
