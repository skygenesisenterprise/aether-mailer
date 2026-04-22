package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func ListEnterpriseConnections(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "ListEnterpriseConnections not implemented"})
}