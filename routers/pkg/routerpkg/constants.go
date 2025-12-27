package routerpkg

import (
	"time"
)

// Constants for the router package
const (
	// Default server configuration
	DefaultHost         = "0.0.0.0"
	DefaultPort         = 80
	DefaultHTTPSPort    = 443
	DefaultReadTimeout  = 30 * time.Second
	DefaultWriteTimeout = 30 * time.Second
	DefaultIdleTimeout  = 60 * time.Second

	// Default health check configuration
	DefaultHealthCheckPath     = "/health"
	DefaultHealthCheckInterval = 30 * time.Second
	DefaultHealthCheckTimeout  = 5 * time.Second

	// Default load balancer configuration
	DefaultLoadBalancerAlgorithm = "round_robin"
	DefaultServiceWeight         = 1

	// Default rate limiting configuration
	DefaultRateLimitWindow = 1 * time.Minute
	DefaultRateLimitLimit  = 100

	// Default SSL configuration
	DefaultSSLCertFile = "/etc/ssl/certs/router.crt"
	DefaultSSLKeyFile  = "/etc/ssl/private/router.key"

	// Default storage configuration
	DefaultStorageType = "memory"

	// Default service discovery configuration
	DefaultDiscoveryType     = "static"
	DefaultDiscoveryInterval = 30 * time.Second

	// Default registry configuration
	DefaultRegistryType = "memory"

	// Default monitoring configuration
	DefaultMetricsEndpoint = "/metrics"

	// Default logging configuration
	DefaultLogLevel  = "info"
	DefaultLogFormat = "json"

	// HTTP methods
	HTTPMethodGet     = "GET"
	HTTPMethodPost    = "POST"
	HTTPMethodPut     = "PUT"
	HTTPMethodDelete  = "DELETE"
	HTTPMethodPatch   = "PATCH"
	HTTPMethodHead    = "HEAD"
	HTTPMethodOptions = "OPTIONS"

	// HTTP status codes
	HTTPStatusOK                  = 200
	HTTPStatusCreated             = 201
	HTTPStatusAccepted            = 202
	HTTPStatusNoContent           = 204
	HTTPStatusBadRequest          = 400
	HTTPStatusUnauthorized        = 401
	HTTPStatusForbidden           = 403
	HTTPStatusNotFound            = 404
	HTTPStatusMethodNotAllowed    = 405
	HTTPStatusRequestTimeout      = 408
	HTTPStatusConflict            = 409
	HTTPStatusTooManyRequests     = 429
	HTTPStatusInternalServerError = 500
	HTTPStatusBadGateway          = 502
	HTTPStatusServiceUnavailable  = 503
	HTTPStatusGatewayTimeout      = 504

	// Load balancing algorithms
	AlgorithmRoundRobin         = "round_robin"
	AlgorithmWeightedRoundRobin = "weighted_round_robin"
	AlgorithmLeastConnections   = "least_connections"
	AlgorithmIPHash             = "ip_hash"
	AlgorithmRandom             = "random"

	// Rate limiting algorithms
	RateLimitTokenBucket   = "token_bucket"
	RateLimitFixedWindow   = "fixed_window"
	RateLimitSlidingWindow = "sliding_window"
	RateLimitLeakyBucket   = "leaky_bucket"

	// Storage types
	StorageTypeMemory = "memory"
	StorageTypeRedis  = "redis"
	StorageTypeEtcd   = "etcd"

	// Service discovery types
	DiscoveryTypeStatic = "static"
	DiscoveryTypeDNS    = "dns"
	DiscoveryTypeConsul = "consul"

	// Authentication types
	AuthTypeNone  = "none"
	AuthTypeJWT   = "jwt"
	AuthTypeOAuth = "oauth"
	AuthTypeBasic = "basic"

	// Firewall actions
	FirewallActionAllow = "allow"
	FirewallActionDeny  = "deny"
	FirewallActionBlock = "block"

	// Protocols
	ProtocolHTTP  = "http"
	ProtocolHTTPS = "https"
	ProtocolTCP   = "tcp"
	ProtocolUDP   = "udp"
	ProtocolGRPC  = "grpc"
	ProtocolWS    = "websocket"

	// Context keys
	ContextKeyRequestID = "request_id"
	ContextKeyTraceID   = "trace_id"
	ContextKeySpanID    = "span_id"
	ContextKeyUserID    = "user_id"
	ContextKeyServiceID = "service_id"
	ContextKeyStartTime = "start_time"
	ContextKeyMetadata  = "metadata"

	// Headers
	HeaderXRequestID          = "X-Request-ID"
	HeaderXTraceID            = "X-Trace-ID"
	HeaderXSpanID             = "X-Span-ID"
	HeaderXForwardedFor       = "X-Forwarded-For"
	HeaderXForwardedProto     = "X-Forwarded-Proto"
	HeaderXForwardedHost      = "X-Forwarded-Host"
	HeaderXRealIP             = "X-Real-IP"
	HeaderXContentType        = "X-Content-Type"
	HeaderXContentLength      = "X-Content-Length"
	HeaderXUserAgent          = "X-User-Agent"
	HeaderXReferer            = "X-Referer"
	HeaderXOrigin             = "X-Origin"
	HeaderXAuthorization      = "X-Authorization"
	HeaderXAPIKey             = "X-API-Key"
	HeaderXRateLimitLimit     = "X-Rate-Limit-Limit"
	HeaderXRateLimitRemaining = "X-Rate-Limit-Remaining"
	HeaderXRateLimitReset     = "X-Rate-Limit-Reset"

	// CORS headers
	HeaderAccessControlAllowOrigin      = "Access-Control-Allow-Origin"
	HeaderAccessControlAllowMethods     = "Access-Control-Allow-Methods"
	HeaderAccessControlAllowHeaders     = "Access-Control-Allow-Headers"
	HeaderAccessControlExposeHeaders    = "Access-Control-Expose-Headers"
	HeaderAccessControlAllowCredentials = "Access-Control-Allow-Credentials"
	HeaderAccessControlMaxAge           = "Access-Control-Max-Age"

	// Security headers
	HeaderXFrameOptions           = "X-Frame-Options"
	HeaderXContentTypeOptions     = "X-Content-Type-Options"
	HeaderXSSProtection           = "X-XSS-Protection"
	HeaderStrictTransportSecurity = "Strict-Transport-Security"
	HeaderContentSecurityPolicy   = "Content-Security-Policy"
	HeaderReferrerPolicy          = "Referrer-Policy"

	// Environment variables
	EnvRouterHost        = "ROUTER_HOST"
	EnvRouterPort        = "ROUTER_PORT"
	EnvRouterConfig      = "ROUTER_CONFIG"
	EnvRouterLogLevel    = "ROUTER_LOG_LEVEL"
	EnvRouterMode        = "ROUTER_MODE"
	EnvRouterTLSCertFile = "ROUTER_TLS_CERT_FILE"
	EnvRouterTLSKeyFile  = "ROUTER_TLS_KEY_FILE"
	EnvRouterTLSEnabled  = "ROUTER_TLS_ENABLED"

	// Configuration file names
	ConfigFileName     = "router.yaml"
	ConfigDevFileName  = "router.dev.yaml"
	ConfigProdFileName = "router.prod.yaml"
	ConfigTestFileName = "router.test.yaml"

	// Time formats
	TimeFormatRFC3339  = "2006-01-02T15:04:05Z07:00"
	TimeFormatRFC1123  = "Mon, 02 Jan 2006 15:04:05 MST"
	TimeFormatANSIC    = "Mon Jan 2 15:04:05 2006"
	TimeFormatUnixDate = "2006-01-02"
	TimeFormatUnixTime = "15:04:05"

	// Maximum values
	MaxHeaderSize      = 1 << 20 // 1MB
	MaxRequestBodySize = 1 << 30 // 1GB
	MaxURILength       = 1 << 16 // 64KB
	MaxConnections     = 10000
	MaxServices        = 1000
	MaxRules           = 1000
	MaxCertificates    = 100

	// Minimum values
	MinPort      = 1
	MaxPort      = 65535
	MinTimeout   = 1 * time.Millisecond
	MaxTimeout   = 1 * time.Hour
	MinWeight    = 1
	MaxWeight    = 100
	MinRateLimit = 1
	MaxRateLimit = 10000

	// Retry configuration
	DefaultMaxRetries   = 3
	DefaultRetryDelay   = 1 * time.Second
	DefaultRetryBackoff = 2.0
	DefaultRetryTimeout = 30 * time.Second

	// Circuit breaker configuration
	DefaultCircuitBreakerThreshold = 5
	DefaultCircuitBreakerTimeout   = 60 * time.Second
	DefaultCircuitBreakerHalfOpen  = 3

	// Cache configuration
	DefaultCacheTTL     = 5 * time.Minute
	DefaultCacheSize    = 1000
	DefaultCacheCleanup = 10 * time.Minute

	// Metrics configuration
	DefaultMetricsInterval  = 10 * time.Second
	DefaultMetricsRetention = 24 * time.Hour

	// Tracing configuration
	DefaultTracingSampleRate = 0.1
	DefaultTracingTimeout    = 5 * time.Second

	// Logging configuration
	DefaultLogBufferSize    = 1000
	DefaultLogFlushInterval = 5 * time.Second
	DefaultLogMaxSize       = 100 * 1024 * 1024 // 100MB
	DefaultLogMaxBackups    = 3
	DefaultLogMaxAge        = 30 * 24 * time.Hour // 30 days

	// Plugin configuration
	DefaultPluginTimeout = 30 * time.Second
	DefaultPluginRetries = 2

	// Cluster configuration
	DefaultClusterHeartbeat       = 5 * time.Second
	DefaultClusterElectionTimeout = 30 * time.Second
	DefaultClusterFailureTimeout  = 10 * time.Second

	// API configuration
	DefaultAPIVersion = "v1"
	DefaultAPIPrefix  = "/api"
	DefaultAPITimeout = 30 * time.Second

	// WebSocket configuration
	DefaultWebSocketReadBuffer  = 1024
	DefaultWebSocketWriteBuffer = 1024
	DefaultWebSocketPongTimeout = 60 * time.Second
	DefaultWebSocketPingTimeout = 30 * time.Second

	// TCP configuration
	DefaultTCPReadBufferSize  = 4096
	DefaultTCPWriteBufferSize = 4096
	DefaultTCPKeepAlive       = 30 * time.Second
	DefaultTCPTimeout         = 30 * time.Second

	// UDP configuration
	DefaultUDPReadBufferSize  = 4096
	DefaultUDPWriteBufferSize = 4096
	DefaultUDPTimeout         = 30 * time.Second

	// GRPC configuration
	DefaultGRPCReadBufferSize  = 4096
	DefaultGRPCWriteBufferSize = 4096
	DefaultGRPCTimeout         = 30 * time.Second
	DefaultGRPCMaxMessageSize  = 4 * 1024 * 1024 // 4MB
)

