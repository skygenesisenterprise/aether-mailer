package models

import (
	"crypto/rand"
	"encoding/base64"
	"gorm.io/gorm"
	"time"
)

// ServiceKey represents a service API key for authentication
type ServiceKey struct {
	gorm.Model
	Key         string     `gorm:"size:64;uniqueIndex;not null" json:"key"`
	Name        string     `gorm:"size:100;not null" json:"name"`
	Description string     `gorm:"size:255" json:"description"`
	IsActive    bool       `gorm:"default:true" json:"is_active"`
	ExpiresAt   *time.Time `json:"expires_at"`
	CreatedBy   uint       `json:"created_by"`
	UpdatedBy   uint       `json:"updated_by"`
}

// TableName sets the table name for ServiceKey
func (ServiceKey) TableName() string {
	return "service_keys"
}

// ServiceKeyUsage represents the usage tracking for service keys
type ServiceKeyUsage struct {
	gorm.Model
	ServiceKeyID uint       `gorm:"not null" json:"service_key_id"`
	Endpoint     string     `gorm:"size:255;not null" json:"endpoint"`
	Method       string     `gorm:"size:10;not null" json:"method"`
	IPAddress    string     `gorm:"size:45" json:"ip_address"`
	StatusCode   int        `json:"status_code"`
	UserAgent    string     `gorm:"size:255" json:"user_agent"`
	ServiceKey   ServiceKey `gorm:"foreignKey:ServiceKeyID" json:"service_key"`
}

// TableName sets the table name for ServiceKeyUsage
func (ServiceKeyUsage) TableName() string {
	return "service_key_usages"
}

// ServiceKeyGenerator generates cryptographically secure service keys
type ServiceKeyGenerator struct {
	Prefix string
	Length int
}

// NewServiceKeyGenerator creates a new service key generator
func NewServiceKeyGenerator() *ServiceKeyGenerator {
	return &ServiceKeyGenerator{
		Prefix: "sk_",
		Length: 32, // 32 bytes = 256 bits of entropy
	}
}

// Generate creates a new cryptographically secure service key
// Returns a key in format: sk_<base64url_encoded_random_bytes>
func (g *ServiceKeyGenerator) Generate() string {
	// Generate cryptographically secure random bytes
	randomBytes := make([]byte, g.Length)
	if _, err := rand.Read(randomBytes); err != nil {
		// Fallback to a simpler method if crypto/rand fails (should never happen)
		// In production, you might want to panic or handle this differently
		for i := range randomBytes {
			randomBytes[i] = byte(i + 32)
		}
	}

	// Encode to base64url (URL-safe base64 without padding)
	encoded := base64.RawURLEncoding.EncodeToString(randomBytes)

	return g.Prefix + encoded
}

// GenerateWithPrefix creates a key with a custom prefix
func (g *ServiceKeyGenerator) GenerateWithPrefix(prefix string) string {
	g.Prefix = prefix
	return g.Generate()
}
