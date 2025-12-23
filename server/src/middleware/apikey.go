package middleware

import (
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
	"github.com/skygenesisenterprise/aether-mailer/server/src/config"
	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
	"github.com/skygenesisenterprise/aether-mailer/server/src/services"
)

// ApiKeyMiddleware handles API key authentication
type ApiKeyMiddleware struct {
	apiKeyService *services.ApiKeyService
	config        *config.Config
}

// NewApiKeyMiddleware creates a new API key middleware
func NewApiKeyMiddleware(apiKeyService *services.ApiKeyService, config *config.Config) *ApiKeyMiddleware {
	return &ApiKeyMiddleware{
		apiKeyService: apiKeyService,
		config:        config,
	}
}

// ValidateAPIKey validates API key for all requests
func (m *ApiKeyMiddleware) ValidateAPIKey() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		// Extract API key from headers
		apiKey := m.extractAPIKey(ctx)
		if apiKey == "" {
			m.logSecurityEvent(ctx, "API_KEY_MISSING", "API key required but not provided")
			ctx.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "API_KEY_REQUIRED",
					"message": "API key is required for all requests",
				},
			})
			ctx.Abort()
			return
		}

		// Validate API key format
		if !strings.HasPrefix(apiKey, "sk_") {
			m.logSecurityEvent(ctx, "API_KEY_INVALID_PREFIX", "API key with 'sk_' prefix required")
			ctx.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "API_KEY_INVALID_PREFIX",
					"message": "API key must start with 'sk_' prefix",
				},
			})
			ctx.Abort()
			return
		}

		// Validate API key in database
		keyData, err := m.apiKeyService.ValidateAPIKey(apiKey, ctx)
		if err != nil {
			m.logSecurityEvent(ctx, "API_KEY_INVALID", "Invalid API key provided")
			ctx.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "API_KEY_INVALID",
					"message": "Invalid or expired API key",
				},
			})
			ctx.Abort()
			return
		}

		// Check if key is active
		if !keyData.IsActive {
			m.logSecurityEvent(ctx, "API_KEY_INACTIVE", "Inactive API key used")
			ctx.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "API_KEY_INACTIVE",
					"message": "API key is inactive",
				},
			})
			ctx.Abort()
			return
		}

		// Check expiration
		if keyData.ExpiresAt != nil && keyData.ExpiresAt.Before(time.Now()) {
			m.logSecurityEvent(ctx, "API_KEY_EXPIRED", "Expired API key used")
			ctx.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "API_KEY_EXPIRED",
					"message": "API key has expired",
				},
			})
			ctx.Abort()
			return
		}

		// Set API key information in context
		ctx.Set("apiKey", keyData)
		ctx.Set("isSystemKey", keyData.Name == "system")
		ctx.Set("apiKeyUserID", keyData.UserID)

		// Update last used timestamp asynchronously
		go func() {
			if err := m.apiKeyService.UpdateLastUsed(keyData.ID); err != nil {
				log.Error().Err(err).Str("apiKeyId", keyData.ID).Msg("Failed to update API key last used timestamp")
			}
		}()

		ctx.Next()
	}
}

// extractAPIKey extracts API key from various header formats
func (m *ApiKeyMiddleware) extractAPIKey(ctx *gin.Context) string {
	// Try Authorization header first (Bearer format)
	authHeader := ctx.GetHeader("Authorization")
	if authHeader != "" {
		parts := strings.Split(authHeader, " ")
		if len(parts) == 2 && parts[0] == "Bearer" {
			return parts[1]
		}
	}

	// Try X-API-Key header
	apiKeyHeader := ctx.GetHeader("X-API-Key")
	if apiKeyHeader != "" {
		return apiKeyHeader
	}

	return ""
}

// logSecurityEvent logs security events for API key usage
func (m *ApiKeyMiddleware) logSecurityEvent(ctx *gin.Context, eventType string, description string) {
	log.Warn().
		Str("eventType", eventType).
		Str("description", description).
		Str("ip", ctx.ClientIP()).
		Str("userAgent", ctx.GetHeader("User-Agent")).
		Str("method", ctx.Request.Method).
		Str("path", ctx.Request.URL.Path).
		Msg("API Key security event")

	// In a real implementation, you would store this in the database
	// securityService.CreateSecurityEvent(models.SecurityEvent{
	//     Type:        models.SecurityEventType(eventType),
	//     Severity:    models.SecuritySeverityMedium,
	//     Description: description,
	//     IPAddress:   &[]string{ctx.ClientIP()}[0],
	//     UserAgent:   &[]string{ctx.GetHeader("User-Agent")}[0],
	//     Details: map[string]interface{}{
	//         "method": ctx.Request.Method,
	//         "path":   ctx.Request.URL.Path,
	//         "query":  ctx.Request.URL.RawQuery,
	//     },
	// })
}

// RequireSystemKey creates a middleware that requires a system API key
func (m *ApiKeyMiddleware) RequireSystemKey() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		isSystemKey, exists := ctx.Get("isSystemKey")
		if !exists || !isSystemKey.(bool) {
			ctx.JSON(http.StatusForbidden, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "SYSTEM_KEY_REQUIRED",
					"message": "This endpoint requires a system API key",
				},
			})
			ctx.Abort()
			return
		}
		ctx.Next()
	}
}

// RequirePermission creates a middleware that requires specific permissions
func (m *ApiKeyMiddleware) RequirePermission(permission string) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		apiKey, exists := ctx.Get("apiKey")
		if !exists {
			ctx.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "API_KEY_MISSING",
					"message": "API key required",
				},
			})
			ctx.Abort()
			return
		}

		keyData := apiKey.(*models.ApiKey)
		hasPermission := false
		for _, p := range keyData.Permissions {
			if p == permission || p == "*" {
				hasPermission = true
				break
			}
		}

		if !hasPermission {
			ctx.JSON(http.StatusForbidden, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "INSUFFICIENT_PERMISSIONS",
					"message": "API key lacks required permission: " + permission,
				},
			})
			ctx.Abort()
			return
		}

		ctx.Next()
	}
}

// OptionalAPIKey creates a middleware that optionally validates API key
func (m *ApiKeyMiddleware) OptionalAPIKey() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		apiKey := m.extractAPIKey(ctx)
		if apiKey == "" {
			ctx.Next()
			return
		}

		// If key is provided, validate it
		if !strings.HasPrefix(apiKey, "sk_") {
			ctx.Next() // Don't block if optional
			return
		}

		keyData, err := m.apiKeyService.ValidateAPIKey(apiKey, ctx)
		if err != nil {
			ctx.Next() // Don't block if optional
			return
		}

		if !keyData.IsActive {
			ctx.Next()
			return
		}

		if keyData.ExpiresAt != nil && keyData.ExpiresAt.Before(time.Now()) {
			ctx.Next()
			return
		}

		// Set API key information in context
		ctx.Set("apiKey", keyData)
		ctx.Set("isSystemKey", keyData.Name == "system")
		ctx.Set("apiKeyUserID", keyData.UserID)

		// Update last used timestamp asynchronously
		go func() {
			if err := m.apiKeyService.UpdateLastUsed(keyData.ID); err != nil {
				log.Error().Err(err).Str("apiKeyId", keyData.ID).Msg("Failed to update API key last used timestamp")
			}
		}()

		ctx.Next()
	}
}
