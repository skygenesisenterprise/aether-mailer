package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetProfile(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "GetProfile not implemented",
	})
}