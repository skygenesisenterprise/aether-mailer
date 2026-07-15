export const platformQueryKeys = {
  me: ["me"] as const,
  workspaces: ["workspaces"] as const,
  workspace: (workspaceId: string) => ["workspace", workspaceId] as const,
  workspaceMembers: (workspaceId: string) => ["workspace-members", workspaceId] as const,
  teams: (workspaceId: string) => ["teams", workspaceId] as const,
  channels: (workspaceId: string) => ["channels", workspaceId] as const,
  conversations: (workspaceId: string) => ["conversations", workspaceId] as const,
  messages: (conversationId: string) => ["messages", conversationId] as const,
  meetings: (workspaceId: string) => ["meetings", workspaceId] as const,
  notifications: ["notifications"] as const,
  notificationUnreadCount: ["notification-unread-count"] as const,
};
