package models

import (
	"time"
)

// Domain represents the domain model
type Domain struct {
	ID               string            `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Name             string            `json:"name" gorm:"uniqueIndex;not null"`
	DisplayName      *string           `json:"displayName,omitempty"`
	Description      *string           `json:"description,omitempty"`
	IsActive         bool              `json:"isActive" gorm:"not null;default:true"`
	IsVerified       bool              `json:"isVerified" gorm:"not null;default:false"`
	DNSRecords       []DnsRecord       `json:"dnsRecords,omitempty" gorm:"foreignKey:DomainID"`
	MailServerConfig *MailServerConfig `json:"mailServerConfig,omitempty" gorm:"foreignKey:DomainID"`
	CreatedAt        time.Time         `json:"createdAt" gorm:"not null;default:now()"`
	UpdatedAt        time.Time         `json:"updatedAt" gorm:"not null;default:now()"`
	CreatedBy        *string           `json:"createdBy,omitempty"`
	UpdatedBy        *string           `json:"updatedBy,omitempty"`
}

// DnsRecord represents the DNS record model
type DnsRecord struct {
	ID        string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	DomainID  string    `json:"domainId" gorm:"not null;index"`
	Type      DnsType   `json:"type" gorm:"not null"`
	Name      string    `json:"name" gorm:"not null"`
	Value     string    `json:"value" gorm:"not null"`
	TTL       int       `json:"ttl" gorm:"not null;default:3600"`
	Priority  *int      `json:"priority,omitempty"`
	IsActive  bool      `json:"isActive" gorm:"not null;default:true"`
	CreatedAt time.Time `json:"createdAt" gorm:"not null;default:now()"`
	UpdatedAt time.Time `json:"updatedAt" gorm:"not null;default:now()"`
}

// DnsType represents the DNS record type
type DnsType string

const (
	DnsTypeMX    DnsType = "MX"
	DnsTypeTXT   DnsType = "TXT"
	DnsTypeA     DnsType = "A"
	DnsTypeAAAA  DnsType = "AAAA"
	DnsTypeCNAME DnsType = "CNAME"
	DnsTypeSRV   DnsType = "SRV"
)

// MailServerConfig represents the mail server configuration
type MailServerConfig struct {
	ID             string       `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	DomainID       string       `json:"domainId" gorm:"not null;index"`
	Host           string       `json:"host" gorm:"not null"`
	Port           int          `json:"port" gorm:"not null"`
	Protocol       MailProtocol `json:"protocol" gorm:"not null;default:'smtp'"`
	AuthType       MailAuthType `json:"authType" gorm:"not null;default:'none'"`
	Username       *string      `json:"username,omitempty"`
	Password       *string      `json:"password,omitempty"`
	MaxConnections int          `json:"maxConnections" gorm:"not null;default:10"`
	Timeout        int          `json:"timeout" gorm:"not null;default:30"` // in seconds
	IsSecure       bool         `json:"isSecure" gorm:"not null;default:false"`
	IsActive       bool         `json:"isActive" gorm:"not null;default:true"`
	CreatedAt      time.Time    `json:"createdAt" gorm:"not null;default:now()"`
	UpdatedAt      time.Time    `json:"updatedAt" gorm:"not null;default:now()"`
}

// MailProtocol represents the mail protocol
type MailProtocol string

const (
	MailProtocolSMTP     MailProtocol = "smtp"
	MailProtocolSMTPS    MailProtocol = "smtps"
	MailProtocolSTARTTLS MailProtocol = "starttls"
)

// MailAuthType represents the mail authentication type
type MailAuthType string

const (
	MailAuthTypeNone    MailAuthType = "none"
	MailAuthTypePlain   MailAuthType = "plain"
	MailAuthTypeLogin   MailAuthType = "login"
	MailAuthTypeCramMD5 MailAuthType = "crammd5"
)

// CreateDomainRequest represents the create domain request
type CreateDomainRequest struct {
	Name             string                  `json:"name" binding:"required"`
	DisplayName      *string                 `json:"displayName,omitempty"`
	Description      *string                 `json:"description,omitempty"`
	MailServerConfig *CreateMailServerConfig `json:"mailServerConfig,omitempty"`
}

// CreateMailServerConfig represents the create mail server configuration
type CreateMailServerConfig struct {
	Host           string       `json:"host" binding:"required"`
	Port           int          `json:"port" binding:"required,min=1,max=65535"`
	Protocol       MailProtocol `json:"protocol" binding:"required"`
	AuthType       MailAuthType `json:"authType" binding:"required"`
	Username       *string      `json:"username,omitempty"`
	Password       *string      `json:"password,omitempty"`
	MaxConnections int          `json:"maxConnections" binding:"min=1,max=100"`
	Timeout        int          `json:"timeout" binding:"min=1,max=300"`
	IsSecure       bool         `json:"isSecure"`
}

// UpdateDomainRequest represents the update domain request
type UpdateDomainRequest struct {
	DisplayName      *string                 `json:"displayName,omitempty"`
	Description      *string                 `json:"description,omitempty"`
	IsActive         *bool                   `json:"isActive,omitempty"`
	IsVerified       *bool                   `json:"isVerified,omitempty"`
	MailServerConfig *UpdateMailServerConfig `json:"mailServerConfig,omitempty"`
}

// UpdateMailServerConfig represents the update mail server configuration
type UpdateMailServerConfig struct {
	Host           *string       `json:"host,omitempty"`
	Port           *int          `json:"port,omitempty"`
	Protocol       *MailProtocol `json:"protocol,omitempty"`
	AuthType       *MailAuthType `json:"authType,omitempty"`
	Username       *string       `json:"username,omitempty"`
	Password       *string       `json:"password,omitempty"`
	MaxConnections *int          `json:"maxConnections,omitempty"`
	Timeout        *int          `json:"timeout,omitempty"`
	IsSecure       *bool         `json:"isSecure,omitempty"`
	IsActive       *bool         `json:"isActive,omitempty"`
}

// DomainListResponse represents the domain list response
type DomainListResponse struct {
	Domains []Domain `json:"domains"`
	Total   int      `json:"total"`
	Page    int      `json:"page"`
	Limit   int      `json:"limit"`
}

// DomainQueryParams represents the domain query parameters
type DomainQueryParams struct {
	Page       *int    `form:"page,omitempty"`
	Limit      *int    `form:"limit,omitempty"`
	Search     *string `form:"search,omitempty"`
	IsActive   *bool   `form:"isActive,omitempty"`
	IsVerified *bool   `form:"isVerified,omitempty"`
	SortBy     *string `form:"sortBy,omitempty"`
	SortOrder  *string `form:"sortOrder,omitempty"`
}
