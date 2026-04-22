package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/skygenesisenterprise/aether-mailer/server/src/services"
)

func GetUserExtension(c *gin.Context) {
	id := c.Param("id")
	extService := services.NewExtensionService(services.DB)

	ext, err := extService.GetUserExtension(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User extension not found"})
		return
	}

	c.JSON(http.StatusOK, ext)
}