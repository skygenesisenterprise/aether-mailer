package routerpkg

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// HTTP handlers for the router

// healthEndpoint handles health check requests
func (r *Router) healthEndpoint(c *gin.Context) {
	health := gin.H{
		"status":    "healthy",
		"timestamp": time.Now().Format(TimeFormatRFC3339),
		"uptime":    time.Since(time.Now()).Seconds(),
		"version":   "0.1.0",
	}

	// Add component status
	components := gin.H{}

	// Registry status
	if r.registry != nil {
		services, _ := r.registry.GetServices()
		components["registry"] = gin.H{
			"status":   "healthy",
			"services": len(services),
		}
	}

	// Load balancer status
	if r.balancer != nil {
		components["load_balancer"] = gin.H{
			"status":    "healthy",
			"algorithm": r.config.LoadBalancer.Algorithm,
		}
	}

	// Health checker status
	if r.healthChecker != nil {
		summary, _ := r.healthChecker.GetHealthSummary()
		components["health_checker"] = gin.H{
			"status":    "healthy",
			"total":     summary.Total,
			"healthy":   summary.Healthy,
			"unhealthy": summary.Unhealthy,
		}
	}

	health["components"] = components
	c.JSON(HTTPStatusOK, gin.H{
		"success": true,
		"data":    health,
	})
}

// readyEndpoint handles readiness check requests
func (r *Router) readyEndpoint(c *gin.Context) {
	// Check if all critical components are ready
	ready := true

	// Check registry
	if r.registry == nil {
		ready = false
	}

	// Check load balancer
	if r.balancer == nil {
		ready = false
	}

	status := HTTPStatusOK
	message := "ready"
	if !ready {
		status = HTTPStatusServiceUnavailable
		message = "not ready"
	}

	c.JSON(status, gin.H{
		"success": ready,
		"data": gin.H{
			"status":    message,
			"timestamp": time.Now().Format(TimeFormatRFC3339),
		},
	})
}

// liveEndpoint handles liveness check requests
func (r *Router) liveEndpoint(c *gin.Context) {
	c.JSON(HTTPStatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"status":    "alive",
			"timestamp": time.Now().Format(TimeFormatRFC3339),
		},
	})
}

// metricsEndpoint handles metrics requests
func (r *Router) metricsEndpoint(c *gin.Context) {
	if !r.config.Monitoring.Metrics {
		c.JSON(HTTPStatusNotFound, gin.H{
			"success": false,
			"error": gin.H{
				"code":    ErrCodeNotFound,
				"message": "metrics not enabled",
			},
		})
		return
	}

	// This is a placeholder - in real implementation, return Prometheus metrics
	c.Header("Content-Type", "text/plain")
	c.String(HTTPStatusOK, "# Aether Mailer Router Metrics\n# TODO: Implement Prometheus metrics")
}

// routerStatusEndpoint handles router status requests
func (r *Router) routerStatusEndpoint(c *gin.Context) {
	status := gin.H{
		"started":   r.started,
		"host":      r.config.Server.Host,
		"port":      r.config.Server.Port,
		"version":   "0.1.0",
		"uptime":    time.Since(time.Now()).Seconds(),
		"timestamp": time.Now().Format(TimeFormatRFC3339),
	}

	// Add component counts
	if r.registry != nil {
		if services, err := r.registry.GetServices(); err == nil {
			status["services"] = len(services)
		}
	}

	c.JSON(HTTPStatusOK, gin.H{
		"success": true,
		"data":    status,
	})
}

// routerConfigEndpoint handles router config requests
func (r *Router) routerConfigEndpoint(c *gin.Context) {
	// Return sanitized config (remove sensitive data)
	sanitizedConfig := gin.H{
		"server": gin.H{
			"host":          r.config.Server.Host,
			"port":          r.config.Server.Port,
			"read_timeout":  r.config.Server.ReadTimeout.String(),
			"write_timeout": r.config.Server.WriteTimeout.String(),
			"idle_timeout":  r.config.Server.IdleTimeout.String(),
		},
		"load_balancer": gin.H{
			"algorithm": r.config.LoadBalancer.Algorithm,
			"sticky":    r.config.LoadBalancer.Sticky,
		},
		"services": gin.H{
			"discovery": gin.H{
				"type":     r.config.Services.Discovery.Type,
				"interval": r.config.Services.Discovery.Interval.String(),
			},
			"health": gin.H{
				"enabled":  r.config.Services.Health.Enabled,
				"interval": r.config.Services.Health.Interval.String(),
				"timeout":  r.config.Services.Health.Timeout.String(),
				"path":     r.config.Services.Health.Path,
			},
		},
		"security": gin.H{
			"rate_limit": gin.H{
				"enabled": r.config.Security.RateLimit.Enabled,
			},
			"cors": gin.H{
				"enabled": r.config.Security.CORS.Enabled,
			},
		},
		"monitoring": gin.H{
			"enabled": r.config.Monitoring.Enabled,
			"metrics": r.config.Monitoring.Metrics,
			"tracing": r.config.Monitoring.Tracing,
		},
		"logging": gin.H{
			"level":  r.config.Logging.Level,
			"format": r.config.Logging.Format,
		},
	}

	c.JSON(HTTPStatusOK, gin.H{
		"success": true,
		"data":    sanitizedConfig,
	})
}

