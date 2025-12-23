package models

import (
	"time"
)

// AuthTokens represents the authentication tokens response
type AuthTokens struct {
	AccessToken  string  `json:"accessToken"`
	RefreshToken *string `json:"refreshToken,omitempty"`
	TokenType    string  `json:"tokenType"`
	ExpiresIn    int     `json:"expiresIn"`
}

// LoginResponse represents the login response
type LoginResponse struct {
	Success   bool              `json:"success"`
	Data      LoginResponseData `json:"data"`
	Message   string            `json:"message"`
	Timestamp time.Time         `json:"timestamp"`
}

// LoginResponseData represents the login response data
type LoginResponseData struct {
	User   UserProfile `json:"user"`
	Tokens AuthTokens  `json:"tokens"`
}

// RefreshTokenRequest represents the refresh token request
type RefreshTokenRequest struct {
	RefreshToken string `json:"refreshToken" binding:"required"`
}

// RefreshTokenResponse represents the refresh token response
type RefreshTokenResponse struct {
	Success   bool       `json:"success"`
	Data      AuthTokens `json:"data"`
	Message   string     `json:"message"`
	Timestamp time.Time  `json:"timestamp"`
}

// LogoutRequest represents the logout request
type LogoutRequest struct {
	RefreshToken *string `json:"refreshToken,omitempty"`
	AllDevices   *bool   `json:"allDevices,omitempty"`
}

// UserProfile represents the user profile information
type UserProfile struct {
	ID              string     `json:"id"`
	Email           string     `json:"email"`
	Username        *string    `json:"username,omitempty"`
	FirstName       *string    `json:"firstName,omitempty"`
	LastName        *string    `json:"lastName,omitempty"`
	DisplayName     *string    `json:"displayName,omitempty"`
	Avatar          *string    `json:"avatar,omitempty"`
	Role            string     `json:"role"`
	IsActive        bool       `json:"isActive"`
	IsEmailVerified bool       `json:"isEmailVerified"`
	LastLoginAt     *time.Time `json:"lastLoginAt,omitempty"`
	EmailVerifiedAt *time.Time `json:"emailVerifiedAt,omitempty"`
	CreatedAt       time.Time  `json:"createdAt"`
	UpdatedAt       time.Time  `json:"updatedAt"`
}

// JWTPayload represents the JWT payload
type JWTPayload struct {
	UserID string `json:"userId"`
	Email  string `json:"email"`
	Role   string `json:"role"`
	Type   string `json:"type"` // "access" or "refresh"
	Iat    int64  `json:"iat"`
	Exp    int64  `json:"exp"`
}

// AuthSession represents the authentication session
type AuthSession struct {
	ID           string      `json:"id"`
	UserID       string      `json:"userId"`
	AccessToken  string      `json:"accessToken"`
	RefreshToken *string     `json:"refreshToken,omitempty"`
	DeviceInfo   *DeviceInfo `json:"deviceInfo,omitempty"`
	IsActive     bool        `json:"isActive"`
	LastAccessAt time.Time   `json:"lastAccessAt"`
	ExpiresAt    time.Time   `json:"expiresAt"`
	CreatedAt    time.Time   `json:"createdAt"`
	UpdatedAt    time.Time   `json:"updatedAt"`
}

// DeviceInfo represents device information
type DeviceInfo struct {
	UserAgent string `json:"userAgent"`
	Platform  string `json:"platform"`
	Browser   string `json:"browser"`
	IP        string `json:"ip"`
}

// TwoFactorSetup represents the two-factor authentication setup
type TwoFactorSetup struct {
	Secret      string   `json:"secret"`
	QRCode      string   `json:"qrCode"`
	BackupCodes []string `json:"backupCodes"`
}

// TwoFactorVerifyRequest represents the two-factor verification request
type TwoFactorVerifyRequest struct {
	Token string `json:"token" binding:"required"`
}

// TwoFactorEnableRequest represents the two-factor enable request
type TwoFactorEnableRequest struct {
	Secret string `json:"secret" binding:"required"`
	Token  string `json:"token" binding:"required"`
}

// PasswordResetRequest represents the password reset request
type PasswordResetRequest struct {
	Email string `json:"email" binding:"required,email"`
}

// PasswordResetConfirmRequest represents the password reset confirmation request
type PasswordResetConfirmRequest struct {
	Token       string `json:"token" binding:"required"`
	NewPassword string `json:"newPassword" binding:"required,min=8"`
}

// EmailVerificationRequest represents the email verification request
type EmailVerificationRequest struct {
	Token string `json:"token" binding:"required"`
}

// AuthMetrics represents authentication metrics
type AuthMetrics struct {
	TotalLogins               int        `json:"totalLogins"`
	SuccessfulLogins          int        `json:"successfulLogins"`
	FailedLogins              int        `json:"failedLogins"`
	ActiveSessions            int        `json:"activeSessions"`
	PasswordResetRequests     int        `json:"passwordResetRequests"`
	EmailVerificationRequests int        `json:"emailVerificationRequests"`
	TwoFactorEnabledUsers     int        `json:"twoFactorEnabledUsers"`
	LastResetAt               *time.Time `json:"lastResetAt,omitempty"`
}

// SecurityEvent represents a security event
type SecurityEvent struct {
	ID          string                 `json:"id"`
	UserID      *string                `json:"userId,omitempty"`
	Type        SecurityEventType      `json:"type"`
	Severity    SecurityEventSeverity  `json:"severity"`
	Description string                 `json:"description"`
	Details     map[string]interface{} `json:"details"`
	IPAddress   *string                `json:"ipAddress,omitempty"`
	UserAgent   *string                `json:"userAgent,omitempty"`
	Resolved    bool                   `json:"resolved"`
	ResolvedAt  *time.Time             `json:"resolvedAt,omitempty"`
	ResolvedBy  *string                `json:"resolvedBy,omitempty"`
	CreatedAt   time.Time              `json:"createdAt"`
	UpdatedAt   time.Time              `json:"updatedAt"`
}

