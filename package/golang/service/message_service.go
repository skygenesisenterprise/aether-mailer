package service

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/skygenesisenterprise/aether-mailer/package/golang/domain"
	"github.com/skygenesisenterprise/aether-mailer/package/golang/errors"
	"github.com/skygenesisenterprise/aether-mailer/package/golang/repository"
)

// MessageService handles message-related business logic
type MessageService struct {
	messageRepo    repository.MessageRepository
	accountRepo    repository.EmailAccountRepository
	attachmentRepo repository.AttachmentRepository
	quotaRepo      repository.QuotaRepository
	policyRepo     repository.PolicyRepository
	eventPub       domain.EventPublisher
	config         *MessageConfig
}

// MessageConfig defines message service configuration
type MessageConfig struct {
	MaxMessageSize    int64
	MaxAttachments    int
	MaxAttachmentSize int64
	AllowedMimeTypes  []string
}

// NewMessageService creates a new message service
func NewMessageService(
	messageRepo repository.MessageRepository,
	accountRepo repository.EmailAccountRepository,
	attachmentRepo repository.AttachmentRepository,
	quotaRepo repository.QuotaRepository,
	policyRepo repository.PolicyRepository,
	eventPub domain.EventPublisher,
	config *MessageConfig,
) *MessageService {
	return &MessageService{
		messageRepo:    messageRepo,
		accountRepo:    accountRepo,
		attachmentRepo: attachmentRepo,
		quotaRepo:      quotaRepo,
		policyRepo:     policyRepo,
		eventPub:       eventPub,
		config:         config,
	}
}