// routerReloadEndpoint handles router reload requests
func (r *Router) routerReloadEndpoint(c *gin.Context) {
	// This is a placeholder - in real implementation, reload configuration
	r.logger.Info("Router reload requested")

	c.JSON(HTTPStatusAccepted, gin.H{
		"success": true,
		"data": gin.H{
			"message":   "reload initiated",
			"timestamp": time.Now().Format(TimeFormatRFC3339),
		},
	})
}

// registryListEndpoint handles service list requests
func (r *Router) registryListEndpoint(c *gin.Context) {
	if r.registry == nil {
		c.JSON(HTTPStatusServiceUnavailable, gin.H{
			"success": false,
			"error": gin.H{
				"code":    ErrCodeServiceUnavailable,
				"message": "registry not available",
			},
		})
		return
	}

	services, err := r.registry.GetServices()
	if err != nil {
		c.JSON(HTTPStatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    ErrCodeInternalServerError,
				"message": "failed to get services",
				"details": gin.H{"error": err.Error()},
			},
		})
		return
	}

	// Convert to JSON-friendly format
	serviceList := make([]gin.H, len(services))
	for i, service := range services {
		serviceList[i] = gin.H{
			"id":         service.ID,
			"name":       service.Name,
			"type":       service.Type,
			"address":    service.Address,
			"port":       service.Port,
			"protocol":   service.Protocol,
			"weight":     service.Weight,
			"health":     service.Health,
			"metadata":   service.Metadata,
			"tags":       service.Tags,
			"created_at": service.CreatedAt.Format(TimeFormatRFC3339),
			"updated_at": service.UpdatedAt.Format(TimeFormatRFC3339),
			"last_seen":  service.LastSeen.Format(TimeFormatRFC3339),
		}
	}

	c.JSON(HTTPStatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"services": serviceList,
			"count":    len(services),
		},
	})
}

// registryGetEndpoint handles service get requests
func (r *Router) registryGetEndpoint(c *gin.Context) {
	if r.registry == nil {
		c.JSON(HTTPStatusServiceUnavailable, gin.H{
			"success": false,
			"error": gin.H{
				"code":    ErrCodeServiceUnavailable,
				"message": "registry not available",
			},
		})
		return
	}

	serviceID := c.Param("id")
	if serviceID == "" {
		c.JSON(HTTPStatusBadRequest, gin.H{
			"success": false,
			"error": gin.H{
				"code":    ErrCodeInvalidRequest,
				"message": "service ID is required",
			},
		})
		return
	}

	service, err := r.registry.GetService(serviceID)
	if err != nil {
		c.JSON(HTTPStatusNotFound, gin.H{
			"success": false,
			"error": gin.H{
				"code":    ErrCodeServiceNotFound,
				"message": "service not found",
				"details": gin.H{"service_id": serviceID},
			},
		})
		return
	}

	c.JSON(HTTPStatusOK, gin.H{
		"success": true,
		"data":    service,
	})
}

// registryRegisterEndpoint handles service registration requests
func (r *Router) registryRegisterEndpoint(c *gin.Context) {
	if r.registry == nil {
		c.JSON(HTTPStatusServiceUnavailable, gin.H{
			"success": false,
			"error": gin.H{
				"code":    ErrCodeServiceUnavailable,
				"message": "registry not available",
			},
		})
		return
	}

	var service Service
	if err := c.ShouldBindJSON(&service); err != nil {
		c.JSON(HTTPStatusBadRequest, gin.H{
			"success": false,
			"error": gin.H{
				"code":    ErrCodeInvalidRequest,
				"message": "invalid service data",
				"details": gin.H{"error": err.Error()},
			},
		})
		return
	}

	if err := r.registry.Register(&service); err != nil {
		c.JSON(HTTPStatusBadRequest, gin.H{
			"success": false,
			"error": gin.H{
				"code":    ErrCodeInvalidRequest,
				"message": "failed to register service",
				"details": gin.H{"error": err.Error()},
			},
		})
		return
	}

	c.JSON(HTTPStatusCreated, gin.H{
		"success": true,
		"data":    service,
	})
}

