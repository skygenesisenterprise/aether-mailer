package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
	"github.com/skygenesisenterprise/server/src/models"
	"github.com/skygenesisenterprise/server/src/services"
)

// ApiKeyController handles API key operations
type ApiKeyController struct {
	apiKeyService *services.ApiKeyService
}

// NewApiKeyController creates a new API key controller
func NewApiKeyController(apiKeyService *services.ApiKeyService) *ApiKeyController {
	return &ApiKeyController{
		apiKeyService: apiKeyService,
	}
}

// CreateApiKey creates a new API key
func (c *ApiKeyController) CreateApiKey(ctx *gin.Context) {
	var req models.CreateApiKeyRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "INVALID_REQUEST",
				"message": err.Error(),
			},
		})
		return
	}

	// Get user ID from context (from API key middleware)
	userID, exists := ctx.Get("apiKeyUserID")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "UNAUTHORIZED",
				"message": "User ID not found in context",
			},
		})
		return
	}

	// Create API key
	response, err := c.apiKeyService.CreateApiKey(userID.(string), req.Name, req.Permissions, req.ExpiresAt)
	if err != nil {
		log.Error().Err(err).Msg("Failed to create API key")
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to create API key",
			},
		})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    response,
		"message": "API key created successfully",
	})
}

// ListApiKeys lists all API keys for the user
func (c *ApiKeyController) ListApiKeys(ctx *gin.Context) {
	// Get user ID from context
	userID, exists := ctx.Get("apiKeyUserID")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "UNAUTHORIZED",
				"message": "User ID not found in context",
			},
		})
		return
	}

	// Get API keys
	keys, err := c.apiKeyService.ListApiKeys(userID.(string))
	if err != nil {
		log.Error().Err(err).Msg("Failed to list API keys")
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to list API keys",
			},
		})
		return
	}

	// Convert to response format (don't include hashed keys)
	var responses []models.ApiKeyResponse
	for _, key := range keys {
		responses = append(responses, models.ApiKeyResponse{
			ID:          key.ID,
			Name:        key.Name,
			Key:         "", // Don't show hashed keys in list
			Permissions: key.Permissions,
			IsActive:    key.IsActive,
			ExpiresAt:   key.ExpiresAt,
			CreatedAt:   key.CreatedAt,
			LastUsedAt:  key.LastUsedAt,
		})
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"apiKeys": responses,
		},
	})
}

// GetApiKey gets a specific API key
func (c *ApiKeyController) GetApiKey(ctx *gin.Context) {
	keyID := ctx.Param("id")

	// Get API key
	key, err := c.apiKeyService.GetApiKey(keyID)
	if err != nil {
		if err.Error() == "API key not found" {
			ctx.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "NOT_FOUND",
					"message": "API key not found",
				},
			})
			return
		}

		log.Error().Err(err).Msg("Failed to get API key")
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to get API key",
			},
		})
		return
	}

	// Convert to response format (don't include hashed key)
	response := models.ApiKeyResponse{
		ID:          key.ID,
		Name:        key.Name,
		Key:         "", // Don't show hashed key
		Permissions: key.Permissions,
		IsActive:    key.IsActive,
		ExpiresAt:   key.ExpiresAt,
		CreatedAt:   key.CreatedAt,
		LastUsedAt:  key.LastUsedAt,
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    response,
	})
}

// RevokeApiKey revokes an API key
func (c *ApiKeyController) RevokeApiKey(ctx *gin.Context) {
	keyID := ctx.Param("id")

	// Revoke API key
	err := c.apiKeyService.RevokeApiKey(keyID)
	if err != nil {
		log.Error().Err(err).Msg("Failed to revoke API key")
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to revoke API key",
			},
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "API key revoked successfully",
	})
}

// UpdateApiKey updates an API key
func (c *ApiKeyController) UpdateApiKey(ctx *gin.Context) {
	keyID := ctx.Param("id")

	var req models.UpdateApiKeyRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "INVALID_REQUEST",
				"message": err.Error(),
			},
		})
		return
	}

	// Update API key
	err := c.apiKeyService.UpdateApiKey(keyID, req.Name, req.Permissions)
	if err != nil {
		log.Error().Err(err).Msg("Failed to update API key")
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to update API key",
			},
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "API key updated successfully",
	})
}

// GetApiKeyUsageStats gets usage statistics for an API key
func (c *ApiKeyController) GetApiKeyUsageStats(ctx *gin.Context) {
	keyID := ctx.Param("id")

	// Get usage statistics
	stats, err := c.apiKeyService.GetApiKeyUsageStats(keyID)
	if err != nil {
		log.Error().Err(err).Msg("Failed to get API key usage stats")
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to get usage statistics",
			},
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    stats,
	})
}

// GetSystemKeyInfo returns information about the system key (system only)
func (c *ApiKeyController) GetSystemKeyInfo(ctx *gin.Context) {
	// This endpoint is only accessible with system key
	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"systemKey": gin.H{
				"name":        "system",
				"permissions": []string{"*"},
				"isActive":    true,
				"expiresAt":   nil,
				"description": "Internal system API key with full permissions",
			},
		},
	})
}

// CleanupExpiredKeys cleans up expired API keys (system only)
func (c *ApiKeyController) CleanupExpiredKeys(ctx *gin.Context) {
	// This endpoint is only accessible with system key
	err := c.apiKeyService.CleanupExpiredKeys()
	if err != nil {
		log.Error().Err(err).Msg("Failed to cleanup expired API keys")
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to cleanup expired API keys",
			},
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Expired API keys cleaned up successfully",
	})
}

// ValidateApiKey validates an API key (debug endpoint)
func (c *ApiKeyController) ValidateApiKey(ctx *gin.Context) {
	var req models.ValidateApiKeyRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "INVALID_REQUEST",
				"message": err.Error(),
			},
		})
		return
	}

	// Validate the API key
	keyData, err := c.apiKeyService.ValidateAPIKey(req.APIKey, ctx)
	if err != nil {
		ctx.JSON(http.StatusOK, gin.H{
			"success": false,
			"valid":   false,
			"error":   err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"valid":   true,
		"data": gin.H{
			"id":          keyData.ID,
			"name":        keyData.Name,
			"permissions": keyData.Permissions,
			"isActive":    keyData.IsActive,
			"expiresAt":   keyData.ExpiresAt,
			"lastUsedAt":  keyData.LastUsedAt,
		},
	})
}
