package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func UpdatePassword(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "UpdatePassword not implemented",
	})
}