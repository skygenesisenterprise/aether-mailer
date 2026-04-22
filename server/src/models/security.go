package models

import "time"

type Device struct {
	ID        string     `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID    string     `gorm:"type:uuid;column:user_id;index" json:"userId"`
	Name      string     `gorm:"size:255" json:"name"`
	Type      string     `gorm:"size:50" json:"type"`
	OS        string     `gorm:"size:100" json:"os,omitempty"`
	Browser   string     `gorm:"size:100" json:"browser,omitempty"`
	LastSeen  *time.Time `gorm:"column:last_seen" json:"lastSeen,omitempty"`
	IsTrusted bool       `gorm:"default:false;column:is_trusted" json:"isTrusted"`
	IPAddress *string    `gorm:"size:45;column:ip_address" json:"ipAddress,omitempty"`
	CreatedAt time.Time  `gorm:"column:created_at" json:"createdAt"`
}

type UserSession struct {
	ID        string     `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID    string     `gorm:"type:uuid;column:user_id;index" json:"userId"`
	Token     string     `gorm:"size:500;uniqueIndex" json:"-"`
	DeviceID  *string    `gorm:"type:uuid;column:device_id" json:"deviceId,omitempty"`
	IPAddress *string    `gorm:"size:45;column:ip_address" json:"ipAddress,omitempty"`
	UserAgent *string    `gorm:"size:500;column:user_agent" json:"userAgent,omitempty"`
	ExpiresAt *time.Time `gorm:"column:expires_at" json:"expiresAt,omitempty"`
	IsValid   bool       `gorm:"default:true;column:is_valid" json:"isValid"`
	CreatedAt time.Time  `gorm:"column:created_at" json:"createdAt"`
	UpdatedAt time.Time  `gorm:"column:updated_at" json:"updatedAt"`

	User User `gorm:"foreignKey:UserID"`
}

func (UserSession) TableName() string {
	return "sessions"
}

type MfaMethodType string

const (
	MfaMethodTypeTotp     MfaMethodType = "totp"
	MfaMethodTypeEmail    MfaMethodType = "email"
	MfaMethodTypeSMS      MfaMethodType = "sms"
	MfaMethodTypeWebAuthn MfaMethodType = "webauthn"
)

type MfaMethod struct {
	ID          string        `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Name        MfaMethodType `gorm:"type:varchar(50);not null" json:"name"`
	DisplayName string        `gorm:"size:255" json:"displayName"`
	Description *string       `gorm:"size:500" json:"description,omitempty"`
	IsEnabled   bool          `gorm:"default:false;column:is_enabled" json:"isEnabled"`
	Order       int           `gorm:"default:0" json:"order"`
	CreatedAt   time.Time     `gorm:"column:created_at" json:"createdAt"`
	UpdatedAt   time.Time     `gorm:"column:updated_at" json:"updatedAt"`
}

type MfaPolicy struct {
	ID          string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Name        string    `gorm:"size:255;not null" json:"name"`
	DisplayName *string   `gorm:"size:255" json:"displayName,omitempty"`
	Description *string   `gorm:"size:500" json:"description,omitempty"`
	Enrollments []string  `gorm:"type:text[]" json:"enrollments,omitempty"`
	AllowList   []string  `gorm:"type:text[]" json:"allowList,omitempty"`
	ExcludeList []string  `gorm:"type:text[]" json:"excludeList,omitempty"`
	Action      string    `gorm:"size:50;not null" json:"action"`
	IsDefault   bool      `gorm:"default:false;column:is_default" json:"isDefault"`
	Priority    int       `gorm:"default:0" json:"priority"`
	CreatedAt   time.Time `gorm:"column:created_at" json:"createdAt"`
	UpdatedAt   time.Time `gorm:"column:updated_at" json:"updatedAt"`
}

type MfaEnrollment struct {
	ID         string        `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID     string        `gorm:"type:uuid;not null;column:user_id;index" json:"userId"`
	Method     MfaMethodType `gorm:"type:varchar(50);not null" json:"method"`
	Identifier *string       `gorm:"size:255" json:"identifier,omitempty"`
	Secret     *string       `gorm:"size:255" json:"secret,omitempty"`
	IsVerified bool          `gorm:"default:false;column:is_verified" json:"isVerified"`
	CreatedAt  time.Time     `gorm:"column:created_at" json:"createdAt"`
	UpdatedAt  time.Time     `gorm:"column:updated_at" json:"updatedAt"`

	User User `gorm:"foreignKey:UserID"`
}

