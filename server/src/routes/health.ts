import { Router, type Request, type Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { appLogger, dbLogger } from '../../app/lib/logger';

const router = Router();
const prisma = new PrismaClient();

// Health check endpoint
router.get('/health', async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '0.1.0',
    environment: process.env.NODE_ENV || 'development',
    checks: {
      database: 'unknown',
      smtp: 'unknown',
      memory: 'unknown',
      disk: 'unknown'
    },
    metrics: {
      responseTime: 0,
      timestamp: new Date().toISOString()
    }
  };

  // Database health check
  try {
    await prisma.$queryRaw`SELECT 1`;
    health.checks.database = 'connected';
    dbLogger.info('Database health check passed');
  } catch (error) {
    health.status = 'degraded';
    health.checks.database = 'disconnected';
    dbLogger.error({ error: error instanceof Error ? error.message : 'Unknown error' }, 'Database health check failed');
  }

  // Memory health check
  const memoryUsage = process.memoryUsage();
  const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
  health.checks.memory = memoryUsagePercent > 85 ? 'critical' : memoryUsagePercent > 70 ? 'warning' : 'healthy';

  // Disk health check (basic check)
  try {
    const fs = await import('fs');
    const stats = fs.statSync('.');
    health.checks.disk = 'healthy'; // Simplified check
  } catch (error) {
    health.checks.disk = 'unknown';
  }

  // Calculate response time
  health.metrics.responseTime = Date.now() - startTime;

  const statusCode = health.status === 'healthy' ? 200 : 503;
  
  appLogger.info({
    status: health.status,
    checks: health.checks,
    responseTime: health.metrics.responseTime
  }, 'Health check completed');

  res.status(statusCode).json(health);
});

// Readiness probe endpoint
router.get('/ready', async (req: Request, res: Response) => {
  try {
    // Check if database is ready
    await prisma.$queryRaw`SELECT 1`;
    
    // Check if essential services are ready
    const ready = {
      status: 'ready',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'ready',
        server: 'ready'
      }
    };

    appLogger.info('Readiness check passed');
    res.json(ready);
  } catch (error) {
    const notReady = {
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    };

    dbLogger.error({ error: notReady.error }, 'Readiness check failed');
    res.status(503).json(notReady);
  }
});

// Liveness probe endpoint
router.get('/live', (req: Request, res: Response) => {
  const liveness = {
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    pid: process.pid
  };

  res.json(liveness);
});

// Metrics endpoint for Prometheus
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    // Get basic application metrics
    const metrics = [
      `# HELP aether_mailer_memory_usage_bytes Memory usage in bytes`,
      `# TYPE aether_mailer_memory_usage_bytes gauge`,
      `aether_mailer_memory_usage_bytes{type="rss"} ${memoryUsage.rss}`,
      `aether_mailer_memory_usage_bytes{type="heap_total"} ${memoryUsage.heapTotal}`,
      `aether_mailer_memory_usage_bytes{type="heap_used"} ${memoryUsage.heapUsed}`,
      `aether_mailer_memory_usage_bytes{type="external"} ${memoryUsage.external}`,
      '',
      `# HELP aether_mailer_uptime_seconds Application uptime in seconds`,
      `# TYPE aether_mailer_uptime_seconds counter`,
      `aether_mailer_uptime_seconds ${uptime}`,
      '',
      `# HELP aether_mailer_process_info Process information`,
      `# TYPE aether_mailer_process_info gauge`,
      `aether_mailer_process_info{pid="${process.pid}"} 1`,
      '',
      `# HELP aether_mailer_version Application version`,
      `# TYPE aether_mailer_version gauge`,
      `aether_mailer_version{version="${process.env.npm_package_version || '0.1.0'}"} 1`
    ].join('\n');

    res.set('Content-Type', 'text/plain');
    res.send(metrics);
  } catch (error) {
    appLogger.error({ error: error instanceof Error ? error.message : 'Unknown error' }, 'Metrics endpoint error');
    res.status(500).json({ error: 'Failed to generate metrics' });
  }
});

export default router;