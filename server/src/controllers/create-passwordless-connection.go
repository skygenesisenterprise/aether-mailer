package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func CreatePasswordlessConnection(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "CreatePasswordlessConnection not implemented"})
}