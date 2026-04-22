package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/skygenesisenterprise/aether-mailer/server/src/services"
)

func RevokeDevice(c *gin.Context) {
	id := c.Param("id")
	securityService := services.NewSecurityService(services.DB)

	if err := securityService.RevokeDevice(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}