package models

import (
	"time"

	"gorm.io/datatypes"
)

// ──────────────────────────────────────────────────────
// Accounts
// ──────────────────────────────────────────────────────

type MailAccount struct {
	Common
	TenantID         string  `gorm:"column:tenant_id;type:text;not null;index" json:"tenantId"`
	DomainID         string  `gorm:"column:domain_id;type:text;not null;index" json:"domainId"`
	Name             string  `gorm:"column:name;type:text;not null" json:"name"`
	DisplayName      string  `gorm:"column:display_name;type:text;not null" json:"displayName"`
	PasswordHash     string  `gorm:"column:password_hash;type:text;not null" json:"-"`
	QuotaBytes       int64   `gorm:"column:quota_bytes;type:bigint;not null;default:1073741824" json:"quotaBytes"`
	UsedBytes        int64   `gorm:"column:used_bytes;type:bigint;not null;default:0" json:"usedBytes"`
	IsDisabled       bool    `gorm:"column:is_disabled;type:boolean;not null;default:false" json:"isDisabled"`
	DisabledAt       *time.Time `gorm:"column:disabled_at" json:"disabledAt,omitempty"`
	TwoFactorSecret  string  `gorm:"column:two_factor_secret;type:text" json:"-"`
	TwoFactorEnabled bool    `gorm:"column:two_factor_enabled;type:boolean;not null;default:false" json:"twoFactorEnabled"`
	Signature        string  `gorm:"column:signature;type:text" json:"signature"`
	ForwardingAddress string `gorm:"column:forwarding_address;type:text" json:"forwardingAddress"`
	SieveScriptActive string `gorm:"column:sieve_script_active;type:text" json:"sieveScriptActive"`
	VacationSubject  string  `gorm:"column:vacation_subject;type:text" json:"vacationSubject"`
	VacationMessage  string  `gorm:"column:vacation_message;type:text" json:"vacationMessage"`
	VacationEnabled  bool    `gorm:"column:vacation_enabled;type:boolean;not null;default:false" json:"vacationEnabled"`
}

func (MailAccount) TableName() string { return "mail_accounts" }

// ──────────────────────────────────────────────────────
// Domains
// ──────────────────────────────────────────────────────

type MailDomain struct {
	Common
	TenantID         string         `gorm:"column:tenant_id;type:text;not null;index" json:"tenantId"`
	Name             string         `gorm:"column:name;type:text;not null;uniqueIndex" json:"name"`
	IsCatchAll       bool           `gorm:"column:is_catch_all;type:boolean;not null;default:false" json:"isCatchAll"`
	DkimPrivateKey   string         `gorm:"column:dkim_private_key;type:text" json:"-"`
	DkimPublicKey    string         `gorm:"column:dkim_public_key;type:text" json:"dkimPublicKey"`
	DkimSelector     string         `gorm:"column:dkim_selector;type:text" json:"dkimSelector"`
	DmarcPolicy      string         `gorm:"column:dmarc_policy;type:text;not null;default:'none'" json:"dmarcPolicy"`
	DmarcAggregateRua string        `gorm:"column:dmarc_aggregate_rua;type:text" json:"dmarcAggregateRua"`
	SpfEnabled       bool           `gorm:"column:spf_enabled;type:boolean;not null;default:false" json:"spfEnabled"`
	SpfIncludes      datatypes.JSON `gorm:"column:spf_includes;type:jsonb" json:"spfIncludes"`
	TlsCertificateID string         `gorm:"column:tls_certificate_id;type:text" json:"tlsCertificateId"`
	VerifiedAt       *time.Time     `gorm:"column:verified_at" json:"verifiedAt,omitempty"`
}

func (MailDomain) TableName() string { return "mail_domains" }

// ──────────────────────────────────────────────────────
// Aliases
// ──────────────────────────────────────────────────────

