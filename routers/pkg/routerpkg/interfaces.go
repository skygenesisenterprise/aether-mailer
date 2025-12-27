package routerpkg

import (
	"context"
	"net/http"
	"time"
)

// Router represents the main router interface
type Router interface {
	// Start starts the router
	Start() error
	// Stop stops the router
	Stop(ctx context.Context) error
	// GetConfig returns the router configuration
	GetConfig() *Config
	// GetRegistry returns the service registry
	GetRegistry() Registry
	// GetBalancer returns the load balancer
	GetBalancer() Balancer
	// GetHealthChecker returns the health checker
	GetHealthChecker() HealthChecker
}

// Registry represents the service registry interface
type Registry interface {
	// Register registers a new service
	Register(service *Service) error
	// Unregister unregisters a service
	Unregister(serviceID string) error
	// GetService retrieves a service by ID
	GetService(serviceID string) (*Service, error)
	// GetServices retrieves all services
	GetServices() ([]*Service, error)
	// GetServicesByType retrieves services by type
	GetServicesByType(serviceType ServiceType) ([]*Service, error)
	// GetHealthyServices retrieves only healthy services
	GetHealthyServices() ([]*Service, error)
	// Watch watches for service changes
	Watch(ctx context.Context) (<-chan *RegistryEvent, error)
}

// Balancer represents the load balancer interface
type Balancer interface {
	// SelectService selects a service for the given request
	SelectService(request *http.Request, services []*Service) (*Service, error)
	// SetAlgorithm sets the load balancing algorithm
	SetAlgorithm(algorithm BalancingAlgorithm) error
	// GetAlgorithm returns the current algorithm
	GetAlgorithm() BalancingAlgorithm
	// GetMetrics returns load balancer metrics
	GetMetrics() *BalancerMetrics
}

// HealthChecker represents the health checker interface
type HealthChecker interface {
	// CheckHealth checks the health of a service
	CheckHealth(service *Service) (*HealthStatus, error)
	// StartHealthChecks starts continuous health checking
	StartHealthChecks(ctx context.Context) error
	// StopHealthChecks stops health checking
	StopHealthChecks() error
	// GetHealthStatus returns the health status of a service
	GetHealthStatus(serviceID string) (*HealthStatus, error)
	// GetAllHealthStatus returns health status of all services
	GetAllHealthStatus() (map[string]*HealthStatus, error)
}

// RateLimiter represents the rate limiter interface
type RateLimiter interface {
	// Allow checks if a request is allowed
	Allow(key string, limit int, window time.Duration) bool
	// AllowN checks if n requests are allowed
	AllowN(key string, n int, limit int, window time.Duration) bool
	// Reserve reserves a request slot
	Reserve(key string, limit int, window time.Duration) *Reservation
	// Wait waits for a request slot
	Wait(key string, limit int, window time.Duration) error
	// GetMetrics returns rate limiter metrics
	GetMetrics() *RateLimiterMetrics
}

// SSLManager represents the SSL manager interface
type SSLManager interface {
	// GetCertificate returns a certificate for the given host
	GetCertificate(host string) (*Certificate, error)
	// LoadCertificate loads a certificate from file
	LoadCertificate(certFile, keyFile string) error
	// GenerateCertificate generates a self-signed certificate
	GenerateCertificate(host string) (*Certificate, error)
	// RenewCertificate renews a certificate
	RenewCertificate(host string) error
	// ListCertificates returns all loaded certificates
	ListCertificates() ([]*Certificate, error)
}

// Proxy represents the proxy interface
type Proxy interface {
	// ProxyRequest proxies an HTTP request
	ProxyRequest(request *http.Request, target *Service) (*http.Response, error)
	// ProxyWebSocket proxies a WebSocket connection
	ProxyWebSocket(request *http.Request, target *Service) error
	// SetHeaders sets proxy headers
	SetHeaders(request *http.Request, target *Service) error
	// RewriteURL rewrites the request URL
	RewriteURL(request *http.Request, target *Service) error
}

