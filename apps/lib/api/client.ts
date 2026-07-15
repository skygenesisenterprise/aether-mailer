const isProduction = process.env.NODE_ENV === "production";
const isStaging = process.env.NEXT_PUBLIC_ENVIRONMENT === "staging";

const getApiBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (isProduction) {
    return "https://api.etheriatimes.com";
  }
  if (isStaging) {
    return "https://api-staging.etheriatimes.com";
  }
  return "http://localhost:8080";
};

const API_BASE_URL = getApiBaseUrl();

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, ...fetchOptions } = options;

    let url = `${this.baseURL}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }

    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

    const config: RequestInit = {
      ...fetchOptions,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...fetchOptions.headers,
      },
    };

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Request failed with status ${response.status}`);
    }

    return data;
  }

  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  async post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }

  async patch<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: JSON.stringify(body),
    });
  }
}

export const apiClient = new ApiClient();

import type {
  AuthResponse,
  TokenResponse,
  ProfileResponse,
  ProfileData,
  PasswordListResponse,
  PasswordResponse,
  SecurityResponse,
  DevicesResponse,
  SessionsResponse,
  ActivitiesResponse,
  ThirdPartyResponse,
  ContactListResponse,
  ContactResponse,
  GroupListResponse,
  GroupResponse,
  PrivacyResponse,
  DataExportResponse,
  Article,
  ArticleListResponse,
  ArticleResponse,
  HomepageArticlesResponse,
  SectionArticlesResponse,
  Category,
  CategoryListResponse,
  CategoryResponse,
  Comment,
  CommentListResponse,
  CommentResponse,
  Bookmark,
  BookmarkListResponse,
  BookmarkResponse,
  ReadingHistory,
  HistoryListResponse,
  EtheriaNotification,
  NotificationListResponse,
  NotificationResponse,
  Subscription,
  SubscriptionResponse,
  Media,
  MediaListResponse,
  MediaResponse,
  SystemSettings,
  SettingsResponse,
  User,
  EtheriaUserResponse,
  EtheriaUserListResponse,
  PaginatedResponse,
  DashboardUser,
  DashboardUserListResponse,
  DashboardUserResponse,
  CreateUserRequest,
  UpdateUserRequest,
  ApplicationType,
  ApplicationListResponse,
  ApplicationResponse,
  CreateApplicationRequest,
  OrganizationType,
  OrganizationListResponse,
  OrganizationResponse,
  CreateOrganizationRequest,
  ConnectionListResponse,
  ConnectionResponse,
  CreateConnectionRequest,
  UpdateConnectionRequest,
  DatabaseConnectionListResponse,
  DatabaseConnectionResponse,
  CreateDatabaseConnectionRequest,
  SocialConnectionListResponse,
  SocialConnectionResponse,
  CreateSocialConnectionRequest,
  EnterpriseConnectionListResponse,
  EnterpriseConnectionResponse,
  CreateSamlConnectionRequest,
  CreateOidcConnectionRequest,
  CreateAdConnectionRequest,
  PasswordlessConnectionListResponse,
  PasswordlessConnectionResponse,
  CreatePasswordlessConnectionRequest,
  AuthenticationProfileListResponse,
  AuthenticationProfileResponse,
  CreateAuthenticationProfileRequest,
} from "./types";

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<AuthResponse>("/api/v1/auth/login", { email, password }),

  register: (data: { email: string; password: string; firstName?: string; lastName?: string }) =>
    apiClient.post<AuthResponse>("/api/v1/auth/register", data),

  logout: () => apiClient.post<AuthResponse>("/api/v1/auth/logout"),

  refresh: (refreshToken: string) =>
    apiClient.post<AuthResponse>("/api/v1/auth/refresh", { refresh_token: refreshToken }),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient.post<AuthResponse>("/api/v1/auth/change-password", { currentPassword, newPassword }),

  resetPassword: (email: string) =>
    apiClient.post<AuthResponse>("/api/v1/auth/reset-password", { email }),

  getAccount: () => apiClient.get<AuthResponse>("/api/v1/account/me"),

  storeTokens: (accessToken: string, refreshToken: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken || "");
    }
  },

  clearTokens: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    }
  },

  getStoredUser: (): TokenResponse["user"] | null => {
    if (typeof window === "undefined") return null;
    const userStr = localStorage.getItem("user");
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  storeUser: (user: TokenResponse["user"]) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("user", JSON.stringify(user));
    }
  },

  clearUser: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("user");
    }
  },

  getStoredToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("accessToken");
  },
};

export const profileApi = {
  get: () => apiClient.get<ProfileResponse>("/api/v1/profile/"),

  update: (data: Partial<ProfileData>) => apiClient.put<ProfileResponse>("/api/v1/profile/", data),

  uploadAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append("avatar", file);

    const token = localStorage.getItem("accessToken");
    const response = await fetch(`${API_BASE_URL}/api/v1/profile/avatar`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    return response.json();
  },
};

export const passwordApi = {
  list: () => apiClient.get<PasswordListResponse>("/api/v1/passwords/"),

  get: (id: string) => apiClient.get<PasswordResponse>(`/api/v1/passwords/${id}`),

  create: (data: {
    name: string;
    username?: string;
    password?: string;
    url?: string;
    category: string;
    notes?: string;
  }) => apiClient.post<PasswordResponse>("/api/v1/passwords/", data),

  update: (
    id: string,
    data: {
      name?: string;
      username?: string;
      password?: string;
      url?: string;
      category?: string;
      notes?: string;
      favorite?: boolean;
    }
  ) => apiClient.put<PasswordResponse>(`/api/v1/passwords/${id}`, data),

  delete: (id: string) => apiClient.delete<PasswordResponse>(`/api/v1/passwords/${id}`),
};

