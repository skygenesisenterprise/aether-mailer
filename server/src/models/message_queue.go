package models

import (
	"time"

	"gorm.io/gorm"
)

type MessageQueue struct {
	ID           string         `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Type         string         `gorm:"size:50;not null" json:"type"` // message, report
	Status       string         `gorm:"size:50;default:'pending'" json:"status"` // pending, processing, completed, failed, retry
	Payload      interface{}    `gorm:"type:jsonb" json:"payload,omitempty"`
	Attempts    int            `gorm:"default:0" json:"attempts"`
	MaxAttempts int            `gorm:"default:3" json:"maxAttempts"`
	ScheduledAt *time.Time     `gorm:"column:scheduled_at" json:"scheduledAt,omitempty"`
	StartedAt   *time.Time     `gorm:"column:started_at" json:"startedAt,omitempty"`
	CompletedAt *time.Time    `gorm:"column:completed_at" json:"completedAt,omitempty"`
	Error       *string        `gorm:"type:text" json:"error,omitempty"`
	CreatedAt   time.Time      `gorm:"column:created_at" json:"createdAt"`
	UpdatedAt   time.Time      `gorm:"column:updated_at" json:"updatedAt"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}