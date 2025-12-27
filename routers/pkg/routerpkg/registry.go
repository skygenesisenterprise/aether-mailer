package routerpkg

import (
	"context"
	"net/http"
	"sync"
	"time"
)

// ServiceRegistry implements the Registry interface
type ServiceRegistry struct {
	services map[string]*Service
	storage  Storage
	logger   Logger
	mu       sync.RWMutex
	watchers []chan *RegistryEvent
}

// NewServiceRegistry creates a new service registry
func NewServiceRegistry(storage Storage, logger Logger) *ServiceRegistry {
	return &ServiceRegistry{
		services: make(map[string]*Service),
		storage:  storage,
		logger:   logger,
		watchers: make([]chan *RegistryEvent, 0),
	}
}

// Register registers a new service
func (sr *ServiceRegistry) Register(service *Service) error {
	if service == nil {
		return NewError(ErrCodeInvalidRequest, "service cannot be nil", nil)
	}

	if service.ID == "" {
		return NewError(ErrCodeInvalidRequest, "service ID is required", nil)
	}

	sr.mu.Lock()
	defer sr.mu.Unlock()

	// Check if service already exists
	if _, exists := sr.services[service.ID]; exists {
		return NewError(ErrCodeInvalidRequest, "service already exists", map[string]interface{}{
			"service_id": service.ID,
		})
	}

	// Set timestamps
	now := time.Now()
	service.CreatedAt = now
	service.UpdatedAt = now
	service.LastSeen = now

	// Add to registry
	sr.services[service.ID] = service

	// Store in persistent storage
	if sr.storage != nil {
		key := "service:" + service.ID
		if data, err := encodeService(service); err == nil {
			sr.storage.Set(key, data, 0)
		}
	}

	// Notify watchers
	sr.notifyWatchers(&RegistryEvent{
		Type:      EventTypeRegister,
		Service:   service,
		Timestamp: now,
	})

	sr.logger.Info("Service registered", "service_id", service.ID, "service_name", service.Name)
	return nil
}

// Unregister unregisters a service
func (sr *ServiceRegistry) Unregister(serviceID string) error {
	if serviceID == "" {
		return NewError(ErrCodeInvalidRequest, "service ID is required", nil)
	}

	sr.mu.Lock()
	defer sr.mu.Unlock()

	service, exists := sr.services[serviceID]
	if !exists {
		return NewError(ErrCodeServiceNotFound, "service not found", map[string]interface{}{
			"service_id": serviceID,
		})
	}

	// Remove from registry
	delete(sr.services, serviceID)

	// Remove from persistent storage
	if sr.storage != nil {
		key := "service:" + serviceID
		sr.storage.Delete(key)
	}

	// Notify watchers
	sr.notifyWatchers(&RegistryEvent{
		Type:      EventTypeUnregister,
		Service:   service,
		Timestamp: time.Now(),
	})

	sr.logger.Info("Service unregistered", "service_id", serviceID)
	return nil
}

// GetService retrieves a service by ID
func (sr *ServiceRegistry) GetService(serviceID string) (*Service, error) {
	if serviceID == "" {
		return nil, NewError(ErrCodeInvalidRequest, "service ID is required", nil)
	}

	sr.mu.RLock()
	defer sr.mu.RUnlock()

	service, exists := sr.services[serviceID]
	if !exists {
		return nil, NewError(ErrCodeServiceNotFound, "service not found", map[string]interface{}{
			"service_id": serviceID,
		})
	}

	return service, nil
}

// GetServices retrieves all services
func (sr *ServiceRegistry) GetServices() ([]*Service, error) {
	sr.mu.RLock()
	defer sr.mu.RUnlock()

	services := make([]*Service, 0, len(sr.services))
	for _, service := range sr.services {
		services = append(services, service)
	}

	return services, nil
}

// GetServicesByType retrieves services by type
func (sr *ServiceRegistry) GetServicesByType(serviceType ServiceType) ([]*Service, error) {
	sr.mu.RLock()
	defer sr.mu.RUnlock()

	services := make([]*Service, 0)
	for _, service := range sr.services {
		if service.Type == serviceType {
			services = append(services, service)
		}
	}

	return services, nil
}

// GetHealthyServices retrieves only healthy services
func (sr *ServiceRegistry) GetHealthyServices() ([]*Service, error) {
	sr.mu.RLock()
	defer sr.mu.RUnlock()

	services := make([]*Service, 0)
	for _, service := range sr.services {
		if service.Health != nil && service.Health.Status == HealthStateHealthy {
			services = append(services, service)
		}
	}

	return services, nil
}

