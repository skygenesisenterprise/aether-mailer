package service

import (
	"context"
	"fmt"
	"net"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/skygenesisenterprise/aether-mailer/package/golang/domain"
	"github.com/skygenesisenterprise/aether-mailer/package/golang/errors"
	"github.com/skygenesisenterprise/aether-mailer/package/golang/repository"
)

// DomainService handles domain-related business logic
type DomainService struct {
	domainRepo repository.DomainRepository
	userRepo   repository.UserRepository
	eventPub   domain.EventPublisher
}

// NewDomainService creates a new domain service
func NewDomainService(domainRepo repository.DomainRepository, userRepo repository.UserRepository, eventPub domain.EventPublisher) *DomainService {
	return &DomainService{
		domainRepo: domainRepo,
		userRepo:   userRepo,
		eventPub:   eventPub,
	}
}

// CreateDomain creates a new domain
func (s *DomainService) CreateDomain(ctx context.Context, req CreateDomainRequest) (*domain.Domain, error) {
	// Validate domain name
	if err := validateDomainName(req.Name); err != nil {
		return nil, errors.NewError(errors.ErrCodeValidationError, "Invalid domain name").WithDetail("domain_name", req.Name)
	}

	// Check if domain already exists
	existing, err := s.domainRepo.GetByName(ctx, req.Name)
	if err == nil && existing != nil {
		return nil, errors.DomainAlreadyExists(req.Name)
	}

	// Verify owner exists
	owner, err := s.userRepo.GetByID(ctx, req.OwnerID)
	if err != nil {
		return nil, errors.InternalError(err)
	}
	if owner == nil {
		return nil, errors.UserNotFound(req.OwnerID)
	}

	// Create domain
	newDomain := &domain.Domain{
		ID:              uuid.New().String(),
		Name:            strings.ToLower(req.Name),
		DisplayName:     req.DisplayName,
		Description:     req.Description,
		IsActive:        true,
		IsVerified:      false,
		MaxUsers:        req.MaxUsers,
		MaxEmailsPerDay: req.MaxEmailsPerDay,
		MaxStorageMB:    req.MaxStorageMB,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
		OwnerID:         req.OwnerID,
	}

	if err := s.domainRepo.Create(ctx, newDomain); err != nil {
		return nil, errors.InternalError(err)
	}

	// Publish event
	event := domain.NewBaseEvent(uuid.New().String(), newDomain.ID, domain.EventTypeDomainCreated, newDomain)
	if err := s.eventPub.Publish(ctx, event); err != nil {
		// Log error but don't fail the operation
	}

	return newDomain, nil
}

// GetDomainByID retrieves a domain by ID
func (s *DomainService) GetDomainByID(ctx context.Context, id string) (*domain.Domain, error) {
	domainEntity, err := s.domainRepo.GetByID(ctx, id)
	if err != nil {
		return nil, errors.InternalError(err)
	}
	if domainEntity == nil {
		return nil, errors.DomainNotFound(id)
	}
	return domainEntity, nil
}

// GetDomainByName retrieves a domain by name
func (s *DomainService) GetDomainByName(ctx context.Context, name string) (*domain.Domain, error) {
	domainEntity, err := s.domainRepo.GetByName(ctx, strings.ToLower(name))
	if err != nil {
		return nil, errors.InternalError(err)
	}
	if domainEntity == nil {
		return nil, errors.DomainNotFound(name)
	}
	return domainEntity, nil
}

// UpdateDomain updates domain information
func (s *DomainService) UpdateDomain(ctx context.Context, req UpdateDomainRequest) (*domain.Domain, error) {
	domainEntity, err := s.domainRepo.GetByID(ctx, req.ID)
	if err != nil {
		return nil, errors.InternalError(err)
	}
	if domainEntity == nil {
		return nil, errors.DomainNotFound(req.ID)
	}

	// Update fields
	if req.DisplayName != nil {
		domainEntity.DisplayName = req.DisplayName
	}
	if req.Description != nil {
		domainEntity.Description = req.Description
	}
	if req.IsActive != nil {
		domainEntity.IsActive = *req.IsActive
	}
	if req.MaxUsers != nil {
		domainEntity.MaxUsers = *req.MaxUsers
	}
	if req.MaxEmailsPerDay != nil {
		domainEntity.MaxEmailsPerDay = *req.MaxEmailsPerDay
	}
	if req.MaxStorageMB != nil {
		domainEntity.MaxStorageMB = *req.MaxStorageMB
	}
	if req.DKIMSelector != nil {
		domainEntity.DKIMSelector = req.DKIMSelector
	}
	if req.DKIMPublicKey != nil {
		domainEntity.DKIMPublicKey = req.DKIMPublicKey
	}
	if req.DKIMPrivateKey != nil {
		domainEntity.DKIMPrivateKey = req.DKIMPrivateKey
	}
	if req.SPFRecord != nil {
		domainEntity.SPFRecord = req.SPFRecord
	}
	if req.DMARCRecord != nil {
		domainEntity.DMARCRecord = req.DMARCRecord
	}

	domainEntity.UpdatedAt = time.Now()

	if err := s.domainRepo.Update(ctx, domainEntity); err != nil {
		return nil, errors.InternalError(err)
	}

	// Publish event
	event := domain.NewBaseEvent(uuid.New().String(), domainEntity.ID, domain.EventTypeDomainUpdated, domainEntity)
	if err := s.eventPub.Publish(ctx, event); err != nil {
		// Log error but don't fail the operation
	}

	return domainEntity, nil
}

