package models

import (
	"gorm.io/gorm"
	"time"
)

// IMAPSession represents an IMAP session
type IMAPSession struct {
	ID              string         `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	SessionID       string         `json:"sessionId" gorm:"uniqueIndex;not null"`
	UserID          string         `json:"userId" gorm:"not null;index"`
	ClientIP        string         `json:"clientIP" gorm:"not null;index"`
	Hostname        string         `json:"hostname" gorm:"not null"`
	State           IMAPState      `json:"state" gorm:"default:non_authenticated"`
	Username        string         `json:"username"`
	SelectedMailbox *string        `json:"selectedMailbox"`
	IsAuthenticated bool           `json:"isAuthenticated" gorm:"default:false"`
	IsSecure        bool           `json:"isSecure" gorm:"default:false"`
	LastActivity    time.Time      `json:"lastActivity" gorm:"index"`
	StartedAt       time.Time      `json:"startedAt"`
	EndedAt         *time.Time     `json:"endedAt"`
	CreatedAt       time.Time      `json:"createdAt"`
	UpdatedAt       time.Time      `json:"updatedAt"`
	DeletedAt       gorm.DeletedAt `json:"-" gorm:"index"`

	// Relations
	User      User          `json:"user" gorm:"foreignKey:UserID"`
	Mailboxes []IMAPMailbox `json:"mailboxes,omitempty" gorm:"foreignKey:SessionID"`
	Messages  []IMAPMessage `json:"messages,omitempty" gorm:"foreignKey:SessionID"`
}

// IMAPState represents IMAP connection state
type IMAPState string

const (
	IMAPStateNonAuthenticated IMAPState = "non_authenticated"
	IMAPStateAuthenticated    IMAPState = "authenticated"
	IMAPStateSelected         IMAPState = "selected"
	IMAPStateLogout           IMAPState = "logout"
)

// IMAPMailbox represents an IMAP mailbox
type IMAPMailbox struct {
	ID             string         `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	SessionID      string         `json:"sessionId" gorm:"not null;index"`
	UserID         string         `json:"userId" gorm:"not null;index"`
	Name           string         `json:"name" gorm:"not null;index"`
	DisplayName    string         `json:"displayName"`
	Flags          []string       `json:"flags" gorm:"type:text[]"`
	PermanentFlags []string       `json:"permanentFlags" gorm:"type:text[]"`
	MessageCount   int            `json:"messageCount" gorm:"default:0"`
	RecentCount    int            `json:"recentCount" gorm:"default:0"`
	UnseenCount    int            `json:"unseenCount" gorm:"default:0"`
	UIDNext        uint32         `json:"uidNext" gorm:"default:1"`
	UIDValidity    uint32         `json:"uidValidity" gorm:"default:1"`
	HighestModSeq  uint64         `json:"highestModSeq" gorm:"default:1"`
	IsSubscribed   bool           `json:"isSubscribed" gorm:"default:false"`
	IsSelectable   bool           `json:"isSelectable" gorm:"default:true"`
	IsSpecialUse   bool           `json:"isSpecialUse" gorm:"default:false"`
	SpecialUse     string         `json:"specialUse"`
	ParentID       *string        `json:"parentId" gorm:"index"`
	CreatedAt      time.Time      `json:"createdAt"`
	UpdatedAt      time.Time      `json:"updatedAt"`
	DeletedAt      gorm.DeletedAt `json:"-" gorm:"index"`

	// Relations
	Session  IMAPSession   `json:"session" gorm:"foreignKey:SessionID"`
	User     User          `json:"user" gorm:"foreignKey:UserID"`
	Parent   *IMAPMailbox  `json:"parent,omitempty" gorm:"foreignKey:ParentID"`
	Children []IMAPMailbox `json:"children,omitempty" gorm:"foreignKey:ParentID"`
	Messages []IMAPMessage `json:"messages,omitempty" gorm:"foreignKey:MailboxID"`
}

