import { ApiError, ERROR_CODES, HTTP_STATUS } from "../types/index.js";

// Re-export validation utilities from utils
export { ValidationUtils, EmailValidator } from "../utils/validation.js";

// Base error class
export class MailerError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, any> | undefined;

  constructor(
    message: string,
    code: string,
    statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    details?: Record<string, any>,
  ) {
    super(message);
    this.name = "MailerError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }

  toJSON(): ApiError {
    const result: ApiError = {
      code: this.code,
      message: this.message,
    };

    if (this.details !== undefined) {
      result.details = this.details;
    }

    return result;
  }
}

// Authentication errors
export class AuthenticationError extends MailerError {
  constructor(
    message: string = "Authentication failed",
    details?: Record<string, any>,
  ) {
    super(message, ERROR_CODES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED, details);
    this.name = "AuthenticationError";
  }
}

export class InvalidApiKeyError extends MailerError {
  constructor(details?: Record<string, any>) {
    super(
      "Invalid or missing API key",
      ERROR_CODES.INVALID_API_KEY,
      HTTP_STATUS.UNAUTHORIZED,
      details,
    );
    this.name = "InvalidApiKeyError";
  }
}

export class ExpiredTokenError extends MailerError {
  constructor(details?: Record<string, any>) {
    super(
      "Token has expired",
      ERROR_CODES.EXPIRED_TOKEN,
      HTTP_STATUS.UNAUTHORIZED,
      details,
    );
    this.name = "ExpiredTokenError";
  }
}

export class InsufficientPermissionsError extends MailerError {
  constructor(permission?: string, details?: Record<string, any>) {
    const message = permission
      ? `Insufficient permissions: ${permission}`
      : "Insufficient permissions";
    super(
      message,
      ERROR_CODES.INSUFFICIENT_PERMISSIONS,
      HTTP_STATUS.FORBIDDEN,
      details,
    );
    this.name = "InsufficientPermissionsError";
  }
}

// Request errors
export class ValidationError extends MailerError {
  constructor(
    message: string = "Validation failed",
    details?: Record<string, any>,
  ) {
    super(
      message,
      ERROR_CODES.VALIDATION_ERROR,
      HTTP_STATUS.BAD_REQUEST,
      details,
    );
    this.name = "ValidationError";
  }
}

export class InvalidRequestError extends MailerError {
  constructor(
    message: string = "Invalid request",
    details?: Record<string, any>,
  ) {
    super(
      message,
      ERROR_CODES.INVALID_REQUEST,
      HTTP_STATUS.BAD_REQUEST,
      details,
    );
    this.name = "InvalidRequestError";
  }
}

export class MissingFieldError extends ValidationError {
  constructor(field: string, details?: Record<string, any>) {
    super(`Missing required field: ${field}`, { field, ...details });
    this.name = "MissingFieldError";
  }
}

export class InvalidFormatError extends ValidationError {
  constructor(field: string, format: string, details?: Record<string, any>) {
    super(`Invalid format for field ${field}. Expected: ${format}`, {
      field,
      format,
      ...details,
    });
    this.name = "InvalidFormatError";
  }
}

// Resource errors
export class NotFoundError extends MailerError {
  constructor(
    resource: string = "Resource",
    identifier?: string,
    details?: Record<string, any>,
  ) {
    const message = identifier
      ? `${resource} not found: ${identifier}`
      : `${resource} not found`;
    super(message, ERROR_CODES.NOT_FOUND, HTTP_STATUS.NOT_FOUND, details);
    this.name = "NotFoundError";
  }
}

export class AlreadyExistsError extends MailerError {
  constructor(
    resource: string,
    identifier?: string,
    details?: Record<string, any>,
  ) {
    const message = identifier
      ? `${resource} already exists: ${identifier}`
      : `${resource} already exists`;
    super(message, ERROR_CODES.ALREADY_EXISTS, HTTP_STATUS.CONFLICT, details);
    this.name = "AlreadyExistsError";
  }
}

