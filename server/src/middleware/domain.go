package middleware

import (
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
	"github.com/gin-gonic/gin"
)

// DomainMiddleware handles domain validation
type DomainMiddleware struct{}

// NewDomainMiddleware creates a new domain middleware
func NewDomainMiddleware() *DomainMiddleware {
	return &DomainMiddleware{}
}

// ValidateCreateDomain validates domain creation requests
func (m *DomainMiddleware) ValidateCreateDomain() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		var req models.CreateDomainRequest
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

		// Validate required fields
		if req.Name == "" || strings.TrimSpace(req.Name) == "" {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "VALIDATION_ERROR",
					"message": "Domain name is required and must be a non-empty string",
					"details": gin.H{"field": "name"},
				},
				"timestamp": time.Now().Format(time.RFC3339),
			})
			ctx.Abort()
			return
		}

		// Validate domain name format
		domainRegex := regexp.MustCompile(`^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$`)
		if !domainRegex.MatchString(strings.TrimSpace(strings.ToLower(req.Name))) {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "VALIDATION_ERROR",
					"message": "Invalid domain name format",
					"details": gin.H{
						"field":  "name",
						"format": "Must be a valid domain name (e.g., example.com)",
					},
				},
				"timestamp": time.Now().Format(time.RFC3339),
			})
			ctx.Abort()
			return
		}

		// Validate optional fields
		if req.DisplayName != nil && *req.DisplayName == "" {
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

		if req.Description != nil && *req.Description == "" {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "VALIDATION_ERROR",
					"message": "Description cannot be empty",
					"details": gin.H{"field": "description"},
				},
				"timestamp": time.Now().Format(time.RFC3339),
			})
			ctx.Abort()
			return
		}

		// Validate mail server configuration if provided
		if req.MailServerConfig != nil {
			if err := m.validateMailServerConfig(req.MailServerConfig); err != nil {
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
		}

		// Sanitize input
		req.Name = strings.TrimSpace(strings.ToLower(req.Name))
		if req.DisplayName != nil {
			trimmed := strings.TrimSpace(*req.DisplayName)
			req.DisplayName = &trimmed
		}
		if req.Description != nil {
			trimmed := strings.TrimSpace(*req.Description)
			req.Description = &trimmed
		}

		// Set sanitized request back to context
		ctx.Set("validatedRequest", req)
		ctx.Next()
	}
}

// ValidateUpdateDomain validates domain update requests
func (m *DomainMiddleware) ValidateUpdateDomain() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		var req models.UpdateDomainRequest
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

		// Validate that at least one field is provided
		if req.DisplayName == nil && req.Description == nil && req.IsActive == nil &&
			req.IsVerified == nil && req.MailServerConfig == nil {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "VALIDATION_ERROR",
					"message": "At least one field must be provided for update",
					"details": gin.H{
						"availableFields": []string{
							"displayName", "description", "isActive", "isVerified", "mailServerConfig",
						},
					},
				},
				"timestamp": time.Now().Format(time.RFC3339),
			})
			ctx.Abort()
			return
		}

		// Validate fields if provided
		if req.DisplayName != nil && *req.DisplayName == "" {
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

		if req.Description != nil && *req.Description == "" {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "VALIDATION_ERROR",
					"message": "Description cannot be empty",
					"details": gin.H{"field": "description"},
				},
				"timestamp": time.Now().Format(time.RFC3339),
			})
			ctx.Abort()
			return
		}

		// Validate mail server configuration if provided
		if req.MailServerConfig != nil {
			if err := m.validateUpdateMailServerConfig(req.MailServerConfig); err != nil {
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
		}

		// Sanitize input
		if req.DisplayName != nil {
			trimmed := strings.TrimSpace(*req.DisplayName)
			req.DisplayName = &trimmed
		}
		if req.Description != nil {
			trimmed := strings.TrimSpace(*req.Description)
			req.Description = &trimmed
		}

		// Set sanitized request back to context
		ctx.Set("validatedRequest", req)
		ctx.Next()
	}
}