export const securityApi = {
  getInfo: () => apiClient.get<SecurityResponse>("/api/v1/security/"),

  getDevices: () => apiClient.get<DevicesResponse>("/api/v1/security/devices"),

  getSessions: () => apiClient.get<SessionsResponse>("/api/v1/security/sessions"),

  getActivities: () => apiClient.get<ActivitiesResponse>("/api/v1/security/activities"),

  trustDevice: (id: string) =>
    apiClient.post<DevicesResponse>(`/api/v1/security/devices/${id}/trust`),

  revokeDevice: (id: string) => apiClient.delete<DevicesResponse>(`/api/v1/security/devices/${id}`),

  revokeSession: (id: string) =>
    apiClient.delete<SessionsResponse>(`/api/v1/security/sessions/${id}`),

  enableTwoFactor: (method: string, code: string) =>
    apiClient.post<SecurityResponse>("/api/v1/security/2fa/enable", { method, code }),

  disableTwoFactor: (code: string) =>
    apiClient.post<SecurityResponse>("/api/v1/security/2fa/disable", { code }),

  verifyTwoFactor: (code: string) =>
    apiClient.post<SecurityResponse>("/api/v1/security/2fa/verify", { code }),
};

export const thirdPartyApi = {
  list: () => apiClient.get<ThirdPartyResponse>("/api/v1/third-party/"),

  connect: (appName: string, authCode: string) =>
    apiClient.post<ThirdPartyResponse>("/api/v1/third-party/", {
      app_name: appName,
      auth_code: authCode,
    }),

  revoke: (id: string) => apiClient.delete<ThirdPartyResponse>(`/api/v1/third-party/${id}`),
};

export const contactApi = {
  list: (params?: { offset?: number; limit?: number }) => {
    const queryParams: Record<string, string> = {};
    if (params?.offset !== undefined) queryParams.offset = String(params.offset);
    if (params?.limit !== undefined) queryParams.limit = String(params.limit);
    return apiClient.get<ContactListResponse>("/api/v1/contacts/", { params: queryParams });
  },

  get: (id: string) => apiClient.get<ContactResponse>(`/api/v1/contacts/${id}`),

  create: (data: {
    account_id: string;
    name: string;
    email: string;
    phone?: string;
    company?: string;
  }) => apiClient.post<ContactResponse>("/api/v1/contacts/", data),

  update: (
    id: string,
    data: {
      account_id: string;
      name?: string;
      email?: string;
      phone?: string;
      company?: string;
    }
  ) => apiClient.put<ContactResponse>(`/api/v1/contacts/${id}`, data),

  delete: (id: string) => apiClient.delete<ContactResponse>(`/api/v1/contacts/${id}`),

  listGroups: () => apiClient.get<GroupListResponse>("/api/v1/contacts/groups"),

  createGroup: (data: { account_id: string; name: string; contact_ids?: string[] }) =>
    apiClient.post<GroupResponse>("/api/v1/contacts/groups", data),
};

export const privacyApi = {
  get: () => apiClient.get<PrivacyResponse>("/api/v1/privacy/"),

  update: (data: {
    profile_visibility?: string;
    show_email?: boolean;
    show_phone?: boolean;
    show_activity?: boolean;
    data_collection?: boolean;
    personalized_ads?: boolean;
    analytics?: boolean;
    location_tracking?: boolean;
  }) => apiClient.put<PrivacyResponse>("/api/v1/privacy/", data),

  export: (format: "json" | "csv" | "pdf") =>
    apiClient.post<DataExportResponse>("/api/v1/privacy/export", { format }),

  deleteAccount: (password: string, confirm: boolean) =>
    apiClient.post<AuthResponse>("/api/v1/privacy/delete", { password, confirm }),
};

// ==================== ETHERIA API ====================

export const articlesApi = {
  list: (params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    category?: string;
    search?: string;
  }) => {
    const queryParams: Record<string, string> = {};
    if (params?.page) queryParams.page = String(params.page);
    if (params?.pageSize) queryParams.pageSize = String(params.pageSize);
    if (params?.status) queryParams.status = params.status;
    if (params?.category) queryParams.category = params.category;
    if (params?.search) queryParams.search = params.search;
    return apiClient.get<ArticleListResponse>("/api/v1/articles", { params: queryParams });
  },

  get: (id: string) => apiClient.get<ArticleResponse>(`/api/v1/articles/${id}`),

  getBySlug: (slug: string) => apiClient.get<ArticleResponse>(`/api/v1/articles/slug/${slug}`),

  create: (data: {
    title: string;
    content: string;
    excerpt?: string;
    categoryId?: string;
    imageUrl?: string;
    imageAlt?: string;
    seoTitle?: string;
    seoDescription?: string;
    seoKeywords?: string;
  }) => apiClient.post<ArticleResponse>("/api/v1/articles", data),

  update: (
    id: string,
    data: {
      title?: string;
      content?: string;
      excerpt?: string;
      categoryId?: string;
      status?: string;
      imageUrl?: string;
      imageAlt?: string;
      seoTitle?: string;
      seoDescription?: string;
      seoKeywords?: string;
      featured?: boolean;
      scheduledAt?: string;
    }
  ) => apiClient.put<ArticleResponse>(`/api/v1/articles/${id}`, data),

  delete: (id: string) => apiClient.delete<ArticleResponse>(`/api/v1/articles/${id}`),

  publish: (id: string) => apiClient.post<ArticleResponse>(`/api/v1/articles/${id}/publish`),

  archive: (id: string) => apiClient.post<ArticleResponse>(`/api/v1/articles/${id}/archive`),

  toggleFeatured: (id: string) => apiClient.post<ArticleResponse>(`/api/v1/articles/${id}/feature`),

  getHomepage: (locale: string = "fr") =>
    apiClient.get<HomepageArticlesResponse>(`/api/v1/articles/homepage`, {
      params: { locale },
    }),

  getBySection: (section: string, locale: string = "fr", limit?: number) => {
    const queryParams: Record<string, string> = { locale };
    if (limit) queryParams.limit = String(limit);
    return apiClient.get<SectionArticlesResponse>(`/api/v1/articles/section/${section}`, {
      params: queryParams,
    });
  },
};

