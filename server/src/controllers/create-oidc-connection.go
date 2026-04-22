package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func CreateOIDCConnection(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "CreateOIDCConnection not implemented"})
}