// BalancingAlgorithm represents a load balancing algorithm
type BalancingAlgorithm interface {
	// Name returns the algorithm name
	Name() string
	// Select selects a service from the list
	Select(services []*Service, request *http.Request) (*Service, error)
	// Reset resets the algorithm state
	Reset() error
}

// Middleware represents a middleware interface
type Middleware interface {
	// Name returns the middleware name
	Name() string
	// Process processes the request
	Process(request *http.Request, next http.Handler) http.Handler
}

// Storage represents a storage interface
type Storage interface {
	// Get retrieves a value
	Get(key string) ([]byte, error)
	// Set stores a value
	Set(key string, value []byte, ttl time.Duration) error
	// Delete removes a value
	Delete(key string) error
	// Exists checks if a key exists
	Exists(key string) (bool, error)
	// List returns all keys
	List() ([]string, error)
	// Clear clears all data
	Clear() error
}

// Logger represents a logger interface
type Logger interface {
	// Debug logs a debug message
	Debug(msg string, fields ...interface{})
	// Info logs an info message
	Info(msg string, fields ...interface{})
	// Warn logs a warning message
	Warn(msg string, fields ...interface{})
	// Error logs an error message
	Error(msg string, fields ...interface{})
	// Fatal logs a fatal message
	Fatal(msg string, fields ...interface{})
	// WithFields returns a logger with fields
	WithFields(fields map[string]interface{}) Logger
	// WithField returns a logger with a field
	WithField(key string, value interface{}) Logger
}

// Metrics represents a metrics collector interface
type Metrics interface {
	// Counter increments a counter
	Counter(name string, tags map[string]string) Counter
	// Gauge sets a gauge value
	Gauge(name string, tags map[string]string) Gauge
	// Histogram records a histogram value
	Histogram(name string, tags map[string]string) Histogram
	// Timer records a timer value
	Timer(name string, tags map[string]string) Timer
	// Flush flushes metrics
	Flush() error
}

// Counter represents a counter metric
type Counter interface {
	Inc()
	Add(value float64)
	Get() float64
}

// Gauge represents a gauge metric
type Gauge interface {
	Set(value float64)
	Inc()
	Dec()
	Get() float64
}

// Histogram represents a histogram metric
type Histogram interface {
	Observe(value float64)
	WithLabelValues(values ...string) Histogram
}

// Timer represents a timer metric
type Timer interface {
	Time(func())
	Record(duration time.Duration)
	Stop() time.Duration
}

// Config represents the router configuration
type Config struct {
	// Server configuration
	Server ServerConfig `yaml:"server" json:"server"`
	// Services configuration
	Services ServicesConfig `yaml:"services" json:"services"`
	// Load balancer configuration
	LoadBalancer LoadBalancerConfig `yaml:"load_balancer" json:"load_balancer"`
	// Security configuration
	Security SecurityConfig `yaml:"security" json:"security"`
	// SSL configuration
	SSL SSLConfig `yaml:"ssl" json:"ssl"`
	// Monitoring configuration
	Monitoring MonitoringConfig `yaml:"monitoring" json:"monitoring"`
	// Logging configuration
	Logging LoggingConfig `yaml:"logging" json:"logging"`
	// Storage configuration
	Storage StorageConfig `yaml:"storage" json:"storage"`
}

// ServerConfig represents server configuration
type ServerConfig struct {
	Host         string        `yaml:"host" json:"host"`
	Port         int           `yaml:"port" json:"port"`
	ReadTimeout  time.Duration `yaml:"read_timeout" json:"read_timeout"`
	WriteTimeout time.Duration `yaml:"write_timeout" json:"write_timeout"`
	IdleTimeout  time.Duration `yaml:"idle_timeout" json:"idle_timeout"`
}