export const categoriesApi = {
  list: () => apiClient.get<CategoryListResponse>("/api/v1/categories"),

  get: (id: string) => apiClient.get<CategoryResponse>(`/api/v1/categories/${id}`),

  create: (data: { name: string; description?: string; color?: string; parentId?: string }) =>
    apiClient.post<CategoryResponse>("/api/v1/categories", data),

  update: (
    id: string,
    data: {
      name?: string;
      description?: string;
      color?: string;
      parentId?: string;
      isVisible?: boolean;
    }
  ) => apiClient.put<CategoryResponse>(`/api/v1/categories/${id}`, data),

  delete: (id: string) => apiClient.delete<CategoryResponse>(`/api/v1/categories/${id}`),
};

export const commentsApi = {
  list: (articleId: string, params?: { page?: number; pageSize?: number }) => {
    const queryParams: Record<string, string> = {};
    if (params?.page) queryParams.page = String(params.page);
    if (params?.pageSize) queryParams.pageSize = String(params.pageSize);
    return apiClient.get<CommentListResponse>(`/api/v1/comments/article/${articleId}`, {
      params: queryParams,
    });
  },

  create: (data: { content: string; articleId: string; parentId?: string }) =>
    apiClient.post<CommentResponse>("/api/v1/comments", data),

  update: (id: string, data: { content?: string; isApproved?: boolean }) =>
    apiClient.put<CommentResponse>(`/api/v1/comments/${id}`, data),

  delete: (id: string) => apiClient.delete<CommentResponse>(`/api/v1/comments/${id}`),

  flag: (id: string) => apiClient.post<CommentResponse>(`/api/v1/comments/${id}/flag`),

  approve: (id: string) => apiClient.post<CommentResponse>(`/api/v1/comments/${id}/approve`),
};

export const bookmarksApi = {
  list: () => apiClient.get<BookmarkListResponse>("/api/v1/user/bookmarks"),

  add: (articleId: string) =>
    apiClient.post<BookmarkResponse>("/api/v1/user/bookmarks", { articleId }),

  remove: (articleId: string) =>
    apiClient.delete<BookmarkResponse>(`/api/v1/user/bookmarks/${articleId}`),
};

export const historyApi = {
  list: () => apiClient.get<HistoryListResponse>("/api/v1/user/history"),

  add: (articleId: string) =>
    apiClient.post<HistoryListResponse>("/api/v1/user/history", { articleId }),

  clear: () => apiClient.delete<HistoryListResponse>("/api/v1/user/history"),

  remove: (articleId: string) =>
    apiClient.delete<HistoryListResponse>(`/api/v1/user/history/${articleId}`),
};

export const notificationsApi = {
  list: (params?: { page?: number; pageSize?: number }) => {
    const queryParams: Record<string, string> = {};
    if (params?.page) queryParams.page = String(params.page);
    if (params?.pageSize) queryParams.pageSize = String(params.pageSize);
    return apiClient.get<NotificationListResponse>("/api/v1/user/notifications", {
      params: queryParams,
    });
  },

  markRead: (id: string) =>
    apiClient.put<NotificationResponse>(`/api/v1/user/notifications/${id}/read`),

  markAllRead: () => apiClient.put<NotificationResponse>("/api/v1/user/notifications/read-all"),

  delete: (id: string) =>
    apiClient.delete<NotificationResponse>(`/api/v1/user/notifications/${id}`),
};

export const subscriptionApi = {
  get: () => apiClient.get<SubscriptionResponse>("/api/v1/user/subscription"),

  create: (plan: "ESSENTIAL" | "PREMIUM") =>
    apiClient.post<SubscriptionResponse>("/api/v1/user/subscription", { plan }),

  update: (plan: "ESSENTIAL" | "PREMIUM") =>
    apiClient.put<SubscriptionResponse>("/api/v1/user/subscription", { plan }),

  cancel: () => apiClient.post<SubscriptionResponse>("/api/v1/user/subscription/cancel"),
};

export const mediaApi = {
  list: () => apiClient.get<MediaListResponse>("/api/v1/media"),

  upload: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const token = localStorage.getItem("accessToken");
    const response = await fetch(`${API_BASE_URL}/api/v1/media`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    return response.json();
  },

  delete: (id: string) => apiClient.delete<MediaResponse>(`/api/v1/media/${id}`),
};

export const settingsApi = {
  get: () => apiClient.get<SettingsResponse>("/api/v1/settings"),

  update: (data: Partial<SystemSettings>) =>
    apiClient.put<SettingsResponse>("/api/v1/settings", data),

  testEmail: () => apiClient.post<SettingsResponse>("/api/v1/settings/test-email"),
};