// IMAPMessage represents an IMAP message
type IMAPMessage struct {
	ID            string         `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	SessionID     string         `json:"sessionId" gorm:"not null;index"`
	UserID        string         `json:"userId" gorm:"not null;index"`
	EmailID       string         `json:"emailId" gorm:"not null;index"`
	MailboxID     string         `json:"mailboxId" gorm:"not null;index"`
	UID           uint32         `json:"uid" gorm:"not null;uniqueIndex:uid_mailbox"`
	MessageSeqNo  uint32         `json:"messageSeqNo" gorm:"not null"`
	Flags         []string       `json:"flags" gorm:"type:text[]"`
	InternalDate  time.Time      `json:"internalDate" gorm:"index"`
	Size          int64          `json:"size"`
	RFC822Size    int64          `json:"rfc822Size"`
	BodyStructure string         `json:"bodyStructure" gorm:"type:text"`
	Envelope      string         `json:"envelope" gorm:"type:text"`
	Body          string         `json:"body" gorm:"type:longtext"`
	ModSeq        uint64         `json:"modSeq" gorm:"default:1"`
	IsRecent      bool           `json:"isRecent" gorm:"default:false"`
	IsSeen        bool           `json:"isSeen" gorm:"default:false"`
	IsFlagged     bool           `json:"isFlagged" gorm:"default:false"`
	IsAnswered    bool           `json:"isAnswered" gorm:"default:false"`
	IsDeleted     bool           `json:"isDeleted" gorm:"default:false"`
	IsDraft       bool           `json:"isDraft" gorm:"default:false"`
	CreatedAt     time.Time      `json:"createdAt"`
	UpdatedAt     time.Time      `json:"updatedAt"`
	DeletedAt     gorm.DeletedAt `json:"-" gorm:"index"`

	// Relations
	Session IMAPSession `json:"session" gorm:"foreignKey:SessionID"`
	User    User        `json:"user" gorm:"foreignKey:UserID"`
	Email   Email       `json:"email" gorm:"foreignKey:EmailID"`
	Mailbox IMAPMailbox `json:"mailbox" gorm:"foreignKey:MailboxID"`
}

// IMAPCommand represents an IMAP command
type IMAPCommand struct {
	ID        string            `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	SessionID string            `json:"sessionId" gorm:"not null;index"`
	UserID    string            `json:"userId" gorm:"not null;index"`
	Tag       string            `json:"tag" gorm:"not null"`
	Command   string            `json:"command" gorm:"not null"`
	Arguments string            `json:"arguments" gorm:"type:text"`
	Status    IMAPCommandStatus `json:"status" gorm:"default:processing"`
	Response  string            `json:"response" gorm:"type:text"`
	Error     string            `json:"error"`
	Duration  int64             `json:"duration"` // in milliseconds
	CreatedAt time.Time         `json:"createdAt"`
	UpdatedAt time.Time         `json:"updatedAt"`
	DeletedAt gorm.DeletedAt    `json:"-" gorm:"index"`

	// Relations
	Session IMAPSession `json:"session" gorm:"foreignKey:SessionID"`
	User    User        `json:"user" gorm:"foreignKey:UserID"`
	Mailbox IMAPMailbox `json:"mailbox" gorm:"foreignKey:MailboxID"`
}

// CreateIMAPSessionRequest represents a request to create an IMAP session
type CreateIMAPSessionRequest struct {
	Hostname *string `json:"hostname"`
	ClientIP string  `json:"clientIP"`
	Username *string `json:"username"`
	IsSecure bool    `json:"isSecure"`
}

// IMAPSearchRequest represents an IMAP search request
type IMAPSearchRequest struct {
	MailboxID string                 `json:"mailboxId"`
	Query     string                 `json:"query"`
	Criteria  map[string]interface{} `json:"criteria,omitempty"`
}

// IMAPFetchRequest represents an IMAP fetch request
type IMAPFetchRequest struct {
	MailboxID    string   `json:"mailboxId"`
	MessageIDs   []uint32 `json:"messageIds"`
	DataItems    []string `json:"dataItems,omitempty"`
	Headers      []string `json:"headers,omitempty"`
	BodySections []string `json:"bodySections,omitempty"`
}

// IMAPCommandStatus represents IMAP command status
type IMAPCommandStatus string

const (
	IMAPCommandStatusProcessing IMAPCommandStatus = "processing"
	IMAPCommandStatusSuccess    IMAPCommandStatus = "success"
	IMAPCommandStatusError      IMAPCommandStatus = "error"
)

