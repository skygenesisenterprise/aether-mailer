package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/skygenesisenterprise/aether-mailer/server/src/services"
)

func GetForm(c *gin.Context) {
	id := c.Param("id")
	actionService := services.NewActionService(services.DB)

	action, err := actionService.GetAction(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Form not found"})
		return
	}

	c.JSON(http.StatusOK, action)
}