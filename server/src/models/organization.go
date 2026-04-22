package models

import (
	"time"

	"gorm.io/gorm"
)

// Organization représente une organisation dans le système
type Organization struct {
	ID          string         `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Name        string         `gorm:"size:255;not null" json:"name"`
	Slug        string         `gorm:"size:255;uniqueIndex;not null" json:"slug"`
	Description *string        `gorm:"type:text" json:"description,omitempty"`
	Website     *string        `gorm:"size:255" json:"website,omitempty"`
	IsActive    bool           `gorm:"default:true;column:is_active" json:"isActive"`
	OwnerID     string         `gorm:"type:uuid;column:owner_id;not null;index" json:"ownerId"`
	CreatedAt   time.Time      `gorm:"column:created_at" json:"createdAt"`
	UpdatedAt   time.Time      `gorm:"column:updated_at" json:"updatedAt"`
	DeletedAt   gorm.DeletedAt `gorm:"index;column:deleted_at" json:"-"`

	Owner       User `gorm:"foreignKey:OwnerID"`
	Domains     []Domain
	Memberships []Membership
}

func (Organization) TableName() string {
	return "organizations"
}
