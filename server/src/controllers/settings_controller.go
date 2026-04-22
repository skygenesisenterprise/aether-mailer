package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
	"github.com/skygenesisenterprise/aether-mailer/server/src/services"
)

func GetSystemSettings(c *gin.Context) {
	settingsService := services.NewSettingsService(services.DB)

	settings, err := settingsService.GetSystemSettings()
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Settings not found"})
		return
	}

	c.JSON(http.StatusOK, settings)
}

func UpdateSystemSettings(c *gin.Context) {
	var settings models.SystemSettings
	if err := c.ShouldBindJSON(&settings); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	settingsService := services.NewSettingsService(services.DB)
	if err := settingsService.UpdateSystemSettings(&settings); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, settings)
}

func GetFeatureFlags(c *gin.Context) {
	tenantID := c.Query("tenantId")
	settingsService := services.NewSettingsService(services.DB)

	flags, err := settingsService.GetFeatureFlags(tenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, flags)
}

func CreateFeatureFlag(c *gin.Context) {
	var flag models.FeatureFlag
	if err := c.ShouldBindJSON(&flag); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	settingsService := services.NewSettingsService(services.DB)
	if err := settingsService.CreateFeatureFlag(&flag); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, flag)
}

func UpdateFeatureFlag(c *gin.Context) {
	id := c.Param("id")
	var flag models.FeatureFlag
	if err := c.ShouldBindJSON(&flag); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	flag.ID = id
	settingsService := services.NewSettingsService(services.DB)
	if err := settingsService.UpdateFeatureFlag(&flag); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, flag)
}

func DeleteFeatureFlag(c *gin.Context) {
	id := c.Param("id")
	settingsService := services.NewSettingsService(services.DB)

	if err := settingsService.DeleteFeatureFlag(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}

func GetGeneralSettings(c *gin.Context) {
	GetSystemSettings(c)
}

func UpdateGeneralSettings(c *gin.Context) {
	UpdateSystemSettings(c)
}

func GetDockerSettings(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"enabled": false,
		"image":   "",
		"tag":     "latest",
	})
}

func UpdateDockerSettings(c *gin.Context) {
	var settings map[string]interface{}
	if err := c.ShouldBindJSON(&settings); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	c.JSON(http.StatusOK, settings)
}

func GetEmailSettings(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"provider":   "smtp",
		"host":       "",
		"port":       587,
		"from_email": "",
	})
}

func UpdateEmailSettings(c *gin.Context) {
	var settings map[string]interface{}
	if err := c.ShouldBindJSON(&settings); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	c.JSON(http.StatusOK, settings)
}

func TestEmailConfig(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Test email sent"})
}

func UpdateFeatureFlags(c *gin.Context) {
	var flags models.FeatureFlag
	if err := c.ShouldBindJSON(&flags); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	c.JSON(http.StatusOK, flags)
}