type MfaChallenge struct {
	ID         string        `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID     string        `gorm:"type:uuid;not null;column:user_id;index" json:"userId"`
	Method     MfaMethodType `gorm:"type:varchar(50);not null" json:"method"`
	Code       *string       `gorm:"size:10" json:"code,omitempty"`
	OtpauthURI *string       `gorm:"size:500;column:otpauth_uri" json:"otpauthUri,omitempty"`
	ExpiresAt  *time.Time    `gorm:"column:expires_at" json:"expiresAt,omitempty"`
	IsVerified bool          `gorm:"default:false;column:is_verified" json:"isVerified"`
	CreatedAt  time.Time     `gorm:"column:created_at" json:"createdAt"`

	User User `gorm:"foreignKey:UserID"`
}

type MfaStats struct {
	ID         string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Date       time.Time `gorm:"type:date;not null" json:"date"`
	Total      int       `gorm:"default:0" json:"total"`
	Active     int       `gorm:"default:0" json:"active"`
	TotpCount  int       `gorm:"default:0;column:totp_count" json:"totpCount"`
	SmsCount   int       `gorm:"default:0;column:sms_count" json:"smsCount"`
	EmailCount int       `gorm:"default:0;column:email_count" json:"emailCount"`
}

type SecurityActivity struct {
	ID          string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID      string    `gorm:"type:uuid;column:user_id" json:"userId,omitempty"`
	Type        string    `gorm:"size:50;not null" json:"type"`
	Title       string    `gorm:"size:255;not null" json:"title"`
	Description *string   `gorm:"size:500" json:"description,omitempty"`
	Device      *string   `gorm:"size:255" json:"device,omitempty"`
	IPAddress   *string   `gorm:"size:45;column:ip_address" json:"ipAddress,omitempty"`
	Time        time.Time `gorm:"column:time" json:"time"` // renamed from Time to avoid conflict
	CreatedAt   time.Time `gorm:"column:created_at" json:"createdAt"`
}

type TwoFactorConfig struct {
	Enabled bool   `json:"enabled"`
	Method  string `json:"method,omitempty"`
}

type SecurityResponse struct {
	Success bool          `json:"success"`
	Data    *SecurityData `json:"data,omitempty"`
	Error   string        `json:"error,omitempty"`
}

type SecurityData struct {
	Devices          []Device           `json:"devices"`
	Sessions         []UserSession      `json:"sessions"`
	Activities       []SecurityActivity `json:"activities"`
	TwoFactor        TwoFactorConfig    `json:"twoFactor"`
	PasskeyEnabled   bool               `json:"passkeyEnabled"`
	SecureNavigation bool               `json:"secureNavigation"`
}

type DevicesResponse struct {
	Success bool     `json:"success"`
	Data    []Device `json:"data,omitempty"`
	Error   string   `json:"error,omitempty"`
}

type SessionsResponse struct {
	Success bool          `json:"success"`
	Data    []UserSession `json:"data,omitempty"`
	Error   string        `json:"error,omitempty"`
}

type ActivitiesResponse struct {
	Success bool               `json:"success"`
	Data    []SecurityActivity `json:"data,omitempty"`
	Error   string             `json:"error,omitempty"`
}

type TrustDeviceRequest struct {
	DeviceID string `json:"deviceId" binding:"required"`
}

type RevokeSessionRequest struct {
	SessionID string `json:"sessionId" binding:"required"`
}

type EnableTwoFactorRequest struct {
	Method string `json:"method" binding:"required"`
	Code   string `json:"code" binding:"required"`
}

type VerifyTwoFactorRequest struct {
	Code string `json:"code" binding:"required"`
}

type BruteForceConfig struct {
	ID               string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	MaxAttempts      int       `gorm:"default:10;column:max_attempts" json:"maxAttempts"`
	LockoutDuration  int       `gorm:"default:900;column:lockout_duration" json:"lockoutDuration"`
	RateLimitEnabled bool      `gorm:"default:true;column:rate_limit_enabled" json:"rateLimitEnabled"`
	IPBlockEnabled   bool      `gorm:"default:false;column:ip_block_enabled" json:"ipBlockEnabled"`
	AllowList        []string  `gorm:"type:text[]" json:"allowList,omitempty"`
	BlockList        []string  `gorm:"type:text[]" json:"blockList,omitempty"`
	UpdatedAt        time.Time `gorm:"column:updated_at" json:"updatedAt"`
}

type BreachedPasswordsConfig struct {
	ID        string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Enabled   bool      `gorm:"default:false" json:"enabled"`
	Mode      string    `gorm:"size:50;default:'audit'" json:"mode"`
	UpdatedAt time.Time `gorm:"column:updated_at" json:"updatedAt"`
}

type SecurityAnalytics struct {
	ID              string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Date            time.Time `gorm:"type:date;not null" json:"date"`
	TotalEvents     int       `gorm:"default:0;column:total_events" json:"totalEvents"`
	BlockedAttempts int       `gorm:"default:0;column:blocked_attempts" json:"blockedAttempts"`
	SuspectedEvents int       `gorm:"default:0;column:suspected_events" json:"suspectedEvents"`
}

type ThreatData struct {
	ID        string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Date      time.Time `gorm:"type:date;not null" json:"date"`
	Type      string    `gorm:"size:100;not null" json:"type"`
	Source    *string   `gorm:"size:255" json:"source,omitempty"`
	Target    *string   `gorm:"size:255" json:"target,omitempty"`
	Severity  string    `gorm:"size:50;not null" json:"severity"`
	Details   *string   `gorm:"type:text" json:"details,omitempty"`
	CreatedAt time.Time `gorm:"column:created_at" json:"createdAt"`
}
