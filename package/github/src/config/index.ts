import dotenv from "dotenv";
import type { AppConfig } from "../types/index.js";

// Load environment variables
dotenv.config();

export const config: AppConfig = {
  // GitHub App configuration
  appId: parseInt(process.env.GITHUB_APP_ID || "0", 10),
  privateKey: process.env.GITHUB_APP_PRIVATE_KEY || "",
  webhookSecret: process.env.GITHUB_WEBHOOK_SECRET || "",

  // Server configuration
  port: parseInt(process.env.PORT || "3000", 10),
  host: process.env.HOST || "0.0.0.0",
  baseUrl: process.env.BASE_URL || "http://localhost:3000",
  logLevel:
    (process.env.LOG_LEVEL as "debug" | "info" | "warn" | "error") || "info",

  // Aether Mailer configuration
  aetherMailer: {
    apiUrl:
      process.env.AETHER_MAILER_API_URL || "http://localhost:8080/api/send",
    apiKey: process.env.AETHER_MAILER_API_KEY || "",
    fromAddress: process.env.AETHER_MAILER_FROM || "noreply@aether.com",
    recipients: process.env.AETHER_MAILER_RECIPIENTS?.split(",") || [
      "team@aether.com",
    ],
  },
};

// Validate required configuration
export function validateConfig(): void {
  const errors: string[] = [];

  if (!config.appId) {
    errors.push("GITHUB_APP_ID is required");
  }

  if (!config.privateKey) {
    errors.push("GITHUB_APP_PRIVATE_KEY is required");
  }

  if (!config.webhookSecret) {
    errors.push("GITHUB_WEBHOOK_SECRET is required");
  }

  if (!config.aetherMailer.apiUrl) {
    errors.push("AETHER_MAILER_API_URL is required");
  }

  if (!config.aetherMailer.apiKey) {
    errors.push("AETHER_MAILER_API_KEY is required");
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join("\n")}`);
  }
}
