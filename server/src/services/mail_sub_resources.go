package services

import (
	"context"

	"github.com/skygenesisenterprise/aether-mailer/server/src/interfaces"
	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
	"github.com/skygenesisenterprise/aether-mailer/server/src/utils"
)

type AliasService struct {
	repos interfaces.MailRepositorySet
}

func NewAliasService(repos interfaces.MailRepositorySet) *AliasService {
	return &AliasService{repos: repos}
}

func (s *AliasService) List(ctx context.Context, tenantID, accountID string) ([]models.MailAlias, error) {
	return s.repos.MailAliases().ListByAccount(ctx, tenantID, accountID)
}

func (s *AliasService) Create(ctx context.Context, tenantID, accountID, sourceAddress, destination string) (*models.MailAlias, error) {
	alias := &models.MailAlias{
		Common:        models.Common{ID: utils.NewID()},
		AccountID:     accountID,
		TenantID:      tenantID,
		SourceAddress: sourceAddress,
		Destination:   destination,
		IsEnabled:     true,
	}
	if err := s.repos.MailAliases().Create(ctx, alias); err != nil {
		return nil, err
	}
	return alias, nil
}

func (s *AliasService) Delete(ctx context.Context, tenantID, accountID, aliasID string) error {
	return s.repos.MailAliases().Delete(ctx, tenantID, accountID, aliasID)
}

type IdentityService struct {
	repos interfaces.MailRepositorySet
}

func NewIdentityService(repos interfaces.MailRepositorySet) *IdentityService {
	return &IdentityService{repos: repos}
}

func (s *IdentityService) List(ctx context.Context, tenantID, accountID string) ([]models.MailIdentity, error) {
	return s.repos.MailIdentities().ListByAccount(ctx, tenantID, accountID)
}

func (s *IdentityService) Create(ctx context.Context, tenantID, accountID, name, email, replyTo, signature string, isDefault bool) (*models.MailIdentity, error) {
	identity := &models.MailIdentity{
		Common:    models.Common{ID: utils.NewID()},
		AccountID: accountID,
		TenantID:  tenantID,
		Name:      name,
		Email:     email,
		ReplyTo:   replyTo,
		Signature: signature,
		IsDefault: isDefault,
	}
	if err := s.repos.MailIdentities().Create(ctx, identity); err != nil {
		return nil, err
	}
	return identity, nil
}

func (s *IdentityService) Update(ctx context.Context, tenantID, accountID, identityID, name, email, replyTo, signature string, isDefault *bool) (*models.MailIdentity, error) {
	identity, err := s.repos.MailIdentities().ListByAccount(ctx, tenantID, accountID)
	if err != nil {
		return nil, err
	}
	for _, i := range identity {
		if i.ID == identityID {
			if name != "" {
				i.Name = name
			}
			if email != "" {
				i.Email = email
			}
			if replyTo != "" {
				i.ReplyTo = replyTo
			}
			if signature != "" {
				i.Signature = signature
			}
			if isDefault != nil {
				i.IsDefault = *isDefault
			}
			return &i, s.repos.MailIdentities().Update(ctx, &i)
		}
	}
	return nil, utils.ErrMailIdentityNotFound
}

func (s *IdentityService) Delete(ctx context.Context, tenantID, accountID, identityID string) error {
	return s.repos.MailIdentities().Delete(ctx, tenantID, accountID, identityID)
}

type SieveService struct {
	repos interfaces.MailRepositorySet
}

func NewSieveService(repos interfaces.MailRepositorySet) *SieveService {
	return &SieveService{repos: repos}
}

func (s *SieveService) List(ctx context.Context, tenantID, accountID string) ([]models.SieveScript, error) {
	return s.repos.SieveScripts().ListByAccount(ctx, tenantID, accountID)
}

func (s *SieveService) Create(ctx context.Context, tenantID, accountID, name, scriptBody string) (*models.SieveScript, error) {
	script := &models.SieveScript{
		Common:     models.Common{ID: utils.NewID()},
		AccountID:  accountID,
		TenantID:   tenantID,
		Name:       name,
		ScriptBody: scriptBody,
	}
	if err := s.repos.SieveScripts().Create(ctx, script); err != nil {
		return nil, err
	}
	return script, nil
}

func (s *SieveService) Update(ctx context.Context, tenantID, accountID, scriptID, name, scriptBody string) (*models.SieveScript, error) {
	scripts, err := s.repos.SieveScripts().ListByAccount(ctx, tenantID, accountID)
	if err != nil {
		return nil, err
	}
	for _, script := range scripts {
		if script.ID == scriptID {
			if name != "" {
				script.Name = name
			}
			if scriptBody != "" {
				script.ScriptBody = scriptBody
			}
			return &script, s.repos.SieveScripts().Update(ctx, &script)
		}
	}
	return nil, utils.ErrSieveScriptNotFound
}

