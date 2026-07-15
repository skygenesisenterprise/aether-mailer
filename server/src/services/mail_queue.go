package services

import (
	"context"

	"github.com/skygenesisenterprise/aether-mailer/server/src/interfaces"
)

type QueueService struct {
	repos interfaces.MailRepositorySet
}

func NewQueueService(repos interfaces.MailRepositorySet) *QueueService {
	return &QueueService{repos: repos}
}

func (s *QueueService) List(ctx context.Context, tenantID string) ([]any, error) {
	items, err := s.repos.SmtpQueue().List(ctx, tenantID)
	if err != nil {
		return nil, err
	}
	result := make([]any, len(items))
	for i := range items {
		result[i] = items[i]
	}
	return result, nil
}

func (s *QueueService) Delete(ctx context.Context, tenantID, messageID string) error {
	return s.repos.SmtpQueue().Delete(ctx, tenantID, messageID)
}

func (s *QueueService) Retry(ctx context.Context, tenantID, messageID string) error {
	return s.repos.SmtpQueue().Retry(ctx, tenantID, messageID)
}

func (s *QueueService) PurgeExpired(ctx context.Context, tenantID string) (int64, error) {
	return s.repos.SmtpQueue().PurgeExpired(ctx, tenantID)
}

func (s *QueueService) Stats(ctx context.Context, tenantID string) (map[string]int64, error) {
	return s.repos.SmtpQueue().Stats(ctx, tenantID)
}
