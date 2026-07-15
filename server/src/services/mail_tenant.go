package services

import (
	"context"

	"github.com/skygenesisenterprise/aether-mailer/server/src/interfaces"
	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
	"github.com/skygenesisenterprise/aether-mailer/server/src/utils"
)

type TenantService struct {
	repos interfaces.MailRepositorySet
}

func NewTenantService(repos interfaces.MailRepositorySet) *TenantService {
	return &TenantService{repos: repos}
}

func (s *TenantService) List(ctx context.Context) ([]models.MailTenant, error) {
	return s.repos.MailTenants().List(ctx)
}

func (s *TenantService) Create(ctx context.Context, name string, maxAccounts, maxDomains, maxGroups, maxMailingLists int, maxStorageBytes int64) (*models.MailTenant, error) {
	tenant := &models.MailTenant{
		Common:          models.Common{ID: utils.NewID()},
		Name:            name,
		MaxAccounts:     maxAccounts,
		MaxStorageBytes: maxStorageBytes,
		MaxDomains:      maxDomains,
		MaxGroups:       maxGroups,
		MaxMailingLists: maxMailingLists,
	}
	if err := s.repos.MailTenants().Create(ctx, tenant); err != nil {
		return nil, err
	}
	return tenant, nil
}

func (s *TenantService) Get(ctx context.Context, id string) (*models.MailTenant, error) {
	return s.repos.MailTenants().GetByID(ctx, id)
}

func (s *TenantService) Update(ctx context.Context, id, name string) (*models.MailTenant, error) {
	tenant, err := s.repos.MailTenants().GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if name != "" {
		tenant.Name = name
	}
	return tenant, s.repos.MailTenants().Update(ctx, tenant)
}

func (s *TenantService) Delete(ctx context.Context, id string) error {
	return s.repos.MailTenants().Delete(ctx, id)
}

func (s *TenantService) GetLimits(ctx context.Context, id string) (*models.MailTenant, error) {
	return s.repos.MailTenants().GetByID(ctx, id)
}

func (s *TenantService) UpdateLimits(ctx context.Context, id string, maxAccounts, maxDomains, maxGroups, maxMailingLists int, maxStorageBytes int64) (*models.MailTenant, error) {
	tenant, err := s.repos.MailTenants().GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	tenant.MaxAccounts = maxAccounts
	tenant.MaxStorageBytes = maxStorageBytes
	tenant.MaxDomains = maxDomains
	tenant.MaxGroups = maxGroups
	tenant.MaxMailingLists = maxMailingLists
	return tenant, s.repos.MailTenants().Update(ctx, tenant)
}

func (s *TenantService) GetRules(ctx context.Context, id string) (*models.MailTenant, error) {
	return s.repos.MailTenants().GetByID(ctx, id)
}

func (s *TenantService) UpdateRules(ctx context.Context, id string) (*models.MailTenant, error) {
	return s.repos.MailTenants().GetByID(ctx, id)
}

func (s *TenantService) ListAccounts(ctx context.Context, tenantID string) ([]models.MailAccount, error) {
	return s.repos.MailAccounts().List(ctx, tenantID, "")
}
