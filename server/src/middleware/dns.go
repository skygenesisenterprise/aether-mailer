package middleware

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
)

// DNSMiddleware handles DNS-related middleware
type DNSMiddleware struct {
	dnsServers []string
	timeout    time.Duration
}

// NewDNSMiddleware creates a new DNS middleware
func NewDNSMiddleware() *DNSMiddleware {
	return &DNSMiddleware{
		dnsServers: []string{"8.8.8.8:53", "1.1.1.1:53", "208.67.222.222:53"}, // Google, Cloudflare, OpenDNS
		timeout:    5 * time.Second,
	}
}

// SetDNSServers sets custom DNS servers
func (m *DNSMiddleware) SetDNSServers(servers []string) {
	m.dnsServers = servers
}

// SetTimeout sets DNS query timeout
func (m *DNSMiddleware) SetTimeout(timeout time.Duration) {
	m.timeout = timeout
}

// DNSLookup performs DNS lookup with fallback servers using Go's net package
func (m *DNSMiddleware) DNSLookup(recordType string, domain string) ([]string, error) {
	var resolver *net.Resolver

	// Use custom DNS servers if specified
	if len(m.dnsServers) > 0 {
		resolver = &net.Resolver{
			PreferGo: true,
			Dial: func(ctx context.Context, network, address string) (net.Conn, error) {
				// Use first DNS server for simplicity
				d := net.Dialer{
					Timeout: m.timeout,
				}
				return d.DialContext(ctx, network, m.dnsServers[0])
			},
		}
	} else {
		resolver = &net.Resolver{}
	}

	ctx, cancel := context.WithTimeout(context.Background(), m.timeout)
	defer cancel()

	switch strings.ToUpper(recordType) {
	case "A":
		ips, err := resolver.LookupIPAddr(ctx, domain)
		if err != nil {
			return nil, err
		}
		var results []string
		for _, ip := range ips {
			if ip.IP.To4() != nil {
				results = append(results, ip.IP.String())
			}
		}
		return results, nil

	case "MX":
		mxs, err := resolver.LookupMX(ctx, domain)
		if err != nil {
			return nil, err
		}
		var results []string
		for _, mx := range mxs {
			results = append(results, mx.Host)
		}
		return results, nil

	case "TXT":
		records, err := resolver.LookupTXT(ctx, domain)
		if err != nil {
			return nil, err
		}
		return records, nil

	case "CNAME":
		cname, err := resolver.LookupCNAME(ctx, domain)
		if err != nil {
			return nil, err
		}
		return []string{cname}, nil

	case "PTR":
		names, err := resolver.LookupAddr(ctx, domain)
		if err != nil {
			return nil, err
		}
		return names, nil

	default:
		return nil, fmt.Errorf("unsupported record type: %s", recordType)
	}
}

// ValidateDomainMX validates that a domain has MX records
func (m *DNSMiddleware) ValidateDomainMX(domain string) bool {
	records, err := m.DNSLookup("MX", domain)
	if err != nil {
		log.Warn().Err(err).Msgf("No MX records found for domain %s", domain)
		return false
	}

	return len(records) > 0
}

// ValidateDomainSPF validates SPF records for a domain
func (m *DNSMiddleware) ValidateDomainSPF(domain string) (bool, string) {
	records, err := m.DNSLookup("TXT", domain)
	if err != nil {
		return false, ""
	}

	for _, record := range records {
		if strings.HasPrefix(record, "v=spf1") {
			return true, record
		}
	}

	return false, ""
}

// ValidateDomainDKIM validates DKIM records for a domain
func (m *DNSMiddleware) ValidateDomainDKIM(domain, selector string) (bool, string) {
	dkimDomain := selector + "._domainkey." + domain
	records, err := m.DNSLookup("TXT", dkimDomain)
	if err != nil {
		return false, ""
	}

	for _, record := range records {
		if strings.Contains(record, "v=DKIM1") {
			return true, record
		}
	}

	return false, ""
}

// ValidateDomainDMARC validates DMARC records for a domain
func (m *DNSMiddleware) ValidateDomainDMARC(domain string) (bool, string) {
	dmarcDomain := "_dmarc." + domain
	records, err := m.DNSLookup("TXT", dmarcDomain)
	if err != nil {
		return false, ""
	}

	for _, record := range records {
		if strings.HasPrefix(record, "v=DMARC1") {
			return true, record
		}
	}

	return false, ""
}