export const adminUsersApi = {
  list: (params?: { page?: number; pageSize?: number; search?: string; role?: string }) => {
    const queryParams: Record<string, string> = {};
    if (params?.page) queryParams.page = String(params.page);
    if (params?.pageSize) queryParams.pageSize = String(params.pageSize);
    if (params?.search) queryParams.search = params.search;
    if (params?.role) queryParams.role = params.role;
    return apiClient.get<EtheriaUserListResponse>("/api/v1/admin/users", { params: queryParams });
  },

  get: (id: string) => apiClient.get<EtheriaUserResponse>(`/api/v1/admin/users/${id}`),

  create: (data: {
    email: string;
    firstName?: string;
    lastName?: string;
    role?: string;
    password: string;
  }) => apiClient.post<EtheriaUserResponse>("/api/v1/admin/users", data),

  update: (
    id: string,
    data: { firstName?: string; lastName?: string; role?: string; isActive?: boolean }
  ) => apiClient.put<EtheriaUserResponse>(`/api/v1/admin/users/${id}`, data),

  delete: (id: string) => apiClient.delete<EtheriaUserResponse>(`/api/v1/admin/users/${id}`),
};

import type {
  MarketplaceExtension,
  MarketplaceExtensionResponse,
  MarketplaceExtensionListResponse,
  InstalledExtension,
  InstallExtensionResponse,
  ActivityData,
  ActivityResponse,
  StatsData,
  StatsResponse,
  EventLog,
  EventLogResponse,
  EventStats,
  EventStatsResponse,
  TrendingExtension,
} from "./types";

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

export interface FooterLinksResponse {
  success: boolean;
  data: FooterLink[];
  error?: string;
}

export const footerLinksApi = {
  list: (params?: { locale?: string }) => {
    const queryParams: Record<string, string> = {};
    if (params?.locale) queryParams.locale = params.locale;
    return apiClient.get<FooterLinksResponse>("/api/v1/footer-links", { params: queryParams });
  },

  create: (data: Omit<FooterLink, "id">) =>
    apiClient.post<FooterLinksResponse>("/api/v1/admin/footer-links", data),

  update: (id: string, data: Partial<FooterLink>) =>
    apiClient.put<FooterLinksResponse>(`/api/v1/admin/footer-links/${id}`, data),

  delete: (id: string) => apiClient.delete<FooterLinksResponse>(`/api/v1/admin/footer-links/${id}`),
};

// ==================== DASHBOARD API ====================

export const usersApi = {
  list: (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
    connection?: string;
  }) => {
    const queryParams: Record<string, string> = {};
    if (params?.page) queryParams.page = String(params.page);
    if (params?.pageSize) queryParams.pageSize = String(params.pageSize);
    if (params?.search) queryParams.search = params.search;
    if (params?.status) queryParams.status = params.status;
    if (params?.connection) queryParams.connection = params.connection;
    return apiClient.get<DashboardUserListResponse>("/api/v1/admin/users", { params: queryParams });
  },

  get: (id: string) => apiClient.get<DashboardUserResponse>(`/api/v1/users/${id}`),

  create: (data: CreateUserRequest) => apiClient.post<DashboardUserResponse>("/api/v1/users", data),

  update: (id: string, data: UpdateUserRequest) =>
    apiClient.patch<DashboardUserResponse>(`/api/v1/users/${id}`, data),

  delete: (id: string) => apiClient.delete<DashboardUserResponse>(`/api/v1/users/${id}`),

  block: (id: string) => apiClient.post<DashboardUserResponse>(`/api/v1/users/${id}/block`),

  unblock: (id: string) => apiClient.post<DashboardUserResponse>(`/api/v1/users/${id}/unblock`),

  resetPassword: (id: string) =>
    apiClient.post<DashboardUserResponse>(`/api/v1/users/${id}/reset-password`),

  sendEmail: (id: string, data: { subject: string; message: string }) =>
    apiClient.post<DashboardUserResponse>(`/api/v1/users/${id}/send-email`, data),

  forceLogout: (id: string) =>
    apiClient.post<DashboardUserResponse>(`/api/v1/users/${id}/force-logout`),
};

export const applicationsApi = {
  list: () => apiClient.get<ApplicationListResponse>("/api/v1/applications"),

  get: (id: string) => apiClient.get<ApplicationResponse>(`/api/v1/applications/${id}`),

  create: (data: CreateApplicationRequest) =>
    apiClient.post<ApplicationResponse>("/api/v1/applications", data),

  update: (id: string, data: Partial<CreateApplicationRequest>) =>
    apiClient.patch<ApplicationResponse>(`/api/v1/applications/${id}`, data),

  delete: (id: string) => apiClient.delete<ApplicationResponse>(`/api/v1/applications/${id}`),

  getCredentials: (id: string) =>
    apiClient.get<{ clientId: string; clientSecret: string }>(
      `/api/v1/applications/${id}/credentials`
    ),

  rotateSecret: (id: string) =>
    apiClient.post<{ clientId: string; clientSecret: string }>(
      `/api/v1/applications/${id}/rotate-secret`
    ),

  getStats: (id: string) =>
    apiClient.get<{ logins: number; activeSessions: number }>(`/api/v1/applications/${id}/stats`),
};

export const organizationsApi = {
  list: () => apiClient.get<OrganizationListResponse>("/api/v1/organizations"),

  get: (id: string) => apiClient.get<OrganizationResponse>(`/api/v1/organizations/${id}`),

  create: (data: CreateOrganizationRequest) =>
    apiClient.post<OrganizationResponse>("/api/v1/organizations", data),

  update: (id: string, data: Partial<CreateOrganizationRequest>) =>
    apiClient.patch<OrganizationResponse>(`/api/v1/organizations/${id}`, data),

  delete: (id: string) => apiClient.delete<OrganizationResponse>(`/api/v1/organizations/${id}`),

  listMembers: (id: string) =>
    apiClient.get<{ success: boolean; data?: Array<{ userId: string; role: string }> }>(
      `/api/v1/organizations/${id}/members`
    ),

  addMember: (id: string, data: { userId: string; roleId: string }) =>
    apiClient.post<{ success: boolean }>(`/api/v1/organizations/${id}/members`, data),

  removeMember: (id: string, userId: string) =>
    apiClient.delete<{ success: boolean }>(`/api/v1/organizations/${id}/members/${userId}`),

  updateMember: (id: string, userId: string, data: { roleId: string }) =>
    apiClient.patch<{ success: boolean }>(`/api/v1/organizations/${id}/members/${userId}`, data),
};

