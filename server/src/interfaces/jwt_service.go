package interfaces

import (
	"github.com/golang-jwt/jwt/v5"
	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
)

// JWTService définit l'interface pour les opérations JWT
type JWTService interface {
	GenerateToken(user *models.User) (string, error)
	GenerateRefreshToken(userID uint) (string, error)
	ValidateToken(tokenString string) (*jwt.Token, error)
	ExtractClaims(tokenString string) (jwt.MapClaims, error)
}
