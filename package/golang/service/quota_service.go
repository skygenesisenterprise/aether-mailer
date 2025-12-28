package service

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/skygenesisenterprise/aether-mailer/package/golang/domain"
	"github.com/skygenesisenterprise/aether-mailer/package/golang/errors"
	"github.com/skygenesisenterprise/aether-mailer/package/golang/repository"
)

// QuotaService handles quota management and enforcement
type QuotaService struct {
	quotaRepo  repository.QuotaRepository
	userRepo   repository.UserRepository
	domainRepo repository.DomainRepository
	eventPub   domain.EventPublisher
	config     *QuotaConfig
}

// QuotaConfig defines quota service configuration
type QuotaConfig struct {
	DefaultMaxStorageMB    int
	DefaultMaxEmailsPerDay int
	DefaultDomainMaxUsers  int
	EnableQuotaEnforcement bool
	QuotaCheckInterval     time.Duration
	WarningThreshold       float64 // 0.0 to 1.0
}

// QuotaStatus represents quota status information
type QuotaStatus struct {
	UserID              string
	DomainID            *string
	MaxStorageMB        int
	UsedStorageMB       int
	StorageUsagePercent float64
	MaxEmailsPerDay     int
	SentEmailsToday     int
	EmailUsagePercent   float64
	ResetAt             time.Time
	IsExceeded          bool
	Warnings            []string
}

// NewQuotaService creates a new quota service
func NewQuotaService(
	quotaRepo repository.QuotaRepository,
	userRepo repository.UserRepository,
	domainRepo repository.DomainRepository,
	eventPub domain.EventPublisher,
	config *QuotaConfig,
) *QuotaService {
	return &QuotaService{
		quotaRepo:  quotaRepo,
		userRepo:   userRepo,
		domainRepo: domainRepo,
		eventPub:   eventPub,
		config:     config,
	}
}

// CheckQuota checks if a user/domain has exceeded their quotas
func (s *QuotaService) CheckQuota(ctx context.Context, userID string, domainID *string) error {
	if !s.config.EnableQuotaEnforcement {
		return nil
	}

	// Check user quota
	userQuota, err := s.getUserQuota(ctx, userID)
	if err != nil {
		return errors.InternalError(err)
	}

	if userQuota != nil {
		if userQuota.UsedStorageMB >= userQuota.MaxStorageMB {
			return errors.QuotaExceeded("storage", userQuota.MaxStorageMB)
		}
		if userQuota.SentEmailsToday >= userQuota.MaxEmailsPerDay {
			return errors.QuotaExceeded("daily_emails", userQuota.MaxEmailsPerDay)
		}
	}

	// Check domain quota if applicable
	if domainID != nil {
		domainQuota, err := s.getDomainQuota(ctx, *domainID)
		if err != nil {
			return errors.InternalError(err)
		}

		if domainQuota != nil {
			if domainQuota.UsedStorageMB >= domainQuota.MaxStorageMB {
				return errors.QuotaExceeded("domain_storage", domainQuota.MaxStorageMB)
			}
			if domainQuota.SentEmailsToday >= domainQuota.MaxEmailsPerDay {
				return errors.QuotaExceeded("domain_daily_emails", domainQuota.MaxEmailsPerDay)
			}
		}
	}

	return nil
}

