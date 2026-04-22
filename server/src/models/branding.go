package models

import "time"

type Branding struct {
	ID              string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	LogoURL         *string   `gorm:"size:500;column:logo_url" json:"logoUrl,omitempty"`
	IconURL         *string   `gorm:"size:500;column:icon_url" json:"iconUrl,omitempty"`
	PrimaryColor    *string   `gorm:"size:20;column:primary_color" json:"primaryColor,omitempty"`
	SecondaryColor  *string   `gorm:"size:20;column:secondary_color" json:"secondaryColor,omitempty"`
	BackgroundColor *string   `gorm:"size:20;column:background_color" json:"backgroundColor,omitempty"`
	FontColor       *string   `gorm:"size:20;column:font_color" json:"fontColor,omitempty"`
	FontFamily      *string   `gorm:"size:255;column:font_family" json:"fontFamily,omitempty"`
	BannerText      *string   `gorm:"size:500;column:banner_text" json:"bannerText,omitempty"`
	TenantID        *string   `gorm:"type:uuid;column:tenant_id" json:"tenantId,omitempty"`
	CreatedAt       time.Time `gorm:"column:created_at" json:"createdAt"`
	UpdatedAt       time.Time `gorm:"column:updated_at" json:"updatedAt"`
}

type UniversalLoginConfig struct {
	ID           string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Name         string    `gorm:"size:255;not null" json:"name"`
	DisplayName  *string   `gorm:"size:255" json:"displayName,omitempty"`
	IsDefault    bool      `gorm:"default:false;column:is_default" json:"isDefault"`
	BrandingJSON *string   `gorm:"type:text;column:branding_json" json:"brandingJson,omitempty"`
	TenantID     *string   `gorm:"type:uuid;column:tenant_id" json:"tenantId,omitempty"`
	CreatedAt    time.Time `gorm:"column:created_at" json:"createdAt"`
	UpdatedAt    time.Time `gorm:"column:updated_at" json:"updatedAt"`
}

type LoginPage struct {
	ID                     string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UniversalLoginConfigID string    `gorm:"type:uuid;column:universal_login_config_id" json:"universalLoginConfigId"`
	Name                   string    `gorm:"size:255;not null" json:"name"`
	HTMLContent            *string   `gorm:"type:text;column:html_content" json:"htmlContent,omitempty"`
	CSSContent             *string   `gorm:"type:text;column:css_content" json:"cssContent,omitempty"`
	IsEnabled              bool      `gorm:"default:false;column:is_enabled" json:"isEnabled"`
	CreatedAt              time.Time `gorm:"column:created_at" json:"createdAt"`
	UpdatedAt              time.Time `gorm:"column:updated_at" json:"updatedAt"`
}

type CustomLoginSettings struct {
	ID        string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Enabled   bool      `gorm:"default:false" json:"enabled"`
	LoginURL  *string   `gorm:"size:500;column:login_url" json:"loginUrl,omitempty"`
	TenantID  *string   `gorm:"type:uuid;column:tenant_id" json:"tenantId,omitempty"`
	CreatedAt time.Time `gorm:"column:created_at" json:"createdAt"`
	UpdatedAt time.Time `gorm:"column:updated_at" json:"updatedAt"`
}

type BrandingTemplate struct {
	ID           string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Name         string    `gorm:"size:255;not null" json:"name"`
	DisplayName  *string   `gorm:"size:255" json:"displayName,omitempty"`
	Description  *string   `gorm:"size:500" json:"description,omitempty"`
	BrandingJSON *string   `gorm:"type:text;column:branding_json" json:"brandingJson,omitempty"`
	IsBuiltIn    bool      `gorm:"default:false;column:is_built_in" json:"isBuiltIn"`
	CreatedAt    time.Time `gorm:"column:created_at" json:"createdAt"`
	UpdatedAt    time.Time `gorm:"column:updated_at" json:"updatedAt"`
}

type CustomDomain struct {
	ID                 string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Domain             string    `gorm:"size:255;not null;uniqueIndex" json:"domain"`
	Status             string    `gorm:"size:50;default:'pending'" json:"status"` // pending, verified, active, error
	TenantID           *string   `gorm:"type:uuid;column:tenant_id" json:"tenantId,omitempty"`
	VerificationMethod *string   `gorm:"size:100;column:verification_method" json:"verificationMethod,omitempty"`
	VerificationToken  *string   `gorm:"size:255;column:verification_token" json:"verificationToken,omitempty"`
	VerificationURL    *string   `gorm:"size:500;column:verification_url" json:"verificationUrl,omitempty"`
	CreatedAt          time.Time `gorm:"column:created_at" json:"createdAt"`
	UpdatedAt          time.Time `gorm:"column:updated_at" json:"updatedAt"`
}
