package models

import (
	"gorm.io/gorm"
	"time"
)

// EmailVerification représente un token de vérification d'email
type EmailVerification struct {
	gorm.Model
	UserID    uint      `gorm:"not null;index" json:"userId"`
	Token     string    `gorm:"size:255;not null;unique" json:"token"`
	ExpiresAt time.Time `gorm:"not null" json:"expiresAt"`
	IsUsed    bool      `gorm:"default:false" json:"isUsed"`
	User      User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

// TableName spécifie le nom de la table
func (EmailVerification) TableName() string {
	return "email_verifications"
}

// PasswordReset représente un token de réinitialisation de mot de passe
type PasswordReset struct {
	gorm.Model
	UserID    uint      `gorm:"not null;index" json:"userId"`
	Token     string    `gorm:"size:255;not null;unique" json:"token"`
	ExpiresAt time.Time `gorm:"not null" json:"expiresAt"`
	IsUsed    bool      `gorm:"default:false" json:"isUsed"`
	User      User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

// TableName spécifie le nom de la table
func (PasswordReset) TableName() string {
	return "password_resets"
}

// RefreshToken représente un refresh token stocké en base
type RefreshToken struct {
	gorm.Model
	UserID     uint       `gorm:"not null;index" json:"userId"`
	Token      string     `gorm:"size:255;not null;unique" json:"token"`
	ExpiresAt  time.Time  `gorm:"not null" json:"expiresAt"`
	IsRevoked  bool       `gorm:"default:false" json:"isRevoked"`
	LastUsedAt *time.Time `json:"lastUsedAt,omitempty"`
	User       User       `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

// TableName spécifie le nom de la table
func (RefreshToken) TableName() string {
	return "refresh_tokens"
}

// EmailVerificationRequest représente la demande de vérification d'email
type EmailVerificationRequest struct {
	Email string `json:"email" binding:"required,email"`
}

// PasswordResetRequest représente la demande de réinitialisation de mot de passe
type PasswordResetRequest struct {
	Email string `json:"email" binding:"required,email"`
}

// PasswordResetConfirm représente la confirmation de réinitialisation
type PasswordResetConfirm struct {
	Token    string `json:"token" binding:"required"`
	Password string `json:"password" binding:"required,min=8"`
}

// EmailVerificationConfirm représente la confirmation de vérification d'email
type EmailVerificationConfirm struct {
	Token string `json:"token" binding:"required"`
}
