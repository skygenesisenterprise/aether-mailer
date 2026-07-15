package main

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	redisclient "github.com/skygenesisenterprise/aether-account/server/internal/redis"
	"github.com/skygenesisenterprise/aether-account/server/src/config"
	"github.com/skygenesisenterprise/aether-account/server/src/middleware"
	"github.com/skygenesisenterprise/aether-account/server/src/routes"
	"github.com/skygenesisenterprise/aether-account/server/src/services"
)

type runtimeMode string

const (
	modeAPI    runtimeMode = "api"
	modeServer runtimeMode = "server"
)

func connectDatabase(ctx context.Context, logger *slog.Logger, cfg config.Config) (*services.DatabaseService, error) {
	db, err := services.NewDatabaseService(cfg.Database.URL)
	if err != nil {
		return nil, fmt.Errorf("open database: %w", err)
	}

	if err := db.Ping(ctx); err != nil {
		_ = db.Close()
		return nil, fmt.Errorf("ping database: %w", err)
	}

	logger.Info(
		"database connected",
		"service", "database",
		"host", cfg.Database.Host,
		"port", cfg.Database.Port,
		"name", cfg.Database.Name,
	)

	return db, nil
}

func parseRuntimeMode(args []string) (runtimeMode, error) {
	if len(args) == 0 {
		return modeAPI, nil
	}
	switch runtimeMode(args[0]) {
	case modeAPI, modeServer:
		return modeAPI, nil
	default:
		return "", fmt.Errorf("unknown mode %q", args[0])
	}
}

func runHTTPServer(ctx context.Context, logger *slog.Logger, cfg config.Config, handler http.Handler, serviceRole runtimeMode) error {
	server := &http.Server{
		Addr:    ":" + cfg.Server.Port,
		Handler: handler,
	}

	errCh := make(chan error, 1)
	go func() {
		logger.Info("server starting", "service", "http", "port", cfg.Server.Port, "mode", string(serviceRole))
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			errCh <- err
			return
		}
		errCh <- nil
	}()

	select {
	case <-ctx.Done():
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		return server.Shutdown(shutdownCtx)
	case err := <-errCh:
		return err
	}
}

func main() {
	cfg, err := config.Load()
	if err != nil {
		panic(err)
	}
	if cfg.App.Mode == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	db, err := connectDatabase(context.Background(), logger, cfg)
	if err != nil {
		logger.Error("database connection failed", "error", err)
		os.Exit(1)
	}
	defer db.Close()
	if err := db.AutoMigrate(); err != nil {
		logger.Error("database migration failed", "error", err)
		os.Exit(1)
	}

	redis, err := redisclient.New(redisclient.Config{
		Enabled:        cfg.Redis.Enabled,
		Required:       cfg.Redis.Required,
		URL:            cfg.Redis.URL,
		Host:           cfg.Redis.Host,
		Port:           cfg.Redis.Port,
		Password:       cfg.Redis.Password,
		DB:             cfg.Redis.DB,
		KeyPrefix:      cfg.Redis.KeyPrefix,
		DefaultTTL:     cfg.Redis.DefaultTTL,
		ConnectTimeout: cfg.Redis.ConnectTimeout,
		ReadTimeout:    cfg.Redis.ReadTimeout,
		WriteTimeout:   cfg.Redis.WriteTimeout,
		MaxRetries:     cfg.Redis.MaxRetries,
	})
	if err != nil {
		logger.Error("redis initialization failed", "error", err)
		os.Exit(1)
	}
	defer func() {
		if redis != nil {
			_ = redis.Close()
		}
	}()

	repos := services.NewRepositories(db.Gorm())
	identityProvider := services.NewIdentityProvider(cfg.Auth, repos)
	authLimiter := services.NewAuthRateLimiter(redis)
	eventBus := services.NewEventBus(cfg, redis)
	defer eventBus.Close()
	presence := services.NewPresenceService(logger, redis, eventBus, repos.Users(), 75*time.Second)
	defer presence.Close()

	userService := services.NewUserService(repos.Users(), repos.UserSettings(), repos.NotificationPreferences(), presence)
	workspaceService := services.NewWorkspaceService(db, cfg.Auth, repos.Users(), repos)
	authService := services.NewAuthService(cfg.Auth, db, repos, identityProvider, authLimiter, workspaceService)
	oauthService := services.NewOAuthService(cfg.OAuth, repos, authService, identityProvider, workspaceService, nil)

	mode, err := parseRuntimeMode(os.Args[1:])
	if err != nil {
		logger.Error("unknown mode", "error", err)
		os.Exit(1)
	}

	router := gin.New()
	router.Use(middleware.RequestID(), middleware.Recovery(logger), middleware.CORS(cfg.CORS.AllowedOrigins))
	if cfg.App.AccessLogs {
		router.Use(middleware.Logging(logger))
	}
	if len(cfg.App.TrustedProxies) > 0 {
		_ = router.SetTrustedProxies(cfg.App.TrustedProxies)
	}
	routes.SetupRoutes(router, routes.Dependencies{
		Config:           cfg,
		Logger:           logger,
		Database:         db,
		Redis:            redis,
		EventBus:         eventBus,
		IdentityProvider: identityProvider,
		AuthService:      authService,
		OAuthService:     oauthService,
		UserService:      userService,
		WorkspaceService: workspaceService,
		RuntimeRole:      string(mode),
	})

	if err := runHTTPServer(ctx, logger, cfg, router, mode); err != nil {
		logger.Error("server stopped unexpectedly", "error", err)
		os.Exit(1)
	}
}