type MailAlias struct {
	Common
	AccountID     string `gorm:"column:account_id;type:text;not null;index" json:"accountId"`
	TenantID      string `gorm:"column:tenant_id;type:text;not null;index" json:"tenantId"`
	SourceAddress string `gorm:"column:source_address;type:text;not null" json:"sourceAddress"`
	Destination   string `gorm:"column:destination;type:text;not null" json:"destination"`
	IsEnabled     bool   `gorm:"column:is_enabled;type:boolean;not null;default:true" json:"isEnabled"`
}

func (MailAlias) TableName() string { return "mail_aliases" }

// ──────────────────────────────────────────────────────
// Identities
// ──────────────────────────────────────────────────────

type MailIdentity struct {
	Common
	AccountID string `gorm:"column:account_id;type:text;not null;index" json:"accountId"`
	TenantID  string `gorm:"column:tenant_id;type:text;not null;index" json:"tenantId"`
	Name      string `gorm:"column:name;type:text;not null" json:"name"`
	Email     string `gorm:"column:email;type:text;not null" json:"email"`
	ReplyTo   string `gorm:"column:reply_to;type:text" json:"replyTo"`
	Signature string `gorm:"column:signature;type:text" json:"signature"`
	IsDefault bool   `gorm:"column:is_default;type:boolean;not null;default:false" json:"isDefault"`
}

func (MailIdentity) TableName() string { return "mail_identities" }

// ──────────────────────────────────────────────────────
// Sieve Scripts
// ──────────────────────────────────────────────────────

type SieveScript struct {
	Common
	AccountID  string `gorm:"column:account_id;type:text;not null;index" json:"accountId"`
	TenantID   string `gorm:"column:tenant_id;type:text;not null;index" json:"tenantId"`
	Name       string `gorm:"column:name;type:text;not null" json:"name"`
	ScriptBody string `gorm:"column:script_body;type:text" json:"scriptBody"`
	IsActive   bool   `gorm:"column:is_active;type:boolean;not null;default:false" json:"isActive"`
}

func (SieveScript) TableName() string { return "sieve_scripts" }

// ──────────────────────────────────────────────────────
// Filter Rules
// ──────────────────────────────────────────────────────

type FilterRule struct {
	Common
	AccountID  string         `gorm:"column:account_id;type:text;not null;index" json:"accountId"`
	TenantID   string         `gorm:"column:tenant_id;type:text;not null;index" json:"tenantId"`
	Name       string         `gorm:"column:name;type:text;not null" json:"name"`
	Priority   int            `gorm:"column:priority;type:integer;not null;default:0" json:"priority"`
	Conditions datatypes.JSON `gorm:"column:conditions;type:jsonb" json:"conditions"`
	Actions    datatypes.JSON `gorm:"column:actions;type:jsonb" json:"actions"`
	IsEnabled  bool           `gorm:"column:is_enabled;type:boolean;not null;default:true" json:"isEnabled"`
}

func (FilterRule) TableName() string { return "filter_rules" }

// ──────────────────────────────────────────────────────
// App Passwords
// ──────────────────────────────────────────────────────

type AppPassword struct {
	Common
	AccountID   string `gorm:"column:account_id;type:text;not null;index" json:"accountId"`
	TenantID    string `gorm:"column:tenant_id;type:text;not null;index" json:"tenantId"`
	Name        string `gorm:"column:name;type:text;not null" json:"name"`
	PasswordHash string `gorm:"column:password_hash;type:text;not null" json:"-"`
	LastUsedAt  *time.Time `gorm:"column:last_used_at" json:"lastUsedAt,omitempty"`
}

func (AppPassword) TableName() string { return "app_passwords" }

// ──────────────────────────────────────────────────────
// Account Sessions (IMAP/JMAP)
// ──────────────────────────────────────────────────────

type MailSession struct {
	Common
	AccountID string     `gorm:"column:account_id;type:text;not null;index" json:"accountId"`
	TenantID  string     `gorm:"column:tenant_id;type:text;not null;index" json:"tenantId"`
	Protocol  string     `gorm:"column:protocol;type:text;not null" json:"protocol"`
	IPAddress string     `gorm:"column:ip_address;type:text" json:"ipAddress"`
	UserAgent string     `gorm:"column:user_agent;type:text" json:"userAgent"`
	ExpiresAt time.Time  `gorm:"column:expires_at;type:timestamptz;not null" json:"expiresAt"`
	RevokedAt *time.Time `gorm:"column:revoked_at" json:"revokedAt,omitempty"`
}

