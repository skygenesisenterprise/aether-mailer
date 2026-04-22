package services

import (
	"errors"
	"strings"
	"time"

	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
	"gorm.io/gorm"
)

// DomainService gère les opérations liées aux domaines
type DomainService struct {
	DB *gorm.DB
}

// NewDomainService crée une nouvelle instance de DomainService
func NewDomainService(db *gorm.DB) *DomainService {
	return &DomainService{DB: db}
}

// CreateDomain crée un nouveau domaine
func (s *DomainService) CreateDomain(domain *models.Domain) error {
	// Vérifier si le domaine existe déjà
	var existing models.Domain
	if err := s.DB.Where("name = ?", domain.Name).First(&existing).Error; err == nil {
		return errors.New("domain already exists")
	}

	// Si c'est un domaine interne, définir les valeurs par défaut
	if domain.IsInternal {
		domain.DisplayName = &domain.Name
		domain.IsActive = true
	}

	return s.DB.Create(domain).Error
}

// GetDomainByID récupère un domaine par son ID
func (s *DomainService) GetDomainByID(id string) (*models.Domain, error) {
	var domain models.Domain
	err := s.DB.First(&domain, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &domain, nil
}

// GetDomainByName récupère un domaine par son nom
func (s *DomainService) GetDomainByName(name string) (*models.Domain, error) {
	var domain models.Domain
	err := s.DB.Where("name = ?", name).First(&domain).Error
	if err != nil {
		return nil, err
	}
	return &domain, nil
}

// ListDomains liste tous les domaines
func (s *DomainService) ListDomains() ([]models.Domain, error) {
	var domains []models.Domain
	err := s.DB.Find(&domains).Error
	if err != nil {
		return nil, err
	}
	return domains, nil
}

// ListDomainsByOrganization liste les domaines par organisation
func (s *DomainService) ListDomainsByOrganization(orgID string) ([]models.Domain, error) {
	var domains []models.Domain
	err := s.DB.Where("organization_id = ?", orgID).Find(&domains).Error
	if err != nil {
		return nil, err
	}
	return domains, nil
}

// UpdateDomain met à jour un domaine
func (s *DomainService) UpdateDomain(domain *models.Domain) error {
	return s.DB.Save(domain).Error
}

// DeleteDomain supprime un domaine
func (s *DomainService) DeleteDomain(id string) error {
	return s.DB.Delete(&models.Domain{}, "id = ?", id).Error
}

// VerifyDomain vérifie un domaine
func (s *DomainService) VerifyDomain(domainID string, method string, value string) error {
	// Créer ou mettre à jour la vérification
	token, err := GenerateRandomString(32)
	if err != nil {
		return err
	}

	now := time.Now()
	verification := &models.DomainVerification{
		DomainID:   domainID,
		Method:     method,
		Value:      value,
		Token:      token,
		IsVerified: true,
		VerifiedAt: &now,
	}

	return s.DB.Save(verification).Error
}

// AddUserToDomain ajoute un utilisateur à un domaine
func (s *DomainService) AddUserToDomain(domainID string, userID string, isAdmin bool, isOwner bool) error {
	domainUser := &models.UserDomain{
		DomainID: domainID,
		UserID:   userID,
		IsAdmin:  isAdmin,
		IsOwner:  isOwner,
		JoinedAt: time.Now(),
	}

	return s.DB.Create(domainUser).Error
}

// RemoveUserFromDomain retire un utilisateur d'un domaine
func (s *DomainService) RemoveUserFromDomain(domainID string, userID string) error {
	return s.DB.Where("domain_id = ? AND user_id = ?", domainID, userID).Delete(&models.UserDomain{}).Error
}

// GetUsersByDomain récupère les utilisateurs d'un domaine
func (s *DomainService) GetUsersByDomain(domainID string) ([]models.User, error) {
	var users []models.User
	err := s.DB.Joins("JOIN user_domains ON user_domains.user_id = users.id").
		Where("user_domains.domain_id = ?", domainID).Find(&users).Error
	if err != nil {
		return nil, err
	}
	return users, nil
}

// GetDomainsForUser récupère les domaines d'un utilisateur
func (s *DomainService) GetDomainsForUser(userID string) ([]models.Domain, error) {
	var domains []models.Domain
	err := s.DB.Joins("JOIN user_domains ON user_domains.domain_id = domains.id").
		Where("user_domains.user_id = ?", userID).Find(&domains).Error
	if err != nil {
		return nil, err
	}
	return domains, nil
}

// IsUserDomainAdmin vérifie si un utilisateur est administrateur d'un domaine
func (s *DomainService) IsUserDomainAdmin(userID string, domainID string) (bool, error) {
	var count int64
	err := s.DB.Model(&models.UserDomain{}).
		Where("user_id = ? AND domain_id = ? AND is_admin = true", userID, domainID).
		Count(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

// IsUserDomainOwner vérifie si un utilisateur est propriétaire d'un domaine
func (s *DomainService) IsUserDomainOwner(userID string, domainID string) (bool, error) {
	var count int64
	err := s.DB.Model(&models.UserDomain{}).
		Where("user_id = ? AND domain_id = ? AND is_owner = true", userID, domainID).
		Count(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

// GetDomainUserCount récupère le nombre d'utilisateurs d'un domaine
func (s *DomainService) GetDomainUserCount(domainID string) (int, error) {
	var count int64
	err := s.DB.Model(&models.UserDomain{}).
		Where("domain_id = ?", domainID).
		Count(&count).Error
	if err != nil {
		return 0, err
	}
	return int(count), nil
}

// CreateDomainSettings crée ou met à jour les paramètres d'un domaine
func (s *DomainService) CreateDomainSettings(settings *models.DomainSettings) error {
	return s.DB.Save(settings).Error
}

// GetDomainSettings récupère les paramètres d'un domaine
func (s *DomainService) GetDomainSettings(domainID string) (*models.DomainSettings, error) {
	var settings models.DomainSettings
	err := s.DB.Where("domain_id = ?", domainID).First(&settings).Error
	if err != nil {
		return nil, err
	}
	return &settings, nil
}

// IsDomainActive vérifie si un domaine est actif
func (s *DomainService) IsDomainActive(domainName string) (bool, error) {
	var domain models.Domain
	err := s.DB.Where("name = ? AND is_active = true", domainName).First(&domain).Error
	if err != nil {
		return false, err
	}
	return true, nil
}

// IsEmailFromManagedDomain vérifie si une adresse email appartient à un domaine géré
func (s *DomainService) IsEmailFromManagedDomain(email string) (bool, *models.Domain, error) {
	// Extraire le domaine de l'email
	parts := strings.Split(email, "@")
	if len(parts) != 2 {
		return false, nil, nil
	}
	domainName := parts[1]

	var domain models.Domain
	err := s.DB.Where("name = ? AND is_active = true", domainName).First(&domain).Error
	if err != nil {
		return false, nil, err
	}

	return true, &domain, nil
}

// GetDomainWithDetails récupère un domaine avec ses informations détaillées
func (s *DomainService) GetDomainWithDetails(domainID string) (*models.DomainWithDetails, error) {
	// Récupérer le domaine
	domain, err := s.GetDomainByID(domainID)
	if err != nil {
		return nil, err
	}

	// Récupérer le nombre d'utilisateurs
	userCount, err := s.GetDomainUserCount(domainID)
	if err != nil {
		return nil, err
	}

	// Récupérer la vérification
	var verification *models.DomainVerification
	s.DB.Where("domain_id = ?", domainID).First(&verification)

	// Récupérer les paramètres
	var settings *models.DomainSettings
	s.DB.Where("domain_id = ?", domainID).First(&settings)

	// Construire la réponse
	result := &models.DomainWithDetails{
		Domain:       *domain,
		UserCount:    userCount,
		IsVerified:   verification != nil && verification.IsVerified,
		Verification: verification,
		Settings:     settings,
	}

	return result, nil
}

// InitializeDefaultDomains initialise les domaines par défaut
func (s *DomainService) InitializeDefaultDomains() error {
	defaultDomains := []string{
		"aethermail.com",
		"skygenesisenterprise.com",
		"aethermail.fr",
		"skygenesisenterprise.fr",
	}

	for _, domainName := range defaultDomains {
		// Vérifier si le domaine existe déjà
		var existing models.Domain
		if err := s.DB.Where("name = ?", domainName).First(&existing).Error; err == nil {
			// Le domaine existe déjà, le mettre à jour
			existing.IsInternal = true
			existing.IsActive = true
			existing.DisplayName = &domainName
			if err := s.DB.Save(&existing).Error; err != nil {
				return err
			}
		} else {
			// Créer le domaine
			domain := models.Domain{
				Name:        domainName,
				DisplayName: &domainName,
				IsInternal:  true,
				IsActive:    true,
			}
			if err := s.DB.Create(&domain).Error; err != nil {
				return err
			}
		}
	}

	return nil
}
