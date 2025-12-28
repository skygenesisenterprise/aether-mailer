package config

import (
	"fmt"
	"time"
)

// Config represents the complete SDK configuration
type Config struct {
	Database   DatabaseConfig   `json:"database"`
	Redis      RedisConfig      `json:"redis"`
	SMTP       SMTPConfig       `json:"smtp"`
	IMAP       IMAPConfig       `json:"imap"`
	Security   SecurityConfig   `json:"security"`
	Routing    RoutingConfig    `json:"routing"`
	Monitoring MonitoringConfig `json:"monitoring"`
	Quotas     QuotaConfig      `json:"quotas"`
	Policies   PolicyConfig     `json:"policies"`
}

// DatabaseConfig defines database connection settings
type DatabaseConfig struct {
	Driver         string        `json:"driver"`
	Host           string        `json:"host"`
	Port           int           `json:"port"`
	Database       string        `json:"database"`
	Username       string        `json:"username"`
	Password       string        `json:"password"`
	SSLMode        string        `json:"ssl_mode"`
	MaxConnections int           `json:"max_connections"`
	MaxIdleTime    time.Duration `json:"max_idle_time"`
	MaxLifetime    time.Duration `json:"max_lifetime"`
	MigrationPath  string        `json:"migration_path"`
}

// RedisConfig defines Redis connection settings
type RedisConfig struct {
	Host         string        `json:"host"`
	Port         int           `json:"port"`
	Password     string        `json:"password"`
	Database     int           `json:"database"`
	PoolSize     int           `json:"pool_size"`
	MinIdleConns int           `json:"min_idle_conns"`
	MaxRetries   int           `json:"max_retries"`
	DialTimeout  time.Duration `json:"dial_timeout"`
	ReadTimeout  time.Duration `json:"read_timeout"`
	WriteTimeout time.Duration `json:"write_timeout"`
}

// SMTPConfig defines SMTP server settings
type SMTPConfig struct {
	Host        string        `json:"host"`
	Port        int           `json:"port"`
	Username    string        `json:"username"`
	Password    string        `json:"password"`
	UseTLS      bool          `json:"use_tls"`
	UseStartTLS bool          `json:"use_starttls"`
	Timeout     time.Duration `json:"timeout"`
	MaxSize     int64         `json:"max_size"`
}

// IMAPConfig defines IMAP server settings
type IMAPConfig struct {
	Host        string        `json:"host"`
	Port        int           `json:"port"`
	Username    string        `json:"username"`
	Password    string        `json:"password"`
	UseTLS      bool          `json:"use_tls"`
	Timeout     time.Duration `json:"timeout"`
	IdleTimeout time.Duration `json:"idle_timeout"`
}

// SecurityConfig defines security settings
type SecurityConfig struct {
	JWTSecret         string        `json:"jwt_secret"`
	JWTExpiration     time.Duration `json:"jwt_expiration"`
	PasswordMinLength int           `json:"password_min_length"`
	Require2FA        bool          `json:"require_2fa"`
	MaxLoginAttempts  int           `json:"max_login_attempts"`
	LockoutDuration   time.Duration `json:"lockout_duration"`
	EncryptionKey     string        `json:"encryption_key"`
}

// RoutingConfig defines routing and delivery settings
type RoutingConfig struct {
	MaxHops         int           `json:"max_hops"`
	MaxMessageSize  int64         `json:"max_message_size"`
	DeliveryTimeout time.Duration `json:"delivery_timeout"`
	RetryAttempts   int           `json:"retry_attempts"`
	RetryDelay      time.Duration `json:"retry_delay"`
	EnableSPF       bool          `json:"enable_spf"`
	EnableDKIM      bool          `json:"enable_dkim"`
	EnableDMARC     bool          `json:"enable_dmarc"`
}

// MonitoringConfig defines monitoring settings
type MonitoringConfig struct {
	EnableMetrics       bool          `json:"enable_metrics"`
	EnableTracing       bool          `json:"enable_tracing"`
	MetricsPort         int           `json:"metrics_port"`
	TracingEndpoint     string        `json:"tracing_endpoint"`
	LogLevel            string        `json:"log_level"`
	HealthCheckInterval time.Duration `json:"health_check_interval"`
}

// QuotaConfig defines quota settings
type QuotaConfig struct {
	DefaultMaxStorageMB    int           `json:"default_max_storage_mb"`
	DefaultMaxEmailsPerDay int           `json:"default_max_emails_per_day"`
	DefaultDomainMaxUsers  int           `json:"default_domain_max_users"`
	EnableQuotaEnforcement bool          `json:"enable_quota_enforcement"`
	QuotaCheckInterval     time.Duration `json:"quota_check_interval"`
}

