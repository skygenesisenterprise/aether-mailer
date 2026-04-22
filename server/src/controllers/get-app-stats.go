package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetAppStats(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "GetAppStats not implemented"})
}