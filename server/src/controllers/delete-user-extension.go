package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/skygenesisenterprise/aether-mailer/server/src/services"
)

func DeleteUserExtension(c *gin.Context) {
	id := c.Param("id")
	extService := services.NewExtensionService(services.DB)

	if err := extService.DeleteUserExtension(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}