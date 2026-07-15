package services

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/skygenesisenterprise/aether-account/server/src/config"
	"github.com/skygenesisenterprise/aether-account/server/src/interfaces"
	"github.com/skygenesisenterprise/aether-account/server/src/models"
	"github.com/skygenesisenterprise/aether-account/server/src/utils"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/github"
	"golang.org/x/oauth2/google"
)

const oauthStatePrefix = "oauth_state:"

type OAuthService struct {
	cfg          config.OAuthConfig
	repos        *Repositories
	authSvc      *AuthService
	identity     interfaces.IdentityProvider
	workspaceSvc *WorkspaceService
	store        OAuthStateStore
}

type OAuthStateStore interface {
	Set(key, value string, ttl time.Duration) error
	Get(key string) (string, error)
	Delete(key string) error
}

type oAuthStateData struct {
	Provider  string `json:"provider"`
	Action    string `json:"action"` // "login" or "link"
	UserID    string `json:"userId,omitempty"`
	Nonce     string `json:"nonce"`
	ExpiresAt int64  `json:"expiresAt"`
}

type OAuthUserInfo struct {
	ID          string
	Email       string
	DisplayName string
	AvatarURL   string
}

type OAuthResult struct {
	AuthResult  *AuthResult `json:"authResult,omitempty"`
	RedirectURL string      `json:"redirectUrl"`
	Linked      bool        `json:"linked,omitempty"`
}

type memoryOAuthStateStore struct {
	store map[string]entry
}

type entry struct {
	value     string
	expiresAt time.Time
}

func newMemoryOAuthStateStore() *memoryOAuthStateStore {
	return &memoryOAuthStateStore{store: make(map[string]entry)}
}

func (m *memoryOAuthStateStore) Set(key, value string, ttl time.Duration) error {
	m.store[key] = entry{value: value, expiresAt: time.Now().Add(ttl)}
	return nil
}

func (m *memoryOAuthStateStore) Get(key string) (string, error) {
	e, ok := m.store[key]
	if !ok {
		return "", errors.New("state not found")
	}
	if time.Now().After(e.expiresAt) {
		delete(m.store, key)
		return "", errors.New("state expired")
	}
	return e.value, nil
}

func (m *memoryOAuthStateStore) Delete(key string) error {
	delete(m.store, key)
	return nil
}

func NewOAuthService(cfg config.OAuthConfig, repos *Repositories, authSvc *AuthService, identity interfaces.IdentityProvider, workspaceSvc *WorkspaceService, store OAuthStateStore) *OAuthService {
	if store == nil {
		store = newMemoryOAuthStateStore()
	}
	return &OAuthService{
		cfg:          cfg,
		repos:        repos,
		authSvc:      authSvc,
		identity:     identity,
		workspaceSvc: workspaceSvc,
		store:        store,
	}
}

func (s *OAuthService) oauthConfig(provider string) (*oauth2.Config, config.OAuthProviderConfig, error) {
	var pc config.OAuthProviderConfig
	switch provider {
	case "google":
		pc = s.cfg.Google
	case "github":
		pc = s.cfg.GitHub
	default:
		return nil, pc, utils.ErrOAuthProviderNotConfigured
	}
	if !pc.Enabled || pc.ClientID == "" || pc.ClientSecret == "" {
		return nil, pc, utils.ErrOAuthProviderNotConfigured
	}
	endpoint := google.Endpoint
	scopes := []string{"openid", "profile", "email"}
	if provider == "github" {
		endpoint = github.Endpoint
		scopes = []string{"read:user", "user:email"}
	}
	cfg := &oauth2.Config{
		ClientID:     pc.ClientID,
		ClientSecret: pc.ClientSecret,
		RedirectURL:  pc.RedirectURL,
		Scopes:       scopes,
		Endpoint:     endpoint,
	}
	return cfg, pc, nil
}

func generateNonce() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(b), nil
}

func (s *OAuthService) GetAuthorizationURL(ctx context.Context, provider, action, userID string) (string, error) {
	cfg, _, err := s.oauthConfig(provider)
	if err != nil {
		return "", err
	}

	nonce, err := generateNonce()
	if err != nil {
		return "", err
	}
	state := &oAuthStateData{
		Provider:  provider,
		Action:    action,
		UserID:    userID,
		Nonce:     nonce,
		ExpiresAt: time.Now().Add(s.cfg.StateTTL).Unix(),
	}
	stateJSON, err := json.Marshal(state)
	if err != nil {
		return "", err
	}
	stateKey := oauthStatePrefix + nonce

	if err := s.store.Set(stateKey, string(stateJSON), s.cfg.StateTTL); err != nil {
		return "", fmt.Errorf("store oauth state: %w", err)
	}

	authURL := cfg.AuthCodeURL(nonce, oauth2.AccessTypeOffline)
	return authURL, nil
}

