package models

import (
	"time"

	"gorm.io/gorm"
)

// User représente un utilisateur dans la base de données
type User struct {
	ID            string         `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Email         *string        `gorm:"size:255;uniqueIndex" json:"email,omitempty"`
	Username      *string        `gorm:"size:255;uniqueIndex" json:"username,omitempty"`
	Name          *string        `gorm:"size:255" json:"name,omitempty"`
	PasswordHash  *string        `gorm:"size:255;column:password_hash" json:"-"`
	PasswordSalt  *string        `gorm:"size:255;column:password_salt" json:"-"`
	EmailVerified bool           `gorm:"default:false;column:email_verified" json:"emailVerified"`
	IsActive      bool           `gorm:"default:true;column:is_active" json:"isActive"`
	LastLoginAt   *time.Time     `gorm:"column:last_login_at" json:"lastLoginAt,omitempty"`
	CreatedAt     time.Time      `gorm:"column:created_at" json:"createdAt"`
	UpdatedAt     time.Time      `gorm:"column:updated_at" json:"updatedAt"`
	DeletedAt     gorm.DeletedAt `gorm:"index;column:deleted_at" json:"-"`

	// Discord integration
	DiscordID     *string `gorm:"size:255;uniqueIndex;column:discord_id" json:"discordId,omitempty"`
	DiscordLinked bool    `gorm:"default:false;column:discord_linked" json:"discordLinked"`

	// TOTP/2FA
	TotpSecret  *string `gorm:"size:255;column:totp_secret" json:"-"`
	TotpEnabled bool    `gorm:"default:false;column:totp_enabled" json:"totpEnabled"`

	// Role for admin checks
	Role string `gorm:"size:50;column:role" json:"role"`
}

// TableName spécifie le nom de la table pour le modèle User
func (User) TableName() string {
	return "users"
}

// Profile représente le profil d'un utilisateur
type Profile struct {
	ID          string  `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID      string  `gorm:"type:uuid;uniqueIndex;column:user_id;not null" json:"userId"`
	DisplayName *string `gorm:"size:255;column:display_name" json:"displayName,omitempty"`
	AvatarURL   *string `gorm:"size:500;column:avatar_url" json:"avatarUrl,omitempty"`
	Locale      *string `gorm:"size:10" json:"locale,omitempty"`
	Timezone    *string `gorm:"size:50" json:"timezone,omitempty"`
	Bio         *string `gorm:"type:text" json:"bio,omitempty"`
}

func (Profile) TableName() string {
	return "profiles"
}

// Account représente un compte externe lié (OAuth)
type Account struct {
	ID                string     `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID            string     `gorm:"type:uuid;column:user_id;not null;index" json:"userId"`
	Provider          string     `gorm:"size:100;not null" json:"provider"`
	ProviderAccountID string     `gorm:"size:255;column:provider_account_id;not null" json:"providerAccountId"`
	RefreshToken      *string    `gorm:"type:text;column:refresh_token" json:"-"`
	AccessToken       *string    `gorm:"type:text;column:access_token" json:"-"`
	ExpiresAt         *time.Time `gorm:"column:expires_at" json:"expiresAt,omitempty"`
	TokenType         *string    `gorm:"size:50;column:token_type" json:"tokenType,omitempty"`
	Scope             *string    `gorm:"size:500" json:"scope,omitempty"`
	IDToken           *string    `gorm:"type:text;column:id_token" json:"-"`
	SessionState      *string    `gorm:"size:255;column:session_state" json:"sessionState,omitempty"`
	CreatedAt         time.Time  `gorm:"column:created_at" json:"createdAt"`
	UpdatedAt         time.Time  `gorm:"column:updated_at" json:"updatedAt"`
}

func (Account) TableName() string {
	return "accounts"
}

// Session représente une session utilisateur
type Session struct {
	ID           string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	SessionToken string    `gorm:"size:255;uniqueIndex;column:session_token;not null" json:"sessionToken"`
	UserID       string    `gorm:"type:uuid;column:user_id;not null;index" json:"userId"`
	AccessToken  *string   `gorm:"type:text;column:access_token" json:"-"`
	Expires      time.Time `json:"expires"`
	CreatedAt    time.Time `gorm:"column:created_at" json:"createdAt"`
	UpdatedAt    time.Time `gorm:"column:updated_at" json:"updatedAt"`
}

func (Session) TableName() string {
	return "sessions"
}

// UserResponse représente la réponse utilisateur sans les données sensibles
type UserResponse struct {
	ID            string     `json:"id"`
	Email         *string    `json:"email,omitempty"`
	Username      *string    `json:"username,omitempty"`
	Name          *string    `json:"name,omitempty"`
	EmailVerified bool       `json:"emailVerified"`
	IsActive      bool       `json:"isActive"`
	DiscordLinked bool       `json:"discordLinked"`
	TotpEnabled   bool       `json:"totpEnabled"`
	LastLoginAt   *time.Time `json:"lastLoginAt,omitempty"`
	CreatedAt     time.Time  `json:"createdAt"`
	UpdatedAt     time.Time  `json:"updatedAt"`
}

// ToResponse convertit un modèle User en UserResponse
func (u *User) ToResponse() *UserResponse {
	return &UserResponse{
		ID:            u.ID,
		Email:         u.Email,
		Username:      u.Username,
		Name:          u.Name,
		EmailVerified: u.EmailVerified,
		IsActive:      u.IsActive,
		DiscordLinked: u.DiscordLinked,
		TotpEnabled:   u.TotpEnabled,
		LastLoginAt:   u.LastLoginAt,
		CreatedAt:     u.CreatedAt,
		UpdatedAt:     u.UpdatedAt,
	}
}
