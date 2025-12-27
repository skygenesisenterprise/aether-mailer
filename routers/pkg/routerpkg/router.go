package routerpkg

import (
	"context"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog"
)

// Router represents the main router implementation
type Router struct {
	config          *Config
	server          *http.Server
	engine          *gin.Engine
	registry        Registry
	balancer        Balancer
	healthChecker   HealthChecker
	rateLimiter     RateLimiter
	sslManager      SSLManager
	proxy           Proxy
	logger          Logger
	metrics         Metrics
	storage         Storage
	middlewareChain []Middleware
	mu              sync.RWMutex
	started         bool
	ctx             context.Context
	cancel          context.CancelFunc
	wg              sync.WaitGroup
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
	logger := &zerolog.Logger{}
	if config.Logging.Level != "" {
		level, err := zerolog.ParseLevel(config.Logging.Level)
		if err != nil {
			level = zerolog.InfoLevel
		}
		logger = zerolog.New(zerolog.ConsoleWriter{Out: zerolog.ConsoleWriter{Out: nil}}).Level(level)
	}

	router := &Router{
		config: config,
		logger: &ZerologLogger{logger: logger},
		ctx:    ctx,
		cancel: cancel,
	}

	// Initialize components
	if err := router.initializeComponents(); err != nil {
		cancel()
		return nil, fmt.Errorf("failed to initialize components: %w", err)
	}

	// Setup HTTP server
	if err := router.setupServer(); err != nil {
		cancel()
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

	r.logger.Info("Starting Aether Mailer Router",
		"host", r.config.Server.Host,
		"port", r.config.Server.Port,
		"version", "0.1.0",
	)

	// Start background services
	if err := r.startBackgroundServices(); err != nil {
		return fmt.Errorf("failed to start background services: %w", err)
	}

	// Start HTTP server
	r.started = true
	go func() {
		r.logger.Info("HTTP server starting",
			"address", fmt.Sprintf("%s:%d", r.config.Server.Host, r.config.Server.Port),
		)

		if err := r.server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			r.logger.Error("HTTP server failed to start", "error", err)
			r.cancel()
		}
	}()

	r.logger.Info("Aether Mailer Router started successfully")
	return nil
}

// Stop stops the router
func (r *Router) Stop(ctx context.Context) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if !r.started {
		return nil
	}

	r.logger.Info("Stopping Aether Mailer Router")

	// Cancel context
	r.cancel()

	// Stop HTTP server with timeout
	shutdownCtx, shutdownCancel := context.WithTimeout(ctx, 30*time.Second)
	defer shutdownCancel()

	if err := r.server.Shutdown(shutdownCtx); err != nil {
		r.logger.Error("Failed to shutdown HTTP server", "error", err)
		return fmt.Errorf("failed to shutdown server: %w", err)
	}

	// Stop background services
	if err := r.stopBackgroundServices(); err != nil {
		r.logger.Error("Failed to stop background services", "error", err)
		return fmt.Errorf("failed to stop background services: %w", err)
	}

	// Wait for all goroutines to finish
	r.wg.Wait()

	r.started = false
	r.logger.Info("Aether Mailer Router stopped successfully")
	return nil
}

// GetConfig returns the router configuration
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

// initializeComponents initializes all router components
func (r *Router) initializeComponents() error {
	// Initialize storage
	if err := r.initializeStorage(); err != nil {
		return fmt.Errorf("failed to initialize storage: %w", err)
	}

	// Initialize registry
	if err := r.initializeRegistry(); err != nil {
		return fmt.Errorf("failed to initialize registry: %w", err)
	}

	// Initialize load balancer
	if err := r.initializeBalancer(); err != nil {
		return fmt.Errorf("failed to initialize load balancer: %w", err)
	}

	// Initialize health checker
	if err := r.initializeHealthChecker(); err != nil {
		return fmt.Errorf("failed to initialize health checker: %w", err)
	}

	// Initialize rate limiter
	if err := r.initializeRateLimiter(); err != nil {
		return fmt.Errorf("failed to initialize rate limiter: %w", err)
	}

	// Initialize SSL manager
	if err := r.initializeSSLManager(); err != nil {
		return fmt.Errorf("failed to initialize SSL manager: %w", err)
	}

	// Initialize proxy
	if err := r.initializeProxy(); err != nil {
		return fmt.Errorf("failed to initialize proxy: %w", err)
	}

	// Initialize metrics
	if err := r.initializeMetrics(); err != nil {
		return fmt.Errorf("failed to initialize metrics: %w", err)
	}

	// Initialize middleware chain
	if err := r.initializeMiddleware(); err != nil {
		return fmt.Errorf("failed to initialize middleware: %w", err)
	}

	return nil
}

