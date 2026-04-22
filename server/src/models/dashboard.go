package models

import "time"

// Enums
type SocialPlatform string
type AdCampaignStatus string
type AdCampaignType string
type AdPlacementStatus string
type AuditLogStatus string
type ApiKeyType string
type ApiKeyStatus string
type ScheduledPostStatus string
type RecurringPattern string
type SeoAuditStatus string
type KeywordTrend string
type NewsletterStatus string
type SystemLogLevel string

const (
	AuditLogStatusWarning AuditLogStatus = "WARNING"
)

const (
	ApiKeyTypePublic ApiKeyType = "PUBLIC"
	ApiKeyTypeSecret ApiKeyType = "SECRET"
)

const (
	ApiKeyStatusActive  ApiKeyStatus = "ACTIVE"
	ApiKeyStatusExpired ApiKeyStatus = "EXPIRED"
	ApiKeyStatusRevoked ApiKeyStatus = "REVOKED"
)

const (
	ScheduledPostStatusScheduled ScheduledPostStatus = "SCHEDULED"
	ScheduledPostStatusPublished ScheduledPostStatus = "PUBLISHED"
	ScheduledPostStatusCancelled ScheduledPostStatus = "CANCELLED"
	ScheduledPostStatusFailed    ScheduledPostStatus = "FAILED"
)

const (
	RecurringPatternDaily   RecurringPattern = "DAILY"
	RecurringPatternWeekly  RecurringPattern = "WEEKLY"
	RecurringPatternMonthly RecurringPattern = "MONTHLY"
)

const (
	SeoAuditStatusSuccess SeoAuditStatus = "SUCCESS"
	SeoAuditStatusWarning SeoAuditStatus = "WARNING"
	SeoAuditStatusError   SeoAuditStatus = "ERROR"
)

const (
	KeywordTrendUp     KeywordTrend = "UP"
	KeywordTrendDown   KeywordTrend = "DOWN"
	KeywordTrendStable KeywordTrend = "STABLE"
)

const (
	NewsletterStatusDraft     NewsletterStatus = "DRAFT"
	NewsletterStatusScheduled NewsletterStatus = "SCHEDULED"
	NewsletterStatusSending   NewsletterStatus = "SENDING"
	NewsletterStatusSent      NewsletterStatus = "SENT"
	NewsletterStatusFailed    NewsletterStatus = "FAILED"
)

const (
	SystemLogLevelInfo    SystemLogLevel = "INFO"
	SystemLogLevelWarning SystemLogLevel = "WARNING"
	SystemLogLevelError   SystemLogLevel = "ERROR"
	SystemLogLevelDebug   SystemLogLevel = "DEBUG"
)

// SocialAccount model
type SocialAccount struct {
	ID             string         `json:"id"`
	Platform       SocialPlatform `json:"platform"`
	AccountName    string         `json:"accountName"`
	AccountID      string         `json:"accountId"`
	Connected      bool           `json:"connected"`
	LastSync       *time.Time     `json:"lastSync,omitempty"`
	Followers      int            `json:"followers"`
	Following      int            `json:"following"`
	Posts          int            `json:"posts"`
	AutoPost       bool           `json:"autoPost"`
	AccessToken    string         `json:"-"`
	RefreshToken   string         `json:"-"`
	TokenExpiresAt *time.Time     `json:"tokenExpiresAt,omitempty"`
	CreatedAt      time.Time      `json:"createdAt"`
	UpdatedAt      time.Time      `json:"updatedAt"`
}

// AdCampaign model
type AdCampaign struct {
	ID          string           `json:"id"`
	Name        string           `json:"name"`
	Status      AdCampaignStatus `json:"status"`
	Type        AdCampaignType   `json:"type"`
	Impressions int              `json:"impressions"`
	Clicks      int              `json:"clicks"`
	Ctr         float64          `json:"ctr"`
	Spend       float64          `json:"spend"`
	Budget      float64          `json:"budget"`
	StartDate   time.Time        `json:"startDate"`
	EndDate     *time.Time       `json:"endDate,omitempty"`
	Advertiser  string           `json:"advertiser"`
	CreatedAt   time.Time        `json:"createdAt"`
	UpdatedAt   time.Time        `json:"updatedAt"`
}

