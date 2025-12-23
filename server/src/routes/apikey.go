package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/skygenesisenterprise/aether-mailer/server/src/controllers"
	"github.com/skygenesisenterprise/aether-mailer/server/src/middleware"
)

// ApiKeyRoutes handles API key routes
type ApiKeyRoutes struct {
	apiKeyController *controllers.ApiKeyController
	apiKeyMiddleware *middleware.ApiKeyMiddleware
	authMiddleware   *middleware.AuthMiddleware
}

// NewApiKeyRoutes creates new API key routes
func NewApiKeyRoutes(apiKeyController *controllers.ApiKeyController, apiKeyMiddleware *middleware.ApiKeyMiddleware, authMiddleware *middleware.AuthMiddleware) *ApiKeyRoutes {
	return &ApiKeyRoutes{
		apiKeyController: apiKeyController,
		apiKeyMiddleware: apiKeyMiddleware,
		authMiddleware:   authMiddleware,
	}
}

// SetupRoutes configures API key management routes
func (r *ApiKeyRoutes) SetupRoutes(router *gin.RouterGroup) {
	// API key management routes
	apiKeys := router.Group("/api-keys")
	{
		// Public routes (require API key authentication but not specific permissions)
		apiKeys.POST("", r.apiKeyController.CreateApiKey)                 // Create API key
		apiKeys.GET("", r.apiKeyController.ListApiKeys)                   // List user's API keys
		apiKeys.GET("/:id", r.apiKeyController.GetApiKey)                 // Get specific API key
		apiKeys.PUT("/:id", r.apiKeyController.UpdateApiKey)              // Update API key
		apiKeys.DELETE("/:id", r.apiKeyController.RevokeApiKey)           // Revoke API key
		apiKeys.GET("/:id/stats", r.apiKeyController.GetApiKeyUsageStats) // Get usage statistics
	}

	// System-only routes (require system API key)
	system := router.Group("/system")
	system.Use(r.apiKeyMiddleware.RequireSystemKey())
	{
		system.GET("/api-keys/info", r.apiKeyController.GetSystemKeyInfo)       // Get system key info
		system.POST("/api-keys/cleanup", r.apiKeyController.CleanupExpiredKeys) // Cleanup expired keys
	}

	// Debug routes (require specific permission)
	debug := router.Group("/debug")
	debug.Use(r.apiKeyMiddleware.RequirePermission("admin"))
	{
		debug.POST("/api-keys/validate", r.apiKeyController.ValidateApiKey) // Validate API key
	}

	// Additional API key utility routes
	apiKeys.GET("/help", func(ctx *gin.Context) {
		ctx.JSON(200, gin.H{
			"success": true,
			"data": gin.H{
				"title":       "API Key Management",
				"description": "Manage your API keys for Aether Mailer",
				"endpoints": gin.H{
					"create": gin.H{
						"method":      "POST",
						"path":        "/api/v1/api-keys",
						"description": "Create a new API key",
						"request": gin.H{
							"name":        "string (required)",
							"permissions": "[]string (required)",
							"expiresAt":   "datetime (optional)",
						},
					},
					"list": gin.H{
						"method":      "GET",
						"path":        "/api/v1/api-keys",
						"description": "List all your API keys",
					},
					"get": gin.H{
						"method":      "GET",
						"path":        "/api/v1/api-keys/:id",
						"description": "Get a specific API key",
					},
					"update": gin.H{
						"method":      "PUT",
						"path":        "/api/v1/api-keys/:id",
						"description": "Update an API key",
						"request": gin.H{
							"name":        "string (required)",
							"permissions": "[]string (required)",
						},
					},
					"revoke": gin.H{
						"method":      "DELETE",
						"path":        "/api/v1/api-keys/:id",
						"description": "Revoke an API key",
					},
					"stats": gin.H{
						"method":      "GET",
						"path":        "/api/v1/api-keys/:id/stats",
						"description": "Get usage statistics for an API key",
					},
				},
				"api_key_format": gin.H{
					"prefix":  "sk_",
					"example": "sk_live_51Kj9mP2vL7qR3wN8jXf4Zb6Yc8D...",
					"headers": gin.H{
						"authorization": "Bearer sk_your_api_key_here",
						"x-api-key":     "sk_your_api_key_here",
					},
				},
				"permissions": gin.H{
					"available": []string{
						"email:read",
						"email:write",
						"email:send",
						"domain:read",
						"domain:write",
						"user:read",
						"user:write",
						"admin", // Full admin access
						"*",     // All permissions (system key only)
					},
				},
				"security_notes": []string{
					"API keys must start with 'sk_' prefix",
					"Store API keys securely and never share them publicly",
					"Regularly rotate your API keys",
					"Use the minimum required permissions for each key",
					"Monitor API key usage and revoke suspicious keys",
				},
			},
		})
	})

	// API key validation endpoint
	apiKeys.POST("/validate", func(ctx *gin.Context) {
		ctx.JSON(200, gin.H{
			"success": true,
			"message": "API key validation endpoint",
			"note":    "Use POST /api/v1/debug/api-keys/validate for actual validation (requires admin permission)",
		})
	})
}