// ServicesConfig represents services configuration
type ServicesConfig struct {
	Discovery DiscoveryConfig `yaml:"discovery" json:"discovery"`
	Health    HealthConfig    `yaml:"health" json:"health"`
	Registry  RegistryConfig  `yaml:"registry" json:"registry"`
}

// LoadBalancerConfig represents load balancer configuration
type LoadBalancerConfig struct {
	Algorithm string                 `yaml:"algorithm" json:"algorithm"`
	Sticky    bool                   `yaml:"sticky" json:"sticky"`
	Weights   map[string]int         `yaml:"weights" json:"weights"`
	Options   map[string]interface{} `yaml:"options" json:"options"`
}

// SecurityConfig represents security configuration
type SecurityConfig struct {
	RateLimit RateLimitConfig `yaml:"rate_limit" json:"rate_limit"`
	Firewall  FirewallConfig  `yaml:"firewall" json:"firewall"`
	Auth      AuthConfig      `yaml:"auth" json:"auth"`
	CORS      CORSConfig      `yaml:"cors" json:"cors"`
}

// SSLConfig represents SSL configuration
type SSLConfig struct {
	Enabled  bool     `yaml:"enabled" json:"enabled"`
	CertFile string   `yaml:"cert_file" json:"cert_file"`
	KeyFile  string   `yaml:"key_file" json:"key_file"`
	AutoCert bool     `yaml:"auto_cert" json:"auto_cert"`
	Hosts    []string `yaml:"hosts" json:"hosts"`
}

// MonitoringConfig represents monitoring configuration
type MonitoringConfig struct {
	Enabled  bool   `yaml:"enabled" json:"enabled"`
	Metrics  bool   `yaml:"metrics" json:"metrics"`
	Tracing  bool   `yaml:"tracing" json:"tracing"`
	Endpoint string `yaml:"endpoint" json:"endpoint"`
}

// LoggingConfig represents logging configuration
type LoggingConfig struct {
	Level         string `yaml:"level" json:"level"`
	Format        string `yaml:"format" json:"format"`
	Output        string `yaml:"output" json:"output"`
	CorrelationID bool   `yaml:"correlation_id" json:"correlation_id"`
}

// StorageConfig represents storage configuration
type StorageConfig struct {
	Type    string                 `yaml:"type" json:"type"`
	Options map[string]interface{} `yaml:"options" json:"options"`
}

// DiscoveryConfig represents service discovery configuration
type DiscoveryConfig struct {
	Type     string                 `yaml:"type" json:"type"`
	Interval time.Duration          `yaml:"interval" json:"interval"`
	Options  map[string]interface{} `yaml:"options" json:"options"`
}

// HealthConfig represents health check configuration
type HealthConfig struct {
	Enabled  bool          `yaml:"enabled" json:"enabled"`
	Interval time.Duration `yaml:"interval" json:"interval"`
	Timeout  time.Duration `yaml:"timeout" json:"timeout"`
	Path     string        `yaml:"path" json:"path"`
}

// RegistryConfig represents registry configuration
type RegistryConfig struct {
	Type    string                 `yaml:"type" json:"type"`
	Options map[string]interface{} `yaml:"options" json:"options"`
}

// RateLimitConfig represents rate limit configuration
type RateLimitConfig struct {
	Enabled bool            `yaml:"enabled" json:"enabled"`
	Rules   []RateLimitRule `yaml:"rules" json:"rules"`
	Storage string          `yaml:"storage" json:"storage"`
}

// FirewallConfig represents firewall configuration
type FirewallConfig struct {
	Enabled bool           `yaml:"enabled" json:"enabled"`
	Rules   []FirewallRule `yaml:"rules" json:"rules"`
}

// AuthConfig represents authentication configuration
type AuthConfig struct {
	Enabled bool                   `yaml:"enabled" json:"enabled"`
	Type    string                 `yaml:"type" json:"type"`
	Options map[string]interface{} `yaml:"options" json:"options"`
}

