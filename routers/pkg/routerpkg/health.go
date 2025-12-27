package routerpkg

import (
	"context"
	"net/http"
	"sync"
	"time"
)

// HealthChecker implements the HealthChecker interface
type HealthChecker struct {
	registry Registry
	config   HealthConfig
	logger   Logger
	mu       sync.RWMutex
	running  bool
	ctx      context.Context
	cancel   context.CancelFunc
	wg       sync.WaitGroup
}

// NewHealthChecker creates a new health checker
func NewHealthChecker(registry Registry, config HealthConfig, logger Logger) *HealthChecker {
	ctx, cancel := context.WithCancel(context.Background())
	return &HealthChecker{
		registry: registry,
		config:   config,
		logger:   logger,
		ctx:      ctx,
		cancel:   cancel,
	}
}

// CheckHealth checks the health of a service
func (hc *HealthChecker) CheckHealth(service *Service) (*HealthStatus, error) {
	if service == nil {
		return nil, NewError(ErrCodeInvalidRequest, "service cannot be nil", nil)
	}

	startTime := time.Now()

	// Create HTTP request for health check
	url := hc.buildHealthURL(service)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return &HealthStatus{
			Status:    HealthStateUnhealthy,
			Message:   "Failed to create health check request",
			CheckedAt: startTime,
			Duration:  time.Since(startTime),
			Details:   map[string]interface{}{"error": err.Error()},
		}, nil
	}

	// Set timeout
	ctx, cancel := context.WithTimeout(context.Background(), hc.config.Timeout)
	defer cancel()
	req = req.WithContext(ctx)

	// Perform health check
	client := &http.Client{
		Timeout: hc.config.Timeout,
	}

	resp, err := client.Do(req)
	if err != nil {
		return &HealthStatus{
			Status:    HealthStateUnhealthy,
			Message:   "Health check request failed",
			CheckedAt: startTime,
			Duration:  time.Since(startTime),
			Details:   map[string]interface{}{"error": err.Error()},
		}, nil
	}
	defer resp.Body.Close()

	duration := time.Since(startTime)

	// Determine health status
	status := HealthStateHealthy
	message := "Service is healthy"

	if resp.StatusCode >= 400 {
		status = HealthStateUnhealthy
		message = "Service returned error status"
	}

	healthStatus := &HealthStatus{
		Status:    status,
		Message:   message,
		CheckedAt: startTime,
		Duration:  duration,
		Details: map[string]interface{}{
			"status_code": resp.StatusCode,
			"url":         url,
		},
	}

	// Update service health in registry
	if hc.registry != nil {
		if registry, ok := hc.registry.(*ServiceRegistry); ok {
			registry.UpdateHealthStatus(service.ID, healthStatus)
		}
	}

	hc.logger.Debug("Health check completed",
		"service_id", service.ID,
		"status", status,
		"duration", duration,
		"status_code", resp.StatusCode,
	)

	return healthStatus, nil
}

// StartHealthChecks starts continuous health checking
func (hc *HealthChecker) StartHealthChecks(ctx context.Context) error {
	hc.mu.Lock()
	defer hc.mu.Unlock()

	if hc.running {
		return NewError(ErrCodeInternalServerError, "health checker already running", nil)
	}

	if !hc.config.Enabled {
		hc.logger.Info("Health checking disabled")
		return nil
	}

	hc.running = true
	hc.ctx, hc.cancel = context.WithCancel(ctx)

	hc.logger.Info("Starting health checks",
		"interval", hc.config.Interval,
		"timeout", hc.config.Timeout,
		"path", hc.config.Path,
	)

	// Start health checking goroutine
	hc.wg.Add(1)
	go func() {
		defer hc.wg.Done()
		hc.runHealthChecks()
	}()

	return nil
}

// StopHealthChecks stops health checking
func (hc *HealthChecker) StopHealthChecks() error {
	hc.mu.Lock()
	defer hc.mu.Unlock()

	if !hc.running {
		return nil
	}

	hc.logger.Info("Stopping health checks")

	// Cancel context
	hc.cancel()
	hc.running = false

	// Wait for goroutine to finish
	hc.wg.Wait()

	hc.logger.Info("Health checks stopped")
	return nil
}

// GetHealthStatus returns the health status of a service
func (hc *HealthChecker) GetHealthStatus(serviceID string) (*HealthStatus, error) {
	if serviceID == "" {
		return nil, NewError(ErrCodeInvalidRequest, "service ID is required", nil)
	}

	service, err := hc.registry.GetService(serviceID)
	if err != nil {
		return nil, err
	}

	if service.Health == nil {
		return &HealthStatus{
			Status:    HealthStateUnknown,
			Message:   "No health status available",
			CheckedAt: time.Time{},
			Duration:  0,
			Details:   nil,
		}, nil
	}

	return service.Health, nil
}