// IMAPSearch represents an IMAP search query
type IMAPSearch struct {
	ID           string         `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	SessionID    string         `json:"sessionId" gorm:"not null;index"`
	UserID       string         `json:"userId" gorm:"not null;index"`
	MailboxID    string         `json:"mailboxId" gorm:"not null;index"`
	Query        string         `json:"query" gorm:"type:text;not null"`
	Criteria     string         `json:"criteria" gorm:"type:text"` // JSON representation of search criteria
	Result       []uint32       `json:"result" gorm:"type:text[]"` // Array of UIDs
	MessageCount int            `json:"messageCount"`
	Duration     int64          `json:"duration"` // in milliseconds
	CreatedAt    time.Time      `json:"createdAt"`
	UpdatedAt    time.Time      `json:"updatedAt"`
	DeletedAt    gorm.DeletedAt `json:"-" gorm:"index"`

	// Relations
	Session IMAPSession `json:"session" gorm:"foreignKey:SessionID"`
	User    User        `json:"user" gorm:"foreignKey:UserID"`
	Mailbox IMAPMailbox `json:"mailbox" gorm:"foreignKey:MailboxID"`
}

// IMAPFetch represents an IMAP fetch request
type IMAPFetch struct {
	ID           string         `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	SessionID    string         `json:"sessionId" gorm:"not null;index"`
	UserID       string         `json:"userId" gorm:"not null;index"`
	MailboxID    string         `json:"mailboxId" gorm:"not null;index"`
	MessageIDs   []uint32       `json:"messageIds" gorm:"type:text[]"`
	DataItems    []string       `json:"dataItems" gorm:"type:text[]"`
	Headers      []string       `json:"headers" gorm:"type:text[]"`
	BodySections []string       `json:"bodySections" gorm:"type:text[]"`
	Results      string         `json:"results" gorm:"type:longtext"`
	MessageCount int            `json:"messageCount"`
	Duration     int64          `json:"duration"` // in milliseconds
	CreatedAt    time.Time      `json:"createdAt"`
	UpdatedAt    time.Time      `json:"updatedAt"`
	DeletedAt    gorm.DeletedAt `json:"-" gorm:"index"`

	// Relations
	Session IMAPSession `json:"session" gorm:"foreignKey:SessionID"`
	User    User        `json:"user" gorm:"foreignKey:UserID"`
	Mailbox IMAPMailbox `json:"mailbox" gorm:"foreignKey:MailboxID"`
}

// IMAPStore represents an IMAP store operation
type IMAPStore struct {
	ID            string         `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	SessionID     string         `json:"sessionId" gorm:"not null;index"`
	UserID        string         `json:"userId" gorm:"not null;index"`
	MailboxID     string         `json:"mailboxId" gorm:"not null;index"`
	MessageIDs    []uint32       `json:"messageIds" gorm:"type:text[]"`
	FlagsToAdd    []string       `json:"flagsToAdd" gorm:"type:text[]"`
	FlagsToRemove []string       `json:"flagsToRemove" gorm:"type:text[]"`
	Silent        bool           `json:"silent"`
	MessageCount  int            `json:"messageCount"`
	UpdatedCount  int            `json:"updatedCount"`
	Duration      int64          `json:"duration"` // in milliseconds
	CreatedAt     time.Time      `json:"createdAt"`
	UpdatedAt     time.Time      `json:"updatedAt"`
	DeletedAt     gorm.DeletedAt `json:"-" gorm:"index"`

	// Relations
	Session IMAPSession `json:"session" gorm:"foreignKey:SessionID"`
	User    User        `json:"user" gorm:"foreignKey:UserID"`
	Mailbox IMAPMailbox `json:"mailbox" gorm:"foreignKey:MailboxID"`
}

// IMAPExpunge represents an IMAP expunge operation
type IMAPExpunge struct {
	ID            string         `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	SessionID     string         `json:"sessionId" gorm:"not null;index"`
	UserID        string         `json:"userId" gorm:"not null;index"`
	MailboxID     string         `json:"mailboxId" gorm:"not null;index"`
	MessageIDs    []uint32       `json:"messageIds" gorm:"type:text[]"`
	MessageCount  int            `json:"messageCount"`
	ExpungedCount int            `json:"expungedCount"`
	Duration      int64          `json:"duration"` // in milliseconds
	CreatedAt     time.Time      `json:"createdAt"`
	UpdatedAt     time.Time      `json:"updatedAt"`
	DeletedAt     gorm.DeletedAt `json:"-" gorm:"index"`

	// Relations
	Session IMAPSession `json:"session" gorm:"foreignKey:SessionID"`
	User    User        `json:"user" gorm:"foreignKey:UserID"`
	Mailbox IMAPMailbox `json:"mailbox" gorm:"foreignKey:MailboxID"`
}

