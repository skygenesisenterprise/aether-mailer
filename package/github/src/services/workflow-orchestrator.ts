import type { ReleaseMetadata } from "../types/index.js";
import { Logger } from "../utils/logger.js";

interface WorkflowPayload {
  repository: string;
  release: ReleaseMetadata;
  actor: string;
  timestamp: Date;
}

export class WorkflowOrchestrator {
  constructor(private readonly logger: Logger) {}

  async triggerWorkflows(
    metadata: ReleaseMetadata,
    payload: any,
  ): Promise<void> {
    const workflows = this.getWorkflowsForTargets(metadata.targets);

    this.logger.info("Triggering workflows", {
      targets: metadata.targets,
      workflows: workflows.map((w) => w.name),
    });

    for (const workflow of workflows) {
      try {
        await this.triggerWorkflow(workflow, metadata, payload);
      } catch (error) {
        this.logger.error(`Failed to trigger workflow: ${workflow.name}`, {
          error,
        });
        // Continue with other workflows
      }
    }
  }

  async triggerPrereleaseWorkflows(
    metadata: ReleaseMetadata,
    payload: any,
  ): Promise<void> {
    const workflows = this.getPrereleaseWorkflows(metadata.targets);

    this.logger.info("Triggering prerelease workflows", {
      targets: metadata.targets,
      workflows: workflows.map((w) => w.name),
    });

    for (const workflow of workflows) {
      try {
        await this.triggerWorkflow(workflow, metadata, payload);
      } catch (error) {
        this.logger.error(
          `Failed to trigger prerelease workflow: ${workflow.name}`,
          { error },
        );
      }
    }
  }

  private getWorkflowsForTargets(targets: string[]): Workflow[] {
    const workflows: Workflow[] = [];

    for (const target of targets) {
      switch (target) {
        case "mobile":
          workflows.push(
            { name: "mobile-build.yml", inputs: { platform: "all" } },
            { name: "mobile-deploy.yml", inputs: { environment: "staging" } },
          );
          break;

        case "desktop":
          workflows.push(
            {
              name: "desktop-build.yml",
              inputs: { platforms: "windows,macos,linux" },
            },
            { name: "desktop-package.yml", inputs: { format: "all" } },
          );
          break;

        case "cloud":
          workflows.push(
            { name: "cloud-deploy.yml", inputs: { environment: "production" } },
            { name: "infrastructure-update.yml", inputs: {} },
          );
          break;

        case "sdk":
          workflows.push(
            { name: "sdk-build.yml", inputs: {} },
            { name: "package-publish.yml", inputs: { tag: "latest" } },
          );
          break;

        case "general":
          workflows.push({ name: "general-release.yml", inputs: {} });
          break;
      }
    }

    // Remove duplicates
    const uniqueWorkflows = workflows.filter(
      (workflow, index, self) =>
        index === self.findIndex((w) => w.name === workflow.name),
    );

    return uniqueWorkflows;
  }

  private getPrereleaseWorkflows(targets: string[]): Workflow[] {
    const workflows: Workflow[] = [];

    for (const target of targets) {
      switch (target) {
        case "mobile":
          workflows.push({
            name: "mobile-build-prerelease.yml",
            inputs: { platform: "all" },
          });
          break;

        case "desktop":
          workflows.push({
            name: "desktop-build-prerelease.yml",
            inputs: { platforms: "windows,macos,linux" },
          });
          break;

        case "cloud":
          workflows.push({
            name: "cloud-deploy-staging.yml",
            inputs: { environment: "staging" },
          });
          break;

        case "sdk":
          workflows.push(
            { name: "sdk-build-prerelease.yml", inputs: {} },
            { name: "package-publish-beta.yml", inputs: { tag: "beta" } },
          );
          break;
      }
    }

    return workflows;
  }

  private async triggerWorkflow(
    workflow: Workflow,
    metadata: ReleaseMetadata,
    payload: any,
  ): Promise<void> {
    const [owner, repo] = payload.repository.full_name.split("/");

    const workflowPayload: WorkflowPayload = {
      repository: payload.repository.full_name,
      release: metadata,
      actor: payload.sender.login,
      timestamp: new Date(),
    };

    // This would use GitHub API to trigger workflow dispatch
    // For now, we'll simulate the call
    this.logger.info("Triggering workflow", {
      workflow: workflow.name,
      repository: payload.repository.full_name,
      inputs: workflow.inputs,
    });

    // In a real implementation, you would use Octokit to call:
    // await octokit.rest.actions.createWorkflowDispatch({
    //   owner,
    //   repo,
    //   workflow_id: workflow.name,
    //   inputs: workflow.inputs
    // });
  }

  async validateWorkflows(metadata: ReleaseMetadata): Promise<string[]> {
    const errors: string[] = [];
    const workflows = this.getWorkflowsForTargets(metadata.targets);

    // Check if required workflows exist
    for (const target of metadata.targets) {
      const requiredWorkflows = this.getRequiredWorkflows(target);

      for (const required of requiredWorkflows) {
        const exists = workflows.some((w) => w.name === required);
        if (!exists) {
          errors.push(
            `Required workflow '${required}' not found for target '${target}'`,
          );
        }
      }
    }

    return errors;
  }

  private getRequiredWorkflows(target: string): string[] {
    const required: Record<string, string[]> = {
      mobile: ["mobile-build.yml"],
      desktop: ["desktop-build.yml"],
      cloud: ["cloud-deploy.yml"],
      sdk: ["sdk-build.yml"],
      general: ["general-release.yml"],
    };

    return required[target] || [];
  }
}

interface Workflow {
  name: string;
  inputs: Record<string, string>;
}
