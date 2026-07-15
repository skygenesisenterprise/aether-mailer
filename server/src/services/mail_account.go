package services

import (
	"context"

	"github.com/skygenesisenterprise/aether-mailer/server/src/interfaces"
	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
	"github.com/skygenesisenterprise/aether-mailer/server/src/utils"
)

type AccountService struct {
	repos interfaces.MailRepositorySet
}

func NewAccountService(repos interfaces.MailRepositorySet) *AccountService {
	return &AccountService{repos: repos}
}

type CreateAccountInput struct {
	TenantID    string `json:"tenantId"`
	DomainID    string `json:"domainId"`
	Name        string `json:"name"`
	DisplayName string `json:"displayName"`
	Password    string `json:"password"`
	QuotaBytes  int64  `json:"quotaBytes"`
}

func (s *AccountService) List(ctx context.Context, tenantID, domainID string) ([]models.MailAccount, error) {
	return s.repos.MailAccounts().List(ctx, tenantID, domainID)
}

func (s *AccountService) Create(ctx context.Context, input CreateAccountInput) (*models.MailAccount, error) {
	account := &models.MailAccount{
		Common:      models.Common{ID: utils.NewID()},
		TenantID:    input.TenantID,
		DomainID:    input.DomainID,
		Name:        input.Name,
		DisplayName: input.DisplayName,
		QuotaBytes:  input.QuotaBytes,
	}
	if account.QuotaBytes == 0 {
		account.QuotaBytes = 1073741824
	}
	if err := s.repos.MailAccounts().Create(ctx, account); err != nil {
		return nil, err
	}
	return account, nil
}

func (s *AccountService) Get(ctx context.Context, tenantID, id string) (*models.MailAccount, error) {
	return s.repos.MailAccounts().GetByID(ctx, tenantID, id)
}

func (s *AccountService) Update(ctx context.Context, tenantID, id string, displayName *string, quotaBytes *int64) (*models.MailAccount, error) {
	account, err := s.repos.MailAccounts().GetByID(ctx, tenantID, id)
	if err != nil {
		return nil, err
	}
	if displayName != nil {
		account.DisplayName = *displayName
	}
	if quotaBytes != nil {
		account.QuotaBytes = *quotaBytes
	}
	if err := s.repos.MailAccounts().Update(ctx, account); err != nil {
		return nil, err
	}
	return account, nil
}

func (s *AccountService) Delete(ctx context.Context, tenantID, id string) error {
	return s.repos.MailAccounts().Delete(ctx, tenantID, id)
}

func (s *AccountService) Enable(ctx context.Context, tenantID, id string) error {
	account, err := s.repos.MailAccounts().GetByID(ctx, tenantID, id)
	if err != nil {
		return err
	}
	account.IsDisabled = false
	account.DisabledAt = nil
	return s.repos.MailAccounts().Update(ctx, account)
}

func (s *AccountService) Disable(ctx context.Context, tenantID, id string) error {
	account, err := s.repos.MailAccounts().GetByID(ctx, tenantID, id)
	if err != nil {
		return err
	}
	account.IsDisabled = true
	return s.repos.MailAccounts().Update(ctx, account)
}

func (s *AccountService) ResetPassword(ctx context.Context, tenantID, id string) (*models.MailAccount, error) {
	account, err := s.repos.MailAccounts().GetByID(ctx, tenantID, id)
	if err != nil {
		return nil, err
	}
	account.PasswordHash = ""
	return account, s.repos.MailAccounts().Update(ctx, account)
}

func (s *AccountService) GetQuota(ctx context.Context, tenantID, id string) (*models.MailAccount, error) {
	return s.repos.MailAccounts().GetByID(ctx, tenantID, id)
}

func (s *AccountService) UpdateQuota(ctx context.Context, tenantID, id string, quotaBytes int64) (*models.MailAccount, error) {
	account, err := s.repos.MailAccounts().GetByID(ctx, tenantID, id)
	if err != nil {
		return nil, err
	}
	account.QuotaBytes = quotaBytes
	return account, s.repos.MailAccounts().Update(ctx, account)
}

func (s *AccountService) GetVacation(ctx context.Context, tenantID, id string) (*models.MailAccount, error) {
	return s.repos.MailAccounts().GetByID(ctx, tenantID, id)
}

func (s *AccountService) UpdateVacation(ctx context.Context, tenantID, id string, subject, message string, enabled bool) (*models.MailAccount, error) {
	account, err := s.repos.MailAccounts().GetByID(ctx, tenantID, id)
	if err != nil {
		return nil, err
	}
	account.VacationSubject = subject
	account.VacationMessage = message
	account.VacationEnabled = enabled
	return account, s.repos.MailAccounts().Update(ctx, account)
}

func (s *AccountService) GetSignature(ctx context.Context, tenantID, id string) (*models.MailAccount, error) {
	return s.repos.MailAccounts().GetByID(ctx, tenantID, id)
}

func (s *AccountService) UpdateSignature(ctx context.Context, tenantID, id, signature string) (*models.MailAccount, error) {
	account, err := s.repos.MailAccounts().GetByID(ctx, tenantID, id)
	if err != nil {
		return nil, err
	}
	account.Signature = signature
	return account, s.repos.MailAccounts().Update(ctx, account)
}

func (s *AccountService) GetForwarding(ctx context.Context, tenantID, id string) (*models.MailAccount, error) {
	return s.repos.MailAccounts().GetByID(ctx, tenantID, id)
}

func (s *AccountService) UpdateForwarding(ctx context.Context, tenantID, id, forwardingAddress string) (*models.MailAccount, error) {
	account, err := s.repos.MailAccounts().GetByID(ctx, tenantID, id)
	if err != nil {
		return nil, err
	}
	account.ForwardingAddress = forwardingAddress
	return account, s.repos.MailAccounts().Update(ctx, account)
}

func (s *AccountService) Get2FA(ctx context.Context, tenantID, id string) (*models.MailAccount, error) {
	return s.repos.MailAccounts().GetByID(ctx, tenantID, id)
}

func (s *AccountService) Enable2FA(ctx context.Context, tenantID, id, secret string) (*models.MailAccount, error) {
	account, err := s.repos.MailAccounts().GetByID(ctx, tenantID, id)
	if err != nil {
		return nil, err
	}
	account.TwoFactorSecret = secret
	account.TwoFactorEnabled = true
	return account, s.repos.MailAccounts().Update(ctx, account)
}

func (s *AccountService) Disable2FA(ctx context.Context, tenantID, id string) (*models.MailAccount, error) {
	account, err := s.repos.MailAccounts().GetByID(ctx, tenantID, id)
	if err != nil {
		return nil, err
	}
	account.TwoFactorSecret = ""
	account.TwoFactorEnabled = false
	return account, s.repos.MailAccounts().Update(ctx, account)
}
