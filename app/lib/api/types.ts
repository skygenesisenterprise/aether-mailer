export interface User {
  id: string;
  email: string;
  name: string;
  username?: string;
  avatarUrl?: string;
  role?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export interface AuthResponse {
  success: boolean;
  data?: TokenResponse;
  error?: string;
  message?: string;
  requiresMfa?: boolean;
  mfaMethod?: string;
}

export interface ProfileData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  gender: string;
  phone: string;
  birthDate: string;
  language: string;
  avatarUrl: string;
  aetherId: string;
  accountType: string;
  addresses: Address[];
  createdAt: string;
}

export interface Address {
  id: string;
  label: string;
  value: string;
  isPrimary: boolean;
}

export interface ProfileResponse {
  success: boolean;
  data?: ProfileData;
  error?: string;
}

export interface Password {
  id: string;
  name: string;
  username: string;
  password: string;
  url?: string;
  favorite: boolean;
  category: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PasswordListResponse {
  success: boolean;
  data?: Password[];
  error?: string;
}

export interface PasswordResponse {
  success: boolean;
  data?: Password;
  error?: string;
}

export interface Device {
  id: string;
  name: string;
  type: string;
  os?: string;
  browser?: string;
  lastSeen?: string;
  isTrusted: boolean;
}

export interface Session {
  id: string;
  token?: string;
  deviceId?: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt?: string;
  createdAt?: string;
}

export interface SecurityActivity {
  id: string;
  type: string;
  title: string;
  description?: string;
  device?: string;
  ipAddress?: string;
  time?: string;
}

export interface TwoFactorConfig {
  enabled: boolean;
  method?: string;
}

export interface SecurityData {
  devices: Device[];
  sessions: Session[];
  activities: SecurityActivity[];
  twoFactor: TwoFactorConfig;
  passkeyEnabled: boolean;
  secureNavigation: boolean;
}

export interface SecurityResponse {
  success: boolean;
  data?: SecurityData;
  error?: string;
}

export interface DevicesResponse {
  success: boolean;
  data?: Device[];
  error?: string;
}

export interface SessionsResponse {
  success: boolean;
  data?: Session[];
  error?: string;
}

export interface ActivitiesResponse {
  success: boolean;
  data?: SecurityActivity[];
  error?: string;
}

export interface ThirdPartyApp {
  id: string;
  name: string;
  accessLevel: string;
  connectedAt?: string;
}

export interface ThirdPartyResponse {
  success: boolean;
  data?: ThirdPartyApp[];
  error?: string;
}

export interface Contact {
  id: string;
  accountId?: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  nickname?: string;
  company?: string;
  jobTitle?: string;
  department?: string;
  phone?: string;
  mobile?: string;
  address?: string;
  avatarUrl?: string;
  starred?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ContactGroup {
  id: string;
  accountId?: string;
  name: string;
  description?: string;
  totalContacts?: number;
  createdAt?: string;
}

export interface ContactList {
  accountId: string;
  totalContacts: number;
  contacts: Contact[];
  hasMore: boolean;
  offset: number;
  limit: number;
}

export interface ContactListResponse {
  success: boolean;
  data?: ContactList;
  error?: string;
}

export interface ContactResponse {
  success: boolean;
  data?: Contact;
  error?: string;
}

export interface GroupListResponse {
  success: boolean;
  data?: {
    accountId: string;
    groups: ContactGroup[];
    total: number;
  };
  error?: string;
}

export interface GroupResponse {
  success: boolean;
  data?: ContactGroup;
  error?: string;
}

export interface AccountPrivacySettings {
  profileVisibility: string;
  showEmail: boolean;
  showPhone: boolean;
  showActivity: boolean;
  dataCollection: boolean;
  personalizedAds: boolean;
  analytics: boolean;
  locationTracking: boolean;
}

export interface PrivacyResponse {
  success: boolean;
  data?: AccountPrivacySettings;
  error?: string;
}

export interface DataExportResponse {
  success: boolean;
  message?: string;
  dataUrl?: string;
  error?: string;
}

// ==================== ETHERIA TYPES ====================

export type ArticleStatus = "DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED";
export type SubscriptionPlan = "ESSENTIAL" | "PREMIUM";
export type SubscriptionStatus = "ACTIVE" | "CANCELLED" | "EXPIRED" | "PAST_DUE";
export type NotificationType = "ARTICLE" | "BOOKMARK" | "SYSTEM" | "ACCOUNT" | "COMMENT";

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  contentHtml?: string;
  status: ArticleStatus;
  featured: boolean;
  publishedAt?: string;
  scheduledAt?: string;
  viewCount: number;
  readTime: number;
  imageUrl?: string;
  imageAlt?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  authorId: string;
  categoryId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  isVisible: boolean;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  content: string;
  isApproved: boolean;
  isFlagged: boolean;
  flagReason?: string;
  parentId?: string;
  articleId: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Bookmark {
  id: string;
  userId: string;
  articleId: string;
  createdAt: string;
}

export interface ReadingHistory {
  id: string;
  userId: string;
  articleId: string;
  readAt: string;
}

export interface EtheriaNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  priority: string;
  userId: string;
  createdAt: string;
}

export interface Media {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  alt?: string;
  width?: number;
  height?: number;
  articleId?: string;
  categoryId?: string;
  createdAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startedAt: string;
  expiresAt?: string;
  lastPaymentDate?: string;
  nextPaymentDate?: string;
  paymentMethod?: string;
  paymentLast4?: string;
  cancelAtPeriodEnd: boolean;
}

export interface SystemSettings {
  id: string;
  siteName: string;
  siteDescription?: string;
  siteUrl?: string;
  logoUrl?: string;
  faviconUrl?: string;
  email?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  fromName?: string;
  fromEmail?: string;
  maintenanceMode: boolean;
  registrationOpen: boolean;
  commentsEnabled: boolean;
  newsletterEnabled: boolean;
  analyticsEnabled: boolean;
  sslEnforced: boolean;
  dockerImage: string;
  version: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse {
  success: boolean;
  data?: unknown;
  message?: string;
  error?: string;
}

export interface ArticleListResponse extends ApiResponse {
  data?: Article[];
  total?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
}
export interface ArticleResponse extends ApiResponse {
  data?: Article;
}

export interface HomepageArticlesResponse extends ApiResponse {
  data?: {
    featured: Article;
    topArticles: Article[];
    mostRead: Article[];
    sections: Record<string, Article[]>;
  };
}

export interface SectionArticlesResponse extends ApiResponse {
  data?: Article[];
}

export interface CategoryListResponse extends ApiResponse {
  data?: Category[];
  total?: number;
}
export interface CategoryResponse extends ApiResponse {
  data?: Category;
}
export interface CommentListResponse extends ApiResponse {
  data?: Comment[];
  total?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
}
export interface CommentResponse extends ApiResponse {
  data?: Comment;
}
export interface BookmarkListResponse extends ApiResponse {
  data?: Bookmark[];
}
export interface BookmarkResponse extends ApiResponse {
  data?: Bookmark;
}
export interface HistoryListResponse extends ApiResponse {
  data?: ReadingHistory[];
}
export interface NotificationListResponse extends ApiResponse {
  data?: EtheriaNotification[];
  total?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
}
export interface NotificationResponse extends ApiResponse {}
export interface SubscriptionResponse extends ApiResponse {}
export interface MediaListResponse extends ApiResponse {
  data?: Media[];
}
export interface MediaResponse extends ApiResponse {}
export interface SettingsResponse extends ApiResponse {
  data?: SystemSettings;
}
export interface EtheriaUserResponse extends ApiResponse {}
export interface EtheriaUserListResponse {
  success?: boolean;
  data?: AdminUser[];
  total?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
  error?: string;
}

export interface AdminUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  role?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ==================== DASHBOARD TYPES ====================

export type UserStatus = "active" | "blocked" | "pending" | "inactive";

export interface DashboardUser {
  id: string;
  name: string;
  email: string;
  status: UserStatus;
  connection: string;
  mfa: boolean;
  lastLogin: string;
  createdAt: string;
  avatarUrl?: string;
  role?: string;
}

export interface DashboardUserListResponse {
  success: boolean;
  data?: DashboardUser[];
  total?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
  error?: string;
}

export interface DashboardUserResponse {
  success: boolean;
  data?: DashboardUser;
  error?: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role?: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  role?: string;
  isActive?: boolean;
}

export interface ApplicationType {
  id: string;
  name: string;
  description: string;
  type: string;
  clientId: string;
  clientSecret?: string;
  status: "active" | "inactive";
  isDefault: boolean;
  logins: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApplicationListResponse {
  success: boolean;
  data?: ApplicationType[];
  total?: number;
  error?: string;
}

export interface ApplicationResponse {
  success: boolean;
  data?: ApplicationType;
  error?: string;
}

export interface CreateApplicationRequest {
  name: string;
  description?: string;
  type: string;
}

export interface OrganizationType {
  id: string;
  name: string;
  slug: string;
  members: number;
  status: "active" | "inactive";
  createdAt: string;
  description?: string;
}

export interface OrganizationListResponse {
  success: boolean;
  data?: OrganizationType[];
  total?: number;
  error?: string;
}

export interface OrganizationResponse {
  success: boolean;
  data?: OrganizationType;
  error?: string;
}

export interface CreateOrganizationRequest {
  name: string;
  description?: string;
}

// ==================== CONNECTION TYPES ====================

export interface Connection {
  id: string;
  name: string;
  strategy: string;
  type: string;
  enabled: boolean;
  options?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface ConnectionListResponse {
  success: boolean;
  data?: Connection[];
  total?: number;
  error?: string;
}

export interface ConnectionResponse {
  success: boolean;
  data?: Connection;
  error?: string;
}

export interface CreateConnectionRequest {
  name: string;
  strategy: string;
  type?: string;
  options?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  enabled?: boolean;
}

export interface UpdateConnectionRequest {
  name?: string;
  enabled?: boolean;
  options?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface DatabaseConnection {
  id: string;
  name: string;
  strategy: string;
  type: string;
  enabled: boolean;
  options: {
    identifiers: string[];
    authMethods: string[];
    allowNonUniqueEmail?: boolean;
    disableSignUps?: boolean;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface DatabaseConnectionResponse {
  success: boolean;
  data?: DatabaseConnection;
  error?: string;
}

export interface DatabaseConnectionListResponse {
  success: boolean;
  data?: DatabaseConnection[];
  total?: number;
  error?: string;
}

export interface CreateDatabaseConnectionRequest {
  name: string;
  identifiers: string[];
  authMethods: string[];
  allowNonUniqueEmail?: boolean;
  disableSignUps?: boolean;
  promoteToDomain?: boolean;
}

export interface SocialConnection {
  id: string;
  name: string;
  strategy: string;
  type: string;
  enabled: boolean;
  options: {
    clientId?: string;
    clientSecret?: string;
  };
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface SocialConnectionResponse {
  success: boolean;
  data?: SocialConnection;
  error?: string;
}

export interface SocialConnectionListResponse {
  success: boolean;
  data?: SocialConnection[];
  total?: number;
  error?: string;
}

export interface CreateSocialConnectionRequest {
  name: string;
  provider: string;
  clientId: string;
  clientSecret: string;
}

export interface EnterpriseConnection {
  id: string;
  name: string;
  strategy: string;
  type: "saml" | "oidc" | "ad" | "wsfed";
  enabled: boolean;
  options?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface EnterpriseConnectionResponse {
  success: boolean;
  data?: EnterpriseConnection;
  error?: string;
}

export interface EnterpriseConnectionListResponse {
  success: boolean;
  data?: EnterpriseConnection[];
  total?: number;
  error?: string;
}

export interface CreateSamlConnectionRequest {
  name: string;
  type: "saml";
  metadataUrl?: string;
  options?: {
    entityId?: string;
    acsUrl?: string;
    signingCert?: string;
  };
}

export interface CreateOidcConnectionRequest {
  name: string;
  type: "oidc";
  issuer: string;
  clientId: string;
  clientSecret: string;
}

export interface CreateAdConnectionRequest {
  name: string;
  type: "ad";
  connectionString: string;
  baseDn: string;
  bindDn: string;
  bindPassword: string;
}

export interface PasswordlessConnection {
  id: string;
  name: string;
  strategy: string;
  type: "email" | "sms" | "whatsapp" | "passkey";
  enabled: boolean;
  options: {
    types: string[];
    disableSignUps?: boolean;
    brandingEnabled?: boolean;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface PasswordlessConnectionResponse {
  success: boolean;
  data?: PasswordlessConnection;
  error?: string;
}

export interface PasswordlessConnectionListResponse {
  success: boolean;
  data?: PasswordlessConnection[];
  total?: number;
  error?: string;
}

export interface CreatePasswordlessConnectionRequest {
  name: string;
  types: string[];
  disableSignUps?: boolean;
  brandingEnabled?: boolean;
}

export interface AuthenticationProfile {
  id: string;
  name: string;
  enabled: boolean;
  methods: string[];
  requireMfa: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthenticationProfileResponse {
  success: boolean;
  data?: AuthenticationProfile;
  error?: string;
}

export interface AuthenticationProfileListResponse {
  success: boolean;
  data?: AuthenticationProfile[];
  total?: number;
  error?: string;
}

export interface CreateAuthenticationProfileRequest {
  name: string;
  methods: string[];
  requireMfa?: boolean;
}

// ==================== SECURITY API TYPES ====================

export interface MfaMethod {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  users: number;
  status: string;
}

export interface MfaMethodsResponse {
  success: boolean;
  data?: MfaMethod[];
  error?: string;
}

export interface MfaPolicy {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  scope: string;
}

export interface MfaPoliciesResponse {
  success: boolean;
  data?: MfaPolicy[];
  error?: string;
}

export interface MfaPolicyResponse {
  success: boolean;
  data?: MfaPolicy;
  error?: string;
}

export interface MfaStats {
  totalUsers: number;
  mfaEnabled: number;
  mfaPending: number;
  challengesToday: number;
  challengeRate: number;
}

export interface MfaStatsResponse {
  success: boolean;
  data?: MfaStats;
  error?: string;
}

export interface MfaActivity {
  type: string;
  user: string;
  method: string;
  time: string;
  ip: string;
  device: string;
  reason?: string;
}

export interface MfaActivityResponse {
  success: boolean;
  data?: MfaActivity[];
  error?: string;
}

export interface AttackProtection {
  blockedToday: number;
  blockedThisWeek: number;
  activeRules: number;
  suspiciousIPs: number;
  attackAttempts: number;
  normalTraffic: number;
  threatLevel: string;
}

export interface AttackProtectionResponse {
  success: boolean;
  data?: AttackProtection;
  error?: string;
}

export interface ProtectionRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  severity: string;
  blockedCount: number;
}

export interface ProtectionRulesResponse {
  success: boolean;
  data?: ProtectionRule[];
  error?: string;
}

export interface BruteForceSettings {
  enabled?: boolean;
  maxAttempts: number;
  lockoutDuration: number;
  resetAfter: number;
}

export interface BruteForceResponse {
  success: boolean;
  data?: BruteForceSettings;
  error?: string;
}

export interface BreachedPasswordSettings {
  enabled: boolean;
  checkOnLogin: boolean;
}

export interface BreachedPasswordsResponse {
  success: boolean;
  data?: BreachedPasswordSettings;
  error?: string;
}

export interface BlockedIp {
  ip: string;
  country: string;
  reason: string;
  attempts: number;
  lastAttempt: string;
  status: string;
}

export interface BlockedIpsResponse {
  success: boolean;
  data?: BlockedIp[];
  error?: string;
}

export interface AttackEvent {
  type: string;
  source: string;
  country: string;
  method: string;
  target: string;
  time: string;
}

export interface AttackEventsResponse {
  success: boolean;
  data?: AttackEvent[];
  error?: string;
}

export interface SecurityAnalytics {
  threatsBlocked: number;
  failedMfaAttempts: number;
  ipsBlocked: number;
  mfaAdoption: number;
}

export interface SecurityAnalyticsResponse {
  success: boolean;
  data?: SecurityAnalytics;
  error?: string;
}

export interface ThreatData {
  type: string;
  count: number;
  severity: string;
}

export interface ThreatsResponse {
  success: boolean;
  data?: ThreatData[];
  error?: string;
}

export interface SecurityMonitoring {
  totalEvents: number;
  blockedAttempts: number;
  failedLogins: number;
  suspiciousActivity: number;
  activeBlocks: number;
  mfaChallenges: number;
}

export interface SecurityMonitoringResponse {
  success: boolean;
  data?: SecurityMonitoring;
  error?: string;
}

// ==================== BRANDING TYPES ====================

export interface BrandingUniversalLogin {
  id: string;
  template: string;
  background: string;
  backgroundImageUrl?: string;
  logoUrl?: string;
  companyName: string;
  welcomeTitle: string;
  welcomeSubtitle: string;
  showSocialLogin: boolean;
  showSignUp: boolean;
  showForgotPassword: boolean;
  showRememberMe: boolean;
  showCaptcha: boolean;
  sessionTimeout: string;
  redirectUrl?: string;
  accentColor: string;
  backgroundColor: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface BrandingUniversalLoginPages {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail?: string;
  isDefault: boolean;
  isActive: boolean;
  usageCount: number;
}

export interface BrandingCustomLogin {
  id: string;
  theme: string;
  pattern: string;
  font: string;
  logoUrl?: string;
  primaryColor: string;
  accentColor: string;
  showSocialButtons: boolean;
  showRememberDevice: boolean;
  showPoweredBy: boolean;
  customCss?: string;
  isEnabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomDomain {
  id: string;
  domain: string;
  status: "active" | "pending" | "inactive";
  ssl: "valid" | "pending" | "expired" | "none";
  sslExpiresAt?: string;
  isVerified: boolean;
  autoSsl: boolean;
  forceHttps: boolean;
  httpRedirect: boolean;
  enableHsts: boolean;
  hstsMaxAge?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface BrandingTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail?: string;
  isDefault: boolean;
  isActive: boolean;
  usageCount: number;
  config?: Record<string, unknown>;
}

export interface BrandingUniversalLoginResponse extends ApiResponse {
  data?: BrandingUniversalLogin;
}

export interface BrandingUniversalLoginPagesResponse extends ApiResponse {
  data?: BrandingUniversalLoginPages[];
  total?: number;
}

export interface BrandingCustomLoginResponse extends ApiResponse {
  data?: BrandingCustomLogin;
}

export interface CustomDomainResponse extends ApiResponse {
  data?: CustomDomain;
}

export interface CustomDomainListResponse extends ApiResponse {
  data?: CustomDomain[];
  total?: number;
}

export interface BrandingTemplateResponse extends ApiResponse {
  data?: BrandingTemplate;
}

export interface BrandingTemplateListResponse extends ApiResponse {
  data?: BrandingTemplate[];
  total?: number;
}

// ==================== LOGS API TYPES ====================

export type LogLevel = "info" | "success" | "warning" | "error";
export type LogEvent = "login" | "signup" | "logout" | "mfa" | "password_reset" | "api_call";

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  event: LogEvent;
  user: string;
  email: string;
  ip: string;
  userAgent?: string;
  connection: string;
  details: string;
  metadata?: Record<string, string>;
}

export interface LogsResponse {
  success: boolean;
  data?: LogEntry[];
  total?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
  error?: string;
}

export interface LogStats {
  total: number;
  success: number;
  errors: number;
  warnings: number;
}

export interface LogsStatsResponse {
  success: boolean;
  data?: LogStats;
  error?: string;
}

// ==================== ACTION LOGS API TYPES ====================

export type ActionStatus = "success" | "failed" | "running" | "timeout";
export type ActionTrigger =
  | "login"
  | "pre-user-registration"
  | "post-user-registration"
  | "pre-login"
  | "post-login"
  | "password-change"
  | "token-exchange"
  | "custom-actor";

export interface ActionLogEntry {
  id: string;
  timestamp: string;
  status: ActionStatus;
  trigger: ActionTrigger;
  actionName: string;
  actionId: string;
  user: string;
  email: string;
  ip: string;
  duration: number;
  result?: string;
  error?: string;
  version: string;
}

export interface ActionLogsResponse {
  success: boolean;
  data?: ActionLogEntry[];
  total?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
  error?: string;
}

export interface ActionLogStats {
  total: number;
  success: number;
  failed: number;
  running: number;
  avgDuration: number;
  successRate: number;
}

export interface ActionLogsStatsResponse {
  success: boolean;
  data?: ActionLogStats;
  error?: string;
}

// ==================== MONITORING API TYPES ====================

export interface MonitoringStatus {
  status: string;
  uptime: number;
  lastCheck: string;
  version: string;
}

export interface MonitoringHealth {
  status: "healthy" | "degraded" | "unhealthy";
  checks: {
    database: boolean;
    cache: boolean;
    queue: boolean;
    external: boolean;
  };
}

export interface MonitoringStatusResponse {
  success: boolean;
  data?: MonitoringStatus;
  error?: string;
}

export interface MonitoringHealthResponse {
  success: boolean;
  data?: MonitoringHealth;
  error?: string;
}

// ==================== MARKETPLACE TYPES ====================

export interface MarketplaceExtension {
  id: string;
  name: string;
  description: string;
  category: string;
  author: string;
  rating: number;
  downloads: number;
  icon: string;
  featured: boolean;
  version?: string;
  status?: "active" | "needs-update" | "not-installed";
}

export interface MarketplaceExtensionResponse {
  success: boolean;
  data?: MarketplaceExtension;
  error?: string;
}

export interface MarketplaceExtensionListResponse {
  success: boolean;
  data?: MarketplaceExtension[];
  total?: number;
  error?: string;
}

export interface InstalledExtension {
  name: string;
  version: string;
  status: "active" | "needs-update";
}

export interface InstallExtensionResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// ==================== ACTIVITY TYPES ====================

export interface ActivityData {
  date: string;
  users?: number;
  signups?: number;
  retention?: number;
  failed?: number;
}

export interface ActivityResponse {
  success: boolean;
  data?: ActivityData[];
  error?: string;
}

export interface StatsData {
  totalUsers?: number;
  applications?: number;
  apis?: number;
  connections?: number;
  sessions?: number;
}

export interface StatsResponse {
  success: boolean;
  data?: StatsData;
  error?: string;
}

// ==================== EVENTS TYPES ====================

export interface EventLog {
  id: string;
  type: string;
  description: string;
  user: string;
  connection: string;
  timestamp: string;
  ip: string;
  userAgent: string;
  status: "success" | "failed" | "warning";
}

export interface EventLogResponse {
  success: boolean;
  data?: EventLog[];
  total?: number;
  error?: string;
}

export interface EventStats {
  totalEvents: number;
  logins: number;
  signups: number;
  failures: number;
  mfaChallenges: number;
}

export interface EventStatsResponse {
  success: boolean;
  data?: EventStats;
  error?: string;
}

export interface TrendingExtension {
  name: string;
  downloads: number;
  trend: string;
}

// ==================== ACTIONS & EXTENSIONS TYPES ====================

export interface Action {
  id: string;
  name: string;
  description: string;
  status: "active" | "disabled";
  version: string;
  lastModified: string;
  triggers: string[];
  runs: number;
  errors: number;
  code?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ActionTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  triggers: string[];
  popularity: "popular" | "common" | "advanced";
}

export interface DashboardActionLogEntry {
  id: string;
  actionName: string;
  status: "success" | "error";
  timestamp: string;
  duration: string;
  user?: string;
}

export interface ActionTriggerDef {
  id: string;
  name: string;
  description: string;
  category: string;
  status: "enabled" | "disabled";
  actionsCount: number;
  eventType: string;
}

export interface ActionTriggerMapping {
  trigger: string;
  actions: string[];
  enabled: boolean;
}

export interface TriggerEvent {
  trigger: string;
  action: string;
  status: "success" | "error";
  timestamp: string;
  duration: string;
  user: string;
}

export interface ActionForm {
  id: string;
  name: string;
  description: string;
  status: "active" | "disabled";
  version: string;
  lastModified: string;
  action: string;
  submissions: number;
  errors: number;
  fields?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Extension {
  id: string;
  name: string;
  description: string;
  version: string;
  status: "active" | "inactive";
  lastUpdated: string;
  author: string;
  category?: string;
  downloads?: number;
  rating?: number;
  config?: Record<string, unknown>;
}

export interface ActionsListResponse {
  success: boolean;
  data?: Action[];
  total?: number;
  error?: string;
}

export interface ActionResponse {
  success: boolean;
  data?: Action;
  error?: string;
}

export interface ActionTemplatesResponse {
  success: boolean;
  data?: ActionTemplate[];
  error?: string;
}

export interface TriggersResponse {
  success: boolean;
  data?: ActionTriggerDef[];
  total?: number;
  error?: string;
}

export interface TriggerMappingsResponse {
  success: boolean;
  data?: ActionTriggerMapping[];
  error?: string;
}

export interface TriggerEventsResponse {
  success: boolean;
  data?: TriggerEvent[];
  total?: number;
  error?: string;
}

export interface FormsListResponse {
  success: boolean;
  data?: ActionForm[];
  total?: number;
  error?: string;
}

export interface FormResponse {
  success: boolean;
  data?: ActionForm;
  error?: string;
}

export interface FormTemplatesResponse {
  success: boolean;
  data?: ActionTemplate[];
  error?: string;
}

export interface ExtensionsListResponse {
  success: boolean;
  data?: Extension[];
  total?: number;
  error?: string;
}

export interface ExtensionResponse {
  success: boolean;
  data?: Extension;
  error?: string;
}

export interface AvailableExtensionsResponse {
  success: boolean;
  data?: Extension[];
  total?: number;
  error?: string;
}

// ==================== AGENTS TYPES ====================

export type AgentStatus = "active" | "inactive" | "pending" | "error" | "starting" | "stopping";

export interface Agent {
  id: string;
  name: string;
  description?: string;
  type: string;
  status: AgentStatus;
  version?: string;
  config?: Record<string, unknown>;
  lastActivity?: string;
  requestCount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface AgentStatusInfo {
  status: AgentStatus;
  uptime?: string;
  memory?: number;
  cpu?: number;
  lastError?: string;
}

export interface AgentListResponse {
  success: boolean;
  data?: Agent[];
  total?: number;
  error?: string;
}

export interface AgentResponse {
  success: boolean;
  data?: Agent;
  error?: string;
}

export interface AgentStatusResponse {
  success: boolean;
  data?: AgentStatusInfo;
  error?: string;
}

export interface CreateAgentRequest {
  name: string;
  description?: string;
  type: string;
  config?: Record<string, unknown>;
}

export interface UpdateAgentRequest {
  name?: string;
  description?: string;
  config?: Record<string, unknown>;
}
