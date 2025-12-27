package router

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/skygenesisenterprise/aether-mailer/routers/pkg/routerpkg"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

// startCmd represents the start command
var startCmd = &cobra.Command{
	Use:   "start",
	Short: "Start the Aether Mailer router",
	Long: `Start the Aether Mailer router with the specified configuration.
The router will handle HTTP requests, load balancing, service discovery,
and health checking according to the configuration.`,
	Run: func(cmd *cobra.Command, args []string) {
		// Load configuration
		config, err := loadConfig()
		if err != nil {
			fmt.Fprintf(os.Stderr, "Error loading configuration: %v\n", err)
			os.Exit(1)
		}

		if verbose {
			fmt.Println("Starting Aether Mailer Router...")
			fmt.Printf("Host: %s\n", config.Server.Host)
			fmt.Printf("Port: %d\n", config.Server.Port)
			fmt.Printf("Load Balancer Algorithm: %s\n", config.LoadBalancer.Algorithm)
		}

		// Create router
		router, err := routerpkg.NewRouter(config)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Error creating router: %v\n", err)
			os.Exit(1)
		}

		// Setup signal handling for graceful shutdown
		sigChan := make(chan os.Signal, 1)
		signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

		// Start router in goroutine
		errChan := make(chan error, 1)
		go func() {
			if err := router.Start(); err != nil {
				errChan <- err
			}
		}()

		// Wait for signals or errors
		select {
		case sig := <-sigChan:
			if verbose {
				fmt.Printf("\nReceived signal %v, shutting down gracefully...\n", sig)
			}

			// Create shutdown context with timeout
			ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
			defer cancel()

			// Shutdown router
			if err := router.Stop(ctx); err != nil {
				fmt.Fprintf(os.Stderr, "Error during shutdown: %v\n", err)
				os.Exit(1)
			}

			if verbose {
				fmt.Println("Router stopped successfully")
			}

		case err := <-errChan:
			fmt.Fprintf(os.Stderr, "Router failed to start: %v\n", err)
			os.Exit(1)
		}
	},
}

func init() {
	startCmd.Flags().StringVar(&cfgFile, "config", "", "config file (default is $HOME/.router.yaml)")
	startCmd.Flags().StringVar(&host, "host", "0.0.0.0", "host to bind to")
	startCmd.Flags().IntVar(&port, "port", 80, "port to bind to")
	startCmd.Flags().BoolVarP(&verbose, "verbose", "v", false, "verbose output")

	// Add algorithm flag
	startCmd.Flags().String("algorithm", "round_robin", "load balancing algorithm (round_robin, weighted_round_robin, least_connections, ip_hash, random)")
	viper.BindPFlag("load_balancer.algorithm", startCmd.Flags().Lookup("algorithm"))

	// Add SSL flags
	startCmd.Flags().Bool("ssl", false, "enable SSL/TLS")
	startCmd.Flags().String("ssl-cert", "", "SSL certificate file")
	startCmd.Flags().String("ssl-key", "", "SSL private key file")
	viper.BindPFlag("ssl.enabled", startCmd.Flags().Lookup("ssl"))
	viper.BindPFlag("ssl.cert_file", startCmd.Flags().Lookup("ssl-cert"))
	viper.BindPFlag("ssl.key_file", startCmd.Flags().Lookup("ssl-key"))

	// Add rate limiting flags
	startCmd.Flags().Bool("rate-limit", false, "enable rate limiting")
	viper.BindPFlag("security.rate_limit.enabled", startCmd.Flags().Lookup("rate-limit"))

	// Add CORS flags
	startCmd.Flags().Bool("cors", false, "enable CORS")
	viper.BindPFlag("security.cors.enabled", startCmd.Flags().Lookup("cors"))

	// Add monitoring flags
	startCmd.Flags().Bool("metrics", true, "enable metrics collection")
	startCmd.Flags().Bool("tracing", false, "enable distributed tracing")
	viper.BindPFlag("monitoring.metrics", startCmd.Flags().Lookup("metrics"))
	viper.BindPFlag("monitoring.tracing", startCmd.Flags().Lookup("tracing"))
}

