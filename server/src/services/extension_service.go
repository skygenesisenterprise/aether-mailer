package services

import (
	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
	"gorm.io/gorm"
)

type ExtensionService struct {
	DB *gorm.DB
}

func NewExtensionService(db *gorm.DB) *ExtensionService {
	return &ExtensionService{DB: db}
}

func (s *ExtensionService) CreateExtension(ext *models.Extension) error {
	return s.DB.Create(ext).Error
}

func (s *ExtensionService) GetExtension(id string) (*models.Extension, error) {
	var ext models.Extension
	if err := s.DB.First(&ext, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &ext, nil
}

func (s *ExtensionService) GetExtensionByName(name string) (*models.Extension, error) {
	var ext models.Extension
	if err := s.DB.Where("name = ?", name).First(&ext).Error; err != nil {
		return nil, err
	}
	return &ext, nil
}

func (s *ExtensionService) ListExtensions() ([]models.Extension, error) {
	var extensions []models.Extension
	if err := s.DB.Find(&extensions).Error; err != nil {
		return nil, err
	}
	return extensions, nil
}

func (s *ExtensionService) UpdateExtension(ext *models.Extension) error {
	return s.DB.Save(ext).Error
}

func (s *ExtensionService) DeleteExtension(id string) error {
	return s.DB.Delete(&models.Extension{}, "id = ?", id).Error
}

func (s *ExtensionService) InstallExtension(ext *models.Extension) error {
	return s.DB.Save(ext).Error
}

func (s *ExtensionService) UninstallExtension(id string) error {
	return s.DB.Delete(&models.Extension{}, "id = ?", id).Error
}

func (s *ExtensionService) GetExtensionConfig(id string) (map[string]interface{}, error) {
	ext, err := s.GetExtension(id)
	if err != nil {
		return nil, err
	}
	return map[string]interface{}{
		"extension_id": ext.ID,
		"name":         ext.Name,
	}, nil
}

func (s *ExtensionService) UpdateExtensionConfig(id string, config map[string]interface{}) error {
	return nil
}

func (s *ExtensionService) ListUserExtensions() ([]models.Extension, error) {
	var extensions []models.Extension
	if err := s.DB.Where("type = ?", "user").Find(&extensions).Error; err != nil {
		return nil, err
	}
	return extensions, nil
}

func (s *ExtensionService) GetUserExtension(id string) (*models.Extension, error) {
	var ext models.Extension
	if err := s.DB.First(&ext, "id = ? AND type = ?", id, "user").Error; err != nil {
		return nil, err
	}
	return &ext, nil
}

func (s *ExtensionService) CreateUserExtension(ext *models.Extension) error {
	ext.Type = "user"
	return s.DB.Create(ext).Error
}

func (s *ExtensionService) UpdateUserExtension(ext *models.Extension) error {
	return s.DB.Save(ext).Error
}

func (s *ExtensionService) DeleteUserExtension(id string) error {
	return s.DB.Delete(&models.Extension{}, "id = ? AND type = ?", id, "user").Error
}

func (s *ExtensionService) ListMarketplaceExtensions() ([]models.Extension, error) {
	var extensions []models.Extension
	if err := s.DB.Where("type = ?", "marketplace").Find(&extensions).Error; err != nil {
		return nil, err
	}
	return extensions, nil
}
