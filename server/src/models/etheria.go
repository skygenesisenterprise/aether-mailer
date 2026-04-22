package models

import "time"

// Enums
type ArticleStatus string
type SubscriptionPlan string
type SubscriptionStatus string
type NotificationType string

const (
	ArticleStatusDraft     ArticleStatus = "DRAFT"
	ArticleStatusReview    ArticleStatus = "REVIEW"
	ArticleStatusPublished ArticleStatus = "PUBLISHED"
	ArticleStatusArchived  ArticleStatus = "ARCHIVED"
)

const (
	PlanEssential SubscriptionPlan = "ESSENTIAL"
	PlanPremium   SubscriptionPlan = "PREMIUM"
)

const (
	SubscriptionActive    SubscriptionStatus = "ACTIVE"
	SubscriptionCancelled SubscriptionStatus = "CANCELLED"
	SubscriptionExpired   SubscriptionStatus = "EXPIRED"
	SubscriptionPastDue   SubscriptionStatus = "PAST_DUE"
)

const (
	NotificationTypeArticle  NotificationType = "ARTICLE"
	NotificationTypeBookmark NotificationType = "BOOKMARK"
	NotificationTypeSystem   NotificationType = "SYSTEM"
	NotificationTypeAccount  NotificationType = "ACCOUNT"
	NotificationTypeComment  NotificationType = "COMMENT"
)

// EtheriaUser model
type EtheriaUser struct {
	ID            string    `json:"id"`
	Email         string    `json:"email"`
	Password      string    `json:"-"`
	FirstName     string    `json:"firstName,omitempty"`
	LastName      string    `json:"lastName,omitempty"`
	Phone         string    `json:"phone,omitempty"`
	AvatarUrl     string    `json:"avatarUrl,omitempty"`
	Role          Role      `json:"role"`
	IsActive      bool      `json:"isActive"`
	EmailVerified time.Time `json:"emailVerified,omitempty"`
	CreatedAt     time.Time `json:"createdAt"`
	UpdatedAt     time.Time `json:"updatedAt"`
}

// UserProfile model
type UserProfile struct {
	ID          string                 `json:"id"`
	UserID      string                 `json:"userId"`
	Bio         string                 `json:"bio,omitempty"`
	Language    string                 `json:"language"`
	Timezone    string                 `json:"timezone"`
	Preferences map[string]interface{} `json:"preferences"`
}

// Subscription model
type Subscription struct {
	ID                string             `json:"id"`
	UserID            string             `json:"userId"`
	Plan              SubscriptionPlan   `json:"plan"`
	Status            SubscriptionStatus `json:"status"`
	StartedAt         time.Time          `json:"startedAt"`
	ExpiresAt         time.Time          `json:"expiresAt,omitempty"`
	LastPaymentDate   time.Time          `json:"lastPaymentDate,omitempty"`
	NextPaymentDate   time.Time          `json:"nextPaymentDate,omitempty"`
	PaymentMethod     string             `json:"paymentMethod,omitempty"`
	PaymentLast4      string             `json:"paymentLast4,omitempty"`
	CancelAtPeriodEnd bool               `json:"cancelAtPeriodEnd"`
}