func (s *OAuthService) HandleCallback(ctx context.Context, provider, code, stateNonce string, meta RequestMetadata) (*OAuthResult, error) {
	cfg, _, err := s.oauthConfig(provider)
	if err != nil {
		return nil, err
	}

	stateKey := oauthStatePrefix + stateNonce
	rawState, err := s.store.Get(stateKey)
	if err != nil {
		return nil, utils.ErrOAuthStateInvalid
	}
	_ = s.store.Delete(stateKey)

	var state oAuthStateData
	if err := json.Unmarshal([]byte(rawState), &state); err != nil {
		return nil, utils.ErrOAuthStateInvalid
	}
	if state.Provider != provider || state.Nonce != stateNonce {
		return nil, utils.ErrOAuthStateInvalid
	}
	if time.Now().Unix() > state.ExpiresAt {
		return nil, utils.ErrOAuthStateInvalid
	}

	token, err := cfg.Exchange(ctx, code)
	if err != nil {
		return nil, fmt.Errorf("token exchange: %w", err)
	}

	userInfo, err := s.fetchUserInfo(ctx, provider, token.AccessToken)
	if err != nil {
		return nil, fmt.Errorf("fetch user info: %w", err)
	}

	switch state.Action {
	case "login":
		return s.handleLoginOAuth(ctx, provider, userInfo, token, meta)
	case "link":
		return s.handleLinkOAuth(ctx, provider, userInfo, token, state.UserID)
	default:
		return nil, utils.ErrOAuthStateInvalid
	}
}

func (s *OAuthService) fetchUserInfo(ctx context.Context, provider, accessToken string) (*OAuthUserInfo, error) {
	switch provider {
	case "google":
		return s.fetchGoogleUserInfo(ctx, accessToken)
	case "github":
		return s.fetchGitHubUserInfo(ctx, accessToken)
	default:
		return nil, utils.ErrOAuthProviderNotConfigured
	}
}

func (s *OAuthService) fetchGoogleUserInfo(ctx context.Context, accessToken string) (*OAuthUserInfo, error) {
	req, _ := http.NewRequestWithContext(ctx, http.MethodGet, "https://www.googleapis.com/oauth2/v2/userinfo", nil)
	req.Header.Set("Authorization", "Bearer "+accessToken)
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(io.LimitReader(resp.Body, 1<<20))

	var data struct {
		ID            string `json:"id"`
		Email         string `json:"email"`
		VerifiedEmail bool   `json:"verified_email"`
		Name          string `json:"name"`
		Picture       string `json:"picture"`
	}
	if err := json.Unmarshal(body, &data); err != nil {
		return nil, err
	}
	if data.Email == "" {
		return nil, errors.New("google account has no email")
	}
	return &OAuthUserInfo{
		ID:          data.ID,
		Email:       strings.ToLower(strings.TrimSpace(data.Email)),
		DisplayName: data.Name,
		AvatarURL:   data.Picture,
	}, nil
}

func (s *OAuthService) fetchGitHubUserInfo(ctx context.Context, accessToken string) (*OAuthUserInfo, error) {
	req, _ := http.NewRequestWithContext(ctx, http.MethodGet, "https://api.github.com/user", nil)
	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Accept", "application/vnd.github.v3+json")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(io.LimitReader(resp.Body, 1<<20))

	var data struct {
		ID        int    `json:"id"`
		Email     string `json:"email"`
		Name      string `json:"name"`
		Login     string `json:"login"`
		AvatarURL string `json:"avatar_url"`
	}
	if err := json.Unmarshal(body, &data); err != nil {
		return nil, err
	}

	if data.Email == "" {
		emailReq, _ := http.NewRequestWithContext(ctx, http.MethodGet, "https://api.github.com/user/emails", nil)
		emailReq.Header.Set("Authorization", "Bearer "+accessToken)
		emailReq.Header.Set("Accept", "application/vnd.github.v3+json")
		emailResp, err := http.DefaultClient.Do(emailReq)
		if err == nil {
			defer emailResp.Body.Close()
			emailBody, _ := io.ReadAll(io.LimitReader(emailResp.Body, 1<<20))
			var emails []struct {
				Email    string `json:"email"`
				Primary  bool   `json:"primary"`
				Verified bool   `json:"verified"`
			}
			if json.Unmarshal(emailBody, &emails) == nil {
				for _, e := range emails {
					if e.Primary && e.Verified {
						data.Email = e.Email
						break
					}
				}
				if data.Email == "" && len(emails) > 0 {
					data.Email = emails[0].Email
				}
			}
		}
	}

	if data.Email == "" {
		return nil, errors.New("github account has no email")
	}

	displayName := data.Name
	if displayName == "" {
		displayName = data.Login
	}

	return &OAuthUserInfo{
		ID:          fmt.Sprintf("%d", data.ID),
		Email:       strings.ToLower(strings.TrimSpace(data.Email)),
		DisplayName: displayName,
		AvatarURL:   data.AvatarURL,
	}, nil
}