// loadConfig loads and validates the router configuration
func loadConfig() (*routerpkg.Config, error) {
	config := &routerpkg.Config{}

	// Server configuration
	config.Server = routerpkg.ServerConfig{
		Host:         viper.GetString("host"),
		Port:         viper.GetInt("port"),
		ReadTimeout:  viper.GetDuration("server.read_timeout"),
		WriteTimeout: viper.GetDuration("server.write_timeout"),
		IdleTimeout:  viper.GetDuration("server.idle_timeout"),
	}

	// Set defaults for server config
	if config.Server.ReadTimeout == 0 {
		config.Server.ReadTimeout = routerpkg.DefaultReadTimeout
	}
	if config.Server.WriteTimeout == 0 {
		config.Server.WriteTimeout = routerpkg.DefaultWriteTimeout
	}
	if config.Server.IdleTimeout == 0 {
		config.Server.IdleTimeout = routerpkg.DefaultIdleTimeout
	}

	// Services configuration
	config.Services = routerpkg.ServicesConfig{
		Discovery: routerpkg.DiscoveryConfig{
			Type:     viper.GetString("services.discovery.type"),
			Interval: viper.GetDuration("services.discovery.interval"),
		},
		Health: routerpkg.HealthConfig{
			Enabled:  viper.GetBool("services.health.enabled"),
			Interval: viper.GetDuration("services.health.interval"),
			Timeout:  viper.GetDuration("services.health.timeout"),
			Path:     viper.GetString("services.health.path"),
		},
		Registry: routerpkg.RegistryConfig{
			Type: viper.GetString("services.registry.type"),
		},
	}

	// Set defaults for services config
	if config.Services.Discovery.Type == "" {
		config.Services.Discovery.Type = routerpkg.DiscoveryTypeStatic
	}
	if config.Services.Discovery.Interval == 0 {
		config.Services.Discovery.Interval = routerpkg.DefaultDiscoveryInterval
	}
	if config.Services.Health.Interval == 0 {
		config.Services.Health.Interval = routerpkg.DefaultHealthCheckInterval
	}
	if config.Services.Health.Timeout == 0 {
		config.Services.Health.Timeout = routerpkg.DefaultHealthCheckTimeout
	}
	if config.Services.Health.Path == "" {
		config.Services.Health.Path = routerpkg.DefaultHealthCheckPath
	}
	if config.Services.Registry.Type == "" {
		config.Services.Registry.Type = routerpkg.RegistryTypeMemory
	}

	// Load balancer configuration
	config.LoadBalancer = routerpkg.LoadBalancerConfig{
		Algorithm: viper.GetString("load_balancer.algorithm"),
		Sticky:    viper.GetBool("load_balancer.sticky"),
		Weights:   viper.GetStringMapInt("load_balancer.weights"),
		Options:   viper.GetStringMap("load_balancer.options"),
	}

	// Set defaults for load balancer config
	if config.LoadBalancer.Algorithm == "" {
		config.LoadBalancer.Algorithm = routerpkg.AlgorithmRoundRobin
	}
	if config.LoadBalancer.Weights == nil {
		config.LoadBalancer.Weights = make(map[string]int)
	}
	if config.LoadBalancer.Options == nil {
		config.LoadBalancer.Options = make(map[string]interface{})
	}

	// Security configuration
	config.Security = routerpkg.SecurityConfig{
		RateLimit: routerpkg.RateLimitConfig{
			Enabled: viper.GetBool("security.rate_limit.enabled"),
			Rules:   getRateLimitRules(),
			Storage: viper.GetString("security.rate_limit.storage"),
		},
		Firewall: routerpkg.FirewallConfig{
			Enabled: viper.GetBool("security.firewall.enabled"),
			Rules:   getFirewallRules(),
		},
		Auth: routerpkg.AuthConfig{
			Enabled: viper.GetBool("security.auth.enabled"),
			Type:    viper.GetString("security.auth.type"),
			Options: viper.GetStringMap("security.auth.options"),
		},
		CORS: routerpkg.CORSConfig{
			Enabled:          viper.GetBool("security.cors.enabled"),
			AllowedOrigins:   viper.GetStringSlice("security.cors.allowed_origins"),
			AllowedMethods:   viper.GetStringSlice("security.cors.allowed_methods"),
			AllowedHeaders:   viper.GetStringSlice("security.cors.allowed_headers"),
			ExposedHeaders:   viper.GetStringSlice("security.cors.exposed_headers"),
			AllowCredentials: viper.GetBool("security.cors.allow_credentials"),
			MaxAge:           viper.GetInt("security.cors.max_age"),
		},
	}

	// Set defaults for security config
	if config.Security.RateLimit.Storage == "" {
		config.Security.RateLimit.Storage = routerpkg.StorageTypeMemory
	}
	if config.Security.Auth.Type == "" {
		config.Security.Auth.Type = routerpkg.AuthTypeNone
	}
	if config.Security.Auth.Options == nil {
		config.Security.Auth.Options = make(map[string]interface{})
	}
	if len(config.Security.CORS.AllowedOrigins) == 0 {
		config.Security.CORS.AllowedOrigins = []string{"*"}
	}
	if len(config.Security.CORS.AllowedMethods) == 0 {
		config.Security.CORS.AllowedMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	}
	if len(config.Security.CORS.AllowedHeaders) == 0 {
		config.Security.CORS.AllowedHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization"}
	}

	// SSL configuration
	config.SSL = routerpkg.SSLConfig{
		Enabled:  viper.GetBool("ssl.enabled"),
		CertFile: viper.GetString("ssl.cert_file"),
		KeyFile:  viper.GetString("ssl.key_file"),
		AutoCert: viper.GetBool("ssl.auto_cert"),
		Hosts:    viper.GetStringSlice("ssl.hosts"),
	}

	// Set defaults for SSL config
	if config.SSL.CertFile == "" {
		config.SSL.CertFile = routerpkg.DefaultSSLCertFile
	}
	if config.SSL.KeyFile == "" {
		config.SSL.KeyFile = routerpkg.DefaultSSLKeyFile
	}

	// Monitoring configuration
	config.Monitoring = routerpkg.MonitoringConfig{
		Enabled:  viper.GetBool("monitoring.enabled"),
		Metrics:  viper.GetBool("monitoring.metrics"),
		Tracing:  viper.GetBool("monitoring.tracing"),
		Endpoint: viper.GetString("monitoring.endpoint"),
	}

	// Set defaults for monitoring config
	if config.Monitoring.Endpoint == "" {
		config.Monitoring.Endpoint = routerpkg.DefaultMetricsEndpoint
	}

	// Logging configuration
	config.Logging = routerpkg.LoggingConfig{
		Level:         viper.GetString("logging.level"),
		Format:        viper.GetString("logging.format"),
		Output:        viper.GetString("logging.output"),
		CorrelationID: viper.GetBool("logging.correlation_id"),
	}

	// Set defaults for logging config
	if config.Logging.Level == "" {
		config.Logging.Level = routerpkg.DefaultLogLevel
	}
	if config.Logging.Format == "" {
		config.Logging.Format = routerpkg.DefaultLogFormat
	}
	if config.Logging.Output == "" {
		config.Logging.Output = "stdout"
	}

	// Storage configuration
	config.Storage = routerpkg.StorageConfig{
		Type:    viper.GetString("storage.type"),
		Options: viper.GetStringMap("storage.options"),
	}

	// Set defaults for storage config
	if config.Storage.Type == "" {
		config.Storage.Type = routerpkg.StorageTypeMemory
	}
	if config.Storage.Options == nil {
		config.Storage.Options = make(map[string]interface{})
	}

	// Validate configuration
	if err := validateConfig(config); err != nil {
		return nil, fmt.Errorf("invalid configuration: %w", err)
	}

	return config, nil
}

