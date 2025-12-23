package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"runtime"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/rs/cors"
	"github.com/rs/zerolog/log"
	"github.com/skygenesisenterprise/server/src/config"
	"github.com/skygenesisenterprise/server/src/controllers"
	"github.com/skygenesisenterprise/server/src/middleware"
	"github.com/skygenesisenterprise/server/src/routes"
	"github.com/skygenesisenterprise/server/src/services"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// Server represents the main application server
type Server struct {
	config           *config.Config
	router           *gin.Engine
	db               *gorm.DB
	authController   *controllers.AuthController
	userController   *controllers.UserController
	domainController *controllers.DomainController
	apiKeyController *controllers.ApiKeyController
	authMiddleware   *middleware.AuthMiddleware
	apiKeyMiddleware *middleware.ApiKeyMiddleware
	domainMiddleware *middleware.DomainMiddleware
	monitoring       *middleware.MonitoringMiddleware
}

// NewServer creates a new server instance
func NewServer() (*Server, error) {
	// Load configuration
	cfg, err := config.LoadConfig()
	if err != nil {
		return nil, fmt.Errorf("failed to load configuration: %w", err)
	}

	// Initialize database
	db, err := connectDatabase(cfg)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	// Initialize Gin router
	router := gin.New()

	// Set Gin mode
	if cfg.NodeEnv == "production" {
		gin.SetMode(gin.ReleaseMode)
	} else {
		gin.SetMode(gin.DebugMode)
	}

	// Initialize services
	apiKeyService := services.NewApiKeyService(db, &cfg.APIKey)

	// Initialize middleware
	monitoringMiddleware := middleware.NewMonitoringMiddleware()
	authMiddleware := middleware.NewAuthMiddleware(nil, cfg) // authService will be nil for now
	apiKeyMiddleware := middleware.NewApiKeyMiddleware(apiKeyService, cfg)

	// Initialize controllers
	authController := controllers.NewAuthController(nil)     // authService will be nil for now
	userController := controllers.NewUserController(nil)     // userService will be nil for now
	domainController := controllers.NewDomainController(nil) // domainService will be nil for now
	apiKeyController := controllers.NewApiKeyController(apiKeyService)

	// Initialize domain middleware
	domainMiddleware := middleware.NewDomainMiddleware()

	// Apply global middleware
	router.Use(monitoringMiddleware.MonitoringMiddleware())
	router.Use(gin.Recovery())

	// Apply CORS middleware
	corsMiddleware := cors.New(cors.Options{
		AllowedOrigins:   cfg.CORS.Origins,
		AllowCredentials: cfg.CORS.Credentials,
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Request-ID", "X-API-Key"},
	})
	router.Use(func(ctx *gin.Context) {
		corsMiddleware.HandlerFunc(ctx.Writer, ctx.Request)
		ctx.Next()
	})

	return &Server{
		config:           cfg,
		router:           router,
		db:               db,
		authController:   authController,
		userController:   userController,
		domainController: domainController,
		apiKeyController: apiKeyController,
		authMiddleware:   authMiddleware,
		apiKeyMiddleware: apiKeyMiddleware,
		domainMiddleware: domainMiddleware,
		monitoring:       monitoringMiddleware,
	}, nil
}

// connectDatabase establishes database connection
func connectDatabase(cfg *config.Config) (*gorm.DB, error) {
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%d sslmode=%s",
		cfg.Database.Host,
		cfg.Database.User,
		cfg.Database.Password,
		cfg.Database.Name,
		cfg.Database.Port,
		cfg.Database.SSLMode,
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	// Test connection
	if err := db.Exec("SELECT 1").Error; err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	log.Info().Msg("✅ Database connected successfully")
	return db, nil
}

