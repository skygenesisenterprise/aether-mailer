package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func CreateADConnection(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "CreateADConnection not implemented"})
}