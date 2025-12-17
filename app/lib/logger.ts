import pino from 'pino';
import { LogLayer } from 'loglayer';
import { PinoTransport } from '@loglayer/transport-pino';

// Create logs directory if it doesn't exist
import { mkdirSync } from 'fs';
import { join } from 'path';

const logsDir = join(process.cwd(), 'logs');
try {
  mkdirSync(logsDir, { recursive: true });
} catch (error) {
  // Directory already exists
}

// Configure logger with multiple transports
const logger = new LogLayer({
  transport: new PinoTransport({
    logger: pino({
      level: process.env.LOG_LEVEL || 'info',
      formatters: {
        level: (label) => ({ level: label }),
        log: (object) => {
          // Add custom fields to all logs
          return {
            ...object,
            service: 'aether-mailer',
            version: process.env.npm_package_version || '0.1.0',
            timestamp: new Date().toISOString()
          };
        }
      },
      transport: {
        targets: [
          {
            target: 'pino-pretty',
            level: 'info',
            options: {
              colorize: true,
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname'
            }
          },
          {
            target: 'pino/file',
            level: 'warn',
            options: {
              destination: join(logsDir, 'app.log'),
              mkdir: true
            }
          },
          {
            target: 'pino/file',
            level: 'error',
            options: {
              destination: join(logsDir, 'error.log'),
              mkdir: true
            }
          }
        ]
      }
    })
  })
});

// Create specialized loggers
export const appLogger = logger.child({ component: 'app' });
export const dbLogger = logger.child({ component: 'database' });
export const authLogger = logger.child({ component: 'auth' });
export const apiLogger = logger.child({ component: 'api' });
export const monitorLogger = logger.child({ component: 'monitoring' });

// Request logger middleware
export const requestLogger = (req: any, res: any, next: any) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    apiLogger.info({
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress
    }, 'HTTP Request');
  });
  
  next();
};

// Error logger
export const errorLogger = (error: Error, context?: string) => {
  logger.error({
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    context
  }, 'Application Error');
};

// Performance logger
export const performanceLogger = (operation: string, duration: number, metadata?: any) => {
  logger.info({
    operation,
    duration: `${duration}ms`,
    ...metadata
  }, 'Performance Metric');
};

export default logger;