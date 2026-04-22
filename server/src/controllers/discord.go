package controllers

import (
	"github.com/gin-gonic/gin"
	"net/http"
)

// DiscordCallback gère le callback Discord SSO (MVP: not fully implemented)
func DiscordCallback(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{"error": "Discord SSO callback not implemented in MVP"})
}
