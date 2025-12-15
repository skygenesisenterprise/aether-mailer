import { ServiceConfig } from "./types";

class ConfigManager {
  private static instance: ConfigManager;
  private config: ServiceConfig;
  private envVars: Record<string, string>;

  private constructor() {
    this.envVars = process.env as Record<string, string>;
    this.config = this.loadConfig();
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  private loadConfig(): ServiceConfig {
    return {
      smtp: {
        port: this.getInt("SMTP_PORT", 25),
        host: this.getString("SMTP_HOST", "0.0.0.0"),
        tls: this.getBool("SMTP_TLS", false),
        maxConnections: this.getInt("SMTP_MAX_CONNECTIONS", 100),
        timeout: this.getInt("SMTP_TIMEOUT", 30000),
        enableStartTls: this.getBool("SMTP_STARTTLS", true),
        certificatePath: this.getString("SMTP_CERT_PATH"),
        keyPath: this.getString("SMTP_KEY_PATH"),
      },
      imap: {
        port: this.getInt("IMAP_PORT", 143),
        host: this.getString("IMAP_HOST", "0.0.0.0"),
        tls: this.getBool("IMAP_TLS", false),
        maxConnections: this.getInt("IMAP_MAX_CONNECTIONS", 100),
        timeout: this.getInt("IMAP_TIMEOUT", 30000),
        enableStartTls: this.getBool("IMAP_STARTTLS", true),
        certificatePath: this.getString("IMAP_CERT_PATH"),
        keyPath: this.getString("IMAP_KEY_PATH"),
      },
      pop3: {
        port: this.getInt("POP3_PORT", 110),
        host: this.getString("POP3_HOST", "0.0.0.0"),
        tls: this.getBool("POP3_TLS", false),
        maxConnections: this.getInt("POP3_MAX_CONNECTIONS", 50),
        timeout: this.getInt("POP3_TIMEOUT", 30000),
        enableStartTls: this.getBool("POP3_STARTTLS", true),
      },
      jmap: {
        port: this.getInt("JMAP_PORT", 80),
        host: this.getString("JMAP_HOST", "0.0.0.0"),
        tls: this.getBool("JMAP_TLS", false),
        maxConnections: this.getInt("JMAP_MAX_CONNECTIONS", 100),
        timeout: this.getInt("JMAP_TIMEOUT", 30000),
        enableWebSocket: this.getBool("JMAP_WEBSOCKET", true),
      },
      database: {
        url: this.getString(
          "DATABASE_URL",
          "postgresql://localhost:5432/aether_mailer",
        ),
        poolSize: this.getInt("DB_POOL_SIZE", 20),
        connectionTimeout: this.getInt("DB_CONNECTION_TIMEOUT", 10000),
        ssl: this.getBool("DB_SSL", false),
      },
      redis: {
        url: this.getString("REDIS_URL", "redis://localhost:6379"),
        maxRetries: this.getInt("REDIS_MAX_RETRIES", 3),
        retryDelay: this.getInt("REDIS_RETRY_DELAY", 1000),
      },
      security: {
        spamFilter: this.getBool("SECURITY_SPAM_FILTER", true),
        virusScan: this.getBool("SECURITY_VIRUS_SCAN", true),
        dkimSigning: this.getBool("SECURITY_DKIM_SIGNING", true),
        spfValidation: this.getBool("SECURITY_SPF_VALIDATION", true),
        dmarcAnalysis: this.getBool("SECURITY_DMARC_ANALYSIS", true),
        maxMessageSize: this.getInt(
          "SECURITY_MAX_MESSAGE_SIZE",
          50 * 1024 * 1024,
        ), // 50MB
        maxRecipients: this.getInt("SECURITY_MAX_RECIPIENTS", 100),
      },
      queue: {
        maxRetries: this.getInt("QUEUE_MAX_RETRIES", 3),
        retryDelay: this.getInt("QUEUE_RETRY_DELAY", 5000),
        deadLetterRetention: this.getInt(
          "QUEUE_DEAD_LETTER_RETENTION",
          7 * 24 * 60 * 60 * 1000,
        ), // 7 days
        priorityLevels: this.getInt("QUEUE_PRIORITY_LEVELS", 3),
      },
      logging: {
        level: this.getString("LOG_LEVEL", "info") as
          | "debug"
          | "info"
          | "warn"
          | "error",
        format: this.getString("LOG_FORMAT", "json") as "json" | "text",
        enableCorrelationId: this.getBool("LOG_CORRELATION_ID", true),
      },
      monitoring: {
        enableMetrics: this.getBool("MONITORING_METRICS", true),
        enableHealthChecks: this.getBool("MONITORING_HEALTH_CHECKS", true),
        healthCheckInterval: this.getInt(
          "MONITORING_HEALTH_CHECK_INTERVAL",
          30000,
        ),
      },
    };
  }

  public getConfig(): ServiceConfig {
    return this.config;
  }

  public getSmtpConfig() {
    return this.config.smtp;
  }

  public getImapConfig() {
    return this.config.imap;
  }

  public getPop3Config() {
    return this.config.pop3;
  }

  public getJmapConfig() {
    return this.config.jmap;
  }

  public getDatabaseConfig() {
    return this.config.database;
  }

  public getRedisConfig() {
    return this.config.redis;
  }

  public getSecurityConfig() {
    return this.config.security;
  }

  public getQueueConfig() {
    return this.config.queue;
  }

  public getLoggingConfig() {
    return this.config.logging;
  }

  public getMonitoringConfig() {
    return this.config.monitoring;
  }

  private getString(key: string, defaultValue?: string): string {
    return this.envVars[key] || defaultValue || "";
  }

  private getInt(key: string, defaultValue: number): number {
    const value = this.envVars[key];
    return value ? parseInt(value, 10) : defaultValue;
  }

  private getBool(key: string, defaultValue: boolean): boolean {
    const value = this.envVars[key];
    return value ? value.toLowerCase() === "true" : defaultValue;
  }

  public reloadConfig(): void {
    this.config = this.loadConfig();
  }

  public validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.config.database.url) {
      errors.push("DATABASE_URL is required");
    }

    if (!this.config.redis.url) {
      errors.push("REDIS_URL is required");
    }

    if (this.config.smtp.port < 1 || this.config.smtp.port > 65535) {
      errors.push("SMTP_PORT must be between 1 and 65535");
    }

    if (this.config.imap.port < 1 || this.config.imap.port > 65535) {
      errors.push("IMAP_PORT must be between 1 and 65535");
    }

    if (this.config.pop3.port < 1 || this.config.pop3.port > 65535) {
      errors.push("POP3_PORT must be between 1 and 65535");
    }

    if (this.config.jmap.port < 1 || this.config.jmap.port > 65535) {
      errors.push("JMAP_PORT must be between 1 and 65535");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export default ConfigManager;