// GetQuotaStatus returns quota status for a user
func (s *QuotaService) GetQuotaStatus(ctx context.Context, userID string) (*QuotaStatus, error) {
	userQuota, err := s.getUserQuota(ctx, userID)
	if err != nil {
		return nil, errors.InternalError(err)
	}

	if userQuota == nil {
		return nil, errors.UserNotFound(userID)
	}

	status := &QuotaStatus{
		UserID:          userQuota.UserID,
		DomainID:        userQuota.DomainID,
		MaxStorageMB:    userQuota.MaxStorageMB,
		UsedStorageMB:   userQuota.UsedStorageMB,
		MaxEmailsPerDay: userQuota.MaxEmailsPerDay,
		SentEmailsToday: userQuota.SentEmailsToday,
		ResetAt:         userQuota.ResetAt,
		IsExceeded:      false,
		Warnings:        []string{},
	}

	// Calculate usage percentages
	if userQuota.MaxStorageMB > 0 {
		status.StorageUsagePercent = float64(userQuota.UsedStorageMB) / float64(userQuota.MaxStorageMB)
	}
	if userQuota.MaxEmailsPerDay > 0 {
		status.EmailUsagePercent = float64(userQuota.SentEmailsToday) / float64(userQuota.MaxEmailsPerDay)
	}

	// Check for warnings
	if status.StorageUsagePercent > s.config.WarningThreshold {
		status.Warnings = append(status.Warnings, "Storage usage is high")
	}
	if status.EmailUsagePercent > s.config.WarningThreshold {
		status.Warnings = append(status.Warnings, "Daily email limit approaching")
	}

	// Check if exceeded
	if status.StorageUsagePercent >= 1.0 || status.EmailUsagePercent >= 1.0 {
		status.IsExceeded = true
	}

	return status, nil
}

// UpdateStorageUsage updates storage usage for a user
func (s *QuotaService) UpdateStorageUsage(ctx context.Context, userID string, sizeDelta int64) error {
	userQuota, err := s.getUserQuota(ctx, userID)
	if err != nil {
		return errors.InternalError(err)
	}

	if userQuota == nil {
		return errors.UserNotFound(userID)
	}

	// Update storage usage
	userQuota.UsedStorageMB += int(sizeDelta / (1024 * 1024))
	if userQuota.UsedStorageMB < 0 {
		userQuota.UsedStorageMB = 0
	}

	if err := s.quotaRepo.Update(ctx, userQuota); err != nil {
		return errors.InternalError(err)
	}

	// Check if quota exceeded after update
	if userQuota.UsedStorageMB >= userQuota.MaxStorageMB {
		// Publish quota exceeded event
		event := domain.NewBaseEvent(
			uuid.New().String(),
			userQuota.UserID,
			domain.EventTypeQuotaExceeded,
			map[string]interface{}{
				"type":     "storage",
				"used":     userQuota.UsedStorageMB,
				"max":      userQuota.MaxStorageMB,
				"domainID": userQuota.DomainID,
			},
		)
		if err := s.eventPub.Publish(ctx, event); err != nil {
			// Log error but don't fail the operation
		}
	}

	return nil
}

// IncrementEmailCount increments the daily email count for a user
func (s *QuotaService) IncrementEmailCount(ctx context.Context, userID string) error {
	userQuota, err := s.getUserQuota(ctx, userID)
	if err != nil {
		return errors.InternalError(err)
	}

	if userQuota == nil {
		return errors.UserNotFound(userID)
	}

	// Check if we need to reset daily counters
	if time.Now().After(userQuota.ResetAt) {
		if err := s.resetDailyCounters(ctx, userID); err != nil {
			return errors.InternalError(err)
		}
		// Reload quota
		userQuota, err = s.quotaRepo.GetByUserID(ctx, userID)
		if err != nil {
			return errors.InternalError(err)
		}
	}

	// Increment email count
	userQuota.SentEmailsToday++

	if err := s.quotaRepo.Update(ctx, userQuota); err != nil {
		return errors.InternalError(err)
	}

	// Check if quota exceeded after increment
	if userQuota.SentEmailsToday >= userQuota.MaxEmailsPerDay {
		// Publish quota exceeded event
		event := domain.NewBaseEvent(
			uuid.New().String(),
			userQuota.UserID,
			domain.EventTypeQuotaExceeded,
			map[string]interface{}{
				"type":     "daily_emails",
				"used":     userQuota.SentEmailsToday,
				"max":      userQuota.MaxEmailsPerDay,
				"domainID": userQuota.DomainID,
			},
		)
		if err := s.eventPub.Publish(ctx, event); err != nil {
			// Log error but don't fail the operation
		}
	}

	return nil
}

