package controllers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
	"github.com/skygenesisenterprise/aether-mailer/server/src/services"
	"github.com/gin-gonic/gin"
)

// UserController handles user endpoints
type UserController struct {
	userService *services.UserService
}

// NewUserController creates a new user controller
func NewUserController(userService *services.UserService) *UserController {
	return &UserController{
		userService: userService,
	}
}

// GetUsers retrieves all users with filtering and pagination
func (c *UserController) GetUsers(ctx *gin.Context) {
	// Parse query parameters
	filters := services.UserFilters{}

	if email := ctx.Query("email"); email != "" {
		filters.Email = &email
	}

	if role := ctx.Query("role"); role != "" {
		userRole := models.UserRole(role)
		filters.Role = &userRole
	}

	if isActive := ctx.Query("isActive"); isActive != "" {
		active := isActive == "true"
		filters.IsActive = &active
	}

	if page := ctx.Query("page"); page != "" {
		if pageNum, err := strconv.Atoi(page); err == nil {
			filters.Page = &pageNum
		}
	}

	if limit := ctx.Query("limit"); limit != "" {
		if limitNum, err := strconv.Atoi(limit); err == nil {
			filters.Limit = &limitNum
		}
	}

	result, err := c.userService.GetUsers(filters)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "USERS_ERROR",
				"message": "Failed to retrieve users",
			},
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success":    true,
		"data":       result.Data,
		"pagination": result.Pagination,
		"timestamp":  time.Now().Format(time.RFC3339),
	})
}

// GetUserByID retrieves a user by ID
func (c *UserController) GetUserByID(ctx *gin.Context) {
	id := ctx.Param("id")

	result, err := c.userService.GetUserByID(id)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "USER_ERROR",
				"message": "Failed to retrieve user",
			},
		})
		return
	}

	if !result.Success {
		ctx.JSON(http.StatusNotFound, result)
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success":   true,
		"data":      result.Data,
		"timestamp": time.Now().Format(time.RFC3339),
	})
}

// CreateUser creates a new user
func (c *UserController) CreateUser(ctx *gin.Context) {
	var req models.CreateUserRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": err.Error(),
			},
		})
		return
	}

	result, err := c.userService.CreateUser(req)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "USER_ERROR",
				"message": "Failed to create user",
			},
		})
		return
	}

	if !result.Success {
		ctx.JSON(http.StatusBadRequest, result)
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{
		"success":   true,
		"data":      result.Data,
		"message":   "User created successfully",
		"timestamp": time.Now().Format(time.RFC3339),
	})
}

// UpdateUser updates an existing user
func (c *UserController) UpdateUser(ctx *gin.Context) {
	id := ctx.Param("id")

	var req models.UpdateUserRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": err.Error(),
			},
		})
		return
	}

	result, err := c.userService.UpdateUser(id, req)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "USER_ERROR",
				"message": "Failed to update user",
			},
		})
		return
	}

	if !result.Success {
		if result.Error != nil && result.Error.Code == "USER_NOT_FOUND" {
			ctx.JSON(http.StatusNotFound, result)
		} else {
			ctx.JSON(http.StatusBadRequest, result)
		}
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success":   true,
		"data":      result.Data,
		"message":   "User updated successfully",
		"timestamp": time.Now().Format(time.RFC3339),
	})
}

// DeleteUser deletes a user
func (c *UserController) DeleteUser(ctx *gin.Context) {
	id := ctx.Param("id")

	result, err := c.userService.DeleteUser(id)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "USER_ERROR",
				"message": "Failed to delete user",
			},
		})
		return
	}

	if !result.Success {
		ctx.JSON(http.StatusNotFound, result)
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success":   true,
		"message":   "User deleted successfully",
		"timestamp": time.Now().Format(time.RFC3339),
	})
}

// ChangePassword changes a user's password
func (c *UserController) ChangePassword(ctx *gin.Context) {
	id := ctx.Param("id")

	var req models.ChangePasswordRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": err.Error(),
			},
		})
		return
	}

	result, err := c.userService.ChangePassword(id, req)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "USER_ERROR",
				"message": "Failed to change password",
			},
		})
		return
	}

	if !result.Success {
		ctx.JSON(http.StatusBadRequest, result)
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success":   true,
		"message":   "Password changed successfully",
		"timestamp": time.Now().Format(time.RFC3339),
	})
}

// SuspendUser suspends a user account
func (c *UserController) SuspendUser(ctx *gin.Context) {
	id := ctx.Param("id")

	result, err := c.userService.SuspendUser(id)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "USER_ERROR",
				"message": "Failed to suspend user",
			},
		})
		return
	}

	if !result.Success {
		ctx.JSON(http.StatusBadRequest, result)
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success":   true,
		"message":   "User suspended successfully",
		"timestamp": time.Now().Format(time.RFC3339),
	})
}

// ActivateUser activates a user account
func (c *UserController) ActivateUser(ctx *gin.Context) {
	id := ctx.Param("id")

	result, err := c.userService.ActivateUser(id)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "USER_ERROR",
				"message": "Failed to activate user",
			},
		})
		return
	}

	if !result.Success {
		ctx.JSON(http.StatusBadRequest, result)
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success":   true,
		"message":   "User activated successfully",
		"timestamp": time.Now().Format(time.RFC3339),
	})
}

// GetUserStats retrieves user statistics
func (c *UserController) GetUserStats(ctx *gin.Context) {
	stats, err := c.userService.GetUserStats()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "USER_ERROR",
				"message": "Failed to retrieve user statistics",
			},
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success":   true,
		"data":      stats,
		"message":   "User statistics retrieved successfully",
		"timestamp": time.Now().Format(time.RFC3339),
	})
}
