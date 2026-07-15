package models

import (
	"time"
)

// Contact représente un contact utilisateur
type Contact struct {
	Common
	UserID      string `json:"userId,omitempty" gorm:"index"`
	Email       string `json:"email" gorm:"index"`
	DisplayName string `json:"displayName"`
	AvatarURL   string `json:"avatarUrl,omitempty"`
	Phone       string `json:"phone,omitempty"`
	Company     string `json:"company,omitempty"`
	JobTitle    string `json:"jobTitle,omitempty"`
	IsFavorite  bool   `json:"isFavorite" gorm:"default:false"`
	Notes       string `json:"notes,omitempty"`
	Tags        string `json:"tags,omitempty"` // Comma-separated tags
}

// FamilyMember représente un membre de la famille
type FamilyMember struct {
	Common
	UserID        string    `json:"userId,omitempty" gorm:"index"`
	Email         string    `json:"email" gorm:"index"`
	DisplayName   string    `json:"displayName"`
	Role          string    `json:"role"`           // "owner", "admin", "member", "viewer"
	Status        string    `json:"status"`         // "pending", "active", "suspended", "removed"
	InvitedBy     string    `json:"invitedBy"`      // User ID who sent the invitation
	InvitedAt     time.Time `json:"invitedAt" gorm:"index"`
	JoinedAt      *time.Time `json:"joinedAt,omitempty"`
	AvatarURL     string    `json:"avatarUrl,omitempty"`
	Phone         string    `json:"phone,omitempty"`
	Relationship string    `json:"relationship,omitempty"` // "parent", "child", "sibling", "other"
}

// Invitation représente une invitation (famille, équipe, etc.)
type Invitation struct {
	Common
	Email       string    `json:"email" gorm:"index"`
	Token       string    `json:"token" gorm:"uniqueIndex"`
	Type        string    `json:"type"`           // "family", "team", "workspace"
	Role        string    `json:"role"`           // Role assigned to the invited user
	Message     string    `json:"message,omitempty"`
	Status      string    `json:"status"`         // "pending", "accepted", "expired", "revoked"
	InvitedBy   string    `json:"invitedBy"`       // User ID who sent the invitation
	TargetID    string    `json:"targetId,omitempty"` // Family ID, Team ID, or Workspace ID
	AcceptedAt  *time.Time `json:"acceptedAt,omitempty"`
	ExpiresAt   time.Time `json:"expiresAt" gorm:"index"`
	Metadata    string    `json:"metadata,omitempty"` // JSON string for additional data
}

// StorageInfo représente les informations de stockage
type StorageInfo struct {
	TotalSpace      int64   `json:"totalSpace"`
	UsedSpace       int64   `json:"usedSpace"`
	AvailableSpace  int64   `json:"availableSpace"`
	UsagePercent    float64 `json:"usagePercent"`
	MaxFileSize     int64   `json:"maxFileSize"`
	FileCount       int     `json:"fileCount"`
	MaxFiles        int     `json:"maxFiles,omitempty"`
}

// FileItem représente un fichier ou dossier dans le stockage
type FileItem struct {
	Common
	UserID        string `json:"userId" gorm:"index"`
	WorkspaceID   string `json:"workspaceId,omitempty" gorm:"index"`
	ParentID      string `json:"parentId,omitempty" gorm:"index"` // Parent folder ID
	Name          string `json:"name"`
	Path          string `json:"path" gorm:"index"`
	Type          string `json:"type"` // "file", "folder"
	MimeType      string `json:"mimeType,omitempty"`
	Size          int64  `json:"size,omitempty"`
	Extension     string `json:"extension,omitempty"`
	Hash          string `json:"hash,omitempty"` // File hash for integrity
	URL           string `json:"url,omitempty"`
	ThumbnailURL  string `json:"thumbnailUrl,omitempty"`
	IsFavorite    bool   `json:"isFavorite" gorm:"default:false"`
	IsPublic      bool   `json:"isPublic" gorm:"default:false"`
	IsShared      bool   `json:"isShared" gorm:"default:false"`
	SharedWith    string `json:"sharedWith,omitempty"` // Comma-separated user IDs
	Permissions   string `json:"permissions,omitempty"` // "read", "write", "delete"
	Description   string `json:"description,omitempty"`
	Tags          string `json:"tags,omitempty"` // Comma-separated tags
	UploadStatus  string `json:"uploadStatus,omitempty"` // "pending", "uploading", "completed", "failed"
	UploadedBy    string `json:"uploadedBy,omitempty"`
	Version       int    `json:"version" gorm:"default:1"`
}

