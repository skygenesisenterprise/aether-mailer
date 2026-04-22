package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
	"github.com/skygenesisenterprise/aether-mailer/server/src/services"
)

// CreateUserRequest représente les données pour créer un utilisateur (admin)
type CreateUserRequest struct {
	Name     string `json:"name" binding:"required"`
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
	Role     string `json:"role"`     // Optionnel, défaut: "user"
	IsActive bool   `json:"isActive"` // Optionnel, défaut: true
}

// CreateUserAdmin permet aux admins de créer des utilisateurs
func CreateUserAdmin(c *gin.Context) {
	var req CreateUserRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request body",
		})
		return
	}

	// Valider les entrées
	validationErrors := make(map[string]string)

	if err := services.ValidateName(req.Name); err != nil {
		validationErrors["name"] = err.Error()
	}

	if err := services.ValidateEmail(req.Email); err != nil {
		validationErrors["email"] = err.Error()
	}

	if err := services.ValidatePassword(req.Password); err != nil {
		validationErrors["password"] = err.Error()
	}

	// Définir le rôle par défaut
	role := req.Role
	if role == "" {
		role = "user"
	}

	// Valider que le rôle est valide
	validRoles := []string{"user", "admin", "moderator"}
	isValidRole := false
	for _, r := range validRoles {
		if r == role {
			isValidRole = true
			break
		}
	}
	if !isValidRole {
		validationErrors["role"] = "Invalid role. Must be: user, admin, or moderator"
	}

	if len(validationErrors) > 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Validation failed",
			"fields":  validationErrors,
		})
		return
	}

	// Nettoyer les données
	req.Name = services.SanitizeName(req.Name)
	req.Email = services.SanitizeEmail(req.Email)

	// Vérifier si l'email existe déjà
	userService := services.NewUserService(services.DB)
	if userService.CheckEmailExists(req.Email) {
		c.JSON(http.StatusConflict, gin.H{
			"success": false,
			"error":   "Email already exists",
			"fields":  map[string]string{"email": "This email is already registered"},
		})
		return
	}

	// Créer l'utilisateur
	name := req.Name
	email := req.Email
	user := &models.User{
		Name:     &name,
		Email:    &email,
		IsActive: req.IsActive,
	}

	if err := userService.CreateUser(user, req.Password); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to create user: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "User created successfully",
		"user":    user.ToResponse(),
	})
}

// CheckEmailAvailability vérifie si un email est disponible
func CheckEmailAvailability(c *gin.Context) {
	email := c.Query("email")
	if email == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Email parameter is required",
		})
		return
	}

	// Valider le format de l'email
	if err := services.ValidateEmail(email); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success":   false,
			"error":     "Invalid email format",
			"available": false,
		})
		return
	}

	email = services.SanitizeEmail(email)

	userService := services.NewUserService(services.DB)
	exists := userService.CheckEmailExists(email)

	c.JSON(http.StatusOK, gin.H{
		"success":   true,
		"available": !exists,
		"email":     email,
	})
}

// GetCurrentUser récupère l'utilisateur connecté
func GetCurrentUser(c *gin.Context) {
	userID, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "User not authenticated",
		})
		return
	}

	userService := services.NewUserService(services.DB)
	user, err := userService.GetUserByID(userID.(string))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "User not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"user":    user.ToResponse(),
	})
}
