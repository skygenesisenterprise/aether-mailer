package models

import (
	"time"

	"gorm.io/gorm"
)

type ApplicationType string

const (
	ApplicationTypeWeb      ApplicationType = "web"
	ApplicationTypeNative   ApplicationType = "native"
	ApplicationTypeSPA      ApplicationType = "spa"
	ApplicationTypeAPI      ApplicationType = "api"
	ApplicationTypeM2M      ApplicationType = "m2m"
	ApplicationTypeExternal ApplicationType = "external"
)

type Application struct {
	ID                      string                   `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Name                    string                   `gorm:"size:255;not null" json:"name"`
	Description             *string                  `gorm:"size:500" json:"description,omitempty"`
	Type                    ApplicationType          `gorm:"type:varchar(50);not null;default:'web'" json:"type"`
	ClientID                string                   `gorm:"type:varchar(255);uniqueIndex;column:client_id" json:"clientId"`
	ClientSecret            *string                  `gorm:"type:varchar(255);column:client_secret" json:"-"`
	ClientSecretExpiresAt   *time.Time               `gorm:"column:client_secret_expires_at" json:"clientSecretExpiresAt,omitempty"`
	RedirectURIs            []ApplicationRedirectURI `gorm:"foreignKey:ApplicationID" json:"redirectUris,omitempty"`
	GrantTypes              []ApplicationGrantType   `gorm:"foreignKey:ApplicationID" json:"grantTypes,omitempty"`
	TokenEndpointAuthMethod *string                  `gorm:"size:100;column:token_endpoint_auth_method" json:"tokenEndpointAuthMethod,omitempty"`
	IsConfidential          bool                     `gorm:"default:false;column:is_confidential" json:"isConfidential"`
	IsActive                bool                     `gorm:"default:true;column:is_active" json:"isActive"`
	LogoURI                 *string                  `gorm:"size:500;column:logo_uri" json:"logoUri,omitempty"`
	PolicyURI               *string                  `gorm:"size:500;column:policy_uri" json:"policyUri,omitempty"`
	TOSURI                  *string                  `gorm:"size:column:tos_uri" json:"tosUri,omitempty"`
	contacts                []ApplicationContact     `gorm:"foreignKey:ApplicationID" json:"contacts,omitempty"`
	OwnerID                 *string                  `gorm:"type:uuid;column:owner_id" json:"ownerId,omitempty"`
	OrganizationID          *string                  `gorm:"type:uuid;column:organization_id" json:"organizationId,omitempty"`
	CreatedAt               time.Time                `gorm:"column:created_at" json:"createdAt"`
	UpdatedAt               time.Time                `gorm:"column:updated_at" json:"updatedAt"`
	DeletedAt               gorm.DeletedAt           `gorm:"index;column:deleted_at" json:"-"`

	Owner        *User         `gorm:"foreignKey:OwnerID" json:"owner,omitempty"`
	Organization *Organization `gorm:"foreignKey:OrganizationID" json:"organization,omitempty"`
}

type ApplicationRedirectURI struct {
	ID            string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	ApplicationID string    `gorm:"type:uuid;not null;column:application_id" json:"applicationId"`
	URI           string    `gorm:"type:varchar(500);not null" json:"uri"`
	CreatedAt     time.Time `gorm:"column:created_at" json:"createdAt"`
}

type ApplicationGrantType struct {
	ID            string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	ApplicationID string    `gorm:"type:uuid;not null;column:application_id" json:"applicationId"`
	GrantType     string    `gorm:"type:varchar(100);not null" json:"grantType"`
	CreatedAt     time.Time `gorm:"column:created_at" json:"createdAt"`
}

type ApplicationContact struct {
	ID            string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	ApplicationID string    `gorm:"type:uuid;not null;column:application_id" json:"applicationId"`
	Name          string    `gorm:"size:255;not null" json:"name"`
	Email         string    `gorm:"type:varchar(255);not null" json:"email"`
	Phone         *string   `gorm:"size:50" json:"phone,omitempty"`
	CreatedAt     time.Time `gorm:"column:created_at" json:"createdAt"`
}

type ApplicationStats struct {
	ID            string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	ApplicationID string    `gorm:"type:uuid;not null;column:application_id" json:"applicationId"`
	Date          time.Time `gorm:"type:date;not null" json:"date"`
	LoginCount    int       `gorm:"default:0;column:login_count" json:"loginCount"`
	SignUpCount   int       `gorm:"default:0;column:sign_up_count" json:"signUpCount"`
	TokenCount    int       `gorm:"default:0;column:token_count" json:"tokenCount"`
	CreatedAt     time.Time `gorm:"column:created_at" json:"createdAt"`
}
