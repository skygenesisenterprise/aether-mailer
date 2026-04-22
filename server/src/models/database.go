package models

import (
	"gorm.io/gorm"
	"time"
)

// DatabaseInfo représente les informations sur la base de données
type DatabaseInfo struct {
	DatabaseName string `json:"databaseName"`
	Version      string `json:"version"`
	Host         string `json:"host"`
	Port         int    `json:"port"`
	Status       string `json:"status"`
}

// DatabaseStats représente les statistiques de la base de données
type DatabaseStats struct {
	TotalUsers         int64 `json:"totalUsers"`
	ActiveUsers        int64 `json:"activeUsers"`
	InactiveUsers      int64 `json:"inactiveUsers"`
	TotalTokens        int64 `json:"totalTokens"`
	ActiveTokens       int64 `json:"activeTokens"`
	RevokedTokens      int64 `json:"revokedTokens"`
	EmailVerifications int64 `json:"emailVerifications"`
	PasswordResets     int64 `json:"passwordResets"`
	LastUpdated        int64 `json:"lastUpdated"`
}

// DatabaseTable représente une table de la base de données
type DatabaseTable struct {
	TableName    string `json:"tableName"`
	RowCount     int64  `json:"rowCount"`
	TableSize    int64  `json:"tableSize"`
	LastAccessed int64  `json:"lastAccessed"`
}

// DatabaseBackup représente une sauvegarde de la base de données
type DatabaseBackup struct {
	gorm.Model
	FileName     string     `gorm:"size:255;not null" json:"fileName"`
	FilePath     string     `gorm:"size:500;not null" json:"filePath"`
	FileSize     int64      `json:"fileSize"`
	BackupType   string     `gorm:"size:50;not null" json:"backupType"`    // full, incremental
	Status       string     `gorm:"size:20;default:pending" json:"status"` // pending, completed, failed
	ErrorMessage string     `gorm:"type:text" json:"errorMessage,omitempty"`
	CreatedBy    uint       `json:"createdBy"`
	CreatedAt    time.Time  `json:"createdAt"`
	CompletedAt  *time.Time `json:"completedAt,omitempty"`
}

// TableName spécifie le nom de la table
func (DatabaseBackup) TableName() string {
	return "database_backups"
}

// DatabaseConnectionLog représente un journal des connexions à la base de données
type DatabaseConnectionLog struct {
	gorm.Model
	DatabaseName  string `gorm:"size:100;not null" json:"databaseName"`
	UserName      string `gorm:"size:100;not null" json:"userName"`
	IPAddress     string `gorm:"size:45;not null" json:"ipAddress"`
	UserAgent     string `gorm:"size:500" json:"userAgent"`
	Action        string `gorm:"size:50;not null" json:"action"` // connect, disconnect, query
	Query         string `gorm:"type:text" json:"query,omitempty"`
	ExecutionTime int64  `json:"executionTime"` // en millisecondes
	Success       bool   `gorm:"default:true" json:"success"`
	ErrorMessage  string `gorm:"type:text" json:"errorMessage,omitempty"`
}

// TableName spécifie le nom de la table
func (DatabaseConnectionLog) TableName() string {
	return "database_connection_logs"
}

// DatabaseHealthCheck représente le résultat d'un health check
type DatabaseHealthCheck struct {
	gorm.Model
	DatabaseName    string    `gorm:"size:100;not null" json:"databaseName"`
	Status          string    `gorm:"size:20;not null" json:"status"` // healthy, degraded, unhealthy
	ResponseTime    int64     `json:"responseTime"`                   // en millisecondes
	ConnectionCount int       `json:"connectionCount"`
	ActiveQueries   int       `json:"activeQueries"`
	TotalQueries    int64     `json:"totalQueries"`
	ErrorRate       float64   `json:"errorRate"` // pourcentage
	Uptime          int64     `json:"uptime"`    // en secondes
	LastChecked     time.Time `json:"lastChecked"`
}

// TableName spécifie le nom de la table
func (DatabaseHealthCheck) TableName() string {
	return "database_health_checks"
}

// DatabaseRequest représente une requête pour les opérations de base de données
type DatabaseRequest struct {
	Action         string                 `json:"action" binding:"required"`
	TableName      string                 `json:"tableName,omitempty"`
	Parameters     map[string]interface{} `json:"parameters,omitempty"`
	Query          string                 `json:"query,omitempty"`
	Limit          int                    `json:"limit,omitempty"`
	Offset         int                    `json:"offset,omitempty"`
	OrderBy        string                 `json:"orderBy,omitempty"`
	OrderDirection string                 `json:"orderDirection,omitempty"`
}

// DatabaseResponse représente la réponse d'une opération de base de données
type DatabaseResponse struct {
	Success       bool                   `json:"success"`
	Message       string                 `json:"message,omitempty"`
	Data          interface{}            `json:"data,omitempty"`
	Count         int64                  `json:"count,omitempty"`
	ExecutionTime int64                  `json:"executionTime"` // en millisecondes
	Error         string                 `json:"error,omitempty"`
	Metadata      map[string]interface{} `json:"metadata,omitempty"`
}

// TableSchema représente le schéma d'une table
type TableSchema struct {
	TableName   string           `json:"tableName"`
	Columns     []ColumnInfo     `json:"columns"`
	Indexes     []IndexInfo      `json:"indexes"`
	Constraints []ConstraintInfo `json:"constraints"`
	RowCount    int64            `json:"rowCount"`
}

// ColumnInfo représente les informations d'une colonne
type ColumnInfo struct {
	Name         string `json:"name"`
	Type         string `json:"type"`
	Nullable     bool   `json:"nullable"`
	DefaultValue string `json:"defaultValue,omitempty"`
	MaxLength    int    `json:"maxLength,omitempty"`
	IsPrimaryKey bool   `json:"isPrimaryKey"`
	IsUnique     bool   `json:"isUnique"`
}

// IndexInfo représente les informations d'un index
type IndexInfo struct {
	Name      string   `json:"name"`
	Columns   []string `json:"columns"`
	IsUnique  bool     `json:"isUnique"`
	IsPrimary bool     `json:"isPrimary"`
}

// ConstraintInfo représente les informations d'une contrainte
type ConstraintInfo struct {
	Name             string   `json:"name"`
	Type             string   `json:"type"` // FOREIGN KEY, PRIMARY KEY, UNIQUE, CHECK
	Columns          []string `json:"columns"`
	ReferenceTable   string   `json:"referenceTable,omitempty"`
	ReferenceColumns []string `json:"referenceColumns,omitempty"`
}

// DatabaseMaintenanceRequest représente une requête de maintenance
type DatabaseMaintenanceRequest struct {
	Action    string                 `json:"action" binding:"required"` // vacuum, analyze, reindex, cleanup
	TableName string                 `json:"tableName,omitempty"`
	Options   map[string]interface{} `json:"options,omitempty"`
}

// DatabaseMaintenanceResponse représente la réponse d'une maintenance
type DatabaseMaintenanceResponse struct {
	Action       string                 `json:"action"`
	Success      bool                   `json:"success"`
	Message      string                 `json:"message,omitempty"`
	Duration     int64                  `json:"duration"` // en millisecondes
	RowsAffected int64                  `json:"rowsAffected,omitempty"`
	Results      map[string]interface{} `json:"results,omitempty"`
	Error        string                 `json:"error,omitempty"`
}
