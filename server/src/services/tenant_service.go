package services

import (
	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
	"gorm.io/gorm"
)

type TenantService struct {
	DB *gorm.DB
}

func NewTenantService(db *gorm.DB) *TenantService {
	return &TenantService{DB: db}
}

func (s *TenantService) CreateTenant(tenant *models.Tenant) error {
	return s.DB.Create(tenant).Error
}

func (s *TenantService) GetTenant(id string) (*models.Tenant, error) {
	var tenant models.Tenant
	if err := s.DB.First(&tenant, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &tenant, nil
}

func (s *TenantService) GetTenantBySlug(slug string) (*models.Tenant, error) {
	var tenant models.Tenant
	if err := s.DB.Where("slug = ?", slug).First(&tenant).Error; err != nil {
		return nil, err
	}
	return &tenant, nil
}

func (s *TenantService) ListTenants() ([]models.Tenant, error) {
	var tenants []models.Tenant
	if err := s.DB.Find(&tenants).Error; err != nil {
		return nil, err
	}
	return tenants, nil
}

func (s *TenantService) UpdateTenant(tenant *models.Tenant) error {
	return s.DB.Save(tenant).Error
}

func (s *TenantService) DeleteTenant(id string) error {
	return s.DB.Delete(&models.Tenant{}, "id = ?", id).Error
}

func (s *TenantService) CreateTenantUsage(usage *models.TenantUsage) error {
	return s.DB.Create(usage).Error
}

func (s *TenantService) GetTenantUsage(tenantID string) (*models.TenantUsage, error) {
	var usage models.TenantUsage
	if err := s.DB.Where("tenant_id = ?", tenantID).Order("period_start DESC").First(&usage).Error; err != nil {
		return nil, err
	}
	return &usage, nil
}

func (s *TenantService) ListTenantUsage(tenantID string) ([]models.TenantUsage, error) {
	var usages []models.TenantUsage
	if err := s.DB.Where("tenant_id = ?", tenantID).Order("period_start DESC").Find(&usages).Error; err != nil {
		return nil, err
	}
	return usages, nil
}

func (s *TenantService) UpdateTenantUsage(usage *models.TenantUsage) error {
	return s.DB.Save(usage).Error
}

func (s *TenantService) GetBillingInfo(tenantID string) (*models.BillingInfo, error) {
	var billing models.BillingInfo
	if err := s.DB.Where("tenant_id = ?", tenantID).First(&billing).Error; err != nil {
		return nil, err
	}
	return &billing, nil
}

func (s *TenantService) CreateBillingInfo(billing *models.BillingInfo) error {
	return s.DB.Create(billing).Error
}

func (s *TenantService) UpdateBillingInfo(billing *models.BillingInfo) error {
	return s.DB.Save(billing).Error
}
