package services

import (
	"context"

	"github.com/skygenesisenterprise/aether-mailer/server/src/interfaces"
	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
	"github.com/skygenesisenterprise/aether-mailer/server/src/utils"
)

type MailingListService struct {
	repos interfaces.MailRepositorySet
}

func NewMailingListService(repos interfaces.MailRepositorySet) *MailingListService {
	return &MailingListService{repos: repos}
}

func (s *MailingListService) List(ctx context.Context, tenantID string) ([]models.MailingList, error) {
	return s.repos.MailingLists().List(ctx, tenantID)
}

func (s *MailingListService) Create(ctx context.Context, tenantID, name, email, description string) (*models.MailingList, error) {
	list := &models.MailingList{
		Common:   models.Common{ID: utils.NewID()},
		TenantID: tenantID,
		Name:     name,
		Email:    email,
		IsEnabled: true,
		ModerationMode: "none",
		Description: description,
	}
	if err := s.repos.MailingLists().Create(ctx, list); err != nil {
		return nil, err
	}
	return list, nil
}

func (s *MailingListService) Get(ctx context.Context, tenantID, id string) (*models.MailingList, error) {
	return s.repos.MailingLists().GetByID(ctx, tenantID, id)
}

func (s *MailingListService) Update(ctx context.Context, tenantID, id, name, email, description string, isEnabled *bool, moderationMode *string) (*models.MailingList, error) {
	list, err := s.repos.MailingLists().GetByID(ctx, tenantID, id)
	if err != nil {
		return nil, err
	}
	if name != "" {
		list.Name = name
	}
	if email != "" {
		list.Email = email
	}
	if description != "" {
		list.Description = description
	}
	if isEnabled != nil {
		list.IsEnabled = *isEnabled
	}
	if moderationMode != nil {
		list.ModerationMode = *moderationMode
	}
	return list, s.repos.MailingLists().Update(ctx, list)
}

func (s *MailingListService) Delete(ctx context.Context, tenantID, id string) error {
	return s.repos.MailingLists().Delete(ctx, tenantID, id)
}

func (s *MailingListService) ListSubscribers(ctx context.Context, tenantID, listID string) ([]models.MailingListSubscriber, error) {
	return s.repos.MailingListSubscribers().ListByList(ctx, tenantID, listID)
}

func (s *MailingListService) AddSubscriber(ctx context.Context, tenantID, listID, email string) (*models.MailingListSubscriber, error) {
	sub := &models.MailingListSubscriber{
		Common:    models.Common{ID: utils.NewID()},
		ListID:    listID,
		Email:     email,
		IsEnabled: true,
	}
	if err := s.repos.MailingListSubscribers().Add(ctx, sub); err != nil {
		return nil, err
	}
	return sub, nil
}

func (s *MailingListService) RemoveSubscriber(ctx context.Context, tenantID, listID, subscriberID string) error {
	return s.repos.MailingListSubscribers().Remove(ctx, tenantID, listID, subscriberID)
}

func (s *MailingListService) GetModeration(ctx context.Context, tenantID, listID string) (*models.MailingListModeration, error) {
	return s.repos.MailingListModerations().GetByList(ctx, tenantID, listID)
}

func (s *MailingListService) UpdateModeration(ctx context.Context, tenantID, listID, postingMode string, moderatorEmails []string) (*models.MailingListModeration, error) {
	mod, err := s.repos.MailingListModerations().GetByList(ctx, tenantID, listID)
	if err != nil {
		mod = &models.MailingListModeration{
			Common:  models.Common{ID: utils.NewID()},
			ListID:  listID,
		}
	}
	if postingMode != "" {
		mod.PostingMode = postingMode
	}
	if err := s.repos.MailingListModerations().Upsert(ctx, mod); err != nil {
		return nil, err
	}
	return mod, nil
}
