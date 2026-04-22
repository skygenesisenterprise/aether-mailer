package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/skygenesisenterprise/aether-mailer/server/src/config"
)

// RoleMiddleware vérifie si l'utilisateur a le rôle requis
func RoleMiddleware(allowedRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Récupérer le token du header Authorization
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Authorization header is required",
			})
			return
		}

		// Vérifier le format du token
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Authorization header must be Bearer token",
			})
			return
		}

		tokenString := parts[1]

		// Valider le token JWT et extraire les claims
		cfg := config.LoadConfig()
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return []byte(cfg.JWTSecret), nil
		})

		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid or expired token",
			})
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid token claims",
			})
			return
		}

		// Vérifier le rôle de l'utilisateur
		userRole, ok := claims["role"].(string)
		if !ok {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"error": "User role not found in token",
			})
			return
		}

		// Vérifier si le rôle est autorisé
		hasPermission := false
		for _, role := range allowedRoles {
			if userRole == role {
				hasPermission = true
				break
			}
		}

		if !hasPermission {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"error": "Insufficient permissions",
			})
			return
		}

		// Ajouter les informations utilisateur au contexte
		c.Set("userID", uint(claims["userID"].(float64)))
		c.Set("userEmail", claims["email"].(string))
		c.Set("userRole", userRole)

		c.Next()
	}
}

// RequireAdmin vérifie si l'utilisateur est administrateur
func RequireAdmin() gin.HandlerFunc {
	return RoleMiddleware("admin")
}

// RequireModerator vérifie si l'utilisateur est modérateur ou administrateur
func RequireModerator() gin.HandlerFunc {
	return RoleMiddleware("moderator", "admin")
}

// RequireUser vérifie si l'utilisateur est authentifié (rôle user ou supérieur)
func RequireUser() gin.HandlerFunc {
	return RoleMiddleware("user", "moderator", "admin")
}

// RequireSelfOrAdmin permet à un utilisateur d'accéder à ses propres ressources ou aux ressources si admin
func RequireSelfOrAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Récupérer le token et valider
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Authorization header is required",
			})
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Authorization header must be Bearer token",
			})
			return
		}

		tokenString := parts[1]
		cfg := config.LoadConfig()
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return []byte(cfg.JWTSecret), nil
		})

		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid or expired token",
			})
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid token claims",
			})
			return
		}

		userID := uint(claims["userID"].(float64))
		userRole := claims["role"].(string)

		// Si admin, autoriser l'accès
		if userRole == "admin" {
			c.Set("userID", userID)
			c.Set("userEmail", claims["email"].(string))
			c.Set("userRole", userRole)
			c.Next()
			return
		}

		// Sinon, vérifier que l'utilisateur accède à ses propres ressources
		targetUserID := c.Param("id")
		if targetUserID == "" {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{
				"error": "User ID parameter is required",
			})
			return
		}

		// Comparer les IDs (conversion simple pour cet exemple)
		if targetUserID == string(rune(userID)) {
			c.Set("userID", userID)
			c.Set("userEmail", claims["email"].(string))
			c.Set("userRole", userRole)
			c.Next()
			return
		}

		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
			"error": "You can only access your own resources",
		})
	}
}
