package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// HealthCheck vérifie l'état de santé de l'API
func HealthCheck(c *gin.Context) {
	if c.Request.Method == "HEAD" {
		c.Status(http.StatusOK)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "healthy",
		"message": "API is running successfully",
		"version": "1.0.0",
	})
}
