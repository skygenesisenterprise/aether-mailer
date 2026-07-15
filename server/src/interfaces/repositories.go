package interfaces

import (
	"context"
	"time"

	"github.com/skygenesisenterprise/aether-account/server/src/models"
)

type UserRepository interface {
	Create(ctx context.Context, user *models.User) error
	GetByID(ctx context.Context, id string) (*models.User, error)
	GetByEmail(ctx context.Context, email string) (*models.User, error)
	ListStale(ctx context.Context, before time.Time, limit int) ([]models.User, error)
	Update(ctx context.Context, user *models.User) error
}

type UserSettingsRepository interface {
	GetByUserID(ctx context.Context, userID string) (*models.UserSettings, error)
	Upsert(ctx context.Context, settings *models.UserSettings) error
}

type NotificationPreferenceRepository interface {
	GetByUserID(ctx context.Context, userID string) (*models.NotificationPreference, error)
	Upsert(ctx context.Context, preference *models.NotificationPreference) error
}

type LocalCredentialRepository interface {
	Create(ctx context.Context, credential *models.LocalCredential) error
	GetByUserID(ctx context.Context, userID string) (*models.LocalCredential, error)
	Update(ctx context.Context, credential *models.LocalCredential) error
}

type AuthSessionRepository interface {
	Create(ctx context.Context, session *models.AuthSession) error
	GetByID(ctx context.Context, id string) (*models.AuthSession, error)
	ListActiveByUser(ctx context.Context, userID string, now time.Time) ([]models.AuthSession, error)
	ListByUser(ctx context.Context, userID string) ([]models.AuthSession, error)
	Update(ctx context.Context, session *models.AuthSession) error
	Revoke(ctx context.Context, id string, reason string, revokedAt time.Time) error
	RevokeAllByUser(ctx context.Context, userID string, reason string, revokedAt time.Time, exceptSessionID string) error
	RevokeFamily(ctx context.Context, familyID string, reason string, revokedAt time.Time) error
	DeleteExpired(ctx context.Context, before time.Time) error
}

type AuthRefreshTokenRepository interface {
	Create(ctx context.Context, token *models.AuthRefreshToken) error
	GetByHash(ctx context.Context, tokenHash string) (*models.AuthRefreshToken, error)
	GetByID(ctx context.Context, id string) (*models.AuthRefreshToken, error)
	Update(ctx context.Context, token *models.AuthRefreshToken) error
	RevokeFamily(ctx context.Context, familyID string, revokedAt time.Time) error
	DeleteExpired(ctx context.Context, before time.Time) error
}

type EmailVerificationTokenRepository interface {
	Create(ctx context.Context, token *models.EmailVerificationToken) error
	GetByHash(ctx context.Context, tokenHash string) (*models.EmailVerificationToken, error)
	Update(ctx context.Context, token *models.EmailVerificationToken) error
	DeleteExpired(ctx context.Context, before time.Time) error
}

type PasswordResetTokenRepository interface {
	Create(ctx context.Context, token *models.PasswordResetToken) error
	GetByHash(ctx context.Context, tokenHash string) (*models.PasswordResetToken, error)
	Update(ctx context.Context, token *models.PasswordResetToken) error
	DeleteExpired(ctx context.Context, before time.Time) error
}

type AuthAuditEventRepository interface {
	Create(ctx context.Context, event *models.AuthAuditEvent) error
}

type WorkspaceRepository interface {
	Create(ctx context.Context, workspace *models.Workspace) error
	ListByUser(ctx context.Context, userID string) ([]models.Workspace, error)
	GetByID(ctx context.Context, id string) (*models.Workspace, error)
	Update(ctx context.Context, workspace *models.Workspace) error
	Archive(ctx context.Context, id string, archivedAt time.Time) error
}

type WorkspaceMemberRepository interface {
	Create(ctx context.Context, member *models.WorkspaceMember) error
	Get(ctx context.Context, workspaceID, userID string) (*models.WorkspaceMember, error)
	ListByWorkspace(ctx context.Context, workspaceID string) ([]models.WorkspaceMember, error)
	Update(ctx context.Context, member *models.WorkspaceMember) error
	Delete(ctx context.Context, workspaceID, userID string) error
}

type AuthAccountRepository interface {
	Create(ctx context.Context, account *models.AuthAccount) error
	GetByProvider(ctx context.Context, provider, providerAccountID string) (*models.AuthAccount, error)
	ListByUserID(ctx context.Context, userID string) ([]models.AuthAccount, error)
	GetByUserIDAndProvider(ctx context.Context, userID, provider string) (*models.AuthAccount, error)
	Update(ctx context.Context, account *models.AuthAccount) error
	Delete(ctx context.Context, id string) error
}

type RepositorySet interface {
	Users() UserRepository
	UserSettings() UserSettingsRepository
	NotificationPreferences() NotificationPreferenceRepository
	LocalCredentials() LocalCredentialRepository
	AuthSessions() AuthSessionRepository
	AuthRefreshTokens() AuthRefreshTokenRepository
	EmailVerificationTokens() EmailVerificationTokenRepository
	PasswordResetTokens() PasswordResetTokenRepository
	AuthAuditEvents() AuthAuditEventRepository
	AuthAccounts() AuthAccountRepository
	Workspaces() WorkspaceRepository
	WorkspaceMembers() WorkspaceMemberRepository
}
