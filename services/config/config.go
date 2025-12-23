package config

import (
	"os"
	"strconv"
	"time"
)

// ServiceConfig holds all configuration for the mail services
type ServiceConfig struct {
	SMTP       SMTPConfig       `json:"smtp"`
	IMAP       IMAPConfig       `json:"imap"`
	POP3       POP3Config       `json:"pop3"`
	JMAP       JMAPConfig       `json:"jmap"`
	Database   DatabaseConfig   `json:"database"`
	Redis      RedisConfig      `json:"redis"`
	Security   SecurityConfig   `json:"security"`
	Queue      QueueConfig      `json:"queue"`
	Logging    LoggingConfig    `json:"logging"`
	Monitoring MonitoringConfig `json:"monitoring"`
}

// SMTPConfig holds SMTP server configuration
type SMTPConfig struct {
	Port            int           `json:"port"`
	Host            string        `json:"host"`
	TLS             bool          `json:"tls"`
	MaxConnections  int           `json:"maxConnections"`
	Timeout         time.Duration `json:"timeout"`
	EnableStartTLS  bool          `json:"enableStartTls"`
	CertificatePath string        `json:"certificatePath,omitempty"`
	KeyPath         string        `json:"keyPath,omitempty"`
}

// IMAPConfig holds IMAP server configuration
type IMAPConfig struct {
	Port            int           `json:"port"`
	Host            string        `json:"host"`
	TLS             bool          `json:"tls"`
	MaxConnections  int           `json:"maxConnections"`
	Timeout         time.Duration `json:"timeout"`
	EnableStartTLS  bool          `json:"enableStartTls"`
	CertificatePath string        `json:"certificatePath,omitempty"`
	KeyPath         string        `json:"keyPath,omitempty"`
}

// POP3Config holds POP3 server configuration
type POP3Config struct {
	Port           int           `json:"port"`
	Host           string        `json:"host"`
	TLS            bool          `json:"tls"`
	MaxConnections int           `json:"maxConnections"`
	Timeout        time.Duration `json:"timeout"`
	EnableStartTLS bool          `json:"enableStartTls"`
}

// JMAPConfig holds JMAP server configuration
type JMAPConfig struct {
	Port            int           `json:"port"`
	Host            string        `json:"host"`
	TLS             bool          `json:"tls"`
	MaxConnections  int           `json:"maxConnections"`
	Timeout         time.Duration `json:"timeout"`
	EnableWebSocket bool          `json:"enableWebSocket"`
}

// DatabaseConfig holds database configuration
type DatabaseConfig struct {
	URL               string        `json:"url"`
	PoolSize          int           `json:"poolSize"`
	ConnectionTimeout time.Duration `json:"connectionTimeout"`
	SSL               bool          `json:"ssl"`
}

// RedisConfig holds Redis configuration
type RedisConfig struct {
	URL        string        `json:"url"`
	MaxRetries int           `json:"maxRetries"`
	RetryDelay time.Duration `json:"retryDelay"`
}

// SecurityConfig holds security configuration
type SecurityConfig struct {
	SpamFilter     bool  `json:"spamFilter"`
	VirusScan      bool  `json:"virusScan"`
	DKIMSigning    bool  `json:"dkimSigning"`
	SPFValidation  bool  `json:"spfValidation"`
	DMARCAnalysis  bool  `json:"dmarcAnalysis"`
	MaxMessageSize int64 `json:"maxMessageSize"`
	MaxRecipients  int   `json:"maxRecipients"`
}

// QueueConfig holds queue configuration
type QueueConfig struct {
	MaxRetries          int           `json:"maxRetries"`
	RetryDelay          time.Duration `json:"retryDelay"`
	DeadLetterRetention time.Duration `json:"deadLetterRetention"`
	PriorityLevels      int           `json:"priorityLevels"`
}

// LoggingConfig holds logging configuration
type LoggingConfig struct {
	Level               string `json:"level"`
	Format              string `json:"format"`
	EnableCorrelationID bool   `json:"enableCorrelationId"`
}

// MonitoringConfig holds monitoring configuration
type MonitoringConfig struct {
	EnableMetrics       bool          `json:"enableMetrics"`
	EnableHealthChecks  bool          `json:"enableHealthChecks"`
	HealthCheckInterval time.Duration `json:"healthCheckInterval"`
}