// PolicyConfig defines policy settings
type PolicyConfig struct {
	EnableSpamFilter    bool     `json:"enable_spam_filter"`
	EnableVirusScan     bool     `json:"enable_virus_scan"`
	SpamThreshold       float64  `json:"spam_threshold"`
	AllowedFileTypes    []string `json:"allowed_file_types"`
	MaxAttachmentSize   int64    `json:"max_attachment_size"`
	EnableContentFilter bool     `json:"enable_content_filter"`
}

// DefaultConfig returns a default configuration
func DefaultConfig() *Config {
	return &Config{
		Database: DatabaseConfig{
			Driver:         "postgres",
			Host:           "localhost",
			Port:           5432,
			Database:       "aether_mailer",
			SSLMode:        "disable",
			MaxConnections: 20,
			MaxIdleTime:    30 * time.Minute,
			MaxLifetime:    1 * time.Hour,
		},
		Redis: RedisConfig{
			Host:         "localhost",
			Port:         6379,
			Database:     0,
			PoolSize:     10,
			MinIdleConns: 5,
			MaxRetries:   3,
			DialTimeout:  5 * time.Second,
			ReadTimeout:  3 * time.Second,
			WriteTimeout: 3 * time.Second,
		},
		SMTP: SMTPConfig{
			Host:        "localhost",
			Port:        587,
			UseTLS:      false,
			UseStartTLS: true,
			Timeout:     30 * time.Second,
			MaxSize:     25 * 1024 * 1024, // 25MB
		},
		IMAP: IMAPConfig{
			Host:        "localhost",
			Port:        993,
			UseTLS:      true,
			Timeout:     30 * time.Second,
			IdleTimeout: 10 * time.Minute,
		},
		Security: SecurityConfig{
			JWTExpiration:     24 * time.Hour,
			PasswordMinLength: 8,
			Require2FA:        false,
			MaxLoginAttempts:  5,
			LockoutDuration:   15 * time.Minute,
		},
		Routing: RoutingConfig{
			MaxHops:         30,
			MaxMessageSize:  50 * 1024 * 1024, // 50MB
			DeliveryTimeout: 5 * time.Minute,
			RetryAttempts:   3,
			RetryDelay:      5 * time.Minute,
			EnableSPF:       true,
			EnableDKIM:      true,
			EnableDMARC:     true,
		},
		Monitoring: MonitoringConfig{
			EnableMetrics:       true,
			EnableTracing:       false,
			MetricsPort:         9090,
			LogLevel:            "info",
			HealthCheckInterval: 30 * time.Second,
		},
		Quotas: QuotaConfig{
			DefaultMaxStorageMB:    1024, // 1GB
			DefaultMaxEmailsPerDay: 100,
			DefaultDomainMaxUsers:  50,
			EnableQuotaEnforcement: true,
			QuotaCheckInterval:     1 * time.Hour,
		},
		Policies: PolicyConfig{
			EnableSpamFilter:    true,
			EnableVirusScan:     true,
			SpamThreshold:       0.7,
			AllowedFileTypes:    []string{".pdf", ".doc", ".docx", ".txt", ".jpg", ".png"},
			MaxAttachmentSize:   10 * 1024 * 1024, // 10MB
			EnableContentFilter: true,
		},
	}
}

// Validate validates the configuration
func (c *Config) Validate() error {
	if c.Database.Host == "" {
		return fmt.Errorf("database host is required")
	}
	if c.Database.Port <= 0 {
		return fmt.Errorf("database port must be positive")
	}
	if c.Database.Database == "" {
		return fmt.Errorf("database name is required")
	}
	if c.Redis.Host == "" {
		return fmt.Errorf("redis host is required")
	}
	if c.Redis.Port <= 0 {
		return fmt.Errorf("redis port must be positive")
	}
	if c.SMTP.Host == "" {
		return fmt.Errorf("smtp host is required")
	}
	if c.SMTP.Port <= 0 {
		return fmt.Errorf("smtp port must be positive")
	}
	if c.IMAP.Host == "" {
		return fmt.Errorf("imap host is required")
	}
	if c.IMAP.Port <= 0 {
		return fmt.Errorf("imap port must be positive")
	}
	if c.Security.JWTSecret == "" {
		return fmt.Errorf("jwt secret is required")
	}
	if c.Security.PasswordMinLength < 6 {
		return fmt.Errorf("password minimum length must be at least 6")
	}
	return nil
}

// GetDSN returns the database connection string
func (c *DatabaseConfig) GetDSN() string {
	switch c.Driver {
	case "postgres":
		return fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
			c.Host, c.Port, c.Username, c.Password, c.Database, c.SSLMode)
	case "mysql":
		return fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?parseTime=true",
			c.Username, c.Password, c.Host, c.Port, c.Database)
	default:
		return ""
	}
}

// GetRedisAddr returns the Redis connection address
func (c *RedisConfig) GetRedisAddr() string {
	return fmt.Sprintf("%s:%d", c.Host, c.Port)
}
