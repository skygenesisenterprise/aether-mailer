import type { AuthResponse, TokenResponse } from "./types";
export type { TokenResponse } from "./types";

function getApiBaseUrl(): string {
  // Always use relative path to go through Next.js proxy to avoid CORS issues
  // The proxy forwards /api/* to the Go backend
  return "";
}

class AuthApiService {
  private baseURL: string;

  constructor(baseURL: string = getApiBaseUrl()) {
    this.baseURL = baseURL;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // Always use relative path
    const url = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

    console.log("[AuthApi] request:", url, options.method || "GET");

    const config: RequestInit = {
      ...options,
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    };

    console.log("[Auth API] Request:", { url, method: options.method, body: options.body });

    const response = await fetch(url, config);

    const contentType = response.headers.get("content-type");
    let data;
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.log("[Auth API] Non-JSON response:", text);
      throw new Error(text || `Request failed with status ${response.status}`);
    }

    console.log("[Auth API] Response:", { status: response.status, data });

    if (!response.ok) {
      throw new Error(data.error || `Request failed with status ${response.status}`);
    }

    return data;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async logout(): Promise<AuthResponse> {
    const token = this.getStoredToken();
    return this.request<AuthResponse>("/api/v1/auth/logout", {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    return this.request<AuthResponse>("/api/v1/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
  }

  async getAccount(): Promise<AuthResponse> {
    const token = this.getStoredToken();
    return this.request<AuthResponse>("/api/v1/account/me", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<AuthResponse> {
    const token = this.getStoredToken();
    return this.request<AuthResponse>("/api/v1/auth/change-password", {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  async register(email: string, password: string, name: string): Promise<AuthResponse> {
    return this.request<AuthResponse>("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    });
  }

  async verifyEmail(token: string): Promise<AuthResponse> {
    return this.request<AuthResponse>("/api/v1/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
  }

  async requestPasswordReset(email: string): Promise<AuthResponse> {
    return this.request<AuthResponse>("/api/v1/auth/request-password-reset", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  async confirmPasswordReset(token: string, newPassword: string): Promise<AuthResponse> {
    return this.request<AuthResponse>("/api/v1/auth/confirm-password-reset", {
      method: "POST",
      body: JSON.stringify({ token, newPassword }),
    });
  }

  async resetPassword(email: string): Promise<AuthResponse> {
    return this.request<AuthResponse>("/api/v1/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  private getStoredToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("accessToken");
  }

  storeTokens(accessToken: string, refreshToken: string): void {
    if (typeof window === "undefined") return;
    console.log(
      "[AuthAPI] storeTokens called with accessToken length:",
      accessToken?.length,
      "refreshToken:",
      refreshToken ? "exists" : "null"
    );

    if (
      accessToken &&
      accessToken !== "undefined" &&
      accessToken !== "null" &&
      accessToken.length > 0
    ) {
      console.log("[AuthAPI] Storing tokens in localStorage, token length:", accessToken.length);
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken || "");
      const stored = localStorage.getItem("accessToken");
      console.log("[AuthAPI] Tokens stored successfully, verified:", stored?.substring(0, 20));
    } else {
      console.error(
        "[AuthAPI] Invalid token value, not storing:",
        accessToken,
        "length:",
        accessToken?.length
      );
    }
  }

  clearTokens(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }

  getStoredUser(): TokenResponse["user"] | null {
    if (typeof window === "undefined") return null;
    const userStr = localStorage.getItem("user");
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  storeUser(user: TokenResponse["user"]): void {
    if (typeof window === "undefined") return;
    localStorage.setItem("user", JSON.stringify(user));
  }

  clearUser(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem("user");
  }
}

export const authApi = new AuthApiService();