func (s *OAuthService) handleLoginOAuth(ctx context.Context, provider string, userInfo *OAuthUserInfo, token *oauth2.Token, meta RequestMetadata) (*OAuthResult, error) {
	existing, err := s.repos.AuthAccounts().GetByProvider(ctx, provider, userInfo.ID)
	if err == nil && existing != nil {
		user, err := s.repos.Users().GetByID(ctx, existing.UserID)
		if err != nil {
			return nil, err
		}
		if user.DisabledAt != nil || user.Status == "suspended" {
			return nil, utils.ErrAccountSuspended
		}
		if user.Status == "pending" {
			return nil, utils.ErrAccountPending
		}

		workspaceID, roles, permissions, err := s.authSvc.resolvePrimaryWorkspace(ctx, user.ID)
		if err != nil {
			return nil, err
		}

		result, err := s.authSvc.createAuthenticatedSession(ctx, user, workspaceID, permissions, roles, meta)
		if err != nil {
			return nil, err
		}
		return &OAuthResult{AuthResult: result}, nil
	}

	existingUserByEmail, err := s.repos.Users().GetByEmail(ctx, userInfo.Email)
	if err != nil && !strings.Contains(err.Error(), "USER_NOT_FOUND") {
		return nil, err
	}

	if existingUserByEmail != nil {
		if existingUserByEmail.DisabledAt != nil || existingUserByEmail.Status == "suspended" {
			return nil, utils.ErrAccountSuspended
		}
		if existingUserByEmail.Status == "pending" {
			return nil, utils.ErrAccountPending
		}

		existingAccount, _ := s.repos.AuthAccounts().GetByUserIDAndProvider(ctx, existingUserByEmail.ID, provider)
		if existingAccount != nil {
			workspaceID, roles, permissions, err := s.authSvc.resolvePrimaryWorkspace(ctx, existingUserByEmail.ID)
			if err != nil {
				return nil, err
			}
			result, err := s.authSvc.createAuthenticatedSession(ctx, existingUserByEmail, workspaceID, permissions, roles, meta)
			if err != nil {
				return nil, err
			}
			return &OAuthResult{AuthResult: result}, nil
		}

		now := time.Now().UTC()
		account := &models.AuthAccount{
			Common:            models.Common{ID: utils.NewID(), CreatedAt: now, UpdatedAt: now},
			UserID:            existingUserByEmail.ID,
			Provider:          provider,
			ProviderAccountID: userInfo.ID,
			AccessToken:       &token.AccessToken,
			Scopes:            ptr(strings.Join(oauthScopes(provider), " ")),
		}
		if token.RefreshToken != "" {
			account.RefreshToken = &token.RefreshToken
		}
		if !token.Expiry.IsZero() {
			account.TokenExpiresAt = &token.Expiry
		}
		if err := s.repos.AuthAccounts().Create(ctx, account); err != nil {
			return nil, err
		}

		workspaceID, roles, permissions, err := s.authSvc.resolvePrimaryWorkspace(ctx, existingUserByEmail.ID)
		if err != nil {
			return nil, err
		}
		result, err := s.authSvc.createAuthenticatedSession(ctx, existingUserByEmail, workspaceID, permissions, roles, meta)
		if err != nil {
			return nil, err
		}
		return &OAuthResult{AuthResult: result}, nil
	}

	now := time.Now().UTC()
	userID := utils.NewID()
	user := &models.User{
		Common:          models.Common{ID: userID, CreatedAt: now, UpdatedAt: now},
		Email:           userInfo.Email,
		EmailNormalized: strings.ToLower(strings.TrimSpace(userInfo.Email)),
		DisplayName:     userInfo.DisplayName,
		AvatarURL:       &userInfo.AvatarURL,
		Status:          "active",
		PresenceStatus:  "offline",
		EmailVerifiedAt: &now,
		LastSeenAt:      &now,
	}

	if err := s.repos.Users().Create(ctx, user); err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "duplicate") {
			return nil, utils.ErrEmailAlreadyExists
		}
		return nil, err
	}

	account := &models.AuthAccount{
		Common:            models.Common{ID: utils.NewID(), CreatedAt: now, UpdatedAt: now},
		UserID:            userID,
		Provider:          provider,
		ProviderAccountID: userInfo.ID,
		AccessToken:       &token.AccessToken,
		Scopes:            ptr(strings.Join(oauthScopes(provider), " ")),
	}
	if token.RefreshToken != "" {
		account.RefreshToken = &token.RefreshToken
	}
	if !token.Expiry.IsZero() {
		account.TokenExpiresAt = &token.Expiry
	}
	if err := s.repos.AuthAccounts().Create(ctx, account); err != nil {
		return nil, err
	}

	var workspaceID *string
	roles := []string{"user"}
	permissions := []string{}

	wid, err := s.createPrimaryWorkspace(ctx, userID, userInfo.DisplayName)
	if err != nil {
		return nil, err
	}
	workspaceID = &wid
	roles = append(roles, "workspace:owner")

	result, err := s.authSvc.createAuthenticatedSession(ctx, user, workspaceID, permissions, roles, meta)
	if err != nil {
		return nil, err
	}

	return &OAuthResult{AuthResult: result}, nil
}

