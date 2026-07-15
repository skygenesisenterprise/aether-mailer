package services

import (
	"context"
	"errors"
	"time"

	"github.com/skygenesisenterprise/aether-account/server/src/interfaces"
	"github.com/skygenesisenterprise/aether-account/server/src/models"
	"github.com/skygenesisenterprise/aether-account/server/src/utils"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type Repositories struct {
	db *gorm.DB
}

func NewRepositories(db *gorm.DB) *Repositories {
	return &Repositories{db: db}
}

func (r *Repositories) Users() interfaces.UserRepository { return &userRepository{db: r.db} }
func (r *Repositories) UserSettings() interfaces.UserSettingsRepository {
	return &userSettingsRepository{db: r.db}
}
func (r *Repositories) NotificationPreferences() interfaces.NotificationPreferenceRepository {
	return &notificationPreferenceRepository{db: r.db}
}
func (r *Repositories) LocalCredentials() interfaces.LocalCredentialRepository {
	return &localCredentialRepository{db: r.db}
}
func (r *Repositories) AuthSessions() interfaces.AuthSessionRepository {
	return &authSessionRepository{db: r.db}
}
func (r *Repositories) AuthRefreshTokens() interfaces.AuthRefreshTokenRepository {
	return &authRefreshTokenRepository{db: r.db}
}
func (r *Repositories) EmailVerificationTokens() interfaces.EmailVerificationTokenRepository {
	return &emailVerificationTokenRepository{db: r.db}
}
func (r *Repositories) PasswordResetTokens() interfaces.PasswordResetTokenRepository {
	return &passwordResetTokenRepository{db: r.db}
}
func (r *Repositories) AuthAuditEvents() interfaces.AuthAuditEventRepository {
	return &authAuditEventRepository{db: r.db}
}
func (r *Repositories) AuthAccounts() interfaces.AuthAccountRepository {
	return &authAccountRepository{db: r.db}
}
func (r *Repositories) Workspaces() interfaces.WorkspaceRepository {
	return &workspaceRepository{db: r.db}
}
func (r *Repositories) WorkspaceMembers() interfaces.WorkspaceMemberRepository {
	return &workspaceMemberRepository{db: r.db}
}
func (r *Repositories) WithDB(db *gorm.DB) *Repositories { return &Repositories{db: db} }

type userRepository struct{ db *gorm.DB }

func (r *userRepository) Create(ctx context.Context, user *models.User) error {
	return r.db.WithContext(ctx).Create(user).Error
}
func (r *userRepository) GetByID(ctx context.Context, id string) (*models.User, error) {
	var user models.User
	err := r.db.WithContext(ctx).First(&user, "id = ?", id).Error
	return &user, normalizeNotFound(err, utils.NewError(404, "USER_NOT_FOUND", "The requested user was not found.", nil))
}
func (r *userRepository) GetByEmail(ctx context.Context, email string) (*models.User, error) {
	var user models.User
	err := r.db.WithContext(ctx).First(&user, "email_normalized = ? OR email = ?", email, email).Error
	return &user, normalizeNotFound(err, utils.NewError(404, "USER_NOT_FOUND", "The requested user was not found.", nil))
}
func (r *userRepository) ListStale(ctx context.Context, before time.Time, limit int) ([]models.User, error) {
	var items []models.User
	err := r.db.WithContext(ctx).
		Where("last_seen_at IS NOT NULL AND last_seen_at < ? AND presence_status <> ?", before, "offline").
		Order("last_seen_at asc").
		Limit(limit).
		Find(&items).Error
	return items, err
}
func (r *userRepository) Update(ctx context.Context, user *models.User) error {
	return r.db.WithContext(ctx).Save(user).Error
}

type userSettingsRepository struct{ db *gorm.DB }

func (r *userSettingsRepository) GetByUserID(ctx context.Context, userID string) (*models.UserSettings, error) {
	var item models.UserSettings
	err := r.db.WithContext(ctx).First(&item, "user_id = ?", userID).Error
	return &item, normalizeNotFound(err, utils.NewError(404, "USER_SETTINGS_NOT_FOUND", "The requested user settings were not found.", nil))
}

func (r *userSettingsRepository) Upsert(ctx context.Context, settings *models.UserSettings) error {
	return r.db.WithContext(ctx).Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "user_id"}},
		UpdateAll: true,
	}).Create(settings).Error
}

type notificationPreferenceRepository struct{ db *gorm.DB }

