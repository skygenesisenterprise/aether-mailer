package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// ResetPassword handles POST /auth/reset-password
func ResetPassword(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "ResetPassword not implemented",
	})
}