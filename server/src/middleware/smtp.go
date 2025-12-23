package middleware

import (
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
)

// SMTPMiddleware handles SMTP-specific validation and processing
type SMTPMiddleware struct{}

// NewSMTPMiddleware creates a new SMTP middleware
func NewSMTPMiddleware() *SMTPMiddleware {
	return &SMTPMiddleware{}
}

// ValidateCreateSession validates SMTP session creation requests
func (m *SMTPMiddleware) ValidateCreateSession() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		var req models.CreateSMTPSessionRequest
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

		// Validate hostname
		if req.Hostname == nil || strings.TrimSpace(*req.Hostname) == "" {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "VALIDATION_ERROR",
					"message": "Hostname is required and must be a non-empty string",
					"details": gin.H{"field": "hostname"},
				},
				"timestamp": time.Now().Format(time.RFC3339),
			})
			ctx.Abort()
			return
		}

		// Validate hostname format
		hostnameRegex := regexp.MustCompile(`^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$`)
		if !hostnameRegex.MatchString(strings.TrimSpace(*req.Hostname)) {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "VALIDATION_ERROR",
					"message": "Invalid hostname format",
					"details": gin.H{
						"field":  "hostname",
						"format": "Must be a valid hostname (e.g., mail.example.com)",
					},
				},
				"timestamp": time.Now().Format(time.RFC3339),
			})
			ctx.Abort()
			return
		}

		// Validate client IP
		if req.ClientIP == "" || strings.TrimSpace(req.ClientIP) == "" {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "VALIDATION_ERROR",
					"message": "Client IP is required",
					"details": gin.H{"field": "clientIP"},
				},
				"timestamp": time.Now().Format(time.RFC3339),
			})
			ctx.Abort()
			return
		}

		// Basic IP validation
		ipRegex := regexp.MustCompile(`^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$`)
		if !ipRegex.MatchString(req.ClientIP) {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "VALIDATION_ERROR",
					"message": "Invalid client IP format",
					"details": gin.H{
						"field":  "clientIP",
						"format": "Must be a valid IPv4 or IPv6 address",
					},
				},
				"timestamp": time.Now().Format(time.RFC3339),
			})
			ctx.Abort()
			return
		}

		// Validate username if provided
		if req.Username != nil && strings.TrimSpace(*req.Username) == "" {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "VALIDATION_ERROR",
					"message": "Username cannot be empty",
					"details": gin.H{"field": "username"},
				},
				"timestamp": time.Now().Format(time.RFC3339),
			})
			ctx.Abort()
			return
		}

		// Sanitize input
		trimmedHostname := strings.TrimSpace(*req.Hostname)
		req.Hostname = &trimmedHostname
		req.ClientIP = strings.TrimSpace(req.ClientIP)
		if req.Username != nil {
			trimmed := strings.TrimSpace(*req.Username)
			req.Username = &trimmed
		}

		// Set sanitized request back to context
		ctx.Set("validatedRequest", req)
		ctx.Next()
	}
}

// ValidateSessionID validates SMTP session ID parameter
func (m *SMTPMiddleware) ValidateSessionID() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		sessionID := ctx.Param("sessionId")

		if sessionID == "" || strings.TrimSpace(sessionID) == "" {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "VALIDATION_ERROR",
					"message": "Session ID is required",
					"details": gin.H{"field": "sessionId"},
				},
				"timestamp": time.Now().Format(time.RFC3339),
			})
			ctx.Abort()
			return
		}

		// Validate session ID format (UUID or alphanumeric)
		sessionIDRegex := regexp.MustCompile(`^[a-zA-Z0-9_-]+$`)
		if !sessionIDRegex.MatchString(sessionID) {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "VALIDATION_ERROR",
					"message": "Invalid session ID format",
					"details": gin.H{"field": "sessionId"},
				},
				"timestamp": time.Now().Format(time.RFC3339),
			})
			ctx.Abort()
			return
		}

		ctx.Next()
	}
}