// ValidateDomainID validates domain ID parameter
func (m *DomainMiddleware) ValidateDomainID() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		id := ctx.Param("id")

		if id == "" || strings.TrimSpace(id) == "" {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "VALIDATION_ERROR",
					"message": "Domain ID is required",
					"details": gin.H{"field": "id"},
				},
				"timestamp": time.Now().Format(time.RFC3339),
			})
			ctx.Abort()
			return
		}

		// Validate that ID is a valid format (basic check)
		idRegex := regexp.MustCompile(`^[a-zA-Z0-9_-]+$`)
		if !idRegex.MatchString(id) {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "VALIDATION_ERROR",
					"message": "Invalid domain ID format",
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

// ValidateDomainQueryParams validates domain query parameters
func (m *DomainMiddleware) ValidateDomainQueryParams() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		// Validate page
		if page := ctx.Query("page"); page != "" {
			pageNum, err := strconv.Atoi(page)
			if err != nil || pageNum < 1 {
				ctx.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"error": gin.H{
						"code":    "VALIDATION_ERROR",
						"message": "Page must be a positive integer",
						"details": gin.H{"field": "page"},
					},
					"timestamp": time.Now().Format(time.RFC3339),
				})
				ctx.Abort()
				return
			}
		}

		// Validate limit
		if limit := ctx.Query("limit"); limit != "" {
			limitNum, err := strconv.Atoi(limit)
			if err != nil || limitNum < 1 || limitNum > 100 {
				ctx.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"error": gin.H{
						"code":    "VALIDATION_ERROR",
						"message": "Limit must be a number between 1 and 100",
						"details": gin.H{"field": "limit"},
					},
					"timestamp": time.Now().Format(time.RFC3339),
				})
				ctx.Abort()
				return
			}
		}

		// Validate search string length
		if search := ctx.Query("search"); search != "" {
			if len(search) > 100 {
				ctx.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"error": gin.H{
						"code":    "VALIDATION_ERROR",
						"message": "Search query must be a string with max 100 characters",
						"details": gin.H{"field": "search"},
					},
					"timestamp": time.Now().Format(time.RFC3339),
				})
				ctx.Abort()
				return
			}
		}

		// Validate boolean parameters
		if isActive := ctx.Query("isActive"); isActive != "" {
			if isActive != "true" && isActive != "false" {
				ctx.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"error": gin.H{
						"code":    "VALIDATION_ERROR",
						"message": "isActive must be either \"true\" or \"false\"",
						"details": gin.H{"field": "isActive"},
					},
					"timestamp": time.Now().Format(time.RFC3339),
				})
				ctx.Abort()
				return
			}
		}

		if isVerified := ctx.Query("isVerified"); isVerified != "" {
			if isVerified != "true" && isVerified != "false" {
				ctx.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"error": gin.H{
						"code":    "VALIDATION_ERROR",
						"message": "isVerified must be either \"true\" or \"false\"",
						"details": gin.H{"field": "isVerified"},
					},
					"timestamp": time.Now().Format(time.RFC3339),
				})
				ctx.Abort()
				return
			}
		}

		// Validate sort options
		if sortBy := ctx.Query("sortBy"); sortBy != "" {
			validSortBy := []string{"name", "createdAt", "updatedAt"}
			isValid := false
			for _, valid := range validSortBy {
				if sortBy == valid {
					isValid = true
					break
				}
			}
			if !isValid {
				ctx.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"error": gin.H{
						"code":    "VALIDATION_ERROR",
						"message": "sortBy must be one of: name, createdAt, updatedAt",
						"details": gin.H{"field": "sortBy"},
					},
					"timestamp": time.Now().Format(time.RFC3339),
				})
				ctx.Abort()
				return
			}
		}

		if sortOrder := ctx.Query("sortOrder"); sortOrder != "" {
			if sortOrder != "asc" && sortOrder != "desc" {
				ctx.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"error": gin.H{
						"code":    "VALIDATION_ERROR",
						"message": "sortOrder must be either \"asc\" or \"desc\"",
						"details": gin.H{"field": "sortOrder"},
					},
					"timestamp": time.Now().Format(time.RFC3339),
				})
				ctx.Abort()
				return
			}
		}

		ctx.Next()
	}
}