// VerifyDomain marks a domain as verified
func (s *DomainService) VerifyDomain(ctx context.Context, id string) error {
	domainEntity, err := s.domainRepo.GetByID(ctx, id)
	if err != nil {
		return errors.InternalError(err)
	}
	if domainEntity == nil {
		return errors.DomainNotFound(id)
	}

	domainEntity.IsVerified = true
	now := time.Now()
	domainEntity.VerifiedAt = &now
	domainEntity.UpdatedAt = now

	if err := s.domainRepo.Update(ctx, domainEntity); err != nil {
		return errors.InternalError(err)
	}

	return nil
}

// DeleteDomain deletes a domain
func (s *DomainService) DeleteDomain(ctx context.Context, id string) error {
	domainEntity, err := s.domainRepo.GetByID(ctx, id)
	if err != nil {
		return errors.InternalError(err)
	}
	if domainEntity == nil {
		return errors.DomainNotFound(id)
	}

	if err := s.domainRepo.Delete(ctx, id); err != nil {
		return errors.InternalError(err)
	}

	// Publish event
	event := domain.NewBaseEvent(uuid.New().String(), domainEntity.ID, domain.EventTypeDomainDeleted, domainEntity)
	if err := s.eventPub.Publish(ctx, event); err != nil {
		// Log error but don't fail the operation
	}

	return nil
}

// ListDomains lists domains with filtering
func (s *DomainService) ListDomains(ctx context.Context, filter repository.DomainFilter) ([]*domain.Domain, error) {
	domains, err := s.domainRepo.List(ctx, filter)
	if err != nil {
		return nil, errors.InternalError(err)
	}
	return domains, nil
}

// CreateDomainRequest represents the request to create a domain
type CreateDomainRequest struct {
	Name            string
	DisplayName     *string
	Description     *string
	OwnerID         string
	MaxUsers        int
	MaxEmailsPerDay int
	MaxStorageMB    int
}

// UpdateDomainRequest represents the request to update a domain
type UpdateDomainRequest struct {
	ID              string
	DisplayName     *string
	Description     *string
	IsActive        *bool
	MaxUsers        *int
	MaxEmailsPerDay *int
	MaxStorageMB    *int
	DKIMSelector    *string
	DKIMPublicKey   *string
	DKIMPrivateKey  *string
	SPFRecord       *string
	DMARCRecord     *string
}

// validateDomainName validates a domain name format
func validateDomainName(name string) error {
	if name == "" {
		return fmt.Errorf("domain name cannot be empty")
	}

	// Basic domain name validation
	name = strings.ToLower(strings.TrimSpace(name))

	// Check length
	if len(name) > 253 {
		return fmt.Errorf("domain name too long")
	}

	// Check if it's a valid hostname
	if _, err := net.LookupHost(name); err != nil {
		// For now, we'll allow it but log a warning
		// In production, you might want to be stricter
	}

	// Check for valid characters
	for _, char := range name {
		if !((char >= 'a' && char <= 'z') || (char >= '0' && char <= '9') || char == '.' || char == '-') {
			return fmt.Errorf("invalid character in domain name")
		}
	}

	// Cannot start or end with hyphen or dot
	if strings.HasPrefix(name, "-") || strings.HasPrefix(name, ".") ||
		strings.HasSuffix(name, "-") || strings.HasSuffix(name, ".") {
		return fmt.Errorf("domain name cannot start or end with hyphen or dot")
	}

	return nil
}
