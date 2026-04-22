package controllers

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/skygenesisenterprise/aether-mailer/server/src/config"
	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
	"github.com/skygenesisenterprise/aether-mailer/server/src/services"
)

// GenerateTOTPSecret génère une nouvelle clé secrète TOTP pour un utilisateur
func GenerateTOTPSecret(c *gin.Context) {
	userID := c.GetUint("userId")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Unauthorized",
		})
		return
	}

	totpService := services.NewTOTPService(services.DB)
	secretString, url, err := totpService.GenerateTOTPSecret(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to generate TOTP secret",
		})
		return
	}

	// Créer le QR code
	code, err := totpService.GenerateQRCode(url)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to generate QR code",
		})
		return
	}

	totpResponse := models.TOTPResponse{
		Secret: secretString,
		QRCode: code,
		URL:    url,
	}

	c.JSON(http.StatusOK, totpResponse)
}

// VerifyTOTPCode vérifie un code TOTP fourni par l'utilisateur
func VerifyTOTPCode(c *gin.Context) {
	userID := c.GetUint("userId")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Unauthorized",
		})
		return
	}

	var verifyRequest models.TOTPVerifyRequest
	if err := c.ShouldBindJSON(&verifyRequest); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
		})
		return
	}

	totpService := services.NewTOTPService(services.DB)

	// Vérifier le code TOTP
	valid, err := totpService.VerifyTOTPCode(verifyRequest.Code, verifyRequest.Secret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to verify TOTP code",
		})
		return
	}

	if !valid {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Invalid TOTP code",
		})
		return
	}

	// Si le code est valide, activer le 2FA pour l'utilisateur
	if err := totpService.EnableTOTP(fmt.Sprintf("%d", userID), verifyRequest.Secret); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to enable TOTP",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "TOTP verified and enabled successfully",
	})
}

// DisableTOTP désactive le 2FA pour un utilisateur
func DisableTOTP(c *gin.Context) {
	userID := c.GetUint("userId")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Unauthorized",
		})
		return
	}

	totpService := services.NewTOTPService(services.DB)
	if err := totpService.DisableTOTP(fmt.Sprintf("%d", userID)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to disable TOTP",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "TOTP disabled successfully",
	})
}

// VerifyTOTPLogin vérifie un code TOTP lors de la connexion
func VerifyTOTPLogin(c *gin.Context) {
	var loginRequest models.TOTPLoginRequest
	if err := c.ShouldBindJSON(&loginRequest); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
		})
		return
	}

	totpService := services.NewTOTPService(services.DB)
	user, err := totpService.VerifyTOTPLogin(loginRequest.Email, loginRequest.Password, loginRequest.TOTPCode)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Générer les tokens JWT
	cfg := config.LoadConfig()
	jwtService := services.NewJWTService(cfg.JWTSecret, cfg.AccessTokenExp, cfg.RefreshTokenExp)
	accessToken, err := jwtService.GenerateToken(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to generate access token",
		})
		return
	}

	refreshTokenString, err := jwtService.GenerateRefreshToken(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to generate refresh token",
		})
		return
	}

	// Stocker le refresh token en base
	emailService := services.NewEmailService(services.DB)
	_, err = emailService.CreateRefreshToken(user.ID, refreshTokenString)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to store refresh token",
		})
		return
	}

	// Set cookies HTTPOnly pour le token d'accés et le refresh
	ExpiresAccess := time.Now().Add(time.Duration(cfg.AccessTokenExp) * time.Minute)
	ExpiresRefresh := time.Now().Add(time.Duration(cfg.RefreshTokenExp) * time.Minute)

	http.SetCookie(c.Writer, &http.Cookie{
		Name:     "AETHER_ACCESS_TOKEN",
		Value:    accessToken,
		Path:     "/",
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteLaxMode,
		Expires:  ExpiresAccess,
	})
	http.SetCookie(c.Writer, &http.Cookie{
		Name:     "AETHER_REFRESH_TOKEN",
		Value:    refreshTokenString,
		Path:     "/",
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteLaxMode,
		Expires:  ExpiresRefresh,
	})

	c.JSON(http.StatusOK, models.JWTTokenResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshTokenString,
		ExpiresIn:    cfg.AccessTokenExp,
	})
}

// GetTOTPStatus renvoie le statut du 2FA pour un utilisateur
func GetTOTPStatus(c *gin.Context) {
	userID := c.GetUint("userId")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Unauthorized",
		})
		return
	}

	totpService := services.NewTOTPService(services.DB)
	enabled, err := totpService.GetTOTPStatus(fmt.Sprintf("%d", userID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to retrieve TOTP status",
		})
		return
	}

	statusResponse := models.TOTPStatusResponse{
		Enabled: enabled,
	}

	c.JSON(http.StatusOK, statusResponse)
}
