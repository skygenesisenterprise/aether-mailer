package security

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"sync"
	"time"

	"github.com/skygenesisenterprise/aether-mailer/routers/pkg/routerpkg"
)

// SecurityMiddleware implements security middleware for the router
type SecurityMiddleware struct {
	config     *routerpkg.SecurityConfig
	rateLimiter routerpkg.RateLimiter
	firewall   Firewall
	auth       Authentication
	cors       CORS
	logger     routerpkg.Logger
	mu         sync.RWMutex
}

// NewSecurityMiddleware creates a new security middleware
func NewSecurityMiddleware(config *routerpkg.SecurityConfig, rateLimiter routerpkg.RateLimiter, logger routerpkg.Logger) *SecurityMiddleware {
	return &SecurityMiddleware{
		config:     config,
		rateLimiter: rateLimiter,
		firewall:   NewFirewall(config.Firewall, logger),
		auth:       NewAuthentication(config.Auth, logger),
		cors:       NewCORS(config.CORS, logger),
		logger:     logger,
	}
}

// Handler processes HTTP requests through security middleware
func (sm *SecurityMiddleware) Handler(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
	// Apply security checks in order: Firewall → Rate Limiting → Authentication → CORS → Request handler
		
		// 1. Firewall check
		if err := sm.firewall.CheckRequest(r); err != nil {
			sm.logger.Error("Firewall check failed", "error", err)
			sm.writeErrorResponse(w, routerpkg.NewError(routerpkg.ErrCodeForbidden, "Request blocked by firewall", nil), http.StatusForbidden)
			return
		}
		
		// 2. Rate limiting check
		if sm.config.RateLimit.Enabled {
			if err := sm.rateLimiter.Allow(r.RemoteAddr, 100, time.Minute); !err {
				sm.logger.Debug("Request allowed by rate limiter", "client_ip", r.RemoteAddr, "service_path", r.URL.Path)
			} else {
				sm.logger.Warn("Request rejected by rate limiter", "client_ip", r.RemoteAddr, "service_path", r.URL.Path)
				sm.writeRateLimitResponse(w, r)
				return
			}
		}
		
		// 3. Authentication check (if enabled)
		if sm.config.Auth.Enabled {
			if err := sm.auth.Authenticate(r); err != nil {
				sm.logger.Error("Authentication failed", "error", err)
				sm.writeErrorResponse(w, routerpkg.NewError(routerpkg.ErrCodeUnauthorized, "Authentication failed", nil), http.StatusUnauthorized)
				return
			}
			
			// Set user context if authenticated
			if userID := sm.auth.GetUserID(r); userID != "" {
				ctx := context.WithValue("user_id", userID)
				r = r.WithContext(ctx)
			}
		}
		
		// 4. CORS handling (if enabled)
		sm.cors.HandleCORS(w, r)
		
		// 5. Security headers
		sm.applySecurityHeaders(w)
		
		// 6. Request logging
		sm.logRequest(r, http.StatusOK, nil)
		
		// 7. Rate limiting headers (if applicable)
		if sm.config.RateLimit.Enabled {
			sm.applyRateLimitHeaders(w, r, 100, time.Minute, 0)
		}
		
		// Call next handler
		next.ServeHTTP(w, r)
	})
}

// Firewall handles firewall rules
type Firewall struct {
	rules []FirewallRule
	logger routerpkg.Logger
}

// NewFirewall creates a new firewall
func NewFirewall(config routerpkg.FirewallConfig, logger routerpkg.Logger) *Firewall {
	return &Firewall{
		rules:  config.Rules,
		logger: logger,
	}
}

// FirewallRule represents a firewall rule
type FirewallRule struct {
	Action   string                   `json:"action"`
	Source   string                   `json:"source"`
	Protocol string                   `json:"protocol"`
	Ports    []int                     `json:"ports"`
	Enabled  bool                     `json:"enabled"`
	Comment  string                   `json:"comment,omitempty"`
}

