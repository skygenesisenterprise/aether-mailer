import { MailerConfig, ApiResponse } from "./types/index.js";
import { HttpClient } from "./client/index.js";
import { EmailService } from "./email/index.js";
import { DomainService } from "./domain/index.js";
import { AuthService } from "./auth/index.js";
import { StatsService } from "./stats/index.js";
import { ValidationUtils } from "./utils/validation.js";
import { ValidationError } from "./errors/index.js";

export class Mailer {
  private client: HttpClient;
  public email: EmailService;
  public domain: DomainService;
  public auth: AuthService;
  public stats: StatsService;

  constructor(config: MailerConfig = {}) {
    // Validate configuration
    this.validateConfig(config);

    // Create HTTP client
    this.client = new HttpClient(config);

    // Initialize services
    this.email = new EmailService(this.client);
    this.domain = new DomainService(this.client);
    this.auth = new AuthService(this.client);
    this.stats = new StatsService(this.client);

    // Set up authentication if provided
    if (config.apiKey) {
      this.setApiKey(config.apiKey);
    } else if (config.jwt) {
      this.setJwt(config.jwt);
    }
  }

  private validateConfig(config: MailerConfig): void {
    if (config.apiKey && config.jwt) {
      throw new ValidationError(
        "Cannot provide both API key and JWT. Use one authentication method.",
      );
    }

    if (config.apiKey) {
      const keyValidation = ValidationUtils.validateApiKey(config.apiKey);
      if (!keyValidation.isValid) {
        throw new ValidationError(
          `Invalid API key: ${keyValidation.errors.join(", ")}`,
        );
      }
    }

    if (config.jwt) {
      const jwtValidation = ValidationUtils.validateJwt(config.jwt);
      if (!jwtValidation.isValid) {
        throw new ValidationError(
          `Invalid JWT: ${jwtValidation.errors.join(", ")}`,
        );
      }
    }

    if (config.timeout && (config.timeout < 1000 || config.timeout > 300000)) {
      throw new ValidationError(
        "Timeout must be between 1000ms and 300000ms (5 minutes)",
      );
    }

    if (
      config.retryAttempts &&
      (config.retryAttempts < 0 || config.retryAttempts > 10)
    ) {
      throw new ValidationError("Retry attempts must be between 0 and 10");
    }

    if (
      config.retryDelay &&
      (config.retryDelay < 100 || config.retryDelay > 60000)
    ) {
      throw new ValidationError(
        "Retry delay must be between 100ms and 60000ms (1 minute)",
      );
    }

    if (config.baseURL) {
      const urlValidation = ValidationUtils.validateUrl(
        config.baseURL,
        "Base URL",
      );
      if (!urlValidation.isValid) {
        throw new ValidationError(
          `Invalid base URL: ${urlValidation.errors.join(", ")}`,
        );
      }
    }
  }

  // Authentication methods
  public setApiKey(apiKey: string): void {
    const validation = ValidationUtils.validateApiKey(apiKey);
    if (!validation.isValid) {
      throw new ValidationError(
        `Invalid API key: ${validation.errors.join(", ")}`,
      );
    }
    this.client.setApiKey(apiKey);
  }

  public setJwt(jwt: string): void {
    const validation = ValidationUtils.validateJwt(jwt);
    if (!validation.isValid) {
      throw new ValidationError(`Invalid JWT: ${validation.errors.join(", ")}`);
    }
    this.client.setJwt(jwt);
  }

  public clearAuth(): void {
    this.client.clearAuth();
  }

  // Configuration methods
  public setBaseURL(baseURL: string): void {
    const validation = ValidationUtils.validateUrl(baseURL, "Base URL");
    if (!validation.isValid) {
      throw new ValidationError(
        `Invalid base URL: ${validation.errors.join(", ")}`,
      );
    }
    this.client.setBaseURL(baseURL);
  }

  public setTimeout(timeout: number): void {
    if (timeout < 1000 || timeout > 300000) {
      throw new ValidationError("Timeout must be between 1000ms and 300000ms");
    }
    this.client.setTimeout(timeout);
  }

  // Utility methods
  public isConfigured(): boolean {
    return this.client.isConfigured();
  }

  public getAuthMethod(): "api-key" | "jwt" | "none" {
    return this.client.getAuthMethod();
  }

  public getBaseURL(): string {
    return this.client.getBaseURL();
  }

  public getTimeout(): number {
    return this.client.getTimeout();
  }

  // Event listeners
  public addEventListener(
    event: "request" | "response" | "error" | "retry",
    callback: (event: any) => void,
  ): void {
    this.client.addEventListener(event, callback);
  }

  public removeEventListener(
    event: "request" | "response" | "error" | "retry",
    callback: (event: any) => void,
  ): void {
    this.client.removeEventListener(event, callback);
  }

  // Health check
  public async healthCheck(): Promise<
    ApiResponse<{ status: string; timestamp: string }>
  > {
    try {
      return await this.client.get("/health");
    } catch (error) {
      throw error;
    }
  }

  // Server info
  public async getServerInfo(): Promise<
    ApiResponse<{ version: string; environment: string; uptime: number }>
  > {
    try {
      return await this.client.get("/info");
    } catch (error) {
      throw error;
    }
  }

  // Static factory methods
  public static withApiKey(apiKey: string, baseURL?: string): Mailer {
    const config: MailerConfig = { apiKey };
    if (baseURL) config.baseURL = baseURL;
    return new Mailer(config);
  }

  public static withJwt(jwt: string, baseURL?: string): Mailer {
    const config: MailerConfig = { jwt };
    if (baseURL) config.baseURL = baseURL;
    return new Mailer(config);
  }

  public static withConfig(config: MailerConfig): Mailer {
    return new Mailer(config);
  }

  // Validation utilities (exposed for convenience)
  public static validate = {
    email: EmailValidator.validate,
    emailFormat: EmailValidator.validateFormat,
    domain: EmailValidator.validateDomain,
    apiKey: ValidationUtils.validateApiKey,
    jwt: ValidationUtils.validateJwt,
    url: ValidationUtils.validateUrl,
  };

  // Export EmailValidator for advanced usage
  public static EmailValidator = EmailValidator;
}

// Import EmailValidator for static methods
import { EmailValidator } from "./utils/validation.js";

// Export main class and utilities
export default Mailer;
export { EmailValidator, ValidationUtils };
export * from "./types/index.js";
export * from "./errors/index.js";