// AdPlacement model
type AdPlacement struct {
	ID          string            `json:"id"`
	Name        string            `json:"name"`
	Zone        string            `json:"zone"`
	Format      string            `json:"format"`
	Position    string            `json:"position"`
	Impressions int               `json:"impressions"`
	Clicks      int               `json:"clicks"`
	Ctr         float64           `json:"ctr"`
	Revenue     float64           `json:"revenue"`
	Status      AdPlacementStatus `json:"status"`
	CreatedAt   time.Time         `json:"createdAt"`
	UpdatedAt   time.Time         `json:"updatedAt"`
}

// AuditLog model
type AuditLog struct {
	ID         string         `json:"id"`
	Timestamp  time.Time      `json:"timestamp"`
	UserID     string         `json:"userId,omitempty"`
	UserName   string         `json:"userName,omitempty"`
	UserEmail  string         `json:"userEmail,omitempty"`
	Action     string         `json:"action"`
	Resource   string         `json:"resource"`
	ResourceID string         `json:"resourceId,omitempty"`
	IPAddress  string         `json:"ipAddress,omitempty"`
	UserAgent  string         `json:"userAgent,omitempty"`
	Details    string         `json:"details,omitempty"`
	Status     AuditLogStatus `json:"status"`
	CreatedAt  time.Time      `json:"createdAt"`
}

// ScheduledPost model
type ScheduledPost struct {
	ID               string              `json:"id"`
	Content          string              `json:"content"`
	Platform         SocialPlatform      `json:"platform"`
	ScheduledAt      time.Time           `json:"scheduledAt"`
	Status           ScheduledPostStatus `json:"status"`
	ArticleID        string              `json:"articleId,omitempty"`
	ArticleTitle     string              `json:"articleTitle,omitempty"`
	UserID           string              `json:"userId,omitempty"`
	MediaCount       int                 `json:"mediaCount"`
	Recurring        bool                `json:"recurring"`
	RecurringPattern RecurringPattern    `json:"recurringPattern,omitempty"`
	PublishedAt      *time.Time          `json:"publishedAt,omitempty"`
	CreatedAt        time.Time           `json:"createdAt"`
	UpdatedAt        time.Time           `json:"updatedAt"`
}

// SeoAudit model
type SeoAudit struct {
	ID              string         `json:"id"`
	URL             string         `json:"url"`
	Title           string         `json:"title,omitempty"`
	MetaDescription string         `json:"metaDescription,omitempty"`
	H1              string         `json:"h1,omitempty"`
	Status          SeoAuditStatus `json:"status"`
	Score           int            `json:"score"`
	Issues          []SeoIssue     `json:"issues"`
	LastChecked     time.Time      `json:"lastChecked"`
	CreatedAt       time.Time      `json:"createdAt"`
}

// SeoIssue model
type SeoIssue struct {
	Type    string `json:"type"`
	Message string `json:"message"`
	Field   string `json:"field"`
}

// Keyword model
type Keyword struct {
	ID               string       `json:"id"`
	Keyword          string       `json:"keyword"`
	Position         int          `json:"position"`
	PreviousPosition *int         `json:"previousPosition,omitempty"`
	Volume           int          `json:"volume"`
	Difficulty       string       `json:"difficulty"`
	Trend            KeywordTrend `json:"trend"`
	CreatedAt        time.Time    `json:"createdAt"`
	UpdatedAt        time.Time    `json:"updatedAt"`
}

// MetaTag model
type MetaTag struct {
	ID      string `json:"id"`
	Name    string `json:"name"`
	Content string `json:"content"`
	Page    string `json:"page"`
}

// NewsletterCampaign model
type NewsletterCampaign struct {
	ID          string           `json:"id"`
	Name        string           `json:"name"`
	Subject     string           `json:"subject"`
	Content     string           `json:"content"`
	Status      NewsletterStatus `json:"status"`
	ScheduledAt *time.Time       `json:"scheduledAt,omitempty"`
	SentAt      *time.Time       `json:"sentAt,omitempty"`
	Recipients  int              `json:"recipients"`
	Opens       int              `json:"opens"`
	Clicks      int              `json:"clicks"`
	CreatedAt   time.Time        `json:"createdAt"`
	UpdatedAt   time.Time        `json:"updatedAt"`
}

// SystemLog model
type SystemLog struct {
	ID        string         `json:"id"`
	Level     SystemLogLevel `json:"level"`
	Message   string         `json:"message"`
	Source    string         `json:"source,omitempty"`
	Details   string         `json:"details,omitempty"`
	IPAddress string         `json:"ipAddress,omitempty"`
	UserID    string         `json:"userId,omitempty"`
	CreatedAt time.Time      `json:"createdAt"`
}

