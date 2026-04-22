package services

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"time"

	"github.com/skygenesisenterprise/aether-mailer/server/src/interfaces"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// databaseService implémente l'interface IDatabaseService
type databaseService struct {
	db     *gorm.DB
	sqlDB  *sql.DB
	dsn    string
	config *gorm.Config
}

// NewDatabaseService crée une nouvelle instance du service de base de données
func NewDatabaseService(dsn string) (interfaces.IDatabaseService, error) {
	config := &gorm.Config{
		Logger: logger.Default.LogMode(logger.Error),
	}

	service := &databaseService{
		dsn:    dsn,
		config: config,
	}

	if err := service.connect(); err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	return service, nil
}

// connect établit la connexion à la base de données
func (s *databaseService) connect() error {
	var err error

	s.db, err = gorm.Open(postgres.Open(s.dsn), s.config)
	if err != nil {
		return err
	}

	s.sqlDB, err = s.db.DB()
	if err != nil {
		return err
	}

	// Configuration du pool de connexions
	s.sqlDB.SetMaxIdleConns(10)
	s.sqlDB.SetMaxOpenConns(100)
	s.sqlDB.SetConnMaxLifetime(0)

	log.Println("[Database] Connected to database successfully")
	return nil
}

// GetDB retourne l'instance GORM
func (s *databaseService) GetDB() *gorm.DB {
	return s.db
}

// GetSQLDB retourne l'instance SQL native
func (s *databaseService) GetSQLDB() (*sql.DB, error) {
	if s.sqlDB == nil {
		return nil, fmt.Errorf("database connection not initialized")
	}
	return s.sqlDB, nil
}

// Ping vérifie la connexion à la base de données
func (s *databaseService) Ping(ctx context.Context) error {
	if s.sqlDB == nil {
		return fmt.Errorf("database connection not initialized")
	}

	// Utiliser le contexte avec timeout si nécessaire
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	return s.sqlDB.PingContext(ctx)
}

// Close ferme la connexion à la base de données
func (s *databaseService) Close() error {
	if s.sqlDB == nil {
		return nil
	}

	log.Println("[Database] Closing database connection...")
	return s.sqlDB.Close()
}

// GetStats retourne les statistiques de la base de données
func (s *databaseService) GetStats(ctx context.Context) (*interfaces.DatabaseStats, error) {
	if s.sqlDB == nil {
		return nil, fmt.Errorf("database connection not initialized")
	}

	stats := s.sqlDB.Stats()

	// Mesurer le temps de réponse du ping
	start := time.Now()
	if err := s.Ping(ctx); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}
	pingDuration := time.Since(start).Milliseconds()

	return &interfaces.DatabaseStats{
		TotalConnections:   stats.OpenConnections,
		ActiveConnections:  stats.InUse,
		IdleConnections:    stats.Idle,
		WaitCount:          stats.WaitCount,
		WaitDuration:       stats.WaitDuration.Milliseconds(),
		MaxOpenConnections: stats.MaxOpenConnections,
		LastPingTime:       time.Now(),
		PingResponseTime:   pingDuration,
	}, nil
}

// GetHealth retourne l'état de santé de la base de données
func (s *databaseService) GetHealth(ctx context.Context) (*interfaces.DatabaseHealth, error) {
	health := &interfaces.DatabaseHealth{
		LastChecked: time.Now(),
	}

	if s.sqlDB == nil {
		health.Status = "unhealthy"
		health.Connected = false
		health.ErrorMessage = "database connection not initialized"
		return health, nil
	}

	// Vérifier la connexion et mesurer la latence
	start := time.Now()
	err := s.Ping(ctx)
	latency := time.Since(start).Milliseconds()

	health.Connected = err == nil
	health.LatencyMs = latency

	if err != nil {
		health.Status = "unhealthy"
		health.ErrorMessage = err.Error()
		return health, nil
	}

	// Déterminer le statut basé sur la latence
	switch {
	case latency < 50:
		health.Status = "healthy"
	case latency < 200:
		health.Status = "degraded"
	default:
		health.Status = "unhealthy"
	}

	// Récupérer les informations de version et de base de données
	var version string
	var dbName string

	if err := s.db.Raw("SELECT version()").Scan(&version).Error; err == nil {
		health.Version = version
	}

	if err := s.db.Raw("SELECT current_database()").Scan(&dbName).Error; err == nil {
		health.DatabaseName = dbName
	}

	return health, nil
}

// AutoMigrate exécute l'auto-migration des modèles
func (s *databaseService) AutoMigrate(models ...interface{}) error {
	if s.db == nil {
		return fmt.Errorf("database connection not initialized")
	}
	return s.db.AutoMigrate(models...)
}