// BillingInfo représente les informations de facturation
type BillingInfo struct {
	Common
	UserID           string `json:"userId" gorm:"uniqueIndex"`
	CustomerID       string `json:"customerId,omitempty"`
	PaymentMethodID  string `json:"paymentMethodId,omitempty"`
	PaymentMethod    string `json:"paymentMethod,omitempty"` // "card", "paypal", "bank_transfer"
	BillingEmail     string `json:"billingEmail"`
	BillingAddress   string `json:"billingAddress,omitempty"`
	TaxID           string `json:"taxId,omitempty"`
	Currency        string `json:"currency" gorm:"default:EUR"`
	NextBillingDate *time.Time `json:"nextBillingDate,omitempty"`
	LastPaymentDate *time.Time `json:"lastPaymentDate,omitempty"`
	PaymentStatus   string `json:"paymentStatus,omitempty"` // "paid", "pending", "failed", "refunded"
}

// Subscription représente un abonnement
type Subscription struct {
	Common
	UserID        string    `json:"userId" gorm:"index"`
	PlanID        string    `json:"planId"`
	PlanName      string    `json:"planName"`
	Status        string    `json:"status"` // "active", "canceled", "past_due", "unpaid", "trialing"
	Amount        float64   `json:"amount"`
	Currency      string    `json:"currency"`
	Interval      string    `json:"interval"` // "month", "year"
	StartDate     time.Time `json:"startDate" gorm:"index"`
	EndDate       *time.Time `json:"endDate,omitempty"`
	CancelAt      *time.Time `json:"cancelAt,omitempty"`
	CanceledAt    *time.Time `json:"canceledAt,omitempty"`
	TrialStart    *time.Time `json:"trialStart,omitempty"`
	TrialEnd      *time.Time `json:"trialEnd,omitempty"`
	Features      string    `json:"features,omitempty"` // JSON array of features
	Metadata      string    `json:"metadata,omitempty"` // JSON string for additional data
}

// Transaction représente une transaction financière
type Transaction struct {
	Common
	UserID        string    `json:"userId" gorm:"index"`
	SubscriptionID string    `json:"subscriptionId,omitempty" gorm:"index"`
	Type          string    `json:"type"` // "payment", "refund", "charge", "adjustment"
	Amount        float64   `json:"amount"`
	Currency      string    `json:"currency"`
	Description   string    `json:"description"`
	Status        string    `json:"status"` // "pending", "completed", "failed", "refunded"
	Date          time.Time `json:"date" gorm:"index"`
	InvoiceID     string    `json:"invoiceId,omitempty"`
	InvoiceURL    string    `json:"invoiceUrl,omitempty"`
	PaymentID     string    `json:"paymentId,omitempty"`
	Gateway       string    `json:"gateway,omitempty"` // "stripe", "paypal", etc.
	GatewayData   string    `json:"gatewayData,omitempty"` // JSON string with gateway-specific data
}

// PrivacySettings représente les paramètres de confidentialité
type PrivacySettings struct {
	Common
	UserID            string `json:"userId" gorm:"uniqueIndex"`
	DataProcessing    bool   `json:"dataProcessing" gorm:"default:true"`
	MarketingEmails   bool   `json:"marketingEmails" gorm:"default:true"`
	Analytics        bool   `json:"analytics" gorm:"default:true"`
	PublicProfile    bool   `json:"publicProfile" gorm:"default:false"`
	Searchable       bool   `json:"searchable" gorm:"default:true"`
	ShowOnlineStatus bool   `json:"showOnlineStatus" gorm:"default:true"`
	DataRetention    string `json:"dataRetention,omitempty"` // "30_days", "90_days", "1_year", "forever"
}