func (r *notificationPreferenceRepository) GetByUserID(ctx context.Context, userID string) (*models.NotificationPreference, error) {
	var item models.NotificationPreference
	err := r.db.WithContext(ctx).First(&item, "user_id = ?", userID).Error
	return &item, normalizeNotFound(err, utils.NewError(404, "NOTIFICATION_PREFERENCES_NOT_FOUND", "The requested notification preferences were not found.", nil))
}

func (r *notificationPreferenceRepository) Upsert(ctx context.Context, preference *models.NotificationPreference) error {
	return r.db.WithContext(ctx).Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "user_id"}},
		UpdateAll: true,
	}).Create(preference).Error
}

type localCredentialRepository struct{ db *gorm.DB }

func (r *localCredentialRepository) Create(ctx context.Context, credential *models.LocalCredential) error {
	return r.db.WithContext(ctx).Create(credential).Error
}

func (r *localCredentialRepository) GetByUserID(ctx context.Context, userID string) (*models.LocalCredential, error) {
	var credential models.LocalCredential
	err := r.db.WithContext(ctx).First(&credential, "user_id = ?", userID).Error
	return &credential, normalizeNotFound(err, utils.NewError(404, "LOCAL_CREDENTIAL_NOT_FOUND", "The requested credential was not found.", nil))
}

func (r *localCredentialRepository) Update(ctx context.Context, credential *models.LocalCredential) error {
	return r.db.WithContext(ctx).Save(credential).Error
}

type authSessionRepository struct{ db *gorm.DB }

func (r *authSessionRepository) Create(ctx context.Context, session *models.AuthSession) error {
	return r.db.WithContext(ctx).Create(session).Error
}

func (r *authSessionRepository) GetByID(ctx context.Context, id string) (*models.AuthSession, error) {
	var session models.AuthSession
	err := r.db.WithContext(ctx).First(&session, "id = ?", id).Error
	return &session, normalizeNotFound(err, utils.NewError(404, "AUTH_SESSION_NOT_FOUND", "The requested session was not found.", nil))
}

func (r *authSessionRepository) ListActiveByUser(ctx context.Context, userID string, now time.Time) ([]models.AuthSession, error) {
	var items []models.AuthSession
	err := r.db.WithContext(ctx).
		Where("user_id = ? AND revoked_at IS NULL AND expires_at > ?", userID, now).
		Order("created_at desc").
		Find(&items).Error
	return items, err
}

func (r *authSessionRepository) ListByUser(ctx context.Context, userID string) ([]models.AuthSession, error) {
	var items []models.AuthSession
	err := r.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("created_at desc").
		Find(&items).Error
	return items, err
}

func (r *authSessionRepository) Update(ctx context.Context, session *models.AuthSession) error {
	return r.db.WithContext(ctx).Save(session).Error
}

func (r *authSessionRepository) Revoke(ctx context.Context, id string, reason string, revokedAt time.Time) error {
	return r.db.WithContext(ctx).Model(&models.AuthSession{}).Where("id = ? AND revoked_at IS NULL", id).Updates(map[string]any{
		"revoked_at":        revokedAt,
		"revocation_reason": reason,
		"updated_at":        revokedAt,
	}).Error
}

func (r *authSessionRepository) RevokeAllByUser(ctx context.Context, userID string, reason string, revokedAt time.Time, exceptSessionID string) error {
	query := r.db.WithContext(ctx).Model(&models.AuthSession{}).Where("user_id = ? AND revoked_at IS NULL", userID)
	if exceptSessionID != "" {
		query = query.Where("id <> ?", exceptSessionID)
	}
	return query.Updates(map[string]any{
		"revoked_at":        revokedAt,
		"revocation_reason": reason,
		"updated_at":        revokedAt,
	}).Error
}

func (r *authSessionRepository) RevokeFamily(ctx context.Context, familyID string, reason string, revokedAt time.Time) error {
	return r.db.WithContext(ctx).Model(&models.AuthSession{}).Where("refresh_token_family_id = ? AND revoked_at IS NULL", familyID).Updates(map[string]any{
		"revoked_at":        revokedAt,
		"revocation_reason": reason,
		"updated_at":        revokedAt,
	}).Error
}

func (r *authSessionRepository) DeleteExpired(ctx context.Context, before time.Time) error {
	return r.db.WithContext(ctx).Where("expires_at < ?", before).Delete(&models.AuthSession{}).Error
}

type authRefreshTokenRepository struct{ db *gorm.DB }

func (r *authRefreshTokenRepository) Create(ctx context.Context, token *models.AuthRefreshToken) error {
	return r.db.WithContext(ctx).Create(token).Error
}

