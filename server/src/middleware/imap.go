package middleware

import (
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/skygenesisenterprise/server/src/models"
)

// IMAPMiddleware handles IMAP-specific validation and processing
type IMAPMiddleware struct{}

// NewIMAPMiddleware creates a new IMAP middleware
func NewIMAPMiddleware() *IMAPMiddleware {
	return &IMAPMiddleware{}
}

// ValidateCreateSession validates IMAP session creation requests
func (m *IMAPMiddleware) ValidateCreateSession() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		var req models.CreateIMAPSessionRequest
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
		if req.Hostname == "" || strings.TrimSpace(req.Hostname) == "" {
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
		if !hostnameRegex.MatchString(strings.TrimSpace(req.Hostname)) {
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
		req.Hostname = strings.TrimSpace(req.Hostname)
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

// ValidateSessionID validates IMAP session ID parameter
func (m *IMAPMiddleware) ValidateSessionID() gin.HandlerFunc {
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

// ValidateMailboxName validates mailbox name parameter
func (m *IMAPMiddleware) ValidateMailboxName() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		mailbox := ctx.Param("mailbox")

		if mailbox == "" || strings.TrimSpace(mailbox) == "" {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "VALIDATION_ERROR",
					"message": "Mailbox name is required",
					"details": gin.H{"field": "mailbox"},
				},
				"timestamp": time.Now().Format(time.RFC3339),
			})
			ctx.Abort()
			return
		}

		// Validate mailbox name (IMAP mailbox name rules)
		mailboxRegex := regexp.MustCompile(`^[^*%]+$`)
		if !mailboxRegex.MatchString(mailbox) {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "VALIDATION_ERROR",
					"message": "Invalid mailbox name format",
					"details": gin.H{
						"field":  "mailbox",
						"format": "Mailbox name cannot contain * or % characters",
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

// ValidateMessageSet validates IMAP message set parameter
func (m *IMAPMiddleware) ValidateMessageSet() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		messageSet := ctx.Param("messageSet")

		if messageSet == "" || strings.TrimSpace(messageSet) == "" {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "VALIDATION_ERROR",
					"message": "Message set is required",
					"details": gin.H{"field": "messageSet"},
				},
				"timestamp": time.Now().Format(time.RFC3339),
			})
			ctx.Abort()
			return
		}

		// Basic IMAP message set validation (numbers, ranges, and commas)
		messageSetRegex := regexp.MustCompile(`^(\d+|\d+:\d+)(,(\d+|\d+:\d+))*$`)
		if !messageSetRegex.MatchString(messageSet) {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "VALIDATION_ERROR",
					"message": "Invalid message set format",
					"details": gin.H{
						"field":  "messageSet",
						"format": "Must be a valid IMAP message set (e.g., 1,2:5,10)",
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

// ValidateIMAPQueryParams validates IMAP query parameters
func (m *IMAPMiddleware) ValidateIMAPQueryParams() gin.HandlerFunc {
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

		// Validate state filter
		if state := ctx.Query("state"); state != "" {
			validStates := []models.IMAPState{
				models.IMAPStateNonAuthenticated,
				models.IMAPStateAuthenticated,
				models.IMAPStateSelected,
				models.IMAPStateLogout,
			}
			isValid := false
			for _, validState := range validStates {
				if models.IMAPState(state) == validState {
					isValid = true
					break
				}
			}
			if !isValid {
				ctx.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"error": gin.H{
						"code":    "VALIDATION_ERROR",
						"message": "State must be one of: non_authenticated, authenticated, selected, logout",
						"details": gin.H{"field": "state"},
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
			validSortBy := []string{"createdAt", "updatedAt", "lastActivity", "hostname", "username"}
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
						"message": "sortBy must be one of: createdAt, updatedAt, lastActivity, hostname, username",
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

// ValidateSearchQuery validates IMAP search query
func (m *IMAPMiddleware) ValidateSearchQuery() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		var req models.IMAPSearchRequest
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
		if req.MailboxID == "" || strings.TrimSpace(req.MailboxID) == "" {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "VALIDATION_ERROR",
					"message": "Mailbox ID is required",
					"details": gin.H{"field": "mailboxId"},
				},
				"timestamp": time.Now().Format(time.RFC3339),
			})
			ctx.Abort()
			return
		}

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

		// Sanitize input
		req.MailboxID = strings.TrimSpace(req.MailboxID)
		req.Query = strings.TrimSpace(req.Query)

		// Set sanitized request back to context
		ctx.Set("validatedRequest", req)
		ctx.Next()
	}
}

// ValidateFetchRequest validates IMAP fetch request
func (m *IMAPMiddleware) ValidateFetchRequest() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		var req models.IMAPFetchRequest
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
		if req.MailboxID == "" || strings.TrimSpace(req.MailboxID) == "" {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "VALIDATION_ERROR",
					"message": "Mailbox ID is required",
					"details": gin.H{"field": "mailboxId"},
				},
				"timestamp": time.Now().Format(time.RFC3339),
			})
			ctx.Abort()
			return
		}

		if len(req.MessageIDs) == 0 {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "VALIDATION_ERROR",
					"message": "At least one message ID is required",
					"details": gin.H{"field": "messageIds"},
				},
				"timestamp": time.Now().Format(time.RFC3339),
			})
			ctx.Abort()
			return
		}

		if len(req.MessageIDs) > 1000 {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "VALIDATION_ERROR",
					"message": "Cannot fetch more than 1000 messages at once",
					"details": gin.H{"field": "messageIds"},
				},
				"timestamp": time.Now().Format(time.RFC3339),
			})
			ctx.Abort()
			return
		}

		// Validate message IDs are positive
		for _, id := range req.MessageIDs {
			if id == 0 {
				ctx.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"error": gin.H{
						"code":    "VALIDATION_ERROR",
						"message": "Message IDs must be positive numbers",
						"details": gin.H{"field": "messageIds"},
					},
					"timestamp": time.Now().Format(time.RFC3339),
				})
				ctx.Abort()
				return
			}
		}

		// Sanitize input
		req.MailboxID = strings.TrimSpace(req.MailboxID)

		// Set sanitized request back to context
		ctx.Set("validatedRequest", req)
		ctx.Next()
	}
}

