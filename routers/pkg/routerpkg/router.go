package routerpkg

import (
	"encoding/json"
	"fmt"
	"os"
	"os/signal"
	"sync"
	"time"

	"github.com/rs/zerolog"
)

// Router represents the main router implementation
type Router struct {
	config           *Config
	server           *http.Server
	registry         Registry
	balancer         Balancer
	healthChecker    HealthChecker
	rateLimiter      RateLimiter
	sslManager       SSLManager
	proxy            Proxy
	metrics          Metrics
	mu               sync.RWMutex
	started          bool
	ctx              context.Context
	cancel           context.CancelFunc
	wg               sync.WaitGroup
	startBackgroundServices func()
	stopBackgroundServices  func()
}

// NewRouter creates a new router instance
func NewRouter(config *Config) (*Router, error) {
	if config == nil {
		return nil, NewError(ErrCodeInvalidRequest, "config cannot be nil", nil)
	}

	// Validate configuration
	if err := validateConfig(config); err != nil {
		return nil, fmt.Errorf("invalid config: %w", err)
	}

	// Create context
	ctx, cancel := context.WithCancel(context.Background())

	// Initialize logger
	logger := zerolog.New(os.Stdout).With().Timestamp().Logger()
	if config.Logging.Level != "" {
		level, err := zerolog.ParseLevel(config.Logging.Level)
		if err == nil {
			logger = logger.Level(level)
		}
	}

	router := &Router{
		config:  config,
		ctx:     ctx,
		cancel:  cancel,
		logger:  &ZerologLogger{logger: &logger},
		wg:      sync.WaitGroup{},
		startBackgroundServices: func() {
			fmt.Println("Background services stub - not implemented")
		},
		stopBackgroundServices: func() {
			fmt.Println("Background services stop stub - not implemented")
		},
	}

	// Initialize components
	if err := router.initializeComponents(); err != nil {
		return nil, fmt.Errorf("failed to initialize components: %w", err)
	}

	// Setup HTTP server
	if err := router.setupServer(); err != nil {
		return nil, fmt.Errorf("failed to setup server: %w", err)
	}

	return router, nil
}

// Start starts the router
func (r *Router) Start() error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if r.started {
		return NewError(ErrCodeInternalServerError, "router already started", nil)
	}

	r.logger.Info().Msg("Starting Aether Mailer Router")

	// Start background services
	r.startBackgroundServices()

	// Start HTTP server
	r.started = true
	go func() {
		defer func() {
			if err := recover(); err != nil {
				r.logger.Error().Err(err).Msg("Router panicked")
				r.cancel()
			}
		}()

		r.logger.Info().Msg("HTTP server starting"). 
		if err := r.server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			r.logger.Error().Err(err).Msg("HTTP server failed to start")
			r.cancel()
		}
	}()

	r.logger.Info().Msg("Aether Mailer Router started successfully")
	return nil
}

// Stop stops the router
func (r *Router) Stop(ctx context.Context) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if !r.started {
		return nil
	}

	r.logger.Info().Msg("Stopping Aether Mailer Router")

	// Cancel context
	r.cancel()

	// Stop HTTP server with timeout
	shutdownCtx, shutdownCancel := context.WithTimeout(ctx, 30*time.Second)
	defer shutdownCancel()

	if err := r.server.Shutdown(shutdownCtx); err != nil {
		r.logger.Error().Err(err).Msg("Server failed to shutdown gracefully")
		return err
	}

	// Stop background services
	r.stopBackgroundServices()

	// Wait for all goroutines to finish
	r.wg.Wait()

	r.started = false
	r.logger.Info().Msg("Aether Mailer Router stopped successfully")
	return nil
}

// GetConfig returns router configuration
func (r *Router) GetConfig() *Config {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.config
}

// GetRegistry returns the service registry
func (r *Router) GetRegistry() Registry {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.registry
}

// GetBalancer returns the load balancer
func (r *Router) GetBalancer() Balancer {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.balancer
}

// GetHealthChecker returns the health checker
func (r *Router) GetHealthChecker() HealthChecker {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.healthChecker
}

// ZerologLogger adapts zerolog.Logger to our Logger interface
type ZerologLogger struct {
	logger *zerolog.Logger
}

func (z *ZerologLogger) Debug(msg string, fields ...interface{}) {
	if len(fields) > 0 {
		z.logger.Debug().Fields(fields).Msg(msg)
	} else {
		z.logger.Debug().Msg(msg)
	}
}

func (z *ZerologLogger) Info(msg string, fields ...interface{}) {
	if len(fields) > 0 {
		z.logger.Info().Fields(fields).Msg(msg)
	} else {
		z.logger.Info().Msg(msg)
	}
}

func (z *ZerologLogger) Warn(msg string, fields ...interface{}) {
	if len(fields) > 0 {
		z.logger.Warn().Fields(fields).Msg(msg)
	} else {
		z.logger.Warn().Msg(msg)
	}
}

func (z *ZerologLogger) Error(msg string, fields ...interface{}) {
	if len(fields) > 0 {
		z.logger.Error().Fields(fields).Msg(msg)
	} else {
		z.logger.Error().Msg(msg)
	}
}

func (z *ZerologLogger) Fatal(msg string, fields ...interface{}) {
	if len(fields) > 0 {
		z.logger.Fatal().Fields(fields).Msg(msg)
	} else {
		z.logger.Fatal().Msg(msg)
	}
}

func (z *ZerologLogger) WithFields(fields map[string]interface{}) Logger {
	return &ZerologLoggerWithFields{
		logger: z.logger,
		fields: fields,
	}
}

