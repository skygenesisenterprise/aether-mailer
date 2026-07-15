package models

import (
	"time"

	"gorm.io/datatypes"
)

type LocalCredential struct {
	Common
	UserID            string `gorm:"column:user_id;type:text;uniqueIndex;not null" json:"userId"`
	PasswordHash      string `gorm:"column:password_hash;type:text;not null" json:"-"`
	PasswordAlgorithm string `gorm:"column:password_algorithm;type:text;not null" json:"passwordAlgorithm"`
}

func (LocalCredential) TableName() string {
	return "local_credentials"
}

type AuthSession struct {
	Common
	TokenHash            string     `gorm:"column:token_hash;type:text;uniqueIndex;not null" json:"-"`
	UserID               string     `gorm:"column:user_id;type:text;index;not null" json:"userId"`
	WorkspaceID          *string    `gorm:"column:workspace_id;type:text;index" json:"workspaceId,omitempty"`
	RefreshTokenHash     string     `gorm:"column:refresh_token_hash;type:text;index;not null" json:"-"`
	RefreshTokenFamilyID string     `gorm:"column:refresh_token_family_id;type:text;index;not null" json:"refreshTokenFamilyId"`
	UserAgent            *string    `gorm:"column:user_agent;type:text" json:"userAgent,omitempty"`
	IPAddress            *string    `gorm:"column:ip_address;type:text" json:"ipAddress,omitempty"`
	ExpiresAt            time.Time  `gorm:"column:expires_at;index;not null" json:"expiresAt"`
	LastUsedAt           time.Time  `gorm:"column:last_used_at;not null" json:"lastUsedAt"`
	RevokedAt            *time.Time `gorm:"column:revoked_at;index" json:"revokedAt,omitempty"`
	RevocationReason     *string    `gorm:"column:revocation_reason;type:text" json:"revocationReason,omitempty"`
}

func (AuthSession) TableName() string {
	return "auth_sessions"
}

type AuthRefreshToken struct {
	Common
	SessionID    string     `gorm:"column:session_id;type:text;index;not null" json:"sessionId"`
	FamilyID     string     `gorm:"column:family_id;type:text;index;not null" json:"familyId"`
	TokenHash    string     `gorm:"column:token_hash;type:text;uniqueIndex;not null" json:"-"`
	ExpiresAt    time.Time  `gorm:"column:expires_at;index;not null" json:"expiresAt"`
	UsedAt       *time.Time `gorm:"column:used_at;index" json:"usedAt,omitempty"`
	RevokedAt    *time.Time `gorm:"column:revoked_at;index" json:"revokedAt,omitempty"`
	ReplacedByID *string    `gorm:"column:replaced_by_id;type:text" json:"replacedById,omitempty"`
}

func (AuthRefreshToken) TableName() string {
	return "auth_refresh_tokens"
}

type EmailVerificationToken struct {
	Common
	UserID       string     `gorm:"column:user_id;type:text;index;not null" json:"userId"`
	TokenHash    string     `gorm:"column:token_hash;type:text;uniqueIndex;not null" json:"-"`
	ExpiresAt    time.Time  `gorm:"column:expires_at;index;not null" json:"expiresAt"`
	ConsumedAt   *time.Time `gorm:"column:consumed_at;index" json:"consumedAt,omitempty"`
	LastSentAt   *time.Time `gorm:"column:last_sent_at" json:"lastSentAt,omitempty"`
	RequestCount int        `gorm:"column:request_count;not null;default:0" json:"requestCount"`
}

func (EmailVerificationToken) TableName() string {
	return "email_verification_tokens"
}

type PasswordResetToken struct {
	Common
	UserID       string     `gorm:"column:user_id;type:text;index;not null" json:"userId"`
	TokenHash    string     `gorm:"column:token_hash;type:text;uniqueIndex;not null" json:"-"`
	ExpiresAt    time.Time  `gorm:"column:expires_at;index;not null" json:"expiresAt"`
	ConsumedAt   *time.Time `gorm:"column:consumed_at;index" json:"consumedAt,omitempty"`
	LastSentAt   *time.Time `gorm:"column:last_sent_at" json:"lastSentAt,omitempty"`
	RequestCount int        `gorm:"column:request_count;not null;default:0" json:"requestCount"`
}

func (PasswordResetToken) TableName() string {
	return "password_reset_tokens"
}

type AuthAuditEvent struct {
	Common
	UserID      *string        `gorm:"column:user_id;type:text;index" json:"userId,omitempty"`
	SessionID   *string        `gorm:"column:session_id;type:text;index" json:"sessionId,omitempty"`
	WorkspaceID *string        `gorm:"column:workspace_id;type:text;index" json:"workspaceId,omitempty"`
	EventType   string         `gorm:"column:event_type;type:text;index;not null" json:"eventType"`
	IPAddress   *string        `gorm:"column:ip_address;type:text" json:"ipAddress,omitempty"`
	UserAgent   *string        `gorm:"column:user_agent;type:text" json:"userAgent,omitempty"`
	Metadata    datatypes.JSON `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`
}

func (AuthAuditEvent) TableName() string {
	return "auth_audit_events"
}

type AuthAccount struct {
	Common
	UserID            string     `gorm:"column:user_id;type:text;index;not null" json:"userId"`
	Provider          string     `gorm:"column:provider;type:text;not null" json:"provider"`
	ProviderAccountID string     `gorm:"column:provider_account_id;type:text;not null" json:"providerAccountId"`
	AccessToken       *string    `gorm:"column:access_token;type:text" json:"-"`
	RefreshToken      *string    `gorm:"column:refresh_token;type:text" json:"-"`
	Scopes            *string    `gorm:"column:scopes;type:text" json:"scopes,omitempty"`
	TokenExpiresAt    *time.Time `gorm:"column:token_expires_at" json:"tokenExpiresAt,omitempty"`

	User User `gorm:"foreignKey:UserID" json:"-"`
}

func (AuthAccount) TableName() string {
	return "auth_accounts"
}