// getRateLimitRules loads rate limit rules from configuration
func getRateLimitRules() []routerpkg.RateLimitRule {
	var rules []routerpkg.RateLimitRule

	// This is a placeholder - in real implementation, load from config
	// For now, return empty slice

	return rules
}

// getFirewallRules loads firewall rules from configuration
func getFirewallRules() []routerpkg.FirewallRule {
	var rules []routerpkg.FirewallRule

	// This is a placeholder - in real implementation, load from config
	// For now, return empty slice

	return rules
}

// validateConfig validates the loaded configuration
func validateConfig(config *routerpkg.Config) error {
	// Validate server configuration
	if config.Server.Port < 1 || config.Server.Port > 65535 {
		return fmt.Errorf("invalid server port: %d", config.Server.Port)
	}

	// Validate load balancer algorithm
	if !routerpkg.IsValidLoadBalancingAlgorithm(config.LoadBalancer.Algorithm) {
		return fmt.Errorf("invalid load balancing algorithm: %s", config.LoadBalancer.Algorithm)
	}

	// Validate storage type
	if !routerpkg.IsValidStorageType(config.Storage.Type) {
		return fmt.Errorf("invalid storage type: %s", config.Storage.Type)
	}

	// Validate service discovery type
	if !routerpkg.IsValidServiceDiscoveryType(config.Services.Discovery.Type) {
		return fmt.Errorf("invalid service discovery type: %s", config.Services.Discovery.Type)
	}

	// Validate registry type
	if !routerpkg.IsValidStorageType(config.Services.Registry.Type) {
		return fmt.Errorf("invalid registry type: %s", config.Services.Registry.Type)
	}

	// Validate SSL configuration if enabled
	if config.SSL.Enabled {
		if config.SSL.CertFile == "" {
			return fmt.Errorf("SSL certificate file is required when SSL is enabled")
		}
		if config.SSL.KeyFile == "" {
			return fmt.Errorf("SSL private key file is required when SSL is enabled")
		}
	}

	return nil
}
