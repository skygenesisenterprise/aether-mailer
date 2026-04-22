package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func RemoveOrgMember(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "RemoveOrgMember not implemented",
	})
}