package services

import (
	"errors"
	"strings"

	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// UserService gère les opérations liées aux utilisateurs
type UserService struct {
	DB *gorm.DB
}

// NewUserService crée une nouvelle instance de UserService
func NewUserService(db *gorm.DB) *UserService {
	return &UserService{DB: db}
}

// CreateUser crée un nouvel utilisateur avec validation
func (s *UserService) CreateUser(user *models.User, password string) error {
	// Vérifier si l'email existe déjà
	if user.Email != nil {
		existingUser, _ := s.GetUserByEmail(*user.Email)
		if existingUser != nil {
			return errors.New("email already exists")
		}
	}

	// Hacher le mot de passe
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	hashStr := string(hashedPassword)
	user.PasswordHash = &hashStr

	// Sauvegarder dans la base de données
	return s.DB.Create(user).Error
}

// CheckEmailExists vérifie si un email existe déjà
func (s *UserService) CheckEmailExists(email string) bool {
	var count int64
	s.DB.Model(&models.User{}).Where("email = ?", email).Count(&count)
	return count > 0
}

// GetUserByID récupère un utilisateur par son ID
func (s *UserService) GetUserByID(id string) (*models.User, error) {
	var user models.User
	if err := s.DB.First(&user, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

// GetUserByEmail récupère un utilisateur par son email
func (s *UserService) GetUserByEmail(email string) (*models.User, error) {
	var user models.User
	if err := s.DB.Where("email = ?", email).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

// UpdateUser met à jour un utilisateur
func (s *UserService) UpdateUser(user *models.User, newPassword *string) error {
	// Si le mot de passe est fourni, le hacher
	if newPassword != nil && *newPassword != "" {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(*newPassword), bcrypt.DefaultCost)
		if err != nil {
			return err
		}
		hashStr := string(hashedPassword)
		user.PasswordHash = &hashStr
	}

	return s.DB.Save(user).Error
}

// DeleteUser supprime un utilisateur
func (s *UserService) DeleteUser(id string) error {
	return s.DB.Delete(&models.User{}, "id = ?", id).Error
}

// AuthenticateUser authentifie un utilisateur
func (s *UserService) AuthenticateUser(email, password string) (*models.User, error) {
	user, err := s.GetUserByEmail(email)
	if err != nil {
		return nil, err
	}

	// Vérifier le mot de passe
	if user.PasswordHash == nil {
		return nil, errors.New("no password set")
	}

	hashToCheck := *user.PasswordHash
	// Convertir $2b$ en $2a$ pour la compatibilité avec les hashes générés par Node.js
	if strings.HasPrefix(hashToCheck, "$2b$") {
		hashToCheck = "$2a$" + hashToCheck[4:]
	}

	if err := bcrypt.CompareHashAndPassword([]byte(hashToCheck), []byte(password)); err != nil {
		return nil, errors.New("invalid password")
	}

	return user, nil
}

// UserToResponse convertit un modèle User en une réponse appropriée
func (s *UserService) UserToResponse(user *models.User) map[string]interface{} {
	return map[string]interface{}{
		"id":             user.ID,
		"email":          user.Email,
		"name":           user.Name,
		"created_at":     user.CreatedAt,
		"updated_at":     user.UpdatedAt,
		"email_verified": user.EmailVerified,
		"is_active":      user.IsActive,
	}
}

// ListUsersFilter représente les filtres pour la liste des utilisateurs
type ListUsersFilter struct {
	IsActive  *bool
	Search    string
	SortBy    string
	SortOrder string
}

// ListUsersResponse représente la réponse paginée de la liste des utilisateurs
type ListUsersResponse struct {
	Users      []models.User `json:"users"`
	Total      int64         `json:"total"`
	Page       int           `json:"page"`
	Limit      int           `json:"limit"`
	TotalPages int           `json:"totalPages"`
}

// ListUsers récupère la liste des utilisateurs avec pagination et filtres
func (s *UserService) ListUsers(page, limit int, filter ListUsersFilter) (*ListUsersResponse, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	offset := (page - 1) * limit

	// Construire la requête de base
	query := s.DB.Model(&models.User{})

	// Appliquer les filtres
	if filter.IsActive != nil {
		query = query.Where("is_active = ?", *filter.IsActive)
	}
	if filter.Search != "" {
		searchPattern := "%" + filter.Search + "%"
		query = query.Where(
			"name ILIKE ? OR email ILIKE ?",
			searchPattern,
			searchPattern,
		)
	}

	// Compter le total
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, err
	}

	// Appliquer le tri
	sortBy := filter.SortBy
	if sortBy == "" {
		sortBy = "created_at"
	}
	sortOrder := filter.SortOrder
	if sortOrder != "asc" && sortOrder != "desc" {
		sortOrder = "desc"
	}
	orderClause := sortBy + " " + sortOrder

	// Récupérer les utilisateurs
	var users []models.User
	if err := query.Order(orderClause).Limit(limit).Offset(offset).Find(&users).Error; err != nil {
		return nil, err
	}

	totalPages := int((total + int64(limit) - 1) / int64(limit))

	return &ListUsersResponse{
		Users:      users,
		Total:      total,
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
	}, nil
}
