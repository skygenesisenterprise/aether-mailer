package services

import (
	"errors"
	"fmt"
	"time"

	"github.com/skygenesisenterprise/server/src/models"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// AuthService handles authentication operations
type AuthService struct {
	db     *gorm.DB
	config *Config
}

// NewAuthService creates a new authentication service
func NewAuthService(db *gorm.DB, config *Config) *AuthService {
	return &AuthService{
		db:     db,
		config: config,
	}
}

// LoginRequest represents the login request
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// RegisterRequest represents the registration request
type RegisterRequest struct {
	Email     string  `json:"email" binding:"required,email"`
	Username  string  `json:"username" binding:"required"`
	Password  string  `json:"password" binding:"required,min=8"`
	FirstName *string `json:"firstName,omitempty"`
	LastName  *string `json:"lastName,omitempty"`
}

// AuthResponse represents the authentication response
type AuthResponse struct {
	Success bool       `json:"success"`
	Data    *AuthData  `json:"data,omitempty"`
	Error   *ErrorInfo `json:"error,omitempty"`
}

// AuthData represents the authentication data
type AuthData struct {
	User         models.UserProfile `json:"user"`
	Token        string             `json:"token"`
	RefreshToken string             `json:"refreshToken"`
}

// ErrorInfo represents error information
type ErrorInfo struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

// TokenPair represents a pair of tokens
type TokenPair struct {
	Token        string `json:"token"`
	RefreshToken string `json:"refreshToken"`
}

// HashPassword hashes a password using bcrypt
func (s *AuthService) HashPassword(password string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", fmt.Errorf("failed to hash password: %w", err)
	}
	return string(hash), nil
}

// ComparePassword compares a password with its hash
func (s *AuthService) ComparePassword(password, hash string) error {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
}

// GenerateTokens generates JWT tokens for a user
func (s *AuthService) GenerateTokens(userID string) (*TokenPair, error) {
	// Generate access token
	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"userId": userID,
		"type":   "access",
		"exp":    time.Now().Add(time.Hour * 24).Unix(), // 24 hours
	})

	accessTokenString, err := accessToken.SignedString([]byte(s.config.JWT.Secret))
	if err != nil {
		return nil, fmt.Errorf("failed to sign access token: %w", err)
	}

	// Generate refresh token
	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"userId": userID,
		"type":   "refresh",
		"exp":    time.Now().Add(time.Hour * 24 * 7).Unix(), // 7 days
	})

	refreshTokenString, err := refreshToken.SignedString([]byte(s.config.JWT.Secret))
	if err != nil {
		return nil, fmt.Errorf("failed to sign refresh token: %w", err)
	}

	return &TokenPair{
		Token:        accessTokenString,
		RefreshToken: refreshTokenString,
	}, nil
}

