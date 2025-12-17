export interface CommandOption {
  name: string;
  alias?: string;
  description: string;
  required?: boolean;
  defaultValue?: any;
  type?: 'string' | 'number' | 'boolean' | 'array';
}

export interface Command {
  name: string;
  description: string;
  usage: string;
  options?: CommandOption[];
  subcommands?: Record<string, Command>;
  action: (args: any[], options: any) => Promise<void>;
}

export interface CommandContext {
  args: any[];
  options: any;
  config: any;
}

export type OutputFormat = 'table' | 'json' | 'csv' | 'text' | 'prometheus';

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export type UserStatus = 'active' | 'inactive' | 'suspended';

export type ServiceType = 'api' | 'smtp' | 'imap' | 'all';

export type MetricType = 'system' | 'email' | 'users' | 'all';

export type BackupType = 'full' | 'incremental';

export type BackupAction = 'create' | 'list' | 'restore' | 'delete';

export type MigrateAction = 'status' | 'up' | 'down' | 'create';
