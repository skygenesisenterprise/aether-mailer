package services

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"net"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/skygenesisenterprise/aether-account/server/src/config"
	"github.com/skygenesisenterprise/aether-account/server/src/interfaces"
	"github.com/skygenesisenterprise/aether-account/server/src/models"
	"github.com/skygenesisenterprise/aether-account/server/src/utils"
	"gorm.io/gorm"
)

const refreshCookiePath = "/"

type AuthService struct {
	cfg          config.AuthConfig
	db           interfaces.Database
	repos        *Repositories
	identity     interfaces.IdentityProvider
	hasher       *PasswordHasher
	limiter      *AuthRateLimiter
	workspaceSvc *WorkspaceService
}

type AuthResult struct {
	User         AuthUserDTO `json:"user"`
	AccessToken  string      `json:"accessToken"`
	ExpiresIn    int64       `json:"expiresIn"`
	RefreshToken string      `json:"refreshToken,omitempty"`
	SessionID    string      `json:"sessionId"`
}

type AuthUserDTO struct {
	ID             string   `json:"id"`
	Email          string   `json:"email"`
	DisplayName    string   `json:"displayName"`
	AvatarURL      *string  `json:"avatarUrl,omitempty"`
	Status         string   `json:"status"`
	PresenceStatus string   `json:"presenceStatus"`
	WorkspaceID    *string  `json:"workspaceId,omitempty"`
	Roles          []string `json:"roles"`
	Permissions    []string `json:"permissions"`
	CreatedAt      string   `json:"createdAt"`
	UpdatedAt      string   `json:"updatedAt"`
}

type AuthSessionDTO struct {
	ID         string `json:"id"`
	UserAgent  string `json:"userAgent,omitempty"`
	IPAddress  string `json:"ipAddress,omitempty"`
	CreatedAt  string `json:"createdAt"`
	LastUsedAt string `json:"lastUsedAt"`
	ExpiresAt  string `json:"expiresAt"`
	Current    bool   `json:"current"`
}

func NewAuthService(cfg config.AuthConfig, db interfaces.Database, repos *Repositories, identity interfaces.IdentityProvider, limiter *AuthRateLimiter, workspaceSvc *WorkspaceService) *AuthService {
	return &AuthService{
		cfg:          cfg,
		db:           db,
		repos:        repos,
		identity:     identity,
		hasher:       NewPasswordHasher(cfg),
		limiter:      limiter,
		workspaceSvc: workspaceSvc,
	}
}

func (s *AuthService) Register(ctx context.Context, req RegisterInput, meta RequestMetadata) (*AuthResult, error) {
	email, normalized := normalizeEmail(req.Email)
	if email == "" || strings.TrimSpace(req.DisplayName) == "" || len(req.Password) < s.cfg.PasswordMinLength {
		return nil, utils.ErrValidationFailed
	}
	if allowed, err := s.allow(ctx, "register", meta.IPAddress, normalized, 10, time.Hour); err != nil || !allowed {
		if err != nil {
			return nil, err
		}
		return nil, utils.NewError(http.StatusTooManyRequests, "FORBIDDEN", "Too many requests.", nil)
	}
	if _, err := s.repos.Users().GetByEmail(ctx, normalized); err == nil {
		return nil, utils.ErrEmailAlreadyExists
	}
	passwordHash, err := s.hasher.Hash(req.Password)
	if err != nil {
		return nil, utils.ErrValidationFailed
	}

	now := time.Now().UTC()
	userID := utils.NewID()
	user := &models.User{
		Common:          models.Common{ID: userID, CreatedAt: now, UpdatedAt: now},
		Email:           email,
		EmailNormalized: normalized,
		DisplayName:     strings.TrimSpace(req.DisplayName),
		Status:          "active",
		PresenceStatus:  "offline",
	}
	credential := &models.LocalCredential{
		Common:            models.Common{ID: utils.NewID(), CreatedAt: now, UpdatedAt: now},
		UserID:            userID,
		PasswordHash:      passwordHash,
		PasswordAlgorithm: "argon2id",
	}

	var workspaceID string
	err = s.db.Transaction(ctx, func(tx *gorm.DB) error {
		txRepos := s.repos.WithDB(tx)
		if err := txRepos.Users().Create(ctx, user); err != nil {
			return err
		}
		if err := txRepos.LocalCredentials().Create(ctx, credential); err != nil {
			return err
		}
		workspaceName := strings.TrimSpace(req.WorkspaceName)
		if workspaceName == "" {
			workspaceName = user.DisplayName + " Workspace"
		}
		slug := slugifyWorkspace(normalized)
		workspace := &models.Workspace{
			Common:      models.Common{ID: utils.NewID(), CreatedAt: now, UpdatedAt: now},
			Name:        workspaceName,
			Slug:        slug,
			Visibility:  "private",
			OwnerID:     userID,
			Description: "Personal workspace",
		}
		member := &models.WorkspaceMember{
			Common:      models.Common{ID: utils.NewID(), CreatedAt: now, UpdatedAt: now},
			WorkspaceID: workspace.ID,
			UserID:      userID,
			Role:        "owner",
			JoinedAt:    now,
		}
		if err := txRepos.Workspaces().Create(ctx, workspace); err != nil {
			return err
		}
		if err := txRepos.WorkspaceMembers().Create(ctx, member); err != nil {
			return err
		}
		workspaceID = workspace.ID
		return nil
	})
	if err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "duplicate") {
			return nil, utils.ErrEmailAlreadyExists
		}
		return nil, err
	}

	return s.createAuthenticatedSession(ctx, user, &workspaceID, roleToPermissions("owner"), []string{"owner"}, meta)
}

