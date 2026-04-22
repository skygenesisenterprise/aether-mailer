package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetAccountMe(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "GetAccountMe not implemented",
	})
}