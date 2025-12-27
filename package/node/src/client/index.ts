import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from "axios";
import { MailerConfig, ApiResponse, ClientEvent } from "../types/index.js";
import {
  MailerError,
  AuthenticationError,
  RateLimitError,
  TimeoutError,
  createErrorFromResponse,
  isRateLimitError,
} from "../errors/index.js";

export interface RetryConfig {
  attempts: number;
  delay: number;
  backoffFactor: number;
  maxDelay: number;
}

export class HttpClient {
  private axios: AxiosInstance;
  private config: Required<Omit<MailerConfig, "apiKey" | "jwt">>;
  private eventListeners: Map<string, ((event: ClientEvent) => void)[]> =
    new Map();

  constructor(config: MailerConfig = {}) {
    this.config = {
      baseURL: config.baseURL || "http://localhost:8080",
      timeout: config.timeout || 30000,
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000,
      userAgent: config.userAgent || "@aether-mailer/node/1.0.0",
    };

    this.axios = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        "User-Agent": this.config.userAgent,
        "Content-Type": "application/json",
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor for authentication
    this.axios.interceptors.request.use(
      (config) => {
        const event: ClientEvent = {
          type: "request",
          data: {
            method: config.method?.toUpperCase(),
            url: config.url,
            headers: config.headers,
          },
          timestamp: new Date().toISOString(),
        };
        this.emitEvent("request", event);

        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );

    // Response interceptor for logging and error handling
    this.axios.interceptors.response.use(
      (response: AxiosResponse) => {
        const event: ClientEvent = {
          type: "response",
          data: {
            status: response.status,
            statusText: response.statusText,
            url: response.config.url,
            method: response.config.method?.toUpperCase(),
          },
          timestamp: new Date().toISOString(),
        };
        this.emitEvent("response", event);

        return response;
      },
      (error: AxiosError) => {
        const event: ClientEvent = {
          type: "error",
          data: {
            message: error.message,
            status: error.response?.status,
            url: error.config?.url,
            method: error.config?.method?.toUpperCase(),
          },
          timestamp: new Date().toISOString(),
        };
        this.emitEvent("error", event);

        return Promise.reject(error);
      },
    );
  }

  // Authentication methods
  public setApiKey(apiKey: string): void {
    if (!apiKey || typeof apiKey !== "string") {
      throw new AuthenticationError("API key must be a non-empty string");
    }

    // Basic validation for API key format
    if (!/^sk_(live|test|sys)_[a-zA-Z0-9]{32}$/.test(apiKey)) {
      throw new AuthenticationError(
        "Invalid API key format. Expected format: sk_{env}_{32_char_string}",
      );
    }

    this.axios.defaults.headers.common["Authorization"] = `Bearer ${apiKey}`;
    this.axios.defaults.headers.common["X-API-Key"] = apiKey;
  }

  public setJwt(token: string): void {
    if (!token || typeof token !== "string") {
      throw new AuthenticationError("JWT token must be a non-empty string");
    }

    // Basic JWT validation
    const parts = token.split(".");
    if (parts.length !== 3) {
      throw new AuthenticationError("Invalid JWT token format");
    }

    this.axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    // Remove API key header when using JWT
    delete this.axios.defaults.headers.common["X-API-Key"];
  }

  public clearAuth(): void {
    delete this.axios.defaults.headers.common["Authorization"];
    delete this.axios.defaults.headers.common["X-API-Key"];
  }

  // Event listeners
  public addEventListener(
    event: "request" | "response" | "error" | "retry",
    callback: (event: ClientEvent) => void,
  ): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  public removeEventListener(
    event: "request" | "response" | "error" | "retry",
    callback: (event: ClientEvent) => void,
  ): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emitEvent(event: string, data: ClientEvent): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          // Don't let listener errors break the flow
          console.error("Event listener error:", error);
        }
      });
    }
  }

  // HTTP methods with retry logic
  public async request<T = any>(
    config: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    const retryConfig: RetryConfig = {
      attempts: this.config.retryAttempts + 1, // +1 for initial attempt
      delay: this.config.retryDelay,
      backoffFactor: 2,
      maxDelay: 30000, // 30 seconds max delay
    };

    let lastError: any;

    for (let attempt = 1; attempt <= retryConfig.attempts; attempt++) {
      try {
        const response = await this.axios.request<ApiResponse<T>>(config);
        return response.data;
      } catch (error: any) {
        lastError = error;

        // Don't retry on authentication errors or client errors (4xx)
        if (
          error.response?.status === 401 ||
          error.response?.status === 403 ||
          (error.response?.status >= 400 && error.response?.status < 500)
        ) {
          break;
        }

        // Don't retry on last attempt
        if (attempt === retryConfig.attempts) {
          break;
        }

        // Retry for rate limiting
        if (isRateLimitError(error) || error.response?.status === 429) {
          const retryAfter = error.response?.headers?.["retry-after"];
          const delay = retryAfter
            ? parseInt(retryAfter) * 1000
            : this.calculateRetryDelay(attempt, retryConfig);

          const event: ClientEvent = {
            type: "retry",
            data: {
              attempt,
              maxAttempts: retryConfig.attempts,
              delay,
              reason: error.message,
            },
            timestamp: new Date().toISOString(),
          };
          this.emitEvent("retry", event);

          await this.sleep(delay);
          continue;
        }

        // Retry for server errors (5xx) and network errors
        if (error.response?.status >= 500 || !error.response) {
          const delay = this.calculateRetryDelay(attempt, retryConfig);

          const event: ClientEvent = {
            type: "retry",
            data: {
              attempt,
              maxAttempts: retryConfig.attempts,
              delay,
              reason: error.message,
            },
            timestamp: new Date().toISOString(),
          };
          this.emitEvent("retry", event);

          await this.sleep(delay);
          continue;
        }

        // Don't retry for other errors
        break;
      }
    }

    // Convert to MailerError
    throw this.handleHttpError(lastError);
  }

  public async get<T = any>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: "GET", url });
  }

  public async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: "POST", url, data });
  }

  public async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: "PUT", url, data });
  }

  public async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: "PATCH", url, data });
  }

  public async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: "DELETE", url });
  }

  private calculateRetryDelay(attempt: number, config: RetryConfig): number {
    const delay = config.delay * Math.pow(config.backoffFactor, attempt - 1);
    return Math.min(delay, config.maxDelay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private handleHttpError(error: any): MailerError {
    // Handle network errors
    if (!error.response) {
      if (error.code === "ECONNABORTED") {
        return new TimeoutError(this.config.timeout);
      }
      return new MailerError(
        `Network error: ${error.message}`,
        "NETWORK_ERROR",
        0,
      );
    }

    const { response } = error;
    const statusCode = response.status;

    // Handle rate limiting
    if (statusCode === 429) {
      const retryAfter = response.headers?.["retry-after"];
      return new RateLimitError(retryAfter ? parseInt(retryAfter) : undefined);
    }

    // Handle API errors with structured response
    if (response.data && typeof response.data === "object") {
      const apiError = response.data.error || {
        code: "UNKNOWN_ERROR",
        message: response.data.message || error.message,
      };

      return createErrorFromResponse(statusCode, apiError);
    }

    // Handle unknown errors
    return new MailerError(
      response.data?.message || error.message || "Unknown error",
      response.data?.code || "UNKNOWN_ERROR",
      statusCode,
    );
  }

  // Utility methods
  public getBaseURL(): string {
    return this.config.baseURL;
  }

  public setBaseURL(baseURL: string): void {
    this.config.baseURL = baseURL;
    this.axios.defaults.baseURL = baseURL;
  }

  public getTimeout(): number {
    return this.config.timeout;
  }

  public setTimeout(timeout: number): void {
    this.config.timeout = timeout;
    this.axios.defaults.timeout = timeout;
  }

  public isConfigured(): boolean {
    return !!(
      this.axios.defaults.headers.common["Authorization"] ||
      this.axios.defaults.headers.common["X-API-Key"]
    );
  }

  public getAuthMethod(): "api-key" | "jwt" | "none" {
    if (this.axios.defaults.headers.common["X-API-Key"]) {
      return "api-key";
    }
    if (this.axios.defaults.headers.common["Authorization"]) {
      const auth = this.axios.defaults.headers.common[
        "Authorization"
      ] as string;
      if (auth.startsWith("Bearer ")) {
        const token = auth.slice(7);
        if (token.split(".").length === 3) {
          return "jwt";
        }
      }
    }
    return "none";
  }
}
