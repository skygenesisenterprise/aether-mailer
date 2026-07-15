package config

import (
	"errors"
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
)

const devJWTSecret = "dev-insecure-secret-change-me"

type Config struct {
	App      AppConfig
	Server   ServerConfig
	Database DatabaseConfig
	Redis    RedisConfig
	Auth     AuthConfig
	OAuth    OAuthConfig
	CORS     CORSConfig
}

type OAuthProviderConfig struct {
	ClientID     string
	ClientSecret string
	RedirectURL  string
	Enabled      bool
}

type OAuthConfig struct {
	Google  OAuthProviderConfig
	GitHub  OAuthProviderConfig
	StateTTL time.Duration
}

type AppConfig struct {
	Env            string
	Name           string
	Version        string
	Mode           string
	AccessLogs     bool
	TrustedProxies []string
}

type ServerConfig struct {
	Host string
	Port string
}

type DatabaseConfig struct {
	URL      string
	Host     string
	Port     string
	User     string
	Name     string
	Password string
}

type RedisConfig struct {
	Enabled        bool
	Required       bool
	URL            string
	Host           string
	Port           string
	Password       string
	DB             int
	KeyPrefix      string
	DefaultTTL     time.Duration
	ConnectTimeout time.Duration
	ReadTimeout    time.Duration
	WriteTimeout   time.Duration
	MaxRetries     int
}

type AuthConfig struct {
	Enabled                bool
	LocalEnabled           bool
	Mode                   string
	JWTSecret              string
	JWTIssuer              string
	JWTAccessTTL           time.Duration
	JWTRefreshTTL          time.Duration
	RefreshCookieName      string
	CookieSecure           bool
	CookieSameSite         string
	CookieDomain           string
	PasswordMinLength      int
	Argon2Memory           uint32
	Argon2Iterations       uint32
	Argon2Parallelism      uint8
	SessionCleanupInterval time.Duration
	EmailVerificationTTL   time.Duration
	PasswordResetTTL       time.Duration
	RateLimitEnabled       bool
}

type CORSConfig struct {
	AllowedOrigins []string
}

func Load() (Config, error) {
	cfg := Config{
		App: AppConfig{
			Env:            getEnv("APP_ENV", "development"),
			Name:           getEnv("APP_NAME", "Aether Account"),
			Version:        getEnv("APP_VERSION", "dev"),
			Mode:           getEnv("GIN_MODE", "debug"),
			AccessLogs:     getEnvBool("API_ACCESS_LOGS", true),
			TrustedProxies: getEnvSlice("TRUSTED_PROXY_CIDRS", nil),
		},
		Server: ServerConfig{
			Host: getEnv("HOST", "0.0.0.0"),
			Port: getEnv("API_PORT", "8080"),
		},
		Database: DatabaseConfig{
			URL:      strings.TrimSpace(getEnv("DATABASE_URL", "")),
			Host:     getEnv("POSTGRESQL__HOST", "localhost"),
			Port:     getEnv("POSTGRESQL__PORT", "5432"),
			User:     getEnv("POSTGRESQL__USER", "postgres"),
			Name:     getEnv("POSTGRESQL__NAME", "aether_meet"),
			Password: getEnv("POSTGRESQL__PASSWORD", "postgres"),
		},
		Redis: RedisConfig{
			Enabled:        getEnvBool("REDIS_ENABLED", false),
			Required:       getEnvBool("REDIS_REQUIRED", false),
			URL:            getEnv("REDIS_URL", ""),
			Host:           getEnv("REDIS_HOST", "localhost"),
			Port:           getEnv("REDIS_PORT", "6379"),
			Password:       getEnv("REDIS_PASSWORD", ""),
			DB:             getEnvInt("REDIS_DB", 0),
			KeyPrefix:      getEnv("REDIS_KEY_PREFIX", "aether-meet:v1"),
			DefaultTTL:     getEnvDuration("REDIS_DEFAULT_TTL", 5*time.Minute),
			ConnectTimeout: getEnvDuration("REDIS_CONNECT_TIMEOUT", 5*time.Second),
			ReadTimeout:    getEnvDuration("REDIS_READ_TIMEOUT", 3*time.Second),
			WriteTimeout:   getEnvDuration("REDIS_WRITE_TIMEOUT", 3*time.Second),
			MaxRetries:     getEnvInt("REDIS_MAX_RETRIES", 3),
		},
		Auth: AuthConfig{
			Enabled:                getEnvBool("AUTH_ENABLED", true),
			LocalEnabled:           getEnvBool("AUTH_LOCAL_ENABLED", true),
			Mode:                   strings.ToLower(getEnv("AUTH_MODE", "jwt")),
			JWTSecret:              getEnv("AUTH_JWT_SECRET", getEnv("JWT_SECRET", "")),
			JWTIssuer:              getEnv("AUTH_JWT_ISSUER", getEnv("JWT_ISSUER", "aether-account")),
			JWTAccessTTL:           getEnvDuration("AUTH_ACCESS_TOKEN_TTL", getEnvDuration("JWT_ACCESS_TTL", 15*time.Minute)),
			JWTRefreshTTL:          getEnvDuration("AUTH_REFRESH_TOKEN_TTL", getEnvDuration("JWT_REFRESH_TTL", 30*24*time.Hour)),
			RefreshCookieName:      getEnv("AUTH_REFRESH_COOKIE_NAME", "aether_account_refresh"),
			CookieSecure:           getEnvBool("AUTH_COOKIE_SECURE", strings.EqualFold(getEnv("APP_ENV", "development"), "production")),
			CookieSameSite:         strings.ToLower(getEnv("AUTH_COOKIE_SAME_SITE", "lax")),
			CookieDomain:           strings.TrimSpace(getEnv("AUTH_COOKIE_DOMAIN", "")),
			PasswordMinLength:      getEnvInt("AUTH_PASSWORD_MIN_LENGTH", 12),
			Argon2Memory:           uint32(getEnvInt("AUTH_ARGON2_MEMORY", 64*1024)),
			Argon2Iterations:       uint32(getEnvInt("AUTH_ARGON2_ITERATIONS", 3)),
			Argon2Parallelism:      uint8(getEnvInt("AUTH_ARGON2_PARALLELISM", 2)),
			SessionCleanupInterval: getEnvDuration("AUTH_SESSION_CLEANUP_INTERVAL", time.Hour),
			EmailVerificationTTL:   getEnvDuration("AUTH_EMAIL_VERIFICATION_TTL", 24*time.Hour),
			PasswordResetTTL:       getEnvDuration("AUTH_PASSWORD_RESET_TTL", time.Hour),
			RateLimitEnabled:       getEnvBool("AUTH_RATE_LIMIT_ENABLED", true),
		},
		OAuth: OAuthConfig{
			Google: OAuthProviderConfig{
				ClientID:     getEnv("OAUTH_GOOGLE_CLIENT_ID", ""),
				ClientSecret: getEnv("OAUTH_GOOGLE_CLIENT_SECRET", ""),
				RedirectURL:  getEnv("OAUTH_GOOGLE_REDIRECT_URL", ""),
				Enabled:      getEnv("OAUTH_GOOGLE_CLIENT_ID", "") != "",
			},
			GitHub: OAuthProviderConfig{
				ClientID:     getEnv("OAUTH_GITHUB_CLIENT_ID", ""),
				ClientSecret: getEnv("OAUTH_GITHUB_CLIENT_SECRET", ""),
				RedirectURL:  getEnv("OAUTH_GITHUB_REDIRECT_URL", ""),
				Enabled:      getEnv("OAUTH_GITHUB_CLIENT_ID", "") != "",
			},
			StateTTL: getEnvDuration("OAUTH_STATE_TTL", 10*time.Minute),
		},
		CORS: CORSConfig{
			AllowedOrigins: getEnvSlice("CORS_ALLOWED_ORIGINS", []string{"http://localhost:3000"}),
		},
	}

	if cfg.Auth.JWTSecret == "" && cfg.App.Env != "production" {
		cfg.Auth.JWTSecret = devJWTSecret
	}

	if cfg.Database.URL == "" {
		cfg.Database.URL = fmt.Sprintf(
			"host=%s user=%s password=%s dbname=%s port=%s sslmode=disable",
			cfg.Database.Host,
			cfg.Database.User,
			cfg.Database.Password,
			cfg.Database.Name,
			cfg.Database.Port,
		)
	}

	return cfg, cfg.Validate()
}

