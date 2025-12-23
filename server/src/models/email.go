package models

import (
	"gorm.io/gorm"
	"time"
)

// Email represents an email message
type Email struct {
	ID           string         `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	MessageID    string         `json:"messageId" gorm:"uniqueIndex;not null"`
	FromAddress  string         `json:"fromAddress" gorm:"not null;index"`
	ToAddresses  string         `json:"toAddresses" gorm:"type:text;not null"`
	CcAddresses  string         `json:"ccAddresses" gorm:"type:text"`
	BccAddresses string         `json:"bccAddresses" gorm:"type:text"`
	Subject      string         `json:"subject" gorm:"type:text"`
	BodyText     string         `json:"bodyText" gorm:"type:text"`
	BodyHTML     string         `json:"bodyHTML" gorm:"type:longtext"`
	Headers      string         `json:"headers" gorm:"type:longtext"`
	Attachments  string         `json:"attachments" gorm:"type:text"`
	Size         int64          `json:"size" gorm:"default:0"`
	Priority     EmailPriority  `json:"priority" gorm:"default:normal"`
	IsRead       bool           `json:"isRead" gorm:"default:false"`
	IsDraft      bool           `json:"isDraft" gorm:"default:false"`
	IsSent       bool           `json:"isSent" gorm:"default:false"`
	IsDeleted    bool           `json:"isDeleted" gorm:"default:false"`
	IsSpam       bool           `json:"isSpam" gorm:"default:false"`
	IsArchived   bool           `json:"isArchived" gorm:"default:false"`
	FolderID     *string        `json:"folderId" gorm:"index"`
	UserID       string         `json:"userId" gorm:"not null;index"`
	DomainID     *string        `json:"domainId" gorm:"index"`
	SentAt       *time.Time     `json:"sentAt"`
	ReceivedAt   time.Time      `json:"receivedAt" gorm:"index"`
	CreatedAt    time.Time      `json:"createdAt"`
	UpdatedAt    time.Time      `json:"updatedAt"`
	DeletedAt    gorm.DeletedAt `json:"-" gorm:"index"`

	// Relations
	User     User    `json:"user" gorm:"foreignKey:UserID"`
	Domain   *Domain `json:"domain,omitempty" gorm:"foreignKey:DomainID"`
	Folder   *Folder `json:"folder,omitempty" gorm:"foreignKey:FolderID"`
	ThreadID *string `json:"threadId" gorm:"index"`
	Thread   *Thread `json:"thread,omitempty" gorm:"foreignKey:ThreadID"`
}

// EmailPriority represents email priority levels
type EmailPriority string

const (
	EmailPriorityLow    EmailPriority = "low"
	EmailPriorityNormal EmailPriority = "normal"
	EmailPriorityHigh   EmailPriority = "high"
	EmailPriorityUrgent EmailPriority = "urgent"
)

// EmailFolder represents an email folder
type Folder struct {
	ID          string         `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Name        string         `json:"name" gorm:"not null"`
	Type        FolderType     `json:"type" gorm:"not null"`
	UserID      string         `json:"userId" gorm:"not null;index"`
	ParentID    *string        `json:"parentId" gorm:"index"`
	IsSystem    bool           `json:"isSystem" gorm:"default:false"`
	UnreadCount int            `json:"unreadCount" gorm:"default:0"`
	TotalCount  int            `json:"totalCount" gorm:"default:0"`
	CreatedAt   time.Time      `json:"createdAt"`
	UpdatedAt   time.Time      `json:"updatedAt"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`

	// Relations
	User     User     `json:"user" gorm:"foreignKey:UserID"`
	Parent   *Folder  `json:"parent,omitempty" gorm:"foreignKey:ParentID"`
	Children []Folder `json:"children,omitempty" gorm:"foreignKey:ParentID"`
	Emails   []Email  `json:"emails,omitempty" gorm:"foreignKey:FolderID"`
}

// FolderType represents folder types
type FolderType string

const (
	FolderTypeInbox   FolderType = "inbox"
	FolderTypeSent    FolderType = "sent"
	FolderTypeDrafts  FolderType = "drafts"
	FolderTypeTrash   FolderType = "trash"
	FolderTypeSpam    FolderType = "spam"
	FolderTypeArchive FolderType = "archive"
	FolderTypeCustom  FolderType = "custom"
)

// EmailThread represents an email conversation thread
type Thread struct {
	ID          string         `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	UserID      string         `json:"userId" gorm:"not null;index"`
	Subject     string         `json:"subject" gorm:"not null"`
	MessageIDs  string         `json:"messageIds" gorm:"type:text"`
	LastMessage *time.Time     `json:"lastMessage"`
	IsRead      bool           `json:"isRead" gorm:"default:false"`
	CreatedAt   time.Time      `json:"createdAt"`
	UpdatedAt   time.Time      `json:"updatedAt"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`

	// Relations
	User   User    `json:"user" gorm:"foreignKey:UserID"`
	Emails []Email `json:"emails,omitempty" gorm:"foreignKey:ThreadID"`
}

// EmailAttachment represents an email attachment
type EmailAttachment struct {
	ID          string         `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	EmailID     string         `json:"emailId" gorm:"not null;index"`
	Filename    string         `json:"filename" gorm:"not null"`
	ContentType string         `json:"contentType" gorm:"not null"`
	Size        int64          `json:"size" gorm:"default:0"`
	Content     string         `json:"content" gorm:"type:longtext"`
	ContentID   string         `json:"contentId"`
	IsInline    bool           `json:"isInline" gorm:"default:false"`
	Checksum    string         `json:"checksum"`
	CreatedAt   time.Time      `json:"createdAt"`
	UpdatedAt   time.Time      `json:"updatedAt"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`

	// Relations
	Email Email `json:"email" gorm:"foreignKey:EmailID"`
}

// EmailRule represents an email filtering rule
type EmailRule struct {
	ID          string         `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	UserID      string         `json:"userId" gorm:"not null;index"`
	Name        string         `json:"name" gorm:"not null"`
	Description string         `json:"description"`
	Conditions  string         `json:"conditions" gorm:"type:text;not null"` // JSON
	Actions     string         `json:"actions" gorm:"type:text;not null"`    // JSON
	IsActive    bool           `json:"isActive" gorm:"default:true"`
	Priority    int            `json:"priority" gorm:"default:0"`
	MatchCount  int            `json:"matchCount" gorm:"default:0"`
	LastMatched *time.Time     `json:"lastMatched"`
	CreatedAt   time.Time      `json:"createdAt"`
	UpdatedAt   time.Time      `json:"updatedAt"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`

	// Relations
	User User `json:"user" gorm:"foreignKey:UserID"`
}
