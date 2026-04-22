package models

import (
	"time"

	"gorm.io/gorm"
)

type Extension struct {
	ID            string         `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Name          string         `gorm:"size:255;not null" json:"name"`
	DisplayName   *string        `gorm:"size:255" json:"displayName,omitempty"`
	Description   *string        `gorm:"size:500" json:"description,omitempty"`
	Type          string         `gorm:"size:50;not null" json:"type"` // action, hook, provider
	Version       string         `gorm:"size:50" json:"version"`
	Enabled       bool           `gorm:"default:false" json:"enabled"`
	InstalledAt   *time.Time     `gorm:"column:installed_at" json:"installedAt,omitempty"`
	Configuration interface{}    `gorm:"type:jsonb;column:configuration" json:"configuration,omitempty"`
	TenantID      *string        `gorm:"type:uuid;column:tenant_id" json:"tenantId,omitempty"`
	CreatedAt     time.Time      `gorm:"column:created_at" json:"createdAt"`
	UpdatedAt     time.Time      `gorm:"column:updated_at" json:"updatedAt"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`
}

type MarketplaceIntegration struct {
	ID          string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Name        string    `gorm:"size:255;not null;uniqueIndex" json:"name"`
	DisplayName *string   `gorm:"size:255" json:"displayName,omitempty"`
	Description *string   `gorm:"size:500" json:"description,omitempty"`
	IconURL     *string   `gorm:"size:500;column:icon_url" json:"iconUrl,omitempty"`
	Category    *string   `gorm:"size:100" json:"category,omitempty"`
	Provider    *string   `gorm:"size:255" json:"provider,omitempty"`
	HomepageURL *string   `gorm:"size:500;column:homepage_url" json:"homepageUrl,omitempty"`
	Version     string    `gorm:"size:50" json:"version"`
	IsInstalled bool      `gorm:"default:false;column:is_installed" json:"isInstalled"`
	CreatedAt   time.Time `gorm:"column:created_at" json:"createdAt"`
	UpdatedAt   time.Time `gorm:"column:updated_at" json:"updatedAt"`
}