func (MailSession) TableName() string { return "mail_sessions" }

// ──────────────────────────────────────────────────────
// Groups
// ──────────────────────────────────────────────────────

type MailGroup struct {
	Common
	TenantID   string `gorm:"column:tenant_id;type:text;not null;index" json:"tenantId"`
	Name       string `gorm:"column:name;type:text;not null" json:"name"`
	Email      string `gorm:"column:email;type:text;not null" json:"email"`
}

func (MailGroup) TableName() string { return "mail_groups" }

type MailGroupMember struct {
	Common
	GroupID   string `gorm:"column:group_id;type:text;not null;index" json:"groupId"`
	AccountID string `gorm:"column:account_id;type:text;not null" json:"accountId"`
	Role      string `gorm:"column:role;type:text;not null;default:'member'" json:"role"`
}

func (MailGroupMember) TableName() string { return "mail_group_members" }

type MailGroupPermission struct {
	Common
	GroupID     string `gorm:"column:group_id;type:text;not null;index" json:"groupId"`
	Permission  string `gorm:"column:permission;type:text;not null" json:"permission"`
}

func (MailGroupPermission) TableName() string { return "mail_group_permissions" }

// ──────────────────────────────────────────────────────
// Roles & Permissions
// ──────────────────────────────────────────────────────

type MailRole struct {
	Common
	TenantID    string         `gorm:"column:tenant_id;type:text;not null;index" json:"tenantId"`
	Name        string         `gorm:"column:name;type:text;not null" json:"name"`
	Description string         `gorm:"column:description;type:text" json:"description"`
	Permissions datatypes.JSON `gorm:"column:permissions;type:jsonb" json:"permissions"`
}

func (MailRole) TableName() string { return "mail_roles" }

type MailRoleMember struct {
	Common
	RoleID      string `gorm:"column:role_id;type:text;not null;index" json:"roleId"`
	PrincipalID string `gorm:"column:principal_id;type:text;not null" json:"principalId"`
}

func (MailRoleMember) TableName() string { return "mail_role_members" }

// ──────────────────────────────────────────────────────
// Tenants
// ──────────────────────────────────────────────────────

type MailTenant struct {
	Common
	Name            string         `gorm:"column:name;type:text;not null" json:"name"`
	MaxAccounts     int            `gorm:"column:max_accounts;type:integer;not null;default:100" json:"maxAccounts"`
	MaxStorageBytes int64          `gorm:"column:max_storage_bytes;type:bigint;not null;default:10737418240" json:"maxStorageBytes"`
	MaxDomains      int            `gorm:"column:max_domains;type:integer;not null;default:10" json:"maxDomains"`
	MaxGroups       int            `gorm:"column:max_groups;type:integer;not null;default:50" json:"maxGroups"`
	MaxMailingLists int            `gorm:"column:max_mailing_lists;type:integer;not null;default:20" json:"maxMailingLists"`
	Rules           datatypes.JSON `gorm:"column:rules;type:jsonb" json:"rules"`
}

func (MailTenant) TableName() string { return "mail_tenants" }

// ──────────────────────────────────────────────────────
// Mailing Lists
// ──────────────────────────────────────────────────────

type MailingList struct {
	Common
	TenantID       string `gorm:"column:tenant_id;type:text;not null;index" json:"tenantId"`
	Name           string `gorm:"column:name;type:text;not null" json:"name"`
	Email          string `gorm:"column:email;type:text;not null" json:"email"`
	IsEnabled      bool   `gorm:"column:is_enabled;type:boolean;not null;default:true" json:"isEnabled"`
	ModerationMode string `gorm:"column:moderation_mode;type:text;not null;default:'none'" json:"moderationMode"`
	Description    string `gorm:"column:description;type:text" json:"description"`
}

func (MailingList) TableName() string { return "mailing_lists" }

