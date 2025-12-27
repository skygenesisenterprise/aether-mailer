package main

import (
	"log"
	"os"

	"github.com/skygenesisenterprise/aether-mailer/routers/cmd/router"
	"github.com/skygenesisenterprise/aether-mailer/routers/pkg/routerpkg"
)

func main() {
	// Check if running in CLI mode
	if len(os.Args) > 1 {
		// Run CLI
		if err := router.Execute(); err != nil {
			log.Fatalf("Failed to execute router CLI: %v", err)
		}
		return
	}

	// Run router directly (for backward compatibility)
	runRouter()
}

func runRouter() {
	// Create default configuration
	config := &routerpkg.Config{
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
			},
			Health: routerpkg.HealthConfig{
				Enabled:  true,
				Interval: routerpkg.DefaultHealthCheckInterval,
				Timeout:  routerpkg.DefaultHealthCheckTimeout,
				Path:     routerpkg.DefaultHealthCheckPath,
			},
			Registry: routerpkg.RegistryConfig{
				Type: routerpkg.RegistryTypeMemory,
			},
		},
		LoadBalancer: routerpkg.LoadBalancerConfig{
			Algorithm: routerpkg.AlgorithmRoundRobin,
			Sticky:    false,
			Weights:   make(map[string]int),
		},
		Security: routerpkg.SecurityConfig{
			RateLimit: routerpkg.RateLimitConfig{
				Enabled: false,
				Rules:   []routerpkg.RateLimitRule{},
			},
			Firewall: routerpkg.FirewallConfig{
				Enabled: false,
				Rules:   []routerpkg.FirewallRule{},
			},
			Auth: routerpkg.AuthConfig{
				Enabled: false,
				Type:    routerpkg.AuthTypeNone,
			},
			CORS: routerpkg.CORSConfig{
				Enabled:          false,
				AllowedOrigins:   []string{"*"},
				AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
				AllowedHeaders:   []string{"Origin", "Content-Type", "Accept", "Authorization"},
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

	// Create router
	router, err := routerpkg.NewRouter(config)
	if err != nil {
		log.Fatalf("Failed to create router: %v", err)
	}

	// Start router
	if err := router.Start(); err != nil {
		log.Fatalf("Failed to start router: %v", err)
	}

	log.Println("Aether Mailer Router started successfully")
	log.Printf("Server listening on %s:%d", config.Server.Host, config.Server.Port)
	log.Printf("Health check available at http://%s:%d/health", config.Server.Host, config.Server.Port)
	log.Printf("API available at http://%s:%d/api/v1", config.Server.Host, config.Server.Port)

	// Wait for interrupt signal
	// In a real implementation, handle graceful shutdown here
	select {}
}
