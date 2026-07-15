import { apiListRequest, apiRequest } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import {
  configureAccessTokenProvider,
  getAccessTokenProvider,
  type AccessTokenProvider,
} from "@/lib/api/token-provider";
import type { AuthSessionInfo, TokenResponse, User } from "@/lib/api/types";

export { configureAccessTokenProvider, getAccessTokenProvider };
export type { AccessTokenProvider };

const ACCESS_TOKEN_KEY = "aether.account.accessToken";
const REFRESH_TOKEN_KEY = "aether.account.refreshToken";
const USER_KEY = "aether.account.user";
let storageMigrated = false;
let nativeStorageHydrated = false;
let nativeStorageHydrationPromise: Promise<void> | null = null;

interface SecureStoreModule {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
  deleteItemAsync(key: string): Promise<void>;
}

function isNativeExpoRuntime(): boolean {
  return Boolean(process.env.EXPO_OS && process.env.EXPO_OS !== "web");
}

async function getSecureStore(): Promise<SecureStoreModule | null> {
  if (!isNativeExpoRuntime()) {
    return null;
  }

  try {
    const loadModule = new Function("moduleName", "return import(moduleName)") as (
      moduleName: string
    ) => Promise<SecureStoreModule>;
    return await loadModule("expo-secure-store");
  } catch {
    return null;
  }
}

function getBrowserStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function getLegacySessionStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function migrateAuthStorage(): void {
  if (storageMigrated) return;
  storageMigrated = true;

  const browserStorage = getBrowserStorage();
  const sessionStorage = getLegacySessionStorage();
  if (!browserStorage) return;

  for (const key of [ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY]) {
    const browserValue = browserStorage.getItem(key);
    if (browserValue !== null) continue;

    const sessionValue = sessionStorage?.getItem(key);
    if (sessionValue === null || sessionValue === undefined) continue;

    browserStorage.setItem(key, sessionValue);
    sessionStorage?.removeItem(key);
  }
}

function readStorageToken(): string | null {
  migrateAuthStorage();
  try {
    const raw = getBrowserStorage()?.getItem(ACCESS_TOKEN_KEY);
    return raw ?? null;
  } catch {
    return null;
  }
}

function writeStorageToken(token: string | null): void {
  migrateAuthStorage();
  try {
    const storage = getBrowserStorage();
    if (!storage) return;
    if (token) {
      storage.setItem(ACCESS_TOKEN_KEY, token);
    } else {
      storage.removeItem(ACCESS_TOKEN_KEY);
    }
  } catch { /* quota exceeded */ }
}

function readStorageRefreshToken(): string | null {
  migrateAuthStorage();
  try {
    const raw = getBrowserStorage()?.getItem(REFRESH_TOKEN_KEY);
    return raw ?? null;
  } catch {
    return null;
  }
}

function writeStorageRefreshToken(token: string | null): void {
  migrateAuthStorage();
  try {
    const storage = getBrowserStorage();
    if (!storage) return;
    if (token) {
      storage.setItem(REFRESH_TOKEN_KEY, token);
    } else {
      storage.removeItem(REFRESH_TOKEN_KEY);
    }
  } catch { /* quota exceeded */ }
}

