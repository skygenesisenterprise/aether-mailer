package services

import (
	"errors"
	"fmt"
	"regexp"
	"time"

	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
	"gorm.io/gorm"
)

// DomainService handles domain operations
type DomainService struct {
	db *gorm.DB
}

// NewDomainService creates a new domain service
func NewDomainService(db *gorm.DB) *DomainService {
	return &DomainService{
		db: db,
	}
}

// GetAllDomains retrieves domains with optional filtering and pagination
func (s *DomainService) GetAllDomains(params models.DomainQueryParams) (*models.DomainListResponse, error) {
	var domains []models.Domain
	var total int64

	// Set defaults
	page := 1
	limit := 10
	if params.Page != nil {
		page = *params.Page
	}
	if params.Limit != nil {
		limit = *params.Limit
	}

	// Build query
	query := s.db.Model(&models.Domain{}).Preload("DNSRecords").Preload("MailServerConfig")

	// Apply filters
	if params.Search != nil {
		search := *params.Search
		query = query.Where("name ILIKE ? OR display_name ILIKE ? OR description ILIKE ?",
			fmt.Sprintf("%%%s%%", search),
			fmt.Sprintf("%%%s%%", search),
			fmt.Sprintf("%%%s%%", search))
	}

	if params.IsActive != nil {
		query = query.Where("is_active = ?", *params.IsActive)
	}

	if params.IsVerified != nil {
		query = query.Where("is_verified = ?", *params.IsVerified)
	}

	// Get total count
	if err := query.Count(&total).Error; err != nil {
		return nil, fmt.Errorf("failed to count domains: %w", err)
	}

	// Apply sorting
	sortBy := "name"
	sortOrder := "asc"
	if params.SortBy != nil {
		sortBy = *params.SortBy
	}
	if params.SortOrder != nil {
		sortOrder = *params.SortOrder
	}

	query = query.Order(fmt.Sprintf("%s %s", sortBy, sortOrder))

	// Apply pagination
	offset := (page - 1) * limit
	if err := query.Offset(offset).Limit(limit).Find(&domains).Error; err != nil {
		return nil, fmt.Errorf("failed to retrieve domains: %w", err)
	}

	return &models.DomainListResponse{
		Domains: domains,
		Total:   int(total),
		Page:    page,
		Limit:   limit,
	}, nil
}

// GetDomainByID retrieves a domain by ID
func (s *DomainService) GetDomainByID(id string) (*models.Domain, error) {
	var domain models.Domain
	if err := s.db.Preload("DNSRecords").Preload("MailServerConfig").Where("id = ?", id).First(&domain).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to retrieve domain: %w", err)
	}

	return &domain, nil
}

// CreateDomain creates a new domain
func (s *DomainService) CreateDomain(data models.CreateDomainRequest, createdBy *string) (*models.Domain, error) {
	// Check if domain name already exists
	var existingDomain models.Domain
	if err := s.db.Where("LOWER(name) = LOWER(?)", data.Name).First(&existingDomain).Error; err == nil {
		return nil, errors.New("domain with this name already exists")
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, fmt.Errorf("failed to check existing domain: %w", err)
	}

	// Create domain
	domain := models.Domain{
		Name:        data.Name,
		DisplayName: data.DisplayName,
		Description: data.Description,
		IsActive:    true,
		IsVerified:  false,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
		CreatedBy:   createdBy,
	}

	// Start transaction
	tx := s.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Create domain
	if err := tx.Create(&domain).Error; err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("failed to create domain: %w", err)
	}

	// Create mail server config if provided
	if data.MailServerConfig != nil {
		mailConfig := models.MailServerConfig{
			DomainID:       domain.ID,
			Host:           data.MailServerConfig.Host,
			Port:           data.MailServerConfig.Port,
			Protocol:       data.MailServerConfig.Protocol,
			AuthType:       data.MailServerConfig.AuthType,
			Username:       data.MailServerConfig.Username,
			Password:       data.MailServerConfig.Password,
			MaxConnections: data.MailServerConfig.MaxConnections,
			Timeout:        data.MailServerConfig.Timeout,
			IsSecure:       data.MailServerConfig.IsSecure,
			IsActive:       true,
			CreatedAt:      time.Now(),
			UpdatedAt:      time.Now(),
		}

		if err := tx.Create(&mailConfig).Error; err != nil {
			tx.Rollback()
			return nil, fmt.Errorf("failed to create mail server config: %w", err)
		}

		domain.MailServerConfig = &mailConfig
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return &domain, nil
}