// setupServer sets up the HTTP server
func (r *Router) setupServer() error {
	// Set Gin mode
	if r.config.Logging.Level == "debug" {
		gin.SetMode(gin.DebugMode)
	} else {
		gin.SetMode(gin.ReleaseMode)
	}

	// Create Gin engine
	r.engine = gin.New()

	// Apply global middleware
	r.applyGlobalMiddleware()

	// Setup routes
	if err := r.setupRoutes(); err != nil {
		return fmt.Errorf("failed to setup routes: %w", err)
	}

	// Create HTTP server
	r.server = &http.Server{
		Addr:         fmt.Sprintf("%s:%d", r.config.Server.Host, r.config.Server.Port),
		Handler:      r.engine,
		ReadTimeout:  r.config.Server.ReadTimeout,
		WriteTimeout: r.config.Server.WriteTimeout,
		IdleTimeout:  r.config.Server.IdleTimeout,
	}

	return nil
}

// applyGlobalMiddleware applies global middleware to the Gin engine
func (r *Router) applyGlobalMiddleware() {
	// Recovery middleware
	r.engine.Use(gin.Recovery())

	// Logging middleware
	r.engine.Use(r.loggingMiddleware())

	// Request ID middleware
	r.engine.Use(r.requestIDMiddleware())

	// CORS middleware (if enabled)
	if r.config.Security.CORS.Enabled {
		r.engine.Use(r.corsMiddleware())
	}

	// Rate limiting middleware (if enabled)
	if r.config.Security.RateLimit.Enabled {
		r.engine.Use(r.rateLimitMiddleware())
	}

	// Custom middleware chain
	for _, middleware := range r.middlewareChain {
		r.engine.Use(r.ginMiddlewareAdapter(middleware))
	}
}

// setupRoutes sets up all routes
func (r *Router) setupRoutes() error {
	// Health check endpoint
	r.engine.GET("/health", r.healthEndpoint)
	r.engine.GET("/health/ready", r.readyEndpoint)
	r.engine.GET("/health/live", r.liveEndpoint)

	// Metrics endpoint (if enabled)
	if r.config.Monitoring.Metrics {
		r.engine.GET(r.config.Monitoring.Endpoint, r.metricsEndpoint)
	}

	// API routes
	api := r.engine.Group("/api/v1")
	{
		// Router management API
		router := api.Group("/router")
		{
			router.GET("/status", r.routerStatusEndpoint)
			router.GET("/config", r.routerConfigEndpoint)
			router.POST("/reload", r.routerReloadEndpoint)
		}

		// Service registry API
		registry := api.Group("/registry")
		{
			registry.GET("/services", r.registryListEndpoint)
			registry.GET("/services/:id", r.registryGetEndpoint)
			registry.POST("/services", r.registryRegisterEndpoint)
			registry.DELETE("/services/:id", r.registryUnregisterEndpoint)
			registry.GET("/services/:id/health", r.registryHealthEndpoint)
		}

		// Load balancer API
		balancer := api.Group("/balancer")
		{
			balancer.GET("/algorithm", r.balancerAlgorithmEndpoint)
			balancer.PUT("/algorithm", r.balancerSetAlgorithmEndpoint)
			balancer.GET("/metrics", r.balancerMetricsEndpoint)
		}
	}

	// Proxy routes (catch-all for reverse proxy)
	r.engine.NoRoute(r.proxyHandler)

	return nil
}

// startBackgroundServices starts all background services
func (r *Router) startBackgroundServices() error {
	// Start health checker
	if r.config.Services.Health.Enabled {
		r.wg.Add(1)
		go func() {
			defer r.wg.Done()
			if err := r.healthChecker.StartHealthChecks(r.ctx); err != nil {
				r.logger.Error("Health checker failed", "error", err)
			}
		}()
	}

	// Start service discovery
	if r.config.Services.Discovery.Type != DiscoveryTypeStatic {
		r.wg.Add(1)
		go func() {
			defer r.wg.Done()
			r.startServiceDiscovery()
		}()
	}

	// Start metrics collection
	if r.config.Monitoring.Enabled {
		r.wg.Add(1)
		go func() {
			defer r.wg.Done()
			r.startMetricsCollection()
		}()
	}

	return nil
}

// stopBackgroundServices stops all background services
func (r *Router) stopBackgroundServices() error {
	// Stop health checker
	if r.healthChecker != nil {
		if err := r.healthChecker.StopHealthChecks(); err != nil {
			r.logger.Error("Failed to stop health checker", "error", err)
		}
	}

	// Stop other services as needed
	return nil
}

// initializeStorage initializes the storage component
func (r *Router) initializeStorage() error {
	// Implementation will depend on storage type
	// For now, create a simple memory storage
	r.storage = &MemoryStorage{
		data: make(map[string][]byte),
		ttl:  make(map[string]time.Time),
	}
	return nil
}

// initializeRegistry initializes the service registry
func (r *Router) initializeRegistry() error {
	registry := &ServiceRegistry{
		services: make(map[string]*Service),
		storage:  r.storage,
		logger:   r.logger,
	}
	r.registry = registry
	return nil
}

// initializeBalancer initializes the load balancer
func (r *Router) initializeBalancer() error {
	balancer := &LoadBalancer{
		algorithm: r.config.LoadBalancer.Algorithm,
		logger:    r.logger,
		metrics:   r.metrics,
	}
	r.balancer = balancer
	return nil
}