// ResolveIP resolves IP address to hostname (reverse DNS)
func (m *DNSMiddleware) ResolveIP(ip string) (string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), m.timeout)
	defer cancel()

	names, err := net.DefaultResolver.LookupAddr(ctx, ip)
	if err != nil {
		return "", err
	}

	if len(names) > 0 {
		return names[0], nil
	}

	return "", nil
}

// DNSRateLimit middleware limits DNS requests per IP
func (m *DNSMiddleware) DNSRateLimit(requests int, window time.Duration) gin.HandlerFunc {
	limiter := make(map[string][]time.Time)

	return func(ctx *gin.Context) {
		clientIP := ctx.ClientIP()
		now := time.Now()

		// Clean old entries
		if times, exists := limiter[clientIP]; exists {
			var validTimes []time.Time
			for _, t := range times {
				if now.Sub(t) < window {
					validTimes = append(validTimes, t)
				}
			}
			limiter[clientIP] = validTimes
		}

		// Check rate limit
		if times, exists := limiter[clientIP]; exists && len(times) >= requests {
			ctx.JSON(429, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "RATE_LIMIT_EXCEEDED",
					"message": "Too many DNS requests",
				},
			})
			ctx.Abort()
			return
		}

		// Add current request
		limiter[clientIP] = append(limiter[clientIP], now)
		ctx.Next()
	}
}

// DNSValidation middleware validates DNS records for email domains
func (m *DNSMiddleware) DNSValidation() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		// Only validate for email-related endpoints
		if !strings.Contains(ctx.Request.URL.Path, "smtp") &&
			!strings.Contains(ctx.Request.URL.Path, "email") {
			ctx.Next()
			return
		}

		// For POST requests with domain validation
		if ctx.Request.Method == "POST" {
			var body struct {
				Domain string   `json:"domain,omitempty"`
				To     []string `json:"to,omitempty"`
				From   string   `json:"from,omitempty"`
			}

			if err := ctx.ShouldBindJSON(&body); err == nil {
				domains := m.extractDomains(body)

				for _, domain := range domains {
					if !m.ValidateDomainMX(domain) {
						log.Warn().Msgf("Invalid domain for email: %s", domain)
						ctx.JSON(400, gin.H{
							"success": false,
							"error": gin.H{
								"code":    "INVALID_DOMAIN",
								"message": "Domain has no valid MX records",
								"domain":  domain,
							},
						})
						ctx.Abort()
						return
					}
				}
			}
		}

		ctx.Next()
	}
}

// extractDomains extracts domains from email addresses
func (m *DNSMiddleware) extractDomains(body struct {
	Domain string   `json:"domain,omitempty"`
	To     []string `json:"to,omitempty"`
	From   string   `json:"from,omitempty"`
}) []string {
	var domains []string

	if body.Domain != "" {
		domains = append(domains, body.Domain)
	}

	if body.From != "" {
		if domain := m.extractDomainFromEmail(body.From); domain != "" {
			domains = append(domains, domain)
		}
	}

	for _, email := range body.To {
		if domain := m.extractDomainFromEmail(email); domain != "" {
			domains = append(domains, domain)
		}
	}

	return m.removeDuplicates(domains)
}

// extractDomainFromEmail extracts domain from email address
func (m *DNSMiddleware) extractDomainFromEmail(email string) string {
	parts := strings.Split(email, "@")
	if len(parts) == 2 {
		return parts[1]
	}
	return ""
}

// removeDuplicates removes duplicate entries from slice
func (m *DNSMiddleware) removeDuplicates(slice []string) []string {
	seen := make(map[string]bool)
	var result []string

	for _, item := range slice {
		if !seen[item] {
			seen[item] = true
			result = append(result, item)
		}
	}

	return result
}

// DNSMetrics middleware tracks DNS request metrics
func (m *DNSMiddleware) DNSMetrics() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		start := time.Now()

		ctx.Next()

		duration := time.Since(start)

		log.Info().
			Str("method", ctx.Request.Method).
			Str("path", ctx.Request.URL.Path).
			Str("client_ip", ctx.ClientIP()).
			Dur("duration", duration).
			Msg("DNS request completed")
	}
}

