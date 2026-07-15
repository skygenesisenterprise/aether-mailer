package models

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	Common
	Email             string         `gorm:"column:email;type:text;not null" json:"email"`
	EmailNormalized   string         `gorm:"column:email_normalized;type:text;uniqueIndex" json:"-"`
	DisplayName       string         `gorm:"column:display_name;type:text;not null" json:"displayName"`
	AvatarURL         *string        `gorm:"column:avatar_url;type:text" json:"avatarUrl,omitempty"`
	Status            string         `gorm:"column:status;type:text;not null;default:'active'" json:"status"`
	PresenceStatus    string         `gorm:"column:presence_status;type:text;default:'offline'" json:"presenceStatus"`
	LastSeenAt        *time.Time     `gorm:"column:last_seen_at;index" json:"lastSeenAt,omitempty"`
	EmailVerifiedAt   *time.Time     `gorm:"column:email_verified_at" json:"emailVerifiedAt,omitempty"`
	PasswordChangedAt *time.Time     `gorm:"column:password_changed_at" json:"passwordChangedAt,omitempty"`
	DisabledAt        *time.Time     `gorm:"column:disabled_at" json:"disabledAt,omitempty"`
	DeletedAt         gorm.DeletedAt `gorm:"column:deleted_at;index" json:"-"`
}

func (User) TableName() string {
	return "users"
}
