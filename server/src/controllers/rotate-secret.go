package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func RotateSecret(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "RotateSecret not implemented"})
}