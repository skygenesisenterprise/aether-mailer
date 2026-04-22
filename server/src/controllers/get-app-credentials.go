package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetAppCredentials(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "GetAppCredentials not implemented"})
}