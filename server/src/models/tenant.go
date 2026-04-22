package models

import (
	"time"

	"gorm.io/gorm"
)

type Tenant struct {
	ID          string         `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Name        string         `gorm:"size:255;not null" json:"name"`
	Slug        string         `gorm:"size:255;uniqueIndex;not null" json:"slug"`
	IsActive    bool           `gorm:"default:true;column:is_active" json:"isActive"`
	Plan        *string        `gorm:"size:50" json:"plan,omitempty"`
	Environment *string        `gorm:"size:50" json:"environment,omitempty"` // production, development
	Region      *string        `gorm:"size:100" json:"region,omitempty"`
	CreatedAt   time.Time      `gorm:"column:created_at" json:"createdAt"`
	UpdatedAt   time.Time      `gorm:"column:updated_at" json:"updatedAt"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

type TenantUsage struct {
	ID             string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	TenantID       string    `gorm:"type:uuid;column:tenant_id;index" json:"tenantId"`
	PeriodStart    time.Time `gorm:"column:period_start" json:"periodStart"`
	PeriodEnd      time.Time `gorm:"column:period_end" json:"periodEnd"`
	UsersUsed      int       `gorm:"default:0;column:users_used" json:"usersUsed"`
	UsersLimit     int       `gorm:"default:0;column:users_limit" json:"usersLimit"`
	SessionsUsed   int       `gorm:"default:0;column:sessions_used" json:"sessionsUsed"`
	SessionsLimit  int       `gorm:"default:0;column:sessions_limit" json:"sessionsLimit"`
	APICallsUsed   int       `gorm:"default:0;column:api_calls_used" json:"apiCallsUsed"`
	APICallsLimit  int       `gorm:"default:0;column:api_calls_limit" json:"apiCallsLimit"`
	StorageUsedMB  int       `gorm:"default:0;column:storage_used_mb" json:"storageUsedMb"`
	StorageLimitMB int       `gorm:"default:0;column:storage_limit_mb" json:"storageLimitMb"`
}

type BillingInfo struct {
	ID              string     `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	TenantID        string     `gorm:"type:uuid;column:tenant_id;index" json:"tenantId"`
	Plan            string     `gorm:"size:50" json:"plan"`
	Status          string     `gorm:"size:50" json:"status"` // active, past_due, canceled
	PaymentMethod   *string    `gorm:"size:50;column:payment_method" json:"paymentMethod,omitempty"`
	CardLast4       *string    `gorm:"size:4;column:card_last4" json:"cardLast4,omitempty"`
	CardBrand       *string    `gorm:"size:50;column:card_brand" json:"cardBrand,omitempty"`
	BillingEmail    *string    `gorm:"size:255;column:billing_email" json:"billingEmail,omitempty"`
	NextBillingDate *time.Time `gorm:"column:next_billing_date" json:"nextBillingDate,omitempty"`
	Amount          *float64   `json:"amount,omitempty"`
	Currency        string     `gorm:"size:3;default:'USD'" json:"currency"`
}

type Agent struct {
	ID         string         `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Name       string         `gorm:"size:255;not null" json:"name"`
	Type       string         `gorm:"size:100;not null" json:"type"`           // worker, api, custom
	Status     string         `gorm:"size:50;default:'offline'" json:"status"` // online, offline, error
	Version    *string        `gorm:"size:50" json:"version,omitempty"`
	Endpoint   *string        `gorm:"size:500" json:"endpoint,omitempty"`
	LastSeenAt *time.Time     `gorm:"column:last_seen_at" json:"lastSeenAt,omitempty"`
	TenantID   *string        `gorm:"type:uuid;column:tenant_id" json:"tenantId,omitempty"`
	CreatedAt  time.Time      `gorm:"column:created_at" json:"createdAt"`
	UpdatedAt  time.Time      `gorm:"column:updated_at" json:"updatedAt"`
	DeletedAt  gorm.DeletedAt `gorm:"index" json:"-"`
}

type Event struct {
	ID        string      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Type      string      `gorm:"size:100;not null" json:"type"`
	Source    *string     `gorm:"size:255" json:"source,omitempty"`
	Subject   *string     `gorm:"size:255" json:"subject,omitempty"`
	Data      interface{} `gorm:"type:jsonb" json:"data,omitempty"`
	UserID    *string     `gorm:"type:uuid;column:user_id" json:"userId,omitempty"`
	TenantID  *string     `gorm:"type:uuid;column:tenant_id" json:"tenantId,omitempty"`
	CreatedAt time.Time   `gorm:"column:created_at" json:"createdAt"`
}

type GeneralSettings struct {
	ID           string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	TenantID     *string   `gorm:"type:uuid;column:tenant_id" json:"tenantId,omitempty"`
	AppName      *string   `gorm:"size:255;column:app_name" json:"appName,omitempty"`
	AppURL       *string   `gorm:"size:500;column:app_url" json:"appUrl,omitempty"`
	SupportEmail *string   `gorm:"size:255;column:support_email" json:"supportEmail,omitempty"`
	SupportURL   *string   `gorm:"size:500;column:support_url" json:"supportUrl,omitempty"`
	LogoURL      *string   `gorm:"size:500;column:logo_url" json:"logoUrl,omitempty"`
	FaviconURL   *string   `gorm:"size:500;column:favicon_url" json:"faviconUrl,omitempty"`
	PrivacyURL   *string   `gorm:"size:500;column:privacy_url" json:"privacyUrl,omitempty"`
	TOSURL       *string   `gorm:"size:500;column:tos_url" json:"tosUrl,omitempty"`
	Language     *string   `gorm:"size:10;default:'en'" json:"language"`
	Timezone     *string   `gorm:"size:100;default:'UTC'" json:"timezone"`
	DateFormat   *string   `gorm:"size:50;default:'yyyy-MM-dd'" json:"dateFormat"`
	CreatedAt    time.Time `gorm:"column:created_at" json:"createdAt"`
	UpdatedAt    time.Time `gorm:"column:updated_at" json:"updatedAt"`
}

type DockerSettings struct {
	ID            string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	TenantID      *string   `gorm:"type:uuid;column:tenant_id" json:"tenantId,omitempty"`
	Enabled       bool      `gorm:"default:false" json:"enabled"`
	HostPath      *string   `gorm:"size:500;column:host_path" json:"hostPath,omitempty"`
	ContainerPath *string   `gorm:"size:500;column:container_path" json:"containerPath,omitempty"`
	Port          *int      `json:"port,omitempty"`
	CreatedAt     time.Time `gorm:"column:created_at" json:"createdAt"`
	UpdatedAt     time.Time `gorm:"column:updated_at" json:"updatedAt"`
}

type FeatureFlag struct {
	ID          string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Name        string    `gorm:"size:255;not null;uniqueIndex" json:"name"`
	Description *string   `gorm:"size:500" json:"description,omitempty"`
	IsEnabled   bool      `gorm:"default:false;column:is_enabled" json:"isEnabled"`
	TenantID    *string   `gorm:"type:uuid;column:tenant_id" json:"tenantId,omitempty"`
	CreatedAt   time.Time `gorm:"column:created_at" json:"createdAt"`
	UpdatedAt   time.Time `gorm:"column:updated_at" json:"updatedAt"`
}
