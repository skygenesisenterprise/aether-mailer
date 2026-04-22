package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func CreateAuthProfile(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "CreateAuthProfile not implemented"})
}