package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
	"github.com/skygenesisenterprise/aether-mailer/server/src/services"
)

// AppAuthMiddleware est un middleware qui valide la clé système pour les requêtes de l'application
// Ce middleware est conçu pour être utilisé par l'application web (app/app/) pour authentifier
// les requêtes internes. La clé système est considérée comme une clé "système" et ne doit
// être utilisée que par l'application elle-même.
type AppAuthMiddleware struct {
	systemKey         string
	serviceKeyService *services.ServiceKeyService
}

// NewAppAuthMiddleware crée un nouveau AppAuthMiddleware
func NewAppAuthMiddleware(systemKey string, serviceKeyService *services.ServiceKeyService) *AppAuthMiddleware {
	return &AppAuthMiddleware{
		systemKey:         systemKey,
		serviceKeyService: serviceKeyService,
	}
}

// Authenticate valide la clé système à partir de la requête
func (m *AppAuthMiddleware) Authenticate(c *gin.Context) {
	// Get the service key from the Authorization header
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "Authorization header is required",
			"message": "System key authentication required",
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
			"message": "System key must be in format 'Bearer sk_...' or 'sk_...'",
		})
		return
	}

	// First, try to validate the service key from the database
	if m.serviceKeyService != nil && m.serviceKeyService.DB != nil {
		isValid, err := m.serviceKeyService.ValidateServiceKey(serviceKey)
		if err == nil && isValid {
			serviceKeyDetails, err := m.serviceKeyService.GetServiceKeyByKey(serviceKey)
			if err == nil {
				c.Set("service_key", serviceKeyDetails)
				c.Set("is_service_key", true)
				c.Set("is_app_request", true)
				c.Next()
				return
			}
		}
	}

	// Fallback: check if this is the system key from config
	if serviceKey == m.systemKey {
		systemKeyDetails := &models.ServiceKey{
			Key:         m.systemKey,
			Name:        "System Key",
			Description: "System key used by the application for internal requests",
			IsActive:    true,
		}
		c.Set("service_key", systemKeyDetails)
		c.Set("is_system_key", true)
		c.Set("is_app_request", true)
		c.Next()
		return
	}

	c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
		"success": false,
		"error":   "Invalid system key",
		"message": "System key is invalid",
	})
}

// AppAuth est une fonction de commodité pour créer le middleware
func AppAuth(systemKey string, serviceKeyService *services.ServiceKeyService) gin.HandlerFunc {
	return NewAppAuthMiddleware(systemKey, serviceKeyService).Authenticate
}
