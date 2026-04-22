package models

import (
	"time"
)

type TlsReport struct {
	ID          string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	PeriodStart time.Time `gorm:"column:period_start;not null" json:"periodStart"`
	PeriodEnd   time.Time `gorm:"column:period_end;not null" json:"periodEnd"`
	Domain      string    `gorm:"size:255;not null" json:"domain"`
	ReportID    string    `gorm:"size:255;not null" json:"reportId"`
	Policy      string    `gorm:"size:50;not null" json:"policy"` // none, optional, mandatory
	Summary     interface{} `gorm:"type:jsonb" json:"summary,omitempty"`
	CreatedAt   time.Time  `gorm:"column:created_at" json:"createdAt"`
}