// validateMailServerConfig validates mail server configuration for creation
func (m *DomainMiddleware) validateMailServerConfig(config *models.CreateMailServerConfig) error {
	if config.Host == "" {
		return &ValidationError{
			Field:   "mailServerConfig.host",
			Message: "Mail server host is required",
		}
	}

	if config.Port < 1 || config.Port > 65535 {
		return &ValidationError{
			Field:   "mailServerConfig.port",
			Message: "Mail server port must be a number between 1 and 65535",
		}
	}

	validProtocols := []models.MailProtocol{
		models.MailProtocolSMTP,
		models.MailProtocolSMTPS,
		models.MailProtocolSTARTTLS,
	}
	isValidProtocol := false
	for _, protocol := range validProtocols {
		if config.Protocol == protocol {
			isValidProtocol = true
			break
		}
	}
	if !isValidProtocol {
		return &ValidationError{
			Field:   "mailServerConfig.protocol",
			Message: "Mail server protocol must be one of: smtp, smtps, starttls",
		}
	}

	validAuthTypes := []models.MailAuthType{
		models.MailAuthTypeNone,
		models.MailAuthTypePlain,
		models.MailAuthTypeLogin,
		models.MailAuthTypeCramMD5,
	}
	isValidAuthType := false
	for _, authType := range validAuthTypes {
		if config.AuthType == authType {
			isValidAuthType = true
			break
		}
	}
	if !isValidAuthType {
		return &ValidationError{
			Field:   "mailServerConfig.authType",
			Message: "Mail server auth type must be one of: none, plain, login, crammd5",
		}
	}

	if config.MaxConnections < 1 {
		return &ValidationError{
			Field:   "mailServerConfig.maxConnections",
			Message: "Max connections must be a positive number",
		}
	}

	if config.Timeout < 1000 {
		return &ValidationError{
			Field:   "mailServerConfig.timeout",
			Message: "Timeout must be a number at least 1000ms",
		}
	}

	return nil
}

// validateUpdateMailServerConfig validates mail server configuration for updates
func (m *DomainMiddleware) validateUpdateMailServerConfig(config *models.UpdateMailServerConfig) error {
	if config.Host != nil && *config.Host == "" {
		return &ValidationError{
			Field:   "mailServerConfig.host",
			Message: "Mail server host must be a non-empty string",
		}
	}

	if config.Port != nil && (*config.Port < 1 || *config.Port > 65535) {
		return &ValidationError{
			Field:   "mailServerConfig.port",
			Message: "Mail server port must be a number between 1 and 65535",
		}
	}

	if config.Protocol != nil {
		validProtocols := []models.MailProtocol{
			models.MailProtocolSMTP,
			models.MailProtocolSMTPS,
			models.MailProtocolSTARTTLS,
		}
		isValidProtocol := false
		for _, protocol := range validProtocols {
			if *config.Protocol == protocol {
				isValidProtocol = true
				break
			}
		}
		if !isValidProtocol {
			return &ValidationError{
				Field:   "mailServerConfig.protocol",
				Message: "Mail server protocol must be one of: smtp, smtps, starttls",
			}
		}
	}

	if config.AuthType != nil {
		validAuthTypes := []models.MailAuthType{
			models.MailAuthTypeNone,
			models.MailAuthTypePlain,
			models.MailAuthTypeLogin,
			models.MailAuthTypeCramMD5,
		}
		isValidAuthType := false
		for _, authType := range validAuthTypes {
			if *config.AuthType == authType {
				isValidAuthType = true
				break
			}
		}
		if !isValidAuthType {
			return &ValidationError{
				Field:   "mailServerConfig.authType",
				Message: "Mail server auth type must be one of: none, plain, login, crammd5",
			}
		}
	}

	if config.MaxConnections != nil && *config.MaxConnections < 1 {
		return &ValidationError{
			Field:   "mailServerConfig.maxConnections",
			Message: "Max connections must be a positive number",
		}
	}

	if config.Timeout != nil && *config.Timeout < 1000 {
		return &ValidationError{
			Field:   "mailServerConfig.timeout",
			Message: "Timeout must be a number at least 1000ms",
		}
	}

	return nil
}

// ValidationError represents a validation error
type ValidationError struct {
	Field   string
	Message string
}

func (e *ValidationError) Error() string {
	return e.Message
}
