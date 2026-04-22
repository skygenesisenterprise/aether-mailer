package models

import "time"

type LogLevel string

const (
	LogLevelDebug LogLevel = "debug"
	LogLevelInfo  LogLevel = "info"
	LogLevelWarn  LogLevel = "warn"
	LogLevelError LogLevel = "error"
)

type Log struct {
	ID         string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Level      LogLevel  `gorm:"type:varchar(20);not null" json:"level"`
	Event      string    `gorm:"size:100;not null" json:"event"`
	Message    string    `gorm:"type:text;not null" json:"message"`
	Details    *string   `gorm:"type:text" json:"details,omitempty"`
	UserEmail  *string   `gorm:"size:255;column:user_email" json:"userEmail,omitempty"`
	UserID     *string   `gorm:"type:uuid;column:user_id" json:"userId,omitempty"`
	IPAddress  *string   `gorm:"size:45;column:ip_address" json:"ipAddress,omitempty"`
	Connection *string   `gorm:"size:100" json:"connection,omitempty"`
	Location   *string   `gorm:"size:255" json:"location,omitempty"`
	UserAgent  *string   `gorm:"size:500;column:user_agent" json:"userAgent,omitempty"`
	CreatedAt  time.Time `gorm:"column:created_at" json:"createdAt"`
}

type LogStats struct {
	ID         string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Date       time.Time `gorm:"type:date;not null" json:"date"`
	TotalCount int       `gorm:"default:0;column:total_count" json:"totalCount"`
	ErrorCount int       `gorm:"default:0;column:error_count" json:"errorCount"`
	WarnCount  int       `gorm:"default:0;column:warn_count" json:"warnCount"`
	InfoCount  int       `gorm:"default:0;column:info_count" json:"infoCount"`
}

type MonitoringStatus struct {
	ID        string     `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Service   string     `gorm:"size:100;not null" json:"service"`
	Status    string     `gorm:"size:50;not null" json:"status"` // healthy, degraded, down
	IsEnabled bool       `gorm:"default:true;column:is_enabled" json:"isEnabled"`
	LastCheck *time.Time `gorm:"column:last_check" json:"lastCheck,omitempty"`
	Details   *string    `gorm:"type:text" json:"details,omitempty"`
	UpdatedAt time.Time  `gorm:"column:updated_at" json:"updatedAt"`
}

type HealthMetrics struct {
	ID                string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Date              time.Time `gorm:"type:date;not null" json:"date"`
	CPUUsage          float64   `gorm:"default:0;column:cpu_usage" json:"cpuUsage"`
	MemoryUsage       float64   `gorm:"default:0;column:memory_usage" json:"memoryUsage"`
	DiskUsage         float64   `gorm:"default:0;column:disk_usage" json:"diskUsage"`
	ResponseTime      *float64  `gorm:"column:response_time" json:"responseTime,omitempty"`
	RequestCount      int       `gorm:"default:0;column:request_count" json:"requestCount"`
	ActiveConnections int       `gorm:"default:0;column:active_connections" json:"activeConnections"`
}