// PersonalDataSummary représente un résumé des données personnelles
type PersonalDataSummary struct {
	TotalFiles     int    `json:"totalFiles"`
	TotalMessages  int    `json:"totalMessages"`
	TotalProjects  int    `json:"totalProjects"`
	TotalContacts  int    `json:"totalContacts"`
	TotalStorage   int64  `json:"totalStorage"`
	DataCategories []DataCategory `json:"dataCategories,omitempty"`
}

// DataCategory représente une catégorie de données
type DataCategory struct {
	Name  string `json:"name"`
	Count int    `json:"count"`
}

// Device représente un appareil connecté
type Device struct {
	Common
	UserID        string `json:"userId" gorm:"index"`
	SessionID     string `json:"sessionId,omitempty" gorm:"index"`
	Type          string `json:"type"` // "desktop", "mobile", "tablet"
	OS            string `json:"os"`
	OSVersion     string `json:"osVersion,omitempty"`
	Browser       string `json:"browser,omitempty"`
	BrowserVersion string `json:"browserVersion,omitempty"`
	DeviceModel   string `json:"deviceModel,omitempty"`
	Manufacturer  string `json:"manufacturer,omitempty"`
	IPAddress     string `json:"ipAddress"`
	UserAgent     string `json:"userAgent"`
	Location      string `json:"location,omitempty"`
	Country       string `json:"country,omitempty"`
	City          string `json:"city,omitempty"`
	LastActive    time.Time `json:"lastActive" gorm:"index"`
	IsCurrent     bool   `json:"isCurrent"`
	IsTrusted     bool   `json:"isTrusted" gorm:"default:false"`
	PushToken     string `json:"pushToken,omitempty"` // For push notifications
}

// LoginHistory représente un historique de connexion
type LoginHistory struct {
	Common
	UserID       string    `json:"userId" gorm:"index"`
	SessionID    string    `json:"sessionId,omitempty"`
	Timestamp    time.Time `json:"timestamp" gorm:"index"`
	IPAddress    string    `json:"ipAddress"`
	Location     string    `json:"location,omitempty"`
	Country      string    `json:"country,omitempty"`
	City         string    `json:"city,omitempty"`
	DeviceType   string    `json:"deviceType"` // "desktop", "mobile", "tablet", "unknown"
	Browser      string    `json:"browser,omitempty"`
	OS           string    `json:"os,omitempty"`
	UserAgent    string    `json:"userAgent,omitempty"`
	Status       string    `json:"status"` // "success", "failed", "blocked"
	FailureReason string   `json:"failureReason,omitempty"`
	TwoFAUsed    bool      `json:"twoFaUsed" gorm:"default:false"`
	TwoFAMethod  string    `json:"twoFaMethod,omitempty"` // "totp", "sms", "email"
}

// ActivityItem représente un élément d'activité récente
type ActivityItem struct {
	Common
	UserID       string `json:"userId" gorm:"index"`
	WorkspaceID  string `json:"workspaceId,omitempty" gorm:"index"`
	Type         string `json:"type"` // "project", "task", "message", "file", "call", "meeting"
	EntityID     string `json:"entityId"` // ID of the related entity
	Title        string `json:"title"`
	Message      string `json:"message"`
	Icon         string `json:"icon,omitempty"`
	URL          string `json:"url,omitempty"`
	IsRead       bool   `json:"isRead" gorm:"default:false"`
}

// HomeStats représente les statistiques pour la page d'accueil
type HomeStats struct {
	TotalProjects   int `json:"totalProjects"`
	TotalTasks     int `json:"totalTasks"`
	CompletedTasks  int `json:"completedTasks"`
	TotalMessages  int `json:"totalMessages"`
	UnreadMessages int `json:"unreadMessages"`
	TotalContacts  int `json:"totalContacts"`
	StorageUsed    int64 `json:"storageUsed"`
	StorageLimit   int64 `json:"storageLimit"`
	RecentActivity []ActivityItem `json:"recentActivity,omitempty"`
}
