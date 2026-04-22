package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
	"github.com/skygenesisenterprise/aether-mailer/server/src/services"
)

func ListMarketplaceIntegrations(c *gin.Context) {
	marketplaceService := services.NewMarketplaceService(services.DB)

	integrations, err := marketplaceService.ListMarketplaceIntegrations()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, integrations)
}

func GetMarketplaceIntegration(c *gin.Context) {
	id := c.Param("id")
	marketplaceService := services.NewMarketplaceService(services.DB)

	integration, err := marketplaceService.GetMarketplaceIntegration(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Integration not found"})
		return
	}

	c.JSON(http.StatusOK, integration)
}

func InstallMarketplaceIntegration(c *gin.Context) {
	id := c.Param("id")
	marketplaceService := services.NewMarketplaceService(services.DB)

	integration, err := marketplaceService.GetMarketplaceIntegration(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Integration not found"})
		return
	}

	integration.IsInstalled = true
	if err := marketplaceService.UpdateMarketplaceIntegration(integration); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, integration)
}

func CreateMarketplaceIntegration(c *gin.Context) {
	var integration models.MarketplaceIntegration
	if err := c.ShouldBindJSON(&integration); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	marketplaceService := services.NewMarketplaceService(services.DB)
	if err := marketplaceService.CreateMarketplaceIntegration(&integration); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, integration)
}

func GetIntegrationDetails(c *gin.Context) {
	GetMarketplaceIntegration(c)
}

func InstallIntegration(c *gin.Context) {
	InstallMarketplaceIntegration(c)
}

func UninstallIntegration(c *gin.Context) {
	id := c.Param("id")
	marketplaceService := services.NewMarketplaceService(services.DB)
	integration, err := marketplaceService.GetMarketplaceIntegration(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Integration not found"})
		return
	}

	integration.IsInstalled = false
	if err := marketplaceService.UpdateMarketplaceIntegration(integration); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Integration uninstalled"})
}