// initializeHealthChecker initializes the health checker
func (r *Router) initializeHealthChecker() error {
	healthChecker := &HealthChecker{
		registry: r.registry,
		config:   r.config.Services.Health,
		logger:   r.logger,
	}
	r.healthChecker = healthChecker
	return nil
}

// initializeRateLimiter initializes the rate limiter
func (r *Router) initializeRateLimiter() error {
	if !r.config.Security.RateLimit.Enabled {
		return nil
	}

	rateLimiter := &RateLimiter{
		storage: r.storage,
		config:  r.config.Security.RateLimit,
		logger:  r.logger,
	}
	r.rateLimiter = rateLimiter
	return nil
}

// initializeSSLManager initializes the SSL manager
func (r *Router) initializeSSLManager() error {
	if !r.config.SSL.Enabled {
		return nil
	}

	sslManager := &SSLManager{
		config: r.config.SSL,
		logger: r.logger,
	}
	r.sslManager = sslManager
	return nil
}

// initializeProxy initializes the proxy component
func (r *Router) initializeProxy() error {
	proxy := &ReverseProxy{
		balancer: r.balancer,
		logger:   r.logger,
	}
	r.proxy = proxy
	return nil
}

// initializeMetrics initializes the metrics component
func (r *Router) initializeMetrics() error {
	if !r.config.Monitoring.Enabled {
		return nil
	}

	r.metrics = &MetricsCollector{
		enabled: r.config.Monitoring.Enabled,
		logger:  r.logger,
	}
	return nil
}

// initializeMiddleware initializes the middleware chain
func (r *Router) initializeMiddleware() error {
	// Add custom middleware here
	return nil
}

// validateConfig validates the router configuration
func validateConfig(config *Config) error {
	if config == nil {
		return NewError(ErrCodeInvalidRequest, "config is required", nil)
	}

	// Validate server configuration
	if config.Server.Port < 1 || config.Server.Port > 65535 {
		return NewError(ErrCodeInvalidRequest, "invalid server port", map[string]interface{}{
			"port": config.Server.Port,
		})
	}

	// Validate load balancer configuration
	if !IsValidLoadBalancingAlgorithm(config.LoadBalancer.Algorithm) {
		return NewError(ErrCodeInvalidRequest, "invalid load balancing algorithm", map[string]interface{}{
			"algorithm": config.LoadBalancer.Algorithm,
		})
	}

	// Validate storage configuration
	if !IsValidStorageType(config.Storage.Type) {
		return NewError(ErrCodeInvalidRequest, "invalid storage type", map[string]interface{}{
			"type": config.Storage.Type,
		})
	}

	return nil
}

// startServiceDiscovery starts the service discovery process
func (r *Router) startServiceDiscovery() {
	ticker := time.NewTicker(r.config.Services.Discovery.Interval)
	defer ticker.Stop()

	for {
		select {
		case <-r.ctx.Done():
			return
		case <-ticker.C:
			r.discoverServices()
		}
	}
}

// discoverServices discovers new services
func (r *Router) discoverServices() {
	// Implementation will depend on discovery type
	r.logger.Debug("Discovering services")
}

// startMetricsCollection starts metrics collection
func (r *Router) startMetricsCollection() {
	ticker := time.NewTicker(DefaultMetricsInterval)
	defer ticker.Stop()

	for {
		select {
		case <-r.ctx.Done():
			return
		case <-ticker.C:
			r.collectMetrics()
		}
	}
}

// collectMetrics collects router metrics
func (r *Router) collectMetrics() {
	// Implementation for metrics collection
	r.logger.Debug("Collecting metrics")
}

// ginMiddlewareAdapter adapts our middleware to Gin middleware
func (r *Router) ginMiddlewareAdapter(middleware Middleware) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Convert gin.Request to http.Request
		handler := middleware.Process(c.Request, c.Next)
		handler.ServeHTTP(c.Writer, c.Request)
	}
}

// ZerologLogger adapts zerolog.Logger to our Logger interface
type ZerologLogger struct {
	logger zerolog.Logger
}

func (z *ZerologLogger) Debug(msg string, fields ...interface{}) {
	z.logger.Debug().Msgf(msg, fields...)
}

func (z *ZerologLogger) Info(msg string, fields ...interface{}) {
	z.logger.Info().Msgf(msg, fields...)
}

func (z *ZerologLogger) Warn(msg string, fields ...interface{}) {
	z.logger.Warn().Msgf(msg, fields...)
}

func (z *ZerologLogger) Error(msg string, fields ...interface{}) {
	z.logger.Error().Msgf(msg, fields...)
}

func (z *ZerologLogger) Fatal(msg string, fields ...interface{}) {
	z.logger.Fatal().Msgf(msg, fields...)
}

func (z *ZerologLogger) WithFields(fields map[string]interface{}) Logger {
	return &ZerologLogger{
		logger: z.logger.With().Fields(fields).Logger(),
	}
}

func (z *ZerologLogger) WithField(key string, value interface{}) Logger {
	return &ZerologLogger{
		logger: z.logger.With().Field(key, value).Logger(),
	}
}