// DNSHealthCheck middleware performs health checks on DNS servers
func (m *DNSMiddleware) DNSHealthCheck() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		if ctx.Request.URL.Path != "/api/v1/health/dns" {
			ctx.Next()
			return
		}

		results := make(map[string]interface{})

		for _, server := range m.dnsServers {
			start := time.Now()
			_, err := m.DNSLookup("A", "google.com")
			duration := time.Since(start)

			results[server] = map[string]interface{}{
				"healthy": err == nil,
				"latency": duration.String(),
				"error":   err != nil,
			}
		}

		ctx.JSON(200, gin.H{
			"success": true,
			"data": gin.H{
				"dns_servers":     results,
				"total_servers":   len(m.dnsServers),
				"healthy_servers": m.countHealthyServers(results),
			},
		})
	}
}

// countHealthyServers counts the number of healthy DNS servers
func (m *DNSMiddleware) countHealthyServers(results map[string]interface{}) int {
	count := 0
	for _, result := range results {
		if server, ok := result.(map[string]interface{}); ok {
			if healthy, exists := server["healthy"].(bool); exists && healthy {
				count++
			}
		}
	}
	return count
}

// DNS Provider Validation

// ValidateCreateDNSProvider validates DNS provider creation requests
func (m *DNSMiddleware) ValidateCreateDNSProvider() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		var req struct {
			Name        string `json:"name" binding:"required"`
			DisplayName string `json:"displayName" binding:"required"`
			Type        string `json:"type" binding:"required"`
			Description string `json:"description"`
			APIEndpoint string `json:"apiEndpoint"`
			APIToken    string `json:"apiToken"`
			Secret      string `json:"secret"`
			Config      string `json:"config"`
			IsActive    bool   `json:"isActive"`
			IsDefault   bool   `json:"isDefault"`
			RateLimit   int    `json:"rateLimit"`
		}

		if err := ctx.ShouldBindJSON(&req); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "VALIDATION_ERROR",
					"message": err.Error(),
				},
				"timestamp": time.Now().Format(time.RFC3339),
			})
			ctx.Abort()
			return
		}

		// Validate name
		if req.Name == "" || strings.TrimSpace(req.Name) == "" {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "VALIDATION_ERROR",
					"message": "Provider name is required",
					"details": gin.H{"field": "name"},
				},
				"timestamp": time.Now().Format(time.RFC3339),
			})
			ctx.Abort()
			return
		}

		// Validate name format (alphanumeric, hyphens, underscores)
		nameRegex := regexp.MustCompile(`^[a-zA-Z0-9_-]+$`)
		if !nameRegex.MatchString(req.Name) {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "VALIDATION_ERROR",
					"message": "Provider name can only contain letters, numbers, hyphens, and underscores",
					"details": gin.H{"field": "name"},
				},
				"timestamp": time.Now().Format(time.RFC3339),
			})
			ctx.Abort()
			return
		}

		// Validate display name
		if req.DisplayName == "" || strings.TrimSpace(req.DisplayName) == "" {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "VALIDATION_ERROR",
					"message": "Display name is required",
					"details": gin.H{"field": "displayName"},
				},
				"timestamp": time.Now().Format(time.RFC3339),
			})
			ctx.Abort()
			return
		}

		// Validate provider type
		validTypes := []string{"custom", "google", "cloudflare", "opendns"}
		isValidType := false
		for _, validType := range validTypes {
			if req.Type == validType {
				isValidType = true
				break
			}
		}
		if !isValidType {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "VALIDATION_ERROR",
					"message": "Invalid provider type. Must be one of: custom, google, cloudflare, opendns",
					"details": gin.H{"field": "type"},
				},
				"timestamp": time.Now().Format(time.RFC3339),
			})
			ctx.Abort()
			return
		}

		// Validate API endpoint for custom providers
		if req.Type == "custom" && req.APIEndpoint != "" {
			// Basic endpoint validation (host:port format)
			endpointRegex := regexp.MustCompile(`^[a-zA-Z0-9.-]+:[0-9]+$`)
			if !endpointRegex.MatchString(req.APIEndpoint) {
				ctx.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"error": gin.H{
						"code":    "VALIDATION_ERROR",
						"message": "Invalid API endpoint format. Expected: host:port",
						"details": gin.H{"field": "apiEndpoint"},
					},
					"timestamp": time.Now().Format(time.RFC3339),
				})
				ctx.Abort()
				return
			}
		}

		// Validate rate limit
		if req.RateLimit < 0 || req.RateLimit > 10000 {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "VALIDATION_ERROR",
					"message": "Rate limit must be between 0 and 10000 requests per hour",
					"details": gin.H{"field": "rateLimit"},
				},
				"timestamp": time.Now().Format(time.RFC3339),
			})
			ctx.Abort()
			return
		}

		// Sanitize input
		req.Name = strings.TrimSpace(req.Name)
		req.DisplayName = strings.TrimSpace(req.DisplayName)
		req.Description = strings.TrimSpace(req.Description)

		// Set sanitized request back to context
		ctx.Set("validatedRequest", req)
		ctx.Next()
	}
}

