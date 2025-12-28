import type { AetherNotification, AetherMailerConfig } from "../types/index.js";
import { Logger } from "../utils/logger.js";

export class AetherMailerService {
  constructor(
    private readonly config: AetherMailerConfig,
    private readonly logger: Logger,
  ) {}

  async sendReleaseNotification(
    notification: AetherNotification,
  ): Promise<void> {
    try {
      const payload = this.buildReleasePayload(notification);

      await this.sendEmail({
        subject: `Release Published: ${notification.release?.version} - ${notification.repository}`,
        template: "release-published",
        data: payload,
      });

      this.logger.info("Release notification sent", {
        repository: notification.repository,
        version: notification.release?.version,
      });
    } catch (error) {
      this.logger.error("Failed to send release notification", {
        error,
        notification,
      });
      throw error;
    }
  }

  async sendPrereleaseNotification(
    notification: AetherNotification,
  ): Promise<void> {
    try {
      const payload = this.buildReleasePayload(notification);

      await this.sendEmail({
        subject: `[Pre-release] ${notification.release?.version} - ${notification.repository}`,
        template: "prerelease-published",
        data: payload,
      });

      this.logger.info("Prerelease notification sent", {
        repository: notification.repository,
        version: notification.release?.version,
      });
    } catch (error) {
      this.logger.error("Failed to send prerelease notification", {
        error,
        notification,
      });
      throw error;
    }
  }

  async sendBuildFailureNotification(
    notification: AetherNotification,
  ): Promise<void> {
    try {
      const payload = {
        repository: notification.repository,
        error: notification.error,
        timestamp: notification.timestamp,
        release: notification.release,
      };

      await this.sendEmail({
        subject: `Build Failure - ${notification.repository}`,
        template: "build-failure",
        data: payload,
      });

      this.logger.info("Build failure notification sent", {
        repository: notification.repository,
      });
    } catch (error) {
      this.logger.error("Failed to send build failure notification", {
        error,
        notification,
      });
      throw error;
    }
  }

  async sendInvalidMetadataNotification(
    notification: AetherNotification,
  ): Promise<void> {
    try {
      const payload = {
        repository: notification.repository,
        error: notification.error,
        timestamp: notification.timestamp,
        release: notification.release,
      };

      await this.sendEmail({
        subject: `Invalid Release Metadata - ${notification.repository}`,
        template: "invalid-metadata",
        data: payload,
      });

      this.logger.info("Invalid metadata notification sent", {
        repository: notification.repository,
      });
    } catch (error) {
      this.logger.error("Failed to send invalid metadata notification", {
        error,
        notification,
      });
      throw error;
    }
  }

  private buildReleasePayload(notification: AetherNotification) {
    return {
      repository: notification.repository,
      release: notification.release,
      timestamp: notification.timestamp,
      targets: notification.release?.targets || [],
      type: notification.release?.type || "general",
    };
  }

  private async sendEmail(data: {
    subject: string;
    template: string;
    data: unknown;
  }): Promise<void> {
    const emailPayload = {
      from: this.config.fromAddress,
      to: this.config.recipients,
      subject: data.subject,
      template: data.template,
      templateData: data.data,
      timestamp: new Date().toISOString(),
    };

    const response = await fetch(this.config.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
        "User-Agent": "Aether-GitHub-App/1.0.0",
      },
      body: JSON.stringify(emailPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Aether Mailer API error: ${response.status} - ${errorText}`,
      );
    }

    this.logger.debug("Email sent successfully", { template: data.template });
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.apiUrl}/health`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          "User-Agent": "Aether-GitHub-App/1.0.0",
        },
      });

      return response.ok;
    } catch (error) {
      this.logger.error("Aether Mailer connection test failed", { error });
      return false;
    }
  }
}
