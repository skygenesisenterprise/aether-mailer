package controllers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/skygenesisenterprise/aether-mailer/server/src/services"
)

// GenerateUserKeyRequest represents a request to generate a new service key
type GenerateUserKeyRequest struct {
	Name        string     `json:"name" binding:"required"`
	Description string     `json:"description"`
	ExpiresAt   *time.Time `json:"expires_at"`
}

// GenerateUserKeyResponse represents the response when generating a new key
// The key is only returned once and cannot be retrieved later
type GenerateUserKeyResponse struct {
	Success     bool       `json:"success"`
	Key         string     `json:"key"`
	ID          uint       `json:"id"`
	Name        string     `json:"name"`
	Description string     `json:"description"`
	IsActive    bool       `json:"is_active"`
	ExpiresAt   *time.Time `json:"expires_at"`
	CreatedAt   time.Time  `json:"created_at"`
	Warning     string     `json:"warning"`
}

// UserKeyInfo represents a service key without the actual key value
type UserKeyInfo struct {
	ID          uint       `json:"id"`
	Name        string     `json:"name"`
	Description string     `json:"description"`
	IsActive    bool       `json:"is_active"`
	ExpiresAt   *time.Time `json:"expires_at"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

// GenerateUserKey allows an authenticated user to generate a new service key
// The key is returned only once and stored securely in the database
func GenerateUserKey(c *gin.Context) {
	var req GenerateUserKeyRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request body",
			"message": err.Error(),
		})
		return
	}

	// Get the current user ID from the context
	userID, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "Unauthorized",
			"message": "User not authenticated",
		})
		return
	}

	userIDUint, ok := userID.(uint)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Internal server error",
			"message": "Invalid user ID",
		})
		return
	}

	// Generate the service key
	serviceKeyService := services.NewServiceKeyService(services.DB)
	serviceKey, err := serviceKeyService.CreateServiceKey(req.Name, req.Description, req.ExpiresAt, userIDUint)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to generate service key",
			"message": err.Error(),
		})
		return
	}

	// Return the response with the key (only time it's shown)
	c.JSON(http.StatusCreated, GenerateUserKeyResponse{
		Success:     true,
		Key:         serviceKey.Key,
		ID:          serviceKey.ID,
		Name:        serviceKey.Name,
		Description: serviceKey.Description,
		IsActive:    serviceKey.IsActive,
		ExpiresAt:   serviceKey.ExpiresAt,
		CreatedAt:   serviceKey.CreatedAt,
		Warning:     "Save this key securely. It will not be shown again.",
	})
}

// ListUserKeys lists all service keys created by the authenticated user
// The actual key values are not returned for security
func ListUserKeys(c *gin.Context) {
	// Get the current user ID from the context
	userID, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "Unauthorized",
			"message": "User not authenticated",
		})
		return
	}

	userIDUint, ok := userID.(uint)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Internal server error",
			"message": "Invalid user ID",
		})
		return
	}

	// Parse pagination parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	// Get the user's keys
	serviceKeyService := services.NewServiceKeyService(services.DB)
	keys, total, err := serviceKeyService.ListServiceKeysByUser(userIDUint, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to list service keys",
			"message": err.Error(),
		})
		return
	}

	// Convert to response format (without the actual key values)
	var keyInfos []UserKeyInfo
	for _, key := range keys {
		keyInfos = append(keyInfos, UserKeyInfo{
			ID:          key.ID,
			Name:        key.Name,
			Description: key.Description,
			IsActive:    key.IsActive,
			ExpiresAt:   key.ExpiresAt,
			CreatedAt:   key.CreatedAt,
			UpdatedAt:   key.UpdatedAt,
		})
	}

	totalPages := int((total + int64(limit) - 1) / int64(limit))

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"keys":        keyInfos,
			"total":       total,
			"page":        page,
			"limit":       limit,
			"total_pages": totalPages,
		},
	})
}

// RevokeUserKey allows a user to revoke (deactivate) their own service key
func RevokeUserKey(c *gin.Context) {
	// Get the key ID from the URL
	keyIDStr := c.Param("id")
	keyID, err := strconv.ParseUint(keyIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid key ID",
			"message": "ID must be a valid number",
		})
		return
	}

	// Get the current user ID from the context
	userID, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "Unauthorized",
			"message": "User not authenticated",
		})
		return
	}

	userIDUint, ok := userID.(uint)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Internal server error",
			"message": "Invalid user ID",
		})
		return
	}

	// Get the service key
	serviceKeyService := services.NewServiceKeyService(services.DB)
	serviceKey, err := serviceKeyService.GetServiceKey(uint(keyID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "Service key not found",
			"message": err.Error(),
		})
		return
	}

	// Verify that the key belongs to the current user
	if serviceKey.CreatedBy != userIDUint {
		c.JSON(http.StatusForbidden, gin.H{
			"success": false,
			"error":   "Forbidden",
			"message": "You can only revoke your own service keys",
		})
		return
	}

	// Revoke (deactivate) the key
	serviceKey.IsActive = false
	serviceKey.UpdatedBy = userIDUint
	if err := services.DB.Save(serviceKey).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to revoke service key",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Service key revoked successfully",
		"data": UserKeyInfo{
			ID:          serviceKey.ID,
			Name:        serviceKey.Name,
			Description: serviceKey.Description,
			IsActive:    serviceKey.IsActive,
			ExpiresAt:   serviceKey.ExpiresAt,
			CreatedAt:   serviceKey.CreatedAt,
			UpdatedAt:   serviceKey.UpdatedAt,
		},
	})
}

// DeleteUserKey allows a user to permanently delete their own service key
func DeleteUserKey(c *gin.Context) {
	// Get the key ID from the URL
	keyIDStr := c.Param("id")
	keyID, err := strconv.ParseUint(keyIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid key ID",
			"message": "ID must be a valid number",
		})
		return
	}

	// Get the current user ID from the context
	userID, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "Unauthorized",
			"message": "User not authenticated",
		})
		return
	}

	userIDUint, ok := userID.(uint)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Internal server error",
			"message": "Invalid user ID",
		})
		return
	}

	// Get the service key
	serviceKeyService := services.NewServiceKeyService(services.DB)
	serviceKey, err := serviceKeyService.GetServiceKey(uint(keyID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "Service key not found",
			"message": err.Error(),
		})
		return
	}

	// Verify that the key belongs to the current user
	if serviceKey.CreatedBy != userIDUint {
		c.JSON(http.StatusForbidden, gin.H{
			"success": false,
			"error":   "Forbidden",
			"message": "You can only delete your own service keys",
		})
		return
	}

	// Delete the key
	if err := serviceKeyService.DeleteServiceKey(uint(keyID)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to delete service key",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Service key deleted successfully",
	})
}

// GetUserKeyInfo retrieves information about a specific service key (without the key value)
func GetUserKeyInfo(c *gin.Context) {
	// Get the key ID from the URL
	keyIDStr := c.Param("id")
	keyID, err := strconv.ParseUint(keyIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid key ID",
			"message": "ID must be a valid number",
		})
		return
	}

	// Get the current user ID from the context
	userID, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "Unauthorized",
			"message": "User not authenticated",
		})
		return
	}

	userIDUint, ok := userID.(uint)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Internal server error",
			"message": "Invalid user ID",
		})
		return
	}

	// Get the service key
	serviceKeyService := services.NewServiceKeyService(services.DB)
	serviceKey, err := serviceKeyService.GetServiceKey(uint(keyID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "Service key not found",
			"message": err.Error(),
		})
		return
	}

	// Verify that the key belongs to the current user
	if serviceKey.CreatedBy != userIDUint {
		c.JSON(http.StatusForbidden, gin.H{
			"success": false,
			"error":   "Forbidden",
			"message": "You can only view your own service keys",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": UserKeyInfo{
			ID:          serviceKey.ID,
			Name:        serviceKey.Name,
			Description: serviceKey.Description,
			IsActive:    serviceKey.IsActive,
			ExpiresAt:   serviceKey.ExpiresAt,
			CreatedAt:   serviceKey.CreatedAt,
			UpdatedAt:   serviceKey.UpdatedAt,
		},
	})
}