// UpdateDomain updates an existing domain
func (s *DomainService) UpdateDomain(id string, data models.UpdateDomainRequest, updatedBy *string) (*models.Domain, error) {
	// Check if domain exists
	domain, err := s.GetDomainByID(id)
	if err != nil {
		return nil, fmt.Errorf("failed to get domain: %w", err)
	}
	if domain == nil {
		return nil, errors.New("domain not found")
	}

	// Update domain fields
	updateData := map[string]interface{}{
		"updated_at": time.Now(),
		"updated_by": updatedBy,
	}

	if data.DisplayName != nil {
		updateData["display_name"] = *data.DisplayName
	}
	if data.Description != nil {
		updateData["description"] = *data.Description
	}
	if data.IsActive != nil {
		updateData["is_active"] = *data.IsActive
	}
	if data.IsVerified != nil {
		updateData["is_verified"] = *data.IsVerified
	}

	// Start transaction
	tx := s.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Update domain
	if err := tx.Model(&models.Domain{}).Where("id = ?", id).Updates(updateData).Error; err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("failed to update domain: %w", err)
	}

	// Update mail server config if provided
	if data.MailServerConfig != nil {
		if domain.MailServerConfig == nil {
			// Create new mail server config
			mailConfig := models.MailServerConfig{
				DomainID:  domain.ID,
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
			}

			// Set fields from update data
			if data.MailServerConfig.Host != nil {
				mailConfig.Host = *data.MailServerConfig.Host
			}
			if data.MailServerConfig.Port != nil {
				mailConfig.Port = *data.MailServerConfig.Port
			}
			if data.MailServerConfig.Protocol != nil {
				mailConfig.Protocol = *data.MailServerConfig.Protocol
			}
			if data.MailServerConfig.AuthType != nil {
				mailConfig.AuthType = *data.MailServerConfig.AuthType
			}
			if data.MailServerConfig.Username != nil {
				mailConfig.Username = data.MailServerConfig.Username
			}
			if data.MailServerConfig.Password != nil {
				mailConfig.Password = data.MailServerConfig.Password
			}
			if data.MailServerConfig.MaxConnections != nil {
				mailConfig.MaxConnections = *data.MailServerConfig.MaxConnections
			}
			if data.MailServerConfig.Timeout != nil {
				mailConfig.Timeout = *data.MailServerConfig.Timeout
			}
			if data.MailServerConfig.IsSecure != nil {
				mailConfig.IsSecure = *data.MailServerConfig.IsSecure
			}
			if data.MailServerConfig.IsActive != nil {
				mailConfig.IsActive = *data.MailServerConfig.IsActive
			}

			if err := tx.Create(&mailConfig).Error; err != nil {
				tx.Rollback()
				return nil, fmt.Errorf("failed to create mail server config: %w", err)
			}
		} else {
			// Update existing mail server config
			if err := tx.Model(domain.MailServerConfig).Updates(data.MailServerConfig).Error; err != nil {
				tx.Rollback()
				return nil, fmt.Errorf("failed to update mail server config: %w", err)
			}
		}
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	// Refresh domain data
	return s.GetDomainByID(id)
}

// DeleteDomain deletes a domain
func (s *DomainService) DeleteDomain(id string) error {
	// Check if domain exists
	var domain models.Domain
	if err := s.db.Where("id = ?", id).First(&domain).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("domain not found")
		}
		return fmt.Errorf("failed to find domain: %w", err)
	}

	// Start transaction
	tx := s.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Delete related records
	if err := tx.Where("domain_id = ?", id).Delete(&models.DnsRecord{}).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to delete DNS records: %w", err)
	}

	if err := tx.Where("domain_id = ?", id).Delete(&models.MailServerConfig{}).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to delete mail server config: %w", err)
	}

	// Delete domain
	if err := tx.Delete(&domain).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to delete domain: %w", err)
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// VerifyDomain verifies domain ownership
func (s *DomainService) VerifyDomain(id string) (*models.Domain, error) {
	// In a real implementation, this would check DNS records
	// For now, we'll just mark the domain as verified
	return s.UpdateDomain(id, models.UpdateDomainRequest{
		IsVerified: &[]bool{true}[0],
	}, nil)
}