type MailingListSubscriber struct {
	Common
	ListID    string `gorm:"column:list_id;type:text;not null;index" json:"listId"`
	Email     string `gorm:"column:email;type:text;not null" json:"email"`
	IsEnabled bool   `gorm:"column:is_enabled;type:boolean;not null;default:true" json:"isEnabled"`
}

func (MailingListSubscriber) TableName() string { return "mailing_list_subscribers" }

type MailingListModeration struct {
	Common
	ListID           string `gorm:"column:list_id;type:text;not null;uniqueIndex" json:"listId"`
	ModeratorEmails  datatypes.JSON `gorm:"column:moderator_emails;type:jsonb" json:"moderatorEmails"`
	PostingMode      string `gorm:"column:posting_mode;type:text;not null;default:'members_only'" json:"postingMode"`
}

func (MailingListModeration) TableName() string { return "mailing_list_moderations" }

// ──────────────────────────────────────────────────────
// SMTP Routes
// ──────────────────────────────────────────────────────

type SmtpRoute struct {
	Common
	TenantID   string `gorm:"column:tenant_id;type:text;not null;index" json:"tenantId"`
	Name       string `gorm:"column:name;type:text;not null" json:"name"`
	RemoteHost string `gorm:"column:remote_host;type:text;not null" json:"remoteHost"`
	Port       int    `gorm:"column:port;type:integer;not null;default:25" json:"port"`
	RequireTls bool   `gorm:"column:require_tls;type:boolean;not null;default:true" json:"requireTls"`
	Username   string `gorm:"column:username;type:text" json:"username"`
	Password   string `gorm:"column:password;type:text" json:"-"`
	MaxRetries int    `gorm:"column:max_retries;type:integer;not null;default:3" json:"maxRetries"`
	Priority   int    `gorm:"column:priority;type:integer;not null;default:0" json:"priority"`
	IsEnabled  bool   `gorm:"column:is_enabled;type:boolean;not null;default:true" json:"isEnabled"`
}

func (SmtpRoute) TableName() string { return "smtp_routes" }

// ──────────────────────────────────────────────────────
// SMTP Queue
// ──────────────────────────────────────────────────────

type SmtpQueueEntry struct {
	Common
	TenantID   string     `gorm:"column:tenant_id;type:text;not null;index" json:"tenantId"`
	From       string     `gorm:"column:from_addr;type:text;not null" json:"from"`
	To         string     `gorm:"column:to_addr;type:text;not null" json:"to"`
	Size       int64      `gorm:"column:size;type:bigint;not null;default:0" json:"size"`
	Retries    int        `gorm:"column:retries;type:integer;not null;default:0" json:"retries"`
	MaxRetries int        `gorm:"column:max_retries;type:integer;not null;default:5" json:"maxRetries"`
	Status     string     `gorm:"column:status;type:text;not null;default:'queued'" json:"status"`
	NextRetry  *time.Time `gorm:"column:next_retry;type:timestamptz" json:"nextRetry,omitempty"`
	Error      string     `gorm:"column:error;type:text" json:"error"`
	RouteID    string     `gorm:"column:route_id;type:text" json:"routeId"`
}

func (SmtpQueueEntry) TableName() string { return "smtp_queue" }

// ──────────────────────────────────────────────────────
// Certificates
// ──────────────────────────────────────────────────────

type Certificate struct {
	Common
	TenantID    string    `gorm:"column:tenant_id;type:text;not null;index" json:"tenantId"`
	Domain      string    `gorm:"column:domain;type:text;not null" json:"domain"`
	CertPEM     string    `gorm:"column:cert_pem;type:text;not null" json:"certPem"`
	KeyPEM      string    `gorm:"column:key_pem;type:text;not null" json:"-"`
	Issuer      string    `gorm:"column:issuer;type:text" json:"issuer"`
	ExpiresAt   time.Time `gorm:"column:expires_at;type:timestamptz;not null" json:"expiresAt"`
	IsAutoRenew bool      `gorm:"column:is_auto_renew;type:boolean;not null;default:false" json:"isAutoRenew"`
}