// GetTables retourne la liste des tables avec leurs informations
func (s *databaseService) GetTables(ctx context.Context) ([]interfaces.TableInfo, error) {
	if s.db == nil {
		return nil, fmt.Errorf("database connection not initialized")
	}

	var tables []interfaces.TableInfo

	// Requête pour récupérer les tables avec leur nombre de lignes
	query := `
		SELECT 
			table_name,
			COALESCE((SELECT reltuples::BIGINT FROM pg_class WHERE relname = table_name), 0) as row_count
		FROM information_schema.tables 
		WHERE table_schema = 'public' 
		AND table_type = 'BASE TABLE'
		ORDER BY table_name
	`

	rows, err := s.db.Raw(query).Rows()
	if err != nil {
		return nil, fmt.Errorf("failed to query tables: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var table interfaces.TableInfo
		if err := rows.Scan(&table.Name, &table.RowCount); err != nil {
			continue
		}
		tables = append(tables, table)
	}

	return tables, nil
}

// GetTableSchema retourne le schéma d'une table spécifique
func (s *databaseService) GetTableSchema(ctx context.Context, tableName string) (map[string]interface{}, error) {
	if s.db == nil {
		return nil, fmt.Errorf("database connection not initialized")
	}

	schema := make(map[string]interface{})

	// Récupérer les colonnes
	var columns []map[string]interface{}
	columnQuery := `
		SELECT 
			column_name,
			data_type,
			is_nullable,
			column_default,
			character_maximum_length
		FROM information_schema.columns 
		WHERE table_schema = 'public' 
		AND table_name = ?
		ORDER BY ordinal_position
	`

	if err := s.db.Raw(columnQuery, tableName).Scan(&columns).Error; err != nil {
		return nil, fmt.Errorf("failed to get columns: %w", err)
	}

	schema["columns"] = columns

	// Récupérer les contraintes
	var constraints []map[string]interface{}
	constraintQuery := `
		SELECT 
			con.conname as constraint_name,
			con.contype as constraint_type,
			att.attname as column_name
		FROM pg_constraint con
		JOIN pg_class rel ON rel.oid = con.conrelid
		JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
		LEFT JOIN pg_attribute att ON att.attrelid = con.conrelid 
			AND att.attnum = ANY(con.conkey)
		WHERE nsp.nspname = 'public'
		AND rel.relname = ?
	`

	if err := s.db.Raw(constraintQuery, tableName).Scan(&constraints).Error; err == nil {
		schema["constraints"] = constraints
	}

	return schema, nil
}

// Vacuum exécute VACUUM sur une table
func (s *databaseService) Vacuum(ctx context.Context, tableName string) error {
	if s.sqlDB == nil {
		return fmt.Errorf("database connection not initialized")
	}

	query := fmt.Sprintf("VACUUM ANALYZE %s", tableName)
	_, err := s.sqlDB.ExecContext(ctx, query)
	return err
}

// Analyze exécute ANALYZE sur une table
func (s *databaseService) Analyze(ctx context.Context, tableName string) error {
	if s.sqlDB == nil {
		return fmt.Errorf("database connection not initialized")
	}

	query := fmt.Sprintf("ANALYZE %s", tableName)
	_, err := s.sqlDB.ExecContext(ctx, query)
	return err
}

// Reindex exécute REINDEX sur une table
func (s *databaseService) Reindex(ctx context.Context, tableName string) error {
	if s.sqlDB == nil {
		return fmt.Errorf("database connection not initialized")
	}

	query := fmt.Sprintf("REINDEX TABLE %s", tableName)
	_, err := s.sqlDB.ExecContext(ctx, query)
	return err
}

// DB est l'instance globale maintenue pour la compatibilité avec le code existant
// Deprecated: Utiliser DatabaseService via le contexte ou injection de dépendances
var DB *gorm.DB

// InitDB initialise la connexion à la base de données (compatibilité legacy)
// Deprecated: Utiliser NewDatabaseService à la place
func InitDB(dsn string) error {
	service, err := NewDatabaseService(dsn)
	if err != nil {
		return err
	}

	DB = service.GetDB()
	return nil
}

// CloseDB ferme la connexion à la base de données (compatibilité legacy)
// Deprecated: Utiliser DatabaseService.Close() à la place
func CloseDB() error {
	if DB == nil {
		return nil
	}

	sqlDB, err := DB.DB()
	if err != nil {
		return err
	}

	return sqlDB.Close()
}
