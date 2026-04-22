package interfaces

import (
	"context"
	"database/sql"
	"time"

	"gorm.io/gorm"
)

// DatabaseStats représente les statistiques de la base de données
type DatabaseStats struct {
	TotalConnections   int       `json:"totalConnections"`
	ActiveConnections  int       `json:"activeConnections"`
	IdleConnections    int       `json:"idleConnections"`
	WaitCount          int64     `json:"waitCount"`
	WaitDuration       int64     `json:"waitDuration"`
	MaxOpenConnections int       `json:"maxOpenConnections"`
	LastPingTime       time.Time `json:"lastPingTime"`
	PingResponseTime   int64     `json:"pingResponseTime"`
}

// TableInfo représente les informations d'une table
type TableInfo struct {
	Name        string    `json:"name"`
	RowCount    int64     `json:"rowCount"`
	SizeBytes   int64     `json:"sizeBytes"`
	LastVacuum  time.Time `json:"lastVacuum,omitempty"`
	LastAnalyze time.Time `json:"lastAnalyze,omitempty"`
}

// DatabaseHealth représente l'état de santé de la base de données
type DatabaseHealth struct {
	Status       string    `json:"status"` // healthy, degraded, unhealthy
	Version      string    `json:"version"`
	DatabaseName string    `json:"databaseName"`
	Connected    bool      `json:"connected"`
	LatencyMs    int64     `json:"latencyMs"`
	LastChecked  time.Time `json:"lastChecked"`
	ErrorMessage string    `json:"errorMessage,omitempty"`
}

// IDatabaseService définit l'interface pour les opérations de base de données
type IDatabaseService interface {
	// Core database operations
	GetDB() *gorm.DB
	GetSQLDB() (*sql.DB, error)
	Ping(ctx context.Context) error
	Close() error

	// Statistics and monitoring
	GetStats(ctx context.Context) (*DatabaseStats, error)
	GetHealth(ctx context.Context) (*DatabaseHealth, error)

	// Schema operations
	AutoMigrate(models ...interface{}) error
	GetTables(ctx context.Context) ([]TableInfo, error)
	GetTableSchema(ctx context.Context, tableName string) (map[string]interface{}, error)

	// Maintenance operations
	Vacuum(ctx context.Context, tableName string) error
	Analyze(ctx context.Context, tableName string) error
	Reindex(ctx context.Context, tableName string) error
}

// DatabaseServiceKey est la clé utilisée pour stocker le service dans le contexte
type DatabaseServiceKey struct{}