func (c Config) Validate() error {
	if c.Server.Port == "" {
		return errors.New("API_PORT is required")
	}
	if c.App.Env == "production" {
		if c.Auth.Enabled && c.Auth.Mode == "jwt" && (c.Auth.JWTSecret == "" || c.Auth.JWTSecret == devJWTSecret || len(c.Auth.JWTSecret) < 32) {
			return errors.New("AUTH_JWT_SECRET or JWT_SECRET must be configured with a strong value for production")
		}
		if len(c.CORS.AllowedOrigins) == 0 {
			return errors.New("CORS_ALLOWED_ORIGINS must be configured for production")
		}
	}
	if c.Auth.Enabled && c.Auth.LocalEnabled {
		if c.Auth.JWTIssuer == "" {
			return errors.New("AUTH_JWT_ISSUER or JWT_ISSUER is required when local auth is enabled")
		}
		if c.Auth.JWTAccessTTL <= 0 || c.Auth.JWTRefreshTTL <= 0 || c.Auth.EmailVerificationTTL <= 0 || c.Auth.PasswordResetTTL <= 0 || c.Auth.SessionCleanupInterval <= 0 {
			return errors.New("auth durations must be greater than zero")
		}
		if c.Auth.PasswordMinLength < 8 {
			return errors.New("AUTH_PASSWORD_MIN_LENGTH must be at least 8")
		}
		if c.Auth.Argon2Memory == 0 || c.Auth.Argon2Iterations == 0 || c.Auth.Argon2Parallelism == 0 {
			return errors.New("argon2 parameters must be greater than zero")
		}
		switch c.Auth.CookieSameSite {
		case "lax", "strict", "none":
		default:
			return errors.New("AUTH_COOKIE_SAME_SITE must be one of lax, strict, none")
		}
		if c.Database.URL == "" {
			return errors.New("database must be configured when local auth is enabled")
		}
	}
	return nil
}

func getEnv(key, fallback string) string {
	if value := strings.TrimSpace(os.Getenv(key)); value != "" {
		return value
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	parsed, err := strconv.Atoi(value)
	if err != nil {
		return fallback
	}
	return parsed
}

func getEnvBool(key string, fallback bool) bool {
	value := strings.TrimSpace(strings.ToLower(os.Getenv(key)))
	if value == "" {
		return fallback
	}
	return value == "true" || value == "1" || value == "yes"
}

func getEnvDuration(key string, fallback time.Duration) time.Duration {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	if seconds, err := strconv.Atoi(value); err == nil {
		return time.Duration(seconds) * time.Second
	}
	if duration, err := time.ParseDuration(value); err == nil {
		return duration
	}
	return fallback
}

func getEnvSlice(key string, fallback []string) []string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	parts := strings.Split(value, ",")
	out := make([]string, 0, len(parts))
	for _, part := range parts {
		part = strings.TrimSpace(part)
		if part != "" {
			out = append(out, part)
		}
	}
	return out
}