// Service types
var (
	ServiceTypes = map[ServiceType]bool{
		ServiceTypeHTTP:  true,
		ServiceTypeHTTPS: true,
		ServiceTypeTCP:   true,
		ServiceTypeUDP:   true,
		ServiceTypeGRPC:  true,
		ServiceTypeWS:    true,
	}
)

// Health states
var (
	HealthStates = map[HealthState]bool{
		HealthStateHealthy:   true,
		HealthStateUnhealthy: true,
		HealthStateUnknown:   true,
	}
)

// Event types
var (
	EventTypes = map[EventType]bool{
		EventTypeRegister:   true,
		EventTypeUnregister: true,
		EventTypeUpdate:     true,
		EventTypeHealth:     true,
	}
)

// Error codes
var (
	ErrorCodes = map[string]bool{
		ErrCodeServiceNotFound:     true,
		ErrCodeServiceUnavailable:  true,
		ErrCodeRateLimitExceeded:   true,
		ErrCodeInvalidRequest:      true,
		ErrCodeUnauthorized:        true,
		ErrCodeForbidden:           true,
		ErrCodeInternalServerError: true,
		ErrCodeBadGateway:          true,
		ErrCodeGatewayTimeout:      true,
	}
)

// Load balancing algorithms
var (
	LoadBalancingAlgorithms = map[string]bool{
		AlgorithmRoundRobin:         true,
		AlgorithmWeightedRoundRobin: true,
		AlgorithmLeastConnections:   true,
		AlgorithmIPHash:             true,
		AlgorithmRandom:             true,
	}
)

