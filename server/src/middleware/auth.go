package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/skygenesisenterprise/aether-mailer/server/src/config"
	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
	"github.com/skygenesisenterprise/aether-mailer/server/src/services"
)

// AuthMiddleware handles authentication
type AuthMiddleware struct {
	authService *services.AuthService
	config      *config.Config
}

// NewAuthMiddleware creates a new authentication middleware
func NewAuthMiddleware(authService *services.AuthService, config *config.Config) *AuthMiddleware {
	return &AuthMiddleware{
		authService: authService,
		config:      config,
	}
}

// AuthenticateToken validates JWT tokens
func (m *AuthMiddleware) AuthenticateToken() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		authHeader := ctx.GetHeader("Authorization")
		if authHeader == "" {
			ctx.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "NO_TOKEN",
					"message": "Access token required",
				},
			})
			ctx.Abort()
			return
		}

		// Extract token from "Bearer <token>"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			ctx.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "INVALID_TOKEN_FORMAT",
					"message": "Invalid token format. Expected: Bearer <token>",
				},
			})
			ctx.Abort()
			return
		}

		token := parts[1]

		// Parse and validate token
		claims := &jwt.MapClaims{}
		parsedToken, err := jwt.ParseWithClaims(token, claims, func(token *jwt.Token) (interface{}, error) {
			return []byte(m.config.JWT.Secret), nil
		})

		if err != nil {
			ctx.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "INVALID_TOKEN",
					"message": "Invalid or expired token",
				},
			})
			ctx.Abort()
			return
		}

		if !parsedToken.Valid {
			ctx.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "INVALID_TOKEN",
					"message": "Invalid token",
				},
			})
			ctx.Abort()
			return
		}

		// Extract user information from token
		userID, ok := (*claims)["userId"].(string)
		if !ok {
			ctx.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "INVALID_TOKEN",
					"message": "Invalid token payload",
				},
			})
			ctx.Abort()
			return
		}

		tokenType, ok := (*claims)["type"].(string)
		if !ok || tokenType != "access" {
			ctx.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "INVALID_TOKEN",
					"message": "Invalid token type",
				},
			})
			ctx.Abort()
			return
		}

		// In a real implementation, you would verify the user exists in the database
		// For now, we'll create a user profile from the token claims
		userProfile := models.UserProfile{
			ID:   userID,
			Role: (*claims)["role"].(string),
		}

		// Set user in context
		ctx.Set("user", userProfile)
		ctx.Next()
	}
}

// RequireRole creates a middleware that requires specific roles
func (m *AuthMiddleware) RequireRole(roles []string) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		user, exists := ctx.Get("user")
		if !exists {
			ctx.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "NOT_AUTHENTICATED",
					"message": "Authentication required",
				},
			})
			ctx.Abort()
			return
		}

		userProfile, ok := user.(models.UserProfile)
		if !ok {
			ctx.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "INVALID_USER_CONTEXT",
					"message": "Invalid user context",
				},
			})
			ctx.Abort()
			return
		}

		// Check if user has required role
		hasRequiredRole := false
		for _, role := range roles {
			if userProfile.Role == role {
				hasRequiredRole = true
				break
			}
		}

		if !hasRequiredRole {
			ctx.JSON(http.StatusForbidden, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "INSUFFICIENT_PERMISSIONS",
					"message": "Insufficient permissions",
				},
			})
			ctx.Abort()
			return
		}

		ctx.Next()
	}
}

// RequireAdmin creates a middleware that requires admin role
func (m *AuthMiddleware) RequireAdmin() gin.HandlerFunc {
	return m.RequireRole([]string{string(models.UserRoleAdmin)})
}

// RequireDomainAdmin creates a middleware that requires admin or domain admin role
func (m *AuthMiddleware) RequireDomainAdmin() gin.HandlerFunc {
	return m.RequireRole([]string{
		string(models.UserRoleAdmin),
		string(models.UserRoleDomainAdmin),
	})
}

// OptionalAuth creates a middleware that optionally authenticates
func (m *AuthMiddleware) OptionalAuth() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		authHeader := ctx.GetHeader("Authorization")
		if authHeader == "" {
			ctx.Next()
			return
		}

		// Extract token from "Bearer <token>"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			ctx.Next()
			return
		}

		token := parts[1]

		// Parse and validate token
		claims := &jwt.MapClaims{}
		parsedToken, err := jwt.ParseWithClaims(token, claims, func(token *jwt.Token) (interface{}, error) {
			return []byte(m.config.JWT.Secret), nil
		})

		if err != nil || !parsedToken.Valid {
			ctx.Next()
			return
		}

		// Extract user information from token
		userID, ok := (*claims)["userId"].(string)
		if !ok {
			ctx.Next()
			return
		}

		tokenType, ok := (*claims)["type"].(string)
		if !ok || tokenType != "access" {
			ctx.Next()
			return
		}

		// Create user profile from token claims
		userProfile := models.UserProfile{
			ID:   userID,
			Role: (*claims)["role"].(string),
		}

		// Set user in context
		ctx.Set("user", userProfile)
		ctx.Next()
	}
}
