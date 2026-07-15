export interface ApiMeta {
  requestId?: string;
}

export interface PaginationMeta extends ApiMeta {
  nextCursor?: string;
  hasMore?: boolean;
}

export interface ApiSuccessEnvelope<T> {
  data: T;
  meta?: ApiMeta;
}

export interface ApiListEnvelope<T> {
  data: T[];
  meta?: PaginationMeta;
}

export interface ApiFailureEnvelope {
  error: {
    code?: string;
    message?: string;
    details?: unknown;
  };
  meta?: ApiMeta;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  displayName: string;
  avatarUrl?: string;
  status: string;
  presenceStatus?: string;
  workspaceId?: string;
  roles?: string[];
  permissions?: string[];
  createdAt: string;
  updatedAt: string;
  lastSeenAt?: string;
  disabledAt?: string;
  emailVerifiedAt?: string;
  passwordChangedAt?: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string;
  visibility: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}

export type WorkspaceSsoProvider = "oidc" | "saml";

export interface WorkspaceSsoConfig {
  id?: string;
  workspaceId: string;
  provider: WorkspaceSsoProvider;
  enabled: boolean;
  enforceSso: boolean;
  allowPasswordAuth: boolean;
  allowAutoProvision: boolean;
  allowIdpInitiated: boolean;
  domainHint?: string;
  issuerUrl?: string;
  ssoUrl?: string;
  entityId?: string;
  clientId?: string;
  clientSecretConfigured: boolean;
  certificate?: string;
  allowedDomains: string[];
  defaultRole: WorkspaceMemberRole;
  attributeMapping: Record<string, string>;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateWorkspaceSsoInput {
  provider: WorkspaceSsoProvider;
  enabled: boolean;
  enforceSso: boolean;
  allowPasswordAuth: boolean;
  allowAutoProvision: boolean;
  allowIdpInitiated: boolean;
  domainHint?: string;
  issuerUrl?: string;
  ssoUrl?: string;
  entityId?: string;
  clientId?: string;
  clientSecret?: string;
  clearClientSecret?: boolean;
  certificate?: string;
  allowedDomains: string[];
  defaultRole: WorkspaceMemberRole;
  attributeMapping: Record<string, string>;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: string;
  joinedAt: string;
  lastSeenAt?: string;
  createdAt: string;
  updatedAt: string;
  displayName?: string;
  email?: string;
  avatarUrl?: string;
  status?: string;
  presenceStatus?: string;
}

export type WorkspaceMemberRole = "owner" | "admin" | "member" | "guest";

export interface Team {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}

export interface Channel {
  id: string;
  workspaceId: string;
  teamId?: string;
  name: string;
  slug: string;
  description?: string;
  type: string;
  visibility: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}

export interface Conversation {
  id: string;
  workspaceId: string;
  channelId?: string;
  type: string;
  name?: string;
  memberIds?: string[];
  participants?: Array<{
    userId: string;
    displayName: string;
    email: string;
    role: string;
    status: string;
    presenceStatus: string;
  }>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}

export interface ConversationMember {
  id: string;
  conversationId: string;
  userId: string;
  role: string;
  joinedAt: string;
  lastReadMessageId?: string;
  lastReadAt?: string;
  mutedUntil?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  workspaceId: string;
  conversationId: string;
  authorId: string;
  parentMessageId?: string;
  type: string;
  content: string;
  metadata?: Record<string, unknown>;
  editedAt?: string;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MessageReaction {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  createdAt: string;
  updatedAt: string;
}

export interface Meeting {
  id: string;
  workspaceId: string;
  conversationId?: string;
  provider: string;
  providerRoomId?: string;
  title: string;
  status: string;
  createdBy: string;
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MeetingParticipant {
  id: string;
  meetingId: string;
  userId: string;
  role: string;
  status: string;
  metadata?: Record<string, unknown>;
  joinedAt?: string;
  leftAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MeetingSession {
  id: string;
  meetingId: string;
  workspaceId: string;
  provider: string;
  providerRoomName: string;
  providerRoomId?: string;
  nodeId: string;
  status: string;
  publicUrl: string;
  signalingUrl: string;
  connectionDetails?: Record<string, unknown>;
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MeetingJoinCredentials {
  meetingId: string;
  sessionId: string;
  roomName: string;
  participantIdentity: string;
  token: string;
  signalingUrl: string;
  expiresAt: string;
  iceServers?: RTCIceServer[];
}

export interface JoinTokenResponse {
  token: string;
  meetingId: string;
  sessionId: string;
  roomName: string;
  participantIdentity: string;
  signalingUrl: string;
  expiresAt: string;
  iceServers?: RTCIceServer[];
}

export interface TokenResponse {
  accessToken: string;
  refreshToken?: string;
  tokenType?: string;
  expiresIn?: number;
  user: User;
  sessionId?: string;
}

export interface AuthSessionInfo {
  id: string;
  userAgent?: string;
  ipAddress?: string;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
  current: boolean;
}

export interface Application {
  id: string;
  workspaceId: string;
  provider: string;
  name: string;
  status: string;
  configuration?: Record<string, unknown>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  workspaceId: string;
  actorId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  workspaceId: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  readAt?: string;
  idempotencyKey?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPreferences {
  directMessages: boolean;
  mentions: boolean;
  channelMessages: boolean;
  meetingReminders: boolean;
  incomingCalls: boolean;
  emailNotifications: boolean;
  sounds: boolean;
  desktopNotifications: boolean;
}

export interface UserPreferences {
  theme: "light" | "dark" | "system";
  language: string;
  locale: string;
  timezone: string;
  statusMessage?: string;
  density: "comfortable" | "compact";
  contrast: "default" | "high";
  soundEnabled: boolean;
  secureSession: boolean;
}

export interface ProvisionWorkspaceUserInput {
  email: string;
  displayName: string;
  role: WorkspaceMemberRole;
  temporaryPassword: string;
}

export interface CreateWorkspaceMemberInput {
  userId?: string;
  email?: string;
  role: WorkspaceMemberRole;
}

export interface UpdateWorkspaceMemberInput {
  role: WorkspaceMemberRole;
}

export interface Contact {
  id: string;
  workspaceId?: string;
  name: string;
  email?: string;
  phone?: string;
  [key: string]: unknown;
}

export interface ContactGroup {
  id: string;
  workspaceId?: string;
  name: string;
  description?: string;
  [key: string]: unknown;
}

export interface Task {
  id: string;
  workspaceId: string;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  project?: string;
  assigneeUserId?: string;
  assigneeName?: string;
  createdBy?: string;
  dueAt?: string;
  completedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface TaskComment {
  id: string;
  taskId?: string;
  content?: string;
  [key: string]: unknown;
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  summary?: string;
  status: string;
  progress?: number;
  cadence?: string;
  ownerUserId?: string;
  ownerName?: string;
  createdBy?: string;
  [key: string]: unknown;
}

export interface ProjectMember {
  id: string;
  projectId?: string;
  userId?: string;
  role?: string;
  [key: string]: unknown;
}

export interface FileRecord {
  id: string;
  workspaceId?: string;
  name?: string;
  contentType?: string;
  status?: string;
  sizeBytes?: number;
  storageKey?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface Document {
  id: string;
  workspaceId?: string;
  title?: string;
  [key: string]: unknown;
}

export interface Resource {
  id: string;
  workspaceId?: string;
  title?: string;
  [key: string]: unknown;
}

export interface CallHistoryItem {
  id: string;
  workspaceId?: string;
  [key: string]: unknown;
}

export interface Voicemail {
  id: string;
  callId?: string;
  [key: string]: unknown;
}

export interface RealtimeEvent<T = unknown> {
  id: string;
  type: string;
  workspaceId?: string;
  resourceId?: string;
  occurredAt: string;
  data: T;
}