// SocialAnalytics model
type SocialAnalytics struct {
	TotalFollowers int             `json:"totalFollowers"`
	TotalPosts     int             `json:"totalPosts"`
	EngagementRate float64         `json:"engagementRate"`
	Platforms      []PlatformStats `json:"platforms"`
}

// PlatformStats model
type PlatformStats struct {
	Platform   SocialPlatform `json:"platform"`
	Followers  int            `json:"followers"`
	Posts      int            `json:"posts"`
	Engagement float64        `json:"engagement"`
}

// Request types
type CreateSocialAccountRequest struct {
	Platform    SocialPlatform `json:"platform" binding:"required"`
	AccountName string         `json:"accountName" binding:"required"`
	AccountID   string         `json:"accountId" binding:"required"`
}

type UpdateSocialAccountRequest struct {
	AccountName string `json:"accountName"`
	AutoPost    *bool  `json:"autoPost"`
}

type CreateAdCampaignRequest struct {
	Name       string         `json:"name" binding:"required"`
	Type       AdCampaignType `json:"type" binding:"required"`
	Budget     float64        `json:"budget" binding:"required"`
	StartDate  time.Time      `json:"startDate" binding:"required"`
	EndDate    *time.Time     `json:"endDate"`
	Advertiser string         `json:"advertiser" binding:"required"`
}

type UpdateAdCampaignRequest struct {
	Name       string         `json:"name"`
	Type       AdCampaignType `json:"type"`
	Budget     float64        `json:"budget"`
	StartDate  time.Time      `json:"startDate"`
	EndDate    *time.Time     `json:"endDate"`
	Advertiser string         `json:"advertiser"`
	Status     string         `json:"status"`
}

type CreateAdPlacementRequest struct {
	Name     string `json:"name" binding:"required"`
	Zone     string `json:"zone" binding:"required"`
	Format   string `json:"format" binding:"required"`
	Position string `json:"position" binding:"required"`
}

type UpdateAdPlacementRequest struct {
	Name     string `json:"name"`
	Zone     string `json:"zone"`
	Format   string `json:"format"`
	Position string `json:"position"`
	Status   string `json:"status"`
}

type CreateApiKeyRequest struct {
	Name        string     `json:"name" binding:"required"`
	Type        ApiKeyType `json:"type" binding:"required"`
	Permissions []string   `json:"permissions"`
	ExpiresAt   *time.Time `json:"expiresAt"`
}

type UpdateApiKeyRequest struct {
	Name string `json:"name"`
}

type CreateScheduledPostRequest struct {
	Content          string           `json:"content" binding:"required"`
	Platform         SocialPlatform   `json:"platform" binding:"required"`
	ScheduledAt      time.Time        `json:"scheduledAt" binding:"required"`
	ArticleID        string           `json:"articleId"`
	MediaCount       int              `json:"mediaCount"`
	Recurring        bool             `json:"recurring"`
	RecurringPattern RecurringPattern `json:"recurringPattern"`
}

type UpdateScheduledPostRequest struct {
	Content          string           `json:"content"`
	ScheduledAt      time.Time        `json:"scheduledAt"`
	Status           string           `json:"status"`
	Recurring        bool             `json:"recurring"`
	RecurringPattern RecurringPattern `json:"recurringPattern"`
}

type CreateSeoAuditRequest struct {
	URL string `json:"url" binding:"required"`
}

type CreateKeywordRequest struct {
	Keyword    string `json:"keyword" binding:"required"`
	Volume     int    `json:"volume"`
	Difficulty string `json:"difficulty"`
}

type UpdateKeywordRequest struct {
	Keyword    string `json:"keyword"`
	Volume     int    `json:"volume"`
	Difficulty string `json:"difficulty"`
	Position   int    `json:"position"`
}

type CreateNewsletterCampaignRequest struct {
	Name    string `json:"name" binding:"required"`
	Subject string `json:"subject" binding:"required"`
	Content string `json:"content" binding:"required"`
}

type UpdateNewsletterCampaignRequest struct {
	Name    string `json:"name"`
	Subject string `json:"subject"`
	Content string `json:"content"`
	Status  string `json:"status"`
}

type ScheduleNewsletterRequest struct {
	ScheduledAt time.Time `json:"scheduledAt" binding:"required"`
}

type SendTestNewsletterRequest struct {
	Email string `json:"email" binding:"required"`
}
