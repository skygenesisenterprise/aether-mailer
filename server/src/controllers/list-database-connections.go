package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func ListDatabaseConnections(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "ListDatabaseConnections not implemented"})
}