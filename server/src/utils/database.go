package utils

import (
	"errors"
	"fmt"

	"github.com/gin-gonic/gin"
	"github.com/skygenesisenterprise/aether-mailer/server/src/interfaces"
	"github.com/skygenesisenterprise/aether-mailer/server/src/middleware"
	"gorm.io/gorm"
)

// ErrNoDatabaseService est retourné quand aucun service de base de données n'est disponible
var ErrNoDatabaseService = errors.New("no database service available in context")

// ErrDatabaseLessMode est retourné quand l'application fonctionne en mode sans base de données
var ErrDatabaseLessMode = errors.New("application is running in database-less mode")

// GetDBFromContext récupère l'instance *gorm.DB depuis le contexte Gin
// Retourne nil si la base de données n'est pas disponible
func GetDBFromContext(c *gin.Context) *gorm.DB {
	service := middleware.GetDatabaseService(c)
	if service == nil {
		return nil
	}
	return service.GetDB()
}

// MustGetDBFromContext récupère l'instance *gorm.DB depuis le contexte Gin
// Retourne une erreur si la base de données n'est pas disponible
func MustGetDBFromContext(c *gin.Context) (*gorm.DB, error) {
	service, err := middleware.MustGetDatabaseService(c)
	if err != nil {
		return nil, ErrNoDatabaseService
	}

	db := service.GetDB()
	if db == nil {
		return nil, ErrNoDatabaseService
	}

	return db, nil
}

// GetDatabaseServiceFromContext récupère le service de base de données depuis le contexte
// Retourne nil si le service n'est pas disponible
func GetDatabaseServiceFromContext(c *gin.Context) interfaces.IDatabaseService {
	return middleware.GetDatabaseService(c)
}

// MustGetDatabaseServiceFromContext récupère le service de base de données depuis le contexte
// Retourne une erreur si le service n'est pas disponible
func MustGetDatabaseServiceFromContext(c *gin.Context) (interfaces.IDatabaseService, error) {
	return middleware.MustGetDatabaseService(c)
}

// IsDatabaseLessMode vérifie si l'application fonctionne en mode sans base de données
func IsDatabaseLessMode(c *gin.Context) bool {
	dbLess, exists := c.Get("database_less")
	if !exists {
		return false
	}

	if isLess, ok := dbLess.(bool); ok {
		return isLess
	}

	return false
}

// RequireDatabaseOrAbort vérifie que la base de données est disponible
// Sinon, aborte la requête avec une erreur 503
func RequireDatabaseOrAbort(c *gin.Context) *gorm.DB {
	db, err := MustGetDBFromContext(c)
	if err != nil {
		c.JSON(503, gin.H{
			"error":   "Service Unavailable",
			"message": "Database service is not available",
		})
		c.Abort()
		return nil
	}
	return db
}

// DBErrorf crée une erreur formatée avec le préfixe de la base de données
func DBErrorf(format string, args ...interface{}) error {
	return fmt.Errorf("[database] "+format, args...)
}

// SafeQuery exécute une requête de manière sécurisée avec récupération de panique
func SafeQuery(fn func() error) (err error) {
	defer func() {
		if r := recover(); r != nil {
			err = fmt.Errorf("[database] panic recovered: %v", r)
		}
	}()
	return fn()
}