// SecurityEventType represents the type of security event
type SecurityEventType string

const (
	SecurityEventLoginSuccess               SecurityEventType = "LOGIN_SUCCESS"
	SecurityEventLoginFailure               SecurityEventType = "LOGIN_FAILURE"
	SecurityEventMultipleLoginFailures      SecurityEventType = "MULTIPLE_LOGIN_FAILURES"
	SecurityEventPasswordResetRequested     SecurityEventType = "PASSWORD_RESET_REQUESTED"
	SecurityEventPasswordResetCompleted     SecurityEventType = "PASSWORD_RESET_COMPLETED"
	SecurityEventEmailVerificationRequested SecurityEventType = "EMAIL_VERIFICATION_REQUESTED"
	SecurityEventEmailVerificationCompleted SecurityEventType = "EMAIL_VERIFICATION_COMPLETED"
	SecurityEventTwoFactorEnabled           SecurityEventType = "TWO_FACTOR_ENABLED"
	SecurityEventTwoFactorDisabled          SecurityEventType = "TWO_FACTOR_DISABLED"
	SecurityEventSuspiciousLoginAttempt     SecurityEventType = "SUSPICIOUS_LOGIN_ATTEMPT"
	SecurityEventAccountLocked              SecurityEventType = "ACCOUNT_LOCKED"
	SecurityEventAccountUnlocked            SecurityEventType = "ACCOUNT_UNLOCKED"
	SecurityEventSessionTerminated          SecurityEventType = "SESSION_TERMINATED"
	SecurityEventPasswordChanged            SecurityEventType = "PASSWORD_CHANGED"
	SecurityEventProfileUpdated             SecurityEventType = "PROFILE_UPDATED"
	SecurityEventRoleChanged                SecurityEventType = "ROLE_CHANGED"
)

// SecurityEventSeverity represents the severity of a security event
type SecurityEventSeverity string

const (
	SecuritySeverityLow      SecurityEventSeverity = "low"
	SecuritySeverityMedium   SecurityEventSeverity = "medium"
	SecuritySeverityHigh     SecurityEventSeverity = "high"
	SecuritySeverityCritical SecurityEventSeverity = "critical"
)

// ApiKey represents an API key
type ApiKey struct {
	ID          string     `json:"id"`
	UserID      string     `json:"userId"`
	Name        string     `json:"name"`
	Key         string     `json:"key"`
	Permissions []string   `json:"permissions"`
	IsActive    bool       `json:"isActive"`
	ExpiresAt   *time.Time `json:"expiresAt,omitempty"`
	LastUsedAt  *time.Time `json:"lastUsedAt,omitempty"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
}

// CreateApiKeyRequest represents the create API key request
type CreateApiKeyRequest struct {
	Name        string     `json:"name" binding:"required"`
	Permissions []string   `json:"permissions" binding:"required"`
	ExpiresAt   *time.Time `json:"expiresAt,omitempty"`
}

// ApiKeyResponse represents the API key response
type ApiKeyResponse struct {
	ID          string     `json:"id"`
	Name        string     `json:"name"`
	Key         string     `json:"key"` // Only shown during creation
	Permissions []string   `json:"permissions"`
	IsActive    bool       `json:"isActive"`
	ExpiresAt   *time.Time `json:"expiresAt,omitempty"`
	CreatedAt   time.Time  `json:"createdAt"`
	LastUsedAt  *time.Time `json:"lastUsedAt,omitempty"`
}

// AuthConfig represents the authentication configuration
type AuthConfig struct {
	PasswordPolicy  PasswordPolicy  `json:"passwordPolicy"`
	SessionPolicy   SessionPolicy   `json:"sessionPolicy"`
	TwoFactorPolicy TwoFactorPolicy `json:"twoFactorPolicy"`
	SecurityPolicy  SecurityPolicy  `json:"securityPolicy"`
}

// PasswordPolicy represents the password policy configuration
type PasswordPolicy struct {
	MinLength           int  `json:"minLength"`
	RequireUppercase    bool `json:"requireUppercase"`
	RequireLowercase    bool `json:"requireLowercase"`
	RequireNumbers      bool `json:"requireNumbers"`
	RequireSpecialChars bool `json:"requireSpecialChars"`
	PreventReuse        int  `json:"preventReuse"`
}

// SessionPolicy represents the session policy configuration
type SessionPolicy struct {
	MaxDuration           int `json:"maxDuration"`       // in seconds
	InactivityTimeout     int `json:"inactivityTimeout"` // in seconds
	MaxConcurrentSessions int `json:"maxConcurrentSessions"`
}

// TwoFactorPolicy represents the two-factor authentication policy
type TwoFactorPolicy struct {
	Required      bool     `json:"required"`
	RequiredRoles []string `json:"requiredRoles"`
	GracePeriod   int      `json:"gracePeriod"` // in days
}

// SecurityPolicy represents the security policy configuration
type SecurityPolicy struct {
	MaxLoginAttempts         int  `json:"maxLoginAttempts"`
	LockoutDuration          int  `json:"lockoutDuration"` // in seconds
	RequireEmailVerification bool `json:"requireEmailVerification"`
	AllowRememberMe          bool `json:"allowRememberMe"`
}