// registryUnregisterEndpoint handles service unregistration requests
func (r *Router) registryUnregisterEndpoint(c *gin.Context) {
	if r.registry == nil {
		c.JSON(HTTPStatusServiceUnavailable, gin.H{
			"success": false,
			"error": gin.H{
				"code":    ErrCodeServiceUnavailable,
				"message": "registry not available",
			},
		})
		return
	}

	serviceID := c.Param("id")
	if serviceID == "" {
		c.JSON(HTTPStatusBadRequest, gin.H{
			"success": false,
			"error": gin.H{
				"code":    ErrCodeInvalidRequest,
				"message": "service ID is required",
			},
		})
		return
	}

	if err := r.registry.Unregister(serviceID); err != nil {
		c.JSON(HTTPStatusNotFound, gin.H{
			"success": false,
			"error": gin.H{
				"code":    ErrCodeServiceNotFound,
				"message": "failed to unregister service",
				"details": gin.H{"error": err.Error()},
			},
		})
		return
	}

	c.JSON(HTTPStatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"message": "service unregistered successfully",
		},
	})
}

// registryHealthEndpoint handles service health requests
func (r *Router) registryHealthEndpoint(c *gin.Context) {
	if r.healthChecker == nil {
		c.JSON(HTTPStatusServiceUnavailable, gin.H{
			"success": false,
			"error": gin.H{
				"code":    ErrCodeServiceUnavailable,
				"message": "health checker not available",
			},
		})
		return
	}

	serviceID := c.Param("id")
	if serviceID == "" {
		c.JSON(HTTPStatusBadRequest, gin.H{
			"success": false,
			"error": gin.H{
				"code":    ErrCodeInvalidRequest,
				"message": "service ID is required",
			},
		})
		return
	}

	health, err := r.healthChecker.GetHealthStatus(serviceID)
	if err != nil {
		c.JSON(HTTPStatusNotFound, gin.H{
			"success": false,
			"error": gin.H{
				"code":    ErrCodeServiceNotFound,
				"message": "service not found",
				"details": gin.H{"service_id": serviceID},
			},
		})
		return
	}

	c.JSON(HTTPStatusOK, gin.H{
		"success": true,
		"data":    health,
	})
}

// balancerAlgorithmEndpoint handles load balancer algorithm requests
func (r *Router) balancerAlgorithmEndpoint(c *gin.Context) {
	if r.balancer == nil {
		c.JSON(HTTPStatusServiceUnavailable, gin.H{
			"success": false,
			"error": gin.H{
				"code":    ErrCodeServiceUnavailable,
				"message": "load balancer not available",
			},
		})
		return
	}

	algorithm := r.balancer.GetAlgorithm()
	c.JSON(HTTPStatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"algorithm": algorithm.Name(),
		},
	})
}