function readStorageUser(): User | null {
  migrateAuthStorage();
  try {
    const raw = getBrowserStorage()?.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function writeStorageUser(user: User | null): void {
  migrateAuthStorage();
  try {
    const storage = getBrowserStorage();
    if (!storage) return;
    if (user) {
      storage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      storage.removeItem(USER_KEY);
    }
  } catch { /* quota exceeded */ }
}

let accessToken: string | null = null;
let refreshToken: string | null = null;
let currentUser: User | null = null;
let refreshPromise: Promise<string | null> | null = null;
const authStateListeners = new Set<() => void>();

const memoryTokenProvider: AccessTokenProvider = {
  async getAccessToken() {
    return getStoredAccessToken();
  },
  async refreshAccessToken() {
    return refreshAccessToken();
  },
};

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  displayName: string;
  email: string;
  password: string;
  workspaceName?: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface VerifyEmailPayload {
  token: string;
}

export interface ResendVerificationPayload {
  email: string;
}

configureAccessTokenProvider(memoryTokenProvider);

export function getStoredAccessToken(): string | null {
  return accessToken ?? readStorageToken();
}

export function clearStoredTokens(): void {
  accessToken = null;
  refreshToken = null;
  currentUser = null;
  nativeStorageHydrated = true;
  nativeStorageHydrationPromise = null;
  writeStorageToken(null);
  writeStorageRefreshToken(null);
  writeStorageUser(null);
  void clearPersistedNativeAuthState();
  try {
    getLegacySessionStorage()?.removeItem(ACCESS_TOKEN_KEY);
    getLegacySessionStorage()?.removeItem(REFRESH_TOKEN_KEY);
    getLegacySessionStorage()?.removeItem(USER_KEY);
  } catch {
    // ignore legacy cleanup failures
  }
  notifyAuthStateListeners();
}

export function setStoredAccessToken(nextToken: string | null): void {
  accessToken = nextToken;
  writeStorageToken(nextToken);
  void writeNativeAccessToken(nextToken);
  notifyAuthStateListeners();
}

export function getStoredUser(): User | null {
  return currentUser ?? readStorageUser();
}

export function storeUser(user: User | null): void {
  currentUser = user;
  writeStorageUser(user);
  void writeNativeUser(user);
  notifyAuthStateListeners();
}

function notifyAuthStateListeners(): void {
  for (const listener of authStateListeners) {
    try {
      listener();
    } catch {
      // Ignore listener failures to avoid breaking auth flows.
    }
  }
}

export function subscribeToAuthState(listener: () => void): () => void {
  authStateListeners.add(listener);

  return () => {
    authStateListeners.delete(listener);
  };
}

export async function refreshAccessToken(timeoutMs?: number): Promise<string | null> {
  await hydrateNativeAuthState();

  if (!refreshPromise) {
    refreshPromise = doRefresh(timeoutMs).finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function isNetworkError(error: unknown): Promise<boolean> {
  if (error instanceof ApiError) return error.kind === "network_error";
  if (error instanceof TypeError) return true;
  if (error instanceof Error && error.name === "AbortError") return true;
  return false;
}

async function doRefresh(timeoutMs?: number): Promise<string | null> {
  const storedRefreshToken = refreshToken ?? readStorageRefreshToken();
  if (storedRefreshToken) {
    try {
      const response = await apiRequest<TokenResponse>("/auth/refresh", {
        method: "POST",
        skipAuth: true,
        skipRefresh: true,
        body: { refreshToken: storedRefreshToken },
        timeoutMs,
      });
      await applyRefreshResult(response);
      return response.accessToken;
    } catch (error) {
      refreshToken = null;
      writeStorageRefreshToken(null);
      void writeNativeRefreshToken(null);
      if (await isNetworkError(error)) {
        return null;
      }
    }
  }
  try {
    const response = await apiRequest<TokenResponse>("/auth/refresh", {
      method: "POST",
      skipAuth: true,
      skipRefresh: true,
      timeoutMs,
    });
    await applyRefreshResult(response);
    return response.accessToken;
  } catch {
    return null;
  }
}

async function applyRefreshResult(response: TokenResponse): Promise<void> {
  accessToken = response.accessToken;
  currentUser = response.user;
  if (response.refreshToken) {
    refreshToken = response.refreshToken;
  }
  writeStorageToken(response.accessToken);
  writeStorageUser(response.user);
  if (response.refreshToken) {
    writeStorageRefreshToken(response.refreshToken);
  }
  await persistNativeAuthState();
  notifyAuthStateListeners();
}

async function hydrateNativeAuthState(): Promise<void> {
  if (nativeStorageHydrated || !isNativeExpoRuntime()) {
    return;
  }

  if (!nativeStorageHydrationPromise) {
    nativeStorageHydrationPromise = (async () => {
      const secureStore = await getSecureStore();
      if (!secureStore) {
        nativeStorageHydrated = true;
        return;
      }

      try {
        const [storedAccessToken, storedRefreshToken, storedUser] = await Promise.all([
          secureStore.getItemAsync(ACCESS_TOKEN_KEY),
          secureStore.getItemAsync(REFRESH_TOKEN_KEY),
          secureStore.getItemAsync(USER_KEY),
        ]);

        accessToken = storedAccessToken ?? accessToken;
        refreshToken = storedRefreshToken ?? refreshToken;
        currentUser = storedUser ? (JSON.parse(storedUser) as User) : currentUser;
      } catch {
        // Ignore native storage read failures and continue with in-memory state.
      } finally {
        nativeStorageHydrated = true;
      }
    })().finally(() => {
      nativeStorageHydrationPromise = null;
    });
  }

  await nativeStorageHydrationPromise;
}

async function persistNativeAuthState(): Promise<void> {
  try {
    const secureStore = await getSecureStore();
    if (!secureStore) {
      return;
    }

    await Promise.all([
      writeSecureStoreValue(secureStore, ACCESS_TOKEN_KEY, accessToken),
      writeSecureStoreValue(secureStore, REFRESH_TOKEN_KEY, refreshToken),
      writeSecureStoreValue(secureStore, USER_KEY, currentUser ? JSON.stringify(currentUser) : null),
    ]);
  } catch {
    // Ignore native persistence failures and keep the in-memory session alive.
  }
}

async function clearPersistedNativeAuthState(): Promise<void> {
  try {
    const secureStore = await getSecureStore();
    if (!secureStore) {
      return;
    }

    await Promise.all([
      secureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      secureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
      secureStore.deleteItemAsync(USER_KEY),
    ]);
  } catch {
    // Ignore native persistence cleanup failures.
  }
}

async function writeSecureStoreValue(
  secureStore: SecureStoreModule,
  key: string,
  value: string | null,
): Promise<void> {
  if (value === null) {
    await secureStore.deleteItemAsync(key);
    return;
  }

  await secureStore.setItemAsync(key, value);
}

async function writeNativeAccessToken(token: string | null): Promise<void> {
  try {
    const secureStore = await getSecureStore();
    if (!secureStore) {
      return;
    }

    await writeSecureStoreValue(secureStore, ACCESS_TOKEN_KEY, token);
  } catch {
    // Ignore native persistence failures.
  }
}

async function writeNativeRefreshToken(token: string | null): Promise<void> {
  try {
    const secureStore = await getSecureStore();
    if (!secureStore) {
      return;
    }

    await writeSecureStoreValue(secureStore, REFRESH_TOKEN_KEY, token);
  } catch {
    // Ignore native persistence failures.
  }
}

async function writeNativeUser(user: User | null): Promise<void> {
  try {
    const secureStore = await getSecureStore();
    if (!secureStore) {
      return;
    }

    await writeSecureStoreValue(secureStore, USER_KEY, user ? JSON.stringify(user) : null);
  } catch {
    // Ignore native persistence failures.
  }
}

export const authApi = {
  async bootstrap(): Promise<User | null> {
    await hydrateNativeAuthState();
    const nextToken = await refreshAccessToken(5_000);
    if (nextToken) {
      if (currentUser) {
        return currentUser;
      }
      const user = await apiRequest<User>("/auth/me");
      storeUser(user);
      return user;
    }
    clearStoredTokens();
    return null;
  },
  async login(payload: LoginPayload): Promise<TokenResponse> {
    const response = await apiRequest<TokenResponse, LoginPayload>("/auth/login", {
      method: "POST",
      body: payload,
      skipAuth: true,
      skipRefresh: true,
    });
    await applyRefreshResult(response);
    return response;
  },
  async register(payload: RegisterPayload): Promise<TokenResponse> {
    const response = await apiRequest<TokenResponse, RegisterPayload>("/auth/register", {
      method: "POST",
      body: payload,
      skipAuth: true,
      skipRefresh: true,
    });
    await applyRefreshResult(response);
    return response;
  },
  async logout(): Promise<void> {
    try {
      await apiRequest<{ loggedOut: boolean }>("/auth/logout", {
        method: "POST",
        skipRefresh: true,
      });
    } finally {
      clearStoredTokens();
    }
  },
  async logoutAll(exceptCurrent = false): Promise<void> {
    await apiRequest<{ loggedOut: boolean }, { exceptCurrent: boolean }>("/auth/logout-all", {
      method: "POST",
      body: { exceptCurrent },
    });
    if (!exceptCurrent) {
      clearStoredTokens();
    }
  },
  async getCurrentUser(): Promise<User> {
    const user = await apiRequest<User>("/auth/me");
    storeUser(user);
    return user;
  },
  async forgotPassword(payload: ForgotPasswordPayload): Promise<{ accepted: boolean }> {
    return apiRequest<{ accepted: boolean }, ForgotPasswordPayload>("/auth/forgot-password", {
      method: "POST",
      body: payload,
      skipAuth: true,
      skipRefresh: true,
    });
  },
  async resetPassword(payload: ResetPasswordPayload): Promise<{ accepted: boolean }> {
    return apiRequest<{ accepted: boolean }, ResetPasswordPayload>("/auth/reset-password", {
      method: "POST",
      body: payload,
      skipAuth: true,
      skipRefresh: true,
    });
  },
  async changePassword(payload: ChangePasswordPayload): Promise<{ updated: boolean }> {
    return apiRequest<{ updated: boolean }, ChangePasswordPayload>("/auth/change-password", {
      method: "POST",
      body: payload,
    });
  },
  async verifyEmail(payload: VerifyEmailPayload): Promise<{ accepted: boolean }> {
    return apiRequest<{ accepted: boolean }, VerifyEmailPayload>("/auth/verify-email", {
      method: "POST",
      body: payload,
      skipAuth: true,
      skipRefresh: true,
    });
  },
  async resendVerification(payload: ResendVerificationPayload): Promise<{ accepted: boolean }> {
    return apiRequest<{ accepted: boolean }, ResendVerificationPayload>("/auth/resend-verification", {
      method: "POST",
      body: payload,
      skipAuth: true,
      skipRefresh: true,
    });
  },
  async listSessions(): Promise<AuthSessionInfo[]> {
    const response = await apiListRequest<AuthSessionInfo>("/auth/sessions");
    return response.data;
  },
  async revokeSession(sessionId: string): Promise<void> {
    await apiRequest<{ deleted: boolean }>(`/auth/sessions/${sessionId}`, {
      method: "DELETE",
    });
  },
  getStoredToken: getStoredAccessToken,
  clearTokens: clearStoredTokens,
  setStoredAccessToken,
  getStoredUser,
  storeUser,
};

export type { TokenResponse };