// SendMessage sends a new message
func (s *MessageService) SendMessage(ctx context.Context, req SendMessageRequest) (*domain.Message, error) {
	// Validate sender account
	account, err := s.accountRepo.GetByID(ctx, req.AccountID)
	if err != nil {
		return nil, errors.InternalError(err)
	}
	if account == nil {
		return nil, errors.EmailAccountNotFound(req.AccountID)
	}
	if !account.IsActive {
		return nil, errors.NewError(errors.ErrCodeEmailAccountInactive, "Email account is not active")
	}

	// Check quotas
	if err := s.checkQuotas(ctx, account.UserID, account.DomainID); err != nil {
		return nil, err
	}

	// Validate recipients
	if len(req.To) == 0 && len(req.Cc) == 0 && len(req.Bcc) == 0 {
		return nil, errors.NewError(errors.ErrCodeInvalidRecipients, "At least one recipient is required")
	}

	// Validate message size
	messageSize := s.calculateMessageSize(req)
	if messageSize > s.config.MaxMessageSize {
		return nil, errors.NewError(errors.ErrCodeMessageTooLarge, "Message size exceeds limit").
			WithDetail("max_size", s.config.MaxMessageSize).
			WithDetail("actual_size", messageSize)
	}

	// Create message
	message := &domain.Message{
		ID:          uuid.New().String(),
		AccountID:   req.AccountID,
		From:        req.From,
		To:          req.To,
		Cc:          req.Cc,
		Bcc:         req.Bcc,
		Subject:     req.Subject,
		BodyText:    req.BodyText,
		BodyHTML:    req.BodyHTML,
		Attachments: []domain.Attachment{},
		Size:        messageSize,
		IsRead:      false,
		IsDraft:     false,
		IsSent:      false,
		IsDeleted:   false,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	// Process attachments
	if len(req.Attachments) > 0 {
		if len(req.Attachments) > s.config.MaxAttachments {
			return nil, errors.NewError(errors.ErrCodeValidationError, "Too many attachments").
				WithDetail("max_attachments", s.config.MaxAttachments).
				WithDetail("actual_attachments", len(req.Attachments))
		}

		for _, att := range req.Attachments {
			if att.Size > s.config.MaxAttachmentSize {
				return nil, errors.NewError(errors.ErrCodeMessageTooLarge, "Attachment too large").
					WithDetail("max_size", s.config.MaxAttachmentSize).
					WithDetail("actual_size", att.Size)
			}

			attachment := &domain.Attachment{
				ID:          uuid.New().String(),
				MessageID:   message.ID,
				Filename:    att.Filename,
				ContentType: att.ContentType,
				Size:        att.Size,
				Content:     att.Content,
			}

			if err := s.attachmentRepo.Create(ctx, attachment); err != nil {
				return nil, errors.InternalError(err)
			}

			message.Attachments = append(message.Attachments, *attachment)
		}
	}

	// Save message
	if err := s.messageRepo.Create(ctx, message); err != nil {
		return nil, errors.InternalError(err)
	}

	// Update quotas
	if err := s.updateQuotas(ctx, account.UserID, account.DomainID, messageSize); err != nil {
		// Log error but don't fail the operation
	}

	// Publish event
	event := domain.NewBaseEvent(uuid.New().String(), message.ID, domain.EventTypeMessageSent, message)
	if err := s.eventPub.Publish(ctx, event); err != nil {
		// Log error but don't fail the operation
	}

	return message, nil
}

// GetMessage retrieves a message by ID
func (s *MessageService) GetMessage(ctx context.Context, id string) (*domain.Message, error) {
	message, err := s.messageRepo.GetByID(ctx, id)
	if err != nil {
		return nil, errors.InternalError(err)
	}
	if message == nil {
		return nil, errors.MessageNotFound(id)
	}
	return message, nil
}

// ListMessages lists messages for an account
func (s *MessageService) ListMessages(ctx context.Context, accountID string, filter repository.MessageFilter) ([]*domain.Message, error) {
	// Validate account exists
	account, err := s.accountRepo.GetByID(ctx, accountID)
	if err != nil {
		return nil, errors.InternalError(err)
	}
	if account == nil {
		return nil, errors.EmailAccountNotFound(accountID)
	}

	messages, err := s.messageRepo.ListByAccount(ctx, accountID, filter)
	if err != nil {
		return nil, errors.InternalError(err)
	}
	return messages, nil
}

// SearchMessages searches messages
func (s *MessageService) SearchMessages(ctx context.Context, query repository.MessageSearchQuery) ([]*domain.Message, error) {
	// Validate account exists
	account, err := s.accountRepo.GetByID(ctx, query.AccountID)
	if err != nil {
		return nil, errors.InternalError(err)
	}
	if account == nil {
		return nil, errors.EmailAccountNotFound(query.AccountID)
	}

	messages, err := s.messageRepo.Search(ctx, query)
	if err != nil {
		return nil, errors.InternalError(err)
	}
	return messages, nil
}

// MarkAsRead marks a message as read
func (s *MessageService) MarkAsRead(ctx context.Context, id string) error {
	message, err := s.messageRepo.GetByID(ctx, id)
	if err != nil {
		return errors.InternalError(err)
	}
	if message == nil {
		return errors.MessageNotFound(id)
	}

	message.IsRead = true
	message.UpdatedAt = time.Now()

	if err := s.messageRepo.Update(ctx, message); err != nil {
		return errors.InternalError(err)
	}

	return nil
}

// DeleteMessage deletes a message
func (s *MessageService) DeleteMessage(ctx context.Context, id string) error {
	message, err := s.messageRepo.GetByID(ctx, id)
	if err != nil {
		return errors.InternalError(err)
	}
	if message == nil {
		return errors.MessageNotFound(id)
	}

	message.IsDeleted = true
	message.UpdatedAt = time.Now()

	if err := s.messageRepo.Update(ctx, message); err != nil {
		return errors.InternalError(err)
	}

	return nil
}

// checkQuotas checks if the user/domain has exceeded quotas
func (s *MessageService) checkQuotas(ctx context.Context, userID, domainID string) error {
	// Check user quota
	userQuota, err := s.quotaRepo.GetByUserID(ctx, userID)
	if err != nil {
		return errors.InternalError(err)
	}
	if userQuota != nil && userQuota.SentEmailsToday >= userQuota.MaxEmailsPerDay {
		return errors.QuotaExceeded("daily_emails", userQuota.MaxEmailsPerDay)
	}

	// Check domain quota if applicable
	if domainID != "" {
		domainQuota, err := s.quotaRepo.GetByDomainID(ctx, domainID)
		if err != nil {
			return errors.InternalError(err)
		}
		if domainQuota != nil && domainQuota.SentEmailsToday >= domainQuota.MaxEmailsPerDay {
			return errors.QuotaExceeded("domain_daily_emails", domainQuota.MaxEmailsPerDay)
		}
	}

	return nil
}

// updateQuotas updates quota counters
func (s *MessageService) updateQuotas(ctx context.Context, userID, domainID string, messageSize int64) error {
	// Update user quota
	userQuota, err := s.quotaRepo.GetByUserID(ctx, userID)
	if err != nil {
		return errors.InternalError(err)
	}
	if userQuota != nil {
		userQuota.SentEmailsToday++
		userQuota.UsedStorageMB += int(messageSize / (1024 * 1024))
		if err := s.quotaRepo.Update(ctx, userQuota); err != nil {
			return errors.InternalError(err)
		}
	}

	// Update domain quota if applicable
	if domainID != "" {
		domainQuota, err := s.quotaRepo.GetByDomainID(ctx, domainID)
		if err != nil {
			return errors.InternalError(err)
		}
		if domainQuota != nil {
			domainQuota.SentEmailsToday++
			if err := s.quotaRepo.Update(ctx, domainQuota); err != nil {
				return errors.InternalError(err)
			}
		}
	}

	return nil
}

// calculateMessageSize calculates the total message size
func (s *MessageService) calculateMessageSize(req SendMessageRequest) int64 {
	size := int64(0)

	// Headers (approximate)
	size += int64(len(req.From) + len(req.Subject))
	for _, to := range req.To {
		size += int64(len(to))
	}
	for _, cc := range req.Cc {
		size += int64(len(cc))
	}
	for _, bcc := range req.Bcc {
		size += int64(len(bcc))
	}

	// Body
	if req.BodyText != nil {
		size += int64(len(*req.BodyText))
	}
	if req.BodyHTML != nil {
		size += int64(len(*req.BodyHTML))
	}

	// Attachments
	for _, att := range req.Attachments {
		size += att.Size
	}

	return size
}

// SendMessageRequest represents the request to send a message
type SendMessageRequest struct {
	AccountID   string
	From        string
	To          []string
	Cc          []string
	Bcc         []string
	Subject     string
	BodyText    *string
	BodyHTML    *string
	Attachments []AttachmentRequest
}

// AttachmentRequest represents an attachment request
type AttachmentRequest struct {
	Filename    string
	ContentType string
	Size        int64
	Content     []byte
}
