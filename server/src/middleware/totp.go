package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/skygenesisenterprise/aether-mailer/server/src/services"
)

// TOTPMiddleware vérifie si un utilisateur a le TOTP activé
// Si le TOTP est activé, il redirige vers la page de login TOTP
func TOTPMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("userId")
		if !exists {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Unauthorized",
			})
			return
		}

		totpService := services.NewTOTPService(services.DB)
		_, err := totpService.GetTOTPStatus(userID.(string))
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to check TOTP status",
			})
			return
		}

		// Si le TOTP est activé, on continue normalement
		// Si le TOTP n'est pas activé, on continue aussi (pas de redirection)
		// Le middleware est utilisé pour vérifier si l'utilisateur doit passer par TOTP
		// mais ne bloque pas l'accès si TOTP n'est pas activé
		c.Next()
	}
}

// TOTPRequiredMiddleware vérifie si un utilisateur a le TOTP activé
// Si le TOTP n'est pas activé, il retourne une erreur
func TOTPRequiredMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("userId")
		if !exists {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Unauthorized",
			})
			return
		}

		totpService := services.NewTOTPService(services.DB)
		enabled, err := totpService.GetTOTPStatus(userID.(string))
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to check TOTP status",
			})
			return
		}

		if !enabled {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"error": "TOTP is required for this action",
			})
			return
		}

		c.Next()
	}
}

// TOTPLoginMiddleware vérifie un code TOTP lors de la connexion
func TOTPLoginMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		var loginRequest struct {
			Email    string `json:"email"`
			Password string `json:"password"`
			TOTPCode string `json:"totpCode"`
		}
		if err := c.ShouldBindJSON(&loginRequest); err != nil {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{
				"error": "Invalid request body",
			})
			return
		}

		totpService := services.NewTOTPService(services.DB)
		user, err := totpService.VerifyTOTPLogin(loginRequest.Email, loginRequest.Password, loginRequest.TOTPCode)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": err.Error(),
			})
			return
		}

		// Stocker l'utilisateur dans le contexte pour les prochains middlewares
		c.Set("user", user)
		c.Next()
	}
}

// TOTPVerificationMiddleware vérifie un code TOTP pour activer le 2FA
func TOTPVerificationMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		_, exists := c.Get("userId")
		if !exists {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Unauthorized",
			})
			return
		}

		var verifyRequest struct {
			Secret string `json:"secret"`
			Code   string `json:"code"`
		}
		if err := c.ShouldBindJSON(&verifyRequest); err != nil {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{
				"error": "Invalid request body",
			})
			return
		}

		totpService := services.NewTOTPService(services.DB)
		valid, err := totpService.VerifyTOTPCode(verifyRequest.Code, verifyRequest.Secret)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to verify TOTP code",
			})
			return
		}

		if !valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid TOTP code",
			})
			return
		}

		// Stocker la clé secrète et le statut dans le contexte
		c.Set("totpSecret", verifyRequest.Secret)
		c.Next()
	}
}