// GetDomainStats retrieves domain statistics
func (s *DomainService) GetDomainStats() (*struct {
	Total      int `json:"total"`
	Active     int `json:"active"`
	Verified   int `json:"verified"`
	Inactive   int `json:"inactive"`
	Unverified int `json:"unverified"`
}, error) {
	var stats struct {
		Total      int `json:"total"`
		Active     int `json:"active"`
		Verified   int `json:"verified"`
		Inactive   int `json:"inactive"`
		Unverified int `json:"unverified"`
	}

	// Get total domains
	var total int64
	if err := s.db.Model(&models.Domain{}).Count(&total).Error; err != nil {
		return nil, fmt.Errorf("failed to count total domains: %w", err)
	}
	stats.Total = int(total)

	// Get active domains
	var active int64
	if err := s.db.Model(&models.Domain{}).Where("is_active = ?", true).Count(&active).Error; err != nil {
		return nil, fmt.Errorf("failed to count active domains: %w", err)
	}
	stats.Active = int(active)

	// Get verified domains
	var verified int64
	if err := s.db.Model(&models.Domain{}).Where("is_verified = ?", true).Count(&verified).Error; err != nil {
		return nil, fmt.Errorf("failed to count verified domains: %w", err)
	}
	stats.Verified = int(verified)

	// Calculate inactive and unverified
	stats.Inactive = stats.Total - stats.Active
	stats.Unverified = stats.Total - stats.Verified

	return &stats, nil
}

// CheckDomainAvailability checks if a domain name is available
func (s *DomainService) CheckDomainAvailability(name string) (*struct {
	Available bool   `json:"available"`
	Reason    string `json:"reason,omitempty"`
}, error) {
	result := struct {
		Available bool   `json:"available"`
		Reason    string `json:"reason,omitempty"`
	}{Available: true}

	// Check if domain already exists
	var existingDomain models.Domain
	if err := s.db.Where("LOWER(name) = LOWER(?)", name).First(&existingDomain).Error; err == nil {
		result.Available = false
		result.Reason = "Domain name is already registered"
		return &result, nil
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, fmt.Errorf("failed to check existing domain: %w", err)
	}

	// Basic domain validation
	domainRegex := regexp.MustCompile(`^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$`)
	if !domainRegex.MatchString(name) {
		result.Available = false
		result.Reason = "Invalid domain name format"
	}

	return &result, nil
}

// AddDnsRecord adds a DNS record to a domain
func (s *DomainService) AddDnsRecord(domainID string, record models.DnsRecord) (*models.DnsRecord, error) {
	// Check if domain exists
	var domain models.Domain
	if err := s.db.Where("id = ?", domainID).First(&domain).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("domain not found")
		}
		return nil, fmt.Errorf("failed to find domain: %w", err)
	}

	// Create DNS record
	record.DomainID = domainID
	record.CreatedAt = time.Now()
	record.UpdatedAt = time.Now()

	if err := s.db.Create(&record).Error; err != nil {
		return nil, fmt.Errorf("failed to create DNS record: %w", err)
	}

	return &record, nil
}

// UpdateMailServerConfig updates the mail server configuration for a domain
func (s *DomainService) UpdateMailServerConfig(domainID string, config models.UpdateMailServerConfig) (*models.MailServerConfig, error) {
	// Check if domain exists
	var domain models.Domain
	if err := s.db.Where("id = ?", domainID).First(&domain).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("domain not found")
		}
		return nil, fmt.Errorf("failed to find domain: %w", err)
	}

	var mailConfig models.MailServerConfig

	// Check if mail server config exists
	if err := s.db.Where("domain_id = ?", domainID).First(&mailConfig).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// Create new mail server config
			mailConfig = models.MailServerConfig{
				DomainID:  domainID,
				Host:      "localhost",
				Port:      587,
				Protocol:  models.MailProtocolSTARTTLS,
				AuthType:  models.MailAuthTypePlain,
				IsActive:  true,
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
			}

			// Set fields from update data
			if config.Host != nil {
				mailConfig.Host = *config.Host
			}
			if config.Port != nil {
				mailConfig.Port = *config.Port
			}
			if config.Protocol != nil {
				mailConfig.Protocol = *config.Protocol
			}
			if config.AuthType != nil {
				mailConfig.AuthType = *config.AuthType
			}
			if config.Username != nil {
				mailConfig.Username = config.Username
			}
			if config.Password != nil {
				mailConfig.Password = config.Password
			}
			if config.MaxConnections != nil {
				mailConfig.MaxConnections = *config.MaxConnections
			}
			if config.Timeout != nil {
				mailConfig.Timeout = *config.Timeout
			}
			if config.IsSecure != nil {
				mailConfig.IsSecure = *config.IsSecure
			}
			if config.IsActive != nil {
				mailConfig.IsActive = *config.IsActive
			}

			if err := s.db.Create(&mailConfig).Error; err != nil {
				return nil, fmt.Errorf("failed to create mail server config: %w", err)
			}
		} else {
			return nil, fmt.Errorf("failed to check mail server config: %w", err)
		}
	} else {
		// Update existing config
		if err := s.db.Model(&mailConfig).Updates(config).Error; err != nil {
			return nil, fmt.Errorf("failed to update mail server config: %w", err)
		}
	}

	return &mailConfig, nil
}
