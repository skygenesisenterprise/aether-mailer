package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func ListPasswords(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "ListPasswords not implemented",
	})
}