type RegisterInput struct {
	Email         string `json:"email"`
	Password      string `json:"password"`
	DisplayName   string `json:"displayName"`
	WorkspaceName string `json:"workspaceName"`
}

type LoginInput struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type RequestMetadata struct {
	UserAgent string
	IPAddress string
}

func (s *AuthService) Login(ctx context.Context, req LoginInput, meta RequestMetadata) (*AuthResult, error) {
	_, normalized := normalizeEmail(req.Email)
	if normalized == "" || req.Password == "" {
		return nil, utils.ErrInvalidCredentials
	}
	if allowed, err := s.allow(ctx, "login", meta.IPAddress, normalized, 20, 15*time.Minute); err != nil || !allowed {
		if err != nil {
			return nil, err
		}
		return nil, utils.NewError(http.StatusTooManyRequests, "FORBIDDEN", "Too many requests.", nil)
	}
	user, err := s.repos.Users().GetByEmail(ctx, normalized)
	if err != nil {
		return nil, utils.ErrInvalidCredentials
	}
	if user.Status == "suspended" {
		return nil, utils.ErrAccountSuspended
	}
	if user.Status == "pending" {
		return nil, utils.ErrAccountPending
	}
	credential, err := s.repos.LocalCredentials().GetByUserID(ctx, user.ID)
	if err != nil {
		return nil, utils.ErrInvalidCredentials
	}
	valid, err := s.hasher.Verify(req.Password, credential.PasswordHash)
	if err != nil || !valid {
		return nil, utils.ErrInvalidCredentials
	}
	if s.hasher.NeedsRehash(credential.PasswordHash) {
		if nextHash, hashErr := s.hasher.Hash(req.Password); hashErr == nil {
			credential.PasswordHash = nextHash
			credential.UpdatedAt = time.Now().UTC()
			_ = s.repos.LocalCredentials().Update(ctx, credential)
		}
	}
	workspaceID, roles, permissions, _ := s.resolvePrimaryWorkspace(ctx, user.ID)
	return s.createAuthenticatedSession(ctx, user, workspaceID, permissions, roles, meta)
}

