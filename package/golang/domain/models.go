package domain

import (
	"time"
)

// User represents a mail system user
type User struct {
	ID                string
	Username          string
	Email             string
	PasswordHash      string
	FirstName         *string
	LastName          *string
	DisplayName       *string
	Role              UserRole
	IsActive          bool
	IsVerified        bool
	TwoFactorEnabled  bool
	TwoFactorSecret   *string
	CreatedAt         time.Time
	UpdatedAt         time.Time
	LastLoginAt       *time.Time
	PasswordChangedAt time.Time
	Timezone          string
	Locale            string
	Theme             string
	MaxEmailsPerDay   int
	MaxStorageMB      int
}

// UserRole defines user permission levels
type UserRole string

const (
	UserRoleSuperAdmin  UserRole = "SUPER_ADMIN"
	UserRoleAdmin       UserRole = "ADMIN"
	UserRoleDomainAdmin UserRole = "DOMAIN_ADMIN"
	UserRoleUser        UserRole = "USER"
	UserRoleReadOnly    UserRole = "READ_ONLY"
)

// Domain represents an email domain
type Domain struct {
	ID              string
	Name            string
	DisplayName     *string
	Description     *string
	IsActive        bool
	IsVerified      bool
	MaxUsers        int
	MaxEmailsPerDay int
	MaxStorageMB    int
	DKIMSelector    *string
	DKIMPublicKey   *string
	DKIMPrivateKey  *string
	SPFRecord       *string
	DMARCRecord     *string
	CreatedAt       time.Time
	UpdatedAt       time.Time
	VerifiedAt      *time.Time
	OwnerID         string
}

// DomainMember represents a user's membership in a domain
type DomainMember struct {
	ID       string
	UserID   string
	DomainID string
	Role     DomainRole
	JoinedAt time.Time
}

// DomainRole defines domain permission levels
type DomainRole string

const (
	DomainRoleOwner    DomainRole = "OWNER"
	DomainRoleAdmin    DomainRole = "ADMIN"
	DomainRoleMember   DomainRole = "MEMBER"
	DomainRoleReadOnly DomainRole = "READ_ONLY"
)

// EmailAccount represents an email account
type EmailAccount struct {
	ID           string
	UserID       string
	DomainID     string
	Email        string
	DisplayName  *string
	PasswordHash string
	IsActive     bool
	IsVerified   bool
	QuotaMB      int
	UsedMB       int
	CreatedAt    time.Time
	UpdatedAt    time.Time
	LastLoginAt  *time.Time
}

// EmailAlias represents an email alias
type EmailAlias struct {
	ID        string
	DomainID  string
	Alias     string
	DestEmail string
	IsActive  bool
	CreatedAt time.Time
	UpdatedAt time.Time
}

// DNSRecord represents a DNS record for a domain
type DNSRecord struct {
	ID       string
	DomainID string
	Type     string
	Name     *string
	Value    *string
	Priority *int
	TTL      *int
}

// Message represents an email message
type Message struct {
	ID          string
	AccountID   string
	From        string
	To          []string
	Cc          []string
	Bcc         []string
	Subject     string
	BodyText    *string
	BodyHTML    *string
	Attachments []Attachment
	Size        int64
	IsRead      bool
	IsDraft     bool
	IsSent      bool
	IsDeleted   bool
	ReceivedAt  time.Time
	SentAt      *time.Time
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

// Attachment represents a message attachment
type Attachment struct {
	ID          string
	MessageID   string
	Filename    string
	ContentType string
	Size        int64
	Content     []byte
}

// Quota represents storage and sending limits
type Quota struct {
	UserID          string
	DomainID        *string
	MaxStorageMB    int
	UsedStorageMB   int
	MaxEmailsPerDay int
	SentEmailsToday int
	ResetAt         time.Time
}

// Policy represents email policies and rules
type Policy struct {
	ID        string
	DomainID  *string
	UserID    *string
	Name      string
	Type      PolicyType
	Rule      string
	Action    PolicyAction
	IsActive  bool
	Priority  int
	CreatedAt time.Time
	UpdatedAt time.Time
}

// PolicyType defines policy categories
type PolicyType string

const (
	PolicyTypeSpam    PolicyType = "SPAM"
	PolicyTypeVirus   PolicyType = "VIRUS"
	PolicyTypeContent PolicyType = "CONTENT"
	PolicyTypeRouting PolicyType = "ROUTING"
	PolicyTypeQuota   PolicyType = "QUOTA"
)

// PolicyAction defines policy actions
type PolicyAction string

const (
	PolicyActionAllow      PolicyAction = "ALLOW"
	PolicyActionBlock      PolicyAction = "BLOCK"
	PolicyActionQuarantine PolicyAction = "QUARANTINE"
	PolicyActionRedirect   PolicyAction = "REDIRECT"
	PolicyActionTag        PolicyAction = "TAG"
)
