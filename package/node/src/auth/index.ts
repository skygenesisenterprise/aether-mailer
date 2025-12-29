import {
  ApiResponse,
  AuthToken,
  JwtPayload,
  ApiKeyInfo,
  CreateApiKeyRequest,
  ApiKeyUsageStats,
  API_ENDPOINTS,
} from "../types/index.js";
import { HttpClient } from "../client/index.js";
import {
  ValidationError,
  AuthenticationError,
  MissingFieldError,
  ValidationUtils,
} from "../errors/index.js";
import { SignJWT, jwtVerify, importPKCS8, importSPKI } from "jose";

export class AuthService {
  private cachedJwt?: string | undefined;
  private jwtExpiry?: number | undefined;

  constructor(private client: HttpClient) {}

  // Generate JWT token (for internal use or testing)
  public async generateToken(
    payload: {
      sub: string;
      email: string;
      role?: string;
      permissions?: string[];
      expiresIn?: string;
    },
    privateKey: string,
  ): Promise<ApiResponse<{ token: string }>> {
    if (!payload || typeof payload !== "object") {
      throw new ValidationError("Payload is required");
    }

    if (!payload.sub || typeof payload.sub !== "string") {
      throw new MissingFieldError("sub (subject)");
    }

    if (!payload.email || typeof payload.email !== "string") {
      throw new MissingFieldError("email");
    }

    const emailValidation = ValidationUtils.validateStringLength(
      payload.email,
      "Email",
      1,
      255,
    );
    if (!emailValidation.isValid) {
      throw new ValidationError(
        `Invalid email: ${emailValidation.errors.join(", ")}`,
      );
    }

    if (!privateKey || typeof privateKey !== "string") {
      throw new MissingFieldError("Private key");
    }

    try {
      // Import the private key
      const key = await importPKCS8(privateKey, "RS256");

      // Create the JWT
      const jwt = await new SignJWT({
        email: payload.email,
        role: payload.role || "USER",
        permissions: payload.permissions || [],
      })
        .setProtectedHeader({ alg: "RS256", typ: "JWT" })
        .setSubject(payload.sub)
        .setIssuedAt()
        .setExpirationTime(payload.expiresIn || "24h")
        .sign(key);

      return {
        success: true,
        data: { token: jwt },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new AuthenticationError(
        `Failed to generate token: ${errorMessage}`,
      );
    }
  }

  // Verify JWT token
  public async verifyToken(
    token: string,
    publicKey: string,
  ): Promise<ApiResponse<JwtPayload>> {
    if (!token || typeof token !== "string") {
      throw new MissingFieldError("Token");
    }

    if (!publicKey || typeof publicKey !== "string") {
      throw new MissingFieldError("Public key");
    }

    const jwtValidation = ValidationUtils.validateJwt(token);
    if (!jwtValidation.isValid) {
      throw new ValidationError(
        `Invalid JWT: ${jwtValidation.errors.join(", ")}`,
      );
    }

    try {
      // Import the public key
      const key = await importSPKI(publicKey, "RS256");

      // Verify the token
      const { payload } = await jwtVerify(token, key);

      return {
        success: true,
        data: {
          sub: payload.sub as string,
          email: payload.email as string,
          role: payload.role as string,
          permissions: payload.permissions as string[],
          iat: payload.iat as number,
          exp: payload.exp as number,
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new AuthenticationError(
        `Token verification failed: ${errorMessage}`,
      );
    }
  }

  // Login with email and password (user authentication)
  public async login(
    email: string,
    password: string,
  ): Promise<ApiResponse<AuthToken>> {
    if (!email || typeof email !== "string") {
      throw new MissingFieldError("email");
    }

    if (!password || typeof password !== "string") {
      throw new MissingFieldError("password");
    }

    const emailValidation = ValidationUtils.validateStringLength(
      email,
      "Email",
      1,
      255,
    );
    if (!emailValidation.isValid) {
      throw new ValidationError(
        `Invalid email: ${emailValidation.errors.join(", ")}`,
      );
    }

    const passwordValidation = ValidationUtils.validateStringLength(
      password,
      "Password",
      8,
      128,
    );
    if (!passwordValidation.isValid) {
      throw new ValidationError(
        `Invalid password: ${passwordValidation.errors.join(", ")}`,
      );
    }

    try {
      const response = await this.client.post(API_ENDPOINTS.AUTH_LOGIN, {
        email: email.trim().toLowerCase(),
        password,
      });

      // Cache the JWT if login successful
      if (response.data?.accessToken) {
        this.cachedJwt = response.data.accessToken;
        if (response.data.expiresIn) {
          this.jwtExpiry = Date.now() + response.data.expiresIn * 1000;
        }
        this.client.setJwt(response.data.accessToken);
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  // Refresh JWT token
  public async refreshToken(
    refreshToken?: string,
  ): Promise<ApiResponse<AuthToken>> {
    try {
      const payload = refreshToken ? { refreshToken } : {};

      const response = await this.client.post(
        API_ENDPOINTS.AUTH_REFRESH,
        payload,
      );

      // Update cached JWT
      if (response.data?.accessToken) {
        this.cachedJwt = response.data.accessToken;
        if (response.data.expiresIn) {
          this.jwtExpiry = Date.now() + response.data.expiresIn * 1000;
        }
        this.client.setJwt(response.data.accessToken);
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  // Logout (invalidate tokens)
  public async logout(): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await this.client.post(API_ENDPOINTS.AUTH_LOGOUT);

      // Clear cached JWT
      delete this.cachedJwt;
      delete this.jwtExpiry;
      this.client.clearAuth();

      return response;
    } catch (error) {
      // Clear auth anyway
      delete this.cachedJwt;
      delete this.jwtExpiry;
      this.client.clearAuth();
      throw error;
    }
  }

  // Create API key
  public async createApiKey(
    request: CreateApiKeyRequest,
  ): Promise<ApiResponse<ApiKeyInfo>> {
    this.validateCreateApiKeyRequest(request);

    try {
      const response = await this.client.post(API_ENDPOINTS.API_KEYS, request);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // List API keys
  public async listApiKeys(): Promise<ApiResponse<{ apiKeys: ApiKeyInfo[] }>> {
    try {
      const response = await this.client.get(API_ENDPOINTS.API_KEYS);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get API key by ID
  public async getApiKey(id: string): Promise<ApiResponse<ApiKeyInfo>> {
    if (!id || typeof id !== "string") {
      throw new MissingFieldError("API Key ID is required");
    }

    const url = API_ENDPOINTS.API_KEY.replace(":id", id);

    try {
      const response = await this.client.get(url);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Revoke API key
  public async revokeApiKey(
    id: string,
  ): Promise<ApiResponse<{ message: string }>> {
    if (!id || typeof id !== "string") {
      throw new MissingFieldError("API Key ID is required");
    }

    const url = API_ENDPOINTS.API_KEY.replace(":id", id);

    try {
      const response = await this.client.delete(url);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Update API key
  public async updateApiKey(
    id: string,
    request: {
      name?: string;
      permissions?: string[];
    },
  ): Promise<ApiResponse<{ message: string }>> {
    if (!id || typeof id !== "string") {
      throw new MissingFieldError("API Key ID is required");
    }

    this.validateUpdateApiKeyRequest(request);

    const url = API_ENDPOINTS.API_KEY.replace(":id", id);

    try {
      const response = await this.client.put(url, request);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get API key usage statistics
  public async getApiKeyUsageStats(
    id: string,
    params?: {
      startDate?: string;
      endDate?: string;
    },
  ): Promise<ApiResponse<ApiKeyUsageStats>> {
    if (!id || typeof id !== "string") {
      throw new MissingFieldError("API Key ID is required");
    }

    const url = API_ENDPOINTS.API_KEY_STATS.replace(":id", id);
    const queryParams = new URLSearchParams();

    if (params?.startDate) queryParams.append("startDate", params.startDate);
    if (params?.endDate) queryParams.append("endDate", params.endDate);

    const finalUrl = queryParams.toString()
      ? `${url}?${queryParams.toString()}`
      : url;

    try {
      const response = await this.client.get(finalUrl);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get system key info (system only)
  public async getSystemKeyInfo(): Promise<
    ApiResponse<{ systemKey: ApiKeyInfo }>
  > {
    try {
      const response = await this.client.get(API_ENDPOINTS.API_KEY_SYSTEM);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Cleanup expired API keys (system only)
  public async cleanupExpiredKeys(): Promise<
    ApiResponse<{ message: string; deletedCount: number }>
  > {
    try {
      const response = await this.client.post(API_ENDPOINTS.API_KEY_CLEANUP);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Validate API key (debug endpoint)
  public async validateApiKey(
    apiKey: string,
  ): Promise<
    ApiResponse<{ valid: boolean; key?: ApiKeyInfo; error?: string }>
  > {
    if (!apiKey || typeof apiKey !== "string") {
      throw new MissingFieldError("API Key is required");
    }

    const keyValidation = ValidationUtils.validateApiKey(apiKey);
    if (!keyValidation.isValid) {
      throw new ValidationError(
        `Invalid API key: ${keyValidation.errors.join(", ")}`,
      );
    }

    try {
      const response = await this.client.post(API_ENDPOINTS.API_KEY_VALIDATE, {
        apiKey,
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Parse JWT without verification (for debugging)
  public parseJwt(token: string): JwtPayload | null {
    if (!token || typeof token !== "string") {
      return null;
    }

    const jwtValidation = ValidationUtils.validateJwt(token);
    if (!jwtValidation.isValid) {
      return null;
    }

    try {
      const parts = token.split(".");
      const payload = JSON.parse(atob(parts[1]));

      return {
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
        permissions: payload.permissions || [],
        iat: payload.iat,
        exp: payload.exp,
      };
    } catch {
      return null;
    }
  }

  // Check if cached JWT is expired
  public isJwtExpired(): boolean {
    if (!this.cachedJwt || !this.jwtExpiry) {
      return true;
    }

    // Add 5 minutes buffer
    return Date.now() >= this.jwtExpiry - 300000;
  }

  // Get cached JWT
  public getCachedJwt(): string | undefined {
    if (this.isJwtExpired()) {
      delete this.cachedJwt;
      delete this.jwtExpiry;
    }
    return this.cachedJwt;
  }

  // Extract key environment from API key
  public getApiKeyEnvironment(
    apiKey: string,
  ): "live" | "test" | "system" | null {
    if (!apiKey || typeof apiKey !== "string") {
      return null;
    }

    const keyValidation = ValidationUtils.validateApiKey(apiKey);
    if (!keyValidation.isValid) {
      return null;
    }

    const parts = apiKey.split("_");
    if (parts.length < 3) {
      return null;
    }

    const env = parts[1];
    if (["live", "test", "sys"].includes(env)) {
      return env as "live" | "test" | "system";
    }

    return null;
  }

  // Mask API key for display
  public maskApiKey(apiKey: string): string {
    if (!apiKey || typeof apiKey !== "string") {
      return "Invalid key";
    }

    const keyValidation = ValidationUtils.validateApiKey(apiKey);
    if (!keyValidation.isValid) {
      return "Invalid key";
    }

    const parts = apiKey.split("_");
    if (parts.length < 3) {
      return "Invalid key";
    }

    const env = parts[1];
    const key = parts[2];

    if (key.length < 8) {
      return `sk_${env}_****`;
    }

    return `sk_${env}_${key.substring(0, 4)}****${key.substring(key.length - 4)}`;
  }

  // Private validation methods
  private validateCreateApiKeyRequest(request: CreateApiKeyRequest): void {
    if (!request) {
      throw new ValidationError("API key request is required");
    }

    if (!request.name || typeof request.name !== "string") {
      throw new MissingFieldError("name");
    }

    const nameValidation = ValidationUtils.validateStringLength(
      request.name,
      "Name",
      1,
      255,
    );
    if (!nameValidation.isValid) {
      throw new ValidationError(
        `Invalid name: ${nameValidation.errors.join(", ")}`,
      );
    }

    if (
      !request.permissions ||
      !Array.isArray(request.permissions) ||
      request.permissions.length === 0
    ) {
      throw new ValidationError(
        "Permissions array is required and must not be empty",
      );
    }

    for (const permission of request.permissions) {
      if (typeof permission !== "string" || permission.trim() === "") {
        throw new ValidationError("All permissions must be non-empty strings");
      }
    }

    if (request.expiresAt) {
      const expiryDate = new Date(request.expiresAt);
      if (isNaN(expiryDate.getTime())) {
        throw new ValidationError("Invalid expiresAt date format");
      }

      if (expiryDate <= new Date()) {
        throw new ValidationError("expiresAt must be in the future");
      }
    }
  }

  private validateUpdateApiKeyRequest(request: any): void {
    if (!request) {
      throw new ValidationError("Update request is required");
    }

    if (request.name !== undefined) {
      if (typeof request.name !== "string") {
        throw new ValidationError("Name must be a string");
      }

      const nameValidation = ValidationUtils.validateStringLength(
        request.name,
        "Name",
        1,
        255,
      );
      if (!nameValidation.isValid) {
        throw new ValidationError(
          `Invalid name: ${nameValidation.errors.join(", ")}`,
        );
      }
    }

    if (request.permissions !== undefined) {
      if (!Array.isArray(request.permissions)) {
        throw new ValidationError("Permissions must be an array");
      }

      if (request.permissions.length === 0) {
        throw new ValidationError("Permissions array must not be empty");
      }

      for (const permission of request.permissions) {
        if (typeof permission !== "string" || permission.trim() === "") {
          throw new ValidationError(
            "All permissions must be non-empty strings",
          );
        }
      }
    }
  }
}
