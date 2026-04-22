package controllers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/skygenesisenterprise/aether-mailer/server/src/config"
	"github.com/skygenesisenterprise/aether-mailer/server/src/services"
)

// UserInfo retourne les claims de l'utilisateur à partir du JWT (cookie ou header)
func UserInfo(c *gin.Context) {
	cfg := config.LoadConfig()
	var tokenString string
	// try header
	if h := c.GetHeader("Authorization"); h != "" {
		parts := strings.Split(h, " ")
		if len(parts) == 2 && parts[0] == "Bearer" {
			tokenString = parts[1]
		}
	}
	if tokenString == "" {
		// try cookie
		if cookie, err := c.Request.Cookie("AETHER_ACCESS_TOKEN"); err == nil {
			tokenString = cookie.Value
		}
	}
	if tokenString == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Token not found"})
		return
	}

	jwtSvc := services.NewJWTService(cfg.JWTSecret, cfg.AccessTokenExp, cfg.RefreshTokenExp)
	claims, err := jwtSvc.ExtractClaims(tokenString)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
		return
	}
	c.JSON(http.StatusOK, claims)
}
