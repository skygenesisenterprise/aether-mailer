export class ErrorHandler {
  static handle(error: unknown, context: string, logger: any): void {
    const errorInfo = this.extractErrorInfo(error);

    logger.error("Application error", {
      context,
      ...errorInfo,
      timestamp: new Date().toISOString(),
    });

    // In production, you might want to send errors to a monitoring service
    if (process.env["NODE_ENV"] === "production") {
      this.sendToMonitoring(errorInfo, context);
    }
  }

  static handleWebhookError(
    error: unknown,
    event: string,
    payload: any,
    logger: any,
  ): void {
    const errorInfo = this.extractErrorInfo(error);

    logger.error("Webhook processing error", {
      event,
      repository: payload.repository?.full_name,
      action: payload.action,
      ...errorInfo,
      timestamp: new Date().toISOString(),
    });
  }

  static handleMailerError(
    error: unknown,
    notification: any,
    logger: any,
  ): void {
    const errorInfo = this.extractErrorInfo(error);

    logger.error("Mailer service error", {
      notificationType: notification.type,
      repository: notification.repository,
      ...errorInfo,
      timestamp: new Date().toISOString(),
    });
  }

  static handleWorkflowError(
    error: unknown,
    workflow: string,
    metadata: any,
    logger: any,
  ): void {
    const errorInfo = this.extractErrorInfo(error);

    logger.error("Workflow orchestration error", {
      workflow,
      releaseType: metadata.type,
      targets: metadata.targets,
      ...errorInfo,
      timestamp: new Date().toISOString(),
    });
  }

  private static extractErrorInfo(error: unknown): Record<string, any> {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    return {
      name: "UnknownError",
      message: String(error),
      stack: undefined,
    };
  }

  private static sendToMonitoring(
    errorInfo: Record<string, any>,
    context: string,
  ): void {
    // Integration with monitoring services like Sentry, DataDog, etc.
    // This is a placeholder for monitoring integration
    console.error("MONITORING:", { context, ...errorInfo });
  }

  static createErrorResponse(
    error: unknown,
    statusCode: number = 500,
  ): {
    error: string;
    statusCode: number;
    timestamp: string;
    requestId?: string;
  } {
    const message = error instanceof Error ? error.message : "Unknown error";

    return {
      error: message,
      statusCode,
      timestamp: new Date().toISOString(),
      requestId: this.generateRequestId(),
    };
  }

  private static generateRequestId(): string {
    return Math.random().toString(36).substring(2, 15);
  }
}
