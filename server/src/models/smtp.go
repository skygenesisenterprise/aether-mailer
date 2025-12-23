package models

import (
	"gorm.io/gorm"
	"time"
)

// SMTPSession represents an SMTP session
type SMTPSession struct {
	ID              string         `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	SessionID       string         `json:"sessionId" gorm:"uniqueIndex;not null"`
	UserID          string         `json:"userId" gorm:"not null;index"`
	ClientIP        string         `json:"clientIP" gorm:"not null;index"`
	Hostname        string         `json:"hostname" gorm:"not null"`
	HELO            string         `json:"helo"`
	EHLO            string         `json:"ehlo"`
	MAILFrom        string         `json:"mailFrom"`
	RCPTTo          string         `json:"rcptTo" gorm:"type:text"`
	Status          SMTPStatus     `json:"status" gorm:"default:active"`
	ErrorMessage    string         `json:"errorMessage"`
	MessageCount    int            `json:"messageCount" gorm:"default:0"`
	BytesReceived   int64          `json:"bytesReceived" gorm:"default:0"`
	BytesSent       int64          `json:"bytesSent" gorm:"default:0"`
	IsAuthenticated bool           `json:"isAuthenticated" gorm:"default:false"`
	IsSecure        bool           `json:"isSecure" gorm:"default:false"`
	StartedAt       time.Time      `json:"startedAt"`
	LastActivity    time.Time      `json:"lastActivity" gorm:"index"`
	EndedAt         *time.Time     `json:"endedAt"`
	CreatedAt       time.Time      `json:"createdAt"`
	UpdatedAt       time.Time      `json:"updatedAt"`
	DeletedAt       gorm.DeletedAt `json:"-" gorm:"index"`

	// Relations
	User     User          `json:"user" gorm:"foreignKey:UserID"`
	Messages []SMTPMessage `json:"messages,omitempty" gorm:"foreignKey:SessionID"`
}

// SMTPStatus represents SMTP session status
type SMTPStatus string

const (
	SMTPStatusActive    SMTPStatus = "active"
	SMTPStatusCompleted SMTPStatus = "completed"
	SMTPStatusAborted   SMTPStatus = "aborted"
	SMTPStatusTimedOut  SMTPStatus = "timed_out"
	SMTPStatusError     SMTPStatus = "error"
)

// SMTPMessage represents an SMTP message
type SMTPMessage struct {
	ID           string            `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	SessionID    string            `json:"sessionId" gorm:"not null;index"`
	UserID       string            `json:"userId" gorm:"not null;index"`
	MessageID    string            `json:"messageId" gorm:"uniqueIndex;not null"`
	FromAddress  string            `json:"fromAddress" gorm:"not null;index"`
	ToAddresses  string            `json:"toAddresses" gorm:"type:text;not null"`
	CcAddresses  string            `json:"ccAddresses" gorm:"type:text"`
	BccAddresses string            `json:"bccAddresses" gorm:"type:text"`
	Subject      string            `json:"subject" gorm:"type:text"`
	BodyText     string            `json:"bodyText" gorm:"type:text"`
	BodyHTML     string            `json:"bodyHTML" gorm:"type:longtext"`
	Headers      string            `json:"headers" gorm:"type:longtext"`
	Attachments  string            `json:"attachments" gorm:"type:text"`
	Data         string            `json:"data" gorm:"type:longtext;not null"`
	Size         int64             `json:"size" gorm:"default:0"`
	Status       SMTPMessageStatus `json:"status" gorm:"default:pending"`
	ErrorMessage string            `json:"errorMessage"`
	Attempts     int               `json:"attempts" gorm:"default:0"`
	LastAttempt  *time.Time        `json:"lastAttempt"`
	QueuedAt     time.Time         `json:"queuedAt" gorm:"index"`
	SentAt       *time.Time        `json:"sentAt"`
	CreatedAt    time.Time         `json:"createdAt"`
	UpdatedAt    time.Time         `json:"updatedAt"`
	DeletedAt    gorm.DeletedAt    `json:"-" gorm:"index"`

	// Relations
	Session SMTPSession `json:"session" gorm:"foreignKey:SessionID"`
	User    User        `json:"user" gorm:"foreignKey:UserID"`
}

// SMTPMessageStatus represents SMTP message status
type SMTPMessageStatus string

const (
	SMTPMessageStatusPending    SMTPMessageStatus = "pending"
	SMTPMessageStatusQueued     SMTPMessageStatus = "queued"
	SMTPMessageStatusProcessing SMTPMessageStatus = "processing"
	SMTPMessageStatusSent       SMTPMessageStatus = "sent"
	SMTPMessageStatusFailed     SMTPMessageStatus = "failed"
	SMTPMessageStatusBounced    SMTPMessageStatus = "bounced"
	SMTPMessageStatusDeferred   SMTPMessageStatus = "deferred"
)