func (s *AuthService) Refresh(ctx context.Context, refreshToken string, meta RequestMetadata) (*AuthResult, error) {
	if strings.TrimSpace(refreshToken) == "" {
		return nil, utils.ErrUnauthorized
	}
	tokenHash := hashOpaqueToken(refreshToken)
	record, err := s.repos.AuthRefreshTokens().GetByHash(ctx, tokenHash)
	if err != nil {
		return nil, utils.ErrUnauthorized
	}
	session, err := s.repos.AuthSessions().GetByID(ctx, record.SessionID)
	if err != nil {
		return nil, utils.ErrSessionRevoked
	}
	now := time.Now().UTC()
	if record.UsedAt != nil {
		// Token was already rotated. Instead of revoking the whole family
		// when outside a grace window, always try to find the sibling
		// (replacement) token first. This handles multi-tab scenarios
		// regardless of timing.
		if record.ReplacedByID != nil {
			sibling, siblingErr := s.repos.AuthRefreshTokens().GetByID(ctx, *record.ReplacedByID)
			if siblingErr == nil && sibling.RevokedAt == nil && !sibling.ExpiresAt.Before(now) && sibling.UsedAt == nil {
				record = sibling
				var sessionErr error
				session, sessionErr = s.repos.AuthSessions().GetByID(ctx, record.SessionID)
				if sessionErr != nil {
					return nil, utils.ErrSessionRevoked
				}
			} else {
				_ = s.repos.AuthSessions().RevokeFamily(ctx, record.FamilyID, "refresh_token_reuse", now)
				_ = s.repos.AuthRefreshTokens().RevokeFamily(ctx, record.FamilyID, now)
				return nil, utils.ErrTokenReuseDetected
			}
		} else {
			_ = s.repos.AuthSessions().RevokeFamily(ctx, record.FamilyID, "refresh_token_reuse", now)
			_ = s.repos.AuthRefreshTokens().RevokeFamily(ctx, record.FamilyID, now)
			return nil, utils.ErrTokenReuseDetected
		}
	}
	if record.RevokedAt != nil || session.RevokedAt != nil {
		return nil, utils.ErrSessionRevoked
	}
	if record.ExpiresAt.Before(now) || session.ExpiresAt.Before(now) {
		return nil, utils.ErrSessionExpired
	}

	var user *models.User
	var result *AuthResult
	err = s.db.Transaction(ctx, func(tx *gorm.DB) error {
		txRepos := s.repos.WithDB(tx)
		current, txErr := txRepos.AuthRefreshTokens().GetByHash(ctx, tokenHash)
		if txErr != nil {
			return txErr
		}
		if current.UsedAt != nil {
			if current.ReplacedByID != nil {
				// Token was already rotated — try the sibling (replacement).
				sibling, txErr := txRepos.AuthRefreshTokens().GetByID(ctx, *current.ReplacedByID)
				if txErr == nil && sibling.RevokedAt == nil && !sibling.ExpiresAt.Before(now) && sibling.UsedAt == nil {
					current = sibling
				} else {
					_ = txRepos.AuthSessions().RevokeFamily(ctx, current.FamilyID, "refresh_token_reuse", now)
					_ = txRepos.AuthRefreshTokens().RevokeFamily(ctx, current.FamilyID, now)
					return utils.ErrTokenReuseDetected
				}
			} else {
				_ = txRepos.AuthSessions().RevokeFamily(ctx, current.FamilyID, "refresh_token_reuse", now)
				_ = txRepos.AuthRefreshTokens().RevokeFamily(ctx, current.FamilyID, now)
				return utils.ErrTokenReuseDetected
			}
		}
		user, txErr = txRepos.Users().GetByID(ctx, session.UserID)
		if txErr != nil {
			return txErr
		}
		roles, permissions := workspaceRoleAndPermissions(user.ID, session.WorkspaceID, txRepos)
		nextToken, nextHash, createErr := issueRefreshToken()
		if createErr != nil {
			return createErr
		}
		usedAt := now
		current.UsedAt = &usedAt
		current.ReplacedByID = nil
		if err := txRepos.AuthRefreshTokens().Update(ctx, current); err != nil {
			return err
		}
		next := &models.AuthRefreshToken{
			Common:    models.Common{ID: utils.NewID(), CreatedAt: now, UpdatedAt: now},
			SessionID: session.ID,
			FamilyID:  current.FamilyID,
			TokenHash: nextHash,
			ExpiresAt: session.ExpiresAt,
		}
		current.ReplacedByID = &next.ID
		if err := txRepos.AuthRefreshTokens().Update(ctx, current); err != nil {
			return err
		}
		if err := txRepos.AuthRefreshTokens().Create(ctx, next); err != nil {
			return err
		}
		session.TokenHash = nextHash
		session.RefreshTokenHash = nextHash
		session.LastUsedAt = now
		session.UserAgent = stringPtr(meta.UserAgent)
		session.IPAddress = stringPtr(meta.IPAddress)
		session.UpdatedAt = now
		if err := txRepos.AuthSessions().Update(ctx, session); err != nil {
			return err
		}
		accessToken, err := s.identity.IssueToken(ctx, interfaces.Principal{
			UserID:      user.ID,
			WorkspaceID: valueOrEmpty(session.WorkspaceID),
			Roles:       roles,
			Permissions: permissions,
			SessionID:   session.ID,
		})
		if err != nil {
			return err
		}
		result = &AuthResult{
			User:         s.toUserDTO(user, session.WorkspaceID, roles, permissions),
			AccessToken:  accessToken,
			ExpiresIn:    int64(s.cfg.JWTAccessTTL.Seconds()),
			RefreshToken: nextToken,
			SessionID:    session.ID,
		}
		return nil
	})
	return result, err
}