// Rate limiting algorithms
var (
	RateLimitingAlgorithms = map[string]bool{
		RateLimitTokenBucket:   true,
		RateLimitFixedWindow:   true,
		RateLimitSlidingWindow: true,
		RateLimitLeakyBucket:   true,
	}
)

// Storage types
var (
	StorageTypes = map[string]bool{
		StorageTypeMemory: true,
		StorageTypeRedis:  true,
		StorageTypeEtcd:   true,
	}
)

// Service discovery types
var (
	ServiceDiscoveryTypes = map[string]bool{
		DiscoveryTypeStatic: true,
		DiscoveryTypeDNS:    true,
		DiscoveryTypeConsul: true,
	}
)

// Authentication types
var (
	AuthenticationTypes = map[string]bool{
		AuthTypeNone:  true,
		AuthTypeJWT:   true,
		AuthTypeOAuth: true,
		AuthTypeBasic: true,
	}
)

// Firewall actions
var (
	FirewallActions = map[string]bool{
		FirewallActionAllow: true,
		FirewallActionDeny:  true,
		FirewallActionBlock: true,
	}
)

// Protocols
var (
	Protocols = map[string]bool{
		ProtocolHTTP:  true,
		ProtocolHTTPS: true,
		ProtocolTCP:   true,
		ProtocolUDP:   true,
		ProtocolGRPC:  true,
		ProtocolWS:    true,
	}
)

