package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/skygenesisenterprise/aether-mailer/server/src/services"
)

// AdminMiddleware vérifie si l'utilisateur est un administrateur
func AdminMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Extraire l'utilisateur de la requête
		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Unauthorized",
			})
			c.Abort()
			return
		}

		// Récupérer l'utilisateur
		userService := services.NewUserService(services.DB)
		user, err := userService.GetUserByID(userID.(string))
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Unauthorized",
			})
			c.Abort()
			return
		}

		// Vérifier si l'utilisateur est un administrateur via le champ role
		if user.Role != "ADMIN" {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Forbidden",
			})
			c.Abort()
			return
		}

		// Continuer si l'utilisateur est un administrateur
		c.Next()
	}
}
