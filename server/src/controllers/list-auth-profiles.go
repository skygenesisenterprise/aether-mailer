package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func ListAuthProfiles(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "ListAuthProfiles not implemented"})
}