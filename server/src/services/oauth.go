package services

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/skygenesisenterprise/aether-mailer/server/src/config"
	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
	"gorm.io/gorm"
)

// OAuthService gère les opérations OAuth2/OpenID Connect
type OAuthService struct {
	DB         *gorm.DB
	JWTService *JWTService
}

// NewOAuthService crée une nouvelle instance de OAuthService
func NewOAuthService(db *gorm.DB, jwtService *JWTService) *OAuthService {
	return &OAuthService{
		DB:         db,
		JWTService: jwtService,
	}
}

// GenerateRandomString génère une chaîne aléatoire sécurisée
func GenerateRandomString(length int) (string, error) {
	buf := make([]byte, length)
	_, err := rand.Read(buf)
	if err != nil {
		return "", err
	}
	return hex.EncodeToString(buf), nil
}

// GenerateCodeChallenge génère un code challenge pour PKCE
func GenerateCodeChallenge(codeVerifier string) (string, error) {
	hash := sha256.Sum256([]byte(codeVerifier))
	return base64.URLEncoding.WithPadding(base64.NoPadding).EncodeToString(hash[:]), nil
}

// CreateClient crée un nouveau client OAuth2
func (s *OAuthService) CreateClient(client *models.OAuthClient) error {
	return s.DB.Create(client).Error
}

// GetClientByID récupère un client par son ID
func (s *OAuthService) GetClientByID(clientID string) (*models.OAuthClient, error) {
	var client models.OAuthClient
	err := s.DB.Where("client_id = ?", clientID).First(&client).Error
	if err != nil {
		return nil, err
	}
	return &client, nil
}

// ValidateClient valide un client OAuth2
func (s *OAuthService) ValidateClient(clientID, clientSecret string) (*models.OAuthClient, error) {
	var client models.OAuthClient
	err := s.DB.Where("client_id = ? AND client_secret = ?", clientID, clientSecret).First(&client).Error
	if err != nil {
		return nil, err
	}
	return &client, nil
}

// CreateAuthorizationCode crée un code d'autorisation
func (s *OAuthService) CreateAuthorizationCode(code, clientID string, userID string, redirectURI string, scopes []string) (*models.OAuthAuthorizationCode, error) {
	authCode := &models.OAuthAuthorizationCode{
		Code:        code,
		ClientID:    clientID,
		UserID:      userID,
		RedirectURI: redirectURI,
		Scopes:      scopes,
		ExpiresAt:   time.Now().Add(10 * time.Minute),
	}
	err := s.DB.Create(authCode).Error
	if err != nil {
		return nil, err
	}
	return authCode, nil
}

// GetAuthorizationCodeByCode récupère un code d'autorisation par son code
func (s *OAuthService) GetAuthorizationCodeByCode(code string) (*models.OAuthAuthorizationCode, error) {
	var authCode models.OAuthAuthorizationCode
	err := s.DB.Where("code = ? AND expires_at > ?", code, time.Now()).First(&authCode).Error
	if err != nil {
		return nil, err
	}
	return &authCode, nil
}

// DeleteAuthorizationCode supprime un code d'autorisation
func (s *OAuthService) DeleteAuthorizationCode(code string) error {
	return s.DB.Where("code = ?", code).Delete(&models.OAuthAuthorizationCode{}).Error
}

// CreateAccessToken crée un token d'accès
func (s *OAuthService) CreateAccessToken(token, clientID string, userID string, scopes []string) (*models.OAuthAccessToken, error) {
	accessToken := &models.OAuthAccessToken{
		Token:     token,
		ClientID:  clientID,
		UserID:    userID,
		Scopes:    scopes,
		ExpiresAt: time.Now().Add(time.Duration(config.LoadConfig().AccessTokenExp) * time.Minute),
	}
	err := s.DB.Create(accessToken).Error
	if err != nil {
		return nil, err
	}
	return accessToken, nil
}

// GetAccessTokenByToken récupère un token d'accès par son token
func (s *OAuthService) GetAccessTokenByToken(token string) (*models.OAuthAccessToken, error) {
	var accessToken models.OAuthAccessToken
	err := s.DB.Where("token = ? AND expires_at > ?", token, time.Now()).First(&accessToken).Error
	if err != nil {
		return nil, err
	}
	return &accessToken, nil
}

// RevokeAccessToken révoque un token d'accès
func (s *OAuthService) RevokeAccessToken(token string) error {
	return s.DB.Where("token = ?", token).Delete(&models.OAuthAccessToken{}).Error
}

// CreateRefreshToken crée un token de rafraîchissement
func (s *OAuthService) CreateRefreshToken(token, clientID string, userID string) (*models.OAuthRefreshToken, error) {
	refreshToken := &models.OAuthRefreshToken{
		Token:     token,
		ClientID:  clientID,
		UserID:    userID,
		ExpiresAt: time.Now().Add(time.Duration(config.LoadConfig().RefreshTokenExp) * time.Minute),
	}
	err := s.DB.Create(refreshToken).Error
	if err != nil {
		return nil, err
	}
	return refreshToken, nil
}