// CheckRequest checks if a request passes firewall rules
func (f *Firewall) CheckRequest(r *http.Request) error {
	clientIP := getClientIP(r)
	
	f.logger.Debug("Checking firewall rules", "client_ip", clientIP, "method", r.Method, "path", r.URL.Path)
	
	for _, rule := range f.rules {
		if !rule.Enabled {
			continue
		}
		
		// Check if rule applies to this request
		if f.ruleMatches(rule, clientIP, r) {
			f.logger.Warn("Request blocked by firewall rule", "client_ip", clientIP, "method", r.Method, "path", r.URL.Path, "rule_action", rule.Action, "rule_source", rule.Source)
			return fmt.Errorf("request blocked by firewall: action=%s, source=%s", rule.Action, rule.Source)
		}
	}
	
	f.logger.Debug("Request passed firewall checks", "client_ip", clientIP, "method", r.Method, "path", r.URL.Path)
	return nil
}

// ruleMatches checks if a firewall rule matches a request
func (f *Firewall) ruleMatches(rule FirewallRule, clientIP string, r *http.Request) bool {
	// Check source IP
	if rule.Source != "" && !f.ipMatches(rule.Source, clientIP) {
		return false
	}
	
	// Check protocol
	if rule.Protocol != "" && r.URL.Scheme != rule.Protocol {
		return false
	}
	
	// Check ports
	if len(rule.Ports) > 0 && !f.isPortAllowed(rule.Ports, r.URL.Port()) {
		return false
	}
	
	// Check action
	if rule.Action == "deny" {
		return true
	}
	
	return false
}

// ipMatches checks if an IP matches a pattern
func (f *Firewall) ipMatches(pattern, ip string) bool {
	// Simple wildcard matching for demonstration
	// In a real implementation, use CIDR matching
	return pattern == "*" || pattern == ip
}

// isPortAllowed checks if a port is allowed
func (f *Firewall) isPortAllowed(ports []int, port int) bool {
	for _, allowedPort := range ports {
		if allowedPort == port {
			return true
			}
	}
	return false
}

// Authentication handles authentication
type Authentication struct {
	config routerpkg.AuthConfig
	logger routerpkg.Logger
}

// NewAuthentication creates a new authentication handler
func NewAuthentication(config routerpkg.AuthConfig, logger routerpkg.Logger) *Authentication {
	return &Authentication{
		config: config,
		logger: logger,
	}
}

// Authenticate authenticates a request
func (a *Authentication) Authenticate(r *http.Request) error {
	// Get Authorization header
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" && a.config.Type == routerpkg.AuthTypeNone {
		return nil // No authentication required
	}
	
	switch a.config.Type {
	case routerpkg.AuthTypeJWT:
		return a.authenticateJWT(r, authHeader)
	case routerpkg.AuthTypeBasic:
		return a.authenticateBasic(r, authHeader)
	case routerpkg.AuthTypeOAuth:
		return a.authenticateOAuth(r, authHeader)
	}
	
	return fmt.Errorf("unsupported authentication type: %s", a.config.Type)
}

// authenticateJWT authenticates using JWT
func (a *Authentication) authenticateJWT(r *http.Request, authHeader string) error {
	// Extract Bearer token
	if !strings.HasPrefix(authHeader, "Bearer ") {
		return fmt.Errorf("invalid JWT token format")
	}
	
	token := strings.TrimPrefix(authHeader, "Bearer ")
	
	// Validate JWT token
	if err := a.validateJWTToken(token); err != nil {
		a.logger.Warn("JWT token validation failed", "error", err)
		return fmt.Errorf("invalid JWT token: %w", err)
	}
	
	// Set user context
	if claims, err := a.parseJWTClaims(token); err != nil {
		a.logger.Debug("Failed to parse JWT claims", "error", err)
		return fmt.Errorf("failed to parse JWT claims: %w", err)
	}
	
	a.logger.Debug("JWT authentication successful", "user_id", claims["user_id"])
	return nil
}

// authenticateBasic authenticates using Basic Auth
func (a *Authentication) authenticateBasic(r *http.Request, authHeader string) error {
	// Decode Basic Auth header
	_, credentials, err := a.decodeBasicAuth(authHeader)
	if err != nil {
		return fmt.Errorf("invalid Basic Auth header: %w", err)
	}
	
	// Validate against users (in a real implementation, this would check a database)
	if !a.validateCredentials(credentials.Username, credentials.Password) {
		a.logger.Warn("Basic authentication failed", "username", credentials.Username)
		return fmt.Errorf("invalid credentials")
	}
	
	a.logger.Debug("Basic authentication successful", "username", credentials.Username)
	return nil
}

