package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// ChangePassword handles POST /auth/change-password
func ChangePassword(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "ChangePassword not implemented",
	})
}