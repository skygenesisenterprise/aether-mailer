import { Request, Response, NextFunction } from 'express';
import { apiLogger, performanceLogger } from '../lib/logger';

// Request counter for metrics
let requestCount = 0;
const responseTimes: number[] = [];
const MAX_RESPONSE_TIMES = 1000; // Keep last 1000 response times

// Clean old response times
const cleanupResponseTimes = () => {
  if (responseTimes.length > MAX_RESPONSE_TIMES) {
    responseTimes.splice(0, responseTimes.length - MAX_RESPONSE_TIMES);
  }
};

// Calculate statistics
const calculateStats = () => {
  if (responseTimes.length === 0) return { avg: 0, p95: 0, p99: 0 };
  
  const sorted = [...responseTimes].sort((a, b) => a - b);
  const avg = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  const p95Index = Math.floor(sorted.length * 0.95);
  const p99Index = Math.floor(sorted.length * 0.99);
  
  return {
    avg: Math.round(avg),
    p95: sorted[p95Index] || 0,
    p99: sorted[p99Index] || 0
  };
};

// Main monitoring middleware
export const monitoringMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  requestCount++;
  
  // Add request ID for tracing
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  req.headers['x-request-id'] = requestId;
  
  // Log request start
  apiLogger.info({
    requestId,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    timestamp: new Date().toISOString()
  }, 'Request started');
  
  // Capture response
  const originalSend = res.send;
  res.send = function(body) {
    const duration = Date.now() - startTime;
    responseTimes.push(duration);
    cleanupResponseTimes();
    
    // Log response
    apiLogger.info({
      requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: body ? body.length : 0
    }, 'Request completed');
    
    // Performance logging for slow requests
    if (duration > 1000) {
      performanceLogger('slow_request', duration, {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode
      });
    }
    
    return originalSend.call(this, body);
  };
  
  // Error handling
  res.on('error', (error) => {
    apiLogger.error({
      requestId,
      error: error.message,
      stack: error.stack,
      method: req.method,
      url: req.url
    }, 'Response error');
  });
  
  next();
};

// Metrics collector
export const getMetrics = () => {
  const stats = calculateStats();
  const memoryUsage = process.memoryUsage();
  
  return {
    requests: {
      total: requestCount,
      responseTime: stats
    },
    memory: {
      rss: memoryUsage.rss,
      heapUsed: memoryUsage.heapUsed,
      heapTotal: memoryUsage.heapTotal,
      external: memoryUsage.external
    },
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  };
};

// Error tracking middleware
export const errorTrackingMiddleware = (error: Error, req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] as string;
  
  apiLogger.error({
    requestId,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress
  }, 'Application error');
  
  // Don't send error details in production
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({
      error: 'Internal Server Error',
      requestId
    });
  } else {
    res.status(500).json({
      error: error.message,
      stack: error.stack,
      requestId
    });
  }
};