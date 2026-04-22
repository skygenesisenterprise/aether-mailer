package services

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
)

// JWTService gère la création et la validation des tokens JWT
type JWTService struct {
	SecretKey       string
	AccessTokenExp  int
	RefreshTokenExp int
}

// NewJWTService crée une nouvelle instance de JWTService
func NewJWTService(secretKey string, accessTokenExp, refreshTokenExp int) *JWTService {
	return &JWTService{
		SecretKey:       secretKey,
		AccessTokenExp:  accessTokenExp,
		RefreshTokenExp: refreshTokenExp,
	}
}

// GenerateToken crée un token JWT
func (s *JWTService) GenerateToken(user *models.User) (string, error) {
	claims := jwt.MapClaims{
		"sub":            user.ID,
		"email":          user.Email,
		"name":           user.Name,
		"email_verified": user.EmailVerified,
		"exp":            time.Now().Add(time.Duration(s.AccessTokenExp) * time.Minute).Unix(),
		"iat":            time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.SecretKey))
}

// GenerateRefreshToken crée un refresh token JWT
func (s *JWTService) GenerateRefreshToken(userID string) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":  userID,
		"exp":  time.Now().Add(time.Duration(s.RefreshTokenExp) * time.Minute).Unix(),
		"iat":  time.Now().Unix(),
		"type": "refresh",
	})

	return token.SignedString([]byte(s.SecretKey))
}

// ValidateToken valide un token JWT
func (s *JWTService) ValidateToken(tokenString string) (*jwt.Token, error) {
	return jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, jwt.ErrSignatureInvalid
		}
		return []byte(s.SecretKey), nil
	})
}

// ExtractClaims extrait les claims d'un token JWT
func (s *JWTService) ExtractClaims(tokenString string) (jwt.MapClaims, error) {
	token, err := s.ValidateToken(tokenString)
	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, jwt.ErrTokenInvalidClaims
	}

	return claims, nil
}
