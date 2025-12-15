import ConfigManager from "../../utils/config";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  service: string;
  correlationId?: string;
  metadata?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export type LogLevel = "debug" | "info" | "warn" | "error";

export class Logger {
  private static instance: Logger;
  private config: ConfigManager;
  private service: string;

  private constructor(service: string) {
    this.config = ConfigManager.getInstance();
    this.service = service;
  }

  public static getInstance(service: string): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(service);
    }
    return Logger.instance;
  }

  private shouldLog(level: LogLevel): boolean {
    const configLevel = this.config.getLoggingConfig().level;
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };
    return levels[level] >= levels[configLevel];
  }

  private formatLogEntry(
    level: LogLevel,
    message: string,
    correlationId?: string,
    metadata?: Record<string, any>,
    error?: Error,
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.service,
    };

    if (correlationId && this.config.getLoggingConfig().enableCorrelationId) {
      entry.correlationId = correlationId;
    }

    if (metadata) {
      entry.metadata = metadata;
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    return entry;
  }

  private output(entry: LogEntry): void {
    const format = this.config.getLoggingConfig().format;

    if (format === "json") {
      console.log(JSON.stringify(entry));
    } else {
      const parts = [
        `[${entry.timestamp}]`,
        `[${entry.level.toUpperCase()}]`,
        `[${entry.service}]`,
      ];

      if (entry.correlationId) {
        parts.push(`[${entry.correlationId}]`);
      }

      parts.push(entry.message);

      let output = parts.join(" ");

      if (entry.metadata) {
        output += ` | Metadata: ${JSON.stringify(entry.metadata)}`;
      }

      if (entry.error) {
        output += `\nError: ${entry.error.name}: ${entry.error.message}`;
        if (entry.error.stack) {
          output += `\nStack: ${entry.error.stack}`;
        }
      }

      console.log(output);
    }
  }

  public debug(
    message: string,
    correlationId?: string,
    metadata?: Record<string, any>,
  ): void {
    if (!this.shouldLog("debug")) return;
    const entry = this.formatLogEntry(
      "debug",
      message,
      correlationId,
      metadata,
    );
    this.output(entry);
  }

  public info(
    message: string,
    correlationId?: string,
    metadata?: Record<string, any>,
  ): void {
    if (!this.shouldLog("info")) return;
    const entry = this.formatLogEntry("info", message, correlationId, metadata);
    this.output(entry);
  }

  public warn(
    message: string,
    correlationId?: string,
    metadata?: Record<string, any>,
  ): void {
    if (!this.shouldLog("warn")) return;
    const entry = this.formatLogEntry("warn", message, correlationId, metadata);
    this.output(entry);
  }

  public error(
    message: string,
    error?: Error,
    correlationId?: string,
    metadata?: Record<string, any>,
  ): void {
    if (!this.shouldLog("error")) return;
    const entry = this.formatLogEntry(
      "error",
      message,
      correlationId,
      metadata,
      error,
    );
    this.output(entry);
  }

  public logConnection(
    clientId: string,
    protocol: string,
    action: "connect" | "disconnect",
  ): void {
    this.info(`${action} client`, undefined, {
      clientId,
      protocol,
      action,
      timestamp: new Date().toISOString(),
    });
  }

  public logEmail(
    messageId: string,
    action: "received" | "sent" | "failed" | "queued",
    from?: string,
    to?: string[],
  ): void {
    this.info(`Email ${action}`, undefined, {
      messageId,
      action,
      from,
      to,
      timestamp: new Date().toISOString(),
    });
  }

  public logSecurity(
    event: string,
    details: Record<string, any>,
    severity: "low" | "medium" | "high" = "medium",
  ): void {
    const level =
      severity === "high" ? "error" : severity === "medium" ? "warn" : "info";
    const metadata = {
      event,
      severity,
      ...details,
      timestamp: new Date().toISOString(),
    };

    if (level === "error") {
      this.error(`Security event: ${event}`, undefined, undefined, metadata);
    } else if (level === "warn") {
      this.warn(`Security event: ${event}`, undefined, metadata);
    } else {
      this.info(`Security event: ${event}`, undefined, metadata);
    }
  }

  public logPerformance(
    operation: string,
    duration: number,
    metadata?: Record<string, any>,
  ): void {
    this.info(`Performance: ${operation}`, undefined, {
      operation,
      duration,
      unit: "ms",
      ...metadata,
      timestamp: new Date().toISOString(),
    });
  }

  public logHealthCheck(
    service: string,
    status: "healthy" | "unhealthy",
    details?: Record<string, any>,
  ): void {
    const level = status === "healthy" ? "info" : "error";
    const metadata = {
      service,
      status,
      ...details,
      timestamp: new Date().toISOString(),
    };

    if (level === "error") {
      this.error(`Health check: ${service}`, undefined, undefined, metadata);
    } else {
      this.info(`Health check: ${service}`, undefined, metadata);
    }
  }
}

export class LoggerFactory {
  private static loggers: Map<string, Logger> = new Map();

  public static getLogger(service: string): Logger {
    if (!this.loggers.has(service)) {
      this.loggers.set(service, Logger.getInstance(service));
    }
    return this.loggers.get(service)!;
  }
}

export default LoggerFactory;
