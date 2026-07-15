package services

import (
	"context"

	"github.com/skygenesisenterprise/aether-mailer/server/src/interfaces"
	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
	"github.com/skygenesisenterprise/aether-mailer/server/src/utils"
)

type GroupService struct {
	repos interfaces.MailRepositorySet
}

func NewGroupService(repos interfaces.MailRepositorySet) *GroupService {
	return &GroupService{repos: repos}
}

func (s *GroupService) List(ctx context.Context, tenantID string) ([]models.MailGroup, error) {
	return s.repos.MailGroups().List(ctx, tenantID)
}

func (s *GroupService) Create(ctx context.Context, tenantID, name, email string) (*models.MailGroup, error) {
	group := &models.MailGroup{
		Common:   models.Common{ID: utils.NewID()},
		TenantID: tenantID,
		Name:     name,
		Email:    email,
	}
	if err := s.repos.MailGroups().Create(ctx, group); err != nil {
		return nil, err
	}
	return group, nil
}

func (s *GroupService) Get(ctx context.Context, tenantID, id string) (*models.MailGroup, error) {
	return s.repos.MailGroups().GetByID(ctx, tenantID, id)
}

func (s *GroupService) Update(ctx context.Context, tenantID, id, name, email string) (*models.MailGroup, error) {
	group, err := s.repos.MailGroups().GetByID(ctx, tenantID, id)
	if err != nil {
		return nil, err
	}
	if name != "" {
		group.Name = name
	}
	if email != "" {
		group.Email = email
	}
	return group, s.repos.MailGroups().Update(ctx, group)
}

func (s *GroupService) Delete(ctx context.Context, tenantID, id string) error {
	return s.repos.MailGroups().Delete(ctx, tenantID, id)
}

func (s *GroupService) ListMembers(ctx context.Context, tenantID, groupID string) ([]models.MailGroupMember, error) {
	return s.repos.MailGroupMembers().ListByGroup(ctx, tenantID, groupID)
}

func (s *GroupService) AddMember(ctx context.Context, tenantID, groupID, accountID, role string) (*models.MailGroupMember, error) {
	member := &models.MailGroupMember{
		Common:    models.Common{ID: utils.NewID()},
		GroupID:   groupID,
		AccountID: accountID,
		Role:      role,
	}
	if err := s.repos.MailGroupMembers().Add(ctx, member); err != nil {
		return nil, err
	}
	return member, nil
}

func (s *GroupService) RemoveMember(ctx context.Context, tenantID, groupID, memberID string) error {
	return s.repos.MailGroupMembers().Remove(ctx, tenantID, groupID, memberID)
}

func (s *GroupService) ListPermissions(ctx context.Context, tenantID, groupID string) ([]models.MailGroupPermission, error) {
	return s.repos.MailGroupPermissions().ListByGroup(ctx, tenantID, groupID)
}

func (s *GroupService) SetPermissions(ctx context.Context, tenantID, groupID string, permissions []models.MailGroupPermission) error {
	return s.repos.MailGroupPermissions().Set(ctx, tenantID, groupID, permissions)
}