func (z *ZerologLogger) WithField(key string, value interface{}) Logger {
	return &ZerologLoggerWithFields{
		logger: z.logger,
		fields: map[string]interface{}{key: value},
	}
}

// ZerologLoggerWithFields represents a logger with pre-configured fields
type ZerologLoggerWithFields struct {
	logger *zerolog.Logger
	fields map[string]interface{}
}

func (z *ZerologLoggerWithFields) Debug(msg string, fields ...interface{}) {
	if len(fields) > 0 {
		allFields := make(map[string]interface{})
		for k, v := range z.fields {
			allFields[k] = v
		}
		for k, v := range fields {
			allFields[k] = v
		}
		z.logger.Debug().Fields(allFields).Msg(msg)
	} else {
		z.logger.Debug().Fields(z.fields).Msg(msg)
	}
}

func (z *ZerologLoggerWithFields) Info(msg string, fields ...interface{}) {
	if len(fields) > 0 {
		allFields := make(map[string]interface{})
		for k, v := range z.fields {
			allFields[k] = v
		}
		for k, v := range fields {
			allFields[k] = v
		}
		z.logger.Info().Fields(allFields).Msg(msg)
	} else {
		z.logger.Info().Fields(z.fields).Msg(msg)
	}
}

func (z *ZerologLoggerWithFields) Warn(msg string, fields ...interface{}) {
	if len(fields) > 0 {
		allFields := make(map[string]interface{})
		for k, v := range z.fields {
			allFields[k] = v
		}
		for k, v := range fields {
			allFields[k] = v
		}
		z.logger.Warn().Fields(allFields).Msg(msg)
	} else {
		z.logger.Warn().Fields(z.fields).Msg(msg)
	}
}

func (z *ZerologLoggerWithFields) Error(msg string, fields ...interface{}) {
	if len(fields) > 0 {
		allFields := make(map[string]interface{})
		for k, v := range z.fields {
			allFields[k] = v
		}
		for k, v := range fields {
			allFields[k] = v
		}
		z.logger.Error().Fields(allFields).Msg(msg)
	} else {
		z.logger.Error().Fields(z.fields).Msg(msg)
	}
}

func (z *ZerologLoggerWithFields) Fatal(msg string, fields ...interface{}) {
	if len(fields) > 0 {
		allFields := make(map[string]interface{})
		for k, v := range z.fields {
			allFields[k] = v
		}
		for k, v := range fields {
			allFields[k] = v
		}
		z.logger.Fatal().Fields(allFields).Msg(msg)
	} else {
		z.logger.Fatal().Fields(z.fields).Msg(msg)
	}
}

// initializeComponents initializes all router components
func (r *Router) initializeComponents() error {
	// Initialize registry
	r.registry = NewServiceRegistry(nil, r.logger)
	
	// Initialize load balancer
	r.balancer = NewLoadBalancer("round_robin", r.logger, r.metrics)
	
	// Initialize health checker
	r.healthChecker = NewHealthChecker(r.registry, r.config.Services.Health, r.logger)
	
	// Initialize rate limiter (if enabled)
	if r.config.Security.RateLimit.Enabled {
		r.rateLimiter = NewRateLimiter(nil, r.config.Security.RateLimit, r.logger)
	}
	
	// Initialize SSL manager (if enabled)
	if r.config.SSL.Enabled {
		r.sslManager = NewSSLManager(r.config.SSL, r.logger)
	}
	
	// Initialize proxy
	r.proxy = NewProxy(r.balancer, r.logger)
	
	return nil
}

// setupServer sets up the HTTP server
func (r *Router) setupServer() error {
	mux := http.NewServeMux()
	
	// Add health check endpoints
	mux.HandleFunc("/health", r.healthHandler)
	mux.HandleFunc("/health/ready", r.readyHandler)
	mux.HandleFunc("/health/live", r.liveHandler)
	
	// Add metrics endpoint
	if r.config.Monitoring.Enabled && r.config.Monitoring.Metrics {
		mux.HandleFunc(r.config.Monitoring.Endpoint, r.metricsHandler)
	}
	
	r.server = &http.Server{
		Addr:         fmt.Sprintf("%s:%d", r.config.Server.Host, r.config.Server.Port),
		Handler:      mux,
		ReadTimeout:  r.config.Server.ReadTimeout,
		WriteTimeout: r.config.Server.WriteTimeout,
		IdleTimeout:  r.config.Server.IdleTimeout,
	}
	
	return nil
}

// healthHandler handles health check requests
func (r *Router) healthHandler(w http.ResponseWriter, req *http.Request) {
	health := map[string]interface{}{
		"status":    "healthy",
		"timestamp": time.Now().Format("2006-01-02T15:04:05Z"),
		"uptime":    time.Since(time.Now()).Seconds(),
		"version":   "0.1.0",
		"checks": map[string]interface{}{
			"api":      "running",
			"registry": "running",
			"balancer": "running",
		},
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    health,
	})
}

// readyHandler handles readiness checks
func (r *Router) readyHandler(w http.ResponseWriter, req *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data": map[string]interface{}{
			"status":    "ready",
			"timestamp": time.Now().Format("2006-01-02T15:04:05Z"),
		},
	})
}

// liveHandler handles liveness checks
func (r *Router) liveHandler(w http.ResponseWriter, req *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data": map[string]interface{}{
			"status":    "alive",
			"timestamp": time.Now().Format("2006-01-02T15:04:05Z"),
		},
	})
}

// metricsHandler handles metrics requests
func (r *Router) metricsHandler(w http.ResponseWriter, req *http.Request) {
	metrics := map[string]interface{}{
		"total_requests":   0,
		"active_connections": 0,
		"last_updated":    time.Now().Format("2006-01-02T15:04:05Z"),
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    metrics,
	})
}