// CORSConfig represents CORS configuration
type CORSConfig struct {
	Enabled          bool     `yaml:"enabled" json:"enabled"`
	AllowedOrigins   []string `yaml:"allowed_origins" json:"allowed_origins"`
	AllowedMethods   []string `yaml:"allowed_methods" json:"allowed_methods"`
	AllowedHeaders   []string `yaml:"allowed_headers" json:"allowed_headers"`
	ExposedHeaders   []string `yaml:"exposed_headers" json:"exposed_headers"`
	AllowCredentials bool     `yaml:"allow_credentials" json:"allow_credentials"`
	MaxAge           int      `yaml:"max_age" json:"max_age"`
}

// RateLimitRule represents a rate limit rule
type RateLimitRule struct {
	Path   string        `yaml:"path" json:"path"`
	Method string        `yaml:"method" json:"method"`
	Limit  int           `yaml:"limit" json:"limit"`
	Window time.Duration `yaml:"window" json:"window"`
}

// FirewallRule represents a firewall rule
type FirewallRule struct {
	Action   string `yaml:"action" json:"action"`
	Source   string `yaml:"source" json:"source"`
	Protocol string `yaml:"protocol" json:"protocol"`
	Ports    []int  `yaml:"ports" json:"ports"`
}

// Service represents a service definition
type Service struct {
	ID        string            `yaml:"id" json:"id"`
	Name      string            `yaml:"name" json:"name"`
	Type      ServiceType       `yaml:"type" json:"type"`
	Address   string            `yaml:"address" json:"address"`
	Port      int               `yaml:"port" json:"port"`
	Protocol  string            `yaml:"protocol" json:"protocol"`
	Weight    int               `yaml:"weight" json:"weight"`
	Health    *HealthStatus     `yaml:"health" json:"health"`
	Metadata  map[string]string `yaml:"metadata" json:"metadata"`
	Tags      []string          `yaml:"tags" json:"tags"`
	CreatedAt time.Time         `yaml:"created_at" json:"created_at"`
	UpdatedAt time.Time         `yaml:"updated_at" json:"updated_at"`
	LastSeen  time.Time         `yaml:"last_seen" json:"last_seen"`
}

// ServiceType represents a service type
type ServiceType string

const (
	ServiceTypeHTTP  ServiceType = "http"
	ServiceTypeHTTPS ServiceType = "https"
	ServiceTypeTCP   ServiceType = "tcp"
	ServiceTypeUDP   ServiceType = "udp"
	ServiceTypeGRPC  ServiceType = "grpc"
	ServiceTypeWS    ServiceType = "websocket"
)

// HealthStatus represents health status
type HealthStatus struct {
	Status    HealthState            `yaml:"status" json:"status"`
	Message   string                 `yaml:"message" json:"message"`
	CheckedAt time.Time              `yaml:"checked_at" json:"checked_at"`
	Duration  time.Duration          `yaml:"duration" json:"duration"`
	Details   map[string]interface{} `yaml:"details" json:"details"`
}

// HealthState represents health state
type HealthState string

const (
	HealthStateHealthy   HealthState = "healthy"
	HealthStateUnhealthy HealthState = "unhealthy"
	HealthStateUnknown   HealthState = "unknown"
)

// Certificate represents an SSL certificate
type Certificate struct {
	Host      string    `yaml:"host" json:"host"`
	CertFile  string    `yaml:"cert_file" json:"cert_file"`
	KeyFile   string    `yaml:"key_file" json:"key_file"`
	ExpiresAt time.Time `yaml:"expires_at" json:"expires_at"`
	IsAuto    bool      `yaml:"is_auto" json:"is_auto"`
	Issuer    string    `yaml:"issuer" json:"issuer"`
	Subject   string    `yaml:"subject" json:"subject"`
}

