import { apiRequest } from "@/lib/api/client";
import type { ApiSuccessEnvelope } from "@/lib/api/types";

export interface OAuthAccountDTO {
  provider: string;
  providerAccountId: string;
  scopes: string | null;
  createdAt: string;
}

interface OAuthLoginResponse {
  url: string;
}

interface OAuthCallbackResponse {
  authResult?: {
    user: {
      id: string;
      email: string;
      displayName: string;
      avatarUrl: string | null;
    };
    accessToken: string;
    refreshToken?: string;
    sessionId: string;
  };
  linked?: boolean;
}

export function getOAuthLoginUrl(
  provider: "google" | "github",
  action: "login" | "link" = "login"
): Promise<OAuthLoginResponse> {
  return apiRequest<OAuthLoginResponse>(
    `/auth/oauth/${provider}?action=${action}`,
    { skipAuth: action === "login" }
  );
}

export function handleOAuthCallback(
  provider: "google" | "github",
  code: string,
  state: string
): Promise<OAuthCallbackResponse> {
  return apiRequest<OAuthCallbackResponse>(
    `/auth/oauth/${provider}/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`,
    { skipAuth: true }
  );
}

export function listOAuthAccounts(): Promise<{ accounts: OAuthAccountDTO[] }> {
  return apiRequest<{ accounts: OAuthAccountDTO[] }>("/auth/oauth/accounts");
}

export function unlinkOAuthAccount(provider: "google" | "github"): Promise<{ unlinked: boolean }> {
  return apiRequest<{ unlinked: boolean }>(`/auth/oauth/${provider}`, { method: "DELETE" });
}
