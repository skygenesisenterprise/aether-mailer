package models

import (
	"time"
)

// User represents the user model
type User struct {
	ID                string     `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Email             string     `json:"email" gorm:"uniqueIndex;not null"`
	Username          *string    `json:"username,omitempty" gorm:"uniqueIndex"`
	FirstName         *string    `json:"firstName,omitempty"`
	LastName          *string    `json:"lastName,omitempty"`
	DisplayName       *string    `json:"displayName,omitempty"`
	Avatar            *string    `json:"avatar,omitempty"`
	Role              UserRole   `json:"role" gorm:"not null;default:'USER'"`
	IsActive          bool       `json:"isActive" gorm:"not null;default:true"`
	IsEmailVerified   bool       `json:"isEmailVerified" gorm:"not null;default:false"`
	LastLoginAt       *time.Time `json:"lastLoginAt,omitempty"`
	PasswordChangedAt *time.Time `json:"passwordChangedAt,omitempty"`
	EmailVerifiedAt   *time.Time `json:"emailVerifiedAt,omitempty"`
	CreatedAt         time.Time  `json:"createdAt" gorm:"not null;default:now()"`
	UpdatedAt         time.Time  `json:"updatedAt" gorm:"not null;default:now()"`
	CreatedBy         *string    `json:"createdBy,omitempty"`
	UpdatedBy         *string    `json:"updatedBy,omitempty"`
}

// CreateUserRequest represents the create user request
type CreateUserRequest struct {
	Email       string    `json:"email" binding:"required,email"`
	Username    *string   `json:"username,omitempty"`
	Password    string    `json:"password" binding:"required,min=8"`
	FirstName   *string   `json:"firstName,omitempty"`
	LastName    *string   `json:"lastName,omitempty"`
	DisplayName *string   `json:"displayName,omitempty"`
	Role        *UserRole `json:"role,omitempty"`
	IsActive    *bool     `json:"isActive,omitempty"`
}

// UpdateUserRequest represents the update user request
type UpdateUserRequest struct {
	Username        *string   `json:"username,omitempty"`
	FirstName       *string   `json:"firstName,omitempty"`
	LastName        *string   `json:"lastName,omitempty"`
	DisplayName     *string   `json:"displayName,omitempty"`
	Avatar          *string   `json:"avatar,omitempty"`
	Role            *UserRole `json:"role,omitempty"`
	IsActive        *bool     `json:"isActive,omitempty"`
	IsEmailVerified *bool     `json:"isEmailVerified,omitempty"`
}

// ChangePasswordRequest represents the change password request
type ChangePasswordRequest struct {
	CurrentPassword string `json:"currentPassword" binding:"required"`
	NewPassword     string `json:"newPassword" binding:"required,min=8"`
}

// ResetPasswordRequest represents the reset password request
type ResetPasswordRequest struct {
	Email string `json:"email" binding:"required,email"`
}

// ConfirmResetPasswordRequest represents the confirm reset password request
type ConfirmResetPasswordRequest struct {
	Token       string `json:"token" binding:"required"`
	NewPassword string `json:"newPassword" binding:"required,min=8"`
}

// UpdateProfileRequest represents the update profile request
type UpdateProfileRequest struct {
	Username    *string `json:"username,omitempty"`
	FirstName   *string `json:"firstName,omitempty"`
	LastName    *string `json:"lastName,omitempty"`
	DisplayName *string `json:"displayName,omitempty"`
	Avatar      *string `json:"avatar,omitempty"`
}

// UserLoginRequest represents the user login request
type UserLoginRequest struct {
	Email      string `json:"email" binding:"required,email"`
	Password   string `json:"password" binding:"required"`
	RememberMe *bool  `json:"rememberMe,omitempty"`
}

// UserLoginResponse represents the user login response
type UserLoginResponse struct {
	User         User    `json:"user"`
	AccessToken  string  `json:"accessToken"`
	RefreshToken *string `json:"refreshToken,omitempty"`
	ExpiresIn    int     `json:"expiresIn"`
}

// UserSession represents the user session
type UserSession struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	UserID       string    `json:"userId" gorm:"not null;index"`
	Token        string    `json:"token" gorm:"not null"`
	RefreshToken *string   `json:"refreshToken,omitempty"`
	UserAgent    *string   `json:"userAgent,omitempty"`
	IPAddress    *string   `json:"ipAddress,omitempty"`
	IsActive     bool      `json:"isActive" gorm:"not null;default:true"`
	ExpiresAt    time.Time `json:"expiresAt" gorm:"not null"`
	CreatedAt    time.Time `json:"createdAt" gorm:"not null;default:now()"`
	UpdatedAt    time.Time `json:"updatedAt" gorm:"not null;default:now()"`
}

// UserListResponse represents the user list response
type UserListResponse struct {
	Users []User `json:"users"`
	Total int    `json:"total"`
	Page  int    `json:"page"`
	Limit int    `json:"limit"`
}

// UserQueryParams represents the user query parameters
type UserQueryParams struct {
	Page            *int      `form:"page,omitempty"`
	Limit           *int      `form:"limit,omitempty"`
	Search          *string   `form:"search,omitempty"`
	Role            *UserRole `form:"role,omitempty"`
	IsActive        *bool     `form:"isActive,omitempty"`
	IsEmailVerified *bool     `form:"isEmailVerified,omitempty"`
	SortBy          *string   `form:"sortBy,omitempty"`
	SortOrder       *string   `form:"sortOrder,omitempty"`
}

// UserStats represents the user statistics
type UserStats struct {
	Total           int              `json:"total"`
	Active          int              `json:"active"`
	Inactive        int              `json:"inactive"`
	EmailVerified   int              `json:"emailVerified"`
	EmailUnverified int              `json:"emailUnverified"`
	ByRole          map[UserRole]int `json:"byRole"`
}

// UserActivity represents the user activity
type UserActivity struct {
	ID        string                 `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	UserID    string                 `json:"userId" gorm:"not null;index"`
	Action    UserActivityType       `json:"action" gorm:"not null"`
	Details   map[string]interface{} `json:"details,omitempty" gorm:"type:jsonb"`
	IPAddress *string                `json:"ipAddress,omitempty"`
	UserAgent *string                `json:"userAgent,omitempty"`
	Timestamp time.Time              `json:"timestamp" gorm:"not null;default:now()"`
}