// authenticateOAuth authenticates using OAuth
func (a *Authentication) authenticateOAuth(r *http.Request, authHeader string) error {
	// OAuth authentication would check with OAuth provider
	a.logger.Debug("OAuth authentication requested (not implemented)")
	return fmt.Errorf("OAuth authentication not implemented")
}

// validateJWTToken validates a JWT token
func (a *Authentication) validateJWTToken(token string) error {
	// This is a placeholder implementation
	// In a real implementation, validate JWT signature, expiration, issuer, etc.
	
	if len(token) < 10 {
		return fmt.Errorf("JWT token too short")
	}
	
	// For demo purposes, accept any token that starts with "jwt."
	if !strings.HasPrefix(token, "jwt.") {
		return fmt.Errorf("invalid JWT token format")
	}
	
	return nil
}

// parseJWTClaims parses claims from a JWT token
func (a *Authentication) parseJWTClaims(token string) (map[string]interface{}, error) {
	// This is a placeholder implementation
	// In a real implementation, this would decode and validate the JWT
	
	// For demo purposes, return a mock claim
	return map[string]interface{}{
		"user_id": "demo-user",
		"exp":    strconv.FormatInt(time.Now().Add(24*time.Hour).Unix()),
		"iat":    strconv.FormatInt(time.Now().Unix()),
		"iss":    a.config.Options["jwt_issuer"],
	}
}

// validateCredentials validates username and password
func (a *Authentication) validateCredentials(username, password string) bool {
	// This is a placeholder implementation
	// In a real implementation, this would check against a user database
	return username == "demo" && password == "demo"
}

// decodeBasicAuth decodes Basic Auth header
func (a *Authentication) decodeBasicAuth(authHeader string) (string, string, error) {
	// This is a placeholder implementation
	// In a real implementation, this would decode "username:password"
	return "", "", fmt.Errorf("Basic Auth not implemented")
}

// GetUserID returns the user ID from the request context
func (a *Authentication) GetUserID(r *http.Request) string {
	if userID, ok := r.Context().Value("user_id").(string); ok {
		return userID
	}
	return ""
}

// CORS handles Cross-Origin Resource Sharing
type CORS struct {
	config routerpkg.CORSConfig
	logger routerpkg.Logger
}

// NewCORS creates a new CORS handler
func NewCORS(config routerpkg.CORSConfig, logger routerpkg.Logger) *CORS {
	return &CORS{
		config: config,
		logger: logger,
	}
}

// HandleCORS adds CORS headers to the response
func (c *CORS) HandleCORS(w http.ResponseWriter, r *http.Request) {
	origin := r.Header.Get("Origin")
	
	// Check if origin is allowed
	if c.isOriginAllowed(origin) {
		w.Header().Set("Access-Control-Allow-Origin", origin)
	} else if len(c.config.AllowedOrigins) > 0 {
		// Check for exact matches first
		for _, allowedOrigin := range c.config.AllowedOrigins {
			if origin == allowedOrigin {
				w.Header().Set("Access-Control-Allow-Origin", allowedOrigin)
				break
			}
		} else {
		// Check for wildcard
		for _, allowedOrigin := range c.config.AllowedOrigins {
			if allowedOrigin == "*" {
				w.Header().Set("Access-Control-Allow-Origin", "*")
				break
			}
		}
	}
	
	// Set allowed methods
	w.Header().Set("Access-Control-Allow-Methods", strings.Join(c.config.AllowedMethods, ", "))
	
	// Set allowed headers
	if len(c.config.AllowedHeaders) > 0 {
		w.Header().Set("Access-Control-Allow-Headers", strings.Join(c.config.AllowedHeaders, ", "))
	}
	
	// Set allow credentials
	if c.config.AllowCredentials {
		w.Header().Set("Access-Control-Allow-Credentials", "true")
	}
	
	// Set max age
	if c.config.MaxAge > 0 {
		w.Header().Set("Access-Control-Max-Age", strconv.Itoa(c.config.MaxAge))
	}
	
	c.logger.Debug("CORS headers applied", "origin", origin)
}

// isOriginAllowed checks if an origin is allowed
func (c *CORS) isOriginAllowed(origin string) bool {
	if len(c.config.AllowedOrigins) == 0 {
		return true // No restrictions
	}
	
	// Check for exact matches
	for _, allowedOrigin := range c.config.AllowedOrigins {
		if origin == allowedOrigin {
			return true
		}
	}
	
	// Check for wildcard
	for _, allowedOrigin := range c.config.AllowedOrigins {
		if allowedOrigin == "*" {
			return true
		}
	}
	
	return false
}

// Helper methods

// getClientIP extracts client IP from request
func getClientIP(r *http.Request) string {
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		// Take the first IP in the list
		ips := strings.Split(xff, ",")
		if len(ips) > 0 {
			return strings.TrimSpace(ips[0])
		}
	}
	
	if xri := r.Header.Get("X-Real-IP"); xri != "" {
		return strings.TrimSpace(xri)
	}
	
	return r.RemoteAddr
}

