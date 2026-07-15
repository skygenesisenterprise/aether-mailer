package services

import (
	"context"
	"encoding/json"

	"github.com/skygenesisenterprise/aether-mailer/server/src/interfaces"
	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
	"github.com/skygenesisenterprise/aether-mailer/server/src/utils"
	"gorm.io/datatypes"
)

type DomainService struct {
	repos interfaces.MailRepositorySet
}

func NewDomainService(repos interfaces.MailRepositorySet) *DomainService {
	return &DomainService{repos: repos}
}

func (s *DomainService) List(ctx context.Context, tenantID string) ([]models.MailDomain, error) {
	return s.repos.MailDomains().List(ctx, tenantID)
}

func (s *DomainService) Create(ctx context.Context, tenantID, name string) (*models.MailDomain, error) {
	domain := &models.MailDomain{
		Common:      models.Common{ID: utils.NewID()},
		TenantID:    tenantID,
		Name:        name,
		SpfIncludes: datatypes.JSON("[]"),
	}
	if err := s.repos.MailDomains().Create(ctx, domain); err != nil {
		return nil, err
	}
	return domain, nil
}

func (s *DomainService) Get(ctx context.Context, tenantID, id string) (*models.MailDomain, error) {
	return s.repos.MailDomains().GetByID(ctx, tenantID, id)
}

func (s *DomainService) Update(ctx context.Context, tenantID, id string, isCatchAll *bool) (*models.MailDomain, error) {
	domain, err := s.repos.MailDomains().GetByID(ctx, tenantID, id)
	if err != nil {
		return nil, err
	}
	if isCatchAll != nil {
		domain.IsCatchAll = *isCatchAll
	}
	return domain, s.repos.MailDomains().Update(ctx, domain)
}

func (s *DomainService) Delete(ctx context.Context, tenantID, id string) error {
	return s.repos.MailDomains().Delete(ctx, tenantID, id)
}

func (s *DomainService) GetDnsConfig(ctx context.Context, tenantID, id string) (*models.MailDomain, error) {
	return s.repos.MailDomains().GetByID(ctx, tenantID, id)
}

func (s *DomainService) VerifyDnsRecords(ctx context.Context, tenantID, id string) (*models.MailDomain, error) {
	domain, err := s.repos.MailDomains().GetByID(ctx, tenantID, id)
	if err != nil {
		return nil, err
	}
	return domain, nil
}

func (s *DomainService) GetDkimConfig(ctx context.Context, tenantID, id string) (*models.MailDomain, error) {
	return s.repos.MailDomains().GetByID(ctx, tenantID, id)
}

func (s *DomainService) RotateDkimKey(ctx context.Context, tenantID, id string) (*models.MailDomain, error) {
	domain, err := s.repos.MailDomains().GetByID(ctx, tenantID, id)
	if err != nil {
		return nil, err
	}
	domain.DkimSelector = "aether"
	return domain, s.repos.MailDomains().Update(ctx, domain)
}

func (s *DomainService) GetDmarcConfig(ctx context.Context, tenantID, id string) (*models.MailDomain, error) {
	return s.repos.MailDomains().GetByID(ctx, tenantID, id)
}

func (s *DomainService) UpdateDmarcConfig(ctx context.Context, tenantID, id, policy, rua string) (*models.MailDomain, error) {
	domain, err := s.repos.MailDomains().GetByID(ctx, tenantID, id)
	if err != nil {
		return nil, err
	}
	domain.DmarcPolicy = policy
	domain.DmarcAggregateRua = rua
	return domain, s.repos.MailDomains().Update(ctx, domain)
}

func (s *DomainService) GetSpfConfig(ctx context.Context, tenantID, id string) (*models.MailDomain, error) {
	return s.repos.MailDomains().GetByID(ctx, tenantID, id)
}

func (s *DomainService) UpdateSpfConfig(ctx context.Context, tenantID, id string, enabled bool, includes []string) (*models.MailDomain, error) {
	domain, err := s.repos.MailDomains().GetByID(ctx, tenantID, id)
	if err != nil {
		return nil, err
	}
	domain.SpfEnabled = enabled
	spfJSON, _ := json.Marshal(includes)
	domain.SpfIncludes = datatypes.JSON(spfJSON)
	return domain, s.repos.MailDomains().Update(ctx, domain)
}

func (s *DomainService) GetDomainTls(ctx context.Context, tenantID, id string) (*models.MailDomain, error) {
	return s.repos.MailDomains().GetByID(ctx, tenantID, id)
}

func (s *DomainService) ProvisionDomainTls(ctx context.Context, tenantID, id string) (*models.MailDomain, error) {
	return s.repos.MailDomains().GetByID(ctx, tenantID, id)
}

func (s *DomainService) GetDomainMetrics(ctx context.Context, tenantID, id string) (*models.MailDomain, error) {
	return s.repos.MailDomains().GetByID(ctx, tenantID, id)
}