// Category model
type Category struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Slug        string    `json:"slug"`
	Description string    `json:"description,omitempty"`
	Color       string    `json:"color,omitempty"`
	IsVisible   bool      `json:"isVisible"`
	ParentID    string    `json:"parentId,omitempty"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// Article model
type Article struct {
	ID             string        `json:"id"`
	Title          string        `json:"title"`
	Slug           string        `json:"slug"`
	Excerpt        string        `json:"excerpt,omitempty"`
	Content        string        `json:"content"`
	ContentHtml    string        `json:"contentHtml,omitempty"`
	Status         ArticleStatus `json:"status"`
	Featured       bool          `json:"featured"`
	PublishedAt    time.Time     `json:"publishedAt,omitempty"`
	ScheduledAt    time.Time     `json:"scheduledAt,omitempty"`
	ViewCount      int           `json:"viewCount"`
	ReadTime       int           `json:"readTime"`
	ImageUrl       string        `json:"imageUrl,omitempty"`
	ImageAlt       string        `json:"imageAlt,omitempty"`
	SeoTitle       string        `json:"seoTitle,omitempty"`
	SeoDescription string        `json:"seoDescription,omitempty"`
	SeoKeywords    string        `json:"seoKeywords,omitempty"`
	Locale         string        `json:"locale,omitempty"`
	AuthorID       string        `json:"authorId"`
	CategoryID     string        `json:"categoryId,omitempty"`
	CreatedAt      time.Time     `json:"createdAt"`
	UpdatedAt      time.Time     `json:"updatedAt"`
}

// Comment model
type Comment struct {
	ID         string    `json:"id"`
	Content    string    `json:"content"`
	IsApproved bool      `json:"isApproved"`
	IsFlagged  bool      `json:"isFlagged"`
	FlagReason string    `json:"flagReason,omitempty"`
	ParentID   string    `json:"parentId,omitempty"`
	ArticleID  string    `json:"articleId"`
	AuthorID   string    `json:"authorId"`
	CreatedAt  time.Time `json:"createdAt"`
	UpdatedAt  time.Time `json:"updatedAt"`
}

// Bookmark model
type Bookmark struct {
	ID        string    `json:"id"`
	UserID    string    `json:"userId"`
	ArticleID string    `json:"articleId"`
	CreatedAt time.Time `json:"createdAt"`
}

// ReadingHistory model
type ReadingHistory struct {
	ID        string    `json:"id"`
	UserID    string    `json:"userId"`
	ArticleID string    `json:"articleId"`
	ReadAt    time.Time `json:"readAt"`
}

// EtheriaNotification model
type EtheriaNotification struct {
	ID        string           `json:"id"`
	Type      NotificationType `json:"type"`
	Title     string           `json:"title"`
	Message   string           `json:"message"`
	Link      string           `json:"link,omitempty"`
	IsRead    bool             `json:"isRead"`
	Priority  string           `json:"priority"`
	UserID    string           `json:"userId"`
	CreatedAt time.Time        `json:"createdAt"`
}

// Media model
type Media struct {
	ID           string    `json:"id"`
	Filename     string    `json:"filename"`
	OriginalName string    `json:"originalName"`
	MimeType     string    `json:"mimeType"`
	Size         int64     `json:"size"`
	Url          string    `json:"url"`
	Alt          string    `json:"alt,omitempty"`
	Width        int       `json:"width,omitempty"`
	Height       int       `json:"height,omitempty"`
	ArticleID    string    `json:"articleId,omitempty"`
	CategoryID   string    `json:"categoryId,omitempty"`
	CreatedAt    time.Time `json:"createdAt"`
}

// SystemSettings model
type SystemSettings struct {
	ID                string    `json:"id"`
	SiteName          string    `json:"siteName"`
	SiteDescription   string    `json:"siteDescription,omitempty"`
	SiteUrl           string    `json:"siteUrl,omitempty"`
	LogoUrl           string    `json:"logoUrl,omitempty"`
	FaviconUrl        string    `json:"faviconUrl,omitempty"`
	Email             string    `json:"email,omitempty"`
	SmtpHost          string    `json:"smtpHost,omitempty"`
	SmtpPort          int       `json:"smtpPort,omitempty"`
	SmtpUser          string    `json:"smtpUser,omitempty"`
	SmtpPassword      string    `json:"-"`
	FromName          string    `json:"fromName,omitempty"`
	FromEmail         string    `json:"fromEmail,omitempty"`
	MaintenanceMode   bool      `json:"maintenanceMode"`
	RegistrationOpen  bool      `json:"registrationOpen"`
	CommentsEnabled   bool      `json:"commentsEnabled"`
	NewsletterEnabled bool      `json:"newsletterEnabled"`
	AnalyticsEnabled  bool      `json:"analyticsEnabled"`
	SslEnforced       bool      `json:"sslEnforced"`
	ApiPublicKey      string    `json:"apiPublicKey,omitempty"`
	ApiSecretKey      string    `json:"-"`
	DockerImage       string    `json:"dockerImage"`
	Version           string    `json:"version"`
	CreatedAt         time.Time `json:"createdAt"`
	UpdatedAt         time.Time `json:"updatedAt"`
}

// Request/Response types
type CreateArticleRequest struct {
	Title          string `json:"title" binding:"required"`
	Content        string `json:"content" binding:"required"`
	Excerpt        string `json:"excerpt"`
	CategoryID     string `json:"categoryId"`
	ImageUrl       string `json:"imageUrl"`
	ImageAlt       string `json:"imageAlt"`
	SeoTitle       string `json:"seoTitle"`
	SeoDescription string `json:"seoDescription"`
	SeoKeywords    string `json:"seoKeywords"`
}

type UpdateArticleRequest struct {
	Title          string `json:"title"`
	Content        string `json:"content"`
	Excerpt        string `json:"excerpt"`
	CategoryID     string `json:"categoryId"`
	Status         string `json:"status"`
	ImageUrl       string `json:"imageUrl"`
	ImageAlt       string `json:"imageAlt"`
	SeoTitle       string `json:"seoTitle"`
	SeoDescription string `json:"seoDescription"`
	SeoKeywords    string `json:"seoKeywords"`
	Featured       bool   `json:"featured"`
	ScheduledAt    string `json:"scheduledAt"`
}

type CreateCategoryRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
	Color       string `json:"color"`
	ParentID    string `json:"parentId"`
}

type UpdateCategoryRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Color       string `json:"color"`
	ParentID    string `json:"parentId"`
	IsVisible   *bool  `json:"isVisible"`
}

type CreateCommentRequest struct {
	Content  string `json:"content" binding:"required"`
	ParentID string `json:"parentId"`
}

type UpdateCommentRequest struct {
	Content    string `json:"content"`
	IsApproved *bool  `json:"isApproved"`
}

type CreateSubscriptionRequest struct {
	Plan string `json:"plan" binding:"required"`
}

type EtheriaUpdateSettingsRequest struct {
	SiteName          string `json:"siteName"`
	SiteDescription   string `json:"siteDescription"`
	SiteUrl           string `json:"siteUrl"`
	Email             string `json:"email"`
	SmtpHost          string `json:"smtpHost"`
	SmtpPort          int    `json:"smtpPort"`
	SmtpUser          string `json:"smtpUser"`
	SmtpPassword      string `json:"smtpPassword"`
	FromName          string `json:"fromName"`
	FromEmail         string `json:"fromEmail"`
	MaintenanceMode   *bool  `json:"maintenanceMode"`
	RegistrationOpen  *bool  `json:"registrationOpen"`
	CommentsEnabled   *bool  `json:"commentsEnabled"`
	NewsletterEnabled *bool  `json:"newsletterEnabled"`
	AnalyticsEnabled  *bool  `json:"analyticsEnabled"`
	SslEnforced       *bool  `json:"sslEnforced"`
	DockerImage       string `json:"dockerImage"`
}

type ApiResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Message string      `json:"message,omitempty"`
	Error   string      `json:"error,omitempty"`
}

type PaginatedResponse struct {
	Data       interface{} `json:"data"`
	Total      int         `json:"total"`
	Page       int         `json:"page"`
	PageSize   int         `json:"pageSize"`
	TotalPages int         `json:"totalPages"`
}

type FooterLink struct {
	ID        string `json:"id"`
	Category  string `json:"category"`
	Title     string `json:"title"`
	Name      string `json:"name"`
	Href      string `json:"href"`
	Locale    string `json:"locale"`
	Position  int    `json:"position"`
	IsVisible bool   `json:"isVisible"`
}
