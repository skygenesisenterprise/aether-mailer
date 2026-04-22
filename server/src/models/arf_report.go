package models

import (
	"time"
)

type ArfReport struct {
	ID          string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	PeriodStart time.Time `gorm:"column:period_start;not null" json:"periodStart"`
	PeriodEnd   time.Time `gorm:"column:period_end;not null" json:"periodEnd"`
	SourceIP    string    `gorm:"size:100;not null" json:"sourceIp"`
	Reporter   *string   `gorm:"size:255" json:"reporter,omitempty"`
	Type       *string   `gorm:"size:100" json:"type,omitempty"` // abuse, fraud, virus
	Feedback   *string   `gorm:"type:text" json:"feedback,omitempty"`
	CreatedAt  time.Time `gorm:"column:created_at" json:"createdAt"`
}