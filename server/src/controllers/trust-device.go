package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/skygenesisenterprise/aether-mailer/server/src/services"
)

func TrustDevice(c *gin.Context) {
	id := c.Param("id")
	securityService := services.NewSecurityService(services.DB)

	if err := securityService.TrustDevice(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Device trusted"})
}