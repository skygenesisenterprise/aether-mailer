package controllers

import (
	"github.com/gin-gonic/gin"
	"github.com/skygenesisenterprise/aether-mailer/server/src/config"
	"github.com/skygenesisenterprise/aether-mailer/server/src/services"
	"net/http"
)

// Introspect vérifie l'état d'un token et retourne les claims s'ils sont valides
func Introspect(c *gin.Context) {
	var body struct {
		Token string `json:"token"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}
	cfg := config.LoadConfig()
	jwtSvc := services.NewJWTService(cfg.JWTSecret, cfg.AccessTokenExp, cfg.RefreshTokenExp)
	claims, err := jwtSvc.ExtractClaims(body.Token)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"active": false})
		return
	}
	c.JSON(http.StatusOK, gin.H{"active": true, "claims": claims})
}