// balancerSetAlgorithmEndpoint handles load balancer algorithm set requests
func (r *Router) balancerSetAlgorithmEndpoint(c *gin.Context) {
	if r.balancer == nil {
		c.JSON(HTTPStatusServiceUnavailable, gin.H{
			"success": false,
			"error": gin.H{
				"code":    ErrCodeServiceUnavailable,
				"message": "load balancer not available",
			},
		})
		return
	}

	var request struct {
		Algorithm string `json:"algorithm" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(HTTPStatusBadRequest, gin.H{
			"success": false,
			"error": gin.H{
				"code":    ErrCodeInvalidRequest,
				"message": "invalid request data",
				"details": gin.H{"error": err.Error()},
			},
		})
		return
	}

	if err := r.balancer.SetAlgorithm(request.Algorithm); err != nil {
		c.JSON(HTTPStatusBadRequest, gin.H{
			"success": false,
			"error": gin.H{
				"code":    ErrCodeInvalidRequest,
				"message": "failed to set algorithm",
				"details": gin.H{"error": err.Error()},
			},
		})
		return
	}

	c.JSON(HTTPStatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"algorithm": request.Algorithm,
		},
	})
}

// balancerMetricsEndpoint handles load balancer metrics requests
func (r *Router) balancerMetricsEndpoint(c *gin.Context) {
	if r.balancer == nil {
		c.JSON(HTTPStatusServiceUnavailable, gin.H{
			"success": false,
			"error": gin.H{
				"code":    ErrCodeServiceUnavailable,
				"message": "load balancer not available",
			},
		})
		return
	}

	metrics := r.balancer.GetMetrics()
	c.JSON(HTTPStatusOK, gin.H{
		"success": true,
		"data":    metrics,
	})
}

// proxyHandler handles reverse proxy requests
func (r *Router) proxyHandler(c *gin.Context) {
	if r.proxy == nil {
		c.JSON(HTTPStatusServiceUnavailable, gin.H{
			"success": false,
			"error": gin.H{
				"code":    ErrCodeServiceUnavailable,
				"message": "proxy not available",
			},
		})
		return
	}

	// Get services for routing
	services, err := r.registry.GetServices()
	if err != nil {
		c.JSON(HTTPStatusServiceUnavailable, gin.H{
			"success": false,
			"error": gin.H{
				"code":    ErrCodeServiceUnavailable,
				"message": "no services available",
			},
		})
		return
	}

	// Select service using load balancer
	target, err := r.balancer.SelectService(c.Request, services)
	if err != nil {
		c.JSON(HTTPStatusServiceUnavailable, gin.H{
			"success": false,
			"error": gin.H{
				"code":    ErrCodeServiceUnavailable,
				"message": "no healthy services available",
			},
		})
		return
	}

	// Proxy the request
	response, err := r.proxy.ProxyRequest(c.Request, target)
	if err != nil {
		c.JSON(HTTPStatusBadGateway, gin.H{
			"success": false,
			"error": gin.H{
				"code":    ErrCodeBadGateway,
				"message": "proxy request failed",
				"details": gin.H{"error": err.Error()},
			},
		})
		return
	}

	// Copy response headers
	for key, values := range response.Header {
		for _, value := range values {
			c.Header(key, value)
		}
	}

	c.Status(response.StatusCode)
}

// Middleware implementations

// loggingMiddleware implements request logging
func (r *Router) loggingMiddleware() gin.HandlerFunc {
	return gin.LoggerWithFormatter(func(param gin.LogFormatterParams) string {
		r.logger.Info("HTTP request",
			"method", param.Method,
			"path", param.Path,
			"status", param.StatusCode,
			"latency", param.Latency,
			"client_ip", param.ClientIP,
			"user_agent", param.Request.UserAgent(),
		)
		return ""
	})
}

// requestIDMiddleware implements request ID generation
func (r *Router) requestIDMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		requestID := c.GetHeader(HeaderXRequestID)
		if requestID == "" {
			requestID = generateRequestID()
		}
		c.Set(HeaderXRequestID, requestID)
		c.Header(HeaderXRequestID, requestID)
		c.Next()
	}
}

// corsMiddleware implements CORS handling
func (r *Router) corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")

		// Check if origin is allowed
		allowed := false
		for _, allowedOrigin := range r.config.Security.CORS.AllowedOrigins {
			if allowedOrigin == "*" || allowedOrigin == origin {
				allowed = true
				break
			}
		}

		if allowed {
			c.Header(HeaderAccessControlAllowOrigin, origin)
		}

		c.Header(HeaderAccessControlAllowMethods, "GET, POST, PUT, DELETE, OPTIONS, PATCH")
		c.Header(HeaderAccessControlAllowHeaders, "Origin, Content-Type, Accept, Authorization, X-Request-ID, X-API-Key")

		if r.config.Security.CORS.AllowCredentials {
			c.Header(HeaderAccessControlAllowCredentials, "true")
		}

		if r.config.Security.CORS.MaxAge > 0 {
			c.Header(HeaderAccessControlMaxAge, strconv.Itoa(r.config.Security.CORS.MaxAge))
		}

		// Handle preflight requests
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(HTTPStatusNoContent)
			return
		}

		c.Next()
	}
}

// rateLimitMiddleware implements rate limiting
func (r *Router) rateLimitMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		if r.rateLimiter == nil {
			c.Next()
			return
		}

		key := c.ClientIP()
		if !r.rateLimiter.Allow(key, 100, DefaultRateLimitWindow) {
			c.Header(HeaderXRateLimitLimit, "100")
			c.Header(HeaderXRateLimitRemaining, "0")
			c.Header(HeaderXRateLimitReset, strconv.FormatInt(time.Now().Add(DefaultRateLimitWindow).Unix(), 10))

			c.JSON(HTTPStatusTooManyRequests, gin.H{
				"success": false,
				"error": gin.H{
					"code":    ErrCodeRateLimitExceeded,
					"message": "rate limit exceeded",
				},
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// Utility functions

// generateRequestID generates a unique request ID
func generateRequestID() string {
	return strconv.FormatInt(time.Now().UnixNano(), 36)
}
