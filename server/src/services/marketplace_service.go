package services

import (
	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
	"gorm.io/gorm"
)

type MarketplaceService struct {
	DB *gorm.DB
}

func NewMarketplaceService(db *gorm.DB) *MarketplaceService {
	return &MarketplaceService{DB: db}
}

func (s *MarketplaceService) CreateMarketplaceIntegration(integration *models.MarketplaceIntegration) error {
	return s.DB.Create(integration).Error
}

func (s *MarketplaceService) GetMarketplaceIntegration(id string) (*models.MarketplaceIntegration, error) {
	var integration models.MarketplaceIntegration
	if err := s.DB.First(&integration, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &integration, nil
}

func (s *MarketplaceService) GetMarketplaceIntegrationByName(name string) (*models.MarketplaceIntegration, error) {
	var integration models.MarketplaceIntegration
	if err := s.DB.Where("name = ?", name).First(&integration).Error; err != nil {
		return nil, err
	}
	return &integration, nil
}

func (s *MarketplaceService) ListMarketplaceIntegrations() ([]models.MarketplaceIntegration, error) {
	var integrations []models.MarketplaceIntegration
	if err := s.DB.Find(&integrations).Error; err != nil {
		return nil, err
	}
	return integrations, nil
}

func (s *MarketplaceService) ListInstalledIntegrations() ([]models.MarketplaceIntegration, error) {
	var integrations []models.MarketplaceIntegration
	if err := s.DB.Where("is_installed = true").Find(&integrations).Error; err != nil {
		return nil, err
	}
	return integrations, nil
}

func (s *MarketplaceService) UpdateMarketplaceIntegration(integration *models.MarketplaceIntegration) error {
	return s.DB.Save(integration).Error
}

func (s *MarketplaceService) DeleteMarketplaceIntegration(id string) error {
	return s.DB.Delete(&models.MarketplaceIntegration{}, "id = ?", id).Error
}
