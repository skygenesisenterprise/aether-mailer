import {
  ApiResponse,
  StatsOptions,
  EmailStats,
  DomainUsageStats,
  QueueStatus,
  SmtpSession,
  SmtpConnectionTest,
  API_ENDPOINTS,
} from "../types/index.js";
import { HttpClient } from "../client/index.js";
import {
  ValidationError,
  MissingFieldError,
  ValidationUtils,
} from "../errors/index.js";

export class StatsService {
  constructor(private client: HttpClient) {}

  // Get general email statistics
  public async getEmailStats(
    options?: StatsOptions,
  ): Promise<ApiResponse<EmailStats>> {
    const queryParams = new URLSearchParams();

    if (options?.period) {
      const validPeriods = ["hour", "day", "week", "month", "year"];
      if (!validPeriods.includes(options.period)) {
        throw new ValidationError(
          `Period must be one of: ${validPeriods.join(", ")}`,
        );
      }
      queryParams.append("period", options.period);
    }

    if (options?.startDate) {
      const startDateValidation = this.validateDateString(options.startDate);
      if (!startDateValidation.isValid) {
        throw new ValidationError(
          `Invalid startDate: ${startDateValidation.errors.join(", ")}`,
        );
      }
      queryParams.append("startDate", options.startDate);
    }

    if (options?.endDate) {
      const endDateValidation = this.validateDateString(options.endDate);
      if (!endDateValidation.isValid) {
        throw new ValidationError(
          `Invalid endDate: ${endDateValidation.errors.join(", ")}`,
        );
      }
      queryParams.append("endDate", options.endDate);
    }

    if (options?.domainId) {
      queryParams.append("domainId", options.domainId);
    }

    const url = queryParams.toString()
      ? `${API_ENDPOINTS.SMTP_STATS}?${queryParams.toString()}`
      : API_ENDPOINTS.SMTP_STATS;

    try {
      const response = await this.client.get(url);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get domain usage statistics
  public async getDomainUsageStats(options?: {
    domainId?: string;
    period?: "hour" | "day" | "week" | "month" | "year";
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<{ stats: DomainUsageStats[] }>> {
    const queryParams = new URLSearchParams();

    if (options?.domainId) {
      queryParams.append("domainId", options.domainId);
    }

    if (options?.period) {
      const validPeriods = ["hour", "day", "week", "month", "year"];
      if (!validPeriods.includes(options.period)) {
        throw new ValidationError(
          `Period must be one of: ${validPeriods.join(", ")}`,
        );
      }
      queryParams.append("period", options.period);
    }

    if (options?.startDate) {
      const startDateValidation = this.validateDateString(options.startDate);
      if (!startDateValidation.isValid) {
        throw new ValidationError(
          `Invalid startDate: ${startDateValidation.errors.join(", ")}`,
        );
      }
      queryParams.append("startDate", options.startDate);
    }

    if (options?.endDate) {
      const endDateValidation = this.validateDateString(options.endDate);
      if (!endDateValidation.isValid) {
        throw new ValidationError(
          `Invalid endDate: ${endDateValidation.errors.join(", ")}`,
        );
      }
      queryParams.append("endDate", options.endDate);
    }

    const url = queryParams.toString()
      ? `/api/v1/stats/domains?${queryParams.toString()}`
      : "/api/v1/stats/domains";

    try {
      const response = await this.client.get(url);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get queue status
  public async getQueueStatus(): Promise<ApiResponse<QueueStatus>> {
    try {
      const response = await this.client.get(API_ENDPOINTS.QUEUE_STATUS);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get SMTP session statistics
  public async getSmtpSessions(params?: {
    page?: number;
    limit?: number;
    status?: "active" | "completed" | "error";
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<{ sessions: SmtpSession[]; pagination: any }>> {
    const queryParams = new URLSearchParams();

    if (params?.page) {
      queryParams.append("page", params.page.toString());
    }

    if (params?.limit) {
      queryParams.append("limit", params.limit.toString());
    }

    if (params?.status) {
      const validStatuses = ["active", "completed", "error"];
      if (!validStatuses.includes(params.status)) {
        throw new ValidationError(
          `Status must be one of: ${validStatuses.join(", ")}`,
        );
      }
      queryParams.append("status", params.status);
    }

    if (params?.startDate) {
      const startDateValidation = this.validateDateString(params.startDate);
      if (!startDateValidation.isValid) {
        throw new ValidationError(
          `Invalid startDate: ${startDateValidation.errors.join(", ")}`,
        );
      }
      queryParams.append("startDate", params.startDate);
    }

    if (params?.endDate) {
      const endDateValidation = this.validateDateString(params.endDate);
      if (!endDateValidation.isValid) {
        throw new ValidationError(
          `Invalid endDate: ${endDateValidation.errors.join(", ")}`,
        );
      }
      queryParams.append("endDate", params.endDate);
    }

    const url = queryParams.toString()
      ? `${API_ENDPOINTS.SMTP_SESSIONS}?${queryParams.toString()}`
      : API_ENDPOINTS.SMTP_SESSIONS;

    try {
      const response = await this.client.get(url);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get specific SMTP session
  public async getSmtpSession(
    sessionId: string,
  ): Promise<ApiResponse<SmtpSession>> {
    if (!sessionId || typeof sessionId !== "string") {
      throw new MissingFieldError("Session ID is required");
    }

    const url = API_ENDPOINTS.SMTP_SESSION.replace(":id", sessionId);

    try {
      const response = await this.client.get(url);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get SMTP logs
  public async getSmtpLogs(params?: {
    page?: number;
    limit?: number;
    level?: "debug" | "info" | "warn" | "error";
    startDate?: string;
    endDate?: string;
    sessionId?: string;
  }): Promise<ApiResponse<{ logs: any[]; pagination: any }>> {
    const queryParams = new URLSearchParams();

    if (params?.page) {
      queryParams.append("page", params.page.toString());
    }

    if (params?.limit) {
      queryParams.append("limit", params.limit.toString());
    }

    if (params?.level) {
      const validLevels = ["debug", "info", "warn", "error"];
      if (!validLevels.includes(params.level)) {
        throw new ValidationError(
          `Level must be one of: ${validLevels.join(", ")}`,
        );
      }
      queryParams.append("level", params.level);
    }

    if (params?.startDate) {
      const startDateValidation = this.validateDateString(params.startDate);
      if (!startDateValidation.isValid) {
        throw new ValidationError(
          `Invalid startDate: ${startDateValidation.errors.join(", ")}`,
        );
      }
      queryParams.append("startDate", params.startDate);
    }

    if (params?.endDate) {
      const endDateValidation = this.validateDateString(params.endDate);
      if (!endDateValidation.isValid) {
        throw new ValidationError(
          `Invalid endDate: ${endDateValidation.errors.join(", ")}`,
        );
      }
      queryParams.append("endDate", params.endDate);
    }

    if (params?.sessionId) {
      queryParams.append("sessionId", params.sessionId);
    }

    const url = queryParams.toString()
      ? `${API_ENDPOINTS.SMTP_LOGS}?${queryParams.toString()}`
      : API_ENDPOINTS.SMTP_LOGS;

    try {
      const response = await this.client.get(url);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Test SMTP connection
  public async testSmtpConnection(config: {
    host: string;
    port: number;
    tls?: boolean;
    username?: string;
    password?: string;
  }): Promise<ApiResponse<SmtpConnectionTest>> {
    this.validateSmtpConnectionConfig(config);

    try {
      const response = await this.client.post(API_ENDPOINTS.SMTP_TEST, config);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get system health statistics
  public async getSystemStats(): Promise<
    ApiResponse<{
      uptime: number;
      memory: {
        used: number;
        total: number;
        percentage: number;
      };
      cpu: {
        usage: number;
      };
      connections: {
        active: number;
        total: number;
      };
      queue: QueueStatus;
    }>
  > {
    try {
      const response = await this.client.get("/api/v1/stats/system");
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get real-time metrics
  public async getRealTimeMetrics(): Promise<
    ApiResponse<{
      timestamp: string;
      emailsPerMinute: number;
      queueSize: number;
      activeConnections: number;
      errorRate: number;
      averageResponseTime: number;
    }>
  > {
    try {
      const response = await this.client.get("/api/v1/stats/realtime");
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Export statistics
  public async exportStats(options: {
    type: "email" | "domain" | "queue" | "sessions";
    format: "csv" | "json" | "xlsx";
    startDate?: string;
    endDate?: string;
    domainId?: string;
  }): Promise<Blob> {
    this.validateExportOptions(options);

    const queryParams = new URLSearchParams();
    queryParams.append("type", options.type);
    queryParams.append("format", options.format);

    if (options.startDate) {
      queryParams.append("startDate", options.startDate);
    }

    if (options.endDate) {
      queryParams.append("endDate", options.endDate);
    }

    if (options.domainId) {
      queryParams.append("domainId", options.domainId);
    }

    const url = `/api/v1/stats/export?${queryParams.toString()}`;

    try {
      const response = await this.client.get(url);

      // In a real implementation, you would handle the response differently
      // For now, we'll return the data as a blob
      const data = JSON.stringify(response.data);
      return new Blob([data], { type: "application/octet-stream" });
    } catch (error) {
      throw error;
    }
  }

  // Get custom report
  public async getCustomReport(reportConfig: {
    metrics: string[];
    groupBy?: "hour" | "day" | "week" | "month";
    filters?: {
      domainId?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
    };
  }): Promise<ApiResponse<{ report: any[]; metadata: any }>> {
    this.validateCustomReportConfig(reportConfig);

    try {
      const response = await this.client.post(
        "/api/v1/stats/custom",
        reportConfig,
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Private validation methods
  private validateDateString(dateString: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!dateString || typeof dateString !== "string") {
      errors.push("Date string is required");
      return { isValid: false, errors };
    }

    // Try parsing as ISO date
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      errors.push(
        "Invalid date format. Use ISO 8601 format (e.g., 2023-12-25T10:00:00Z)",
      );
    }

    // Check if date is reasonable
    const now = new Date();
    const tenYearsAgo = new Date(
      now.getTime() - 10 * 365 * 24 * 60 * 60 * 1000,
    );
    const tenYearsFromNow = new Date(
      now.getTime() + 10 * 365 * 24 * 60 * 60 * 1000,
    );

    if (date < tenYearsAgo || date > tenYearsFromNow) {
      errors.push("Date is outside reasonable range (±10 years)");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private validateSmtpConnectionConfig(config: any): void {
    if (!config) {
      throw new ValidationError("SMTP connection config is required");
    }

    if (!config.host || typeof config.host !== "string") {
      throw new MissingFieldError("host");
    }

    const hostValidation = ValidationUtils.validateStringLength(
      config.host,
      "Host",
      1,
      255,
    );
    if (!hostValidation.isValid) {
      throw new ValidationError(
        `Invalid host: ${hostValidation.errors.join(", ")}`,
      );
    }

    if (
      typeof config.port !== "number" ||
      config.port < 1 ||
      config.port > 65535
    ) {
      throw new ValidationError("Port must be between 1 and 65535");
    }

    if (config.tls !== undefined && typeof config.tls !== "boolean") {
      throw new ValidationError("TLS must be a boolean");
    }

    if (config.username !== undefined) {
      if (typeof config.username !== "string") {
        throw new ValidationError("Username must be a string");
      }

      const usernameValidation = ValidationUtils.validateStringLength(
        config.username,
        "Username",
        1,
        255,
      );
      if (!usernameValidation.isValid) {
        throw new ValidationError(
          `Invalid username: ${usernameValidation.errors.join(", ")}`,
        );
      }
    }

    if (config.password !== undefined) {
      if (typeof config.password !== "string") {
        throw new ValidationError("Password must be a string");
      }

      const passwordValidation = ValidationUtils.validateStringLength(
        config.password,
        "Password",
        1,
        255,
      );
      if (!passwordValidation.isValid) {
        throw new ValidationError(
          `Invalid password: ${passwordValidation.errors.join(", ")}`,
        );
      }
    }
  }

  private validateExportOptions(options: any): void {
    if (!options) {
      throw new ValidationError("Export options are required");
    }

    const validTypes = ["email", "domain", "queue", "sessions"];
    if (!options.type || !validTypes.includes(options.type)) {
      throw new ValidationError(
        `Type must be one of: ${validTypes.join(", ")}`,
      );
    }

    const validFormats = ["csv", "json", "xlsx"];
    if (!options.format || !validFormats.includes(options.format)) {
      throw new ValidationError(
        `Format must be one of: ${validFormats.join(", ")}`,
      );
    }

    if (options.startDate) {
      const startDateValidation = this.validateDateString(options.startDate);
      if (!startDateValidation.isValid) {
        throw new ValidationError(
          `Invalid startDate: ${startDateValidation.errors.join(", ")}`,
        );
      }
    }

    if (options.endDate) {
      const endDateValidation = this.validateDateString(options.endDate);
      if (!endDateValidation.isValid) {
        throw new ValidationError(
          `Invalid endDate: ${endDateValidation.errors.join(", ")}`,
        );
      }
    }

    if (options.startDate && options.endDate) {
      const start = new Date(options.startDate);
      const end = new Date(options.endDate);

      if (start >= end) {
        throw new ValidationError("startDate must be before endDate");
      }
    }
  }

  private validateCustomReportConfig(config: any): void {
    if (!config) {
      throw new ValidationError("Custom report config is required");
    }

    if (
      !config.metrics ||
      !Array.isArray(config.metrics) ||
      config.metrics.length === 0
    ) {
      throw new ValidationError(
        "Metrics array is required and must not be empty",
      );
    }

    const validMetrics = [
      "emails_sent",
      "emails_delivered",
      "emails_failed",
      "delivery_rate",
      "average_delivery_time",
      "queue_size",
      "active_connections",
      "error_rate",
      "storage_used",
      "user_count",
      "domain_count",
    ];

    for (const metric of config.metrics) {
      if (typeof metric !== "string" || !validMetrics.includes(metric)) {
        throw new ValidationError(
          `Invalid metric: ${metric}. Valid metrics: ${validMetrics.join(", ")}`,
        );
      }
    }

    if (config.groupBy) {
      const validGroupBy = ["hour", "day", "week", "month"];
      if (!validGroupBy.includes(config.groupBy)) {
        throw new ValidationError(
          `Group by must be one of: ${validGroupBy.join(", ")}`,
        );
      }
    }

    if (config.filters) {
      if (typeof config.filters !== "object") {
        throw new ValidationError("Filters must be an object");
      }

      if (config.filters.startDate) {
        const startDateValidation = this.validateDateString(
          config.filters.startDate,
        );
        if (!startDateValidation.isValid) {
          throw new ValidationError(
            `Invalid filter startDate: ${startDateValidation.errors.join(", ")}`,
          );
        }
      }

      if (config.filters.endDate) {
        const endDateValidation = this.validateDateString(
          config.filters.endDate,
        );
        if (!endDateValidation.isValid) {
          throw new ValidationError(
            `Invalid filter endDate: ${endDateValidation.errors.join(", ")}`,
          );
        }
      }
    }
  }
}