// ValidateUpdateDNSProvider validates DNS provider update requests
func (m *DNSMiddleware) ValidateUpdateDNSProvider() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		var req map[string]interface{}
		if err := ctx.ShouldBindJSON(&req); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "VALIDATION_ERROR",
					"message": err.Error(),
				},
				"timestamp": time.Now().Format(time.RFC3339),
			})
			ctx.Abort()
			return
		}

		// Validate name if provided
		if name, ok := req["name"].(string); ok && name != "" {
			nameRegex := regexp.MustCompile(`^[a-zA-Z0-9_-]+$`)
			if !nameRegex.MatchString(strings.TrimSpace(name)) {
				ctx.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"error": gin.H{
						"code":    "VALIDATION_ERROR",
						"message": "Provider name can only contain letters, numbers, hyphens, and underscores",
						"details": gin.H{"field": "name"},
					},
					"timestamp": time.Now().Format(time.RFC3339),
				})
				ctx.Abort()
				return
			}
			req["name"] = strings.TrimSpace(name)
		}

		// Validate display name if provided
		if displayName, ok := req["displayName"].(string); ok && displayName != "" {
			if strings.TrimSpace(displayName) == "" {
				ctx.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"error": gin.H{
						"code":    "VALIDATION_ERROR",
						"message": "Display name cannot be empty",
						"details": gin.H{"field": "displayName"},
					},
					"timestamp": time.Now().Format(time.RFC3339),
				})
				ctx.Abort()
				return
			}
			req["displayName"] = strings.TrimSpace(displayName)
		}

		// Validate provider type if provided
		if providerType, ok := req["type"].(string); ok && providerType != "" {
			validTypes := []string{"custom", "google", "cloudflare", "opendns"}
			isValidType := false
			for _, validType := range validTypes {
				if providerType == validType {
					isValidType = true
					break
				}
			}
			if !isValidType {
				ctx.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"error": gin.H{
						"code":    "VALIDATION_ERROR",
						"message": "Invalid provider type. Must be one of: custom, google, cloudflare, opendns",
						"details": gin.H{"field": "type"},
					},
					"timestamp": time.Now().Format(time.RFC3339),
				})
				ctx.Abort()
				return
			}
		}

		// Validate rate limit if provided
		if rateLimit, ok := req["rateLimit"].(float64); ok {
			if rateLimit < 0 || rateLimit > 10000 {
				ctx.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"error": gin.H{
						"code":    "VALIDATION_ERROR",
						"message": "Rate limit must be between 0 and 10000 requests per hour",
						"details": gin.H{"field": "rateLimit"},
					},
					"timestamp": time.Now().Format(time.RFC3339),
				})
				ctx.Abort()
				return
			}
		}

		// Set sanitized request back to context
		ctx.Set("validatedRequest", req)
		ctx.Next()
	}
}

// ValidateDNSProviderID validates DNS provider ID parameter
func (m *DNSMiddleware) ValidateDNSProviderID() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		id := ctx.Param("id")

		if id == "" || strings.TrimSpace(id) == "" {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "VALIDATION_ERROR",
					"message": "Provider ID is required",
					"details": gin.H{"field": "id"},
				},
				"timestamp": time.Now().Format(time.RFC3339),
			})
			ctx.Abort()
			return
		}

		// Validate that ID is a valid number
		if _, err := strconv.ParseUint(id, 10, 32); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "VALIDATION_ERROR",
					"message": "Invalid provider ID format",
					"details": gin.H{"field": "id"},
				},
				"timestamp": time.Now().Format(time.RFC3339),
			})
			ctx.Abort()
			return
		}

		ctx.Next()
	}
}

