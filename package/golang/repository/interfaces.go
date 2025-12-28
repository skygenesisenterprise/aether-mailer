package repository

import (
	"context"
	"time"

	"github.com/skygenesisenterprise/aether-mailer/package/golang/domain"
)

// UserRepository defines the contract for user data access
type UserRepository interface {
	Create(ctx context.Context, user *domain.User) error
	GetByID(ctx context.Context, id string) (*domain.User, error)
	GetByEmail(ctx context.Context, email string) (*domain.User, error)
	GetByUsername(ctx context.Context, username string) (*domain.User, error)
	Update(ctx context.Context, user *domain.User) error
	Delete(ctx context.Context, id string) error
	List(ctx context.Context, filter UserFilter) ([]*domain.User, error)
	Count(ctx context.Context, filter UserFilter) (int, error)
}

// UserFilter defines filtering options for user queries
type UserFilter struct {
	Role       *domain.UserRole
	IsActive   *bool
	IsVerified *bool
	DomainID   *string
	Limit      int
	Offset     int
}

// DomainRepository defines the contract for domain data access
type DomainRepository interface {
	Create(ctx context.Context, domain *domain.Domain) error
	GetByID(ctx context.Context, id string) (*domain.Domain, error)
	GetByName(ctx context.Context, name string) (*domain.Domain, error)
	Update(ctx context.Context, domain *domain.Domain) error
	Delete(ctx context.Context, id string) error
	List(ctx context.Context, filter DomainFilter) ([]*domain.Domain, error)
	Count(ctx context.Context, filter DomainFilter) (int, error)
}

// DomainFilter defines filtering options for domain queries
type DomainFilter struct {
	OwnerID    *string
	IsActive   *bool
	IsVerified *bool
	Limit      int
	Offset     int
}

// DomainMemberRepository defines the contract for domain member data access
type DomainMemberRepository interface {
	Create(ctx context.Context, member *domain.DomainMember) error
	GetByID(ctx context.Context, id string) (*domain.DomainMember, error)
	GetByUserAndDomain(ctx context.Context, userID, domainID string) (*domain.DomainMember, error)
	Update(ctx context.Context, member *domain.DomainMember) error
	Delete(ctx context.Context, id string) error
	ListByDomain(ctx context.Context, domainID string) ([]*domain.DomainMember, error)
	ListByUser(ctx context.Context, userID string) ([]*domain.DomainMember, error)
}

// EmailAccountRepository defines the contract for email account data access
type EmailAccountRepository interface {
	Create(ctx context.Context, account *domain.EmailAccount) error
	GetByID(ctx context.Context, id string) (*domain.EmailAccount, error)
	GetByEmail(ctx context.Context, email string) (*domain.EmailAccount, error)
	Update(ctx context.Context, account *domain.EmailAccount) error
	Delete(ctx context.Context, id string) error
	List(ctx context.Context, filter EmailAccountFilter) ([]*domain.EmailAccount, error)
	Count(ctx context.Context, filter EmailAccountFilter) (int, error)
}

// EmailAccountFilter defines filtering options for email account queries
type EmailAccountFilter struct {
	UserID     *string
	DomainID   *string
	IsActive   *bool
	IsVerified *bool
	Limit      int
	Offset     int
}

// MessageRepository defines the contract for message data access
type MessageRepository interface {
	Create(ctx context.Context, message *domain.Message) error
	GetByID(ctx context.Context, id string) (*domain.Message, error)
	Update(ctx context.Context, message *domain.Message) error
	Delete(ctx context.Context, id string) error
	ListByAccount(ctx context.Context, accountID string, filter MessageFilter) ([]*domain.Message, error)
	CountByAccount(ctx context.Context, accountID string, filter MessageFilter) (int, error)
	Search(ctx context.Context, query MessageSearchQuery) ([]*domain.Message, error)
}

// MessageFilter defines filtering options for message queries
type MessageFilter struct {
	IsRead    *bool
	IsDraft   *bool
	IsSent    *bool
	IsDeleted *bool
	From      *string
	To        *string
	Subject   *string
	DateFrom  *time.Time
	DateTo    *time.Time
	Limit     int
	Offset    int
}

// MessageSearchQuery defines search parameters for messages
type MessageSearchQuery struct {
	AccountID string
	Query     string
	DateFrom  *time.Time
	DateTo    *time.Time
	Limit     int
	Offset    int
}

// AttachmentRepository defines the contract for attachment data access
type AttachmentRepository interface {
	Create(ctx context.Context, attachment *domain.Attachment) error
	GetByID(ctx context.Context, id string) (*domain.Attachment, error)
	GetByMessageID(ctx context.Context, messageID string) ([]*domain.Attachment, error)
	Delete(ctx context.Context, id string) error
}

// QuotaRepository defines the contract for quota data access
type QuotaRepository interface {
	Create(ctx context.Context, quota *domain.Quota) error
	GetByUserID(ctx context.Context, userID string) (*domain.Quota, error)
	GetByDomainID(ctx context.Context, domainID string) (*domain.Quota, error)
	Update(ctx context.Context, quota *domain.Quota) error
	ResetDailyCounters(ctx context.Context, userID string) error
}

// PolicyRepository defines the contract for policy data access
type PolicyRepository interface {
	Create(ctx context.Context, policy *domain.Policy) error
	GetByID(ctx context.Context, id string) (*domain.Policy, error)
	Update(ctx context.Context, policy *domain.Policy) error
	Delete(ctx context.Context, id string) error
	List(ctx context.Context, filter PolicyFilter) ([]*domain.Policy, error)
	GetActivePolicies(ctx context.Context, filter PolicyFilter) ([]*domain.Policy, error)
}

// PolicyFilter defines filtering options for policy queries
type PolicyFilter struct {
	DomainID *string
	UserID   *string
	Type     *domain.PolicyType
	IsActive *bool
	Limit    int
	Offset   int
}

// DNSRecordRepository defines the contract for DNS record data access
type DNSRecordRepository interface {
	Create(ctx context.Context, record *domain.DNSRecord) error
	GetByID(ctx context.Context, id string) (*domain.DNSRecord, error)
	GetByDomainID(ctx context.Context, domainID string) ([]*domain.DNSRecord, error)
	Update(ctx context.Context, record *domain.DNSRecord) error
	Delete(ctx context.Context, id string) error
}

// EmailAliasRepository defines the contract for email alias data access
type EmailAliasRepository interface {
	Create(ctx context.Context, alias *domain.EmailAlias) error
	GetByID(ctx context.Context, id string) (*domain.EmailAlias, error)
	GetByAlias(ctx context.Context, alias string) (*domain.EmailAlias, error)
	GetByDomainID(ctx context.Context, domainID string) ([]*domain.EmailAlias, error)
	Update(ctx context.Context, alias *domain.EmailAlias) error
	Delete(ctx context.Context, id string) error
}