func (s *AuthService) Logout(ctx context.Context, sessionID string) error {
	if sessionID == "" {
		return nil
	}
	return s.repos.AuthSessions().Revoke(ctx, sessionID, "logout", time.Now().UTC())
}

func (s *AuthService) LogoutAll(ctx context.Context, userID string, exceptCurrent bool, currentSessionID string) error {
	except := ""
	if exceptCurrent {
		except = currentSessionID
	}
	return s.repos.AuthSessions().RevokeAllByUser(ctx, userID, "logout_all", time.Now().UTC(), except)
}

func (s *AuthService) CurrentUser(ctx context.Context, principal interfaces.Principal) (*AuthUserDTO, error) {
	user, err := s.repos.Users().GetByID(ctx, principal.UserID)
	if err != nil {
		return nil, err
	}
	workspaceID := pointerIfNotEmpty(principal.WorkspaceID)
	dto := s.toUserDTO(user, workspaceID, principal.Roles, principal.Permissions)
	return &dto, nil
}

func (s *AuthService) ListSessions(ctx context.Context, principal interfaces.Principal) ([]AuthSessionDTO, error) {
	items, err := s.repos.AuthSessions().ListActiveByUser(ctx, principal.UserID, time.Now().UTC())
	if err != nil {
		return nil, err
	}
	out := make([]AuthSessionDTO, 0, len(items))
	for _, item := range items {
		out = append(out, AuthSessionDTO{
			ID:         item.ID,
			UserAgent:  valueOrEmpty(item.UserAgent),
			IPAddress:  maskIP(valueOrEmpty(item.IPAddress)),
			CreatedAt:  item.CreatedAt.Format(time.RFC3339),
			LastUsedAt: item.LastUsedAt.Format(time.RFC3339),
			ExpiresAt:  item.ExpiresAt.Format(time.RFC3339),
			Current:    item.ID == principal.SessionID,
		})
	}
	return out, nil
}

func (s *AuthService) RevokeSession(ctx context.Context, principal interfaces.Principal, sessionID string) error {
	session, err := s.repos.AuthSessions().GetByID(ctx, sessionID)
	if err != nil {
		return err
	}
	if session.UserID != principal.UserID {
		return utils.ErrForbidden
	}
	return s.repos.AuthSessions().Revoke(ctx, sessionID, "session_revoked_by_user", time.Now().UTC())
}

func (s *AuthService) ChangePassword(
	ctx context.Context,
	principal interfaces.Principal,
	currentPassword string,
	newPassword string,
	meta RequestMetadata,
) error {
	if strings.TrimSpace(currentPassword) == "" || len(strings.TrimSpace(newPassword)) < s.cfg.PasswordMinLength {
		return utils.ErrValidationFailed
	}
	user, err := s.repos.Users().GetByID(ctx, principal.UserID)
	if err != nil {
		return err
	}
	credential, err := s.repos.LocalCredentials().GetByUserID(ctx, principal.UserID)
	if err != nil {
		return err
	}
	valid, err := s.hasher.Verify(currentPassword, credential.PasswordHash)
	if err != nil || !valid {
		return utils.ErrInvalidCredentials
	}
	nextHash, err := s.hasher.Hash(newPassword)
	if err != nil {
		return err
	}
	now := time.Now().UTC()
	return s.db.Transaction(ctx, func(tx *gorm.DB) error {
		txRepos := s.repos.WithDB(tx)
		credential.PasswordHash = nextHash
		credential.UpdatedAt = now
		if err := txRepos.LocalCredentials().Update(ctx, credential); err != nil {
			return err
		}
		user.PasswordChangedAt = &now
		user.UpdatedAt = now
		if err := txRepos.Users().Update(ctx, user); err != nil {
			return err
		}
		return nil
	})
}