// Watch watches for service changes
func (sr *ServiceRegistry) Watch(ctx context.Context) (<-chan *RegistryEvent, error) {
	sr.mu.Lock()
	defer sr.mu.Unlock()

	eventChan := make(chan *RegistryEvent, 100)
	sr.watchers = append(sr.watchers, eventChan)

	// Start cleanup goroutine
	go func() {
		<-ctx.Done()
		sr.removeWatcher(eventChan)
		close(eventChan)
	}()

	return eventChan, nil
}

// notifyWatchers notifies all watchers of registry events
func (sr *ServiceRegistry) notifyWatchers(event *RegistryEvent) {
	for _, watcher := range sr.watchers {
		select {
		case watcher <- event:
		default:
			// Watcher channel is full, skip
		}
	}
}

// removeWatcher removes a watcher from the list
func (sr *ServiceRegistry) removeWatcher(watcher chan *RegistryEvent) {
	sr.mu.Lock()
	defer sr.mu.Unlock()

	for i, w := range sr.watchers {
		if w == watcher {
			sr.watchers = append(sr.watchers[:i], sr.watchers[i+1:]...)
			break
		}
	}
}

// UpdateService updates a service
func (sr *ServiceRegistry) UpdateService(service *Service) error {
	if service == nil || service.ID == "" {
		return NewError(ErrCodeInvalidRequest, "service and ID are required", nil)
	}

	sr.mu.Lock()
	defer sr.mu.Unlock()

	existing, exists := sr.services[service.ID]
	if !exists {
		return NewError(ErrCodeServiceNotFound, "service not found", map[string]interface{}{
			"service_id": service.ID,
		})
	}

	// Update timestamps
	service.UpdatedAt = time.Now()
	service.LastSeen = time.Now()
	service.CreatedAt = existing.CreatedAt // Preserve creation time

	// Update in registry
	sr.services[service.ID] = service

	// Store in persistent storage
	if sr.storage != nil {
		key := "service:" + service.ID
		if data, err := encodeService(service); err == nil {
			sr.storage.Set(key, data, 0)
		}
	}

	// Notify watchers
	sr.notifyWatchers(&RegistryEvent{
		Type:      EventTypeUpdate,
		Service:   service,
		Timestamp: time.Now(),
	})

	sr.logger.Info("Service updated", "service_id", service.ID)
	return nil
}

// UpdateHealthStatus updates a service's health status
func (sr *ServiceRegistry) UpdateHealthStatus(serviceID string, health *HealthStatus) error {
	if serviceID == "" || health == nil {
		return NewError(ErrCodeInvalidRequest, "service ID and health status are required", nil)
	}

	sr.mu.Lock()
	defer sr.mu.Unlock()

	service, exists := sr.services[serviceID]
	if !exists {
		return NewError(ErrCodeServiceNotFound, "service not found", map[string]interface{}{
			"service_id": serviceID,
		})
	}

	// Update health status
	service.Health = health
	service.UpdatedAt = time.Now()

	// Store in persistent storage
	if sr.storage != nil {
		key := "service:" + serviceID
		if data, err := encodeService(service); err == nil {
			sr.storage.Set(key, data, 0)
		}
	}

	// Notify watchers
	sr.notifyWatchers(&RegistryEvent{
		Type:      EventTypeHealth,
		Service:   service,
		Timestamp: time.Now(),
	})

	sr.logger.Info("Service health updated", "service_id", serviceID, "status", health.Status)
	return nil
}

// GetServiceCount returns the number of registered services
func (sr *ServiceRegistry) GetServiceCount() int {
	sr.mu.RLock()
	defer sr.mu.RUnlock()
	return len(sr.services)
}

// GetHealthyServiceCount returns the number of healthy services
func (sr *ServiceRegistry) GetHealthyServiceCount() int {
	sr.mu.RLock()
	defer sr.mu.RUnlock()

	count := 0
	for _, service := range sr.services {
		if service.Health != nil && service.Health.Status == HealthStateHealthy {
			count++
		}
	}
	return count
}

// encodeService encodes a service to bytes for storage
func encodeService(service *Service) ([]byte, error) {
	// This is a placeholder - in real implementation, use JSON or protobuf
	return []byte(service.ID), nil
}

// decodeService decodes a service from bytes
func decodeService(data []byte) (*Service, error) {
	// This is a placeholder - in real implementation, use JSON or protobuf
	return &Service{ID: string(data)}, nil
}