// writeErrorResponse writes an error response
func (sm *SecurityMiddleware) writeErrorResponse(w http.ResponseWriter, err *routerpkg.Error, details map[string]interface{}, statusCode int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	
	errorResponse := map[string]interface{}{
		"success": false,
		"error": map[string]interface{}{
			"code":    err.Code,
			"message": err.Message,
		},
	}
	
	if len(details) > 0 {
		errorResponse["error"].(map[string]interface{})["details"]) = details
	}
	
	json.NewEncoder(w).Encode(errorResponse)
}

// writeRateLimitResponse writes rate limit response
func (sm *SecurityMiddleware) writeRateLimitResponse(w http.ResponseWriter, r *http.Request, limit int, window time.Duration, remaining int64) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("X-Rate-Limit-Limit", strconv.Itoa(limit))
	w.Header().Set("X-Rate-Limit-Remaining", strconv.Itoa(int(remaining)))
	w.Header().Set("X-Rate-Limit-Reset", strconv.FormatInt(time.Now().Add(window).Unix()))
	w.WriteHeader(http.StatusTooManyRequests)
	
	errorResponse := map[string]interface{}{
		"success": false,
		"error": map[string]interface{}{
			"code":    routerpkg.ErrCodeRateLimitExceeded,
			"message": "Rate limit exceeded",
		},
	}
	
	json.NewEncoder(w).Encode(errorResponse)
}

// logRequest logs request information
func (sm *SecurityMiddleware) logRequest(r *http.Request, statusCode int, err error) {
	statusIcon := "✅"
	if statusCode >= 400 {
		statusIcon = "❌"
	}
	
	level := "info"
	if statusCode >= 500 {
		level = "error"
	}
	
	// Skip logging for health and metrics endpoints
	if shouldSkipLogging(r.URL.Path) {
		return
	}
	
	sm.logger.WithFields(map[string]interface{}{
		"client_ip":     getClientIP(r),
		"method":        r.Method,
		"path":          r.URL.Path,
		"status_code":    statusCode,
		"status_icon":    statusIcon,
		"user_agent":     r.UserAgent(),
		"request_id":    r.Header.Get("X-Request-ID"),
	}).Msg("HTTP request", 
		"status",   fmt.Sprintf("%s (%d)", statusCode), 
		"method",   r.Method, 
		"path",     r.URL.Path, 
	)
	
	if err != nil {
		sm.logger.Error("Request processing error", "error", err)
	}
}

// applySecurityHeaders applies security headers to response
func (sm *SecurityMiddleware) applySecurityHeaders(w http.ResponseWriter) {
	// Security headers
	w.Header().Set("X-Content-Type-Options", "nosniff")
	w.Header().Set("X-Frame-Options", "DENY")
	w.Header().Set("X-Content-Type", "nosniff")
	w.Header().Set("X-XSS-Protection", "1; mode=block")
	w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
	
	// HSTS (if HTTPS would be used)
	w.Header().Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")
	
	// CSP
	w.Header().Set("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; font-src 'self'")
	
	// Remove server information headers
	w.Header().Set("Server", "Aether-Mailer-Router")
	w.Header().Set("X-Powered-By", "Aether-Mailer")
}

// shouldSkipLogging checks if the request should not be logged
func shouldSkipLogging(path string) bool {
	// Skip logging for health checks and internal API calls
	skipPaths := []string{
		"/health",
		"/ready",
		"/live",
		"/metrics",
		"/api/v1/router/status",
		"/api/v1/router/config",
	}
	
	for _, skipPath := range skipPaths {
		if strings.HasPrefix(path, skipPath) {
			return true
		}
	}
	
	return false
}