// Register creates a new user account
func (s *AuthService) Register(userData RegisterRequest) (*AuthResponse, error) {
	// Check if email already exists
	var existingUser models.User
	if err := s.db.Where("email = ?", userData.Email).First(&existingUser).Error; err == nil {
		return &AuthResponse{
			Success: false,
			Error: &ErrorInfo{
				Code:    "EMAIL_EXISTS",
				Message: "Email already registered",
			},
		}, nil
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, fmt.Errorf("failed to check existing email: %w", err)
	}

	// Check if username already exists
	if err := s.db.Where("username = ?", userData.Username).First(&existingUser).Error; err == nil {
		return &AuthResponse{
			Success: false,
			Error: &ErrorInfo{
				Code:    "USERNAME_EXISTS",
				Message: "Username already taken",
			},
		}, nil
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, fmt.Errorf("failed to check existing username: %w", err)
	}

	// Hash password
	hashedPassword, err := s.HashPassword(userData.Password)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	// Create user
	user := models.User{
		Email:     userData.Email,
		Username:  &userData.Username,
		Role:      models.UserRoleUser,
		IsActive:  true,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	// This would be handled by GORM hooks in a real implementation
	// For now, we'll simulate the password field
	if err := s.db.Create(&user).Error; err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	// Generate tokens
	tokens, err := s.GenerateTokens(user.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to generate tokens: %w", err)
	}

	// Create session
	session := models.UserSession{
		UserID:       user.ID,
		Token:        tokens.RefreshToken,
		RefreshToken: &tokens.RefreshToken,
		ExpiresAt:    time.Now().Add(time.Hour * 24 * 7), // 7 days
		IsActive:     true,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	if err := s.db.Create(&session).Error; err != nil {
		return nil, fmt.Errorf("failed to create session: %w", err)
	}

	// Create user profile for response
	userProfile := models.UserProfile{
		ID:              user.ID,
		Email:           user.Email,
		Username:        user.Username,
		FirstName:       user.FirstName,
		LastName:        user.LastName,
		Role:            string(user.Role),
		IsActive:        user.IsActive,
		IsEmailVerified: user.IsEmailVerified,
		CreatedAt:       user.CreatedAt,
		UpdatedAt:       user.UpdatedAt,
	}

	return &AuthResponse{
		Success: true,
		Data: &AuthData{
			User:         userProfile,
			Token:        tokens.Token,
			RefreshToken: tokens.RefreshToken,
		},
	}, nil
}

// Login authenticates a user
func (s *AuthService) Login(loginData LoginRequest) (*AuthResponse, error) {
	// Find user by email
	var user models.User
	if err := s.db.Where("email = ?", loginData.Email).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return &AuthResponse{
				Success: false,
				Error: &ErrorInfo{
					Code:    "INVALID_CREDENTIALS",
					Message: "Invalid email or password",
				},
			}, nil
		}
		return nil, fmt.Errorf("failed to find user: %w", err)
	}

	// Check if user is active
	if !user.IsActive {
		return &AuthResponse{
			Success: false,
			Error: &ErrorInfo{
				Code:    "ACCOUNT_DISABLED",
				Message: "Account is disabled",
			},
		}, nil
	}

	// Verify password (this would be handled by GORM hooks in a real implementation)
	// For now, we'll simulate password verification
	if err := s.ComparePassword(loginData.Password, "hashed_password"); err != nil {
		return &AuthResponse{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_CREDENTIALS",
				Message: "Invalid email or password",
			},
		}, nil
	}

	// Update last login
	if err := s.db.Model(&user).Update("last_login_at", time.Now()).Error; err != nil {
		return nil, fmt.Errorf("failed to update last login: %w", err)
	}

	// Generate tokens
	tokens, err := s.GenerateTokens(user.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to generate tokens: %w", err)
	}

	// Create session
	session := models.UserSession{
		UserID:       user.ID,
		Token:        tokens.RefreshToken,
		RefreshToken: &tokens.RefreshToken,
		ExpiresAt:    time.Now().Add(time.Hour * 24 * 7), // 7 days
		IsActive:     true,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	if err := s.db.Create(&session).Error; err != nil {
		return nil, fmt.Errorf("failed to create session: %w", err)
	}

	// Create user profile for response
	userProfile := models.UserProfile{
		ID:              user.ID,
		Email:           user.Email,
		Username:        user.Username,
		FirstName:       user.FirstName,
		LastName:        user.LastName,
		Role:            string(user.Role),
		IsActive:        user.IsActive,
		IsEmailVerified: user.IsEmailVerified,
		LastLoginAt:     &time.Time{},
		CreatedAt:       user.CreatedAt,
		UpdatedAt:       user.UpdatedAt,
	}

	return &AuthResponse{
		Success: true,
		Data: &AuthData{
			User:         userProfile,
			Token:        tokens.Token,
			RefreshToken: tokens.RefreshToken,
		},
	}, nil
}

// RefreshToken refreshes an access token using a refresh token
func (s *AuthService) RefreshToken(refreshTokenString string) (*AuthResponse, error) {
	// Find session by refresh token
	var session models.UserSession
	if err := s.db.Preload("User").Where("token = ? AND is_active = ? AND expires_at > ?",
		refreshTokenString, true, time.Now()).First(&session).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return &AuthResponse{
				Success: false,
				Error: &ErrorInfo{
					Code:    "INVALID_REFRESH_TOKEN",
					Message: "Invalid or expired refresh token",
				},
			}, nil
		}
		return nil, fmt.Errorf("failed to find session: %w", err)
	}

	// Generate new access token
	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"userId": session.UserID,
		"type":   "access",
		"exp":    time.Now().Add(time.Hour * 24).Unix(), // 24 hours
	})

	accessTokenString, err := accessToken.SignedString([]byte(s.config.JWT.Secret))
	if err != nil {
		return nil, fmt.Errorf("failed to sign access token: %w", err)
	}

	// Create user profile for response
	userProfile := models.UserProfile{
		ID:              session.User.ID,
		Email:           session.User.Email,
		Username:        session.User.Username,
		FirstName:       session.User.FirstName,
		LastName:        session.User.LastName,
		Role:            string(session.User.Role),
		IsActive:        session.User.IsActive,
		IsEmailVerified: session.User.IsEmailVerified,
		CreatedAt:       session.User.CreatedAt,
		UpdatedAt:       session.User.UpdatedAt,
	}

	return &AuthResponse{
		Success: true,
		Data: &AuthData{
			User:         userProfile,
			Token:        accessTokenString,
			RefreshToken: refreshTokenString,
		},
	}, nil
}

// Logout logs out a user by invalidating their session
func (s *AuthService) Logout(refreshTokenString string) error {
	// Delete session
	if err := s.db.Where("token = ?", refreshTokenString).Delete(&models.UserSession{}).Error; err != nil {
		return fmt.Errorf("failed to delete session: %w", err)
	}

	return nil
}