// ValidateSendMessage validates SMTP message sending requests
func (m *SMTPMiddleware) ValidateSendMessage() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		var req models.SMTPSendMessageRequest
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

		// Validate from address
		if req.FromAddress == "" || strings.TrimSpace(req.FromAddress) == "" {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "VALIDATION_ERROR",
					"message": "From address is required",
					"details": gin.H{"field": "fromAddress"},
				},
				"timestamp": time.Now().Format(time.RFC3339),
			})
			ctx.Abort()
			return
		}

		// Basic email validation for from address
		emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
		if !emailRegex.MatchString(req.FromAddress) {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "VALIDATION_ERROR",
					"message": "Invalid from address format",
					"details": gin.H{
						"field":  "fromAddress",
						"format": "Must be a valid email address",
					},
				},
				"timestamp": time.Now().Format(time.RFC3339),
			})
			ctx.Abort()
			return
		}

		// Validate to addresses
		if len(req.ToAddresses) == 0 {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "VALIDATION_ERROR",
					"message": "At least one to address is required",
					"details": gin.H{"field": "toAddresses"},
				},
				"timestamp": time.Now().Format(time.RFC3339),
			})
			ctx.Abort()
			return
		}

		// Validate each to address
		for i, addr := range req.ToAddresses {
			if addr == "" || strings.TrimSpace(addr) == "" {
				ctx.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"error": gin.H{
						"code":    "VALIDATION_ERROR",
						"message": "To address cannot be empty",
						"details": gin.H{"field": "toAddresses", "index": i},
					},
					"timestamp": time.Now().Format(time.RFC3339),
				})
				ctx.Abort()
				return
			}
			if !emailRegex.MatchString(addr) {
				ctx.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"error": gin.H{
						"code":    "VALIDATION_ERROR",
						"message": "Invalid to address format",
						"details": gin.H{
							"field":  "toAddresses",
							"index":  i,
							"format": "Must be a valid email address",
						},
					},
					"timestamp": time.Now().Format(time.RFC3339),
				})
				ctx.Abort()
				return
			}
		}

		// Validate cc addresses if provided
		for i, addr := range req.CcAddresses {
			if addr == "" || strings.TrimSpace(addr) == "" {
				ctx.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"error": gin.H{
						"code":    "VALIDATION_ERROR",
						"message": "CC address cannot be empty",
						"details": gin.H{"field": "ccAddresses", "index": i},
					},
					"timestamp": time.Now().Format(time.RFC3339),
				})
				ctx.Abort()
				return
			}
			if !emailRegex.MatchString(addr) {
				ctx.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"error": gin.H{
						"code":    "VALIDATION_ERROR",
						"message": "Invalid CC address format",
						"details": gin.H{
							"field":  "ccAddresses",
							"index":  i,
							"format": "Must be a valid email address",
						},
					},
					"timestamp": time.Now().Format(time.RFC3339),
				})
				ctx.Abort()
				return
			}
		}

		// Validate bcc addresses if provided
		for i, addr := range req.BccAddresses {
			if addr == "" || strings.TrimSpace(addr) == "" {
				ctx.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"error": gin.H{
						"code":    "VALIDATION_ERROR",
						"message": "BCC address cannot be empty",
						"details": gin.H{"field": "bccAddresses", "index": i},
					},
					"timestamp": time.Now().Format(time.RFC3339),
				})
				ctx.Abort()
				return
			}
			if !emailRegex.MatchString(addr) {
				ctx.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"error": gin.H{
						"code":    "VALIDATION_ERROR",
						"message": "Invalid BCC address format",
						"details": gin.H{
							"field":  "bccAddresses",
							"index":  i,
							"format": "Must be a valid email address",
						},
					},
					"timestamp": time.Now().Format(time.RFC3339),
				})
				ctx.Abort()
				return
			}
		}

		// Validate message content
		if req.BodyText == "" && req.BodyHTML == "" {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "VALIDATION_ERROR",
					"message": "Either body text or body HTML is required",
					"details": gin.H{"fields": []string{"bodyText", "bodyHTML"}},
				},
				"timestamp": time.Now().Format(time.RFC3339),
			})
			ctx.Abort()
			return
		}

		// Validate total message size (basic check)
		totalSize := len(req.Subject) + len(req.BodyText) + len(req.BodyHTML)
		for _, attachment := range req.Attachments {
			totalSize += len(attachment.Content)
		}
		if totalSize > 25*1024*1024 { // 25MB limit
			ctx.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "VALIDATION_ERROR",
					"message": "Message size exceeds 25MB limit",
					"details": gin.H{"maxSize": "25MB"},
				},
				"timestamp": time.Now().Format(time.RFC3339),
			})
			ctx.Abort()
			return
		}

		// Validate attachments if provided
		for i, attachment := range req.Attachments {
			if attachment.Filename == "" || strings.TrimSpace(attachment.Filename) == "" {
				ctx.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"error": gin.H{
						"code":    "VALIDATION_ERROR",
						"message": "Attachment filename is required",
						"details": gin.H{"field": "attachments", "index": i, "subfield": "filename"},
					},
					"timestamp": time.Now().Format(time.RFC3339),
				})
				ctx.Abort()
				return
			}
			if attachment.ContentType == "" || strings.TrimSpace(attachment.ContentType) == "" {
				ctx.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"error": gin.H{
						"code":    "VALIDATION_ERROR",
						"message": "Attachment content type is required",
						"details": gin.H{"field": "attachments", "index": i, "subfield": "contentType"},
					},
					"timestamp": time.Now().Format(time.RFC3339),
				})
				ctx.Abort()
				return
			}
			if attachment.Content == "" {
				ctx.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"error": gin.H{
						"code":    "VALIDATION_ERROR",
						"message": "Attachment content is required",
						"details": gin.H{"field": "attachments", "index": i, "subfield": "content"},
					},
					"timestamp": time.Now().Format(time.RFC3339),
				})
				ctx.Abort()
				return
			}
		}

		// Sanitize input
		req.FromAddress = strings.TrimSpace(req.FromAddress)
		req.Subject = strings.TrimSpace(req.Subject)
		for i, addr := range req.ToAddresses {
			req.ToAddresses[i] = strings.TrimSpace(addr)
		}
		for i, addr := range req.CcAddresses {
			req.CcAddresses[i] = strings.TrimSpace(addr)
		}
		for i, addr := range req.BccAddresses {
			req.BccAddresses[i] = strings.TrimSpace(addr)
		}

		// Set sanitized request back to context
		ctx.Set("validatedRequest", req)
		ctx.Next()
	}
}

