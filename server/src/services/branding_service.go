package services

import (
	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
	"gorm.io/gorm"
)

type BrandingService struct {
	DB *gorm.DB
}

func NewBrandingService(db *gorm.DB) *BrandingService {
	return &BrandingService{DB: db}
}

func (s *BrandingService) CreateBranding(branding *models.Branding) error {
	return s.DB.Create(branding).Error
}

func (s *BrandingService) GetBranding(id string) (*models.Branding, error) {
	var branding models.Branding
	if err := s.DB.First(&branding, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &branding, nil
}

func (s *BrandingService) GetBrandingByTenant(tenantID string) (*models.Branding, error) {
	var branding models.Branding
	if err := s.DB.Where("tenant_id = ?", tenantID).First(&branding).Error; err != nil {
		return nil, err
	}
	return &branding, nil
}

func (s *BrandingService) UpdateBranding(branding *models.Branding) error {
	return s.DB.Save(branding).Error
}

func (s *BrandingService) DeleteBranding(id string) error {
	return s.DB.Delete(&models.Branding{}, "id = ?", id).Error
}

func (s *BrandingService) CreateUniversalLoginConfig(config *models.UniversalLoginConfig) error {
	return s.DB.Create(config).Error
}

func (s *BrandingService) GetUniversalLoginConfig(id string) (*models.UniversalLoginConfig, error) {
	var config models.UniversalLoginConfig
	if err := s.DB.First(&config, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &config, nil
}

func (s *BrandingService) ListUniversalLoginConfigs() ([]models.UniversalLoginConfig, error) {
	var configs []models.UniversalLoginConfig
	if err := s.DB.Find(&configs).Error; err != nil {
		return nil, err
	}
	return configs, nil
}

func (s *BrandingService) UpdateUniversalLoginConfig(config *models.UniversalLoginConfig) error {
	return s.DB.Save(config).Error
}

func (s *BrandingService) DeleteUniversalLoginConfig(id string) error {
	return s.DB.Delete(&models.UniversalLoginConfig{}, "id = ?", id).Error
}

func (s *BrandingService) CreateLoginPage(page *models.LoginPage) error {
	return s.DB.Create(page).Error
}

func (s *BrandingService) GetLoginPage(id string) (*models.LoginPage, error) {
	var page models.LoginPage
	if err := s.DB.First(&page, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &page, nil
}

func (s *BrandingService) UpdateLoginPage(page *models.LoginPage) error {
	return s.DB.Save(page).Error
}

func (s *BrandingService) DeleteLoginPage(id string) error {
	return s.DB.Delete(&models.LoginPage{}, "id = ?", id).Error
}

func (s *BrandingService) CreateCustomDomain(domain *models.CustomDomain) error {
	return s.DB.Create(domain).Error
}

func (s *BrandingService) GetCustomDomain(id string) (*models.CustomDomain, error) {
	var domain models.CustomDomain
	if err := s.DB.First(&domain, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &domain, nil
}

func (s *BrandingService) GetCustomDomainByName(domain string) (*models.CustomDomain, error) {
	var customDomain models.CustomDomain
	if err := s.DB.Where("domain = ?", domain).First(&customDomain).Error; err != nil {
		return nil, err
	}
	return &customDomain, nil
}

func (s *BrandingService) ListCustomDomains() ([]models.CustomDomain, error) {
	var domains []models.CustomDomain
	if err := s.DB.Find(&domains).Error; err != nil {
		return nil, err
	}
	return domains, nil
}

func (s *BrandingService) UpdateCustomDomain(domain *models.CustomDomain) error {
	return s.DB.Save(domain).Error
}

func (s *BrandingService) DeleteCustomDomain(id string) error {
	return s.DB.Delete(&models.CustomDomain{}, "id = ?", id).Error
}

func (s *BrandingService) CreateTemplate(template *models.BrandingTemplate) error {
	return s.DB.Create(template).Error
}

func (s *BrandingService) GetTemplate(id string) (*models.BrandingTemplate, error) {
	var template models.BrandingTemplate
	if err := s.DB.First(&template, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &template, nil
}

func (s *BrandingService) ListTemplates() ([]models.BrandingTemplate, error) {
	var templates []models.BrandingTemplate
	if err := s.DB.Find(&templates).Error; err != nil {
		return nil, err
	}
	return templates, nil
}

func (s *BrandingService) UpdateTemplate(template *models.BrandingTemplate) error {
	return s.DB.Save(template).Error
}

func (s *BrandingService) DeleteTemplate(id string) error {
	return s.DB.Delete(&models.BrandingTemplate{}, "id = ?", id).Error
}
