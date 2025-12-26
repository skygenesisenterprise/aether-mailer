package config

import (
	"fmt"
	"os"
	"strconv"
)

// Config represents application configuration
type Config struct {
	Server    ServerConfig    `json:"server"`
	Database  DatabaseConfig  `json:"database"`
	JWT       JWTConfig       `json:"jwt"`
	CORS      CORSConfig      `json:"cors"`
	RateLimit RateLimitConfig `json:"rateLimit"`
	APIKey    APIKeyConfig    `json:"apiKey"`
	NodeEnv   string          `json:"nodeEnv"`
}

// ServerConfig represents server configuration
type ServerConfig struct {
	Port int `json:"port"`
}

// DatabaseConfig represents database configuration
type DatabaseConfig struct {
	Host     string `json:"host"`
	Port     int    `json:"port"`
	User     string `json:"user"`
	Password string `json:"password"`
	Name     string `json:"name"`
	SSLMode  string `json:"sslMode"`
	Enabled  bool   `json:"enabled"`
}

// JWTConfig represents JWT configuration
type JWTConfig struct {
	Secret    string `json:"secret"`
	ExpiresIn string `json:"expiresIn"`
}

// CORSConfig represents CORS configuration
type CORSConfig struct {
	Origins     []string `json:"origins"`
	Credentials bool     `json:"credentials"`
}

// RateLimitConfig represents rate limiting configuration
type RateLimitConfig struct {
	WindowMS int `json:"windowMS"`
	Max      int `json:"max"`
}

// APIKeyConfig represents API key configuration
type APIKeyConfig struct {
	Prefix     string `json:"prefix"`
	KeyLength  int    `json:"keyLength"`
	HashRounds int    `json:"hashRounds"`
	DefaultTTL int    `json:"defaultTTL"`
	SystemKey  string `json:"systemKey"`
}

// LoadConfig loads configuration from environment variables
func LoadConfig() (*Config, error) {
	config := &Config{
		Server: ServerConfig{
			Port: getEnvInt("PORT", 8080),
		},
		Database: DatabaseConfig{
			Host:     getEnv("DATABASE_HOST", "localhost"),
			Port:     getEnvInt("DATABASE_PORT", 5432),
			User:     getEnv("DATABASE_USER", "postgres"),
			Password: getEnv("DATABASE_PASSWORD", ""),
			Name:     getEnv("DATABASE_NAME", "aether_mailer"),
			SSLMode:  getEnv("DATABASE_SSL_MODE", "disable"),
			Enabled:  getEnvBool("DATABASE_ENABLED", true),
		},
		JWT: JWTConfig{
			Secret:    getEnv("JWT_SECRET", "your-secret-key"),
			ExpiresIn: getEnv("JWT_EXPIRES_IN", "24h"),
		},
		CORS: CORSConfig{
			Origins:     getEnvStringSlice("API_CORS_ORIGINS", []string{"http://localhost:3000"}),
			Credentials: getEnvBool("API_CORS_CREDENTIALS", true),
		},
		RateLimit: RateLimitConfig{
			WindowMS: getEnvInt("RATE_LIMIT_WINDOW_MS", 15*60*1000), // 15 minutes
			Max:      getEnvInt("RATE_LIMIT_MAX", 100),              // limit each IP to 100 requests per window
		},
		APIKey: APIKeyConfig{
			Prefix:     getEnv("API_KEY_PREFIX", "sk_"),
			KeyLength:  getEnvInt("API_KEY_LENGTH", 32),
			HashRounds: getEnvInt("API_KEY_HASH_ROUNDS", 12),
			DefaultTTL: getEnvInt("API_KEY_DEFAULT_TTL", 720), // 30 days in hours
			SystemKey:  getEnv("API_KEY_SYSTEM", ""),
		},
		NodeEnv: getEnv("NODE_ENV", "development"),
	}

	// Validate required configuration
	if config.JWT.Secret == "your-secret-key" && config.NodeEnv == "production" {
		return nil, fmt.Errorf("JWT_SECRET must be set in production")
	}

	if config.Database.Password == "" && config.NodeEnv == "production" {
		return nil, fmt.Errorf("DATABASE_PASSWORD must be set in production")
	}

	return config, nil
}

// getEnv gets environment variable with default value
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// getEnvInt gets environment variable as integer with default value
func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}

// getEnvBool gets environment variable as boolean with default value
func getEnvBool(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		return value == "true" || value == "1"
	}
	return defaultValue
}

// getEnvStringSlice gets environment variable as string slice with default value
func getEnvStringSlice(key string, defaultValue []string) []string {
	if value := os.Getenv(key); value != "" {
		// Simple comma-separated split
		// In a real implementation, you might want more sophisticated parsing
		return []string{value}
	}
	return defaultValue
}
