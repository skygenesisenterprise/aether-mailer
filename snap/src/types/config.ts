export interface ServerConfig {
  url: string;
  token?: string;
  timeout: number;
}

export interface CLIConfig {
  defaultFormat: string;
  confirmDestructive: boolean;
  logLevel: string;
}

export interface OutputConfig {
  colors: boolean;
  pager: boolean;
  timestamp: boolean;
}

export interface MailerConfig {
  server: ServerConfig;
  cli: CLIConfig;
  output: OutputConfig;
}

export const DEFAULT_CONFIG: MailerConfig = {
  server: {
    url: 'http://localhost:8080',
    timeout: 30000,
  },
  cli: {
    defaultFormat: 'table',
    confirmDestructive: true,
    logLevel: 'info',
  },
  output: {
    colors: true,
    pager: true,
    timestamp: false,
  },
};
