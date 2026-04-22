package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/skygenesisenterprise/aether-mailer/server/src/config"
	"github.com/skygenesisenterprise/aether-mailer/server/src/services"
)

// AdaptiveCORSMiddleware crée un middleware CORS qui s'adapte selon l'origine et le client
func AdaptiveCORSMiddleware() gin.HandlerFunc {
	cfg := config.LoadConfig()

	return func(c *gin.Context) {
		origin := c.GetHeader("Origin")

		// Déterminer les origines autorisées
		allowedOrigins := cfg.CORSAllowedOrigins

		// Si un client OAuth est spécifié, utiliser ses origines autorisées
		if clientID := c.Query("client_id"); clientID != "" {
			if services.DB != nil {
				oauthService := services.NewOAuthService(services.DB, nil)
				if client, err := oauthService.GetClientByID(clientID); err == nil {
					if len(client.AllowedOrigins) > 0 {
						allowedOrigins = client.AllowedOrigins
					}
				}
			}
		}

		// Vérifier si l'origine est autorisée
		if isOriginAllowed(origin, allowedOrigins) {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
			c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		} else if origin == "" || isLocalhost(origin) {
			// Autoriser localhost même si pas dans la liste
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
			c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		}

		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type, Accept, Origin, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Expose-Headers", "Authorization, Content-Type")

		// Gérer les requêtes preflight OPTIONS
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}

// isOriginAllowed vérifie si une origine est dans la liste des origines autorisées
func isOriginAllowed(origin string, allowedOrigins []string) bool {
	for _, allowed := range allowedOrigins {
		if strings.EqualFold(allowed, origin) {
			return true
		}
		// Support des wildcards (ex: http://localhost:*)
		if strings.HasSuffix(allowed, ":*") {
			prefix := strings.TrimSuffix(allowed, ":*")
			if strings.HasPrefix(origin, prefix) {
				return true
			}
		}
	}
	return false
}

// isLocalhost vérifie si l'origine est localhost
func isLocalhost(origin string) bool {
	localhostPatterns := []string{
		"http://localhost",
		"https://localhost",
		"http://127.0.0.1",
		"https://127.0.0.1",
		"http://[::1]",
		"https://[::1]",
	}

	for _, pattern := range localhostPatterns {
		if strings.HasPrefix(origin, pattern) {
			return true
		}
	}
	return false
}
