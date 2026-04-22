package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func UpdateProfile(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "UpdateProfile not implemented",
	})
}