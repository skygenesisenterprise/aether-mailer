package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func UploadAvatar(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "UploadAvatar not implemented",
	})
}