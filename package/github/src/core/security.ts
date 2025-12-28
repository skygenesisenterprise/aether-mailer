import * as crypto from "crypto";
import { Logger } from "../utils/logger.js";

export class WebhookSignatureValidator {
  constructor(
    private readonly secret: string,
    private readonly logger: Logger,
  ) {}

  validateSignature(payload: string, signature: string): boolean {
    try {
      if (!this.secret) {
        this.logger.error("Webhook secret not configured");
        return false;
      }

      if (!signature) {
        this.logger.error("No signature provided in webhook request");
        return false;
      }

      // Extract the hash algorithm and signature
      const parts = signature.split("=");
      if (parts.length !== 2) {
        this.logger.error("Invalid signature format");
        return false;
      }

      const [algorithm, sigValue] = parts;

      if (algorithm !== "sha256") {
        this.logger.error("Unsupported signature algorithm", { algorithm });
        return false;
      }

      // Compute expected signature
      const expectedSignature = crypto
        .createHmac("sha256", this.secret)
        .update(payload, "utf8")
        .digest("hex");

      // Compare signatures securely
      const isValid = crypto.timingSafeEqual(
        Buffer.from(sigValue || "", "hex"),
        Buffer.from(expectedSignature, "hex"),
      );

      if (!isValid) {
        this.logger.error("Invalid webhook signature", {
          provided: (sigValue || "").substring(0, 8) + "...",
          expected: expectedSignature.substring(0, 8) + "...",
        });
      }

      return isValid;
    } catch (error) {
      this.logger.error("Error validating webhook signature", { error });
      return false;
    }
  }

  static generateSignature(secret: string, payload: string): string {
    const signature = crypto
      .createHmac("sha256", secret)
      .update(payload, "utf8")
      .digest("hex");

    return `sha256=${signature}`;
  }
}

export class SecurityHeaders {
  static addSecurityHeaders(headers: Record<string, string>): void {
    headers["X-Content-Type-Options"] = "nosniff";
    headers["X-Frame-Options"] = "DENY";
    headers["X-XSS-Protection"] = "1; mode=block";
    headers["Strict-Transport-Security"] =
      "max-age=31536000; includeSubDomains";
    headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    headers["Content-Security-Policy"] = "default-src 'self'";
  }

  static validateRequestHeaders(headers: Record<string, string>): boolean {
    const userAgent = headers["user-agent"];
    const contentType = headers["content-type"];

    // Basic validation of request headers
    if (!userAgent || userAgent.length === 0) {
      return false;
    }

    // For webhook requests, we expect JSON content type
    if (contentType && !contentType.includes("application/json")) {
      return false;
    }

    return true;
  }
}

export class RateLimiter {
  private readonly requests = new Map<string, number[]>();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;

    // Clean up old entries periodically
    setInterval(() => this.cleanup(), this.windowMs);
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Get existing requests for this identifier
    let requests = this.requests.get(identifier) || [];

    // Filter out old requests
    requests = requests.filter((timestamp) => timestamp > windowStart);

    // Check if we're at the limit
    if (requests.length >= this.maxRequests) {
      return false;
    }

    // Add current request
    requests.push(now);
    this.requests.set(identifier, requests);

    return true;
  }

  private cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    for (const [identifier, requests] of this.requests.entries()) {
      const validRequests = requests.filter(
        (timestamp) => timestamp > windowStart,
      );

      if (validRequests.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, validRequests);
      }
    }
  }

  getStats(): { totalIdentifiers: number; totalRequests: number } {
    let totalRequests = 0;

    for (const requests of this.requests.values()) {
      totalRequests += requests.length;
    }

    return {
      totalIdentifiers: this.requests.size,
      totalRequests,
    };
  }
}

export class InputSanitizer {
  static sanitizeString(input: string, maxLength: number = 1000): string {
    if (typeof input !== "string") {
      return "";
    }

    // Remove null bytes and control characters
    let sanitized = input.replace(/[\x00-\x1F\x7F]/g, "");

    // Trim whitespace
    sanitized = sanitized.trim();

    // Limit length
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    return sanitized;
  }

  static sanitizeRepositoryName(input: string): string {
    // Repository names can only contain alphanumeric characters, hyphens, underscores, and dots
    const sanitized = input.toLowerCase().replace(/[^a-z0-9._-]/g, "");

    // Must be between 1 and 100 characters
    return sanitized.substring(0, 100);
  }

  static sanitizeReleaseTag(input: string): string {
    // Release tags can contain v prefix, semantic versioning, and some special characters
    const sanitized = input.replace(/[^a-zA-Z0-9.v\-_+]/g, "");

    return sanitized.substring(0, 128);
  }

  static validateJson(input: string): boolean {
    try {
      JSON.parse(input);
      return true;
    } catch {
      return false;
    }
  }

  static extractSafeFields(
    obj: any,
    allowedFields: string[],
  ): Record<string, any> {
    const result: Record<string, any> = {};

    for (const field of allowedFields) {
      if (obj.hasOwnProperty(field)) {
        const value = obj[field];

        if (typeof value === "string") {
          result[field] = this.sanitizeString(value);
        } else if (typeof value === "number" || typeof value === "boolean") {
          result[field] = value;
        } else if (Array.isArray(value)) {
          result[field] = value.slice(0, 10); // Limit array size
        }
      }
    }

    return result;
  }
}