import type {
  MfaMethodsResponse,
  MfaPoliciesResponse,
  MfaPolicyResponse,
  MfaStatsResponse,
  MfaActivityResponse,
  AttackProtectionResponse,
  ProtectionRulesResponse,
  BruteForceResponse,
  BreachedPasswordsResponse,
  BlockedIpsResponse,
  AttackEventsResponse,
  SecurityAnalyticsResponse,
  ThreatsResponse,
  SecurityMonitoringResponse,
  MfaMethod,
  MfaPolicy,
  MfaStats,
  MfaActivity,
  AttackProtection,
  ProtectionRule,
  BruteForceSettings,
  BreachedPasswordSettings,
  BlockedIp,
  AttackEvent,
  SecurityAnalytics,
  ThreatData,
  SecurityMonitoring,
} from "./types";

export const securityDashboardApi = {
  getMfaMethods: () => apiClient.get<MfaMethodsResponse>("/api/v1/security/mfa/methods"),

  getMfaMethod: (id: string) =>
    apiClient.get<MfaMethodsResponse>(`/api/v1/security/mfa/methods/${id}`),

  updateMfaMethod: (id: string, data: Partial<MfaMethod>) =>
    apiClient.patch<MfaMethodsResponse>(`/api/v1/security/mfa/methods/${id}`, data),

  getMfaPolicies: () => apiClient.get<MfaPoliciesResponse>("/api/v1/security/mfa/policies"),

  createMfaPolicy: (data: Omit<MfaPolicy, "id">) =>
    apiClient.post<MfaPolicyResponse>("/api/v1/security/mfa/policies", data),

  updateMfaPolicy: (id: string, data: Partial<MfaPolicy>) =>
    apiClient.patch<MfaPolicyResponse>(`/api/v1/security/mfa/policies/${id}`, data),

  deleteMfaPolicy: (id: string) =>
    apiClient.delete<MfaPolicyResponse>(`/api/v1/security/mfa/policies/${id}`),

  getMfaStats: () => apiClient.get<MfaStatsResponse>("/api/v1/security/mfa/stats"),

  getMfaActivity: () => apiClient.get<MfaActivityResponse>("/api/v1/security/mfa/activity"),

  getAttackProtection: () =>
    apiClient.get<AttackProtectionResponse>("/api/v1/security/attack-protection"),

  updateAttackProtection: (data: Partial<AttackProtection>) =>
    apiClient.patch<AttackProtectionResponse>("/api/v1/security/attack-protection", data),

  getBruteForce: () =>
    apiClient.get<BruteForceResponse>("/api/v1/security/attack-protection/brute-force"),

  updateBruteForce: (data: Partial<BruteForceSettings>) =>
    apiClient.patch<BruteForceResponse>("/api/v1/security/attack-protection/brute-force", data),

  getBreachedPasswords: () =>
    apiClient.get<BreachedPasswordsResponse>(
      "/api/v1/security/attack-protection/breached-passwords"
    ),

  updateBreachedPasswords: (data: Partial<BreachedPasswordSettings>) =>
    apiClient.patch<BreachedPasswordsResponse>(
      "/api/v1/security/attack-protection/breached-passwords",
      data
    ),

  getSecurityAnalytics: () =>
    apiClient.get<SecurityAnalyticsResponse>("/api/v1/security/analytics"),

  getThreats: () => apiClient.get<ThreatsResponse>("/api/v1/security/analytics/threats"),

  getSecurityMonitoring: () =>
    apiClient.get<SecurityMonitoringResponse>("/api/v1/security/monitoring"),
};

import type {
  BrandingUniversalLoginResponse,
  BrandingUniversalLoginPagesResponse,
  BrandingCustomLoginResponse,
  CustomDomainResponse,
  CustomDomainListResponse,
  BrandingTemplateResponse,
  BrandingTemplateListResponse,
} from "./types";

