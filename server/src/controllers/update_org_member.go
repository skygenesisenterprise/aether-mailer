package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func UpdateOrgMember(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "UpdateOrgMember not implemented",
	})
}