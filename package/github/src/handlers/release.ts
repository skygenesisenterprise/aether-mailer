import type { ReleaseMetadata } from "../types/index.js";
import { ReleaseDetector } from "../core/release-detector.js";
import { AetherMailerService } from "../services/aether-mailer.js";
import { WorkflowOrchestrator } from "../services/workflow-orchestrator.js";
import { Logger } from "../utils/logger.js";

interface ReleaseEventPayload {
  action: "published" | "created" | "edited" | "deleted" | "prereleased";
  release: {
    id: number;
    name: string;
    tag_name: string;
    draft: boolean;
    prerelease: boolean;
    html_url: string;
    assets: Array<{
      name: string;
      browser_download_url: string;
    }>;
  };
  repository: {
    id: number;
    name: string;
    full_name: string;
    html_url: string;
    owner: {
      login: string;
      id: number;
    };
  };
  sender: {
    login: string;
    id: number;
  };
}

export class ReleaseHandler {
  constructor(
    private readonly mailerService: AetherMailerService,
    private readonly workflowOrchestrator: WorkflowOrchestrator,
    private readonly logger: Logger,
  ) {}

  async handleReleasePublished(payload: ReleaseEventPayload): Promise<void> {
    try {
      this.logger.info("Processing release published event", {
        repository: payload.repository.full_name,
        release: payload.release.name,
        tag: payload.release.tag_name,
      });

      // Detect release type and metadata
      const releaseMetadata = ReleaseDetector.detectReleaseType(
        payload.release.tag_name,
        payload.release.name,
      );

      // Validate metadata
      ReleaseDetector.validateReleaseMetadata(releaseMetadata);

      this.logger.info("Release metadata detected", {
        type: releaseMetadata.type,
        targets: releaseMetadata.targets,
        version: releaseMetadata.version,
      });

      // Trigger appropriate workflows
      await this.workflowOrchestrator.triggerWorkflows(
        releaseMetadata,
        payload,
      );

      // Send notification
      await this.mailerService.sendReleaseNotification({
        type: "release_published",
        repository: payload.repository.full_name,
        release: releaseMetadata,
        timestamp: new Date(),
      });

      // Optionally annotate the release
      await this.annotateRelease(
        payload.repository.full_name,
        payload.release.id,
        releaseMetadata,
      );

      this.logger.info("Release processing completed successfully");
    } catch (error) {
      this.logger.error("Failed to process release", { error, payload });

      // Send failure notification
      await this.mailerService.sendBuildFailureNotification({
        type: "build_failure",
        repository: payload.repository.full_name,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date(),
      });

      throw error;
    }
  }

  async handleReleaseCreated(payload: ReleaseEventPayload): Promise<void> {
    // Handle draft releases or pre-releases differently
    if (payload.release.draft) {
      this.logger.info("Draft release created, skipping processing", {
        repository: payload.repository.full_name,
        release: payload.release.name,
      });
      return;
    }

    // For pre-releases, we might want different behavior
    if (payload.release.prerelease) {
      await this.handlePrerelease(payload);
      return;
    }

    // Treat as published release
    await this.handleReleasePublished(payload);
  }

  async handleReleaseEdited(payload: ReleaseEventPayload): Promise<void> {
    this.logger.info("Release edited, checking for changes", {
      repository: payload.repository.full_name,
      release: payload.release.name,
    });

    // Re-process if the release was converted from draft to published
    if (!payload.release.draft) {
      await this.handleReleasePublished(payload);
    }
  }

  private async handlePrerelease(payload: ReleaseEventPayload): Promise<void> {
    this.logger.info("Processing prerelease", {
      repository: payload.repository.full_name,
      release: payload.release.name,
      tag: payload.release.tag_name,
    });

    const releaseMetadata = ReleaseDetector.detectReleaseType(
      payload.release.tag_name,
      payload.release.name,
    );

    // Trigger prerelease-specific workflows
    await this.workflowOrchestrator.triggerPrereleaseWorkflows(
      releaseMetadata,
      payload,
    );

    // Send prerelease notification
    await this.mailerService.sendPrereleaseNotification({
      type: "release_published",
      repository: payload.repository.full_name,
      release: releaseMetadata,
      timestamp: new Date(),
    });
  }

  private async annotateRelease(
    repositoryFullName: string,
    releaseId: number,
    metadata: ReleaseMetadata,
  ): Promise<void> {
    try {
      // In a real implementation, this would use GitHub API to add a comment
      // For now, we'll just log the annotation
      this.logger.info("Release annotated successfully", {
        repository: repositoryFullName,
        releaseId,
        metadata: {
          type: metadata.type,
          targets: metadata.targets,
          version: metadata.version,
        },
      });
    } catch (error) {
      this.logger.warn("Failed to annotate release", {
        error,
        repositoryFullName,
        releaseId,
      });
      // Don't throw - annotation is optional
    }
  }

  private generateReleaseComment(metadata: ReleaseMetadata): string {
    const targets = metadata.targets
      .map((target) => `\`${target}\``)
      .join(", ");
    const typeEmoji = this.getTypeEmoji(metadata.type);

    return `${typeEmoji} **Aether Release Analysis**

**Type:** \`${metadata.type}\`
**Targets:** ${targets}
**Version:** \`${metadata.version}\`
**Prerelease:** ${metadata.prerelease ? "Yes" : "No"}

---

*Detected by Aether GitHub App*`;
  }

  private getTypeEmoji(type: string): string {
    const emojis: Record<string, string> = {
      general: "🚀",
      mobile: "📱",
      desktop: "🖥️",
      cloud: "☁️",
      sdk: "📦",
    };
    return emojis[type] || "🚀";
  }
}
