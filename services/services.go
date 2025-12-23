package main

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"time"

	"github.com/skygenesisenterprise/aether-mailer/services/config"
	"github.com/skygenesisenterprise/aether-mailer/services/database"
	"github.com/skygenesisenterprise/aether-mailer/services/monitoring"
)

// ServiceStatus represents the status of a service
type ServiceStatus struct {
	Name            string     `json:"name"`
	Status          string     `json:"status"`
	StartTime       *time.Time `json:"startTime,omitempty"`
	LastHealthCheck *time.Time `json:"lastHealthCheck,omitempty"`
	Error           string     `json:"error,omitempty"`
}

// Service interface defines the contract for all services
type Service interface {
	Start(ctx context.Context) error
	Stop(ctx context.Context) error
	HealthCheck() bool
	GetName() string
}

// ServiceManager manages all mail services
type ServiceManager struct {
	services        map[string]Service
	serviceStatuses map[string]*ServiceStatus
	config          *config.ConfigManager
	db              *database.DatabaseManager
	loggerFactory   *monitoring.LoggerFactory
	logger          *monitoring.Logger
	ctx             context.Context
	cancel          context.CancelFunc
	wg              sync.WaitGroup
	isShuttingDown  bool
	mu              sync.RWMutex
}

// NewServiceManager creates a new service manager
func NewServiceManager() *ServiceManager {
	ctx, cancel := context.WithCancel(context.Background())

	return &ServiceManager{
		services:        make(map[string]Service),
		serviceStatuses: make(map[string]*ServiceStatus),
		ctx:             ctx,
		cancel:          cancel,
	}
}

// Initialize sets up the service manager
func (sm *ServiceManager) Initialize() error {
	// Load configuration
	sm.config = config.NewConfigManager()

	// Validate configuration
	if valid, errors := sm.config.ValidateConfig(); !valid {
		return fmt.Errorf("configuration validation failed: %v", errors)
	}

	// Initialize database
	sm.db = database.NewDatabaseManager(sm.config.GetDatabaseConfig())
	if err := sm.db.Connect(); err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}

	// Auto-migrate database
	if err := sm.db.AutoMigrate(); err != nil {
		return fmt.Errorf("failed to auto-migrate database: %w", err)
	}

	// Initialize logger factory
	sm.loggerFactory = monitoring.NewLoggerFactory(sm.config.GetLoggingConfig())
	sm.logger = sm.loggerFactory.GetLogger("ServiceManager")

	// Setup graceful shutdown
	sm.setupGracefulShutdown()

	sm.logger.Info("Service manager initialized successfully", "", nil)
	return nil
}

// RegisterService registers a service with the manager
func (sm *ServiceManager) RegisterService(service Service) {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	sm.services[service.GetName()] = service
	sm.serviceStatuses[service.GetName()] = &ServiceStatus{
		Name:   service.GetName(),
		Status: "stopped",
	}

	sm.logger.Info(fmt.Sprintf("Service registered: %s", service.GetName()), "", nil)
}

// StartService starts a specific service
func (sm *ServiceManager) StartService(serviceName string) error {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	if sm.isShuttingDown {
		return fmt.Errorf("cannot start service during shutdown")
	}

	service, exists := sm.services[serviceName]
	if !exists {
		return fmt.Errorf("unknown service: %s", serviceName)
	}

	sm.logger.Info(fmt.Sprintf("Starting service: %s", serviceName), "", nil)
	sm.updateServiceStatus(serviceName, "starting", nil, "")

	// Start service in goroutine
	sm.wg.Add(1)
	go func(s Service) {
		defer sm.wg.Done()

		if err := s.Start(sm.ctx); err != nil {
			sm.updateServiceStatus(serviceName, "error", nil, err.Error())
			sm.logger.Error(fmt.Sprintf("Failed to start service: %s", serviceName), err, "", nil)
			return
		}

		sm.updateServiceStatus(serviceName, "running", &time.Time{}, "")
		sm.logger.Info(fmt.Sprintf("Service started successfully: %s", serviceName), "", nil)
	}(service)

	return nil
}

// StopService stops a specific service
func (sm *ServiceManager) StopService(serviceName string) error {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	service, exists := sm.services[serviceName]
	if !exists {
		return fmt.Errorf("unknown service: %s", serviceName)
	}

	sm.logger.Info(fmt.Sprintf("Stopping service: %s", serviceName), "", nil)
	sm.updateServiceStatus(serviceName, "stopping", nil, "")

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := service.Stop(ctx); err != nil {
		sm.updateServiceStatus(serviceName, "error", nil, err.Error())
		sm.logger.Error(fmt.Sprintf("Failed to stop service: %s", serviceName), err, "", nil)
		return err
	}

	sm.updateServiceStatus(serviceName, "stopped", nil, "")
	sm.logger.Info(fmt.Sprintf("Service stopped successfully: %s", serviceName), "", nil)

	return nil
}