func (s *AuthService) RequestPasswordReset(ctx context.Context, email string) error {
	_, normalized := normalizeEmail(email)
	if normalized == "" {
		return nil
	}
	user, err := s.repos.Users().GetByEmail(ctx, normalized)
	if err != nil {
		return nil
	}
	now := time.Now().UTC()
	token, hash, err := issueOpaqueToken(32)
	if err != nil {
		return err
	}
	_ = token
	model := &models.PasswordResetToken{
		Common:       models.Common{ID: utils.NewID(), CreatedAt: now, UpdatedAt: now},
		UserID:       user.ID,
		TokenHash:    hash,
		ExpiresAt:    now.Add(s.cfg.PasswordResetTTL),
		LastSentAt:   &now,
		RequestCount: 1,
	}
	if err := s.repos.PasswordResetTokens().Create(ctx, model); err != nil {
		return err
	}
	return nil
}

func (s *AuthService) CleanupExpired(ctx context.Context) error {
	now := time.Now().UTC()
	if err := s.repos.AuthRefreshTokens().DeleteExpired(ctx, now); err != nil {
		return err
	}
	if err := s.repos.PasswordResetTokens().DeleteExpired(ctx, now); err != nil {
		return err
	}
	if err := s.repos.EmailVerificationTokens().DeleteExpired(ctx, now); err != nil {
		return err
	}
	return s.repos.AuthSessions().DeleteExpired(ctx, now)
}

func (s *AuthService) SetRefreshCookie(c *gin.Context, token string) {
	c.SetSameSite(s.sameSite())
	c.SetCookie(s.cfg.RefreshCookieName, token, int(s.cfg.JWTRefreshTTL.Seconds()), refreshCookiePath, s.cfg.CookieDomain, s.cfg.CookieSecure, true)
}

func (s *AuthService) ClearRefreshCookie(c *gin.Context) {
	c.SetSameSite(s.sameSite())
	c.SetCookie(s.cfg.RefreshCookieName, "", -1, refreshCookiePath, s.cfg.CookieDomain, s.cfg.CookieSecure, true)
}

func (s *AuthService) sameSite() http.SameSite {
	switch s.cfg.CookieSameSite {
	case "strict":
		return http.SameSiteStrictMode
	case "none":
		return http.SameSiteNoneMode
	default:
		return http.SameSiteLaxMode
	}
}

func (s *AuthService) createAuthenticatedSession(ctx context.Context, user *models.User, workspaceID *string, permissions []string, roles []string, meta RequestMetadata) (*AuthResult, error) {
	now := time.Now().UTC()
	refreshToken, refreshHash, err := issueRefreshToken()
	if err != nil {
		return nil, err
	}
	session := &models.AuthSession{
		Common:               models.Common{ID: utils.NewID(), CreatedAt: now, UpdatedAt: now},
		TokenHash:            refreshHash,
		UserID:               user.ID,
		WorkspaceID:          workspaceID,
		RefreshTokenHash:     refreshHash,
		RefreshTokenFamilyID: utils.NewID(),
		UserAgent:            stringPtr(meta.UserAgent),
		IPAddress:            stringPtr(meta.IPAddress),
		ExpiresAt:            now.Add(s.cfg.JWTRefreshTTL),
		LastUsedAt:           now,
	}
	refreshRecord := &models.AuthRefreshToken{
		Common:    models.Common{ID: utils.NewID(), CreatedAt: now, UpdatedAt: now},
		SessionID: session.ID,
		FamilyID:  session.RefreshTokenFamilyID,
		TokenHash: refreshHash,
		ExpiresAt: session.ExpiresAt,
	}
	if err := s.db.Transaction(ctx, func(tx *gorm.DB) error {
		txRepos := s.repos.WithDB(tx)
		if err := txRepos.AuthSessions().Create(ctx, session); err != nil {
			return err
		}
		if err := txRepos.AuthRefreshTokens().Create(ctx, refreshRecord); err != nil {
			return err
		}
		return nil
	}); err != nil {
		return nil, err
	}
	accessToken, err := s.identity.IssueToken(ctx, interfaces.Principal{
		UserID:      user.ID,
		WorkspaceID: valueOrEmpty(workspaceID),
		Roles:       roles,
		Permissions: permissions,
		SessionID:   session.ID,
	})
	if err != nil {
		return nil, err
	}
	return &AuthResult{
		User:         s.toUserDTO(user, workspaceID, roles, permissions),
		AccessToken:  accessToken,
		ExpiresIn:    int64(s.cfg.JWTAccessTTL.Seconds()),
		RefreshToken: refreshToken,
		SessionID:    session.ID,
	}, nil
}

