package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func ListPasswordlessConnections(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "ListPasswordlessConnections not implemented"})
}