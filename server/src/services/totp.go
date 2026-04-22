package services

import (
	"crypto/rand"
	"encoding/base32"
	"fmt"

	"github.com/boombuler/barcode"
	"github.com/boombuler/barcode/qr"
	"github.com/pquerna/otp/totp"
	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
	"gorm.io/gorm"
)

// TOTPService manages TOTP-related operations
type TOTPService struct {
	userService *UserService
}

// NewTOTPService creates a new TOTPService instance
func NewTOTPService(db *gorm.DB) *TOTPService {
	return &TOTPService{
		userService: NewUserService(db),
	}
}

// GenerateTOTPSecret generates a new TOTP secret and otpauth URL
func (s *TOTPService) GenerateTOTPSecret(userID uint) (string, string, error) {
	secret := make([]byte, 20)
	if _, err := rand.Read(secret); err != nil {
		return "", "", fmt.Errorf("failed to generate TOTP secret: %w", err)
	}
	secretString := base32.StdEncoding.WithPadding(base32.NoPadding).EncodeToString(secret)
	issuer := "Sky Genesis Enterprise"
	accountName := fmt.Sprintf("%d", userID)
	url := fmt.Sprintf("otpauth://totp/%s:%s?secret=%s&issuer=%s&digits=%d&period=%d",
		issuer, accountName, secretString, issuer, 6, 30)
	return secretString, url, nil
}

// GenerateQRCode generates a QR code for the provided URL
func (s *TOTPService) GenerateQRCode(url string) (barcode.Barcode, error) {
	code, err := qr.Encode(url, qr.L, qr.Auto)
	if err != nil {
		return nil, fmt.Errorf("failed to generate QR code: %w", err)
	}
	return code, nil
}

// VerifyTOTPCode verifies a TOTP code against a secret
func (s *TOTPService) VerifyTOTPCode(code, secret string) (bool, error) {
	valid := totp.Validate(code, secret)
	return valid, nil
}

// EnableTOTP enables TOTP for a user
func (s *TOTPService) EnableTOTP(userID string, secret string) error {
	user, err := s.userService.GetUserByID(userID)
	if err != nil {
		return fmt.Errorf("failed to retrieve user: %w", err)
	}
	user.TotpSecret = &secret
	user.TotpEnabled = true
	if err := s.userService.UpdateUser(user, nil); err != nil {
		return fmt.Errorf("failed to enable TOTP: %w", err)
	}
	return nil
}

// DisableTOTP disables TOTP for a user
func (s *TOTPService) DisableTOTP(userID string) error {
	user, err := s.userService.GetUserByID(userID)
	if err != nil {
		return fmt.Errorf("failed to retrieve user: %w", err)
	}
	emptySecret := ""
	user.TotpSecret = &emptySecret
	user.TotpEnabled = false
	if err := s.userService.UpdateUser(user, nil); err != nil {
		return fmt.Errorf("failed to disable TOTP: %w", err)
	}
	return nil
}

// GetTOTPStatus returns the TOTP enabled status for a user
func (s *TOTPService) GetTOTPStatus(userID string) (bool, error) {
	user, err := s.userService.GetUserByID(userID)
	if err != nil {
		return false, fmt.Errorf("failed to retrieve user: %w", err)
	}
	return user.TotpEnabled, nil
}

// VerifyTOTPLogin verifies a TOTP during login
func (s *TOTPService) VerifyTOTPLogin(email, password, totpCode string) (*models.User, error) {
	// Authenticate user
	user, err := s.userService.AuthenticateUser(email, password)
	if err != nil {
		return nil, fmt.Errorf("invalid email or password: %w", err)
	}
	// Ensure TOTP is enabled
	if !user.TotpEnabled {
		return nil, fmt.Errorf("TOTP not enabled for this user")
	}
	// Validate the TOTP code
	if user.TotpSecret == nil || !totp.Validate(totpCode, *user.TotpSecret) {
		return nil, fmt.Errorf("invalid TOTP code")
	}
	return user, nil
}