// RegistryEvent represents a registry event
type RegistryEvent struct {
	Type      EventType `yaml:"type" json:"type"`
	Service   *Service  `yaml:"service" json:"service"`
	Timestamp time.Time `yaml:"timestamp" json:"timestamp"`
}

// EventType represents an event type
type EventType string

const (
	EventTypeRegister   EventType = "register"
	EventTypeUnregister EventType = "unregister"
	EventTypeUpdate     EventType = "update"
	EventTypeHealth     EventType = "health"
)

// Reservation represents a rate limit reservation
type Reservation struct {
	OK        bool
	Delay     time.Duration
	ResetTime time.Time
}

// BalancerMetrics represents load balancer metrics
type BalancerMetrics struct {
	TotalRequests  int64                    `yaml:"total_requests" json:"total_requests"`
	RequestsPerAlg map[string]int64         `yaml:"requests_per_alg" json:"requests_per_alg"`
	RequestsPerSvc map[string]int64         `yaml:"requests_per_svc" json:"requests_per_svc"`
	ResponseTime   map[string]time.Duration `yaml:"response_time" json:"response_time"`
	ErrorRate      map[string]float64       `yaml:"error_rate" json:"error_rate"`
	LastUpdated    time.Time                `yaml:"last_updated" json:"last_updated"`
}

// RateLimiterMetrics represents rate limiter metrics
type RateLimiterMetrics struct {
	TotalRequests   int64     `yaml:"total_requests" json:"total_requests"`
	AllowedRequests int64     `yaml:"allowed_requests" json:"allowed_requests"`
	DeniedRequests  int64     `yaml:"denied_requests" json:"denied_requests"`
	ActiveKeys      int       `yaml:"active_keys" json:"active_keys"`
	LastReset       time.Time `yaml:"last_reset" json:"last_reset"`
	LastUpdated     time.Time `yaml:"last_updated" json:"last_updated"`
}

// RequestContext represents request context
type RequestContext struct {
	RequestID string
	StartTime time.Time
	Headers   map[string]string
	Metadata  map[string]interface{}
	TraceID   string
	SpanID    string
}

// ResponseContext represents response context
type ResponseContext struct {
	StatusCode int
	Headers    map[string]string
	Duration   time.Duration
	Size       int64
	Error      error
}

// ProxyContext represents proxy context
type ProxyContext struct {
	Request        *RequestContext
	Response       *ResponseContext
	Target         *Service
	UpstreamTime   time.Duration
	DownstreamTime time.Duration
}

// Error represents a router error
type Error struct {
	Code    string                 `yaml:"code" json:"code"`
	Message string                 `yaml:"message" json:"message"`
	Details map[string]interface{} `yaml:"details" json:"details"`
}

// Error codes
const (
	ErrCodeServiceNotFound     = "SERVICE_NOT_FOUND"
	ErrCodeServiceUnavailable  = "SERVICE_UNAVAILABLE"
	ErrCodeRateLimitExceeded   = "RATE_LIMIT_EXCEEDED"
	ErrCodeInvalidRequest      = "INVALID_REQUEST"
	ErrCodeUnauthorized        = "UNAUTHORIZED"
	ErrCodeForbidden           = "FORBIDDEN"
	ErrCodeInternalServerError = "INTERNAL_SERVER_ERROR"
	ErrCodeBadGateway          = "BAD_GATEWAY"
	ErrCodeGatewayTimeout      = "GATEWAY_TIMEOUT"
)

// NewError creates a new router error
func NewError(code, message string, details map[string]interface{}) *Error {
	return &Error{
		Code:    code,
		Message: message,
		Details: details,
	}
}

// Error implements the error interface
func (e *Error) Error() string {
	return e.Message
}

// WithDetails adds details to the error
func (e *Error) WithDetails(details map[string]interface{}) *Error {
	if e.Details == nil {
		e.Details = make(map[string]interface{})
	}
	for k, v := range details {
		e.Details[k] = v
	}
	return e
}