// UserRole represents the user role
type UserRole string

const (
	UserRoleAdmin       UserRole = "ADMIN"
	UserRoleDomainAdmin UserRole = "DOMAIN_ADMIN"
	UserRoleUser        UserRole = "USER"
	UserRoleViewer      UserRole = "VIEWER"
)

// UserActivityType represents the user activity type
type UserActivityType string

const (
	UserActivityLogin                  UserActivityType = "LOGIN"
	UserActivityLogout                 UserActivityType = "LOGOUT"
	UserActivityPasswordChanged        UserActivityType = "PASSWORD_CHANGED"
	UserActivityProfileUpdated         UserActivityType = "PROFILE_UPDATED"
	UserActivityEmailVerified          UserActivityType = "EMAIL_VERIFIED"
	UserActivityAccountCreated         UserActivityType = "ACCOUNT_CREATED"
	UserActivityAccountActivated       UserActivityType = "ACCOUNT_ACTIVATED"
	UserActivityAccountDeactivated     UserActivityType = "ACCOUNT_DEACTIVATED"
	UserActivityPasswordResetRequested UserActivityType = "PASSWORD_RESET_REQUESTED"
	UserActivityPasswordResetCompleted UserActivityType = "PASSWORD_RESET_COMPLETED"
)

// UserPreferences represents the user preferences
type UserPreferences struct {
	ID                 string                 `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	UserID             string                 `json:"userId" gorm:"not null;uniqueIndex"`
	Theme              string                 `json:"theme" gorm:"default:'system'"`
	Language           string                 `json:"language" gorm:"default:'en'"`
	Timezone           string                 `json:"timezone" gorm:"default:'UTC'"`
	EmailNotifications bool                   `json:"emailNotifications" gorm:"default:true"`
	PushNotifications  bool                   `json:"pushNotifications" gorm:"default:true"`
	TwoFactorEnabled   bool                   `json:"twoFactorEnabled" gorm:"default:false"`
	Preferences        map[string]interface{} `json:"preferences,omitempty" gorm:"type:jsonb"`
	CreatedAt          time.Time              `json:"createdAt" gorm:"not null;default:now()"`
	UpdatedAt          time.Time              `json:"updatedAt" gorm:"not null;default:now()"`
}
