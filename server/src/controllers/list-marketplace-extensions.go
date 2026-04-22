package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/skygenesisenterprise/aether-mailer/server/src/services"
)

func ListMarketplaceExtensions(c *gin.Context) {
	extService := services.NewExtensionService(services.DB)

	extensions, err := extService.ListMarketplaceExtensions()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, extensions)
}