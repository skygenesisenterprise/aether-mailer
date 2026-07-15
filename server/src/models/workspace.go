package models

import "time"

type Workspace struct {
	Common
	Name        string     `gorm:"type:text;not null" json:"name"`
	Slug        string     `gorm:"type:text;uniqueIndex;not null" json:"slug"`
	Description string     `gorm:"type:text" json:"description,omitempty"`
	Visibility  string     `gorm:"type:text;not null;default:'private'" json:"visibility"`
	OwnerID     string     `gorm:"type:text;index;not null" json:"ownerId"`
	ArchivedAt  *time.Time `json:"archivedAt,omitempty"`
}

type WorkspaceMember struct {
	Common
	WorkspaceID string     `gorm:"type:text;index;not null" json:"workspaceId"`
	UserID      string     `gorm:"type:text;index;not null" json:"userId"`
	Role        string     `gorm:"type:text;not null" json:"role"`
	JoinedAt    time.Time  `gorm:"not null" json:"joinedAt"`
	LastSeenAt  *time.Time `json:"lastSeenAt,omitempty"`
}
