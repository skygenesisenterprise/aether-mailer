package models

import (
	"time"

	"gorm.io/gorm"
)

type Action struct {
	ID          string         `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Name        string         `gorm:"size:255;not null" json:"name"`
	DisplayName *string        `gorm:"size:255" json:"displayName,omitempty"`
	Description *string        `gorm:"size:500" json:"description,omitempty"`
	Code        *string        `gorm:"type:text" json:"code,omitempty"`
	Runtime     string         `gorm:"size:50;not null;default:'nodejs'" json:"runtime"` // nodejs, python, go
	Version     int            `gorm:"default:1" json:"version"`
	Status      string         `gorm:"size:50;default:'draft'" json:"status"` // draft, deployed, archived
	DeployedAt  *time.Time     `gorm:"column:deployed_at" json:"deployedAt,omitempty"`
	Secrets     []string       `gorm:"type:text[]" json:"secrets,omitempty"`
	CreatedAt   time.Time      `gorm:"column:created_at" json:"createdAt"`
	UpdatedAt   time.Time      `gorm:"column:updated_at" json:"updatedAt"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

type ActionTrigger struct {
	ID          string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Name        string    `gorm:"size:255;not null;uniqueIndex" json:"name"`
	DisplayName string    `gorm:"size:255" json:"displayName"`
	Description *string   `gorm:"size:500" json:"description,omitempty"`
	CreatedAt   time.Time `gorm:"column:created_at" json:"createdAt"`
}

type ActionTriggerBinding struct {
	ID        string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	ActionID  string    `gorm:"type:uuid;not null;column:action_id" json:"actionId"`
	TriggerID string    `gorm:"type:uuid;not null;column:trigger_id" json:"triggerId"`
	Order     int       `gorm:"default:0" json:"order"`
	IsEnabled bool      `gorm:"default:true;column:is_enabled" json:"isEnabled"`
	CreatedAt time.Time `gorm:"column:created_at" json:"createdAt"`
	UpdatedAt time.Time `gorm:"column:updated_at" json:"updatedAt"`
}

type ActionLibraryItem struct {
	ID          string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Name        string    `gorm:"size:255;not null" json:"name"`
	DisplayName *string   `gorm:"size:255" json:"displayName,omitempty"`
	Description *string   `gorm:"size:500" json:"description,omitempty"`
	Code        *string   `gorm:"type:text" json:"code,omitempty"`
	Runtime     string    `gorm:"size:50;default:'nodejs'" json:"runtime"`
	Version     int       `gorm:"default:1" json:"version"`
	Category    *string   `gorm:"size:100" json:"category,omitempty"`
	IsBuiltIn   bool      `gorm:"default:false;column:is_built_in" json:"isBuiltIn"`
	CreatedAt   time.Time `gorm:"column:created_at" json:"createdAt"`
	UpdatedAt   time.Time `gorm:"column:updated_at" json:"updatedAt"`
}

type FormAction struct {
	ID          string      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Name        string      `gorm:"size:255;not null" json:"name"`
	DisplayName *string     `gorm:"size:255" json:"displayName,omitempty"`
	FormFields  interface{} `gorm:"type:jsonb;column:form_fields" json:"formFields,omitempty"`
	ActionCode  *string     `gorm:"type:text;column:action_code" json:"actionCode,omitempty"`
	IsEnabled   bool        `gorm:"default:true;column:is_enabled" json:"isEnabled"`
	CreatedAt   time.Time   `gorm:"column:created_at" json:"createdAt"`
	UpdatedAt   time.Time   `gorm:"column:updated_at" json:"updatedAt"`
}

type ActionLog struct {
	ID        string      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	ActionID  string      `gorm:"type:uuid;column:action_id;index" json:"actionId"`
	TriggerID *string     `gorm:"type:uuid;column:trigger_id" json:"triggerId,omitempty"`
	Status    string      `gorm:"size:50" json:"status"` // started, success, failed
	StartTime time.Time   `gorm:"column:start_time" json:"startTime"`
	EndTime   *time.Time  `gorm:"column:end_time" json:"endTime,omitempty"`
	Duration  *int        `gorm:"column:duration_ms" json:"durationMs,omitempty"`
	Error     *string     `gorm:"type:text" json:"error,omitempty"`
	Input     interface{} `gorm:"type:jsonb" json:"input,omitempty"`
	Output    interface{} `gorm:"type:jsonb" json:"output,omitempty"`
	CreatedAt time.Time   `gorm:"column:created_at" json:"createdAt"`
}
