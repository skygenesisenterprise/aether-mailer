package service

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/skygenesisenterprise/aether-mailer/package/golang/domain"
	"github.com/skygenesisenterprise/aether-mailer/package/golang/errors"
	"github.com/skygenesisenterprise/aether-mailer/package/golang/repository"
	"github.com/google/uuid"
)

// UserService handles user-related business logic
type UserService struct {
	userRepo repository.UserRepository
	eventPub domain.EventPublisher
}

// NewUserService creates a new user service
func NewUserService(userRepo repository.UserRepository, eventPub domain.EventPublisher) *UserService {
	return &UserService{
		userRepo: userRepo,
		eventPub: eventPub,
	}
}

// CreateUser creates a new user
func (s *UserService) CreateUser(ctx context.Context, req CreateUserRequest) (*domain.User, error) {
	// Validate email
	if err := validateEmail(req.Email); err != nil {
		return nil, errors.NewError(errors.ErrCodeValidationError, "Invalid email address").WithDetail("email", req.Email)
	}

	// Check if user already exists
	existing, err := s.userRepo.GetByEmail(ctx, req.Email)
	if err == nil && existing != nil {
		return nil, errors.UserAlreadyExists(req.Email)
	}

	// Check username availability
	if req.Username != "" {
		existing, err = s.userRepo.GetByUsername(ctx, req.Username)
		if err == nil && existing != nil {
			return nil, errors.NewError(errors.ErrCodeUserAlreadyExists, "Username already exists").WithDetail("username", req.Username)
		}
	}

	// Create user
	user := &domain.User{
		ID:                uuid.New().String(),
		Username:          req.Username,
		Email:             req.Email,
		PasswordHash:      req.PasswordHash,
		FirstName:         req.FirstName,
		LastName:          req.LastName,
		DisplayName:       req.DisplayName,
		Role:              req.Role,
		IsActive:          true,
		IsVerified:        false,
		TwoFactorEnabled:  false,
		CreatedAt:         time.Now(),
		UpdatedAt:         time.Now(),
		PasswordChangedAt: time.Now(),
		Timezone:          "UTC",
		Locale:            "en",
		Theme:             "light",
		MaxEmailsPerDay:   req.MaxEmailsPerDay,
		MaxStorageMB:      req.MaxStorageMB,
	}

	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, errors.InternalError(err)
	}

	// Publish event
	event := domain.NewBaseEvent(uuid.New().String(), user.ID, domain.EventTypeUserCreated, user)
	if err := s.eventPub.Publish(ctx, event); err != nil {
		// Log error but don't fail the operation
	}

	return user, nil
}

// GetUserByID retrieves a user by ID
func (s *UserService) GetUserByID(ctx context.Context, id string) (*domain.User, error) {
	user, err := s.userRepo.GetByID(ctx, id)
	if err != nil {
		return nil, errors.InternalError(err)
	}
	if user == nil {
		return nil, errors.UserNotFound(id)
	}
	return user, nil
}

// GetUserByEmail retrieves a user by email
func (s *UserService) GetUserByEmail(ctx context.Context, email string) (*domain.User, error) {
	user, err := s.userRepo.GetByEmail(ctx, email)
	if err != nil {
		return nil, errors.InternalError(err)
	}
	if user == nil {
		return nil, errors.UserNotFound(email)
	}
	return user, nil
}

// UpdateUser updates user information
func (s *UserService) UpdateUser(ctx context.Context, req UpdateUserRequest) (*domain.User, error) {
	user, err := s.userRepo.GetByID(ctx, req.ID)
	if err != nil {
		return nil, errors.InternalError(err)
	}
	if user == nil {
		return nil, errors.UserNotFound(req.ID)
	}

	// Update fields
	if req.FirstName != nil {
		user.FirstName = req.FirstName
	}
	if req.LastName != nil {
		user.LastName = req.LastName
	}
	if req.DisplayName != nil {
		user.DisplayName = req.DisplayName
	}
	if req.Timezone != nil {
		user.Timezone = *req.Timezone
	}
	if req.Locale != nil {
		user.Locale = *req.Locale
	}
	if req.Theme != nil {
		user.Theme = *req.Theme
	}
	if req.MaxEmailsPerDay != nil {
		user.MaxEmailsPerDay = *req.MaxEmailsPerDay
	}
	if req.MaxStorageMB != nil {
		user.MaxStorageMB = *req.MaxStorageMB
	}

	user.UpdatedAt = time.Now()

	if err := s.userRepo.Update(ctx, user); err != nil {
		return nil, errors.InternalError(err)
	}

	// Publish event
	event := domain.NewBaseEvent(uuid.New().String(), user.ID, domain.EventTypeUserUpdated, user)
	if err := s.eventPub.Publish(ctx, event); err != nil {
		// Log error but don't fail the operation
	}

	return user, nil
}

// DeleteUser deletes a user
func (s *UserService) DeleteUser(ctx context.Context, id string) error {
	user, err := s.userRepo.GetByID(ctx, id)
	if err != nil {
		return errors.InternalError(err)
	}
	if user == nil {
		return errors.UserNotFound(id)
	}

	if err := s.userRepo.Delete(ctx, id); err != nil {
		return errors.InternalError(err)
	}

	// Publish event
	event := domain.NewBaseEvent(uuid.New().String(), user.ID, domain.EventTypeUserDeleted, user)
	if err := s.eventPub.Publish(ctx, event); err != nil {
		// Log error but don't fail the operation
	}

	return nil
}

// ListUsers lists users with filtering
func (s *UserService) ListUsers(ctx context.Context, filter repository.UserFilter) ([]*domain.User, error) {
	users, err := s.userRepo.List(ctx, filter)
	if err != nil {
		return nil, errors.InternalError(err)
	}
	return users, nil
}

// CreateUserRequest represents the request to create a user
type CreateUserRequest struct {
	Username        string
	Email           string
	PasswordHash    string
	FirstName       *string
	LastName        *string
	DisplayName     *string
	Role            domain.UserRole
	MaxEmailsPerDay int
	MaxStorageMB    int
}

// UpdateUserRequest represents the request to update a user
type UpdateUserRequest struct {
	ID              string
	FirstName       *string
	LastName        *string
	DisplayName     *string
	Timezone        *string
	Locale          *string
	Theme           *string
	MaxEmailsPerDay *int
	MaxStorageMB    *int
}

// validateEmail validates an email address format
func validateEmail(email string) error {
	emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
	if !emailRegex.MatchString(email) {
		return fmt.Errorf("invalid email format")
	}
	return nil
}

// generateSecureToken generates a secure random token
func generateSecureToken(length int) (string, error) {
	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(bytes)[:length], nil
}

// normalizeEmail normalizes an email address
func normalizeEmail(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}