func (s *OAuthService) handleLinkOAuth(ctx context.Context, provider string, userInfo *OAuthUserInfo, token *oauth2.Token, userID string) (*OAuthResult, error) {
	if _, err := s.repos.AuthAccounts().GetByProvider(ctx, provider, userInfo.ID); err == nil {
		return nil, utils.ErrOAuthAccountAlreadyLinked
	}

	existing, _ := s.repos.AuthAccounts().GetByUserIDAndProvider(ctx, userID, provider)
	if existing != nil {
		return nil, utils.ErrOAuthAccountAlreadyLinked
	}

	now := time.Now().UTC()
	account := &models.AuthAccount{
		Common:            models.Common{ID: utils.NewID(), CreatedAt: now, UpdatedAt: now},
		UserID:            userID,
		Provider:          provider,
		ProviderAccountID: userInfo.ID,
		AccessToken:       &token.AccessToken,
		Scopes:            ptr(strings.Join(oauthScopes(provider), " ")),
	}
	if token.RefreshToken != "" {
		account.RefreshToken = &token.RefreshToken
	}
	if !token.Expiry.IsZero() {
		account.TokenExpiresAt = &token.Expiry
	}
	if err := s.repos.AuthAccounts().Create(ctx, account); err != nil {
		return nil, err
	}

	return &OAuthResult{Linked: true}, nil
}

func (s *OAuthService) ListLinkedAccounts(ctx context.Context, userID string) ([]models.AuthAccount, error) {
	return s.repos.AuthAccounts().ListByUserID(ctx, userID)
}

func (s *OAuthService) UnlinkAccount(ctx context.Context, userID, provider string) error {
	account, err := s.repos.AuthAccounts().GetByUserIDAndProvider(ctx, userID, provider)
	if err != nil {
		return utils.ErrOAuthAccountNotFound
	}
	return s.repos.AuthAccounts().Delete(ctx, account.ID)
}

func (s *OAuthService) createPrimaryWorkspace(ctx context.Context, userID, displayName string) (string, error) {
	now := time.Now().UTC()
	workspaceID := utils.NewID()
	slug := slugifyDisplayName(displayName)
	workspace := &models.Workspace{
		Common:      models.Common{ID: workspaceID, CreatedAt: now, UpdatedAt: now},
		Name:        fmt.Sprintf("%s's Workspace", displayName),
		Slug:        slug,
		Visibility:  "private",
		OwnerID:     userID,
		Description: "Personal workspace",
	}
	if err := s.repos.Workspaces().Create(ctx, workspace); err != nil {
		return "", err
	}
	member := &models.WorkspaceMember{
		Common:      models.Common{ID: utils.NewID(), CreatedAt: now, UpdatedAt: now},
		WorkspaceID: workspaceID,
		UserID:      userID,
		Role:        "owner",
		JoinedAt:    now,
	}
	if err := s.repos.WorkspaceMembers().Create(ctx, member); err != nil {
		return "", err
	}
	return workspaceID, nil
}

func (s *OAuthService) SetOAuthCookies(c *gin.Context, result *OAuthResult) {
	if result.AuthResult != nil {
		s.authSvc.SetRefreshCookie(c, result.AuthResult.RefreshToken)
	}
}

func oauthScopes(provider string) []string {
	if provider == "github" {
		return []string{"read:user", "user:email"}
	}
	return []string{"openid", "profile", "email"}
}

func ptr(s string) *string { return &s }

func slugifyDisplayName(name string) string {
	slug := strings.ToLower(name)
	slug = strings.ReplaceAll(slug, " ", "-")
	var result strings.Builder
	for _, r := range slug {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') || r == '-' {
			result.WriteRune(r)
		}
	}
	slug = result.String()
	slug = strings.Trim(slug, "-")
	if slug == "" {
		slug = "workspace"
	}
	return slug
}
