export type ReleaseType = "general" | "mobile" | "desktop" | "cloud" | "sdk";

export interface ReleaseMetadata {
  type: ReleaseType;
  targets: ReleaseType[];
  version: string;
  tag: string;
  name: string;
  prerelease: boolean;
  draft: boolean;
}

export interface WebhookEvent {
  id: string;
  name: string;
  payload: unknown;
}

export interface AetherNotification {
  type: "release_published" | "build_failure" | "invalid_metadata";
  repository: string;
  release?: ReleaseMetadata;
  error?: string;
  timestamp: Date;
}

export interface GitHubAppConfig {
  appId: number;
  privateKey: string;
  webhookSecret: string;
  baseUrl?: string;
  logLevel?: "debug" | "info" | "warn" | "error";
}

export interface AetherMailerConfig {
  apiUrl: string;
  apiKey: string;
  fromAddress: string;
  recipients: string[];
}

export interface AppConfig extends GitHubAppConfig {
  aetherMailer: AetherMailerConfig;
  port?: number;
  host?: string;
}
