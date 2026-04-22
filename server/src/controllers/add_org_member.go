package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func AddOrgMember(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "AddOrgMember not implemented",
	})
}