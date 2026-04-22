package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func CreateSocialConnection(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "CreateSocialConnection not implemented"})
}