// ConfigManager manages service configuration
type ConfigManager struct {
	config *ServiceConfig
}

// NewConfigManager creates a new ConfigManager instance
func NewConfigManager() *ConfigManager {
	return &ConfigManager{
		config: loadConfig(),
	}
}

// GetConfig returns the complete service configuration
func (cm *ConfigManager) GetConfig() *ServiceConfig {
	return cm.config
}

// GetSMTPConfig returns SMTP configuration
func (cm *ConfigManager) GetSMTPConfig() *SMTPConfig {
	return &cm.config.SMTP
}

// GetIMAPConfig returns IMAP configuration
func (cm *ConfigManager) GetIMAPConfig() *IMAPConfig {
	return &cm.config.IMAP
}

// GetPOP3Config returns POP3 configuration
func (cm *ConfigManager) GetPOP3Config() *POP3Config {
	return &cm.config.POP3
}

// GetJMAPConfig returns JMAP configuration
func (cm *ConfigManager) GetJMAPConfig() *JMAPConfig {
	return &cm.config.JMAP
}

// GetDatabaseConfig returns database configuration
func (cm *ConfigManager) GetDatabaseConfig() *DatabaseConfig {
	return &cm.config.Database
}

// GetRedisConfig returns Redis configuration
func (cm *ConfigManager) GetRedisConfig() *RedisConfig {
	return &cm.config.Redis
}

// GetSecurityConfig returns security configuration
func (cm *ConfigManager) GetSecurityConfig() *SecurityConfig {
	return &cm.config.Security
}

// GetQueueConfig returns queue configuration
func (cm *ConfigManager) GetQueueConfig() *QueueConfig {
	return &cm.config.Queue
}

// GetLoggingConfig returns logging configuration
func (cm *ConfigManager) GetLoggingConfig() *LoggingConfig {
	return &cm.config.Logging
}

// GetMonitoringConfig returns monitoring configuration
func (cm *ConfigManager) GetMonitoringConfig() *MonitoringConfig {
	return &cm.config.Monitoring
}

// ReloadConfig reloads configuration from environment variables
func (cm *ConfigManager) ReloadConfig() {
	cm.config = loadConfig()
}

// ValidateConfig validates the current configuration
func (cm *ConfigManager) ValidateConfig() (bool, []string) {
	var errors []string

	if cm.config.Database.URL == "" {
		errors = append(errors, "DATABASE_URL is required")
	}

	if cm.config.Redis.URL == "" {
		errors = append(errors, "REDIS_URL is required")
	}

	if cm.config.SMTP.Port < 1 || cm.config.SMTP.Port > 65535 {
		errors = append(errors, "SMTP_PORT must be between 1 and 65535")
	}

	if cm.config.IMAP.Port < 1 || cm.config.IMAP.Port > 65535 {
		errors = append(errors, "IMAP_PORT must be between 1 and 65535")
	}

	if cm.config.POP3.Port < 1 || cm.config.POP3.Port > 65535 {
		errors = append(errors, "POP3_PORT must be between 1 and 65535")
	}

	if cm.config.JMAP.Port < 1 || cm.config.JMAP.Port > 65535 {
		errors = append(errors, "JMAP_PORT must be between 1 and 65535")
	}

	return len(errors) == 0, errors
}