// ResetDailyCounters resets daily email counters for all users
func (s *QuotaService) ResetDailyCounters(ctx context.Context) error {
	// This would typically be called by a scheduled job
	// For now, we'll implement a simple version that resets counters for the current user
	// In a real implementation, you'd want to reset all users or use a more efficient approach
	return nil
}

// InitializeQuota initializes quota for a new user
func (s *QuotaService) InitializeQuota(ctx context.Context, userID string, domainID *string) error {
	// Check if quota already exists
	existing, err := s.quotaRepo.GetByUserID(ctx, userID)
	if err != nil {
		return errors.InternalError(err)
	}
	if existing != nil {
		return nil // Quota already exists
	}

	// Get user to determine limits
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return errors.InternalError(err)
	}
	if user == nil {
		return errors.UserNotFound(userID)
	}

	// Create new quota
	quota := &domain.Quota{
		UserID:          userID,
		DomainID:        domainID,
		MaxStorageMB:    user.MaxStorageMB,
		UsedStorageMB:   0,
		MaxEmailsPerDay: user.MaxEmailsPerDay,
		SentEmailsToday: 0,
		ResetAt:         s.getNextResetTime(),
	}

	// Apply defaults if user limits are not set
	if quota.MaxStorageMB == 0 {
		quota.MaxStorageMB = s.config.DefaultMaxStorageMB
	}
	if quota.MaxEmailsPerDay == 0 {
		quota.MaxEmailsPerDay = s.config.DefaultMaxEmailsPerDay
	}

	return s.quotaRepo.Create(ctx, quota)
}

// Helper functions

func (s *QuotaService) getUserQuota(ctx context.Context, userID string) (*domain.Quota, error) {
	quota, err := s.quotaRepo.GetByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	// If quota doesn't exist, initialize it
	if quota == nil {
		if err := s.InitializeQuota(ctx, userID, nil); err != nil {
			return nil, err
		}
		quota, err = s.quotaRepo.GetByUserID(ctx, userID)
		if err != nil {
			return nil, err
		}
	}

	return quota, nil
}

func (s *QuotaService) getDomainQuota(ctx context.Context, domainID string) (*domain.Quota, error) {
	quota, err := s.quotaRepo.GetByDomainID(ctx, domainID)
	if err != nil {
		return nil, err
	}

	// If domain quota doesn't exist, initialize it
	if quota == nil {
		domainEntity, err := s.domainRepo.GetByID(ctx, domainID)
		if err != nil {
			return nil, err
		}
		if domainEntity == nil {
			return nil, errors.DomainNotFound(domainID)
		}

		quota = &domain.Quota{
			DomainID:        &domainID,
			MaxStorageMB:    domainEntity.MaxStorageMB,
			UsedStorageMB:   0,
			MaxEmailsPerDay: domainEntity.MaxEmailsPerDay,
			SentEmailsToday: 0,
			ResetAt:         s.getNextResetTime(),
		}

		// Apply defaults if domain limits are not set
		if quota.MaxStorageMB == 0 {
			quota.MaxStorageMB = s.config.DefaultMaxStorageMB * 10 // Domain gets 10x user default
		}
		if quota.MaxEmailsPerDay == 0 {
			quota.MaxEmailsPerDay = s.config.DefaultMaxEmailsPerDay * domainEntity.MaxUsers
		}

		if err := s.quotaRepo.Create(ctx, quota); err != nil {
			return nil, err
		}
	}

	return quota, nil
}

func (s *QuotaService) resetDailyCounters(ctx context.Context, userID string) error {
	return s.quotaRepo.ResetDailyCounters(ctx, userID)
}

func (s *QuotaService) getNextResetTime() time.Time {
	now := time.Now()
	// Reset at midnight (next day)
	return time.Date(now.Year(), now.Month(), now.Day()+1, 0, 0, 0, 0, now.Location())
}