export class DomainExistsError extends MailerError {
  constructor(domain: string, details?: Record<string, any>) {
    super(
      `Domain already exists: ${domain}`,
      ERROR_CODES.DOMAIN_EXISTS,
      HTTP_STATUS.CONFLICT,
      details,
    );
    this.name = "DomainExistsError";
  }
}

export class DomainNotFoundError extends NotFoundError {
  constructor(domain: string, details?: Record<string, any>) {
    super("Domain", domain, details);
    this.name = "DomainNotFoundError";
  }
}

// Rate limiting errors
export class RateLimitError extends MailerError {
  constructor(retryAfter?: number, details?: Record<string, any>) {
    const message = retryAfter
      ? `Rate limit exceeded. Retry after ${retryAfter} seconds`
      : "Rate limit exceeded";
    super(message, ERROR_CODES.RATE_LIMITED, HTTP_STATUS.TOO_MANY_REQUESTS, {
      retryAfter,
      ...details,
    });
    this.name = "RateLimitError";
  }
}

export class QuotaExceededError extends MailerError {
  constructor(quota: string, details?: Record<string, any>) {
    super(
      `Quota exceeded: ${quota}`,
      ERROR_CODES.QUOTA_EXCEEDED,
      HTTP_STATUS.TOO_MANY_REQUESTS,
      details,
    );
    this.name = "QuotaExceededError";
  }
}

// System errors
export class InternalError extends MailerError {
  constructor(
    message: string = "Internal server error",
    details?: Record<string, any>,
  ) {
    super(
      message,
      ERROR_CODES.INTERNAL_ERROR,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      details,
    );
    this.name = "InternalError";
  }
}

export class ServiceUnavailableError extends MailerError {
  constructor(service?: string, details?: Record<string, any>) {
    const message = service
      ? `Service unavailable: ${service}`
      : "Service unavailable";
    super(
      message,
      ERROR_CODES.SERVICE_UNAVAILABLE,
      HTTP_STATUS.SERVICE_UNAVAILABLE,
      details,
    );
    this.name = "ServiceUnavailableError";
  }
}

export class TimeoutError extends MailerError {
  constructor(timeout: number, details?: Record<string, any>) {
    super(
      `Request timeout after ${timeout}ms`,
      ERROR_CODES.TIMEOUT,
      HTTP_STATUS.REQUEST_TIMEOUT,
      { timeout, ...details },
    );
    this.name = "TimeoutError";
  }
}

// Email specific errors
export class SendFailedError extends MailerError {
  constructor(
    message: string = "Failed to send email",
    details?: Record<string, any>,
  ) {
    super(
      message,
      ERROR_CODES.SEND_FAILED,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      details,
    );
    this.name = "SendFailedError";
  }
}

export class InvalidEmailError extends ValidationError {
  constructor(email: string, reason?: string, details?: Record<string, any>) {
    const message = reason
      ? `Invalid email address: ${email} (${reason})`
      : `Invalid email address: ${email}`;
    super(message, { email, reason, ...details });
    this.name = "InvalidEmailError";
  }
}

export class EmailTooLargeError extends ValidationError {
  constructor(size: number, maxSize: number, details?: Record<string, any>) {
    super(`Email too large: ${size} bytes (max: ${maxSize} bytes)`, {
      size,
      maxSize,
      ...details,
    });
    this.name = "EmailTooLargeError";
  }
}

export class AttachmentTooLargeError extends ValidationError {
  constructor(
    filename: string,
    size: number,
    maxSize: number,
    details?: Record<string, any>,
  ) {
    super(
      `Attachment too large: ${filename} (${size} bytes, max: ${maxSize} bytes)`,
      { filename, size, maxSize, ...details },
    );
    this.name = "AttachmentTooLargeError";
  }
}

// Domain specific errors
export class DomainVerificationFailedError extends MailerError {
  constructor(domain: string, reason?: string, details?: Record<string, any>) {
    const message = reason
      ? `Domain verification failed: ${domain} (${reason})`
      : `Domain verification failed: ${domain}`;
    super(
      message,
      ERROR_CODES.DOMAIN_VERIFICATION_FAILED,
      HTTP_STATUS.BAD_REQUEST,
      { domain, reason, ...details },
    );
    this.name = "DomainVerificationFailedError";
  }
}

