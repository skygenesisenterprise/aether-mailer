package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func CreatePassword(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "CreatePassword not implemented",
	})
}