export const brandingApi = {
  getUniversalLogin: () =>
    apiClient.get<BrandingUniversalLoginResponse>("/api/v1/branding/universal-login"),

  updateUniversalLogin: (
    data: Partial<{
      template: string;
      background: string;
      backgroundImageUrl: string;
      logoUrl: string;
      companyName: string;
      welcomeTitle: string;
      welcomeSubtitle: string;
      showSocialLogin: boolean;
      showSignUp: boolean;
      showForgotPassword: boolean;
      showRememberMe: boolean;
      showCaptcha: boolean;
      sessionTimeout: string;
      redirectUrl: string;
      accentColor: string;
      backgroundColor: string;
      isActive: boolean;
    }>
  ) => apiClient.patch<BrandingUniversalLoginResponse>("/api/v1/branding/universal-login", data),

  getUniversalLoginPages: () =>
    apiClient.get<BrandingUniversalLoginPagesResponse>("/api/v1/branding/universal-login/pages"),

  createUniversalLoginPage: (data: { name: string; description: string; category: string }) =>
    apiClient.post<BrandingUniversalLoginPagesResponse>(
      "/api/v1/branding/universal-login/pages",
      data
    ),

  updateUniversalLoginPage: (
    id: string,
    data: Partial<{
      name: string;
      description: string;
      isDefault: boolean;
      isActive: boolean;
    }>
  ) =>
    apiClient.patch<BrandingUniversalLoginPagesResponse>(
      `/api/v1/branding/universal-login/pages/${id}`,
      data
    ),

  getCustomLogin: () => apiClient.get<BrandingCustomLoginResponse>("/api/v1/branding/custom-login"),

  updateCustomLogin: (
    data: Partial<{
      theme: string;
      pattern: string;
      font: string;
      logoUrl: string;
      primaryColor: string;
      accentColor: string;
      showSocialButtons: boolean;
      showRememberDevice: boolean;
      showPoweredBy: boolean;
      customCss: string;
      isEnabled: boolean;
    }>
  ) => apiClient.patch<BrandingCustomLoginResponse>("/api/v1/branding/custom-login", data),

  getCustomDomains: () =>
    apiClient.get<CustomDomainListResponse>("/api/v1/branding/custom-domains"),

  createCustomDomain: (data: { domain: string }) =>
    apiClient.post<CustomDomainResponse>("/api/v1/branding/custom-domains", data),

  updateCustomDomain: (
    id: string,
    data: Partial<{
      domain: string;
      autoSsl: boolean;
      forceHttps: boolean;
      httpRedirect: boolean;
      enableHsts: boolean;
      hstsMaxAge: number;
    }>
  ) => apiClient.patch<CustomDomainResponse>(`/api/v1/branding/custom-domains/${id}`, data),

  deleteCustomDomain: (id: string) =>
    apiClient.delete<CustomDomainResponse>(`/api/v1/branding/custom-domains/${id}`),

  verifyCustomDomain: (id: string) =>
    apiClient.post<CustomDomainResponse>(`/api/v1/branding/custom-domains/${id}/verify`),

  getTemplates: () => apiClient.get<BrandingTemplateListResponse>("/api/v1/branding/templates"),

  createTemplate: (data: { name: string; description: string; category: string }) =>
    apiClient.post<BrandingTemplateResponse>("/api/v1/branding/templates", data),

  updateTemplate: (
    id: string,
    data: Partial<{
      name: string;
      description: string;
      isDefault: boolean;
      isActive: boolean;
    }>
  ) => apiClient.patch<BrandingTemplateResponse>(`/api/v1/branding/templates/${id}`, data),

  deleteTemplate: (id: string) =>
    apiClient.delete<BrandingTemplateResponse>(`/api/v1/branding/templates/${id}`),
};

export const connectionsApi = {
  list: () => apiClient.get<ConnectionListResponse>("/api/v1/connections"),

  get: (id: string) => apiClient.get<ConnectionResponse>(`/api/v1/connections/${id}`),

  create: (data: CreateConnectionRequest) =>
    apiClient.post<ConnectionResponse>("/api/v1/connections", data),

  update: (id: string, data: UpdateConnectionRequest) =>
    apiClient.patch<ConnectionResponse>(`/api/v1/connections/${id}`, data),

  delete: (id: string) => apiClient.delete<ConnectionResponse>(`/api/v1/connections/${id}`),

  enable: (id: string) => apiClient.post<ConnectionResponse>(`/api/v1/connections/${id}/enable`),

  disable: (id: string) => apiClient.post<ConnectionResponse>(`/api/v1/connections/${id}/disable`),

  listDatabase: () => apiClient.get<DatabaseConnectionListResponse>("/api/v1/connections/database"),

  createDatabase: (data: CreateDatabaseConnectionRequest) =>
    apiClient.post<DatabaseConnectionResponse>("/api/v1/connections/database", data),

  updateDatabase: (id: string, data: Partial<CreateDatabaseConnectionRequest>) =>
    apiClient.patch<DatabaseConnectionResponse>(`/api/v1/connections/database/${id}`, data),

  listSocial: () => apiClient.get<SocialConnectionListResponse>("/api/v1/connections/social"),

  createSocial: (data: CreateSocialConnectionRequest) =>
    apiClient.post<SocialConnectionResponse>("/api/v1/connections/social", data),

  listEnterprise: () =>
    apiClient.get<EnterpriseConnectionListResponse>("/api/v1/connections/enterprise"),

  createSaml: (data: CreateSamlConnectionRequest) =>
    apiClient.post<EnterpriseConnectionResponse>("/api/v1/connections/enterprise/saml", data),

  createOidc: (data: CreateOidcConnectionRequest) =>
    apiClient.post<EnterpriseConnectionResponse>("/api/v1/connections/enterprise/oidc", data),

  createAd: (data: CreateAdConnectionRequest) =>
    apiClient.post<EnterpriseConnectionResponse>("/api/v1/connections/enterprise/ad", data),

  listPasswordless: () =>
    apiClient.get<PasswordlessConnectionListResponse>("/api/v1/connections/passwordless"),

  createPasswordless: (data: CreatePasswordlessConnectionRequest) =>
    apiClient.post<PasswordlessConnectionResponse>("/api/v1/connections/passwordless", data),

  listAuthenticationProfiles: () =>
    apiClient.get<AuthenticationProfileListResponse>("/api/v1/connections/authentication-profiles"),

  createAuthenticationProfile: (data: CreateAuthenticationProfileRequest) =>
    apiClient.post<AuthenticationProfileResponse>(
      "/api/v1/connections/authentication-profiles",
      data
    ),
};

import type {
  LogsResponse,
  LogsStatsResponse,
  ActionLogsResponse,
  ActionLogsStatsResponse,
  MonitoringStatusResponse,
  MonitoringHealthResponse,
  Agent,
  AgentListResponse,
  AgentResponse,
  AgentStatusResponse,
  AgentStatusInfo,
  CreateAgentRequest,
  UpdateAgentRequest,
} from "./types";

// ==================== LOGS API ====================

export type LogsParams = {
  page?: number;
  pageSize?: number;
  level?: string;
  event?: string;
  user?: string;
  connection?: string;
  ip?: string;
  search?: string;
  from?: string;
  to?: string;
};

