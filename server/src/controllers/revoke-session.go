package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/skygenesisenterprise/aether-mailer/server/src/services"
)

func RevokeSession(c *gin.Context) {
	id := c.Param("id")
	securityService := services.NewSecurityService(services.DB)

	if err := securityService.RevokeSession(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}