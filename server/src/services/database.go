package services

import (
	"context"

	"github.com/skygenesisenterprise/aether-account/server/src/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type DatabaseService struct {
	db *gorm.DB
}

func NewDatabaseService(dsn string) (*DatabaseService, error) {
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, err
	}
	return &DatabaseService{db: db}, nil
}

func (s *DatabaseService) Gorm() *gorm.DB {
	return s.db
}

func (s *DatabaseService) Ping(ctx context.Context) error {
	sqlDB, err := s.db.DB()
	if err != nil {
		return err
	}
	return sqlDB.PingContext(ctx)
}

func (s *DatabaseService) Close() error {
	sqlDB, err := s.db.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}

func (s *DatabaseService) Transaction(ctx context.Context, fn func(tx *gorm.DB) error) error {
	return s.db.WithContext(ctx).Transaction(fn)
}

func (s *DatabaseService) AutoMigrate() error {
	if err := s.normalizeLegacyAuthSessionSchema(); err != nil {
		return err
	}

	return s.db.AutoMigrate(
		&models.User{},
		&models.UserSettings{},
		&models.NotificationPreference{},
		&models.LocalCredential{},
		&models.AuthSession{},
		&models.AuthRefreshToken{},
		&models.EmailVerificationToken{},
		&models.PasswordResetToken{},
		&models.AuthAuditEvent{},
		&models.AuthAccount{},
		&models.Workspace{},
		&models.WorkspaceMember{},
	)
}

func (s *DatabaseService) normalizeLegacyAuthSessionSchema() error {
	return s.db.Exec(`
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'auth_sessions'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'auth_sessions' AND column_name = 'refresh_token_family_id'
    ) THEN
      ALTER TABLE auth_sessions ADD COLUMN refresh_token_family_id text;
    END IF;

    UPDATE auth_sessions
    SET refresh_token_family_id = COALESCE(NULLIF(refresh_token_family_id, ''), id)
    WHERE refresh_token_family_id IS NULL OR refresh_token_family_id = '';

    ALTER TABLE auth_sessions
    ALTER COLUMN refresh_token_family_id SET DEFAULT '',
    ALTER COLUMN refresh_token_family_id SET NOT NULL;

    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'auth_sessions' AND column_name = 'last_used_at'
    ) THEN
      ALTER TABLE auth_sessions ADD COLUMN last_used_at timestamptz;
    END IF;

    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'auth_sessions' AND column_name = 'last_active_at'
    ) THEN
      UPDATE auth_sessions
      SET last_used_at = COALESCE(last_used_at, last_active_at, created_at, NOW())
      WHERE last_used_at IS NULL;
    ELSE
      UPDATE auth_sessions
      SET last_used_at = COALESCE(last_used_at, created_at, NOW())
      WHERE last_used_at IS NULL;
    END IF;

    ALTER TABLE auth_sessions
    ALTER COLUMN last_used_at SET DEFAULT NOW(),
    ALTER COLUMN last_used_at SET NOT NULL;

    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'auth_sessions' AND column_name = 'workspace_id'
    ) THEN
      ALTER TABLE auth_sessions ADD COLUMN workspace_id text;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'auth_sessions' AND column_name = 'revoked_at'
    ) THEN
      ALTER TABLE auth_sessions ADD COLUMN revoked_at timestamptz;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'auth_sessions' AND column_name = 'revocation_reason'
    ) THEN
      ALTER TABLE auth_sessions ADD COLUMN revocation_reason text;
    END IF;

    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'auth_sessions' AND column_name = 'refresh_token_hash'
    ) THEN
      UPDATE auth_sessions
      SET refresh_token_hash = COALESCE(refresh_token_hash, token_hash, id)
      WHERE refresh_token_hash IS NULL;
    END IF;
  END IF;
END $$;
`).Error
}