export const logsApi = {
  list: (params?: LogsParams) => {
    const queryParams: Record<string, string> = {};
    if (params?.page) queryParams.page = String(params.page);
    if (params?.pageSize) queryParams.pageSize = String(params.pageSize);
    if (params?.level) queryParams.level = params.level;
    if (params?.event) queryParams.event = params.event;
    if (params?.user) queryParams.user = params.user;
    if (params?.connection) queryParams.connection = params.connection;
    if (params?.ip) queryParams.ip = params.ip;
    if (params?.search) queryParams.search = params.search;
    if (params?.from) queryParams.from = params.from;
    if (params?.to) queryParams.to = params.to;
    return apiClient.get<LogsResponse>("/api/v1/logs", { params: queryParams });
  },

  get: (id: string) => apiClient.get<LogsResponse>(`/api/v1/logs/${id}`),

  getStats: () => apiClient.get<LogsStatsResponse>("/api/v1/logs/stats"),

  export: (params?: LogsParams) => {
    const queryParams: Record<string, string> = {};
    if (params?.level) queryParams.level = params.level;
    if (params?.event) queryParams.event = params.event;
    if (params?.user) queryParams.user = params.user;
    if (params?.connection) queryParams.connection = params.connection;
    if (params?.ip) queryParams.ip = params.ip;
    if (params?.from) queryParams.from = params.from;
    if (params?.to) queryParams.to = params.to;
    return apiClient.get<LogsResponse>("/api/v1/logs/export", { params: queryParams });
  },

  stream: (params?: LogsParams) => {
    const queryParams: Record<string, string> = {};
    if (params?.level) queryParams.level = params.level;
    if (params?.event) queryParams.event = params.event;
    return apiClient.get<LogsResponse>("/api/v1/logs/stream", { params: queryParams });
  },
};

export const actionLogsApi = {
  list: (params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    trigger?: string;
    search?: string;
  }) => {
    const queryParams: Record<string, string> = {};
    if (params?.page) queryParams.page = String(params.page);
    if (params?.pageSize) queryParams.pageSize = String(params.pageSize);
    if (params?.status) queryParams.status = params.status;
    if (params?.trigger) queryParams.trigger = params.trigger;
    if (params?.search) queryParams.search = params.search;
    return apiClient.get<ActionLogsResponse>("/api/v1/logs/actions", { params: queryParams });
  },

  get: (id: string) => apiClient.get<ActionLogsResponse>(`/api/v1/logs/actions/${id}`),

  getStats: () => apiClient.get<ActionLogsStatsResponse>("/api/v1/logs/actions/stats"),
};

// ==================== MONITORING API ====================

export const monitoringApi = {
  getStatus: () => apiClient.get<MonitoringStatusResponse>("/api/v1/monitoring/status"),

  getHealth: () => apiClient.get<MonitoringHealthResponse>("/api/v1/monitoring/health"),
};

// ==================== MARKETPLACE API ====================

export const marketplaceApi = {
  list: (params?: { category?: string; search?: string }) => {
    const queryParams: Record<string, string> = {};
    if (params?.category && params.category !== "all") queryParams.category = params.category;
    if (params?.search) queryParams.search = params.search;
    return apiClient.get<MarketplaceExtensionListResponse>("/api/v1/marketplace", {
      params: queryParams,
    });
  },

  get: (id: string) => apiClient.get<MarketplaceExtensionResponse>(`/api/v1/marketplace/${id}`),

  install: (id: string) =>
    apiClient.post<InstallExtensionResponse>(`/api/v1/marketplace/${id}/install`),

  uninstall: (id: string) =>
    apiClient.post<InstallExtensionResponse>(`/api/v1/marketplace/${id}/uninstall`),

  getInstalled: () =>
    apiClient.get<{ success: boolean; data?: InstalledExtension[]; error?: string }>(
      "/api/v1/marketplace/installed"
    ),

  getTrending: () =>
    apiClient.get<{ success: boolean; data?: TrendingExtension[]; error?: string }>(
      "/api/v1/marketplace/trending"
    ),
};

// ==================== ACTIVITY API ====================

export const activityApi = {
  getActivity: (params?: { timeRange?: string }) => {
    const queryParams: Record<string, string> = {};
    if (params?.timeRange) queryParams.timeRange = params.timeRange;
    return apiClient.get<ActivityResponse>("/api/v1/activity", { params: queryParams });
  },

  getDau: (params?: { timeRange?: string }) => {
    const queryParams: Record<string, string> = {};
    if (params?.timeRange) queryParams.timeRange = params.timeRange;
    return apiClient.get<ActivityResponse>("/api/v1/activity/dau", { params: queryParams });
  },

  getRetention: (params?: { timeRange?: string }) => {
    const queryParams: Record<string, string> = {};
    if (params?.timeRange) queryParams.timeRange = params.timeRange;
    return apiClient.get<ActivityResponse>("/api/v1/activity/retention", { params: queryParams });
  },

  getSignups: (params?: { timeRange?: string }) => {
    const queryParams: Record<string, string> = {};
    if (params?.timeRange) queryParams.timeRange = params.timeRange;
    return apiClient.get<ActivityResponse>("/api/v1/activity/signups", { params: queryParams });
  },
};

// ==================== STATS API ====================

export const statsApi = {
  get: () => apiClient.get<StatsResponse>("/api/v1/stats"),

  getUsers: () => apiClient.get<StatsResponse>("/api/v1/stats/users"),

  getSessions: () => apiClient.get<StatsResponse>("/api/v1/stats/sessions"),
};

// ==================== EVENTS API ====================

