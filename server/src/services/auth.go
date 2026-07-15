package services

import (
	"context"
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/skygenesisenterprise/aether-account/server/src/config"
	"github.com/skygenesisenterprise/aether-account/server/src/interfaces"
	"github.com/skygenesisenterprise/aether-account/server/src/utils"
)

type JWTIdentityProvider struct {
	issuer string
	secret []byte
	ttl    time.Duration
	repos  *Repositories
}

type principalClaims struct {
	WorkspaceID string   `json:"workspaceId,omitempty"`
	Roles       []string `json:"roles,omitempty"`
	Permissions []string `json:"permissions,omitempty"`
	SessionID   string   `json:"sessionId,omitempty"`
	jwt.RegisteredClaims
}

func NewIdentityProvider(cfg config.AuthConfig, repos *Repositories) interfaces.IdentityProvider {
	return &JWTIdentityProvider{
		issuer: cfg.JWTIssuer,
		secret: []byte(cfg.JWTSecret),
		ttl:    cfg.JWTAccessTTL,
		repos:  repos,
	}
}

func (p *JWTIdentityProvider) Authenticate(_ context.Context, token string) (*interfaces.Principal, error) {
	claims := &principalClaims{}
	parsed, err := jwt.ParseWithClaims(token, claims, func(token *jwt.Token) (any, error) {
		if token.Method.Alg() != jwt.SigningMethodHS256.Alg() {
			return nil, utils.ErrUnauthorized
		}
		return p.secret, nil
	})
	if err != nil || !parsed.Valid {
		return nil, utils.ErrUnauthorized
	}
	if claims.Subject == "" || claims.Issuer != p.issuer || claims.ExpiresAt == nil || claims.ExpiresAt.Time.Before(time.Now().UTC()) {
		return nil, utils.ErrUnauthorized
	}
	if claims.SessionID != "" && p.repos != nil {
		session, err := p.repos.AuthSessions().GetByID(context.Background(), claims.SessionID)
		if err != nil {
			return nil, utils.ErrSessionRevoked
		}
		if session.RevokedAt != nil {
			return nil, utils.ErrSessionRevoked
		}
		if session.ExpiresAt.Before(time.Now().UTC()) {
			return nil, utils.ErrSessionExpired
		}
	}
	return &interfaces.Principal{
		UserID:      claims.Subject,
		WorkspaceID: claims.WorkspaceID,
		Roles:       claims.Roles,
		Permissions: claims.Permissions,
		SessionID:   claims.SessionID,
	}, nil
}

func (p *JWTIdentityProvider) IssueToken(_ context.Context, principal interfaces.Principal) (string, error) {
	if len(p.secret) == 0 {
		return "", errors.New("jwt secret is not configured")
	}
	now := time.Now().UTC()
	claims := principalClaims{
		WorkspaceID: principal.WorkspaceID,
		Roles:       principal.Roles,
		Permissions: principal.Permissions,
		SessionID:   principal.SessionID,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   principal.UserID,
			Issuer:    p.issuer,
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(p.ttl)),
			ID:        utils.NewID(),
		},
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(p.secret)
}
