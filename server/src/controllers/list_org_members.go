package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func ListOrgMembers(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "ListOrgMembers not implemented",
	})
}