// GetAllHealthStatus returns health status of all services
func (hc *HealthChecker) GetAllHealthStatus() (map[string]*HealthStatus, error) {
	services, err := hc.registry.GetServices()
	if err != nil {
		return nil, err
	}

	statusMap := make(map[string]*HealthStatus)
	for _, service := range services {
		if service.Health != nil {
			statusMap[service.ID] = service.Health
		} else {
			statusMap[service.ID] = &HealthStatus{
				Status:    HealthStateUnknown,
				Message:   "No health status available",
				CheckedAt: time.Time{},
				Duration:  0,
				Details:   nil,
			}
		}
	}

	return statusMap, nil
}

// runHealthChecks runs the continuous health checking loop
func (hc *HealthChecker) runHealthChecks() {
	ticker := time.NewTicker(hc.config.Interval)
	defer ticker.Stop()

	for {
		select {
		case <-hc.ctx.Done():
			return
		case <-ticker.C:
			hc.performHealthChecks()
		}
	}
}

// performHealthChecks performs health checks on all services
func (hc *HealthChecker) performHealthChecks() {
	services, err := hc.registry.GetServices()
	if err != nil {
		hc.logger.Error("Failed to get services for health checks", "error", err)
		return
	}

	if len(services) == 0 {
		hc.logger.Debug("No services to health check")
		return
	}

	hc.logger.Debug("Performing health checks", "service_count", len(services))

	// Perform health checks concurrently
	semaphore := make(chan struct{}, 10) // Limit concurrent checks
	var wg sync.WaitGroup

	for _, service := range services {
		wg.Add(1)
		go func(s *Service) {
			defer wg.Done()

			semaphore <- struct{}{}
			defer func() { <-semaphore }()

			hc.CheckHealth(s)
		}(service)
	}

	wg.Wait()
	hc.logger.Debug("Health checks completed", "service_count", len(services))
}

// buildHealthURL builds the health check URL for a service
func (hc *HealthChecker) buildHealthURL(service *Service) string {
	protocol := "http"
	if service.Protocol == ProtocolHTTPS {
		protocol = "https"
	}

	url := protocol + "://" + service.Address
	if service.Port != 80 && service.Port != 443 {
		url += ":" + string(rune(service.Port))
	}

	if hc.config.Path != "" {
		url += hc.config.Path
	} else {
		url += DefaultHealthCheckPath
	}

	return url
}

// CheckHealthSync performs a synchronous health check
func (hc *HealthChecker) CheckHealthSync(serviceID string) (*HealthStatus, error) {
	service, err := hc.registry.GetService(serviceID)
	if err != nil {
		return nil, err
	}

	return hc.CheckHealth(service)
}

// GetHealthyServices returns only healthy services
func (hc *HealthChecker) GetHealthyServices() ([]*Service, error) {
	return hc.registry.GetHealthyServices()
}

// GetUnhealthyServices returns only unhealthy services
func (hc *HealthChecker) GetUnhealthyServices() ([]*Service, error) {
	services, err := hc.registry.GetServices()
	if err != nil {
		return nil, err
	}

	unhealthy := make([]*Service, 0)
	for _, service := range services {
		if service.Health != nil && service.Health.Status == HealthStateUnhealthy {
			unhealthy = append(unhealthy, service)
		}
	}

	return unhealthy, nil
}

// GetUnknownServices returns only services with unknown health status
func (hc *HealthChecker) GetUnknownServices() ([]*Service, error) {
	services, err := hc.registry.GetServices()
	if err != nil {
		return nil, err
	}

	unknown := make([]*Service, 0)
	for _, service := range services {
		if service.Health == nil || service.Health.Status == HealthStateUnknown {
			unknown = append(unknown, service)
		}
	}

	return unknown, nil
}

// GetHealthSummary returns a summary of health status
func (hc *HealthChecker) GetHealthSummary() (*HealthSummary, error) {
	services, err := hc.registry.GetServices()
	if err != nil {
		return nil, err
	}

	summary := &HealthSummary{
		Total:     len(services),
		Healthy:   0,
		Unhealthy: 0,
		Unknown:   0,
		CheckedAt: time.Now(),
	}

	for _, service := range services {
		if service.Health == nil {
			summary.Unknown++
		} else {
			switch service.Health.Status {
			case HealthStateHealthy:
				summary.Healthy++
			case HealthStateUnhealthy:
				summary.Unhealthy++
			case HealthStateUnknown:
				summary.Unknown++
			}
		}
	}

	return summary, nil
}

// HealthSummary represents a health status summary
type HealthSummary struct {
	Total     int       `yaml:"total" json:"total"`
	Healthy   int       `yaml:"healthy" json:"healthy"`
	Unhealthy int       `yaml:"unhealthy" json:"unhealthy"`
	Unknown   int       `yaml:"unknown" json:"unknown"`
	CheckedAt time.Time `yaml:"checked_at" json:"checked_at"`
}
