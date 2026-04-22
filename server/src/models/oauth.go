package models

import (
	"time"

	"gorm.io/gorm"
)

// OAuthClient représente un client OAuth2/OpenID Connect
type OAuthClient struct {
	ID             string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	ClientID       string    `gorm:"size:255;uniqueIndex;not null;column:client_id" json:"clientId"`
	ClientSecret   string    `gorm:"size:255;not null;column:client_secret" json:"clientSecret"`
	Name           string    `gorm:"size:255;not null" json:"name"`
	Description    *string   `gorm:"type:text" json:"description,omitempty"`
	RedirectURIs   []string  `gorm:"type:text[];column:redirect_uris" json:"redirectUris"`
	GrantTypes     []string  `gorm:"type:text[];column:grant_types" json:"grantTypes"`
	Scopes         []string  `gorm:"type:text[]" json:"scopes"`
	PostLoginPath  string    `gorm:"size:255;default:/;column:post_login_path" json:"postLoginPath"`
	PostLogoutPath string    `gorm:"size:255;default:/;column:post_logout_path" json:"postLogoutPath"`
	AllowedOrigins []string  `gorm:"type:text[];column:allowed_origins" json:"allowedOrigins"`
	IsActive       bool      `gorm:"default:true;column:is_active" json:"isActive"`
	CreatedAt      time.Time `gorm:"column:created_at" json:"createdAt"`
	UpdatedAt      time.Time `gorm:"column:updated_at" json:"createdAt"`

	AuthorizationCodes []OAuthAuthorizationCode `gorm:"foreignKey:ClientID;references:ClientID"`
	AccessTokens       []OAuthAccessToken      `gorm:"foreignKey:ClientID;references:ClientID"`
	RefreshTokens      []OAuthRefreshToken   `gorm:"foreignKey:ClientID;references:ClientID"`
	Consents         []OAuthConsent     `gorm:"foreignKey:ClientID;references:ClientID"`
}

func (OAuthClient) TableName() string {
	return "oauth_clients"
}

// OAuthAuthorizationCode représente un code d'autorisation OAuth2
type OAuthAuthorizationCode struct {
	ID            string     `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Code          string     `gorm:"size:255;uniqueIndex;not null" json:"code"`
	ClientID      string     `gorm:"size:255;not null;column:client_id;index" json:"clientId"`
	UserID        string     `gorm:"type:uuid;not null;column:user_id;index" json:"userId"`
	RedirectURI   string     `gorm:"size:500;not null;column:redirect_uri" json:"redirectUri"`
	Scopes        []string   `gorm:"type:text[]" json:"scopes"`
	CodeChallenge *string    `gorm:"size:255;column:code_challenge" json:"codeChallenge,omitempty"`
	CodeMethod    *string    `gorm:"size:20;column:code_method" json:"codeMethod,omitempty"`
	ExpiresAt     time.Time  `gorm:"column:expires_at" json:"expiresAt"`
	Used          bool       `gorm:"default:false" json:"used"`
	UsedAt        *time.Time `gorm:"column:used_at" json:"usedAt,omitempty"`
	CreatedAt     time.Time  `gorm:"column:created_at" json:"createdAt"`

	Client *OAuthClient `gorm:"foreignKey:ClientID;references:ClientID"`
	User   *User       `gorm:"foreignKey:UserID;references:ID"`
}

func (OAuthAuthorizationCode) TableName() string {
	return "oauth_authorization_codes"
}

// OAuthAccessToken représente un token d'accès OAuth2
type OAuthAccessToken struct {
	ID        string         `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Token     string         `gorm:"size:500;uniqueIndex;not null" json:"token"`
	ClientID  string         `gorm:"size:255;not null;column:client_id;index" json:"clientId"`
	UserID    string         `gorm:"type:uuid;not null;column:user_id;index" json:"userId"`
	Scopes    []string       `gorm:"type:text[]" json:"scopes"`
	ExpiresAt time.Time      `gorm:"column:expires_at" json:"expiresAt"`
	Revoked   bool           `gorm:"default:false" json:"revoked"`
	RevokedAt *time.Time     `gorm:"column:revoked_at" json:"revokedAt,omitempty"`
	CreatedAt time.Time      `gorm:"column:created_at" json:"createdAt"`
	DeletedAt gorm.DeletedAt `gorm:"index;column:deleted_at" json:"-"`

	Client *OAuthClient `gorm:"foreignKey:ClientID;references:ClientID"`
	User   *User       `gorm:"foreignKey:UserID;references:ID"`
}

