package services

import (
	"errors"
	"fmt"
	"time"

	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
	"gorm.io/gorm"
)

// UserService handles user operations
type UserService struct {
	db *gorm.DB
}

// NewUserService creates a new user service
func NewUserService(db *gorm.DB) *UserService {
	return &UserService{
		db: db,
	}
}

// UserResult represents the result of user operations
type UserResult struct {
	Success    bool              `json:"success"`
	Data       interface{}       `json:"data,omitempty"`
	Error      *ErrorInfo        `json:"error,omitempty"`
	Pagination *PaginationResult `json:"pagination,omitempty"`
}

// PaginationResult represents pagination information
type PaginationResult struct {
	Page       int  `json:"page"`
	Limit      int  `json:"limit"`
	Total      int  `json:"total"`
	TotalPages int  `json:"totalPages"`
	HasNext    bool `json:"hasNext"`
	HasPrev    bool `json:"hasPrev"`
}

// UserFilters represents filters for user queries
type UserFilters struct {
	Email    *string          `form:"email,omitempty"`
	Role     *models.UserRole `form:"role,omitempty"`
	IsActive *bool            `form:"isActive,omitempty"`
	Page     *int             `form:"page,omitempty"`
	Limit    *int             `form:"limit,omitempty"`
}

// GetUsers retrieves users with optional filtering and pagination
func (s *UserService) GetUsers(filters UserFilters) (*UserResult, error) {
	var users []models.User
	var total int64

	// Build query
	query := s.db.Model(&models.User{})

	// Apply filters
	if filters.Email != nil {
		query = query.Where("email ILIKE ?", fmt.Sprintf("%%%s%%", *filters.Email))
	}

	if filters.Role != nil {
		query = query.Where("role = ?", *filters.Role)
	}

	if filters.IsActive != nil {
		query = query.Where("is_active = ?", *filters.IsActive)
	}

	// Get total count
	if err := query.Count(&total).Error; err != nil {
		return nil, fmt.Errorf("failed to count users: %w", err)
	}

	// Set pagination defaults
	page := 1
	limit := 10
	if filters.Page != nil {
		page = *filters.Page
	}
	if filters.Limit != nil {
		limit = *filters.Limit
	}

	// Apply pagination
	offset := (page - 1) * limit
	if err := query.Offset(offset).Limit(limit).Find(&users).Error; err != nil {
		return nil, fmt.Errorf("failed to retrieve users: %w", err)
	}

	// Calculate pagination info
	totalPages := int((total + int64(limit) - 1) / int64(limit))

	return &UserResult{
		Success: true,
		Data:    users,
		Pagination: &PaginationResult{
			Page:       page,
			Limit:      limit,
			Total:      int(total),
			TotalPages: totalPages,
			HasNext:    page < totalPages,
			HasPrev:    page > 1,
		},
	}, nil
}

// GetUserByID retrieves a user by ID
func (s *UserService) GetUserByID(id string) (*UserResult, error) {
	var user models.User
	if err := s.db.Where("id = ?", id).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return &UserResult{
				Success: false,
				Error: &ErrorInfo{
					Code:    "USER_NOT_FOUND",
					Message: "User not found",
				},
			}, nil
		}
		return nil, fmt.Errorf("failed to retrieve user: %w", err)
	}

	return &UserResult{
		Success: true,
		Data:    user,
	}, nil
}

// CreateUser creates a new user
func (s *UserService) CreateUser(userData models.CreateUserRequest) (*UserResult, error) {
	// Check if user with email or username already exists
	var existingUser models.User
	if err := s.db.Where("email = ? OR username = ?", userData.Email, userData.Username).First(&existingUser).Error; err == nil {
		return &UserResult{
			Success: false,
			Error: &ErrorInfo{
				Code:    "USER_EXISTS",
				Message: "User with this email or username already exists",
			},
		}, nil
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, fmt.Errorf("failed to check existing user: %w", err)
	}

	// Set default values
	role := models.UserRoleUser
	if userData.Role != nil {
		role = *userData.Role
	}

	isActive := true
	if userData.IsActive != nil {
		isActive = *userData.IsActive
	}

	// Create user
	user := models.User{
		Email:     userData.Email,
		Username:  userData.Username,
		Role:      role,
		FirstName: userData.FirstName,
		LastName:  userData.LastName,
		IsActive:  isActive,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := s.db.Create(&user).Error; err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	return &UserResult{
		Success: true,
		Data:    user,
	}, nil
}

// UpdateUser updates an existing user
func (s *UserService) UpdateUser(id string, updateData models.UpdateUserRequest) (*UserResult, error) {
	// Check if user exists
	var user models.User
	if err := s.db.Where("id = ?", id).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return &UserResult{
				Success: false,
				Error: &ErrorInfo{
					Code:    "USER_NOT_FOUND",
					Message: "User not found",
				},
			}, nil
		}
		return nil, fmt.Errorf("failed to find user: %w", err)
	}

	// Update user
	if err := s.db.Model(&user).Updates(updateData).Error; err != nil {
		return nil, fmt.Errorf("failed to update user: %w", err)
	}

	// Refresh user data
	if err := s.db.Where("id = ?", id).First(&user).Error; err != nil {
		return nil, fmt.Errorf("failed to refresh user data: %w", err)
	}

	return &UserResult{
		Success: true,
		Data:    user,
	}, nil
}

