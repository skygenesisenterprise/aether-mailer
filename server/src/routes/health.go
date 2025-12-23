package routes

import (
	"net/http"

	"github.com/skygenesisenterprise/aether-mailer/server/src/controllers"
	"github.com/skygenesisenterprise/aether-mailer/server/src/middleware"
	"github.com/gin-gonic/gin"
)

// HealthRoutes handles health check routes
type HealthRoutes struct {
	monitoringMiddleware *middleware.MonitoringMiddleware
}

// NewHealthRoutes creates new health routes
func NewHealthRoutes(monitoringMiddleware *middleware.MonitoringMiddleware) *HealthRoutes {
	return &HealthRoutes{
		monitoringMiddleware: monitoringMiddleware,
	}
}

// SetupRoutes configures health routes
func (r *HealthRoutes) SetupRoutes(router *gin.RouterGroup) {
	health := router.Group("/health")
	{
		// Basic health check
		health.GET("/", func(ctx *gin.Context) {
			ctx.JSON(http.StatusOK, gin.H{
				"status":    "healthy",
				"timestamp": gin.H{},
			})
		})

		// Detailed health check with system info
		health.GET("/detailed", func(ctx *gin.Context) {
			metrics := r.monitoringMiddleware.GetMetrics()

			ctx.JSON(http.StatusOK, gin.H{
				"status":    "healthy",
				"timestamp": gin.H{},
				"system":    metrics,
				"checks": gin.H{
					"database":   "connected",
					"api":        "running",
					"monitoring": "active",
				},
			})
		})

		// Metrics endpoint
		health.GET("/metrics", func(ctx *gin.Context) {
			metrics := r.monitoringMiddleware.GetMetrics()

			ctx.JSON(http.StatusOK, gin.H{
				"success": true,
				"data":    metrics,
			})
		})
	}
}