// StartAllServices starts all registered services
func (sm *ServiceManager) StartAllServices() error {
	sm.logger.Info("Starting all services...", "", nil)

	serviceNames := []string{"smtp", "imap", "queue", "security"}

	for _, serviceName := range serviceNames {
		if err := sm.StartService(serviceName); err != nil {
			sm.logger.Error(fmt.Sprintf("Failed to start %s, continuing with other services", serviceName), err, "", nil)
		}
	}

	sm.logger.Info("All services startup completed", "", nil)
	return nil
}

// StopAllServices stops all running services
func (sm *ServiceManager) StopAllServices() error {
	sm.logger.Info("Stopping all services...", "", nil)
	sm.isShuttingDown = true

	// Cancel all service contexts
	sm.cancel()

	// Stop services in reverse order
	serviceNames := []string{"queue", "smtp", "imap", "security"}
	for i := len(serviceNames) - 1; i >= 0; i-- {
		serviceName := serviceNames[i]
		if err := sm.StopService(serviceName); err != nil {
			sm.logger.Error(fmt.Sprintf("Failed to stop %s", serviceName), err, "", nil)
		}
	}

	// Disconnect database
	if err := sm.db.Disconnect(); err != nil {
		sm.logger.Error("Failed to disconnect database", err, "", nil)
	}

	// Wait for all goroutines to finish
	sm.wg.Wait()

	sm.logger.Info("All services stopped", "", nil)
	return nil
}

// GetServiceStatus returns the status of a specific service
func (sm *ServiceManager) GetServiceStatus(serviceName string) *ServiceStatus {
	sm.mu.RLock()
	defer sm.mu.RUnlock()

	if status, exists := sm.serviceStatuses[serviceName]; exists {
		return status
	}
	return nil
}

// GetAllServiceStatuses returns the status of all services
func (sm *ServiceManager) GetAllServiceStatuses() map[string]*ServiceStatus {
	sm.mu.RLock()
	defer sm.mu.RUnlock()

	result := make(map[string]*ServiceStatus)
	for name, status := range sm.serviceStatuses {
		result[name] = status
	}
	return result
}

// HealthCheck performs health checks on all services
func (sm *ServiceManager) HealthCheck() (bool, map[string]bool) {
	sm.mu.RLock()
	defer sm.mu.RUnlock()

	results := make(map[string]bool)
	overallHealthy := true

	for serviceName, service := range sm.services {
		isHealthy := service.HealthCheck()
		results[serviceName] = isHealthy

		if !isHealthy {
			overallHealthy = false
		}

		sm.logger.LogHealthCheck(serviceName, mapToHealthStatus(isHealthy), map[string]interface{}{
			"status":          sm.serviceStatuses[serviceName].Status,
			"startTime":       sm.serviceStatuses[serviceName].StartTime,
			"lastHealthCheck": sm.serviceStatuses[serviceName].LastHealthCheck,
			"error":           sm.serviceStatuses[serviceName].Error,
		})
	}

	// Check database health
	dbHealthy := sm.db.HealthCheck()
	results["database"] = dbHealthy
	if !dbHealthy {
		overallHealthy = false
	}

	return overallHealthy, results
}

// updateServiceStatus updates the status of a service
func (sm *ServiceManager) updateServiceStatus(serviceName, status string, startTime *time.Time, errorMsg string) {
	if serviceStatus, exists := sm.serviceStatuses[serviceName]; exists {
		serviceStatus.Status = status
		serviceStatus.LastHealthCheck = &time.Time{}

		if startTime != nil {
			serviceStatus.StartTime = startTime
		}

		if errorMsg != "" {
			serviceStatus.Error = errorMsg
		} else {
			serviceStatus.Error = ""
		}
	}
}

// mapToHealthStatus converts boolean to health status string
func mapToHealthStatus(healthy bool) string {
	if healthy {
		return "healthy"
	}
	return "unhealthy"
}

// setupGracefulShutdown sets up signal handlers for graceful shutdown
func (sm *ServiceManager) setupGracefulShutdown() {
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGTERM, syscall.SIGINT, syscall.SIGUSR2)

	go func() {
		sig := <-sigChan
		sm.logger.Info(fmt.Sprintf("Received %s, starting graceful shutdown...", sig), "", nil)

		if err := sm.StopAllServices(); err != nil {
			sm.logger.Error("Error during graceful shutdown", err, "", nil)
			os.Exit(1)
		}

		sm.logger.Info("Graceful shutdown completed", "", nil)
		os.Exit(0)
	}()
}

func main() {
	serviceManager := NewServiceManager()

	// Initialize service manager
	if err := serviceManager.Initialize(); err != nil {
		fmt.Printf("Failed to initialize service manager: %v\n", err)
		os.Exit(1)
	}

	// Start all services
	if err := serviceManager.StartAllServices(); err != nil {
		fmt.Printf("Failed to start services: %v\n", err)
		os.Exit(1)
	}

	// Wait for shutdown signal
	select {
	case <-serviceManager.ctx.Done():
		serviceManager.logger.Info("Service manager context cancelled", "", nil)
	}
}
