package services

import (
	"context"

	"github.com/skygenesisenterprise/aether-mailer/server/src/interfaces"
	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
	"github.com/skygenesisenterprise/aether-mailer/server/src/utils"
)

type RoleService struct {
	repos interfaces.MailRepositorySet
}

func NewRoleService(repos interfaces.MailRepositorySet) *RoleService {
	return &RoleService{repos: repos}
}

func (s *RoleService) List(ctx context.Context, tenantID string) ([]models.MailRole, error) {
	return s.repos.MailRoles().List(ctx, tenantID)
}

func (s *RoleService) Create(ctx context.Context, tenantID, name, description string, permissions []string) (*models.MailRole, error) {
	role := &models.MailRole{
		Common:      models.Common{ID: utils.NewID()},
		TenantID:    tenantID,
		Name:        name,
		Description: description,
	}
	if err := s.repos.MailRoles().Create(ctx, role); err != nil {
		return nil, err
	}
	return role, nil
}

func (s *RoleService) Get(ctx context.Context, tenantID, id string) (*models.MailRole, error) {
	return s.repos.MailRoles().GetByID(ctx, tenantID, id)
}

func (s *RoleService) Update(ctx context.Context, tenantID, id, name, description string) (*models.MailRole, error) {
	role, err := s.repos.MailRoles().GetByID(ctx, tenantID, id)
	if err != nil {
		return nil, err
	}
	if name != "" {
		role.Name = name
	}
	if description != "" {
		role.Description = description
	}
	return role, s.repos.MailRoles().Update(ctx, role)
}

func (s *RoleService) Delete(ctx context.Context, tenantID, id string) error {
	return s.repos.MailRoles().Delete(ctx, tenantID, id)
}

func (s *RoleService) ListMembers(ctx context.Context, tenantID, roleID string) ([]models.MailRoleMember, error) {
	return s.repos.MailRoleMembers().ListByRole(ctx, tenantID, roleID)
}

func (s *RoleService) AddMember(ctx context.Context, tenantID, roleID, principalID string) (*models.MailRoleMember, error) {
	member := &models.MailRoleMember{
		Common:      models.Common{ID: utils.NewID()},
		RoleID:      roleID,
		PrincipalID: principalID,
	}
	if err := s.repos.MailRoleMembers().Add(ctx, member); err != nil {
		return nil, err
	}
	return member, nil
}

func (s *RoleService) RemoveMember(ctx context.Context, tenantID, roleID, principalID string) error {
	return s.repos.MailRoleMembers().Remove(ctx, tenantID, roleID, principalID)
}

func (s *RoleService) ListPermissions(_ context.Context) []string {
	return []string{
		"mail.accounts.read", "mail.accounts.write",
		"mail.domains.read", "mail.domains.write",
		"mail.groups.read", "mail.groups.write",
		"mail.roles.read", "mail.roles.write",
		"mail.tenants.read", "mail.tenants.write",
		"mail.mailing_lists.read", "mail.mailing_lists.write",
		"mail.config.read", "mail.config.write",
		"mail.monitoring.read",
		"mail.queue.manage",
		"mail.logs.read",
		"mail.reports.read",
	}
}