func (s *SieveService) Delete(ctx context.Context, tenantID, accountID, scriptID string) error {
	return s.repos.SieveScripts().Delete(ctx, tenantID, accountID, scriptID)
}

func (s *SieveService) Activate(ctx context.Context, tenantID, accountID, scriptID string) (*models.SieveScript, error) {
	scripts, err := s.repos.SieveScripts().ListByAccount(ctx, tenantID, accountID)
	if err != nil {
		return nil, err
	}
	for _, script := range scripts {
		isActive := script.ID == scriptID
		if script.IsActive != isActive {
			script.IsActive = isActive
			if err := s.repos.SieveScripts().Update(ctx, &script); err != nil {
				return nil, err
			}
		}
		if isActive {
			return &script, nil
		}
	}
	return nil, utils.ErrSieveScriptNotFound
}

type FilterRuleService struct {
	repos interfaces.MailRepositorySet
}

func NewFilterRuleService(repos interfaces.MailRepositorySet) *FilterRuleService {
	return &FilterRuleService{repos: repos}
}

func (s *FilterRuleService) List(ctx context.Context, tenantID, accountID string) ([]models.FilterRule, error) {
	return s.repos.FilterRules().ListByAccount(ctx, tenantID, accountID)
}

func (s *FilterRuleService) Create(ctx context.Context, tenantID, accountID, name string, priority int, conditions, actions []byte, isEnabled bool) (*models.FilterRule, error) {
	rule := &models.FilterRule{
		Common:     models.Common{ID: utils.NewID()},
		AccountID:  accountID,
		TenantID:   tenantID,
		Name:       name,
		Priority:   priority,
		Conditions: conditions,
		Actions:    actions,
		IsEnabled:  isEnabled,
	}
	if err := s.repos.FilterRules().Create(ctx, rule); err != nil {
		return nil, err
	}
	return rule, nil
}

func (s *FilterRuleService) Update(ctx context.Context, tenantID, accountID, ruleID, name string, priority *int, conditions, actions []byte, isEnabled *bool) (*models.FilterRule, error) {
	rules, err := s.repos.FilterRules().ListByAccount(ctx, tenantID, accountID)
	if err != nil {
		return nil, err
	}
	for _, rule := range rules {
		if rule.ID == ruleID {
			if name != "" {
				rule.Name = name
			}
			if priority != nil {
				rule.Priority = *priority
			}
			if conditions != nil {
				rule.Conditions = conditions
			}
			if actions != nil {
				rule.Actions = actions
			}
			if isEnabled != nil {
				rule.IsEnabled = *isEnabled
			}
			return &rule, s.repos.FilterRules().Update(ctx, &rule)
		}
	}
	return nil, utils.ErrFilterRuleNotFound
}

func (s *FilterRuleService) Delete(ctx context.Context, tenantID, accountID, ruleID string) error {
	return s.repos.FilterRules().Delete(ctx, tenantID, accountID, ruleID)
}

type AppPasswordService struct {
	repos interfaces.MailRepositorySet
}

func NewAppPasswordService(repos interfaces.MailRepositorySet) *AppPasswordService {
	return &AppPasswordService{repos: repos}
}

func (s *AppPasswordService) List(ctx context.Context, tenantID, accountID string) ([]models.AppPassword, error) {
	return s.repos.AppPasswords().ListByAccount(ctx, tenantID, accountID)
}

func (s *AppPasswordService) Create(ctx context.Context, tenantID, accountID, name, passwordHash string) (*models.AppPassword, error) {
	pw := &models.AppPassword{
		Common:       models.Common{ID: utils.NewID()},
		AccountID:    accountID,
		TenantID:     tenantID,
		Name:         name,
		PasswordHash: passwordHash,
	}
	if err := s.repos.AppPasswords().Create(ctx, pw); err != nil {
		return nil, err
	}
	return pw, nil
}

func (s *AppPasswordService) Delete(ctx context.Context, tenantID, accountID, passwordID string) error {
	return s.repos.AppPasswords().Delete(ctx, tenantID, accountID, passwordID)
}

type MailSessionService struct {
	repos interfaces.MailRepositorySet
}

func NewMailSessionService(repos interfaces.MailRepositorySet) *MailSessionService {
	return &MailSessionService{repos: repos}
}

func (s *MailSessionService) List(ctx context.Context, tenantID, accountID string) ([]models.MailSession, error) {
	return s.repos.MailSessions().ListByAccount(ctx, tenantID, accountID)
}

func (s *MailSessionService) Revoke(ctx context.Context, tenantID, accountID, sessionID string) error {
	return s.repos.MailSessions().Revoke(ctx, tenantID, accountID, sessionID)
}
