package controllers

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
	"github.com/skygenesisenterprise/aether-mailer/server/src/services"
)

// GetUser récupère les informations d'un utilisateur
func GetUser(c *gin.Context) {
	userID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid user ID",
		})
		return
	}

	// Récupérer l'utilisateur depuis la base de données
	userService := services.NewUserService(services.DB)
	user, err := userService.GetUserByID(strconv.FormatUint(userID, 10))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "User not found",
		})
		return
	}

	c.JSON(http.StatusOK, user.ToResponse())
}

// UpdateUser met à jour les informations d'un utilisateur
func UpdateUser(c *gin.Context) {
	userID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid user ID",
		})
		return
	}

	var updateData struct {
		Name     string `json:"name"`
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
		})
		return
	}

	// Récupérer l'utilisateur existant
	userService := services.NewUserService(services.DB)
	user, err := userService.GetUserByID(strconv.FormatUint(userID, 10))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "User not found",
		})
		return
	}

	// Mettre à jour les champs
	name := updateData.Name
	email := updateData.Email
	if name != "" {
		user.Name = &name
	}
	if email != "" {
		user.Email = &email
	}
	if updateData.Password != "" {
		password := updateData.Password
		if err := userService.UpdateUser(user, &password); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to update user",
			})
			return
		}
	} else {
		if err := userService.UpdateUser(user, nil); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to update user",
			})
			return
		}
	}

	c.JSON(http.StatusOK, user.ToResponse())
}

// DeleteUser supprime un utilisateur
func DeleteUser(c *gin.Context) {
	userID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid user ID",
		})
		return
	}

	// Supprimer l'utilisateur
	userService := services.NewUserService(services.DB)
	if err := userService.DeleteUser(strconv.FormatUint(userID, 10)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to delete user",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "User deleted successfully",
	})
}

// ListUsers récupère la liste paginée des utilisateurs avec filtres
func ListUsers(c *gin.Context) {
	// Récupérer les paramètres de pagination
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	// Récupérer les filtres
	filter := services.ListUsersFilter{
		Search:    c.Query("search"),
		SortBy:    c.Query("sort_by"),
		SortOrder: c.Query("sort_order"),
	}

	// Filtre par statut actif/inactif
	isActiveParam := c.Query("is_active")
	if isActiveParam != "" {
		isActive := strings.ToLower(isActiveParam) == "true"
		filter.IsActive = &isActive
	}

	// Récupérer les utilisateurs
	userService := services.NewUserService(services.DB)
	result, err := userService.ListUsers(page, limit, filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to list users",
		})
		return
	}

	// Convertir les utilisateurs en réponses
	var userResponses []*models.UserResponse
	for _, user := range result.Users {
		userResponses = append(userResponses, user.ToResponse())
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"users":       userResponses,
			"total":       result.Total,
			"page":        result.Page,
			"limit":       result.Limit,
			"total_pages": result.TotalPages,
		},
	})
}
