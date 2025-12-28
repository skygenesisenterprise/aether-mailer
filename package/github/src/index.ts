import Fastify from "fastify";
import { config } from "./config/index.js";
import { PinoLogger } from "./utils/logger.js";
import { ReleaseHandler } from "./handlers/release.js";
import { AetherMailerService } from "./services/aether-mailer.js";
import { WorkflowOrchestrator } from "./services/workflow-orchestrator.js";
import {
  WebhookSignatureValidator,
  SecurityHeaders,
  RateLimiter,
} from "./core/security.js";

export class AetherGitHubApp {
  private app: any;
  private logger: PinoLogger;
  private signatureValidator: WebhookSignatureValidator;
  private rateLimiter: RateLimiter;
  private releaseHandler: ReleaseHandler;

  constructor() {
    this.logger = PinoLogger.create(config.logLevel);
    this.signatureValidator = new WebhookSignatureValidator(
      config.webhookSecret,
      this.logger,
    );
    this.rateLimiter = new RateLimiter();

    this.app = Fastify({
      logger: true,
      trustProxy: true,
    });

    this.setupServices();
    this.setupRoutes();
    this.setupSecurity();
  }

  private setupServices(): void {
    const mailerService = new AetherMailerService(
      config.aetherMailer,
      this.logger,
    );
    const workflowOrchestrator = new WorkflowOrchestrator(this.logger);

    this.releaseHandler = new ReleaseHandler(
      mailerService,
      workflowOrchestrator,
      this.logger,
    );
  }

  private setupSecurity(): void {
    this.app.addHook(
      "onSend",
      async (request: any, reply: any, payload: any) => {
        SecurityHeaders.addSecurityHeaders(reply.headers);
        return payload;
      },
    );

    this.app.addHook("preHandler", async (request: any, reply: any) => {
      const clientIp = request.headers["x-forwarded-for"] || request.ip;

      if (!this.rateLimiter.isAllowed(clientIp)) {
        reply.code(429).send({ error: "Too many requests" });
        return;
      }
    });
  }

  private setupRoutes(): void {
    this.app.get("/health", async (request: any, reply: any) => {
      return {
        status: "healthy",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
      };
    });

    this.app.post("/webhook", async (request: any, reply: any) => {
      try {
        const rawBody = request.rawBody || JSON.stringify(request.body);
        const signature = request.headers["x-hub-signature-256"];
        const eventName = request.headers["x-github-event"];

        if (!signature) {
          reply.code(401).send({ error: "Missing signature" });
          return;
        }

        if (!eventName) {
          reply.code(400).send({ error: "Missing event header" });
          return;
        }

        if (!this.signatureValidator.validateSignature(rawBody, signature)) {
          reply.code(401).send({ error: "Invalid signature" });
          return;
        }

        const payload =
          typeof rawBody === "string" ? JSON.parse(rawBody) : rawBody;

        this.logger.info("Processing webhook event", {
          event: eventName,
          action: payload.action,
        });

        await this.handleWebhookEvent(eventName, payload);

        reply.code(200).send({ status: "processed" });
      } catch (error) {
        this.logger.error("Webhook processing failed", { error });
        reply.code(500).send({ error: "Internal server error" });
      }
    });

    this.app.get("/webhook/config", async (request: any, reply: any) => {
      return {
        url: `${config.baseUrl}/webhook`,
        content_type: "json",
        insecure_ssl: "0",
        secret: config.webhookSecret ? "configured" : "not_configured",
      };
    });

    this.app.get("/app/info", async (request: any, reply: any) => {
      return {
        name: "Aether GitHub App",
        version: "1.0.0",
        description:
          "Release orchestration and notifications for Aether ecosystem",
        features: [
          "Release type detection",
          "Workflow orchestration",
          "Aether Mailer integration",
          "Multi-target releases",
        ],
      };
    });
  }

  private async handleWebhookEvent(
    eventName: string,
    payload: any,
  ): Promise<void> {
    switch (eventName) {
      case "release":
        await this.handleReleaseEvent(payload);
        break;

      case "ping":
        this.logger.info("Ping event received");
        break;

      default:
        this.logger.debug("Unhandled event type", { event: eventName });
    }
  }

  private async handleReleaseEvent(payload: any): Promise<void> {
    const action = payload.action;

    switch (action) {
      case "published":
        await this.releaseHandler.handleReleasePublished(payload);
        break;

      case "created":
        await this.releaseHandler.handleReleaseCreated(payload);
        break;

      case "edited":
        await this.releaseHandler.handleReleaseEdited(payload);
        break;

      default:
        this.logger.debug("Unhandled release action", { action });
    }
  }

  async start(): Promise<void> {
    try {
      await this.app.listen({
        port: config.port || 3000,
        host: config.host || "0.0.0.0",
      });

      this.logger.info("Aether GitHub App started", {
        port: config.port,
        host: config.host,
        environment: process.env["NODE_ENV"] || "development",
      });
    } catch (error) {
      this.logger.error("Failed to start server", { error });
      process.exit(1);
    }
  }

  async stop(): Promise<void> {
    try {
      await this.app.close();
      this.logger.info("Aether GitHub App stopped gracefully");
    } catch (error) {
      this.logger.error("Error during shutdown", { error });
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const app = new AetherGitHubApp();

  process.on("SIGTERM", async () => {
    await app.stop();
    process.exit(0);
  });

  process.on("SIGINT", async () => {
    await app.stop();
    process.exit(0);
  });

  app.start().catch((error) => {
    console.error("Failed to start application:", error);
    process.exit(1);
  });
}
