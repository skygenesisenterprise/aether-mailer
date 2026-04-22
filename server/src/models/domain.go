package models

import (
	"time"

	"gorm.io/gorm"
)

// Domain représente un domaine géré par le système
type Domain struct {
	ID                string         `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Name              string         `gorm:"size:255;uniqueIndex;not null" json:"name"`
	DisplayName       *string        `gorm:"size:255;column:display_name" json:"displayName,omitempty"`
	OrganizationID    string         `gorm:"type:uuid;column:organization_id;not null;index" json:"organizationId"`
	IsInternal        bool           `gorm:"default:false;column:is_internal" json:"isInternal"`
	IsActive          bool           `gorm:"default:true;column:is_active" json:"isActive"`
	IsVerified        bool           `gorm:"default:false;column:is_verified" json:"isVerified"`
	VerifiedAt        *time.Time     `gorm:"column:verified_at" json:"verifiedAt,omitempty"`
	VerificationToken *string        `gorm:"size:255;column:verification_token" json:"verificationToken,omitempty"`
	AllowPublicSignUp bool           `gorm:"default:false;column:allow_public_sign_up" json:"allowPublicSignUp"`
	RequireApproval   bool           `gorm:"default:false;column:require_approval" json:"requireApproval"`
	MaxUsers          *int           `gorm:"column:max_users" json:"maxUsers,omitempty"`
	Notes             *string        `gorm:"type:text" json:"notes,omitempty"`
	CreatedAt         time.Time      `gorm:"column:created_at" json:"createdAt"`
	UpdatedAt         time.Time      `gorm:"column:updated_at" json:"updatedAt"`
	DeletedAt         gorm.DeletedAt `gorm:"index;column:deleted_at" json:"-"`

	Organization  Organization `gorm:"foreignKey:OrganizationID"`
	Users         []UserDomain
	Verifications []DomainVerification
	Settings      *DomainSettings
}

func (Domain) TableName() string {
	return "domains"
}

// UserDomain représente l'association entre un utilisateur et un domaine
type UserDomain struct {
	ID        string         `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID    string         `gorm:"type:uuid;column:user_id;not null;index" json:"userId"`
	DomainID  string         `gorm:"type:uuid;column:domain_id;not null;index" json:"domainId"`
	IsAdmin   bool           `gorm:"default:false;column:is_admin" json:"isAdmin"`
	IsOwner   bool           `gorm:"default:false;column:is_owner" json:"isOwner"`
	JoinedAt  time.Time      `gorm:"column:joined_at" json:"joinedAt"`
	CreatedAt time.Time      `gorm:"column:created_at" json:"createdAt"`
	UpdatedAt time.Time      `gorm:"column:updated_at" json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index;column:deleted_at" json:"-"`

	User   User   `gorm:"foreignKey:UserID"`
	Domain Domain `gorm:"foreignKey:DomainID"`
}

func (UserDomain) TableName() string {
	return "user_domains"
}

// DomainVerification représente les informations de vérification d'un domaine
type DomainVerification struct {
	ID            string     `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	DomainID      string     `gorm:"type:uuid;column:domain_id;not null;index" json:"domainId"`
	Method        string     `gorm:"size:20;not null" json:"method"` // dns, file, mx, meta
	Token         string     `gorm:"size:255;not null" json:"token"`
	Value         string     `gorm:"size:500;not null" json:"value"`
	IsVerified    bool       `gorm:"default:false;column:is_verified" json:"isVerified"`
	VerifiedAt    *time.Time `gorm:"column:verified_at" json:"verifiedAt,omitempty"`
	Attempts      int        `gorm:"default:0" json:"attempts"`
	LastAttemptAt *time.Time `gorm:"column:last_attempt_at" json:"lastAttemptAt,omitempty"`
	CreatedAt     time.Time  `gorm:"column:created_at" json:"createdAt"`
	UpdatedAt     time.Time  `gorm:"column:updated_at" json:"updatedAt"`

	Domain Domain `gorm:"foreignKey:DomainID"`
}

func (DomainVerification) TableName() string {
	return "domain_verifications"
}

// DomainSettings représente les paramètres spécifiques à un domaine
type DomainSettings struct {
	ID            string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	DomainID      string    `gorm:"type:uuid;column:domain_id;not null;uniqueIndex" json:"domainId"`
	EmailPrefix   *string   `gorm:"size:100;column:email_prefix" json:"emailPrefix,omitempty"`
	EmailSuffix   *string   `gorm:"size:100;column:email_suffix" json:"emailSuffix,omitempty"`
	CustomCSS     *string   `gorm:"type:text;column:custom_css" json:"customCss,omitempty"`
	CustomJS      *string   `gorm:"type:text;column:custom_js" json:"customJs,omitempty"`
	BrandingLogo  *string   `gorm:"size:500;column:branding_logo" json:"brandingLogo,omitempty"`
	BrandingColor *string   `gorm:"size:7;column:branding_color" json:"brandingColor,omitempty"`
	CreatedAt     time.Time `gorm:"column:created_at" json:"createdAt"`
	UpdatedAt     time.Time `gorm:"column:updated_at" json:"updatedAt"`

	Domain Domain `gorm:"foreignKey:DomainID"`
}

func (DomainSettings) TableName() string {
	return "domain_settings"
}

// Constantes pour les méthodes de vérification
const (
	DomainVerificationDNS  = "dns"
	DomainVerificationFile = "file"
	DomainVerificationMX   = "mx"
	DomainVerificationMeta = "meta"
)

// DomainWithDetails représente un domaine avec ses informations détaillées
type DomainWithDetails struct {
	Domain
	UserCount    int                 `json:"userCount"`
	IsVerified   bool                `json:"isVerified"`
	Verification *DomainVerification `json:"verification,omitempty"`
	Settings     *DomainSettings     `json:"settings,omitempty"`
}

// DomainUserCount représente le nombre d'utilisateurs par domaine
type DomainUserCount struct {
	DomainID string `json:"domainId"`
	Count    int    `json:"count"`
}