func (Certificate) TableName() string { return "certificates" }

// ──────────────────────────────────────────────────────
// Log Entries
// ──────────────────────────────────────────────────────

type LogEntry struct {
	Common
	TenantID string         `gorm:"column:tenant_id;type:text;index" json:"tenantId"`
	Level    string         `gorm:"column:level;type:text;not null" json:"level"`
	Category string         `gorm:"column:category;type:text;not null" json:"category"`
	Message  string         `gorm:"column:message;type:text;not null" json:"message"`
	Metadata datatypes.JSON `gorm:"column:metadata;type:jsonb" json:"metadata"`
}

func (LogEntry) TableName() string { return "log_entries" }

// ──────────────────────────────────────────────────────
// Report Records
// ──────────────────────────────────────────────────────

type ReportRecord struct {
	Common
	TenantID string         `gorm:"column:tenant_id;type:text;not null;index" json:"tenantId"`
	Domain   string         `gorm:"column:domain;type:text;not null" json:"domain"`
	Type     string         `gorm:"column:type;type:text;not null" json:"type"`
	Reporter string         `gorm:"column:reporter;type:text;not null" json:"reporter"`
	Period   time.Time      `gorm:"column:period;type:timestamptz;not null" json:"period"`
	Summary  datatypes.JSON `gorm:"column:summary;type:jsonb" json:"summary"`
	RawData  []byte         `gorm:"column:raw_data;type:bytea" json:"-"`
}

func (ReportRecord) TableName() string { return "report_records" }

// ──────────────────────────────────────────────────────
// Server Metrics
// ──────────────────────────────────────────────────────

type ServerMetrics struct {
	Common
	Timestamp   time.Time `gorm:"column:timestamp;type:timestamptz;not null" json:"timestamp"`
	ImapActive  int       `gorm:"column:imap_active;type:integer;not null;default:0" json:"imapActive"`
	JmapActive  int       `gorm:"column:jmap_active;type:integer;not null;default:0" json:"jmapActive"`
	SmtpActive  int       `gorm:"column:smtp_active;type:integer;not null;default:0" json:"smtpActive"`
	QueueSize   int       `gorm:"column:queue_size;type:integer;not null;default:0" json:"queueSize"`
	StorageUsed int64     `gorm:"column:storage_used;type:bigint;not null;default:0" json:"storageUsed"`
	CpuUsage    float64   `gorm:"column:cpu_usage;type:double precision;not null;default:0" json:"cpuUsage"`
	MemoryUsage float64   `gorm:"column:memory_usage;type:double precision;not null;default:0" json:"memoryUsage"`
}

func (ServerMetrics) TableName() string { return "server_metrics" }

// ──────────────────────────────────────────────────────
// API Keys
// ──────────────────────────────────────────────────────

type ApiKey struct {
	Common
	Name      string     `gorm:"column:name;type:text;not null" json:"name"`
	KeyHash   string     `gorm:"column:key_hash;type:text;not null;uniqueIndex" json:"-"`
	Prefix    string     `gorm:"column:prefix;type:text;not null" json:"prefix"`
	TenantID  string     `gorm:"column:tenant_id;type:text;not null;index" json:"tenantId"`
	Scopes    datatypes.JSON `gorm:"column:scopes;type:jsonb" json:"scopes"`
	ExpiresAt *time.Time `gorm:"column:expires_at" json:"expiresAt,omitempty"`
	LastUsedAt *time.Time `gorm:"column:last_used_at" json:"lastUsedAt,omitempty"`
	RevokedAt *time.Time `gorm:"column:revoked_at" json:"revokedAt,omitempty"`
}

func (ApiKey) TableName() string { return "api_keys" }

// ──────────────────────────────────────────────────────
// Spam Rules
// ──────────────────────────────────────────────────────

