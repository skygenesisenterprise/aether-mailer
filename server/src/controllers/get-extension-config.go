package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/skygenesisenterprise/aether-mailer/server/src/services"
)

func GetExtensionConfig(c *gin.Context) {
	id := c.Param("id")
	extService := services.NewExtensionService(services.DB)
	config, err := extService.GetExtensionConfig(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Extension config not found"})
		return
	}

	c.JSON(http.StatusOK, config)
}