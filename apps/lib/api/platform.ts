import { apiRequest, apiListRequest } from "@/lib/api/client";
import type { User } from "@/lib/api/types";

export interface ActivityItem {
  id: string;
  userId: string;
  workspaceId?: string;
  type: string;
  entityId: string;
  title: string;
  message: string;
  icon?: string;
  url?: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HomeStats {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  totalMessages: number;
  unreadMessages: number;
  totalContacts: number;
  storageUsed: number;
  storageLimit: number;
  recentActivity: ActivityItem[];
  applicationsCount?: number;
  twoFactorEnabled?: boolean;
  devicesCount?: number;
}

export interface BillingInfo {
  id: string;
  userId: string;
  customerId?: string;
  paymentMethod?: string;
  billingEmail: string;
  billingAddress?: string;
  taxId?: string;
  currency: string;
  paymentStatus?: string;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  planName: string;
  status: string;
  amount: number;
  currency: string;
  interval: string;
  startDate: string;
  endDate?: string;
  features?: string;
}

export interface Transaction {
  id: string;
  userId: string;
  subscriptionId?: string;
  type: string;
  amount: number;
  currency: string;
  description: string;
  status: string;
  date: string;
  invoiceId?: string;
  invoiceUrl?: string;
}

export interface WalletData {
  billingInfo: BillingInfo;
  subscriptions: Subscription[];
  transactions: Transaction[];
}

export interface Device {
  id: string;
  userId: string;
  type: string;
  os: string;
  browser?: string;
  ipAddress: string;
  location?: string;
  lastActive: string;
  isCurrent: boolean;
  isTrusted: boolean;
}

export interface LoginHistory {
  id: string;
  userId: string;
  timestamp: string;
  ipAddress: string;
  location?: string;
  deviceType: string;
  browser?: string;
  os?: string;
  status: string;
  twoFaUsed: boolean;
}

export interface SecurityInfo {
  sessions: Array<{
    id: string;
    userAgent?: string;
    ipAddress?: string;
    createdAt: string;
    lastUsedAt: string;
    expiresAt: string;
    current: boolean;
  }>;
  devices: Device[];
  loginHistory: LoginHistory[];
  twoFaEnabled: boolean;
}

export interface PrivacySettings {
  id?: string;
  dataProcessing: boolean;
  marketingEmails: boolean;
  analytics: boolean;
  publicProfile: boolean;
  searchable: boolean;
  showOnlineStatus: boolean;
  dataRetention?: string;
}

export interface DataPrivacyData {
  settings: PrivacySettings;
  summary: {
    totalFiles: number;
    totalContacts: number;
    totalStorage: number;
    dataCategories: Array<{ name: string; count: number }>;
  };
}

export interface FamilyMember {
  id: string;
  userId: string;
  email: string;
  displayName: string;
  role: string;
  status: string;
  invitedBy: string;
  invitedAt: string;
  joinedAt?: string;
  avatarUrl?: string;
  phone?: string;
  relationship?: string;
}

export interface Invitation {
  id: string;
  email: string;
  token: string;
  type: string;
  role: string;
  status: string;
  invitedBy: string;
  expiresAt: string;
}

export interface StorageInfo {
  totalSpace: number;
  usedSpace: number;
  availableSpace: number;
  usagePercent: number;
  maxFileSize: number;
  fileCount: number;
}

export interface FileItem {
  id: string;
  name: string;
  path: string;
  type: string;
  mimeType?: string;
  size: number;
  extension?: string;
  url?: string;
  thumbnailUrl?: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformUserInfo {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  status: string;
  presenceStatus?: string;
  emailVerifiedAt?: string;
  passwordChangedAt?: string;
  lastSeenAt?: string;
  createdAt: string;
}

export interface UpdateUserInfoInput {
  displayName?: string;
  avatarUrl?: string;
}

export interface FamilyInviteInput {
  email: string;
  role: string;
  relationship?: string;
  message?: string;
}

export function getHomeStats(): Promise<HomeStats> {
  return apiRequest<HomeStats>("/platform/home").then((data) => ({
    totalProjects: data.totalProjects ?? 0,
    totalTasks: data.totalTasks ?? 0,
    completedTasks: data.completedTasks ?? 0,
    unreadMessages: data.unreadMessages ?? 0,
    totalMessages: data.totalMessages ?? 0,
    totalContacts: data.totalContacts ?? 0,
    storageUsed: data.storageUsed ?? 0,
    storageLimit: data.storageLimit ?? 0,
    recentActivity: data.recentActivity ?? [],
    applicationsCount: data.applicationsCount ?? 0,
    twoFactorEnabled: data.twoFactorEnabled ?? false,
    devicesCount: data.devicesCount ?? 0,
  }));
}

export function getWallet(): Promise<WalletData> {
  return apiRequest<WalletData>("/platform/wallet");
}

export function getSecurityInfo(): Promise<SecurityInfo> {
  return apiRequest<SecurityInfo>("/platform/security");
}

export function getPrivacySettings(): Promise<DataPrivacyData> {
  return apiRequest<DataPrivacyData>("/platform/data-privacy");
}

export function updatePrivacySettings(input: Partial<PrivacySettings>): Promise<PrivacySettings> {
  return apiRequest<PrivacySettings, Partial<PrivacySettings>>("/platform/data-privacy", {
    method: "PATCH",
    body: input,
  });
}

export function getFamilyMembers(): Promise<FamilyMember[]> {
  return apiRequest<FamilyMember[]>("/platform/family");
}

export function inviteFamilyMember(input: FamilyInviteInput): Promise<Invitation> {
  return apiRequest<Invitation, FamilyInviteInput>("/platform/family/invite", {
    method: "POST",
    body: input,
  });
}

export function getStorageInfo(): Promise<StorageInfo> {
  return apiRequest<StorageInfo>("/platform/storage");
}

export function getStorageFiles(): Promise<FileItem[]> {
  return apiRequest<FileItem[]>("/platform/storage/files");
}