// RequireIMAPState creates a middleware that requires specific IMAP states
func (m *IMAPMiddleware) RequireIMAPState(states []models.IMAPState) gin.HandlerFunc {
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
		session, exists := ctx.Get("imapSession")
		if !exists {
			ctx.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "SESSION_NOT_FOUND",
					"message": "IMAP session not found",
				},
				"timestamp": time.Now().Format(time.RFC3339),
			})
			ctx.Abort()
			return
		}

		imapSession, ok := session.(models.IMAPSession)
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

		// Check if session has required state
		hasRequiredState := false
		for _, state := range states {
			if imapSession.State == state {
				hasRequiredState = true
				break
			}
		}

		if !hasRequiredState {
			ctx.JSON(http.StatusForbidden, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "INVALID_SESSION_STATE",
					"message": "Session is not in the required state",
					"details": gin.H{
						"currentState":   imapSession.State,
						"requiredStates": states,
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

// RequireAuthenticated creates a middleware that requires authenticated IMAP state
func (m *IMAPMiddleware) RequireAuthenticated() gin.HandlerFunc {
	return m.RequireIMAPState([]models.IMAPState{
		models.IMAPStateAuthenticated,
		models.IMAPStateSelected,
	})
}

// RequireSelected creates a middleware that requires selected IMAP state
func (m *IMAPMiddleware) RequireSelected() gin.HandlerFunc {
	return m.RequireIMAPState([]models.IMAPState{
		models.IMAPStateSelected,
	})
}
