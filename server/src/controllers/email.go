package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
	"github.com/skygenesisenterprise/aether-mailer/server/src/services"
)

// SendEmailVerification envoie un email de vérification
func SendEmailVerification(c *gin.Context) {
	var request models.EmailVerificationRequest

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
		})
		return
	}

	// Récupérer l'utilisateur
	userService := services.NewUserService(services.DB)
	user, err := userService.GetUserByEmail(request.Email)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "User not found",
		})
		return
	}

	// Créer le token de vérification
	emailService := services.NewEmailService(services.DB)
	verification, err := emailService.CreateEmailVerification(user.ID, request.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create verification token",
		})
		return
	}

	// Envoyer l'email
	if err := emailService.SendEmailVerificationEmail(*user.Email, verification.Token); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to send verification email",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Verification email sent",
	})
}

// VerifyEmail vérifie l'email avec un token
func VerifyEmail(c *gin.Context) {
	var request models.EmailVerificationConfirm

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
		})
		return
	}

	emailService := services.NewEmailService(services.DB)
	user, err := emailService.VerifyEmail(request.Token)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Email verified successfully",
		"user":    user.ToResponse(),
	})
}

// RequestPasswordReset demande une réinitialisation de mot de passe
func RequestPasswordReset(c *gin.Context) {
	var request models.PasswordResetRequest

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
		})
		return
	}

	emailService := services.NewEmailService(services.DB)
	reset, err := emailService.CreatePasswordReset(request.Email)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Envoyer l'email
	if err := emailService.SendPasswordResetEmail(request.Email, reset.Token); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to send password reset email",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Password reset email sent",
	})
}

// ConfirmPasswordReset confirme la réinitialisation de mot de passe
func ConfirmPasswordReset(c *gin.Context) {
	var request models.PasswordResetConfirm

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
		})
		return
	}

	emailService := services.NewEmailService(services.DB)
	if err := emailService.ResetPassword(request.Token, request.Password); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Password reset successfully",
	})
}