func (s *AuthService) resolvePrimaryWorkspace(ctx context.Context, userID string) (*string, []string, []string, error) {
	workspaces, err := s.repos.Workspaces().ListByUser(ctx, userID)
	if err != nil || len(workspaces) == 0 {
		return nil, nil, nil, err
	}
	member, err := s.repos.WorkspaceMembers().Get(ctx, workspaces[0].ID, userID)
	if err != nil {
		return nil, nil, nil, err
	}
	roles := []string{member.Role}
	return &workspaces[0].ID, roles, roleToPermissions(member.Role), nil
}

func workspaceRoleAndPermissions(userID string, workspaceID *string, repos *Repositories) ([]string, []string) {
	if workspaceID == nil || repos == nil {
		return []string{"member"}, roleToPermissions("member")
	}
	member, err := repos.WorkspaceMembers().Get(context.Background(), *workspaceID, userID)
	if err != nil {
		return []string{"member"}, roleToPermissions("member")
	}
	return []string{member.Role}, roleToPermissions(member.Role)
}

func roleToPermissions(role string) []string {
	switch role {
	case "owner":
		return []string{"workspace:read", "workspace:write", "meeting:read", "meeting:write", "session:read", "session:write"}
	case "admin":
		return []string{"workspace:read", "meeting:read", "meeting:write", "session:read", "session:write"}
	default:
		return []string{"workspace:read", "meeting:read", "meeting:write", "session:read"}
	}
}

func (s *AuthService) toUserDTO(user *models.User, workspaceID *string, roles, permissions []string) AuthUserDTO {
	return AuthUserDTO{
		ID:             user.ID,
		Email:          user.Email,
		DisplayName:    user.DisplayName,
		AvatarURL:      user.AvatarURL,
		Status:         user.Status,
		PresenceStatus: user.PresenceStatus,
		WorkspaceID:    workspaceID,
		Roles:          roles,
		Permissions:    permissions,
		CreatedAt:      user.CreatedAt.Format(time.RFC3339),
		UpdatedAt:      user.UpdatedAt.Format(time.RFC3339),
	}
}

func issueRefreshToken() (string, string, error) {
	return issueOpaqueToken(32)
}

func issueOpaqueToken(length int) (string, string, error) {
	raw := make([]byte, length)
	if _, err := rand.Read(raw); err != nil {
		return "", "", err
	}
	token := base64.RawURLEncoding.EncodeToString(raw)
	return token, hashOpaqueToken(token), nil
}

func hashOpaqueToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}

func normalizeEmail(email string) (string, string) {
	trimmed := strings.TrimSpace(email)
	return trimmed, strings.ToLower(trimmed)
}

func slugifyWorkspace(seed string) string {
	local := strings.Split(seed, "@")[0]
	local = strings.Map(func(r rune) rune {
		switch {
		case r >= 'a' && r <= 'z', r >= '0' && r <= '9':
			return r
		case r >= 'A' && r <= 'Z':
			return r + 32
		default:
			return '-'
		}
	}, local)
	local = strings.Trim(local, "-")
	if local == "" {
		local = "workspace"
	}
	return local + "-" + utils.NewID()[:8]
}

func stringPtr(value string) *string {
	if strings.TrimSpace(value) == "" {
		return nil
	}
	v := value
	return &v
}

func pointerIfNotEmpty(value string) *string {
	if value == "" {
		return nil
	}
	return &value
}

func valueOrEmpty(value *string) string {
	if value == nil {
		return ""
	}
	return *value
}

func maskIP(value string) string {
	ip := net.ParseIP(value)
	if ip == nil {
		return value
	}
	if v4 := ip.To4(); v4 != nil {
		return fmt.Sprintf("%d.%d.%d.x", v4[0], v4[1], v4[2])
	}
	return ip.Mask(net.CIDRMask(64, 128)).String()
}

func (s *AuthService) allow(ctx context.Context, endpoint, ip, email string, limit int, window time.Duration) (bool, error) {
	if !s.cfg.RateLimitEnabled || s.limiter == nil {
		return true, nil
	}
	return s.limiter.Allow(ctx, endpoint, ip, email, limit, window)
}
