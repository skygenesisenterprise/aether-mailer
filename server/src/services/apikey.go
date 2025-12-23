package services

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"fmt"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
	"github.com/skygenesisenterprise/aether-mailer/server/src/config"
	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// ApiKeyService handles API key operations
type ApiKeyService struct {
	db     *gorm.DB
	config *ApiKeyConfig
}

// ApiKeyConfig represents API key configuration
type ApiKeyConfig = config.APIKeyConfig

// NewApiKeyService creates a new API key service
func NewApiKeyService(db *gorm.DB, config *ApiKeyConfig) *ApiKeyService {
	return &ApiKeyService{
		db:     db,
		config: config,
	}
}

// GenerateAPIKey generates a new API key with sk_ prefix
func (s *ApiKeyService) GenerateAPIKey() string {
	// Generate random bytes
	randomBytes := make([]byte, s.config.KeyLength)
	if _, err := rand.Read(randomBytes); err != nil {
		log.Error().Err(err).Msg("Failed to generate random bytes for API key")
		return ""
	}

	// Encode to base64
	key := base64.URLEncoding.EncodeToString(randomBytes)

	// Remove padding and ensure proper length
	key = strings.TrimRight(key, "=")
	if len(key) > s.config.KeyLength {
		key = key[:s.config.KeyLength]
	}

	return fmt.Sprintf("sk_%s", key)
}

// GenerateSystemAPIKey generates a system API key with 16 characters
func (s *ApiKeyService) GenerateSystemAPIKey() string {
	// Generate 16 random bytes for system key
	randomBytes := make([]byte, 16)
	if _, err := rand.Read(randomBytes); err != nil {
		log.Error().Err(err).Msg("Failed to generate random bytes for system API key")
		return ""
	}

	// Encode to base64 and clean up
	key := base64.URLEncoding.EncodeToString(randomBytes)
	key = strings.TrimRight(key, "=")

	// Ensure exactly 16 characters
	if len(key) > 16 {
		key = key[:16]
	}

	return fmt.Sprintf("sk_sys_%s", key)
}

// CreateApiKey creates a new API key
func (s *ApiKeyService) CreateApiKey(userID, name string, permissions []string, expiresAt *time.Time) (*models.ApiKeyResponse, error) {
	// Generate API key
	apiKey := s.GenerateAPIKey()

	// Hash the API key for storage
	hashedKey, err := bcrypt.GenerateFromPassword([]byte(apiKey), s.config.HashRounds)
	if err != nil {
		return nil, fmt.Errorf("failed to hash API key: %w", err)
	}

	// Set default expiration if not provided
	if expiresAt == nil {
		ttl := time.Duration(s.config.DefaultTTL) * time.Hour
		exp := time.Now().Add(ttl)
		expiresAt = &exp
	}

	// Create API key record
	keyRecord := models.ApiKey{
		ID:          generateUUID(),
		UserID:      userID,
		Name:        name,
		Key:         string(hashedKey),
		Permissions: permissions,
		IsActive:    true,
		ExpiresAt:   expiresAt,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	// Save to database
	if err := s.db.Create(&keyRecord).Error; err != nil {
		return nil, fmt.Errorf("failed to create API key: %w", err)
	}

	// Return response (only include actual key during creation)
	response := &models.ApiKeyResponse{
		ID:          keyRecord.ID,
		Name:        keyRecord.Name,
		Key:         apiKey, // Only show actual key during creation
		Permissions: keyRecord.Permissions,
		IsActive:    keyRecord.IsActive,
		ExpiresAt:   keyRecord.ExpiresAt,
		CreatedAt:   keyRecord.CreatedAt,
		LastUsedAt:  keyRecord.LastUsedAt,
	}

	log.Info().
		Str("keyId", keyRecord.ID).
		Str("userId", userID).
		Str("name", name).
		Msg("API key created successfully")

	return response, nil
}

// ValidateAPIKey validates an API key and returns key data
func (s *ApiKeyService) ValidateAPIKey(apiKey string, ctx *gin.Context) (*models.ApiKey, error) {
	// Check for system key first
	if s.config.SystemKey != "" && subtle.ConstantTimeCompare([]byte(apiKey), []byte(s.config.SystemKey)) == 1 {
		// Return a mock system key record
		return &models.ApiKey{
			ID:          "system-key",
			UserID:      "system",
			Name:        "system",
			Key:         "",            // No stored hash for system key
			Permissions: []string{"*"}, // System key has all permissions
			IsActive:    true,
			ExpiresAt:   nil, // System key never expires
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		}, nil
	}

	// Get all active API keys from database
	var keys []models.ApiKey
	if err := s.db.Where("is_active = ?", true).Find(&keys).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch API keys: %w", err)
	}

	// Check each key
	for _, key := range keys {
		// Compare the provided key with the stored hash
		if err := bcrypt.CompareHashAndPassword([]byte(key.Key), []byte(apiKey)); err == nil {
			// Valid key found
			return &key, nil
		}
	}

	return nil, fmt.Errorf("invalid API key")
}