// loadConfig loads configuration from environment variables
func loadConfig() *ServiceConfig {
	return &ServiceConfig{
		SMTP: SMTPConfig{
			Port:            getInt("SMTP_PORT", 25),
			Host:            getString("SMTP_HOST", "0.0.0.0"),
			TLS:             getBool("SMTP_TLS", false),
			MaxConnections:  getInt("SMTP_MAX_CONNECTIONS", 100),
			Timeout:         time.Duration(getInt("SMTP_TIMEOUT", 30000)) * time.Millisecond,
			EnableStartTLS:  getBool("SMTP_STARTTLS", true),
			CertificatePath: getString("SMTP_CERT_PATH", ""),
			KeyPath:         getString("SMTP_KEY_PATH", ""),
		},
		IMAP: IMAPConfig{
			Port:            getInt("IMAP_PORT", 143),
			Host:            getString("IMAP_HOST", "0.0.0.0"),
			TLS:             getBool("IMAP_TLS", false),
			MaxConnections:  getInt("IMAP_MAX_CONNECTIONS", 100),
			Timeout:         time.Duration(getInt("IMAP_TIMEOUT", 30000)) * time.Millisecond,
			EnableStartTLS:  getBool("IMAP_STARTTLS", true),
			CertificatePath: getString("IMAP_CERT_PATH", ""),
			KeyPath:         getString("IMAP_KEY_PATH", ""),
		},
		POP3: POP3Config{
			Port:           getInt("POP3_PORT", 110),
			Host:           getString("POP3_HOST", "0.0.0.0"),
			TLS:            getBool("POP3_TLS", false),
			MaxConnections: getInt("POP3_MAX_CONNECTIONS", 50),
			Timeout:        time.Duration(getInt("POP3_TIMEOUT", 30000)) * time.Millisecond,
			EnableStartTLS: getBool("POP3_STARTTLS", true),
		},
		JMAP: JMAPConfig{
			Port:            getInt("JMAP_PORT", 80),
			Host:            getString("JMAP_HOST", "0.0.0.0"),
			TLS:             getBool("JMAP_TLS", false),
			MaxConnections:  getInt("JMAP_MAX_CONNECTIONS", 100),
			Timeout:         time.Duration(getInt("JMAP_TIMEOUT", 30000)) * time.Millisecond,
			EnableWebSocket: getBool("JMAP_WEBSOCKET", true),
		},
		Database: DatabaseConfig{
			URL:               getString("DATABASE_URL", "postgresql://localhost:5432/aether_mailer"),
			PoolSize:          getInt("DB_POOL_SIZE", 20),
			ConnectionTimeout: time.Duration(getInt("DB_CONNECTION_TIMEOUT", 10000)) * time.Millisecond,
			SSL:               getBool("DB_SSL", false),
		},
		Redis: RedisConfig{
			URL:        getString("REDIS_URL", "redis://localhost:6379"),
			MaxRetries: getInt("REDIS_MAX_RETRIES", 3),
			RetryDelay: time.Duration(getInt("REDIS_RETRY_DELAY", 1000)) * time.Millisecond,
		},
		Security: SecurityConfig{
			SpamFilter:     getBool("SECURITY_SPAM_FILTER", true),
			VirusScan:      getBool("SECURITY_VIRUS_SCAN", true),
			DKIMSigning:    getBool("SECURITY_DKIM_SIGNING", true),
			SPFValidation:  getBool("SECURITY_SPF_VALIDATION", true),
			DMARCAnalysis:  getBool("SECURITY_DMARC_ANALYSIS", true),
			MaxMessageSize: int64(getInt("SECURITY_MAX_MESSAGE_SIZE", 50*1024*1024)), // 50MB
			MaxRecipients:  getInt("SECURITY_MAX_RECIPIENTS", 100),
		},
		Queue: QueueConfig{
			MaxRetries:          getInt("QUEUE_MAX_RETRIES", 3),
			RetryDelay:          time.Duration(getInt("QUEUE_RETRY_DELAY", 5000)) * time.Millisecond,
			DeadLetterRetention: time.Duration(getInt("QUEUE_DEAD_LETTER_RETENTION", 7*24*60*60*1000)) * time.Millisecond, // 7 days
			PriorityLevels:      getInt("QUEUE_PRIORITY_LEVELS", 3),
		},
		Logging: LoggingConfig{
			Level:               getString("LOG_LEVEL", "info"),
			Format:              getString("LOG_FORMAT", "json"),
			EnableCorrelationID: getBool("LOG_CORRELATION_ID", true),
		},
		Monitoring: MonitoringConfig{
			EnableMetrics:       getBool("MONITORING_METRICS", true),
			EnableHealthChecks:  getBool("MONITORING_HEALTH_CHECKS", true),
			HealthCheckInterval: time.Duration(getInt("MONITORING_HEALTH_CHECK_INTERVAL", 30000)) * time.Millisecond,
		},
	}
}

// Helper functions for environment variable parsing
func getString(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}

func getBool(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		return value == "true"
	}
	return defaultValue
}
