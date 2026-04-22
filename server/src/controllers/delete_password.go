package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func DeletePassword(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "DeletePassword not implemented",
	})
}