// UpdateLastUsed updates the last used timestamp for an API key
func (s *ApiKeyService) UpdateLastUsed(keyID string) error {
	now := time.Now()
	if err := s.db.Model(&models.ApiKey{}).Where("id = ?", keyID).Update("last_used_at", now).Error; err != nil {
		return fmt.Errorf("failed to update last used timestamp: %w", err)
	}
	return nil
}

// ListApiKeys lists all API keys for a user
func (s *ApiKeyService) ListApiKeys(userID string) ([]models.ApiKey, error) {
	var keys []models.ApiKey
	if err := s.db.Where("user_id = ?", userID).Find(&keys).Error; err != nil {
		return nil, fmt.Errorf("failed to list API keys: %w", err)
	}
	return keys, nil
}

// GetApiKey gets an API key by ID
func (s *ApiKeyService) GetApiKey(keyID string) (*models.ApiKey, error) {
	var key models.ApiKey
	if err := s.db.Where("id = ?", keyID).First(&key).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("API key not found")
		}
		return nil, fmt.Errorf("failed to get API key: %w", err)
	}
	return &key, nil
}

// RevokeApiKey revokes an API key
func (s *ApiKeyService) RevokeApiKey(keyID string) error {
	if err := s.db.Model(&models.ApiKey{}).Where("id = ?", keyID).Update("is_active", false).Error; err != nil {
		return fmt.Errorf("failed to revoke API key: %w", err)
	}

	log.Info().
		Str("keyId", keyID).
		Msg("API key revoked successfully")

	return nil
}

// UpdateApiKey updates an API key
func (s *ApiKeyService) UpdateApiKey(keyID string, name string, permissions []string) error {
	updates := map[string]interface{}{
		"name":        name,
		"permissions": permissions,
		"updated_at":  time.Now(),
	}

	if err := s.db.Model(&models.ApiKey{}).Where("id = ?", keyID).Updates(updates).Error; err != nil {
		return fmt.Errorf("failed to update API key: %w", err)
	}

	log.Info().
		Str("keyId", keyID).
		Msg("API key updated successfully")

	return nil
}

// GetApiKeyUsageStats returns usage statistics for an API key
func (s *ApiKeyService) GetApiKeyUsageStats(keyID string) (*models.ApiKeyUsageStats, error) {
	// This would typically query an ApiUsage table
	// For now, return basic info from the key itself
	key, err := s.GetApiKey(keyID)
	if err != nil {
		return nil, err
	}

	stats := &models.ApiKeyUsageStats{
		KeyID:      key.ID,
		Name:       key.Name,
		LastUsedAt: key.LastUsedAt,
		CreatedAt:  key.CreatedAt,
		// Additional fields would be populated from usage logs
	}

	return stats, nil
}

// CleanupExpiredKeys removes expired API keys
func (s *ApiKeyService) CleanupExpiredKeys() error {
	result := s.db.Where("expires_at < ? AND is_active = ?", time.Now(), true).
		Update("is_active", false)

	if result.Error != nil {
		return fmt.Errorf("failed to cleanup expired API keys: %w", result.Error)
	}

	if result.RowsAffected > 0 {
		log.Info().
			Int64("deactivatedKeys", result.RowsAffected).
			Msg("Cleaned up expired API keys")
	}

	return nil
}

// InitializeSystemKey creates or verifies the system key
func (s *ApiKeyService) InitializeSystemKey() error {
	if s.config.SystemKey == "" {
		// Generate a new system key with 16 characters
		s.config.SystemKey = s.GenerateSystemAPIKey()
		log.Info().
			Str("systemKey", s.config.SystemKey).
			Msg("Generated new system API key")

		// In a real implementation, you would save this securely
		// For now, just log it (in production, use secure storage)
		return nil
	}

	// Validate existing system key format
	if !strings.HasPrefix(s.config.SystemKey, "sk_") {
		return fmt.Errorf("system key must start with 'sk_' prefix")
	}

	log.Info().
		Msg("System API key initialized successfully")

	return nil
}

// GenerateSystemAPIKey generates a system API key with 16 characters
func (s *ApiKeyService) GenerateSystemAPIKey() string {
	// Generate 16 random bytes for system key
	randomBytes := make([]byte, 16)
	if _, err := rand.Read(randomBytes); err != nil {
		log.Error().Err(err).Msg("Failed to generate random bytes for system API key")
		return ""
	}

	// Encode to base64 and clean up
	key := base64.URLEncoding.EncodeToString(randomBytes)
	key = strings.TrimRight(key, "=")

	// Ensure exactly 16 characters
	if len(key) > 16 {
		key = key[:16]
	}

	return fmt.Sprintf("sk_%s", key)
}

// generateUUID generates a UUID (simplified version)
func generateUUID() string {
	// This is a simplified UUID generator
	// In production, use a proper UUID library
	b := make([]byte, 16)
	rand.Read(b)
	return fmt.Sprintf("%x-%x-%x-%x-%x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:16])
}
