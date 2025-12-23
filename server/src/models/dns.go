package models

import (
	"gorm.io/gorm"
	"time"
)

// DNSRecord represents a DNS record
type DNSRecord struct {
	ID         uint           `json:"id" gorm:"primaryKey"`
	DomainID   uint           `json:"domainId" gorm:"not null;index"`
	Type       DNSRecordType  `json:"type" gorm:"not null"`
	Name       string         `json:"name" gorm:"not null"`
	Value      string         `json:"value" gorm:"not null"`
	TTL        int            `json:"ttl" gorm:"default:3600"`
	Priority   *int           `json:"priority,omitempty"`
	Weight     *int           `json:"weight,omitempty"`
	Port       *int           `json:"port,omitempty"`
	Target     *string        `json:"target,omitempty"`
	Protocol   *string        `json:"protocol,omitempty"`
	Service    *string        `json:"service,omitempty"`
	Algorithm  *int           `json:"algorithm,omitempty"`
	Flags      *int           `json:"flags,omitempty"`
	Tag        *string        `json:"tag,omitempty"`
	Usage      *int           `json:"usage,omitempty"`
	Selector   *int           `json:"selector,omitempty"`
	Matching   *int           `json:"matching,omitempty"`
	Order      *int           `json:"order,omitempty"`
	Preference *int           `json:"preference,omitempty"`
	ExpiresAt  *time.Time     `json:"expiresAt,omitempty"`
	CreatedAt  time.Time      `json:"createdAt"`
	UpdatedAt  time.Time      `json:"updatedAt"`
	DeletedAt  gorm.DeletedAt `json:"-" gorm:"index"`

	// Relations
	Domain Domain `json:"domain" gorm:"foreignKey:DomainID"`
}

// DNSProvider represents a DNS provider
type DNSProvider struct {
	ID          uint            `json:"id" gorm:"primaryKey"`
	Name        string          `json:"name" gorm:"not null;uniqueIndex"`
	DisplayName string          `json:"displayName" gorm:"not null"`
	Type        DNSProviderType `json:"type" gorm:"not null"`
	Description string          `json:"description"`
	APIEndpoint string          `json:"apiEndpoint"`
	APIToken    string          `json:"apiToken" gorm:"not null"`
	Secret      string          `json:"secret"`
	Config      string          `json:"config" gorm:"type:json"`
	IsActive    bool            `json:"isActive" gorm:"default:true"`
	IsDefault   bool            `json:"isDefault" gorm:"default:false"`
	RateLimit   int             `json:"rateLimit" gorm:"default:1000"` // requests per hour
	CreatedAt   time.Time       `json:"createdAt"`
	UpdatedAt   time.Time       `json:"updatedAt"`
	DeletedAt   gorm.DeletedAt  `json:"-" gorm:"index"`

	// Relations
	Zones    []DNSZone            `json:"zones,omitempty" gorm:"foreignKey:ProviderID"`
	Settings []DNSProviderSetting `json:"settings,omitempty" gorm:"foreignKey:ProviderID"`
}

// DNSProviderType represents DNS provider types
type DNSProviderType string

const (
	DNSProviderTypeCustom     DNSProviderType = "custom"
	DNSProviderTypeGoogle     DNSProviderType = "google"
	DNSProviderTypeCloudflare DNSProviderType = "cloudflare"
	DNSProviderTypeOpenDNS    DNSProviderType = "opendns"
)

// DNSProviderSetting represents custom settings for DNS providers
type DNSProviderSetting struct {
	ID           uint                   `json:"id" gorm:"primaryKey"`
	ProviderID   uint                   `json:"providerId" gorm:"not null;index"`
	Name         string                 `json:"name" gorm:"not null"`
	Type         DNSProviderSettingType `json:"type" gorm:"not null"`
	Value        string                 `json:"value" gorm:"not null"`
	Description  string                 `json:"description"`
	IsRequired   bool                   `json:"isRequired" gorm:"default:false"`
	IsSecret     bool                   `json:"isSecret" gorm:"default:false"`
	DefaultValue string                 `json:"defaultValue"`
	CreatedAt    time.Time              `json:"createdAt"`
	UpdatedAt    time.Time              `json:"updatedAt"`
	DeletedAt    gorm.DeletedAt         `json:"-" gorm:"index"`

	// Relations
	Provider DNSProvider `json:"provider" gorm:"foreignKey:ProviderID"`
}

// DNSProviderSettingType represents setting types
type DNSProviderSettingType string

const (
	DNSProviderSettingTypeString  DNSProviderSettingType = "string"
	DNSProviderSettingTypeNumber  DNSProviderSettingType = "number"
	DNSProviderSettingTypeBoolean DNSProviderSettingType = "boolean"
	DNSProviderSettingTypeArray   DNSProviderSettingType = "array"
)

