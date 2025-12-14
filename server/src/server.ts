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
  
  // Load environment variables
  dotenv.config();
  
  const app = express();
  const PORT = process.env.PORT || 8080;
  
  // Middleware
  app.use(helmet());
  app.use(cors({
    origin: config.cors.origin,
    credentials: config.cors.credentials,
  }));
  app.use(compression());
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));
  
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
  app.use('/api/v1/auth', (await import('./routes/authRoutes.js')).default);
  app.use('/api/v1/users', (await import('./routes/userRoutes.js')).default);
  
  // Health check endpoint
  app.get("/health", (req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      data: {
        status: "OK",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.nodeEnv,
        version: "0.1.0",
        services: {
          database: "connected",
          api: "running",
          monitoring: "active",
        },
      }
    });
  });

  // API Status endpoint
  app.get("/api/v1/status", (req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      data: {
        status: "online",
        uptime: process.uptime(),
        version: "0.1.0",
        services: {
          api: true,
          database: true,
          authentication: true,
        }
      }
    });
  });

  // API Metrics endpoint
  app.get("/api/v1/metrics", (req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      data: {
        system: {
          cpu: process.cpuUsage(),
          memory: process.memoryUsage(),
          uptime: process.uptime(),
        },
        api: {
          requests: 0, // TODO: Implement request tracking
          errors: 0, // TODO: Implement error tracking
        }
      }
    });
  });
  
  // 404 handler
  app.use("*", (req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        code: "NOT_FOUND",
        message: "Route not found",
        path: req.originalUrl,
        method: req.method,
      }
    });
  });
  
  // Global error handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error("Global error handler:", err);
  
    res.status(err.status || 500).json({
      success: false,
      error: {
        code: err.code || "INTERNAL_ERROR",
        message: config.nodeEnv === "production" ? "Internal server error" : err.message,
        ...(config.nodeEnv !== "production" && { stack: err.stack }),
      }
    });
  });
  
  const startServer = async (): Promise<void> => {
    try {
      await connectDatabase();
  
      const server = app.listen(config.port, () => {
        console.log(`🚀 Aether Mailer API Server running on port ${config.port}`);
        console.log(`📊 Environment: ${config.nodeEnv}`);
        console.log(`🔗 Health check: http://localhost:${config.port}/health`);
        console.log(`📝 API Documentation: http://localhost:${config.port}/api/v1`);
        console.log(`👥 Users API: http://localhost:${config.port}/api/v1/users`);
        console.log(`🔐 Auth API: http://localhost:${config.port}/api/v1/auth`);
      });
  
      // Graceful shutdown
      const gracefulShutdown = async (signal: string) => {
        console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
  
        server.close(async () => {
          console.log("🔌 HTTP server closed");
          await disconnectDatabase();
          console.log("👋 Server shut down complete");
          process.exit(0);
        });
  
        // Force shutdown after 30 seconds
        setTimeout(() => {
          console.error("❌ Forced shutdown due to timeout");
          process.exit(1);
        }, 30000);
      };
  
      process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
      process.on("SIGINT", () => gracefulShutdown("SIGINT"));
    } catch (error) {
      console.error("❌ Failed to start server:", error);
      process.exit(1);
    }
  };
  
  // Handle unhandled promise rejections
  process.on("unhandledRejection", (reason, promise) => {
    console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
    process.exit(1);
  });
  
  // Handle uncaught exceptions
  process.on("uncaughtException", (error) => {
    console.error("❌ Uncaught Exception:", error);
    process.exit(1);
  });
  
  // Start server
  if (import.meta.url === `file://${process.argv[1]}`) {
    startServer();
  }
  
  export default app;