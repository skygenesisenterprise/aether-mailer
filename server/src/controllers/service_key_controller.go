package controllers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
	"github.com/skygenesisenterprise/aether-mailer/server/src/services"
)

// CreateServiceKeyRequest represents a service key creation request
type CreateServiceKeyRequest struct {
	Name        string     `json:"name" binding:"required"`
	Description string     `json:"description"`
	ExpiresAt   *time.Time `json:"expires_at"`
}

// UpdateServiceKeyRequest represents a service key update request
type UpdateServiceKeyRequest struct {
	Name        string     `json:"name"`
	Description string     `json:"description"`
	IsActive    bool       `json:"is_active"`
	ExpiresAt   *time.Time `json:"expires_at"`
}

// CreateServiceKey creates a new service key
func CreateServiceKey(ctx *gin.Context) {
	var req CreateServiceKeyRequest

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request body",
			"message": err.Error(),
		})
		return
	}

	// Get the current user ID from the context (assuming it's set by auth middleware)
	userID, exists := ctx.Get("user_id")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "Unauthorized",
			"message": "User not authenticated",
		})
		return
	}

	userIDUint, ok := userID.(uint)
	if !ok {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Internal server error",
			"message": "Invalid user ID",
		})
		return
	}

	serviceKeyService := services.NewServiceKeyService(services.DB)
	serviceKey, err := serviceKeyService.CreateServiceKey(req.Name, req.Description, req.ExpiresAt, userIDUint)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to create service key",
			"message": err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    serviceKey,
		"message": "Service key created successfully",
	})
}

// GetServiceKey retrieves a service key by ID
func GetServiceKey(ctx *gin.Context) {
	idStr := ctx.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid service key ID",
			"message": "ID must be a valid number",
		})
		return
	}

	serviceKeyService := services.NewServiceKeyService(services.DB)
	serviceKey, err := serviceKeyService.GetServiceKey(uint(id))
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "Service key not found",
			"message": err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    serviceKey,
		"message": "Service key retrieved successfully",
	})
}

// UpdateServiceKey updates a service key
func UpdateServiceKey(ctx *gin.Context) {
	idStr := ctx.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid service key ID",
			"message": "ID must be a valid number",
		})
		return
	}

	var req UpdateServiceKeyRequest

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request body",
			"message": err.Error(),
		})
		return
	}

	// Get the current user ID from the context
	userID, exists := ctx.Get("user_id")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "Unauthorized",
			"message": "User not authenticated",
		})
		return
	}

	userIDUint, ok := userID.(uint)
	if !ok {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Internal server error",
			"message": "Invalid user ID",
		})
		return
	}

	serviceKeyService := services.NewServiceKeyService(services.DB)
	serviceKey, err := serviceKeyService.UpdateServiceKey(uint(id), req.Name, req.Description, req.IsActive, req.ExpiresAt, userIDUint)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to update service key",
			"message": err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    serviceKey,
		"message": "Service key updated successfully",
	})
}

// DeleteServiceKey deletes a service key
func DeleteServiceKey(ctx *gin.Context) {
	idStr := ctx.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid service key ID",
			"message": "ID must be a valid number",
		})
		return
	}

	serviceKeyService := services.NewServiceKeyService(services.DB)
	err = serviceKeyService.DeleteServiceKey(uint(id))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to delete service key",
			"message": err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Service key deleted successfully",
	})
}

// ListServiceKeys lists all service keys
func ListServiceKeys(ctx *gin.Context) {
	// Parse pagination parameters
	limit := 10
	if limitParam := ctx.DefaultQuery("limit", "10"); limitParam != "" {
		parsedLimit, err := strconv.Atoi(limitParam)
		if err == nil && parsedLimit > 0 {
			limit = parsedLimit
		}
	}

	offset := 0
	if offsetParam := ctx.DefaultQuery("offset", "0"); offsetParam != "" {
		parsedOffset, err := strconv.Atoi(offsetParam)
		if err == nil && parsedOffset >= 0 {
			offset = parsedOffset
		}
	}

	serviceKeyService := services.NewServiceKeyService(services.DB)
	serviceKeys, count, err := serviceKeyService.ListServiceKeys(limit, offset)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to list service keys",
			"message": err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"service_keys": serviceKeys,
			"total":       count,
			"limit":       limit,
			"offset":      offset,
		},
		"message": "Service keys listed successfully",
	})
}

// GetServiceKeyUsage retrieves usage statistics for a service key
func GetServiceKeyUsage(ctx *gin.Context) {
	idStr := ctx.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid service key ID",
			"message": "ID must be a valid number",
		})
		return
	}

	// In a real implementation, you would query the ServiceKeyUsage table
	// For now, we'll return a simple response
	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"service_key_id": uint(id),
			"total_requests": 0,
			"recent_requests": []models.ServiceKeyUsage{},
		},
		"message": "Service key usage retrieved successfully",
	})
}

// ValidateServiceKey validates a service key
func ValidateServiceKey(ctx *gin.Context) {
	var req struct {
		Key string `json:"key" binding:"required"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request body",
			"message": "Key is required",
		})
		return
	}

	serviceKeyService := services.NewServiceKeyService(services.DB)
	isValid, err := serviceKeyService.ValidateServiceKey(req.Key)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "Invalid service key",
			"message": err.Error(),
		})
		return
	}

	if !isValid {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "Invalid service key",
			"message": "Service key is invalid or expired",
		})
		return
	}

	// If we get here, the key is valid
	// Optionally, we can return the service key details (without the actual key for security)
	serviceKey, err := serviceKeyService.GetServiceKeyByKey(req.Key)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to retrieve service key details",
			"message": err.Error(),
		})
		return
	}

	// Return a sanitized response without the actual key
	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"service_key_id": serviceKey.ID,
			"name":           serviceKey.Name,
			"description":    serviceKey.Description,
			"is_active":      serviceKey.IsActive,
			"expires_at":     serviceKey.ExpiresAt,
			"created_at":     serviceKey.CreatedAt,
			"updated_at":     serviceKey.UpdatedAt,
		},
		"message": "Service key is valid",
	})
}
