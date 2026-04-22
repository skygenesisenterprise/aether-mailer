package models

import (
	"time"
)

type DmarcReport struct {
	ID           string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	PeriodStart  time.Time `gorm:"column:period_start;not null" json:"periodStart"`
	PeriodEnd    time.Time `gorm:"column:period_end;not null" json:"periodEnd"`
	Domain       string    `gorm:"size:255;not null" json:"domain"`
	ReportID     string    `gorm:"size:255;not null" json:"reportId"`
	ReportOrg    *string   `gorm:"size:255" json:"reportOrg,omitempty"`
	Policy       string    `gorm:"size:50;not null" json:"policy"` // none, quarantine, reject
	Alignment    *string   `gorm:"size:50" json:"alignment,omitempty"` // relaxed, strict
	Disposition  *string   `gorm:"size:50" json:"disposition,omitempty"` // none, quarantine, reject
	ReportXML    *string   `gorm:"type:text" json:"reportXml,omitempty"`
	SourceIP     *string   `gorm:"size:100" json:"sourceIp,omitempty"`
	Count        int       `gorm:"default:0" json:"count"`
	CreatedAt   time.Time `gorm:"column:created_at" json:"createdAt"`
}