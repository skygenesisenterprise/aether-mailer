package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// AuthorizeSubmit handles POST /auth/authorize
func AuthorizeSubmit(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "AuthorizeSubmit not implemented",
	})
}