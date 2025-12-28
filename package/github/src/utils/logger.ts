export interface Logger {
  debug(message: string, meta?: unknown): void;
  info(message: string, meta?: unknown): void;
  warn(message: string, meta?: unknown): void;
  error(message: string, meta?: unknown): void;
}

export class PinoLogger implements Logger {
  constructor(private readonly logger: any) {}

  debug(message: string, meta?: unknown): void {
    if (meta) {
      this.logger.debug(meta, message);
    } else {
      this.logger.debug(message);
    }
  }

  info(message: string, meta?: unknown): void {
    if (meta) {
      this.logger.info(meta, message);
    } else {
      this.logger.info(message);
    }
  }

  warn(message: string, meta?: unknown): void {
    if (meta) {
      this.logger.warn(meta, message);
    } else {
      this.logger.warn(message);
    }
  }

  error(message: string, meta?: unknown): void {
    if (meta) {
      this.logger.error(meta, message);
    } else {
      this.logger.error(message);
    }
  }

  static create(level: string = "info"): PinoLogger {
    const pino = require("pino");

    const logger = pino({
      level,
      formatters: {
        level: (label: string) => ({ level: label }),
        log: (object: unknown) => object,
      },
      timestamp: pino.stdTimeFunctions.isoTime,
      base: {
        pid: process.pid,
        hostname: require("os").hostname(),
        service: "aether-github-app",
      },
    });

    return new PinoLogger(logger);
  }
}
