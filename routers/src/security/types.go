package security

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/spf13/cobra"
	"github.com/spf13/viper"
	"github.com/skygenesisenterprise/aether-mailer/routers/pkg/routerpkg"
)

// types.go defines security-related types and interfaces
type (
	// Authentication types
	AuthType string

	// Firewall types
	FirewallAction string
	FirewallRule struct {
		ID          string          `json:"id"`
		Action      string          `json:"action"`
		Source      string          `json:"source"`
		Protocol    string          `json:"protocol"`
		Ports       []int           `json:"ports"`
		Enabled     bool            `json:"enabled"`
		Comment     string          `json:"comment,omitempty"`
		CreatedAt    time.Time      `json:"created_at"`
	}

	// Rate limiting types
	RateLimitAlgorithm string
	RateLimitStorage string

	RateLimitRule struct {
		ID          string    `json:"id"`
		Path        string    `json:"path"`
		Method      string    `json:"method"`
		Limit       int       `json:"limit"`
		Window      string    `json:"window"`
		Enabled     bool       `json:"enabled"`
		Comment     string    `json:"comment,omitempty"`
		Criteria    string    `json:"criteria,omitempty"`
		ExpiresAt   time.Time   `json:"expires_at,omitempty"`
	}

	// SSL/TLS types
	SSLProtocol string
	SSLCipherSuite []string
	SSLOptions struct {
		MinVersion    string `json:"min_version,omitempty"`
		CipherSuits  []string `json:"cipher_suites,omitempty"`
		Protocols    []string `json:"protocols,omitempty"`
		PreferServerCipher bool   `json:"prefer_server_cipher,omitempty"`
	}

	SSLCertificate struct {
		Host        string    `json:"host"`
		Paths       []string  `json:"paths,omitempty"`
		Issuer     string    `json:"issuer"`
		Serial      string    `json:"serial"`
		NotBefore   time.Time   `json:"not_before,omitempty"`
		NotAfter    time.Time   `json:"not_after,omitempty"`
		CreatedAt   time.Time   `json:"created_at"`
		ExpiresAt   time.Time   `json:"expires_at,omitempty"`
		Fingerprint string     `json:"fingerprint,omitempty"`
		IsAuto      bool       `json:"is_auto,omitempty"`
		KeySize    int        `json:"key_size,omitempty"`
	}

	// JWT types
	JWTConfig struct {
		Secret     string  `json:"secret,omitempty"`
		Issuer     string  `json:"issuer"`
		Audience   string  `json:"audience,omitempty"`
		Algorithm   string  `json:"algorithm"`
		Expiry     string  `json:"expiry,omitempty"`
		// Claims for validation
		RequiredClaims []string `json:"required_claims"`
	}

	// OAuth types
	OAuthConfig struct {
		Provider   string   `json:"provider,omitempty"`
		ClientID   string   `json:"client_id,omitempty"`
		ClientSecret string   `json:"client_secret,omitempty"`
		IssuerURL  string  `json:"issuer_url,omitempty"`
		Scopes    []string `json:"scopes,omitempty"`
	}

	// Basic Auth types
	BasicCredentials struct {
		Username string  `json:"username"`
		Password string  `json:"password"`
	}

	// CORS types
	CORSConfig struct {
		Enabled          bool       `json:"enabled"`
		AllowedOrigins   []string   `json:"allowed_origins"`
		AllowedMethods   []string   `json:"allowed_methods"`
		AllowedHeaders   []string   `json:"allowed_headers"`
		AllowCredentials bool       `json:"allow_credentials"`
		MaxAge           int        `json:"max_age"`
		ExposedHeaders   []string   `json:"exposed_headers"`
	}
)


// Security configuration
type SecurityConfig struct {
	RateLimit  RateLimitConfig  `json:"rate_limit"`
	Firewall   FirewallConfig   `json:"firewall"`
	Auth       AuthConfig       `json:"auth"`
	CORS       CORSConfig       `json:"cors"`
	SSL        SSLConfig        `json:"ssl"`
}

// Default configurations
const (
	DefaultAuthType = "none"
	DefaultRateLimitStorage = "memory"
	DefaultRateLimitAlgorithm = "token_bucket"
	DefaultRateLimitWindow = "1m"
	DefaultRateLimitLimit = 1000
	DefaultFirewallEnabled = false
	DefaultCORSAllowedOrigins = []string{"*"}
	DefaultCORSAllowedMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"}
	DefaultCORSAllowedHeaders = []string{
		"Origin", "Content-Type", "Accept", "Authorization", "X-Request-ID", "X-API-Key",
	}
	DefaultCORSMaxAge = 86400
	DefaultSSLCertFile = "/etc/ssl/certs/router.crt"
	DefaultSSLKeyFile = "/etc/ssl/private/router.key"
	DefaultSSLAutoCert = false
	DefaultSSMinVersion = "1.2"
	DefaultSSCipherSuites = []string{
		"TLS_AES_128_GCM_SHA256",
		"TLS_AES_256_GCM_SHA384",
		"TLS_CHACHA20_POLY1305_SHA256",
		"TLS_AES_128_CBC_SHA",
	}
	DefaultSSLProtocols = []string{
		"h2", "http/1.1",
	}

	DefaultJWTSecret = ""
	DefaultJWTExpiry = "24h"
	DefaultJWTAudience = "aether-mailer-api"
	DefaultJWTAlgorithm = "HS256"
	DefaultOAuthClientID = ""
	DefaultOAuthClientSecret = ""
	DefaultOAuthIssuerURL = ""


	// Security error codes
const (
	ErrCodeRateLimitExceeded   = "RATE_LIMIT_EXCEEDED"
	ErrCodeUnauthorized       = "UNAUTHORIZED"
	ErrCodeForbidden          = "FORBIDDEN"
	ErrCodeInvalidCredentials   = "INVALID_CREDENTIALS"
	ErrCodeInvalidToken        = "INVALID_TOKEN"
	ErrCodeMissingHeader      = "MISSING_HEADER"
	ErrCodeRateLimitBlocklisted = "RATE_LIMIT_BLOCKLISTED"
	ErrCodeRateLimitInvalidConfig  = "RATE_LIMIT_INVALID_CONFIG"
	ErrCodeFirewallBlockRule     = "FIREWALL_BLOCK_RULE"
	ErrCodeSSLInvalid          = "SSL_INVALID"
	ErrCodeSSConfigError       = "SSL_CONFIG_ERROR"
)

// Rate limiting algorithms
const (
	RateLimitAlgorithmTokenBucket = "token_bucket"
	RateLimitAlgorithmFixedWindow = "fixed_window"
	RateLimitAlgorithmSlidingWindow = "sliding_window"
	RateLimitAlgorithmLeakyBucket = "leaky_bucket"
)