// GetRefreshTokenByToken récupère un token de rafraîchissement par son token
func (s *OAuthService) GetRefreshTokenByToken(token string) (*models.OAuthRefreshToken, error) {
	var refreshToken models.OAuthRefreshToken
	err := s.DB.Where("token = ? AND expires_at > ?", token, time.Now()).First(&refreshToken).Error
	if err != nil {
		return nil, err
	}
	return &refreshToken, nil
}

// RevokeRefreshToken révoque un token de rafraîchissement
func (s *OAuthService) RevokeRefreshToken(token string) error {
	return s.DB.Where("token = ?", token).Delete(&models.OAuthRefreshToken{}).Error
}

// CreateConsent crée un consentement utilisateur
func (s *OAuthService) CreateConsent(userID string, clientID string, scopes []string) (*models.OAuthConsent, error) {
	consent := &models.OAuthConsent{
		UserID:   userID,
		ClientID: clientID,
		Scopes:   scopes,
	}
	err := s.DB.Create(consent).Error
	if err != nil {
		return nil, err
	}
	return consent, nil
}

// GetConsentByUserAndClient récupère un consentement par utilisateur et client
func (s *OAuthService) GetConsentByUserAndClient(userID string, clientID string) (*models.OAuthConsent, error) {
	var consent models.OAuthConsent
	err := s.DB.Where("user_id = ? AND client_id = ?", userID, clientID).First(&consent).Error
	if err != nil {
		return nil, err
	}
	return &consent, nil
}

// ParseScopes parse une chaîne de scopes en tableau
func ParseScopes(scopeString string) []string {
	if scopeString == "" {
		return []string{}
	}
	return strings.Split(scopeString, " ")
}

// ValidateScopes valide les scopes demandés contre les scopes autorisés
func (s *OAuthService) ValidateScopes(requestedScopes, allowedScopes []string) ([]string, error) {
	var validScopes []string

	for _, requestedScope := range requestedScopes {
		for _, allowedScope := range allowedScopes {
			if requestedScope == allowedScope {
				validScopes = append(validScopes, requestedScope)
				break
			}
		}
	}

	if len(validScopes) == 0 {
		return nil, errors.New("invalid scope")
	}

	return validScopes, nil
}

// GenerateIDToken génère un ID token OpenID Connect
func (s *OAuthService) GenerateIDToken(user *models.User, client *models.OAuthClient, scopes []string, nonce string) (string, error) {
	claims := jwt.MapClaims{
		"sub":            user.ID,
		"email":          user.Email,
		"name":           user.Name,
		"email_verified": user.EmailVerified,
		"aud":            client.ClientID,
		"iss":            "https://aether-identity.example.com",
		"exp":            time.Now().Add(time.Duration(config.LoadConfig().AccessTokenExp) * time.Minute).Unix(),
		"iat":            time.Now().Unix(),
	}

	if nonce != "" {
		claims["nonce"] = nonce
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.JWTService.SecretKey))
}

// GenerateAccessToken génère un token d'accès OAuth2
func (s *OAuthService) GenerateAccessToken(user *models.User, client *models.OAuthClient, scopes []string) (string, error) {
	claims := jwt.MapClaims{
		"sub":            user.ID,
		"email":          user.Email,
		"name":           user.Name,
		"email_verified": user.EmailVerified,
		"client_id":      client.ClientID,
		"scopes":         strings.Join(scopes, " "),
		"exp":            time.Now().Add(time.Duration(config.LoadConfig().AccessTokenExp) * time.Minute).Unix(),
		"iat":            time.Now().Unix(),
		"token_type":     "access_token",
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.JWTService.SecretKey))
}

// GenerateRefreshToken génère un token de rafraîchissement OAuth2
func (s *OAuthService) GenerateRefreshToken(userID string, clientID string) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":       userID,
		"client_id": clientID,
		"exp":       time.Now().Add(time.Duration(config.LoadConfig().RefreshTokenExp) * time.Minute).Unix(),
		"iat":       time.Now().Unix(),
		"type":      "refresh_token",
	})

	return token.SignedString([]byte(s.JWTService.SecretKey))
}

// ValidateToken valide un token OAuth2
func (s *OAuthService) ValidateToken(tokenString string) (*jwt.Token, error) {
	return jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(s.JWTService.SecretKey), nil
	})
}

// ExtractTokenFromRequest extrait le token d'accès d'une requête
func ExtractTokenFromRequest(c interface{}) (string, error) {
	// Cette méthode sera implémentée dans le middleware
	return "", nil
}