func (r *authRefreshTokenRepository) GetByHash(ctx context.Context, tokenHash string) (*models.AuthRefreshToken, error) {
	var token models.AuthRefreshToken
	err := r.db.WithContext(ctx).First(&token, "token_hash = ?", tokenHash).Error
	return &token, normalizeNotFound(err, utils.NewError(404, "REFRESH_TOKEN_NOT_FOUND", "The requested refresh token was not found.", nil))
}

func (r *authRefreshTokenRepository) GetByID(ctx context.Context, id string) (*models.AuthRefreshToken, error) {
	var token models.AuthRefreshToken
	err := r.db.WithContext(ctx).First(&token, "id = ?", id).Error
	return &token, normalizeNotFound(err, utils.NewError(404, "REFRESH_TOKEN_NOT_FOUND", "The requested refresh token was not found.", nil))
}

func (r *authRefreshTokenRepository) Update(ctx context.Context, token *models.AuthRefreshToken) error {
	return r.db.WithContext(ctx).Save(token).Error
}

func (r *authRefreshTokenRepository) RevokeFamily(ctx context.Context, familyID string, revokedAt time.Time) error {
	return r.db.WithContext(ctx).Model(&models.AuthRefreshToken{}).Where("family_id = ? AND revoked_at IS NULL", familyID).Updates(map[string]any{
		"revoked_at": revokedAt,
		"updated_at": revokedAt,
	}).Error
}

func (r *authRefreshTokenRepository) DeleteExpired(ctx context.Context, before time.Time) error {
	return r.db.WithContext(ctx).Where("expires_at < ?", before).Delete(&models.AuthRefreshToken{}).Error
}

type emailVerificationTokenRepository struct{ db *gorm.DB }

func (r *emailVerificationTokenRepository) Create(ctx context.Context, token *models.EmailVerificationToken) error {
	return r.db.WithContext(ctx).Create(token).Error
}

func (r *emailVerificationTokenRepository) GetByHash(ctx context.Context, tokenHash string) (*models.EmailVerificationToken, error) {
	var token models.EmailVerificationToken
	err := r.db.WithContext(ctx).First(&token, "token_hash = ?", tokenHash).Error
	return &token, normalizeNotFound(err, utils.NewError(404, "EMAIL_VERIFICATION_TOKEN_NOT_FOUND", "The requested email verification token was not found.", nil))
}

func (r *emailVerificationTokenRepository) Update(ctx context.Context, token *models.EmailVerificationToken) error {
	return r.db.WithContext(ctx).Save(token).Error
}

func (r *emailVerificationTokenRepository) DeleteExpired(ctx context.Context, before time.Time) error {
	return r.db.WithContext(ctx).Where("expires_at < ?", before).Delete(&models.EmailVerificationToken{}).Error
}

type passwordResetTokenRepository struct{ db *gorm.DB }

func (r *passwordResetTokenRepository) Create(ctx context.Context, token *models.PasswordResetToken) error {
	return r.db.WithContext(ctx).Create(token).Error
}

func (r *passwordResetTokenRepository) GetByHash(ctx context.Context, tokenHash string) (*models.PasswordResetToken, error) {
	var token models.PasswordResetToken
	err := r.db.WithContext(ctx).First(&token, "token_hash = ?", tokenHash).Error
	return &token, normalizeNotFound(err, utils.NewError(404, "PASSWORD_RESET_TOKEN_NOT_FOUND", "The requested password reset token was not found.", nil))
}

func (r *passwordResetTokenRepository) Update(ctx context.Context, token *models.PasswordResetToken) error {
	return r.db.WithContext(ctx).Save(token).Error
}

func (r *passwordResetTokenRepository) DeleteExpired(ctx context.Context, before time.Time) error {
	return r.db.WithContext(ctx).Where("expires_at < ?", before).Delete(&models.PasswordResetToken{}).Error
}

type authAuditEventRepository struct{ db *gorm.DB }

func (r *authAuditEventRepository) Create(ctx context.Context, event *models.AuthAuditEvent) error {
	return r.db.WithContext(ctx).Create(event).Error
}

type workspaceRepository struct{ db *gorm.DB }