export class InvalidDnsRecordError extends ValidationError {
  constructor(record: string, reason?: string, details?: Record<string, any>) {
    const message = reason
      ? `Invalid DNS record: ${record} (${reason})`
      : `Invalid DNS record: ${record}`;
    super(message, { record, reason, ...details });
    this.name = "InvalidDnsRecordError";
  }
}

export class DnsConfigError extends MailerError {
  constructor(
    message: string = "DNS configuration error",
    details?: Record<string, any>,
  ) {
    super(
      message,
      ERROR_CODES.DNS_CONFIG_ERROR,
      HTTP_STATUS.BAD_REQUEST,
      details,
    );
    this.name = "DnsConfigError";
  }
}

// Utility function to create errors from API responses
export function createErrorFromResponse(
  statusCode: number,
  error: ApiError,
): MailerError {
  switch (error.code) {
    case ERROR_CODES.UNAUTHORIZED:
      return new AuthenticationError(error.message, error.details);
    case ERROR_CODES.INVALID_API_KEY:
      return new InvalidApiKeyError(error.details);
    case ERROR_CODES.EXPIRED_TOKEN:
      return new ExpiredTokenError(error.details);
    case ERROR_CODES.INSUFFICIENT_PERMISSIONS:
      return new InsufficientPermissionsError(
        error.details?.permission,
        error.details,
      );
    case ERROR_CODES.VALIDATION_ERROR:
      return new ValidationError(error.message, error.details);
    case ERROR_CODES.INVALID_REQUEST:
      return new InvalidRequestError(error.message, error.details);
    case ERROR_CODES.NOT_FOUND:
      return new NotFoundError("Resource", undefined, error.details);
    case ERROR_CODES.DOMAIN_NOT_FOUND:
      return new DomainNotFoundError("unknown", error.details);
    case ERROR_CODES.ALREADY_EXISTS:
    case ERROR_CODES.DOMAIN_EXISTS:
      return new AlreadyExistsError("Resource", undefined, error.details);
    case ERROR_CODES.RATE_LIMITED:
      return new RateLimitError(error.details?.retryAfter, error.details);
    case ERROR_CODES.QUOTA_EXCEEDED:
      return new QuotaExceededError("quota", error.details);
    case ERROR_CODES.SEND_FAILED:
      return new SendFailedError(error.message, error.details);
    case ERROR_CODES.INVALID_EMAIL:
      return new InvalidEmailError(
        "unknown",
        error.details?.reason,
        error.details,
      );
    case ERROR_CODES.DOMAIN_VERIFICATION_FAILED:
      return new DomainVerificationFailedError(
        "unknown",
        error.details?.reason,
        error.details,
      );
    case ERROR_CODES.INVALID_DNS_RECORD:
      return new InvalidDnsRecordError(
        "unknown",
        error.details?.reason,
        error.details,
      );
    case ERROR_CODES.DNS_CONFIG_ERROR:
      return new DnsConfigError(error.message, error.details);
    default:
      return new MailerError(
        error.message,
        error.code,
        statusCode,
        error.details,
      );
  }
}

// Utility function to check if an error is a specific type
export function isMailerError(error: any): error is MailerError {
  return error instanceof MailerError;
}

export function isAuthenticationError(
  error: any,
): error is AuthenticationError {
  return (
    error instanceof AuthenticationError ||
    error.code === ERROR_CODES.UNAUTHORIZED
  );
}

export function isValidationError(error: any): error is ValidationError {
  return (
    error instanceof ValidationError ||
    error.code === ERROR_CODES.VALIDATION_ERROR
  );
}

export function isRateLimitError(error: any): error is RateLimitError {
  return (
    error instanceof RateLimitError || error.code === ERROR_CODES.RATE_LIMITED
  );
}

export function isNotFoundError(error: any): error is NotFoundError {
  return error instanceof NotFoundError || error.code === ERROR_CODES.NOT_FOUND;
}
