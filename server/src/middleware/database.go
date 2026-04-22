package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/skygenesisenterprise/aether-mailer/server/src/interfaces"
)

// DatabaseContextKey est la clé utilisée pour stocker le service de base de données dans le contexte
const DatabaseContextKey = "database_service"

// DatabaseMiddleware crée un middleware qui injecte le service de base de données dans le contexte
// Il vérifie la connexion et tente une reconnexion si nécessaire
func DatabaseMiddleware(dbService interfaces.IDatabaseService) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Si aucun service n'est fourni (mode database-less)
		if dbService == nil {
			c.Set(DatabaseContextKey, nil)
			c.Set("database_less", true)
			c.Next()
			return
		}

		// Vérifier la connexion avec un ping rapide
		if err := dbService.Ping(c.Request.Context()); err != nil {
			// La connexion est perdue, on essaie de continuer en mode database-less
			c.Set(DatabaseContextKey, nil)
			c.Set("database_less", true)
			c.Set("database_error", err.Error())
			c.Next()
			return
		}

		// Stocker le service dans le contexte
		c.Set(DatabaseContextKey, dbService)
		c.Set("database_less", false)
		c.Next()
	}
}

// RequireDatabaseMiddleware crée un middleware qui exige une connexion à la base de données
// Retourne une erreur 503 si la base de données n'est pas disponible
func RequireDatabaseMiddleware(dbService interfaces.IDatabaseService) gin.HandlerFunc {
	return func(c *gin.Context) {
		if dbService == nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"error":   "Database unavailable",
				"message": "The database service is not configured",
			})
			c.Abort()
			return
		}

		if err := dbService.Ping(c.Request.Context()); err != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"error":   "Database connection failed",
				"message": err.Error(),
			})
			c.Abort()
			return
		}

		c.Set(DatabaseContextKey, dbService)
		c.Next()
	}
}

// GetDatabaseService récupère le service de base de données depuis le contexte
// Retourne nil si le service n'est pas disponible
func GetDatabaseService(c *gin.Context) interfaces.IDatabaseService {
	service, exists := c.Get(DatabaseContextKey)
	if !exists || service == nil {
		return nil
	}

	if dbService, ok := service.(interfaces.IDatabaseService); ok {
		return dbService
	}

	return nil
}

// MustGetDatabaseService récupère le service de base de données depuis le contexte
// Retourne une erreur si le service n'est pas disponible
func MustGetDatabaseService(c *gin.Context) (interfaces.IDatabaseService, error) {
	service := GetDatabaseService(c)
	if service == nil {
		return nil, http.ErrNotSupported // Using standard error, you might want a custom one
	}
	return service, nil
}