export const eventsApi = {
  list: (params?: {
    page?: number;
    limit?: string;
    type?: string;
    connection?: string;
    search?: string;
  }) => {
    const queryParams: Record<string, string> = {};
    if (params?.page) queryParams.page = String(params.page);
    if (params?.limit) queryParams.limit = params.limit;
    if (params?.type && params.type !== "all") queryParams.type = params.type;
    if (params?.connection && params.connection !== "all")
      queryParams.connection = params.connection;
    if (params?.search) queryParams.search = params.search;
    return apiClient.get<EventLogResponse>("/api/v1/events", { params: queryParams });
  },

  get: (id: string) => apiClient.get<EventLogResponse>(`/api/v1/events/${id}`),

  getStats: () => apiClient.get<EventStatsResponse>("/api/v1/events/stats"),
};

// ==================== AGENTS API ====================

export const agentsApi = {
  list: () => apiClient.get<AgentListResponse>("/api/v1/agents"),

  get: (id: string) => apiClient.get<AgentResponse>(`/api/v1/agents/${id}`),

  create: (data: CreateAgentRequest) => apiClient.post<AgentResponse>("/api/v1/agents", data),

  update: (id: string, data: UpdateAgentRequest) =>
    apiClient.patch<AgentResponse>(`/api/v1/agents/${id}`, data),

  delete: (id: string) => apiClient.delete<AgentResponse>(`/api/v1/agents/${id}`),

  getStatus: (id: string) => apiClient.get<AgentStatusResponse>(`/api/v1/agents/${id}/status`),

  restart: (id: string) => apiClient.post<AgentResponse>(`/api/v1/agents/${id}/restart`),
};

import type {
  ActionsListResponse,
  ActionResponse,
  ActionTemplatesResponse,
  TriggersResponse,
  TriggerMappingsResponse,
  TriggerEventsResponse,
  FormsListResponse,
  FormResponse,
  FormTemplatesResponse,
  ExtensionsListResponse,
  ExtensionResponse,
  AvailableExtensionsResponse,
  Action,
  ActionTemplate,
  DashboardActionLogEntry,
  ActionTriggerDef,
  ActionTriggerMapping,
  TriggerEvent,
  ActionForm,
  Extension,
} from "./types";

// ==================== ACTIONS API ====================

export const actionsApi = {
  list: () => apiClient.get<ActionsListResponse>("/api/v1/actions"),

  get: (id: string) => apiClient.get<ActionResponse>(`/api/v1/actions/${id}`),

  create: (data: { name: string; description: string; code: string; triggers: string[] }) =>
    apiClient.post<ActionResponse>("/api/v1/actions", data),

  update: (
    id: string,
    data: {
      name?: string;
      description?: string;
      code?: string;
      triggers?: string[];
    }
  ) => apiClient.patch<ActionResponse>(`/api/v1/actions/${id}`, data),

  delete: (id: string) => apiClient.delete<ActionResponse>(`/api/v1/actions/${id}`),

  deploy: (id: string) => apiClient.post<ActionResponse>(`/api/v1/actions/${id}/deploy`),

  test: (id: string) => apiClient.post<ActionResponse>(`/api/v1/actions/${id}/test`),

  getLibrary: () => apiClient.get<ActionTemplatesResponse>("/api/v1/actions/library"),

  getTriggers: () => apiClient.get<TriggersResponse>("/api/v1/actions/triggers"),

  getTriggerMappings: () =>
    apiClient.get<TriggerMappingsResponse>("/api/v1/actions/triggers/mappings"),

  getTriggerEvents: () => apiClient.get<TriggerEventsResponse>("/api/v1/actions/triggers/events"),
};

// ==================== FORMS API ====================

export const formsApi = {
  list: () => apiClient.get<FormsListResponse>("/api/v1/actions/forms"),

  get: (id: string) => apiClient.get<FormResponse>(`/api/v1/actions/forms/${id}`),

  create: (data: {
    name: string;
    description: string;
    fields: Array<{
      name: string;
      type: string;
      required: boolean;
    }>;
    action: string;
  }) => apiClient.post<FormResponse>("/api/v1/actions/forms", data),

  update: (
    id: string,
    data: {
      name?: string;
      description?: string;
      fields?: Array<{
        name: string;
        type: string;
        required: boolean;
      }>;
      action?: string;
    }
  ) => apiClient.patch<FormResponse>(`/api/v1/actions/forms/${id}`, data),

  delete: (id: string) => apiClient.delete<FormResponse>(`/api/v1/actions/forms/${id}`),

  getTemplates: () => apiClient.get<FormTemplatesResponse>("/api/v1/actions/forms/templates"),
};

// ==================== EXTENSIONS API ====================

export const extensionsApi = {
  list: () => apiClient.get<ExtensionsListResponse>("/api/v1/extensions"),

  get: (id: string) => apiClient.get<ExtensionResponse>(`/api/v1/extensions/${id}`),

  create: (data: { name: string; description: string; version: string }) =>
    apiClient.post<ExtensionResponse>("/api/v1/extensions", data),

  update: (
    id: string,
    data: {
      name?: string;
      description?: string;
      version?: string;
    }
  ) => apiClient.patch<ExtensionResponse>(`/api/v1/extensions/${id}`, data),

  delete: (id: string) => apiClient.delete<ExtensionResponse>(`/api/v1/extensions/${id}`),

  getConfig: (id: string) => apiClient.get<ExtensionResponse>(`/api/v1/extensions/${id}/config`),

  updateConfig: (id: string, config: Record<string, unknown>) =>
    apiClient.patch<ExtensionResponse>(`/api/v1/extensions/${id}/config`, config),

  getAvailable: () => apiClient.get<AvailableExtensionsResponse>("/api/v1/extensions/marketplace"),
};
