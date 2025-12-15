import { EventEmitter } from "events";
import ConfigManager from "./utils/config";
import DatabaseManager from "./utils/database";
import { Logger } from "./monitoring/logging";

export interface ServiceStatus {
  name: string;
  status: "starting" | "running" | "stopping" | "stopped" | "error";
  startTime?: Date;
  lastHealthCheck?: Date;
  error?: string;
}

export class ServiceManager extends EventEmitter {
  private static instance: ServiceManager;
  private services: Map<string, any> = new Map();
  private serviceStatuses: Map<string, ServiceStatus> = new Map();
  private config: ConfigManager;
  private database: DatabaseManager;
  private logger: Logger;
  private isShuttingDown = false;

  private constructor() {
    super();
    this.config = ConfigManager.getInstance();
    this.database = DatabaseManager.getInstance();
    this.logger = Logger.getInstance("ServiceManager");
    this.setupGracefulShutdown();
  }

  public static getInstance(): ServiceManager {
    if (!ServiceManager.instance) {
      ServiceManager.instance = new ServiceManager();
    }
    return ServiceManager.instance;
  }

  public async initialize(): Promise<void> {
    this.logger.info("Initializing service manager...");

    try {
      const validation = this.config.validateConfig();
      if (!validation.valid) {
        throw new Error(
          `Configuration validation failed: ${validation.errors.join(", ")}`,
        );
      }

      await this.database.connect();
      this.logger.info("Database connected successfully");

      this.emit("initialized");
      this.logger.info("Service manager initialized successfully");
    } catch (error) {
      this.logger.error("Failed to initialize service manager", error as Error);
      throw error;
    }
  }

  public async startService(serviceName: string): Promise<void> {
    if (this.isShuttingDown) {
      throw new Error("Cannot start service during shutdown");
    }

    this.logger.info(`Starting service: ${serviceName}`);
    this.updateServiceStatus(serviceName, "starting");

    try {
      switch (serviceName) {
        case "smtp":
          await this.startSmtpService();
          break;
        case "imap":
          await this.startImapService();
          break;
        case "pop3":
          await this.startPop3Service();
          break;
        case "jmap":
          await this.startJmapService();
          break;
        case "queue":
          await this.startQueueService();
          break;
        case "security":
          await this.startSecurityService();
          break;
        default:
          throw new Error(`Unknown service: ${serviceName}`);
      }

      this.updateServiceStatus(serviceName, "running", new Date());
      this.logger.info(`Service started successfully: ${serviceName}`);
      this.emit("serviceStarted", serviceName);
    } catch (error) {
      this.updateServiceStatus(
        serviceName,
        "error",
        undefined,
        (error as Error).message,
      );
      this.logger.error(
        `Failed to start service: ${serviceName}`,
        error as Error,
      );
      this.emit("serviceError", serviceName, error);
      throw error;
    }
  }

  public async stopService(serviceName: string): Promise<void> {
    this.logger.info(`Stopping service: ${serviceName}`);
    this.updateServiceStatus(serviceName, "stopping");

    try {
      const service = this.services.get(serviceName);
      if (service && typeof service.stop === "function") {
        await service.stop();
      }

      this.services.delete(serviceName);
      this.updateServiceStatus(serviceName, "stopped");
      this.logger.info(`Service stopped successfully: ${serviceName}`);
      this.emit("serviceStopped", serviceName);
    } catch (error) {
      this.updateServiceStatus(
        serviceName,
        "error",
        undefined,
        (error as Error).message,
      );
      this.logger.error(
        `Failed to stop service: ${serviceName}`,
        error as Error,
      );
      throw error;
    }
  }

  public async startAllServices(): Promise<void> {
    this.logger.info("Starting all services...");

    const services = ["smtp", "imap", "queue", "security"];

    for (const serviceName of services) {
      try {
        await this.startService(serviceName);
      } catch (error) {
        this.logger.error(
          `Failed to start ${serviceName}, continuing with other services`,
          error as Error,
        );
      }
    }

    this.logger.info("All services startup completed");
    this.emit("allServicesStarted");
  }

  public async stopAllServices(): Promise<void> {
    this.logger.info("Stopping all services...");
    this.isShuttingDown = true;

    const serviceNames = Array.from(this.services.keys()).reverse();

    for (const serviceName of serviceNames) {
      try {
        await this.stopService(serviceName);
      } catch (error) {
        this.logger.error(`Failed to stop ${serviceName}`, error as Error);
      }
    }

    try {
      await this.database.disconnect();
      this.logger.info("Database disconnected");
    } catch (error) {
      this.logger.error("Failed to disconnect database", error as Error);
    }

    this.logger.info("All services stopped");
    this.emit("allServicesStopped");
  }

  public getServiceStatus(serviceName: string): ServiceStatus | undefined {
    return this.serviceStatuses.get(serviceName);
  }

  public getAllServiceStatuses(): Map<string, ServiceStatus> {
    return new Map(this.serviceStatuses);
  }

  public isServiceRunning(serviceName: string): boolean {
    const status = this.serviceStatuses.get(serviceName);
    return status?.status === "running";
  }

  private updateServiceStatus(
    serviceName: string,
    status: ServiceStatus["status"],
    startTime?: Date,
    error?: string,
  ): void {
    const currentStatus = this.serviceStatuses.get(serviceName) || {
      name: serviceName,
      status: "stopped",
    };

    const updatedStatus: ServiceStatus = {
      ...currentStatus,
      status,
      startTime: startTime || currentStatus.startTime,
      lastHealthCheck: new Date(),
      error,
    };

    this.serviceStatuses.set(serviceName, updatedStatus);
    this.emit("serviceStatusChanged", serviceName, updatedStatus);
  }

  private async startSmtpService(): Promise<void> {
    this.logger.info("SMTP service not yet implemented");
  }

  private async startImapService(): Promise<void> {
    this.logger.info("IMAP service not yet implemented");
  }

  private async startPop3Service(): Promise<void> {
    this.logger.info("POP3 service not yet implemented");
  }

  private async startJmapService(): Promise<void> {
    this.logger.info("JMAP service not yet implemented");
  }

  private async startQueueService(): Promise<void> {
    this.logger.info("Queue service not yet implemented");
  }

  private async startSecurityService(): Promise<void> {
    this.logger.info("Security service not yet implemented");
  }

  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      this.logger.info(`Received ${signal}, starting graceful shutdown...`);

      try {
        await this.stopAllServices();
        process.exit(0);
      } catch (error) {
        this.logger.error("Error during graceful shutdown", error as Error);
        process.exit(1);
      }
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGUSR2", () => shutdown("SIGUSR2"));
  }

  public async healthCheck(): Promise<{
    healthy: boolean;
    services: Record<string, boolean>;
  }> {
    const results: Record<string, boolean> = {};
    let overallHealthy = true;

    for (const [serviceName, status] of this.serviceStatuses) {
      const isHealthy = status.status === "running";
      results[serviceName] = isHealthy;

      if (!isHealthy) {
        overallHealthy = false;
      }

      this.logger.logHealthCheck(
        serviceName,
        isHealthy ? "healthy" : "unhealthy",
        {
          status: status.status,
          startTime: status.startTime,
          lastHealthCheck: status.lastHealthCheck,
          error: status.error,
        },
      );
    }

    const dbHealthy = await this.database.healthCheck();
    results.database = dbHealthy;

    if (!dbHealthy) {
      overallHealthy = false;
    }

    return {
      healthy: overallHealthy,
      services: results,
    };
  }
}

export default ServiceManager;
