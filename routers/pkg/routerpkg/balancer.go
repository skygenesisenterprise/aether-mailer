package routerpkg

import (
	"context"
	"net/http"
	"sync"
	"time"
)

// LoadBalancer implements the Balancer interface
type LoadBalancer struct {
	algorithm       string
	services        []*Service
	logger          Logger
	metrics         Metrics
	mu              sync.RWMutex
	roundRobinIndex int
}

// NewLoadBalancer creates a new load balancer
func NewLoadBalancer(algorithm string, logger Logger, metrics Metrics) *LoadBalancer {
	return &LoadBalancer{
		algorithm: algorithm,
		logger:    logger,
		metrics:   metrics,
	}
}

// SelectService selects a service for the given request
func (lb *LoadBalancer) SelectService(request *http.Request, services []*Service) (*Service, error) {
	if len(services) == 0 {
		return nil, NewError(ErrCodeServiceNotFound, "no services available", nil)
	}

	// Filter healthy services
	healthyServices := lb.filterHealthyServices(services)
	if len(healthyServices) == 0 {
		return nil, NewError(ErrCodeServiceUnavailable, "no healthy services available", nil)
	}

	lb.mu.RLock()
	algorithm := lb.algorithm
	lb.mu.RUnlock()

	// Select service based on algorithm
	var selected *Service
	var err error

	switch algorithm {
	case AlgorithmRoundRobin:
		selected, err = lb.selectRoundRobin(healthyServices, request)
	case AlgorithmWeightedRoundRobin:
		selected, err = lb.selectWeightedRoundRobin(healthyServices, request)
	case AlgorithmLeastConnections:
		selected, err = lb.selectLeastConnections(healthyServices, request)
	case AlgorithmIPHash:
		selected, err = lb.selectIPHash(healthyServices, request)
	case AlgorithmRandom:
		selected, err = lb.selectRandom(healthyServices, request)
	default:
		selected, err = lb.selectRoundRobin(healthyServices, request)
	}

	if err != nil {
		return nil, err
	}

	// Record metrics
	if lb.metrics != nil {
		lb.metrics.Counter("load_balancer_requests", map[string]interface{}{
			"algorithm": algorithm,
			"service":   selected.ID,
		}).Inc()
	}

	lb.logger.Debug("Service selected",
		"service_id", selected.ID,
		"algorithm", algorithm,
		"total_services", len(services),
		"healthy_services", len(healthyServices),
	)

	return selected, nil
}

// SetAlgorithm sets the load balancing algorithm
func (lb *LoadBalancer) SetAlgorithm(algorithm string) error {
	if !IsValidLoadBalancingAlgorithm(algorithm) {
		return NewError(ErrCodeInvalidRequest, "invalid load balancing algorithm", map[string]interface{}{
			"algorithm": algorithm,
		})
	}

	lb.mu.Lock()
	defer lb.mu.Unlock()

	lb.algorithm = algorithm
	lb.logger.Info("Load balancing algorithm changed", "algorithm", algorithm)
	return nil
}

// GetAlgorithm returns the current algorithm
func (lb *LoadBalancer) GetAlgorithm() BalancingAlgorithm {
	lb.mu.RLock()
	defer lb.mu.RUnlock()

	return &LoadBalancingAlgorithm{
		name: lb.algorithm,
		lb:   lb,
	}
}

// GetMetrics returns load balancer metrics
func (lb *LoadBalancer) GetMetrics() *BalancerMetrics {
	lb.mu.RLock()
	defer lb.mu.RUnlock()

	return &BalancerMetrics{
		TotalRequests:  lb.getTotalRequests(),
		RequestsPerAlg: lb.getRequestsPerAlgorithm(),
		RequestsPerSvc: lb.getRequestsPerService(),
		ResponseTime:   lb.getResponseTimes(),
		ErrorRate:      lb.getErrorRates(),
		LastUpdated:    time.Now(),
	}
}

// filterHealthyServices filters only healthy services
func (lb *LoadBalancer) filterHealthyServices(services []*Service) []*Service {
	healthy := make([]*Service, 0)
	for _, service := range services {
		if service.Health == nil || service.Health.Status == HealthStateHealthy {
			healthy = append(healthy, service)
		}
	}
	return healthy
}

// selectRoundRobin implements round-robin selection
func (lb *LoadBalancer) selectRoundRobin(services []*Service, request *http.Request) (*Service, error) {
	lb.mu.Lock()
	defer lb.mu.Unlock()

	if len(services) == 0 {
		return nil, NewError(ErrCodeServiceNotFound, "no services available", nil)
	}

	index := lb.roundRobinIndex % len(services)
	lb.roundRobinIndex++

	return services[index], nil
}

