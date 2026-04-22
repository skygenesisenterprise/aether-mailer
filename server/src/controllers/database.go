package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/skygenesisenterprise/aether-mailer/server/src/interfaces"
	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
	"github.com/skygenesisenterprise/aether-mailer/server/src/utils"
)

// DatabaseController gère les opérations liées à la base de données
type DatabaseController struct {
	dbService interfaces.IDatabaseService
}

// NewDatabaseController crée une nouvelle instance du contrôleur de base de données
func NewDatabaseController(dbService interfaces.IDatabaseService) *DatabaseController {
	return &DatabaseController{
		dbService: dbService,
	}
}

// GetStatus retourne l'état de santé de la base de données
func (dc *DatabaseController) GetStatus(c *gin.Context) {
	if dc.dbService == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status":    "unavailable",
			"connected": false,
			"message":   "Database service is not configured",
		})
		return
	}

	health, err := dc.dbService.GetHealth(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status":    "error",
			"connected": false,
			"message":   err.Error(),
		})
		return
	}

	statusCode := http.StatusOK
	if health.Status == "unhealthy" {
		statusCode = http.StatusServiceUnavailable
	} else if health.Status == "degraded" {
		statusCode = http.StatusOK
	}

	c.JSON(statusCode, health)
}

// GetStats retourne les statistiques de la base de données
func (dc *DatabaseController) GetStats(c *gin.Context) {
	if dc.dbService == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "Database service is not available",
		})
		return
	}

	stats, err := dc.dbService.GetStats(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to get database stats",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// GetTables retourne la liste des tables avec leurs informations
func (dc *DatabaseController) GetTables(c *gin.Context) {
	if dc.dbService == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "Database service is not available",
		})
		return
	}

	tables, err := dc.dbService.GetTables(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to get tables",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"tables": tables,
		"count":  len(tables),
	})
}

// GetTableSchema retourne le schéma d'une table spécifique
func (dc *DatabaseController) GetTableSchema(c *gin.Context) {
	if dc.dbService == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "Database service is not available",
		})
		return
	}

	tableName := c.Param("tableName")
	if tableName == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Table name is required",
		})
		return
	}

	schema, err := dc.dbService.GetTableSchema(c.Request.Context(), tableName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to get table schema",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"tableName": tableName,
		"schema":    schema,
	})
}

// MigrateRequest représente une requête de migration
type MigrateRequest struct {
	Models []string `json:"models,omitempty"`
}

// Migrate déclenche les migrations des modèles
func (dc *DatabaseController) Migrate(c *gin.Context) {
	if dc.dbService == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "Database service is not available",
		})
		return
	}

	db := utils.GetDBFromContext(c)
	if db == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "Database connection not available",
		})
		return
	}

	// Auto-migration de tous les modèles
	if err := dc.dbService.AutoMigrate(
		&models.User{},
		&models.Organization{},
		&models.Role{},
		&models.Membership{},
		&models.OAuthClient{},
		&models.OAuthAuthorizationCode{},
		&models.OAuthAccessToken{},
		&models.OAuthRefreshToken{},
		&models.OAuthConsent{},
		&models.Domain{},
		&models.UserDomain{},
		&models.DomainVerification{},
		&models.DomainSettings{},
		&models.ExternalAccount{},
		&models.OAuthState{},
	); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Migration failed",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Migrations completed successfully",
	})
}

// MaintenanceRequest représente une requête de maintenance
type MaintenanceRequest struct {
	Action    string `json:"action" binding:"required"` // vacuum, analyze, reindex
	TableName string `json:"tableName,omitempty"`
}

// Maintenance exécute des opérations de maintenance sur la base de données
func (dc *DatabaseController) Maintenance(c *gin.Context) {
	if dc.dbService == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "Database service is not available",
		})
		return
	}

	var req MaintenanceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request",
			"message": err.Error(),
		})
		return
	}

	var err error
	switch req.Action {
	case "vacuum":
		if req.TableName == "" {
			err = dc.dbService.Vacuum(c.Request.Context(), req.TableName)
		} else {
			err = dc.dbService.Vacuum(c.Request.Context(), req.TableName)
		}
	case "analyze":
		if req.TableName == "" {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Table name is required for analyze",
			})
			return
		}
		err = dc.dbService.Analyze(c.Request.Context(), req.TableName)
	case "reindex":
		if req.TableName == "" {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Table name is required for reindex",
			})
			return
		}
		err = dc.dbService.Reindex(c.Request.Context(), req.TableName)
	default:
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid action",
			"message": "Supported actions: vacuum, analyze, reindex",
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Maintenance operation failed",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"action":  req.Action,
		"table":   req.TableName,
		"message": "Maintenance operation completed successfully",
	})
}