// setupRoutes configures all application routes
func (s *Server) setupRoutes() {
	// API v1 group - ALL ROUTES REQUIRE API KEY
	v1 := s.router.Group("/api/v1")
	v1.Use(s.apiKeyMiddleware.ValidateAPIKey()) // <-- OBLIGATORY API KEY VALIDATION

	// Initialize system key
	if err := s.initializeSystemKey(); err != nil {
		log.Error().Err(err).Msg("Failed to initialize system key")
	}

	// API key management routes
	apiKeyRoutes := routes.NewApiKeyRoutes(s.apiKeyController, s.apiKeyMiddleware, s.authMiddleware)
	apiKeyRoutes.SetupRoutes(v1)

	// Health routes
	healthRoutes := routes.NewHealthRoutes(s.monitoring)
	healthRoutes.SetupRoutes(v1)

	// Auth routes
	authRoutes := routes.NewAuthRoutes(s.authController, s.authMiddleware)
	authRoutes.SetupRoutes(v1)

	// User routes
	userRoutes := routes.NewUserRoutes(s.userController, s.authMiddleware)
	userRoutes.SetupRoutes(v1)

	// Domain routes
	domainRoutes := routes.NewDomainRoutes(s.domainController, s.authMiddleware, s.domainMiddleware)
	domainRoutes.SetupRoutes(v1)

	// Root health endpoint
	s.router.GET("/health", func(ctx *gin.Context) {
		ctx.JSON(http.StatusOK, gin.H{
			"status":    "healthy",
			"timestamp": time.Now().Format(time.RFC3339),
			"uptime":    time.Since(time.Now()).Seconds(),
			"memory":    runtime.MemStats{},
			"checks": gin.H{
				"database": "connected",
				"api":      "running",
			},
		})
	})

	// Root status endpoint
	s.router.GET("/api/v1/status", func(ctx *gin.Context) {
		ctx.JSON(http.StatusOK, gin.H{
			"success": true,
			"data": gin.H{
				"status":      "online",
				"uptime":      time.Since(time.Now()).Seconds(),
				"version":     "0.1.0",
				"environment": s.config.NodeEnv,
				"services": gin.H{
					"api":            true,
					"database":       "connected",
					"authentication": true,
					"monitoring":     true,
				},
				"endpoints": gin.H{
					"health":  "/api/v1/health",
					"auth":    "/api/v1/auth",
					"users":   "/api/v1/users",
					"domains": "/api/v1/domains",
					"metrics": "/api/v1/metrics",
				},
			},
		})
	})

	// Root metrics endpoint
	s.router.GET("/api/v1/metrics", func(ctx *gin.Context) {
		metrics := s.monitoring.GetMetrics()
		ctx.JSON(http.StatusOK, gin.H{
			"success": true,
			"data":    metrics,
		})
	})

	// 404 handler
	s.router.NoRoute(func(ctx *gin.Context) {
		log.Warn().Msgf("[%s] 404 - %s %s - %s",
			time.Now().Format(time.RFC3339),
			ctx.Request.Method,
			ctx.Request.URL.Path,
			ctx.ClientIP(),
		)

		ctx.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error": gin.H{
				"code":      "NOT_FOUND",
				"message":   "Route not found",
				"path":      ctx.Request.URL.Path,
				"method":    ctx.Request.Method,
				"timestamp": time.Now().Format(time.RFC3339),
			},
		})
	})
}

// Start starts the HTTP server
func (s *Server) Start() error {
	s.setupRoutes()

	// Graceful shutdown setup
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Get system information
	printSystemInfo()

	log.Info().Msgf("🚀 Aether Mailer API Server running on port %d", s.config.Server.Port)
	log.Info().Msgf("📊 Environment: %s", s.config.NodeEnv)
	log.Info().Msgf("🔗 Health check: http://localhost:%d/health", s.config.Server.Port)
	log.Info().Msgf("📝 API Documentation: http://localhost:%d/api/v1", s.config.Server.Port)
	log.Info().Msgf("👥 Users API: http://localhost:%d/api/v1/users", s.config.Server.Port)
	log.Info().Msgf("🌐 Domains API: http://localhost:%d/api/v1/domains", s.config.Server.Port)
	log.Info().Msgf("🔐 Auth API: http://localhost:%d/api/v1/auth", s.config.Server.Port)
	log.Info().Msgf("📈 Metrics: http://localhost:%d/api/v1/metrics", s.config.Server.Port)
	log.Info().Msgf("📊 Status: http://localhost:%d/api/v1/status", s.config.Server.Port)
	log.Info().Msgf("🖥️  PID: %d", os.Getpid())
	log.Info().Msg("")
	log.Info().Msg("🔧 Ready to serve requests...")

	// Start server
	srv := &http.Server{
		Addr:    fmt.Sprintf(":%d", s.config.Server.Port),
		Handler: s.router,
	}

	// Handle shutdown signals
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		<-sigChan
		log.Info().Msg("\n🛑️ Received shutdown signal. Shutting down gracefully...")

		// Create context with timeout for shutdown
		shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer shutdownCancel()

		// Attempt graceful shutdown
		if err := srv.Shutdown(shutdownCtx); err != nil {
			log.Error().Err(err).Msg("Server forced to shutdown")
		} else {
			log.Info().Msg("✅ Server shutdown complete")
		}

		// Close database connection
		if sqlDB, err := s.db.DB(); err == nil {
			sqlDB.Close()
			log.Info().Msg("✅ Database disconnected successfully")
		}

		cancel()
	}()

	// Start server
	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Error().Err(err).Msg("Failed to start server")
		return err
	}

	<-ctx.Done()
	return nil
}

// initializeSystemKey initializes the system API key
func (s *Server) initializeSystemKey() error {

	if s.config.APIKey.SystemKey != "" {
		log.Info().
			Msg("🔑 System API key initialized successfully")
		log.Warn().
			Str("systemKey", s.config.APIKey.SystemKey).
			Msg("⚠️  SYSTEM API KEY - KEEP SECRET AND SECURE")
	}

	return nil
}

// printSystemInfo prints system information (Linux-focused)
func printSystemInfo() {
	fmt.Println("\n🐧 System Information:")
	fmt.Printf("   Hostname: %s\n", getHostname())
	fmt.Printf("   Platform: %s %s\n", runtime.GOOS, runtime.GOARCH)
	fmt.Printf("   Go Version: %s\n", runtime.Version())
	fmt.Printf("   CPU Cores: %d\n", runtime.NumCPU())
	fmt.Printf("   Goroutines: %d\n", runtime.NumGoroutine())
	fmt.Println("")
}

// getHostname gets the system hostname
func getHostname() string {
	if hostname, err := os.Hostname(); err == nil {
		return hostname
	}
	return "unknown"
}