// ValidateSMTPQueryParams validates SMTP query parameters
func (m *SMTPMiddleware) ValidateSMTPQueryParams() gin.HandlerFunc {
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
			if err != nil || limitNum < 1 || limitNum > 1000 {
				ctx.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"error": gin.H{
						"code":    "VALIDATION_ERROR",
						"message": "Limit must be a number between 1 and 1000",
						"details": gin.H{"field": "limit"},
					},
					"timestamp": time.Now().Format(time.RFC3339),
				})
				ctx.Abort()
				return
			}
		}

		// Validate status filter
		if status := ctx.Query("status"); status != "" {
			validStatuses := []models.SMTPStatus{
				models.SMTPStatusActive,
				models.SMTPStatusCompleted,
				models.SMTPStatusAborted,
				models.SMTPStatusTimedOut,
				models.SMTPStatusError,
			}
			isValid := false
			for _, validStatus := range validStatuses {
				if models.SMTPStatus(status) == validStatus {
					isValid = true
					break
				}
			}
			if !isValid {
				ctx.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"error": gin.H{
						"code":    "VALIDATION_ERROR",
						"message": "Status must be one of: active, completed, aborted, timed_out, error",
						"details": gin.H{"field": "status"},
					},
					"timestamp": time.Now().Format(time.RFC3339),
				})
				ctx.Abort()
				return
			}
		}

		// Validate message status filter
		if messageStatus := ctx.Query("messageStatus"); messageStatus != "" {
			validMessageStatuses := []models.SMTPMessageStatus{
				models.SMTPMessageStatusPending,
				models.SMTPMessageStatusQueued,
				models.SMTPMessageStatusProcessing,
				models.SMTPMessageStatusSent,
				models.SMTPMessageStatusFailed,
				models.SMTPMessageStatusBounced,
				models.SMTPMessageStatusDeferred,
			}
			isValid := false
			for _, validStatus := range validMessageStatuses {
				if models.SMTPMessageStatus(messageStatus) == validStatus {
					isValid = true
					break
				}
			}
			if !isValid {
				ctx.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"error": gin.H{
						"code":    "VALIDATION_ERROR",
						"message": "Message status must be one of: pending, queued, processing, sent, failed, bounced, deferred",
						"details": gin.H{"field": "messageStatus"},
					},
					"timestamp": time.Now().Format(time.RFC3339),
				})
				ctx.Abort()
				return
			}
		}

		// Validate boolean parameters
		if isAuthenticated := ctx.Query("isAuthenticated"); isAuthenticated != "" {
			if isAuthenticated != "true" && isAuthenticated != "false" {
				ctx.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"error": gin.H{
						"code":    "VALIDATION_ERROR",
						"message": "isAuthenticated must be either \"true\" or \"false\"",
						"details": gin.H{"field": "isAuthenticated"},
					},
					"timestamp": time.Now().Format(time.RFC3339),
				})
				ctx.Abort()
				return
			}
		}

		if isSecure := ctx.Query("isSecure"); isSecure != "" {
			if isSecure != "true" && isSecure != "false" {
				ctx.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"error": gin.H{
						"code":    "VALIDATION_ERROR",
						"message": "isSecure must be either \"true\" or \"false\"",
						"details": gin.H{"field": "isSecure"},
					},
					"timestamp": time.Now().Format(time.RFC3339),
				})
				ctx.Abort()
				return
			}
		}

		// Validate sort options
		if sortBy := ctx.Query("sortBy"); sortBy != "" {
			validSortBy := []string{"createdAt", "updatedAt", "lastActivity", "hostname", "messageCount", "bytesReceived"}
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
						"message": "sortBy must be one of: createdAt, updatedAt, lastActivity, hostname, messageCount, bytesReceived",
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

// ValidateQueueRequest validates SMTP queue management requests
func (m *SMTPMiddleware) ValidateQueueRequest() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		var req models.SMTPQueueRequest
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
		if len(req.MessageIDs) == 0 && req.Status == nil && req.Priority == nil && req.MaxAttempts == nil {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "VALIDATION_ERROR",
					"message": "At least one field must be provided for queue management",
					"details": gin.H{
						"availableFields": []string{
							"messageIds", "status", "priority", "maxAttempts",
						},
					},
				},
				"timestamp": time.Now().Format(time.RFC3339),
			})
			ctx.Abort()
			return
		}

		// Validate message IDs if provided
		if len(req.MessageIDs) > 0 {
			for i, id := range req.MessageIDs {
				if id == "" || strings.TrimSpace(id) == "" {
					ctx.JSON(http.StatusBadRequest, gin.H{
						"success": false,
						"error": gin.H{
							"code":    "VALIDATION_ERROR",
							"message": "Message ID cannot be empty",
							"details": gin.H{"field": "messageIds", "index": i},
						},
						"timestamp": time.Now().Format(time.RFC3339),
					})
					ctx.Abort()
					return
				}
			}
		}

		// Validate status if provided
		if req.Status != nil {
			validStatuses := []models.SMTPQueueStatus{
				models.SMTPQueueStatusPending,
				models.SMTPQueueStatusQueued,
				models.SMTPQueueStatusProcessing,
				models.SMTPQueueStatusSent,
				models.SMTPQueueStatusFailed,
				models.SMTPQueueStatusBounced,
				models.SMTPQueueStatusDeferred,
			}
			isValid := false
			for _, validStatus := range validStatuses {
				if *req.Status == validStatus {
					isValid = true
					break
				}
			}
			if !isValid {
				ctx.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"error": gin.H{
						"code":    "VALIDATION_ERROR",
						"message": "Status must be one of: pending, queued, processing, sent, failed, bounced, deferred",
						"details": gin.H{"field": "status"},
					},
					"timestamp": time.Now().Format(time.RFC3339),
				})
				ctx.Abort()
				return
			}
		}

		// Validate priority if provided
		if req.Priority != nil && *req.Priority < -100 || *req.Priority > 100 {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "VALIDATION_ERROR",
					"message": "Priority must be between -100 and 100",
					"details": gin.H{"field": "priority"},
				},
				"timestamp": time.Now().Format(time.RFC3339),
			})
			ctx.Abort()
			return
		}

		// Validate max attempts if provided
		if req.MaxAttempts != nil && (*req.MaxAttempts < 1 || *req.MaxAttempts > 10) {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "VALIDATION_ERROR",
					"message": "Max attempts must be between 1 and 10",
					"details": gin.H{"field": "maxAttempts"},
				},
				"timestamp": time.Now().Format(time.RFC3339),
			})
			ctx.Abort()
			return
		}

		// Set sanitized request back to context
		ctx.Set("validatedRequest", req)
		ctx.Next()
	}
}

