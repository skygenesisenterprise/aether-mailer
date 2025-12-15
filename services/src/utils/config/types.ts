export interface ServiceConfig {
  smtp: {
    port: number;
    host: string;
    tls: boolean;
    maxConnections: number;
    timeout: number;
    enableStartTls: boolean;
    certificatePath?: string;
    keyPath?: string;
  };
  imap: {
    port: number;
    host: string;
    tls: boolean;
    maxConnections: number;
    timeout: number;
    enableStartTls: boolean;
    certificatePath?: string;
    keyPath?: string;
  };
  pop3: {
    port: number;
    host: string;
    tls: boolean;
    maxConnections: number;
    timeout: number;
    enableStartTls: boolean;
  };
  jmap: {
    port: number;
    host: string;
    tls: boolean;
    maxConnections: number;
    timeout: number;
    enableWebSocket: boolean;
  };
  database: {
    url: string;
    poolSize: number;
    connectionTimeout: number;
    ssl: boolean;
  };
  redis: {
    url: string;
    maxRetries: number;
    retryDelay: number;
  };
  security: {
    spamFilter: boolean;
    virusScan: boolean;
    dkimSigning: boolean;
    spfValidation: boolean;
    dmarcAnalysis: boolean;
    maxMessageSize: number;
    maxRecipients: number;
  };
  queue: {
    maxRetries: number;
    retryDelay: number;
    deadLetterRetention: number;
    priorityLevels: number;
  };
  logging: {
    level: "debug" | "info" | "warn" | "error";
    format: "json" | "text";
    enableCorrelationId: boolean;
  };
  monitoring: {
    enableMetrics: boolean;
    enableHealthChecks: boolean;
    healthCheckInterval: number;
  };
}

export interface SmtpConfig {
  port: number;
  host: string;
  tls: boolean;
  maxConnections: number;
  timeout: number;
  enableStartTls: boolean;
  certificatePath?: string;
  keyPath?: string;
}

export interface ImapConfig {
  port: number;
  host: string;
  tls: boolean;
  maxConnections: number;
  timeout: number;
  enableStartTls: boolean;
  certificatePath?: string;
  keyPath?: string;
}

export interface DatabaseConfig {
  url: string;
  poolSize: number;
  connectionTimeout: number;
  ssl: boolean;
}

export interface SecurityConfig {
  spamFilter: boolean;
  virusScan: boolean;
  dkimSigning: boolean;
  spfValidation: boolean;
  dmarcAnalysis: boolean;
  maxMessageSize: number;
  maxRecipients: number;
}
