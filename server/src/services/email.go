package services

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"time"

	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
	"gorm.io/gorm"
)

// EmailService gère les opérations liées aux emails et tokens
type EmailService struct {
	DB *gorm.DB
}

// NewEmailService crée une nouvelle instance de EmailService
func NewEmailService(db *gorm.DB) *EmailService {
	return &EmailService{DB: db}
}

// GenerateToken génère un token aléatoire sécurisé
func (s *EmailService) GenerateToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

// CreateEmailVerification crée un token de vérification d'email
func (s *EmailService) CreateEmailVerification(userID string, email string) (*models.EmailVerificationToken, error) {
	// Supprimer les anciens tokens non utilisés
	s.DB.Where("user_id = ? AND used = false", userID).Delete(&models.EmailVerificationToken{})

	token, err := s.GenerateToken()
	if err != nil {
		return nil, err
	}

	verification := &models.EmailVerificationToken{
		UserID:    userID,
		Email:     email,
		Token:     token,
		ExpiresAt: time.Now().Add(24 * time.Hour),
		Used:      false,
	}

	if err := s.DB.Create(verification).Error; err != nil {
		return nil, err
	}

	return verification, nil
}

// VerifyEmail vérifie un email avec un token
func (s *EmailService) VerifyEmail(token string) (*models.User, error) {
	var verification models.EmailVerificationToken
	if err := s.DB.Where("token = ? AND used = false AND expires_at > ?", token, time.Now()).First(&verification).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("invalid or expired token")
		}
		return nil, err
	}

	// Marquer le token comme utilisé
	now := time.Now()
	verification.Used = true
	verification.UsedAt = &now
	if err := s.DB.Save(&verification).Error; err != nil {
		return nil, err
	}

	// Activer le compte utilisateur
	var user models.User
	if err := s.DB.First(&user, "id = ?", verification.UserID).Error; err != nil {
		return nil, err
	}

	user.EmailVerified = true
	if err := s.DB.Save(&user).Error; err != nil {
		return nil, err
	}

	return &user, nil
}

// CreatePasswordReset crée un token de réinitialisation de mot de passe
func (s *EmailService) CreatePasswordReset(email string) (*models.PasswordResetToken, error) {
	// Récupérer l'utilisateur
	var user models.User
	if err := s.DB.Where("email = ?", email).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("user not found")
		}
		return nil, err
	}

	// Supprimer les anciens tokens non utilisés
	s.DB.Where("user_id = ? AND used = false", user.ID).Delete(&models.PasswordResetToken{})

	token, err := s.GenerateToken()
	if err != nil {
		return nil, err
	}

	reset := &models.PasswordResetToken{
		UserID:    user.ID,
		Token:     token,
		ExpiresAt: time.Now().Add(1 * time.Hour),
		Used:      false,
	}

	if err := s.DB.Create(reset).Error; err != nil {
		return nil, err
	}

	return reset, nil
}

// ResetPassword réinitialise le mot de passe avec un token
func (s *EmailService) ResetPassword(token, newPassword string) error {
	var reset models.PasswordResetToken
	if err := s.DB.Where("token = ? AND used = false AND expires_at > ?", token, time.Now()).First(&reset).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("invalid or expired token")
		}
		return err
	}

	// Marquer le token comme utilisé
	now := time.Now()
	reset.Used = true
	reset.UsedAt = &now
	if err := s.DB.Save(&reset).Error; err != nil {
		return err
	}

	// Mettre à jour le mot de passe utilisateur
	userService := NewUserService(s.DB)
	user, err := userService.GetUserByID(reset.UserID)
	if err != nil {
		return err
	}

	return userService.UpdateUser(user, &newPassword)
}

// SendEmailVerificationEmail envoie un email de vérification (simulation)
func (s *EmailService) SendEmailVerificationEmail(email, token string) error {
	// TODO: Intégrer avec un service d'email réel (SendGrid, AWS SES, etc.)
	verificationURL := fmt.Sprintf("http://localhost:3000/verify-email?token=%s", token)

	fmt.Printf("=== EMAIL VERIFICATION ===\n")
	fmt.Printf("To: %s\n", email)
	fmt.Printf("Verification URL: %s\n", verificationURL)
	fmt.Printf("========================\n")

	return nil
}

// SendPasswordResetEmail envoie un email de réinitialisation (simulation)
func (s *EmailService) SendPasswordResetEmail(email, token string) error {
	// TODO: Intégrer avec un service d'email réel
	resetURL := fmt.Sprintf("http://localhost:3000/reset-password?token=%s", token)

	fmt.Printf("=== PASSWORD RESET ===\n")
	fmt.Printf("To: %s\n", email)
	fmt.Printf("Reset URL: %s\n", resetURL)
	fmt.Printf("====================\n")

	return nil
}

// CreateRefreshToken creates a refresh token for a user
func (s *EmailService) CreateRefreshToken(userID string, token string) (*models.OAuthRefreshToken, error) {
	refreshToken := &models.OAuthRefreshToken{
		Token:     token,
		UserID:    userID,
		ClientID:  "default", // Default client for direct authentication
		ExpiresAt: time.Now().Add(24 * time.Hour),
		Revoked:   false,
	}

	if err := s.DB.Create(refreshToken).Error; err != nil {
		return nil, err
	}

	return refreshToken, nil
}

// ValidateRefreshToken validates a refresh token
func (s *EmailService) ValidateRefreshToken(token string) (*models.OAuthRefreshToken, error) {
	var refreshToken models.OAuthRefreshToken
	if err := s.DB.Where("token = ? AND revoked = false AND expires_at > ?", token, time.Now()).First(&refreshToken).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("invalid or expired token")
		}
		return nil, err
	}

	return &refreshToken, nil
}

// RevokeRefreshToken marks a refresh token as revoked
func (s *EmailService) RevokeRefreshToken(token string) error {
	var refreshToken models.OAuthRefreshToken
	if err := s.DB.Where("token = ?", token).First(&refreshToken).Error; err != nil {
		return err
	}

	now := time.Now()
	refreshToken.Revoked = true
	refreshToken.RevokedAt = &now

	return s.DB.Save(&refreshToken).Error
}