// ValidateSearchRequest validates SMTP search requests
func (m *SMTPMiddleware) ValidateSearchRequest() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		var req models.SMTPSearchRequest
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

		// Validate query
		if req.Query == "" || strings.TrimSpace(req.Query) == "" {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "VALIDATION_ERROR",
					"message": "Search query is required",
					"details": gin.H{"field": "query"},
				},
				"timestamp": time.Now().Format(time.RFC3339),
			})
			ctx.Abort()
			return
		}

		// Validate query length
		if len(req.Query) > 1000 {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "VALIDATION_ERROR",
					"message": "Search query must be 1000 characters or less",
					"details": gin.H{"field": "query"},
				},
				"timestamp": time.Now().Format(time.RFC3339),
			})
			ctx.Abort()
			return
		}

		// Validate status if provided
		if req.Status != nil {
			validStatuses := []models.SMTPMessageStatus{
				models.SMTPMessageStatusPending,
				models.SMTPMessageStatusQueued,
				models.SMTPMessageStatusProcessing,
				models.SMTPMessageStatusSent,
				models.SMTPMessageStatusFailed,
				models.SMTPMessageStatusBounced,
				models.SMTPMessageStatusDeferred,
			}
			isValid := false
			for _, validStatus := range validStatuses {
				if *req.Status == validStatus {
					isValid = true
					break
				}
			}
			if !isValid {
				ctx.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"error": gin.H{
						"code":    "VALIDATION_ERROR",
						"message": "Status must be one of: pending, queued, processing, sent, failed, bounced, deferred",
						"details": gin.H{"field": "status"},
					},
					"timestamp": time.Now().Format(time.RFC3339),
				})
				ctx.Abort()
				return
			}
		}

		// Validate date range if provided
		if req.FromDate != nil && req.ToDate != nil && req.FromDate.After(*req.ToDate) {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "VALIDATION_ERROR",
					"message": "From date cannot be after to date",
					"details": gin.H{"fields": []string{"fromDate", "toDate"}},
				},
				"timestamp": time.Now().Format(time.RFC3339),
			})
			ctx.Abort()
			return
		}

		// Sanitize input
		req.Query = strings.TrimSpace(req.Query)

		// Set sanitized request back to context
		ctx.Set("validatedRequest", req)
		ctx.Next()
	}
}

