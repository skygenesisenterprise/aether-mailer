package config

import (
	"encoding/json"
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/skygenesisenterprise/aether-mailer/routers/pkg/routerpkg"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

// ConfigManager manages router configuration
type ConfigManager struct {
	configPath string
	config     *routerpkg.Config
	logger     routerpkg.Logger
}

// NewConfigManager creates a new configuration manager
func NewConfigManager() *ConfigManager {
	return &ConfigManager{}
}

// LoadConfig loads configuration from file and environment variables
func (cm *ConfigManager) LoadConfig(configPath string) (*routerpkg.Config, error) {
	// Set config path
	cm.configPath = configPath

	// Check if config file exists
	if _, err := os.Stat(configPath); os.IsNotExist(err) {
		return &routerpkg.Config{
			// Return default configuration
			Server: routerpkg.ServerConfig{
				Host:         routerpkg.DefaultHost,
				Port:         routerpkg.DefaultPort,
				ReadTimeout:  routerpkg.DefaultReadTimeout,
				WriteTimeout: routerpkg.DefaultWriteTimeout,
				IdleTimeout:  routerpkg.DefaultIdleTimeout,
			},
			Services: routerpkg.ServicesConfig{
				Discovery: routerpkg.DiscoveryConfig{
					Type:     routerpkg.DiscoveryTypeStatic,
					Interval: routerpkg.DefaultDiscoveryInterval,
					Options:  make(map[string]interface{}),
				},
				Health: routerpkg.HealthConfig{
					Enabled:  true,
					Interval: routerpkg.DefaultHealthCheckInterval,
					Timeout:  routerpkg.DefaultHealthCheckTimeout,
					Path:     routerpkg.DefaultHealthCheckPath,
				},
				Registry: routerpkg.RegistryConfig{
					Type:    routerpkg.RegistryTypeMemory,
					Options: make(map[string]interface{}),
				},
			},
			LoadBalancer: routerpkg.LoadBalancerConfig{
				Algorithm: routerpkg.AlgorithmRoundRobin,
				Sticky:    false,
				Weights:   make(map[string]int),
				Options:   make(map[string]interface{}),
			},
			Security: routerpkg.SecurityConfig{
				RateLimit: routerpkg.RateLimitConfig{
					Enabled: false,
					Rules:   []routerpkg.RateLimitRule{},
					Storage: routerpkg.StorageTypeMemory,
				},
				Firewall: routerpkg.FirewallConfig{
					Enabled: false,
					Rules:   []routerpkg.FirewallRule{},
				},
				Auth: routerpkg.AuthConfig{
					Enabled: false,
					Type:    routerpkg.AuthTypeNone,
					Options: make(map[string]interface{}),
				},
				CORS: routerpkg.CORSConfig{
					Enabled:          false,
					AllowedOrigins:   []string{"*"},
					AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
					AllowedHeaders:   []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Request-ID", "X-API-Key"},
					AllowCredentials: false,
					MaxAge:           86400,
				},
			},
			SSL: routerpkg.SSLConfig{
				Enabled:  false,
				CertFile: routerpkg.DefaultSSLCertFile,
				KeyFile:  routerpkg.DefaultSSLKeyFile,
				AutoCert: false,
				Hosts:    []string{},
			},
			Monitoring: routerpkg.MonitoringConfig{
				Enabled:  true,
				Metrics:  true,
				Tracing:  false,
				Endpoint: routerpkg.DefaultMetricsEndpoint,
			},
			Logging: routerpkg.LoggingConfig{
				Level:         routerpkg.DefaultLogLevel,
				Format:        routerpkg.DefaultLogFormat,
				Output:        "stdout",
				CorrelationID: true,
			},
			Storage: routerpkg.StorageConfig{
				Type:    routerpkg.StorageTypeMemory,
				Options: make(map[string]interface{}),
			},
		}
	}

	// Load from file if it exists
	if _, err := os.Stat(configPath); !os.IsNotExist(err) {
		if err := cm.loadFromFile(); err != nil {
			return nil, fmt.Errorf("failed to load config file: %w", err)
		}
	}

	// Override with environment variables
	cm.overrideWithEnvironment()

	cm.logger.Debug("Configuration loaded", "path", configPath)
	return cm.config, nil
}

// SaveConfig saves configuration to file
func (cm *ConfigManager) SaveConfig() error {
	if cm.configPath == "" {
		return fmt.Errorf("no config path specified")
	}

	// Create backup of existing file
	if err := cm.createBackup(); err != nil {
		cm.logger.Warn("Failed to create config backup", "error", err)
	}

	// Marshal configuration to YAML
	data, err := yaml.Marshal(cm.config)
	if err != nil {
		return fmt.Errorf("failed to marshal config: %w", err)
	}

	// Write to file
	if err := os.WriteFile(cm.configPath, data, 0644); err != nil {
		return fmt.Errorf("failed to write config file: %w", err)
	}

	cm.logger.Info("Configuration saved", "path", cm.configPath)
	return nil
}

// loadFromFile loads configuration from YAML file
func (cm *ConfigManager) loadFromFile() error {
	file, err := os.Open(cm.configPath)
	if err != nil {
		return fmt.Errorf("failed to open config file: %w", err)
	}
	defer file.Close()

	decoder := yaml.NewDecoder(file)
	if err := decoder.Decode(&cm.config); err != nil {
		return fmt.Errorf("failed to parse config file: %w", err)
	}

	cm.logger.Debug("Configuration loaded from file", "path", cm.configPath)
	return nil
}

// createBackup creates a backup of the current configuration
func (cm *ConfigManager) createBackup() error {
	if _, err := os.Stat(cm.configPath); os.IsNotExist(err) {
		return nil // No file to backup
	}

	backupPath := cm.configPath + ".backup"
	if err := os.WriteFile(backupPath, []byte{}); err != nil {
		cm.logger.Warn("Failed to create backup file", "path", backupPath, "error", err)
	}

	// Copy current file to backup
	file, err := os.Open(cm.configPath)
	if err != nil {
		return fmt.Errorf("failed to open config file for backup: %w", err)
	}
	defer file.Close()

	backup, err := os.Create(backupPath)
	if err != nil {
		return fmt.Errorf("failed to create backup file: %w", err)
	}
	defer backup.Close()

	_, err = io.Copy(backup, file)
	if err != nil {
		cm.logger.Warn("Failed to copy config to backup", "error", err)
	}

	cm.logger.Info("Configuration backup created", "path", backupPath)
	return nil
}

// overrideWithEnvironment overrides configuration with environment variables
func (cm *ConfigManager) overrideWithEnvironment() {
	// Server configuration
	if host := os.Getenv("ROUTER_HOST"); host != "" {
		cm.config.Server.Host = host
	}
	if port := os.Getenv("ROUTER_PORT"); port != "" {
		if p, err := strconv.Atoi(port); err == nil {
			cm.config.Server.Port = p
		}
	}

	// SSL configuration
	if cert := os.Getenv("ROUTER_CERT_FILE"); cert != "" {
		cm.config.SSL.CertFile = cert
	}
	if key := os.Getenv("ROUTER_KEY_FILE"); key != "" {
		cm.config.SSL.KeyFile = key
	}
	if enabled := os.Getenv("ROUTER_SSL_ENABLED"); enabled != "" {
		cm.config.SSL.Enabled = enabled == "true"
	}

	// Load balancer algorithm
	if alg := os.Getenv("ROUTER_ALGORITHM"); alg != "" {
		cm.config.LoadBalancer.Algorithm = alg
	}

	// Enable/disable features
	if rl := os.Getenv("ROUTER_RATE_LIMIT"); rl != "" {
		cm.config.Security.RateLimit.Enabled = rl == "true"
	}
	if fw := os.Getenv("ROUTER_FIREWALL"); fw != "" {
		cm.config.Security.Firewall.Enabled = fw == "true"
	}
	if cors := os.Getenv("ROUTER_CORS"); cors != "" {
		cm.config.Security.CORS.Enabled = cors == "true"
	}
	if monitoring := os.Getenv("ROUTER_MONITORING"); monitoring != "" {
		cm.config.Monitoring.Enabled = monitoring == "true"
	}

	// Logging configuration
	if level := os.Getenv("ROUTER_LOG_LEVEL"); level != "" {
		cm.config.Logging.Level = level
	}
	if format := os.Getenv("ROUTER_LOG_FORMAT"); format != "" {
		cm.config.Logging.Format = format
	}

	// Service registry type
	if registry := os.Getenv("ROUTER_REGISTRY"); registry != "" {
		cm.config.Services.Registry.Type = registry
	}

	// Storage type
	if storage := os.Getenv("ROUTER_STORAGE"); storage != "" {
		cm.config.Storage.Type = storage
	}

	// Service discovery type
	if discovery := os.Getenv("ROUTER_DISCOVERY"); discovery != "" {
		cm.config.Services.Discovery.Type = discovery
	}

	cm.logger.Debug("Configuration overridden with environment variables")
}

// ValidateConfig validates the current configuration
func (cm *ConfigManager) ValidateConfig() error {
	var errors []string

	// Validate server configuration
	if cm.config.Server.Port < 1 || cm.config.Server.Port > 65535 {
		errors = append(errors, fmt.Sprintf("invalid server port: %d", cm.config.Server.Port))
	}

	// Validate load balancer algorithm
	if !routerpkg.IsValidLoadBalancingAlgorithm(cm.config.LoadBalancer.Algorithm) {
		errors = append(errors, fmt.Sprintf("invalid load balancer algorithm: %s", cm.config.LoadBalancer.Algorithm))
	}

	// Validate storage type
	if !routerpkg.IsValidStorageType(cm.config.Storage.Type) {
		errors = append(errors, fmt.Sprintf("invalid storage type: %s", cm.config.Storage.Type))
	}

	// Validate service discovery type
	if !routerpkg.IsValidServiceDiscoveryType(cm.config.Services.Discovery.Type) {
		errors = append(errors, fmt.Sprintf("invalid service discovery type: %s", cm.config.Services.Discovery.Type))
	}

	// Validate SSL configuration if enabled
	if cm.config.SSL.Enabled {
		if cm.config.SSL.CertFile == "" || cm.config.SSL.KeyFile == "" {
			errors = append(errors, "SSL certificate and key files are required when SSL is enabled")
		}
	}

	if len(errors) > 0 {
		return fmt.Errorf("configuration validation failed: %s", strings.Join(errors, "; "))
	}

	cm.logger.Info("Configuration validation passed")
	return nil
}

// GetConfig returns the current configuration
func (cm *ConfigManager) GetConfig() *routerpkg.Config {
	return cm.config
}

// SetConfig updates the configuration
func (cm *ConfigManager) SetConfig(config *routerpkg.Config) {
	cm.config = config
}

// ReloadConfig reloads configuration from file
func (cm *ConfigManager) ReloadConfig() error {
	if err := cm.loadFromFile(); err != nil {
		return fmt.Errorf("failed to reload config: %w", err)
	}

	cm.logger.Info("Configuration reloaded")
	return nil
}

// GetConfigPath returns the current configuration path
func (cm *ConfigManager) GetConfigPath() string {
	return cm.configPath
}
