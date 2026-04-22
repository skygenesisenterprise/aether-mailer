package services

import (
	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
	"gorm.io/gorm"
)

type SettingsService struct {
	DB *gorm.DB
}

func NewSettingsService(db *gorm.DB) *SettingsService {
	return &SettingsService{DB: db}
}

func (s *SettingsService) GetSystemSettings() (*models.SystemSettings, error) {
	var settings models.SystemSettings
	if err := s.DB.First(&settings).Error; err != nil {
		return nil, err
	}
	return &settings, nil
}

func (s *SettingsService) UpdateSystemSettings(settings *models.SystemSettings) error {
	return s.DB.Save(settings).Error
}

func (s *SettingsService) GetGeneralSettings(tenantID string) (*models.GeneralSettings, error) {
	var settings models.GeneralSettings
	if err := s.DB.Where("tenant_id = ?", tenantID).First(&settings).Error; err != nil {
		return nil, err
	}
	return &settings, nil
}

func (s *SettingsService) CreateGeneralSettings(settings *models.GeneralSettings) error {
	return s.DB.Create(settings).Error
}

func (s *SettingsService) UpdateGeneralSettings(settings *models.GeneralSettings) error {
	return s.DB.Save(settings).Error
}

func (s *SettingsService) GetDockerSettings(tenantID string) (*models.DockerSettings, error) {
	var settings models.DockerSettings
	if err := s.DB.Where("tenant_id = ?", tenantID).First(&settings).Error; err != nil {
		return nil, err
	}
	return &settings, nil
}

func (s *SettingsService) CreateDockerSettings(settings *models.DockerSettings) error {
	return s.DB.Create(settings).Error
}

func (s *SettingsService) UpdateDockerSettings(settings *models.DockerSettings) error {
	return s.DB.Save(settings).Error
}

func (s *SettingsService) GetFeatureFlag(name string) (*models.FeatureFlag, error) {
	var flag models.FeatureFlag
	if err := s.DB.Where("name = ?", name).First(&flag).Error; err != nil {
		return nil, err
	}
	return &flag, nil
}

func (s *SettingsService) GetFeatureFlags(tenantID string) ([]models.FeatureFlag, error) {
	var flags []models.FeatureFlag
	if err := s.DB.Where("tenant_id = ? OR tenant_id IS NULL", tenantID).Find(&flags).Error; err != nil {
		return nil, err
	}
	return flags, nil
}

func (s *SettingsService) CreateFeatureFlag(flag *models.FeatureFlag) error {
	return s.DB.Create(flag).Error
}

func (s *SettingsService) UpdateFeatureFlag(flag *models.FeatureFlag) error {
	return s.DB.Save(flag).Error
}

func (s *SettingsService) DeleteFeatureFlag(id string) error {
	return s.DB.Delete(&models.FeatureFlag{}, "id = ?", id).Error
}