// DeleteUser deletes a user
func (s *UserService) DeleteUser(id string) (*UserResult, error) {
	// Check if user exists
	var user models.User
	if err := s.db.Where("id = ?", id).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return &UserResult{
				Success: false,
				Error: &ErrorInfo{
					Code:    "USER_NOT_FOUND",
					Message: "User not found",
				},
			}, nil
		}
		return nil, fmt.Errorf("failed to find user: %w", err)
	}

	// Delete user
	if err := s.db.Delete(&user).Error; err != nil {
		return nil, fmt.Errorf("failed to delete user: %w", err)
	}

	return &UserResult{
		Success: true,
		Data:    user,
	}, nil
}

// ChangePassword changes a user's password
func (s *UserService) ChangePassword(id string, req models.ChangePasswordRequest) (*UserResult, error) {
	// Check if user exists
	var user models.User
	if err := s.db.Where("id = ?", id).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return &UserResult{
				Success: false,
				Error: &ErrorInfo{
					Code:    "USER_NOT_FOUND",
					Message: "User not found",
				},
			}, nil
		}
		return nil, fmt.Errorf("failed to find user: %w", err)
	}

	// In a real implementation, you would verify the current password here
	// For now, we'll simulate password change

	// Update password (this would be handled by GORM hooks in a real implementation)
	updateData := map[string]interface{}{
		"password_changed_at": time.Now(),
		"updated_at":          time.Now(),
	}

	if err := s.db.Model(&user).Updates(updateData).Error; err != nil {
		return nil, fmt.Errorf("failed to update password: %w", err)
	}

	return &UserResult{
		Success: true,
	}, nil
}

// SuspendUser suspends a user account
func (s *UserService) SuspendUser(id string) (*UserResult, error) {
	return s.UpdateUser(id, models.UpdateUserRequest{
		IsActive: &[]bool{false}[0],
	})
}

// ActivateUser activates a user account
func (s *UserService) ActivateUser(id string) (*UserResult, error) {
	return s.UpdateUser(id, models.UpdateUserRequest{
		IsActive: &[]bool{true}[0],
	})
}

// GetUserStats retrieves user statistics
func (s *UserService) GetUserStats() (*models.UserStats, error) {
	var stats models.UserStats

	// Get total users
	if err := s.db.Model(&models.User{}).Count((*int64)(&stats.Total)).Error; err != nil {
		return nil, fmt.Errorf("failed to count total users: %w", err)
	}

	// Get active users
	if err := s.db.Model(&models.User{}).Where("is_active = ?", true).Count((*int64)(&stats.Active)).Error; err != nil {
		return nil, fmt.Errorf("failed to count active users: %w", err)
	}

	// Get inactive users
	stats.Inactive = stats.Total - stats.Active

	// Get email verified users
	if err := s.db.Model(&models.User{}).Where("is_email_verified = ?", true).Count((*int64)(&stats.EmailVerified)).Error; err != nil {
		return nil, fmt.Errorf("failed to count email verified users: %w", err)
	}

	// Get email unverified users
	stats.EmailUnverified = stats.Total - stats.EmailVerified

	// Get users by role
	stats.ByRole = make(map[models.UserRole]int)
	roles := []models.UserRole{
		models.UserRoleAdmin,
		models.UserRoleDomainAdmin,
		models.UserRoleUser,
		models.UserRoleViewer,
	}

	for _, role := range roles {
		var count int64
		if err := s.db.Model(&models.User{}).Where("role = ?", role).Count(&count).Error; err != nil {
			return nil, fmt.Errorf("failed to count users by role: %w", err)
		}
		stats.ByRole[role] = int(count)
	}

	return &stats, nil
}
