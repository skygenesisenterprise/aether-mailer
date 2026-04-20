export type { TokenResponse, AuthResponse } from "./types";
export { authApi } from "./auth";
export * from "./client";

export const registerApi = {
  register: async (email: string, username: string, password: string) => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/api/v1/auth/register`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password }),
      }
    );
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Registration failed");
    }
    return data;
  },
};

export const forgotApi = {
  requestReset: async (email: string) => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/api/v1/auth/reset-password`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      }
    );
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Request failed");
    }
    return data;
  },
};

export {
  articlesApi,
  categoriesApi,
  commentsApi,
  bookmarksApi,
  historyApi,
  notificationsApi,
  subscriptionApi,
  mediaApi,
  settingsApi,
  adminUsersApi,
  usersApi,
  applicationsApi,
  organizationsApi,
} from "./client";
