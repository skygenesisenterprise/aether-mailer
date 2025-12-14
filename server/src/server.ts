import express, {
    type Request,
    type Response,
    type NextFunction,
  } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import dotenv from "dotenv";
import {
  config,
  connectDatabase,
  disconnectDatabase,
} from "./config/database";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import healthRoutes from "./routes/health.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Get system information for Linux-like environments
const getSystemInfo = () => {
  const platform = process.platform;
  const isLinux = platform === 'linux';
  
  if (isLinux) {
    try {
      const os = require('os');
      const fs = require('fs');
      
      return {
        platform: 'linux',
        hostname: os.hostname(),
        uptime: os.uptime(),
        loadavg: os.loadavg(),
        totalmem: os.totalmem(),
        freemem: os.freemem(),
        cpus: os.cpus(),
        nodeVersion: process.version,
        arch: os.arch(),
        release: os.release(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        platform: 'linux',
        hostname: 'unknown',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  return {
    platform,
    nodeVersion: process.version,
    arch: process.arch,
    timestamp: new Date().toISOString()
  };
};

// Middleware
app.use(helmet());
app.use(cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials,
}));
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const systemInfo = getSystemInfo();
    
    // Enhanced logging with system info for Linux
    if (systemInfo.platform === 'linux') {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} ${res.statusCode} - ${duration}ms - ${req.ip || req.connection.remoteAddress}`);
      console.log(`System: ${systemInfo.hostname} | ${systemInfo.platform} ${systemInfo.release}}`);
      console.log(`Memory: ${Math.round((systemInfo.totalmem - systemInfo.freemem) / 1024 / 1024)}% used | Load: ${systemInfo.loadavg?.[0]?.toFixed(2)} (1min), ${systemInfo.loadavg[1]?.toFixed(2)} (5min), ${systemInfo.loadavg[2]?.toFixed(2)} (15min)`);
    } else {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} ${res.statusCode} - ${duration}ms - ${req.ip || req.connection.remoteAddress}`);
    }
  });
  
  next();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later.'
    }
  }
});
app.use(limiter);

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/health', healthRoutes);

// Enhanced health check endpoint with system info
app.get("/health", async (req: Request, res: Response) => {
  const systemInfo = getSystemInfo();
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '0.1.0',
    environment: config.nodeEnv,
    system: systemInfo,
    checks: {
      database: 'unknown',
      api: 'running',
      monitoring: 'active'
    }
  };

  // Database health check
  try {
    await connectDatabase();
    health.checks.database = 'connected';
  } catch (error) {
    health.status = 'degraded';
    health.checks.database = 'disconnected';
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  
  // Enhanced logging with system info for Linux
  if (systemInfo.platform === 'linux') {
    console.log(`[${new Date().toISOString()}] Health Check - ${health.status.toUpperCase()} | Database: ${health.checks.database} | API: ${health.checks.api} | Monitoring: ${health.checks.monitoring}`);
  }
  
  res.status(statusCode).json(health);
});

// Enhanced API status endpoint with system info
app.get("/api/v1/status", (req: Request, res: Response) => {
  const systemInfo = getSystemInfo();
  const status = {
    success: true,
    data: {
      status: 'online',
      uptime: process.uptime(),
      version: process.env.npm_package_version || '0.1.0',
      environment: config.nodeEnv,
      system: systemInfo,
      services: {
        api: true,
        database: 'connected',
        authentication: true,
        monitoring: true
      },
      endpoints: {
        health: '/api/v1/health',
        auth: '/api/v1/auth',
        users: '/api/v1/users',
        metrics: '/api/v1/metrics'
      }
    }
  };

  // Enhanced logging with system info for Linux
  if (systemInfo.platform === 'linux') {
    console.log(`[${new Date().toISOString()}] API Status Check - ${status.data.status.toUpperCase()} | Database: ${status.data.services.database} | API: ${status.data.services.api} | Authentication: ${status.data.services.authentication}`);
  }
  
  res.status(200).json(status);
});

