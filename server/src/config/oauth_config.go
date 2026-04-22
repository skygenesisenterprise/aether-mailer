package config

import (
	"time"
)

// OAuthConfig représente la configuration OAuth2/OpenID Connect
type OAuthConfig struct {
	IssuerURL          string
	AuthorizationURL   string
	TokenURL           string
	UserInfoURL        string
	JWKSURL            string
	RevocationURL      string
	Scopes             []string
	GrantTypes         []string
	ResponseTypes      []string
	TokenEndpointAuth  TokenEndpointAuthMethod
	PKCEEnabled        bool
	CodeChallengeMethod CodeChallengeMethod
	AccessTokenLifetime time.Duration
	IDTokenLifetime    time.Duration
	AuthorizationCodeLifetime time.Duration
	RefreshTokenLifetime time.Duration
}

// TokenEndpointAuthMethod représente les méthodes d'authentification du point de terminaison token
type TokenEndpointAuthMethod string

const (
	TokenEndpointAuthNone          TokenEndpointAuthMethod = "none"
	TokenEndpointAuthClientSecretBasic TokenEndpointAuthMethod = "client_secret_basic"
	TokenEndpointAuthClientSecretPost  TokenEndpointAuthMethod = "client_secret_post"
	TokenEndpointAuthPrivateKeyJWT     TokenEndpointAuthMethod = "private_key_jwt"
)

// CodeChallengeMethod représente les méthodes de code challenge pour PKCE
type CodeChallengeMethod string

const (
	CodeChallengeMethodPlain  CodeChallengeMethod = "plain"
	CodeChallengeMethodS256   CodeChallengeMethod = "S256"
)

// LoadOAuthConfig charge la configuration OAuth2/OpenID Connect
func LoadOAuthConfig() *OAuthConfig {
	return &OAuthConfig{
		IssuerURL:          getEnv("OIDC_ISSUER_URL", "https://sso.skygenesisenterprise.net"),
		AuthorizationURL:   getEnv("OIDC_AUTHORIZATION_URL", "/api/v1/oauth2/authorize"),
		TokenURL:           getEnv("OIDC_TOKEN_URL", "/api/v1/oauth2/token"),
		UserInfoURL:        getEnv("OIDC_USERINFO_URL", "/api/v1/oauth2/userinfo"),
		JWKSURL:            getEnv("OIDC_JWKS_URL", "/api/v1/oauth2/jwks"),
		RevocationURL:      getEnv("OIDC_REVOCATION_URL", "/api/v1/oauth2/revoke"),
		Scopes:             []string{"openid", "profile", "email", "api"},
		GrantTypes:         []string{"authorization_code", "refresh_token", "password", "client_credentials"},
		ResponseTypes:      []string{"code", "token", "id_token", "code token", "code id_token", "token id_token", "code token id_token"},
		TokenEndpointAuth:  TokenEndpointAuthClientSecretBasic,
		PKCEEnabled:        getEnvAsBool("OIDC_PKCE_ENABLED", true),
		CodeChallengeMethod: CodeChallengeMethodS256,
		AccessTokenLifetime: time.Duration(getEnvAsInt("OIDC_ACCESS_TOKEN_LIFETIME", 15)) * time.Minute,
		IDTokenLifetime:    time.Duration(getEnvAsInt("OIDC_ID_TOKEN_LIFETIME", 15)) * time.Minute,
		AuthorizationCodeLifetime: time.Duration(getEnvAsInt("OIDC_AUTH_CODE_LIFETIME", 10)) * time.Minute,
		RefreshTokenLifetime: time.Duration(getEnvAsInt("OIDC_REFRESH_TOKEN_LIFETIME", 720)) * time.Hour,
	}
}

// getEnvAsBool récupère une variable d'environnement en tant que booléen
func getEnvAsBool(key string, defaultValue bool) bool {
	valueStr := getEnv(key, "")
	if valueStr == "" {
		return defaultValue
	}
	return valueStr == "true"
}