// DNSProviderCredential represents credentials for DNS providers
type DNSProviderCredential struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	UserID      uint           `json:"userId" gorm:"not null;index"`
	ProviderID  uint           `json:"providerId" gorm:"not null;index"`
	Name        string         `json:"name" gorm:"not null"`
	Credentials string         `json:"credentials" gorm:"type:text;not null"`
	IsActive    bool           `json:"isActive" gorm:"default:true"`
	LastUsed    *time.Time     `json:"lastUsed"`
	CreatedAt   time.Time      `json:"createdAt"`
	UpdatedAt   time.Time      `json:"updatedAt"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`

	// Relations
	User     User        `json:"user" gorm:"foreignKey:UserID"`
	Provider DNSProvider `json:"provider" gorm:"foreignKey:ProviderID"`
}

// DNSProviderCapability represents capabilities of DNS providers
type DNSProviderCapability struct {
	ID         uint                      `json:"id" gorm:"primaryKey"`
	ProviderID uint                      `json:"providerId" gorm:"not null;index"`
	Capability DNSProviderCapabilityType `json:"capability" gorm:"not null"`
	Supported  bool                      `json:"supported" gorm:"default:true"`
	Limits     string                    `json:"limits" gorm:"type:text"`
	CreatedAt  time.Time                 `json:"createdAt"`
	UpdatedAt  time.Time                 `json:"updatedAt"`

	// Relations
	Provider DNSProvider `json:"provider" gorm:"foreignKey:ProviderID"`
}

// DNSProviderCapabilityType represents provider capabilities
type DNSProviderCapabilityType string

const (
	DNSProviderCapabilityA       DNSProviderCapabilityType = "A"
	DNSProviderCapabilityAAAA    DNSProviderCapabilityType = "AAAA"
	DNSProviderCapabilityMX      DNSProviderCapabilityType = "MX"
	DNSProviderCapabilityTXT     DNSProviderCapabilityType = "TXT"
	DNSProviderCapabilityCNAME   DNSProviderCapabilityType = "CNAME"
	DNSProviderCapabilityNS      DNSProviderCapabilityType = "NS"
	DNSProviderCapabilitySOA     DNSProviderCapabilityType = "SOA"
	DNSProviderCapabilitySRV     DNSProviderCapabilityType = "SRV"
	DNSProviderCapabilityPTR     DNSProviderCapabilityType = "PTR"
	DNSProviderCapabilityCAA     DNSProviderCapabilityType = "CAA"
	DNSProviderCapabilityDNSSEC  DNSProviderCapabilityType = "DNSSEC"
	DNSProviderCapabilityAPI     DNSProviderCapabilityType = "API"
	DNSProviderCapabilityWebhook DNSProviderCapabilityType = "Webhook"
)

// DNSQuery represents a DNS query log
type DNSQuery struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	DomainID  *uint          `json:"domainId,omitempty" gorm:"index"`
	ClientIP  string         `json:"clientIP" gorm:"not null;index"`
	QueryType DNSRecordType  `json:"queryType" gorm:"not null"`
	QueryName string         `json:"queryName" gorm:"not null"`
	Response  string         `json:"response" gorm:"type:text"`
	Status    DNSQueryStatus `json:"status" gorm:"not null"`
	Latency   int64          `json:"latency"` // in milliseconds
	CreatedAt time.Time      `json:"createdAt" gorm:"index"`

	// Relations
	Domain *Domain `json:"domain,omitempty" gorm:"foreignKey:DomainID"`
}

// DNSQueryStatus represents DNS query status
type DNSQueryStatus string

const (
	DNSQueryStatusSuccess  DNSQueryStatus = "success"
	DNSQueryStatusNXDomain DNSQueryStatus = "nxdomain"
	DNSQueryStatusTimeout  DNSQueryStatus = "timeout"
	DNSQueryStatusError    DNSQueryStatus = "error"
)

// DNSPropagation represents DNS propagation status
type DNSPropagation struct {
	ID           uint           `json:"id" gorm:"primaryKey"`
	DomainID     uint           `json:"domainId" gorm:"not null;index"`
	RecordType   DNSRecordType  `json:"recordType" gorm:"not null"`
	RecordValue  string         `json:"recordValue" gorm:"not null"`
	Region       string         `json:"region" gorm:"not null"`
	Provider     string         `json:"provider" gorm:"not null"`
	Status       string         `json:"status" gorm:"not null"`
	ResponseTime int64          `json:"responseTime"` // in milliseconds
	CheckedAt    time.Time      `json:"checkedAt" gorm:"index"`
	CreatedAt    time.Time      `json:"createdAt"`
	UpdatedAt    time.Time      `json:"updatedAt"`
	DeletedAt    gorm.DeletedAt `json:"-" gorm:"index"`

	// Relations
	Domain Domain `json:"domain" gorm:"foreignKey:DomainID"`
}
