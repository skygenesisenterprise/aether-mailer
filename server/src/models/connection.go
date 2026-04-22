package models

import (
	"time"

	"gorm.io/gorm"
)

type ConnectionType string

const (
	ConnectionTypeDatabase     ConnectionType = "database"
	ConnectionTypeSocial       ConnectionType = "social"
	ConnectionTypeEnterprise   ConnectionType = "enterprise"
	ConnectionTypePasswordless ConnectionType = "passwordless"
)

type Connection struct {
	ID          string         `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Name        string         `gorm:"size:255;not null;uniqueIndex" json:"name"`
	DisplayName *string        `gorm:"size:255" json:"displayName,omitempty"`
	Type        ConnectionType `gorm:"type:varchar(50);not null" json:"type"`
	IsEnabled   bool           `gorm:"default:false;column:is_enabled" json:"isEnabled"`
	Strategy    *string        `gorm:"size:100" json:"strategy,omitempty"`
	Options     interface{}    `gorm:"type:jsonb" json:"options,omitempty"`
	Metadata    interface{}    `gorm:"type:jsonb" json:"metadata,omitempty"`
	CreatedAt   time.Time      `gorm:"column:created_at" json:"createdAt"`
	UpdatedAt   time.Time      `gorm:"column:updated_at" json:"updatedAt"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

type DatabaseConnection struct {
	ID             string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	ConnectionID   string    `gorm:"type:uuid;not null;column:connection_id" json:"connectionId"`
	DatabaseType   *string   `gorm:"size:50;column:database_type" json:"databaseType,omitempty"`
	Host           *string   `gorm:"size:255" json:"host,omitempty"`
	Port           *int      `json:"port,omitempty"`
	Database       *string   `gorm:"size:255" json:"database,omitempty"`
	Username       *string   `gorm:"size:255" json:"username,omitempty"`
	Password       *string   `gorm:"size:255" json:"-"`
	SSLMode        *string   `gorm:"size:50;column:ssl_mode" json:"sslMode,omitempty"`
	MinConnections *int      `gorm:"default:1;column:min_connections" json:"minConnections,omitempty"`
	MaxConnections *int      `gorm:"default:10;column:max_connections" json:"maxConnections,omitempty"`
	CreatedAt      time.Time `gorm:"column:created_at" json:"createdAt"`
	UpdatedAt      time.Time `gorm:"column:updated_at" json:"updatedAt"`
}

type DatabaseConnectionUser struct {
	ID                   string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	DatabaseConnectionID string    `gorm:"type:uuid;not null;column:database_connection_id" json:"databaseConnectionId"`
	Email                string    `gorm:"size:255;not null" json:"email"`
	Username             string    `gorm:"size:255" json:"username,omitempty"`
	IsActive             bool      `gorm:"default:true;column:is_active" json:"isActive"`
	CreatedAt            time.Time `gorm:"column:created_at" json:"createdAt"`
}

type SocialProvider struct {
	ID           string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Name         string    `gorm:"size:100;not null;uniqueIndex" json:"name"`
	DisplayName  string    `gorm:"size:255" json:"displayName"`
	IsEnabled    bool      `gorm:"default:false;column:is_enabled" json:"isEnabled"`
	ClientID     *string   `gorm:"size:255;column:client_id" json:"clientId,omitempty"`
	ClientSecret *string   `gorm:"size:255;column:client_secret" json:"-"`
	TenantID     *string   `gorm:"type:uuid;column:tenant_id" json:"tenantId,omitempty"`
	Scopes       []string  `gorm:"type:text[]" json:"scopes,omitempty"`
	CreatedAt    time.Time `gorm:"column:created_at" json:"createdAt"`
	UpdatedAt    time.Time `gorm:"column:updated_at" json:"updatedAt"`
}

type EnterpriseConnection struct {
	ID               string      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Name             string      `gorm:"size:255;not null" json:"name"`
	DisplayName      *string     `gorm:"size:255" json:"displayName,omitempty"`
	Protocol         string      `gorm:"size:50;not null" json:"protocol"` // SAML, OIDC
	IsEnabled        bool        `gorm:"default:false;column:is_enabled" json:"isEnabled"`
	Domain           *string     `gorm:"size:255" json:"domain,omitempty"`
	Issuer           *string     `gorm:"size:500" json:"issuer,omitempty"`
	SsoURL           *string     `gorm:"size:500;column:sso_url" json:"ssoUrl,omitempty"`
	X509Cert         *string     `gorm:"type:text;column:x509_cert" json:"x509Cert,omitempty"`
	Metadata         interface{} `gorm:"type:jsonb" json:"metadata,omitempty"`
	AttributeMapping interface{} `gorm:"type:jsonb;column:attribute_mapping" json:"attributeMapping,omitempty"`
	CreatedAt        time.Time   `gorm:"column:created_at" json:"createdAt"`
	UpdatedAt        time.Time   `gorm:"column:updated_at" json:"updatedAt"`
}

type PasswordlessConnection struct {
	ID          string      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Name        string      `gorm:"size:255;not null;uniqueIndex" json:"name"`
	DisplayName *string     `gorm:"size:255" json:"displayName,omitempty"`
	Type        string      `gorm:"size:50;not null" json:"type"` // email, sms
	IsEnabled   bool        `gorm:"default:false;column:is_enabled" json:"isEnabled"`
	Options     interface{} `gorm:"type:jsonb" json:"options,omitempty"`
	CreatedAt   time.Time   `gorm:"column:created_at" json:"createdAt"`
	UpdatedAt   time.Time   `gorm:"column:updated_at" json:"updatedAt"`
}

type AuthenticationProfile struct {
	ID            string      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Name          string      `gorm:"size:255;not null;uniqueIndex" json:"name"`
	DisplayName   *string     `gorm:"size:255" json:"displayName,omitempty"`
	Description   *string     `gorm:"size:500" json:"description,omitempty"`
	ConnectionIDs []string    `gorm:"type:uuid[];column:connection_ids" json:"connectionIds,omitempty"`
	Options       interface{} `gorm:"type:jsonb" json:"options,omitempty"`
	IsDefault     bool        `gorm:"default:false;column:is_default" json:"isDefault"`
	CreatedAt     time.Time   `gorm:"column:created_at" json:"createdAt"`
	UpdatedAt     time.Time   `gorm:"column:updated_at" json:"updatedAt"`
}