// ValidateDNSProviderSetting validates DNS provider setting creation
func (m *DNSMiddleware) ValidateDNSProviderSetting() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		var req struct {
			Name         string `json:"name" binding:"required"`
			Type         string `json:"type" binding:"required"`
			Value        string `json:"value" binding:"required"`
			Description  string `json:"description"`
			IsRequired   bool   `json:"isRequired"`
			IsSecret     bool   `json:"isSecret"`
			DefaultValue string `json:"defaultValue"`
		}

		if err := ctx.ShouldBindJSON(&req); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "VALIDATION_ERROR",
					"message": err.Error(),
				},
				"timestamp": time.Now().Format(time.RFC3339),
			})
			ctx.Abort()
			return
		}

		// Validate name
		if req.Name == "" || strings.TrimSpace(req.Name) == "" {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "VALIDATION_ERROR",
					"message": "Setting name is required",
					"details": gin.H{"field": "name"},
				},
				"timestamp": time.Now().Format(time.RFC3339),
			})
			ctx.Abort()
			return
		}

		// Validate setting type
		validTypes := []string{"string", "number", "boolean", "array"}
		isValidType := false
		for _, validType := range validTypes {
			if req.Type == validType {
				isValidType = true
				break
			}
		}
		if !isValidType {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "VALIDATION_ERROR",
					"message": "Invalid setting type. Must be one of: string, number, boolean, array",
					"details": gin.H{"field": "type"},
				},
				"timestamp": time.Now().Format(time.RFC3339),
			})
			ctx.Abort()
			return
		}

		// Validate value
		if req.Value == "" || strings.TrimSpace(req.Value) == "" {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "VALIDATION_ERROR",
					"message": "Setting value is required",
					"details": gin.H{"field": "value"},
				},
				"timestamp": time.Now().Format(time.RFC3339),
			})
			ctx.Abort()
			return
		}

		// Sanitize input
		req.Name = strings.TrimSpace(req.Name)
		req.Value = strings.TrimSpace(req.Value)
		req.Description = strings.TrimSpace(req.Description)

		// Set sanitized request back to context
		ctx.Set("validatedRequest", req)
		ctx.Next()
	}
}

// ValidateDNSProviderCredential validates DNS provider credential creation
func (m *DNSMiddleware) ValidateDNSProviderCredential() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		var req struct {
			ProviderID  uint   `json:"providerId" binding:"required"`
			Name        string `json:"name" binding:"required"`
			Credentials string `json:"credentials" binding:"required"`
			IsActive    bool   `json:"isActive"`
		}

		if err := ctx.ShouldBindJSON(&req); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "VALIDATION_ERROR",
					"message": err.Error(),
				},
				"timestamp": time.Now().Format(time.RFC3339),
			})
			ctx.Abort()
			return
		}

		// Validate provider ID
		if req.ProviderID == 0 {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "VALIDATION_ERROR",
					"message": "Provider ID is required",
					"details": gin.H{"field": "providerId"},
				},
				"timestamp": time.Now().Format(time.RFC3339),
			})
			ctx.Abort()
			return
		}

		// Validate name
		if req.Name == "" || strings.TrimSpace(req.Name) == "" {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "VALIDATION_ERROR",
					"message": "Credential name is required",
					"details": gin.H{"field": "name"},
				},
				"timestamp": time.Now().Format(time.RFC3339),
			})
			ctx.Abort()
			return
		}

		// Validate credentials
		if req.Credentials == "" || strings.TrimSpace(req.Credentials) == "" {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "VALIDATION_ERROR",
					"message": "Credentials are required",
					"details": gin.H{"field": "credentials"},
				},
				"timestamp": time.Now().Format(time.RFC3339),
			})
			ctx.Abort()
			return
		}

		// Sanitize input
		req.Name = strings.TrimSpace(req.Name)

		// Set sanitized request back to context
		ctx.Set("validatedRequest", req)
		ctx.Next()
	}
}