// IMAPCopy represents an IMAP copy operation
type IMAPCopy struct {
	ID              string         `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	SessionID       string         `json:"sessionId" gorm:"not null;index"`
	UserID          string         `json:"userId" gorm:"not null;index"`
	SourceMailboxID string         `json:"sourceMailboxId" gorm:"not null;index"`
	TargetMailboxID string         `json:"targetMailboxId" gorm:"not null;index"`
	MessageIDs      []uint32       `json:"messageIds" gorm:"type:text[]"`
	MessageCount    int            `json:"messageCount"`
	CopiedCount     int            `json:"copiedCount"`
	Duration        int64          `json:"duration"` // in milliseconds
	CreatedAt       time.Time      `json:"createdAt"`
	UpdatedAt       time.Time      `json:"updatedAt"`
	DeletedAt       gorm.DeletedAt `json:"-" gorm:"index"`

	// Relations
	Session       IMAPSession `json:"session" gorm:"foreignKey:SessionID"`
	User          User        `json:"user" gorm:"foreignKey:UserID"`
	SourceMailbox IMAPMailbox `json:"sourceMailbox" gorm:"foreignKey:SourceMailboxID"`
	TargetMailbox IMAPMailbox `json:"targetMailbox" gorm:"foreignKey:TargetMailboxID"`
}

// IMAPAppend represents an IMAP append operation
type IMAPAppend struct {
	ID        string           `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	SessionID string           `json:"sessionId" gorm:"not null;index"`
	UserID    string           `json:"userId" gorm:"not null;index"`
	MailboxID string           `json:"mailboxId" gorm:"not null;index"`
	MessageID string           `json:"messageId" gorm:"index"`
	Flags     []string         `json:"flags" gorm:"type:text[]"`
	Date      *time.Time       `json:"date"`
	Message   string           `json:"message" gorm:"type:longtext;not null"`
	Size      int64            `json:"size"`
	Status    IMAPAppendStatus `json:"status" gorm:"default:pending"`
	Error     string           `json:"error"`
	Duration  int64            `json:"duration"` // in milliseconds
	CreatedAt time.Time        `json:"createdAt"`
	UpdatedAt time.Time        `json:"updatedAt"`
	DeletedAt gorm.DeletedAt   `json:"-" gorm:"index"`

	// Relations
	Session IMAPSession `json:"session" gorm:"foreignKey:SessionID"`
	User    User        `json:"user" gorm:"foreignKey:UserID"`
	Mailbox IMAPMailbox `json:"mailbox" gorm:"foreignKey:MailboxID"`
}

// IMAPAppendStatus represents IMAP append status
type IMAPAppendStatus string

const (
	IMAPAppendStatusPending IMAPAppendStatus = "pending"
	IMAPAppendStatusSuccess IMAPAppendStatus = "success"
	IMAPAppendStatusError   IMAPAppendStatus = "error"
)

// IMAPIdle represents an IMAP IDLE operation
type IMAPIdle struct {
	ID        string         `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	SessionID string         `json:"sessionId" gorm:"not null;index"`
	UserID    string         `json:"userId" gorm:"not null;index"`
	MailboxID string         `json:"mailboxId" gorm:"not null;index"`
	IsActive  bool           `json:"isActive" gorm:"default:true"`
	StartedAt time.Time      `json:"startedAt"`
	EndedAt   *time.Time     `json:"endedAt"`
	Duration  int64          `json:"duration"` // in milliseconds
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`

	// Relations
	Session IMAPSession `json:"session" gorm:"foreignKey:SessionID"`
	User    User        `json:"user" gorm:"foreignKey:UserID"`
	Mailbox IMAPMailbox `json:"mailbox" gorm:"foreignKey:MailboxID"`
}
