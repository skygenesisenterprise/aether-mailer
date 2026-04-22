package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
	"github.com/skygenesisenterprise/aether-mailer/server/src/services"
)

// ServiceKeyAuthMiddleware is a middleware that validates service keys
type ServiceKeyAuthMiddleware struct {
	ServiceKeyService *services.ServiceKeyService
	systemKey         string
}

// NewServiceKeyAuthMiddleware creates a new ServiceKeyAuthMiddleware
func NewServiceKeyAuthMiddleware(serviceKeyService *services.ServiceKeyService, systemKey string) *ServiceKeyAuthMiddleware {
	return &ServiceKeyAuthMiddleware{
		ServiceKeyService: serviceKeyService,
		systemKey:         systemKey,
	}
}

// Authenticate validates the service key from the request
func (m *ServiceKeyAuthMiddleware) Authenticate(c *gin.Context) {
	// Get the service key from the Authorization header
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "Authorization header is required",
			"message": "Service key authentication required",
		})
		return
	}

	// Extract the service key from the header
	// Expected format: "Bearer sk_..." or just "sk_..."
	parts := strings.Split(authHeader, " ")
	var serviceKey string
	if len(parts) == 2 && parts[0] == "Bearer" {
		serviceKey = parts[1]
	} else if len(parts) == 1 {
		serviceKey = parts[0]
	} else {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "Invalid authorization format",
			"message": "Service key must be in format 'Bearer sk_...' or 'sk_...'",
		})
		return
	}

	// First, try to validate the service key from the database
	if m.ServiceKeyService != nil && m.ServiceKeyService.DB != nil {
		isValid, err := m.ServiceKeyService.ValidateServiceKey(serviceKey)
		if err == nil && isValid {
			// Get the service key details from database
			serviceKeyDetails, err := m.ServiceKeyService.GetServiceKeyByKey(serviceKey)
			if err == nil {
				c.Set("service_key", serviceKeyDetails)
				c.Set("is_service_key", true)
				c.Next()
				return
			}
		}
	}

	// Fallback: check if this is the system key from config (for backwards compatibility)
	if serviceKey == m.systemKey {
		systemKeyDetails := &models.ServiceKey{
			Key:         m.systemKey,
			Name:        "System Key (Application)",
			Description: "System key used by the application for internal requests",
			IsActive:    true,
		}
		c.Set("service_key", systemKeyDetails)
		c.Set("is_system_key", true)
		c.Next()
		return
	}

	c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
		"success": false,
		"error":   "Invalid service key",
		"message": "Service key is invalid or expired",
	})
}

// ServiceKeyAuth is a convenience function to create the middleware
func ServiceKeyAuth(serviceKeyService *services.ServiceKeyService, systemKey string) gin.HandlerFunc {
	return NewServiceKeyAuthMiddleware(serviceKeyService, systemKey).Authenticate
}