// RequireSMTPStatus creates a middleware that requires specific SMTP statuses
func (m *SMTPMiddleware) RequireSMTPStatus(statuses []models.SMTPStatus) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		sessionID := ctx.Param("sessionId")
		if sessionID == "" {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "MISSING_SESSION_ID",
					"message": "Session ID is required",
				},
				"timestamp": time.Now().Format(time.RFC3339),
			})
			ctx.Abort()
			return
		}

		// In a real implementation, you would fetch the session from the database
		// For now, we'll check if the session exists in context (set by previous middleware)
		session, exists := ctx.Get("smtpSession")
		if !exists {
			ctx.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "SESSION_NOT_FOUND",
					"message": "SMTP session not found",
				},
				"timestamp": time.Now().Format(time.RFC3339),
			})
			ctx.Abort()
			return
		}

		smtpSession, ok := session.(models.SMTPSession)
		if !ok {
			ctx.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "INVALID_SESSION_CONTEXT",
					"message": "Invalid session context",
				},
				"timestamp": time.Now().Format(time.RFC3339),
			})
			ctx.Abort()
			return
		}

		// Check if session has required status
		hasRequiredStatus := false
		for _, status := range statuses {
			if smtpSession.Status == status {
				hasRequiredStatus = true
				break
			}
		}

		if !hasRequiredStatus {
			ctx.JSON(http.StatusForbidden, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "INVALID_SESSION_STATUS",
					"message": "Session is not in the required status",
					"details": gin.H{
						"currentStatus":    smtpSession.Status,
						"requiredStatuses": statuses,
					},
				},
				"timestamp": time.Now().Format(time.RFC3339),
			})
			ctx.Abort()
			return
		}

		ctx.Next()
	}
}

// RequireActive creates a middleware that requires active SMTP status
func (m *SMTPMiddleware) RequireActive() gin.HandlerFunc {
	return m.RequireSMTPStatus([]models.SMTPStatus{
		models.SMTPStatusActive,
	})
}

// RequireAuthenticated creates a middleware that requires authenticated SMTP session
func (m *SMTPMiddleware) RequireAuthenticated() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		sessionID := ctx.Param("sessionId")
		if sessionID == "" {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "MISSING_SESSION_ID",
					"message": "Session ID is required",
				},
				"timestamp": time.Now().Format(time.RFC3339),
			})
			ctx.Abort()
			return
		}

		// In a real implementation, you would fetch the session from the database
		// For now, we'll check if the session exists in context (set by previous middleware)
		session, exists := ctx.Get("smtpSession")
		if !exists {
			ctx.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "SESSION_NOT_FOUND",
					"message": "SMTP session not found",
				},
				"timestamp": time.Now().Format(time.RFC3339),
			})
			ctx.Abort()
			return
		}

		smtpSession, ok := session.(models.SMTPSession)
		if !ok {
			ctx.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "INVALID_SESSION_CONTEXT",
					"message": "Invalid session context",
				},
				"timestamp": time.Now().Format(time.RFC3339),
			})
			ctx.Abort()
			return
		}

		if !smtpSession.IsAuthenticated {
			ctx.JSON(http.StatusForbidden, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "SESSION_NOT_AUTHENTICATED",
					"message": "SMTP session is not authenticated",
				},
				"timestamp": time.Now().Format(time.RFC3339),
			})
			ctx.Abort()
			return
		}

		ctx.Next()
	}
}
