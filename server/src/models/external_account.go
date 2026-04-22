package models

import (
	"time"

	"gorm.io/gorm"
)

// ApiKey représente une clé API utilisateur
type ApiKey struct {
	ID         string         `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Key        string         `gorm:"size:255;uniqueIndex;not null" json:"key"`
	Name       string         `gorm:"size:255;not null" json:"name"`
	UserID     string         `gorm:"type:uuid;column:user_id;not null;index" json:"userId"`
	Scopes     []string       `gorm:"type:text[]" json:"scopes"`
	IsActive   bool           `gorm:"default:true;column:is_active" json:"isActive"`
	LastUsedAt *time.Time     `gorm:"column:last_used_at" json:"lastUsedAt,omitempty"`
	ExpiresAt  *time.Time     `gorm:"column:expires_at" json:"expiresAt,omitempty"`
	CreatedAt  time.Time      `gorm:"column:created_at" json:"createdAt"`
	UpdatedAt  time.Time      `gorm:"column:updated_at" json:"updatedAt"`
	DeletedAt  gorm.DeletedAt `gorm:"index;column:deleted_at" json:"-"`

	User User `gorm:"foreignKey:UserID"`
}

func (ApiKey) TableName() string {
	return "api_keys"
}

// PasswordResetToken représente un token de réinitialisation de mot de passe
type PasswordResetToken struct {
	ID        string     `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Token     string     `gorm:"size:255;uniqueIndex;not null" json:"token"`
	UserID    string     `gorm:"type:uuid;column:user_id;not null;index" json:"userId"`
	ExpiresAt time.Time  `gorm:"column:expires_at" json:"expiresAt"`
	Used      bool       `gorm:"default:false" json:"used"`
	UsedAt    *time.Time `gorm:"column:used_at" json:"usedAt,omitempty"`
	CreatedAt time.Time  `gorm:"column:created_at" json:"createdAt"`

	User User `gorm:"foreignKey:UserID"`
}

func (PasswordResetToken) TableName() string {
	return "password_reset_tokens"
}

// EmailVerificationToken représente un token de vérification d'email
type EmailVerificationToken struct {
	ID        string     `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Token     string     `gorm:"size:255;uniqueIndex;not null" json:"token"`
	UserID    string     `gorm:"type:uuid;column:user_id;not null;index" json:"userId"`
	Email     string     `gorm:"size:255;not null" json:"email"`
	ExpiresAt time.Time  `gorm:"column:expires_at" json:"expiresAt"`
	Used      bool       `gorm:"default:false" json:"used"`
	UsedAt    *time.Time `gorm:"column:used_at" json:"usedAt,omitempty"`
	CreatedAt time.Time  `gorm:"column:created_at" json:"createdAt"`

	User User `gorm:"foreignKey:UserID"`
}

func (EmailVerificationToken) TableName() string {
	return "email_verification_tokens"
}

// ExternalAccount représente un compte externe lié à un utilisateur
type ExternalAccount struct {
	ID                string         `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID            string         `gorm:"type:uuid;column:user_id;not null;index" json:"userId"`
	Provider          string         `gorm:"size:50;not null" json:"provider"` // github, google, microsoft, discord
	ProviderAccountID string         `gorm:"size:255;column:provider_account_id;not null" json:"providerAccountId"`
	Email             *string        `gorm:"size:255" json:"email,omitempty"`
	Username          *string        `gorm:"size:255" json:"username,omitempty"`
	DisplayName       *string        `gorm:"size:255;column:display_name" json:"displayName,omitempty"`
	AvatarURL         *string        `gorm:"size:500;column:avatar_url" json:"avatarUrl,omitempty"`
	AccessToken       *string        `gorm:"type:text;column:access_token" json:"-"`
	RefreshToken      *string        `gorm:"type:text;column:refresh_token" json:"-"`
	ExpiresAt         *time.Time     `gorm:"column:expires_at" json:"expiresAt,omitempty"`
	Scopes            []string       `gorm:"type:text[]" json:"scopes"`
	IsPrimary         bool           `gorm:"default:false;column:is_primary" json:"isPrimary"`
	LastLoginAt       *time.Time     `gorm:"column:last_login_at" json:"lastLoginAt,omitempty"`
	CreatedAt         time.Time      `gorm:"column:created_at" json:"createdAt"`
	UpdatedAt         time.Time      `gorm:"column:updated_at" json:"updatedAt"`
	DeletedAt         gorm.DeletedAt `gorm:"index;column:deleted_at" json:"-"`

	User User `gorm:"foreignKey:UserID"`
}

func (ExternalAccount) TableName() string {
	return "external_accounts"
}

// ExternalAccountResponse représente la réponse publique d'un compte externe
type ExternalAccountResponse struct {
	ID          string     `json:"id"`
	Provider    string     `json:"provider"`
	Email       *string    `json:"email,omitempty"`
	Username    *string    `json:"username,omitempty"`
	DisplayName *string    `json:"displayName,omitempty"`
	AvatarURL   *string    `json:"avatarUrl,omitempty"`
	IsPrimary   bool       `json:"isPrimary"`
	LastLoginAt *time.Time `json:"lastLoginAt,omitempty"`
	CreatedAt   time.Time  `json:"createdAt"`
}

// ToResponse convertit le modèle en réponse publique
func (ea *ExternalAccount) ToResponse() *ExternalAccountResponse {
	return &ExternalAccountResponse{
		ID:          ea.ID,
		Provider:    ea.Provider,
		Email:       ea.Email,
		Username:    ea.Username,
		DisplayName: ea.DisplayName,
		AvatarURL:   ea.AvatarURL,
		IsPrimary:   ea.IsPrimary,
		LastLoginAt: ea.LastLoginAt,
		CreatedAt:   ea.CreatedAt,
	}
}

// ProviderUserInfo représente les informations récupérées d'un provider OAuth
type ProviderUserInfo struct {
	ID       string `json:"id"`
	Email    string `json:"email"`
	Name     string `json:"name"`
	Avatar   string `json:"avatar"`
	Username string `json:"username,omitempty"`
	Verified bool   `json:"verified,omitempty"`
}

// OAuthState représente l'état temporaire d'une transaction OAuth
type OAuthState struct {
	ID           string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	State        string    `gorm:"size:255;uniqueIndex;not null" json:"state"`
	Provider     string    `gorm:"size:50;not null" json:"provider"`
	RedirectURI  *string   `gorm:"size:500;column:redirect_uri" json:"redirectUri,omitempty"`
	CodeVerifier *string   `gorm:"size:255;column:code_verifier" json:"codeVerifier,omitempty"`
	UserID       *string   `gorm:"type:uuid;column:user_id;index" json:"userId,omitempty"`
	Action       *string   `gorm:"size:50;column:action" json:"action,omitempty"`
	ExpiresAt    time.Time `gorm:"column:expires_at" json:"expiresAt"`
	CreatedAt    time.Time `gorm:"column:created_at" json:"createdAt"`
}

func (OAuthState) TableName() string {
	return "oauth_states"
}

// IsExpired vérifie si le state est expiré
func (s *OAuthState) IsExpired() bool {
	return time.Now().After(s.ExpiresAt)
}