// Enhanced metrics endpoint with system info
app.get("/api/v1/metrics", (req: Request, res: Response) => {
  const systemInfo = getSystemInfo();
  const metrics = {
    success: true,
    data: {
      system: systemInfo,
      application: {
        performance: {
          cpu: process.cpuUsage(),
          memory: process.memoryUsage(),
          uptime: process.uptime()
        }
      },
      timestamp: new Date().toISOString()
    }
  };

  // Enhanced logging with system info for Linux
  if (systemInfo.platform === 'linux') {
    console.log(`[${new Date().toISOString()}] Metrics Collection - CPU: ${JSON.stringify(metrics.data.application.performance.cpu)} | Memory: ${Math.round(metrics.data.application.performance.memory.heapUsed / 1024 / 1024)}% used`);
  }
  
  res.status(200).json(metrics);
});

// 404 handler
app.use("*", (req: Request, res: Response) => {
  const systemInfo = getSystemInfo();
  console.warn(`[${new Date().toISOString()}] 404 - ${req.method} ${req.originalUrl} - ${req.ip || req.connection.remoteAddress}`);
  
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
      path: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString(),
      system: systemInfo
    }
  });
});

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const systemInfo = getSystemInfo();
  console.error(`[${new Date().toISOString()}] ERROR: ${err.message || 'Unknown error'}`);
  
  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: config.nodeEnv === 'production' ? 'Internal server error' : err.message,
      timestamp: new Date().toISOString(),
      ...(config.nodeEnv !== 'production' && { stack: err.stack }),
      system: systemInfo
    }
  });
});

const startServer = async (): Promise<void> => {
  try {
    await connectDatabase();
    
    const server = app.listen(config.port, () => {
      const systemInfo = getSystemInfo();
      
      // Enhanced startup logging for Linux-like environments
      if (systemInfo.platform === 'linux') {
        console.log('\n🐧 Linux System Information:');
        console.log(`   Hostname: ${systemInfo.hostname}`);
        console.log(`   Platform: ${systemInfo.platform} ${systemInfo.release || ''}`);
        console.log(`   Architecture: ${systemInfo.arch}`);
        console.log(`   Node.js: ${systemInfo.nodeVersion}`);
        console.log(`   Uptime: ${Math.floor(systemInfo.uptime / 60)} minutes`);
        console.log(`   Memory: ${Math.round((systemInfo.totalmem - systemInfo.freemem) / 1024 / 1024)}% used`);
        console.log(`   CPU Cores: ${systemInfo.cpus?.length || 'Unknown'}`);
        if (systemInfo.loadavg) {
          console.log(`   Load Average: ${systemInfo.loadavg[0]?.toFixed(2)} (1min), ${systemInfo.loadavg[1]?.toFixed(2)} (5min), ${systemInfo.loadavg[2]?.toFixed(2)} (15min)`);
        }
        console.log('');
      }
      
      console.log(`🚀 Aether Mailer API Server running on port ${config.port}`);
      console.log(`📊 Environment: ${config.nodeEnv}`);
      console.log(`🔗 Health check: http://localhost:${config.port}/health`);
      console.log(`📝 API Documentation: http://localhost:${config.port}/api/v1`);
      console.log(`👥 Users API: http://localhost:${config.port}/api/v1/users`);
      console.log(`🔐 Auth API: http://localhost:${config.port}/api/v1/auth`);
      console.log(`📈 Metrics: http://localhost:${config.port}/api/v1/metrics`);
      console.log(`📊 Status: http://localhost:${config.port}/api/v1/status`);
      console.log(`🖥️  PID: ${process.pid}`);
      console.log('');
      console.log('🔧 Ready to serve requests...');
    });
    
    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
      
      server.close(async () => {
        console.log('🔌 HTTP server closed');
        await disconnectDatabase();
        console.log('👋 Server shutdown complete');
        process.exit(0);
      });
    };
    
    // Force shutdown after 30 seconds
    setTimeout(() => {
      console.error('❌ Forced shutdown due to timeout');
      process.exit(1);
    }, 30000);
    
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  const systemInfo = getSystemInfo();
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  const systemInfo = getSystemInfo();
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Start server
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}

export default app;