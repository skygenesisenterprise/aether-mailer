package models

import "time"

type Common struct {
	ID        string    `gorm:"type:text;primaryKey" json:"id"`
	CreatedAt time.Time `gorm:"not null" json:"createdAt"`
	UpdatedAt time.Time `gorm:"not null" json:"updatedAt"`
}

type Archivable struct {
	ArchivedAt *time.Time `json:"archivedAt,omitempty"`
}
