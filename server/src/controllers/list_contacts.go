package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func ListContacts(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "ListContacts not implemented"})
}