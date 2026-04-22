package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// Authorize handles GET /auth/authorize
func Authorize(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "Authorize not implemented",
	})
}