type SpamRule struct {
	Common
	TenantID  string `gorm:"column:tenant_id;type:text;not null;index" json:"tenantId"`
	Name      string `gorm:"column:name;type:text;not null" json:"name"`
	Condition string `gorm:"column:condition;type:text;not null" json:"condition"`
	Action    string `gorm:"column:action;type:text;not null" json:"action"`
	Score     int    `gorm:"column:score;type:integer;not null;default:1" json:"score"`
	IsEnabled bool   `gorm:"column:is_enabled;type:boolean;not null;default:true" json:"isEnabled"`
}

func (SpamRule) TableName() string { return "spam_rules" }

// ──────────────────────────────────────────────────────
// IP Rules
// ──────────────────────────────────────────────────────

type IpRule struct {
	Common
	TenantID string `gorm:"column:tenant_id;type:text;not null;index" json:"tenantId"`
	CIDR     string `gorm:"column:cidr;type:text;not null" json:"cidr"`
	Action   string `gorm:"column:action;type:text;not null" json:"action"`
	Note     string `gorm:"column:note;type:text" json:"note"`
}

func (IpRule) TableName() string { return "ip_rules" }

// ──────────────────────────────────────────────────────
// ACL Entries
// ──────────────────────────────────────────────────────

type AclEntry struct {
	Common
	TenantID    string `gorm:"column:tenant_id;type:text;not null;index" json:"tenantId"`
	Principal   string `gorm:"column:principal;type:text;not null" json:"principal"`
	Permission  string `gorm:"column:permission;type:text;not null" json:"permission"`
	Description string `gorm:"column:description;type:text" json:"description"`
}

func (AclEntry) TableName() string { return "acl_entries" }

// ──────────────────────────────────────────────────────
// System Sieve Scripts
// ──────────────────────────────────────────────────────

type SystemSieveScript struct {
	Common
	TenantID   string `gorm:"column:tenant_id;type:text;not null;index" json:"tenantId"`
	Name       string `gorm:"column:name;type:text;not null" json:"name"`
	ScriptBody string `gorm:"column:script_body;type:text" json:"scriptBody"`
	IsActive   bool   `gorm:"column:is_active;type:boolean;not null;default:false" json:"isActive"`
}

func (SystemSieveScript) TableName() string { return "system_sieve_scripts" }

// ──────────────────────────────────────────────────────
// Blocked IPs
// ──────────────────────────────────────────────────────

type BlockedIp struct {
	Common
	IP        string     `gorm:"column:ip;type:text;not null;uniqueIndex" json:"ip"`
	Reason    string     `gorm:"column:reason;type:text" json:"reason"`
	BannedAt  time.Time  `gorm:"column:banned_at;type:timestamptz;not null" json:"bannedAt"`
	ExpiresAt *time.Time `gorm:"column:expires_at" type:"timestamptz" json:"expiresAt,omitempty"`
}

func (BlockedIp) TableName() string { return "blocked_ips" }

// ──────────────────────────────────────────────────────
// Dnsbl Servers
// ──────────────────────────────────────────────────────

type DnsblServer struct {
	Common
	TenantID  string `gorm:"column:tenant_id;type:text;not null;index" json:"tenantId"`
	Hostname  string `gorm:"column:hostname;type:text;not null" json:"hostname"`
	IsEnabled bool   `gorm:"column:is_enabled;type:boolean;not null;default:true" json:"isEnabled"`
}

func (DnsblServer) TableName() string { return "dnsbl_servers" }

// ──────────────────────────────────────────────────────
// Policy Rules
// ──────────────────────────────────────────────────────

type PolicyRule struct {
	Common
	TenantID   string         `gorm:"column:tenant_id;type:text;not null;index" json:"tenantId"`
	Name       string         `gorm:"column:name;type:text;not null" json:"name"`
	Conditions datatypes.JSON `gorm:"column:conditions;type:jsonb" json:"conditions"`
	Actions    datatypes.JSON `gorm:"column:actions;type:jsonb" json:"actions"`
	Priority   int            `gorm:"column:priority;type:integer;not null;default:0" json:"priority"`
	IsEnabled  bool           `gorm:"column:is_enabled;type:boolean;not null;default:true" json:"isEnabled"`
}

func (PolicyRule) TableName() string { return "policy_rules" }