func (OAuthAccessToken) TableName() string {
	return "oauth_access_tokens"
}

// OAuthRefreshToken représente un token de rafraîchissement OAuth2
type OAuthRefreshToken struct {
	ID        string         `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Token     string         `gorm:"size:500;uniqueIndex;not null" json:"token"`
	ClientID  string         `gorm:"size:255;not null;column:client_id;index" json:"clientId"`
	UserID    string         `gorm:"type:uuid;not null;column:user_id;index" json:"userId"`
	Scopes    []string       `gorm:"type:text[]" json:"scopes"`
	ExpiresAt time.Time      `gorm:"column:expires_at" json:"expiresAt"`
	Revoked   bool           `gorm:"default:false" json:"revoked"`
	RevokedAt *time.Time     `gorm:"column:revoked_at" json:"revokedAt,omitempty"`
	CreatedAt time.Time      `gorm:"column:created_at" json:"createdAt"`
	DeletedAt gorm.DeletedAt `gorm:"index;column:deleted_at" json:"-"`

	Client *OAuthClient `gorm:"foreignKey:ClientID;references:ClientID"`
	User   *User       `gorm:"foreignKey:UserID;references:ID"`
}

func (OAuthRefreshToken) TableName() string {
	return "oauth_refresh_tokens"
}

// OAuthConsent représente le consentement de l'utilisateur
type OAuthConsent struct {
	ID        string     `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID    string     `gorm:"type:uuid;not null;column:user_id;index" json:"userId"`
	ClientID  string     `gorm:"size:255;not null;column:client_id;index" json:"clientId"`
	Scopes    []string   `gorm:"type:text[]" json:"scopes"`
	GrantedAt time.Time  `gorm:"column:granted_at" json:"grantedAt"`
	ExpiresAt *time.Time `gorm:"column:expires_at" json:"expiresAt,omitempty"`
	CreatedAt time.Time  `gorm:"column:created_at" json:"createdAt"`
	UpdatedAt time.Time  `gorm:"column:updated_at" json:"updatedAt"`

	User   *User       `gorm:"foreignKey:UserID;references:ID"`
	Client *OAuthClient `gorm:"foreignKey:ClientID;references:ClientID"`
}

func (OAuthConsent) TableName() string {
	return "oauth_consents"
}

// AuthorizationRequest représente une requête d'autorisation OAuth2
type AuthorizationRequest struct {
	ClientID      string `form:"client_id" binding:"required"`
	RedirectURI   string `form:"redirect_uri" binding:"required"`
	ResponseType  string `form:"response_type" binding:"required"`
	Scope         string `form:"scope"`
	State         string `form:"state"`
	CodeChallenge string `form:"code_challenge"`
	CodeMethod    string `form:"code_method"`
	Nonce         string `form:"nonce"`
}

// TokenRequest représente une requête de token OAuth2
type TokenRequest struct {
	GrantType    string `form:"grant_type" binding:"required"`
	Code         string `form:"code"`
	RedirectURI  string `form:"redirect_uri"`
	ClientID     string `form:"client_id"`
	ClientSecret string `form:"client_secret"`
	RefreshToken string `form:"refresh_token"`
	Username     string `form:"username"`
	Password     string `form:"password"`
}

// TokenResponse représente une réponse de token OAuth2
type TokenResponse struct {
	AccessToken  string `json:"access_token"`
	TokenType    string `json:"token_type"`
	ExpiresIn    int    `json:"expires_in"`
	RefreshToken string `json:"refresh_token,omitempty"`
	IDToken      string `json:"id_token,omitempty"`
	Scope        string `json:"scope,omitempty"`
}

// UserInfoResponse représente une réponse d'information utilisateur OpenID Connect
type UserInfoResponse struct {
	Sub           string   `json:"sub"`
	Name          *string  `json:"name,omitempty"`
	Email         *string  `json:"email,omitempty"`
	EmailVerified bool     `json:"email_verified,omitempty"`
	GivenName     *string  `json:"given_name,omitempty"`
	FamilyName    *string  `json:"family_name,omitempty"`
	Roles         []string `json:"roles,omitempty"`
}