// SMTPQueue represents the SMTP mail queue
type SMTPQueue struct {
	ID           string          `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	MessageID    string          `json:"messageId" gorm:"uniqueIndex;not null"`
	UserID       string          `json:"userId" gorm:"not null;index"`
	FromAddress  string          `json:"fromAddress" gorm:"not null;index"`
	ToAddress    string          `json:"toAddress" gorm:"not null;index"`
	Priority     int             `json:"priority" gorm:"default:0"`
	Attempts     int             `json:"attempts" gorm:"default:0"`
	MaxAttempts  int             `json:"maxAttempts" gorm:"default:5"`
	Status       SMTPQueueStatus `json:"status" gorm:"default:pending"`
	ErrorMessage string          `json:"errorMessage"`
	NextAttempt  time.Time       `json:"nextAttempt" gorm:"index"`
	LastAttempt  *time.Time      `json:"lastAttempt"`
	QueuedAt     time.Time       `json:"queuedAt" gorm:"index"`
	SentAt       *time.Time      `json:"sentAt"`
	CreatedAt    time.Time       `json:"createdAt"`
	UpdatedAt    time.Time       `json:"updatedAt"`
	DeletedAt    gorm.DeletedAt  `json:"-" gorm:"index"`

	// Relations
	User User `json:"user" gorm:"foreignKey:UserID"`
}

// SMTPQueueStatus represents SMTP queue status
type SMTPQueueStatus string

const (
	SMTPQueueStatusPending    SMTPQueueStatus = "pending"
	SMTPQueueStatusQueued     SMTPQueueStatus = "queued"
	SMTPQueueStatusProcessing SMTPQueueStatus = "processing"
	SMTPQueueStatusSent       SMTPQueueStatus = "sent"
	SMTPQueueStatusFailed     SMTPQueueStatus = "failed"
	SMTPQueueStatusBounced    SMTPQueueStatus = "bounced"
	SMTPQueueStatusDeferred   SMTPQueueStatus = "deferred"
)

// SMTPCommand represents an SMTP command
type SMTPCommand struct {
	ID        string            `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	SessionID string            `json:"sessionId" gorm:"not null;index"`
	UserID    string            `json:"userId" gorm:"not null;index"`
	Command   string            `json:"command" gorm:"not null"`
	Arguments string            `json:"arguments" gorm:"type:text"`
	Status    SMTPCommandStatus `json:"status" gorm:"default:processing"`
	Response  string            `json:"response" gorm:"type:text"`
	Error     string            `json:"error"`
	Duration  int64             `json:"duration"` // in milliseconds
	CreatedAt time.Time         `json:"createdAt"`
	UpdatedAt time.Time         `json:"updatedAt"`
	DeletedAt gorm.DeletedAt    `json:"-" gorm:"index"`

	// Relations
	Session SMTPSession `json:"session" gorm:"foreignKey:SessionID"`
	User    User        `json:"user" gorm:"foreignKey:UserID"`
}

// SMTPCommandStatus represents SMTP command status
type SMTPCommandStatus string

const (
	SMTPCommandStatusProcessing SMTPCommandStatus = "processing"
	SMTPCommandStatusSuccess    SMTPCommandStatus = "success"
	SMTPCommandStatusError      SMTPCommandStatus = "error"
)

// SMTPTransaction represents an SMTP transaction
type SMTPTransaction struct {
	ID           string                `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	SessionID    string                `json:"sessionId" gorm:"not null;index"`
	UserID       string                `json:"userId" gorm:"not null;index"`
	MessageID    string                `json:"messageId" gorm:"index"`
	MAILFrom     string                `json:"mailFrom" gorm:"not null"`
	RCPTTo       string                `json:"rcptTo" gorm:"type:text;not null"`
	DataSize     int64                 `json:"dataSize" gorm:"default:0"`
	Status       SMTPTransactionStatus `json:"status" gorm:"default:pending"`
	ErrorMessage string                `json:"errorMessage"`
	Duration     int64                 `json:"duration"` // in milliseconds
	CreatedAt    time.Time             `json:"createdAt"`
	UpdatedAt    time.Time             `json:"updatedAt"`
	DeletedAt    gorm.DeletedAt        `json:"-" gorm:"index"`

	// Relations
	Session SMTPSession `json:"session" gorm:"foreignKey:SessionID"`
	User    User        `json:"user" gorm:"foreignKey:UserID"`
}

// SMTPTransactionStatus represents SMTP transaction status
type SMTPTransactionStatus string

const (
	SMTPTransactionStatusPending   SMTPTransactionStatus = "pending"
	SMTPTransactionStatusCompleted SMTPTransactionStatus = "completed"
	SMTPTransactionStatusAborted   SMTPTransactionStatus = "aborted"
	SMTPTransactionStatusError     SMTPTransactionStatus = "error"
)

// SMTPBounce represents a bounced email
type SMTPBounce struct {
	ID             string         `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	MessageID      string         `json:"messageId" gorm:"not null;index"`
	UserID         string         `json:"userId" gorm:"not null;index"`
	QueueID        string         `json:"queueId" gorm:"index"`
	Recipient      string         `json:"recipient" gorm:"not null;index"`
	BounceType     SMTPBounceType `json:"bounceType" gorm:"not null"`
	BounceReason   string         `json:"bounceReason" gorm:"type:text"`
	OriginalData   string         `json:"originalData" gorm:"type:longtext"`
	DiagnosticData string         `json:"diagnosticData" gorm:"type:text"`
	IsHardBounce   bool           `json:"isHardBounce" gorm:"default:false"`
	ProcessedAt    time.Time      `json:"processedAt"`
	CreatedAt      time.Time      `json:"createdAt"`
	UpdatedAt      time.Time      `json:"updatedAt"`
	DeletedAt      gorm.DeletedAt `json:"-" gorm:"index"`

	// Relations
	User User `json:"user" gorm:"foreignKey:UserID"`
}