// selectWeightedRoundRobin implements weighted round-robin selection
func (lb *LoadBalancer) selectWeightedRoundRobin(services []*Service, request *http.Request) (*Service, error) {
	if len(services) == 0 {
		return nil, NewError(ErrCodeServiceNotFound, "no services available", nil)
	}

	// Calculate total weight
	totalWeight := 0
	for _, service := range services {
		weight := service.Weight
		if weight <= 0 {
			weight = DefaultServiceWeight
		}
		totalWeight += weight
	}

	if totalWeight == 0 {
		// Fallback to regular round-robin
		return lb.selectRoundRobin(services, request)
	}

	// Select service based on weight
	lb.mu.Lock()
	defer lb.mu.Unlock()

	target := lb.roundRobinIndex % totalWeight
	lb.roundRobinIndex++

	currentWeight := 0
	for _, service := range services {
		weight := service.Weight
		if weight <= 0 {
			weight = DefaultServiceWeight
		}
		currentWeight += weight
		if target < currentWeight {
			return service, nil
		}
	}

	// Fallback to first service
	return services[0], nil
}

// selectLeastConnections implements least connections selection
func (lb *LoadBalancer) selectLeastConnections(services []*Service, request *http.Request) (*Service, error) {
	if len(services) == 0 {
		return nil, NewError(ErrCodeServiceNotFound, "no services available", nil)
	}

	var selected *Service
	minConnections := int64(^uint64(0) >> 1) // Max int64

	for _, service := range services {
		connections := lb.getServiceConnections(service.ID)
		if connections < minConnections {
			minConnections = connections
			selected = service
		}
	}

	if selected == nil {
		// Fallback to first service
		return services[0], nil
	}

	return selected, nil
}

// selectIPHash implements IP hash selection
func (lb *LoadBalancer) selectIPHash(services []*Service, request *http.Request) (*Service, error) {
	if len(services) == 0 {
		return nil, NewError(ErrCodeServiceNotFound, "no services available", nil)
	}

	// Get client IP
	clientIP := getClientIP(request)
	if clientIP == "" {
		// Fallback to round-robin
		return lb.selectRoundRobin(services, request)
	}

	// Simple hash function
	hash := 0
	for _, char := range clientIP {
		hash = hash*31 + int(char)
	}

	if hash < 0 {
		hash = -hash
	}

	index := hash % len(services)
	return services[index], nil
}

// selectRandom implements random selection
func (lb *LoadBalancer) selectRandom(services []*Service, request *http.Request) (*Service, error) {
	if len(services) == 0 {
		return nil, NewError(ErrCodeServiceNotFound, "no services available", nil)
	}

	// Simple random selection (in real implementation, use crypto/rand)
	index := time.Now().Nanosecond() % len(services)
	if index < 0 {
		index = -index
	}

	return services[index], nil
}

// getServiceConnections gets the number of connections for a service
func (lb *LoadBalancer) getServiceConnections(serviceID string) int64 {
	// This is a placeholder - in real implementation, track active connections
	return 0
}

// getTotalRequests gets the total number of requests
func (lb *LoadBalancer) getTotalRequests() int64 {
	// This is a placeholder - in real implementation, track from metrics
	return 0
}

// getRequestsPerAlgorithm gets requests per algorithm
func (lb *LoadBalancer) getRequestsPerAlgorithm() map[string]int64 {
	// This is a placeholder - in real implementation, track from metrics
	return make(map[string]int64)
}

// getRequestsPerService gets requests per service
func (lb *LoadBalancer) getRequestsPerService() map[string]int64 {
	// This is a placeholder - in real implementation, track from metrics
	return make(map[string]int64)
}

// getResponseTimes gets response times
func (lb *LoadBalancer) getResponseTimes() map[string]time.Duration {
	// This is a placeholder - in real implementation, track from metrics
	return make(map[string]time.Duration)
}

// getErrorRates gets error rates
func (lb *LoadBalancer) getErrorRates() map[string]float64 {
	// This is a placeholder - in real implementation, track from metrics
	return make(map[string]float64)
}

// getClientIP extracts the client IP from the request
func getClientIP(request *http.Request) string {
	// Check X-Forwarded-For header
	if xff := request.Header.Get(HeaderXForwardedFor); xff != "" {
		return xff
	}

	// Check X-Real-IP header
	if xri := request.Header.Get(HeaderXRealIP); xri != "" {
		return xri
	}

	// Use remote address
	return request.RemoteAddr
}

// LoadBalancingAlgorithm implements the BalancingAlgorithm interface
type LoadBalancingAlgorithm struct {
	name string
	lb   *LoadBalancer
}

// Name returns the algorithm name
func (lba *LoadBalancingAlgorithm) Name() string {
	return lba.name
}

// Select selects a service from the list
func (lba *LoadBalancingAlgorithm) Select(services []*Service, request *http.Request) (*Service, error) {
	return lba.lb.SelectService(request, services)
}

// Reset resets the algorithm state
func (lba *LoadBalancingAlgorithm) Reset() error {
	lba.lb.mu.Lock()
	defer lba.lb.mu.Unlock()

	lba.lb.roundRobinIndex = 0
	return nil
}