// IsValidServiceType checks if a service type is valid
func IsValidServiceType(serviceType ServiceType) bool {
	return ServiceTypes[serviceType]
}

// IsValidHealthState checks if a health state is valid
func IsValidHealthState(healthState HealthState) bool {
	return HealthStates[healthState]
}

// IsValidEventType checks if an event type is valid
func IsValidEventType(eventType EventType) bool {
	return EventTypes[eventType]
}

// IsValidErrorCode checks if an error code is valid
func IsValidErrorCode(errorCode string) bool {
	return ErrorCodes[errorCode]
}

// IsValidLoadBalancingAlgorithm checks if a load balancing algorithm is valid
func IsValidLoadBalancingAlgorithm(algorithm string) bool {
	return LoadBalancingAlgorithms[algorithm]
}

// IsValidRateLimitingAlgorithm checks if a rate limiting algorithm is valid
func IsValidRateLimitingAlgorithm(algorithm string) bool {
	return RateLimitingAlgorithms[algorithm]
}

// IsValidStorageType checks if a storage type is valid
func IsValidStorageType(storageType string) bool {
	return StorageTypes[storageType]
}

// IsValidServiceDiscoveryType checks if a service discovery type is valid
func IsValidServiceDiscoveryType(discoveryType string) bool {
	return ServiceDiscoveryTypes[discoveryType]
}

// IsValidAuthenticationType checks if an authentication type is valid
func IsValidAuthenticationType(authType string) bool {
	return AuthenticationTypes[authType]
}

// IsValidFirewallAction checks if a firewall action is valid
func IsValidFirewallAction(action string) bool {
	return FirewallActions[action]
}

// IsValidProtocol checks if a protocol is valid
func IsValidProtocol(protocol string) bool {
	return Protocols[protocol]
}

// IsValidPort checks if a port is valid
func IsValidPort(port int) bool {
	return port >= MinPort && port <= MaxPort
}

// IsValidTimeout checks if a timeout is valid
func IsValidTimeout(timeout time.Duration) bool {
	return timeout >= MinTimeout && timeout <= MaxTimeout
}

// IsValidWeight checks if a weight is valid
func IsValidWeight(weight int) bool {
	return weight >= MinWeight && weight <= MaxWeight
}

// IsValidRateLimit checks if a rate limit is valid
func IsValidRateLimit(limit int) bool {
	return limit >= MinRateLimit && limit <= MaxRateLimit
}
