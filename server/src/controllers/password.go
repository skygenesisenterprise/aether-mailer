package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetPassword(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "GetPassword not implemented",
	})
}