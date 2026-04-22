package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
	"github.com/skygenesisenterprise/aether-mailer/server/src/services"
)

func CreateConnection(c *gin.Context) {
	var conn models.Connection
	if err := c.ShouldBindJSON(&conn); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	connService := services.NewConnectionService(services.DB)
	if err := connService.CreateConnection(&conn); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, conn)
}

func GetConnection(c *gin.Context) {
	id := c.Param("id")
	connService := services.NewConnectionService(services.DB)

	conn, err := connService.GetConnectionByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Connection not found"})
		return
	}

	c.JSON(http.StatusOK, conn)
}

func ListConnections(c *gin.Context) {
	connService := services.NewConnectionService(services.DB)

	conns, err := connService.ListConnections()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, conns)
}

func UpdateConnection(c *gin.Context) {
	id := c.Param("id")
	var conn models.Connection
	if err := c.ShouldBindJSON(&conn); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	conn.ID = id
	connService := services.NewConnectionService(services.DB)

	if err := connService.UpdateConnection(&conn); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, conn)
}

func DeleteConnection(c *gin.Context) {
	id := c.Param("id")
	connService := services.NewConnectionService(services.DB)

	if err := connService.DeleteConnection(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}

func EnableConnection(c *gin.Context) {
	id := c.Param("id")
	connService := services.NewConnectionService(services.DB)

	conn, err := connService.GetConnectionByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Connection not found"})
		return
	}

	conn.IsEnabled = true
	if err := connService.UpdateConnection(conn); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, conn)
}

func CreateAuthenticationProfile(c *gin.Context) {
	var profile models.AuthenticationProfile
	if err := c.ShouldBindJSON(&profile); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	connService := services.NewConnectionService(services.DB)
	if err := connService.CreateAuthenticationProfile(&profile); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, profile)
}

func ListAuthenticationProfiles(c *gin.Context) {
	connService := services.NewConnectionService(services.DB)

	profiles, err := connService.ListAuthenticationProfiles()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, profiles)
}

func DisableConnection(c *gin.Context) {
	id := c.Param("id")
	connService := services.NewConnectionService(services.DB)
	conn, err := connService.GetConnectionByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Connection not found"})
		return
	}
	conn.IsEnabled = false
	if err := connService.UpdateConnection(conn); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, conn)
}

func CreateDatabaseConnection(c *gin.Context) {
	var dbConn models.DatabaseConnection
	if err := c.ShouldBindJSON(&dbConn); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}
	connService := services.NewConnectionService(services.DB)
	if err := connService.CreateDatabaseConnection(&dbConn); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, dbConn)
}

func ConfigureDatabaseConnection(c *gin.Context) {
	id := c.Param("id")
	var dbConn models.DatabaseConnection
	if err := c.ShouldBindJSON(&dbConn); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}
	dbConn.ID = id
	connService := services.NewConnectionService(services.DB)
	if err := connService.UpdateDatabaseConnection(&dbConn); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, dbConn)
}

func ListDatabaseConnectionUsers(c *gin.Context) {
	id := c.Param("id")
	connService := services.NewConnectionService(services.DB)
	users, err := connService.ListDatabaseConnectionUsers(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, users)
}

func ListSocialProviders(c *gin.Context) {
	connService := services.NewConnectionService(services.DB)
	providers, err := connService.ListSocialProviders()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, providers)
}

func ConfigureSocialProvider(c *gin.Context) {
	var provider models.SocialProvider
	if err := c.ShouldBindJSON(&provider); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}
	connService := services.NewConnectionService(services.DB)
	if err := connService.CreateSocialProvider(&provider); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, provider)
}

func ListEnterpriseConnections(c *gin.Context) {
	connService := services.NewConnectionService(services.DB)
	conns, err := connService.ListEnterpriseConnections()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, conns)
}

func CreateSamlConnection(c *gin.Context) {
	var conn models.EnterpriseConnection
	if err := c.ShouldBindJSON(&conn); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}
	connService := services.NewConnectionService(services.DB)
	if err := connService.CreateEnterpriseConnection(&conn); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, conn)
}

func UpdateSamlSettings(c *gin.Context) {
	id := c.Param("id")
	var conn models.EnterpriseConnection
	if err := c.ShouldBindJSON(&conn); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}
	conn.ID = id
	connService := services.NewConnectionService(services.DB)
	if err := connService.UpdateEnterpriseConnection(&conn); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, conn)
}

func UpdateSamlMetadata(c *gin.Context) {
	id := c.Param("id")
	var conn models.EnterpriseConnection
	if err := c.ShouldBindJSON(&conn); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}
	conn.ID = id
	connService := services.NewConnectionService(services.DB)
	if err := connService.UpdateEnterpriseConnection(&conn); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, conn)
}

func CreateOidcConnection(c *gin.Context) {
	var conn models.EnterpriseConnection
	if err := c.ShouldBindJSON(&conn); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}
	connService := services.NewConnectionService(services.DB)
	if err := connService.CreateEnterpriseConnection(&conn); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, conn)
}

func ListPasswordlessSettings(c *gin.Context) {
	connService := services.NewConnectionService(services.DB)
	settings, err := connService.ListPasswordlessConnections()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, settings)
}

func EnablePasswordless(c *gin.Context) {
	var conn models.PasswordlessConnection
	if err := c.ShouldBindJSON(&conn); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}
	conn.IsEnabled = true
	connService := services.NewConnectionService(services.DB)
	if err := connService.CreatePasswordlessConnection(&conn); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, conn)
}

func ConfigurePasswordless(c *gin.Context) {
	id := c.Param("id")
	var conn models.PasswordlessConnection
	if err := c.ShouldBindJSON(&conn); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}
	conn.ID = id
	connService := services.NewConnectionService(services.DB)
	if err := connService.UpdatePasswordlessConnection(&conn); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, conn)
}
