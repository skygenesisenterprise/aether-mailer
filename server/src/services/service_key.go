package services

import (
	"errors"
	"time"

	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
	"gorm.io/gorm"
)

// ServiceKeyService handles service key operations
type ServiceKeyService struct {
	DB *gorm.DB
}

// NewServiceKeyService creates a new ServiceKeyService
func NewServiceKeyService(db *gorm.DB) *ServiceKeyService {
	return &ServiceKeyService{DB: db}
}

// CreateServiceKey creates a new service key
func (s *ServiceKeyService) CreateServiceKey(name, description string, expiresAt *time.Time, createdBy uint) (*models.ServiceKey, error) {
	// Generate a new service key
	generator := models.NewServiceKeyGenerator()
	key := generator.Generate()

	serviceKey := &models.ServiceKey{
		Key:         key,
		Name:        name,
		Description: description,
		IsActive:    true,
		ExpiresAt:   expiresAt,
		CreatedBy:   createdBy,
		UpdatedBy:   createdBy,
	}

	err := s.DB.Create(serviceKey).Error
	if err != nil {
		return nil, err
	}

	return serviceKey, nil
}

// GetServiceKey retrieves a service key by ID
func (s *ServiceKeyService) GetServiceKey(id uint) (*models.ServiceKey, error) {
	var serviceKey models.ServiceKey
	err := s.DB.First(&serviceKey, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("service key not found")
		}
		return nil, err
	}

	return &serviceKey, nil
}

// GetServiceKeyByKey retrieves a service key by its key
func (s *ServiceKeyService) GetServiceKeyByKey(key string) (*models.ServiceKey, error) {
	var serviceKey models.ServiceKey
	err := s.DB.Where("key = ?", key).First(&serviceKey).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("service key not found")
		}
		return nil, err
	}

	return &serviceKey, nil
}

// UpdateServiceKey updates a service key
func (s *ServiceKeyService) UpdateServiceKey(id uint, name, description string, isActive bool, expiresAt *time.Time, updatedBy uint) (*models.ServiceKey, error) {
	serviceKey, err := s.GetServiceKey(id)
	if err != nil {
		return nil, err
	}

	serviceKey.Name = name
	serviceKey.Description = description
	serviceKey.IsActive = isActive
	serviceKey.ExpiresAt = expiresAt
	serviceKey.UpdatedBy = updatedBy

	err = s.DB.Save(serviceKey).Error
	if err != nil {
		return nil, err
	}

	return serviceKey, nil
}

// DeleteServiceKey deletes a service key
func (s *ServiceKeyService) DeleteServiceKey(id uint) error {
	serviceKey, err := s.GetServiceKey(id)
	if err != nil {
		return err
	}

	err = s.DB.Delete(serviceKey).Error
	if err != nil {
		return err
	}

	return nil
}

// ListServiceKeys lists all service keys
func (s *ServiceKeyService) ListServiceKeys(limit, offset int) ([]models.ServiceKey, int64, error) {
	var serviceKeys []models.ServiceKey
	var count int64

	result := s.DB.Model(&models.ServiceKey{}).Count(&count)
	if result.Error != nil {
		return nil, 0, result.Error
	}

	result = s.DB.Limit(limit).Offset(offset).Find(&serviceKeys)
	if result.Error != nil {
		return nil, 0, result.Error
	}

	return serviceKeys, count, nil
}

// ValidateServiceKey validates a service key
func (s *ServiceKeyService) ValidateServiceKey(key string) (bool, error) {
	serviceKey, err := s.GetServiceKeyByKey(key)
	if err != nil {
		return false, err
	}

	// Check if key is active
	if !serviceKey.IsActive {
		return false, errors.New("service key is inactive")
	}

	// Check if key has expired
	if serviceKey.ExpiresAt != nil && time.Now().After(*serviceKey.ExpiresAt) {
		return false, errors.New("service key has expired")
	}

	return true, nil
}

// LogServiceKeyUsage logs the usage of a service key
func (s *ServiceKeyService) LogServiceKeyUsage(serviceKeyID uint, endpoint, method, ipAddress, userAgent string, statusCode int) error {
	usage := &models.ServiceKeyUsage{
		ServiceKeyID: serviceKeyID,
		Endpoint:     endpoint,
		Method:       method,
		IPAddress:    ipAddress,
		StatusCode:   statusCode,
		UserAgent:    userAgent,
	}

	err := s.DB.Create(usage).Error
	if err != nil {
		return err
	}

	return nil
}

// ListServiceKeysByUser lists all service keys created by a specific user with pagination
func (s *ServiceKeyService) ListServiceKeysByUser(userID uint, page, limit int) ([]models.ServiceKey, int64, error) {
	var serviceKeys []models.ServiceKey
	var count int64

	// Count total keys for this user
	result := s.DB.Model(&models.ServiceKey{}).Where("created_by = ?", userID).Count(&count)
	if result.Error != nil {
		return nil, 0, result.Error
	}

	offset := (page - 1) * limit

	// Get keys for this user with pagination
	result = s.DB.Where("created_by = ?", userID).
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&serviceKeys)
	if result.Error != nil {
		return nil, 0, result.Error
	}

	return serviceKeys, count, nil
}

// EnsureSystemKey ensures the system key exists in the database
func (s *ServiceKeyService) EnsureSystemKey(systemKey string) error {
	if s.DB == nil {
		return errors.New("database not initialized")
	}

	var existingKey models.ServiceKey
	err := s.DB.Where("key = ? AND name = ?", systemKey, "System Key").First(&existingKey).Error

	if err == nil {
		return nil
	}

	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}

	systemKeyRecord := &models.ServiceKey{
		Key:         systemKey,
		Name:        "System Key",
		Description: "System key used by the application for internal requests",
		IsActive:    true,
		CreatedBy:   0,
		UpdatedBy:   0,
	}

	return s.DB.Create(systemKeyRecord).Error
}