func (r *workspaceRepository) Create(ctx context.Context, workspace *models.Workspace) error {
	return r.db.WithContext(ctx).Create(workspace).Error
}
func (r *workspaceRepository) ListByUser(ctx context.Context, userID string) ([]models.Workspace, error) {
	var items []models.Workspace
	err := r.db.WithContext(ctx).
		Table("workspaces").
		Joins("left join workspace_members on workspace_members.workspace_id = workspaces.id").
		Where("(workspace_members.user_id = ? OR workspaces.owner_id = ?) AND workspaces.archived_at IS NULL", userID, userID).
		Distinct("workspaces.id, workspaces.created_at, workspaces.updated_at, workspaces.name, workspaces.slug, workspaces.description, workspaces.visibility, workspaces.owner_id, workspaces.archived_at").
		Order("workspaces.created_at asc").
		Scan(&items).Error
	return items, err
}
func (r *workspaceRepository) GetByID(ctx context.Context, id string) (*models.Workspace, error) {
	var item models.Workspace
	err := r.db.WithContext(ctx).First(&item, "id = ?", id).Error
	return &item, normalizeNotFound(err, utils.ErrWorkspaceNotFound)
}
func (r *workspaceRepository) Update(ctx context.Context, workspace *models.Workspace) error {
	return r.db.WithContext(ctx).Save(workspace).Error
}
func (r *workspaceRepository) Archive(ctx context.Context, id string, archivedAt time.Time) error {
	return r.db.WithContext(ctx).Model(&models.Workspace{}).Where("id = ?", id).Update("archived_at", archivedAt).Error
}

type workspaceMemberRepository struct{ db *gorm.DB }

func (r *workspaceMemberRepository) Create(ctx context.Context, member *models.WorkspaceMember) error {
	return r.db.WithContext(ctx).Create(member).Error
}
func (r *workspaceMemberRepository) Get(ctx context.Context, workspaceID, userID string) (*models.WorkspaceMember, error) {
	var item models.WorkspaceMember
	err := r.db.WithContext(ctx).First(&item, "workspace_id = ? AND user_id = ?", workspaceID, userID).Error
	return &item, normalizeNotFound(err, utils.ErrMembershipRequired)
}
func (r *workspaceMemberRepository) ListByWorkspace(ctx context.Context, workspaceID string) ([]models.WorkspaceMember, error) {
	var items []models.WorkspaceMember
	err := r.db.WithContext(ctx).Where("workspace_id = ?", workspaceID).Order("joined_at asc").Find(&items).Error
	return items, err
}
func (r *workspaceMemberRepository) Update(ctx context.Context, member *models.WorkspaceMember) error {
	return r.db.WithContext(ctx).Save(member).Error
}
func (r *workspaceMemberRepository) Delete(ctx context.Context, workspaceID, userID string) error {
	return r.db.WithContext(ctx).Delete(&models.WorkspaceMember{}, "workspace_id = ? AND user_id = ?", workspaceID, userID).Error
}

type authAccountRepository struct{ db *gorm.DB }

func (r *authAccountRepository) Create(ctx context.Context, account *models.AuthAccount) error {
	return r.db.WithContext(ctx).Create(account).Error
}

func (r *authAccountRepository) GetByProvider(ctx context.Context, provider, providerAccountID string) (*models.AuthAccount, error) {
	var account models.AuthAccount
	err := r.db.WithContext(ctx).Where("provider = ? AND provider_account_id = ?", provider, providerAccountID).First(&account).Error
	return &account, normalizeNotFound(err, utils.NewError(404, "OAUTH_ACCOUNT_NOT_FOUND", "The OAuth account was not found.", nil))
}

func (r *authAccountRepository) ListByUserID(ctx context.Context, userID string) ([]models.AuthAccount, error) {
	var items []models.AuthAccount
	err := r.db.WithContext(ctx).Where("user_id = ?", userID).Find(&items).Error
	return items, err
}

func (r *authAccountRepository) GetByUserIDAndProvider(ctx context.Context, userID, provider string) (*models.AuthAccount, error) {
	var account models.AuthAccount
	err := r.db.WithContext(ctx).Where("user_id = ? AND provider = ?", userID, provider).First(&account).Error
	return &account, normalizeNotFound(err, utils.NewError(404, "OAUTH_ACCOUNT_NOT_FOUND", "The OAuth account was not found.", nil))
}

func (r *authAccountRepository) Update(ctx context.Context, account *models.AuthAccount) error {
	return r.db.WithContext(ctx).Save(account).Error
}

func (r *authAccountRepository) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Delete(&models.AuthAccount{}, "id = ?", id).Error
}

func normalizeNotFound(err error, notFound error) error {
	if err == nil {
		return nil
	}
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return notFound
	}
	return err
}