// SMTPBounceType represents bounce types
type SMTPBounceType string

const (
	SMTPBounceTypePermanent    SMTPBounceType = "permanent"
	SMTPBounceTypeTransient    SMTPBounceType = "transient"
	SMTPBounceTypeUndetermined SMTPBounceType = "undetermined"
)

// SMTPRelay represents an SMTP relay configuration
type SMTPRelay struct {
	ID             string         `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Name           string         `json:"name" gorm:"not null"`
	Host           string         `json:"host" gorm:"not null"`
	Port           int            `json:"port" gorm:"not null"`
	Username       string         `json:"username"`
	Password       string         `json:"password"`
	AuthType       SMTPAuthType   `json:"authType" gorm:"default:plain"`
	UseTLS         bool           `json:"useTLS" gorm:"default:false"`
	UseSTARTTLS    bool           `json:"useSTARTTLS" gorm:"default:true"`
	MaxConnections int            `json:"maxConnections" gorm:"default:10"`
	Timeout        int            `json:"timeout" gorm:"default:30000"` // in milliseconds
	IsActive       bool           `json:"isActive" gorm:"default:true"`
	Priority       int            `json:"priority" gorm:"default:0"`
	CreatedAt      time.Time      `json:"createdAt"`
	UpdatedAt      time.Time      `json:"updatedAt"`
	DeletedAt      gorm.DeletedAt `json:"-" gorm:"index"`
}

// SMTPAuthType represents SMTP authentication types
type SMTPAuthType string

const (
	SMTPAuthTypeNone      SMTPAuthType = "none"
	SMTPAuthTypePlain     SMTPAuthType = "plain"
	SMTPAuthTypeLogin     SMTPAuthType = "login"
	SMTPAuthTypeCramMD5   SMTPAuthType = "crammd5"
	SMTPAuthTypeDigestMD5 SMTPAuthType = "digestmd5"
)

// Request models for SMTP middleware

// CreateSMTPSessionRequest represents a request to create an SMTP session
type CreateSMTPSessionRequest struct {
	Hostname *string `json:"hostname"`
	ClientIP string  `json:"clientIP"`
	Username *string `json:"username"`
	IsSecure bool    `json:"isSecure"`
}

// SMTPSendMessageRequest represents a request to send an SMTP message
type SMTPSendMessageRequest struct {
	FromAddress  string                  `json:"fromAddress" binding:"required"`
	ToAddresses  []string                `json:"toAddresses" binding:"required,min=1"`
	CcAddresses  []string                `json:"ccAddresses,omitempty"`
	BccAddresses []string                `json:"bccAddresses,omitempty"`
	Subject      string                  `json:"subject"`
	BodyText     string                  `json:"bodyText"`
	BodyHTML     string                  `json:"bodyHTML"`
	Attachments  []SMTPAttachmentRequest `json:"attachments,omitempty"`
	Headers      map[string]string       `json:"headers,omitempty"`
	Priority     int                     `json:"priority"`
}

// SMTPAttachmentRequest represents an SMTP attachment request
type SMTPAttachmentRequest struct {
	Filename    string `json:"filename" binding:"required"`
	ContentType string `json:"contentType" binding:"required"`
	Content     string `json:"content" binding:"required"`
	ContentID   string `json:"contentId,omitempty"`
	IsInline    bool   `json:"isInline"`
}

// SMTPQueueRequest represents a request to manage SMTP queue
type SMTPQueueRequest struct {
	MessageIDs  []string         `json:"messageIds,omitempty"`
	Status      *SMTPQueueStatus `json:"status,omitempty"`
	Priority    *int             `json:"priority,omitempty"`
	MaxAttempts *int             `json:"maxAttempts,omitempty"`
}

// SMTPSearchRequest represents an SMTP search request
type SMTPSearchRequest struct {
	Query    string                 `json:"query"`
	Criteria map[string]interface{} `json:"criteria,omitempty"`
	Status   *SMTPMessageStatus     `json:"status,omitempty"`
	FromDate *time.Time             `json:"fromDate,omitempty"`
	ToDate   *time.Time             `json:"toDate,omitempty"`
}
