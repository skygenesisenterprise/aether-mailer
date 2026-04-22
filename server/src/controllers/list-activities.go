package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/skygenesisenterprise/aether-mailer/server/src/services"
)

func ListSecurityActivities(c *gin.Context) {
	securityService := services.NewSecurityService(services.DB)

	activities, err := securityService.ListSecurityActivities()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, activities)
}