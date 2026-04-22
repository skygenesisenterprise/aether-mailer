package interfaces

import "github.com/skygenesisenterprise/aether-mailer/server/src/models"

// UserRepository définit l'interface pour les opérations sur les utilisateurs
type UserRepository interface {
	CreateUser(user *models.User) error
	GetUserByID(id uint) (*models.User, error)
	GetUserByEmail(email string) (*models.User, error)
	UpdateUser(user *models.User) error
	DeleteUser(id uint) error
	AuthenticateUser(email, password string) (*models.User, error)
}
