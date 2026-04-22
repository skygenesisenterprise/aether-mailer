package controllers

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
	"github.com/skygenesisenterprise/aether-mailer/server/src/services"
)

// CreateDomainRequest représente une requête de création de domaine
type CreateDomainRequest struct {
	Name        string `json:"name" binding:"required"`
	DisplayName string `json:"displayName" binding:"required"`
	IsInternal  bool   `json:"isInternal"`
	OwnerID     *uint  `json:"ownerId,omitempty"`
	OwnerType   string `json:"ownerType"`
	Notes       string `json:"notes,omitempty"`
}

// DomainResponse représente une réponse de domaine
type DomainResponse struct {
	ID             string `json:"id"`
	Name           string `json:"name"`
	DisplayName    string `json:"displayName"`
	IsInternal     bool   `json:"isInternal"`
	IsActive       bool   `json:"isActive"`
	OrganizationID string `json:"organizationId,omitempty"`
	CreatedAt      string `json:"createdAt"`
	UpdatedAt      string `json:"updatedAt"`
	UserCount      int    `json:"userCount"`
	IsVerified     bool   `json:"isVerified"`
}

// CreateDomain crée un nouveau domaine
func CreateDomain(c *gin.Context) {
	var req CreateDomainRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
		})
		return
	}

	domainService := services.NewDomainService(services.DB)

	// Créer le domaine
	displayName := req.DisplayName
	notes := req.Notes
	domain := &models.Domain{
		Name:           req.Name,
		DisplayName:    &displayName,
		IsInternal:     req.IsInternal,
		IsActive:       true,
		OrganizationID: fmt.Sprintf("%d", *req.OwnerID),
		Notes:          &notes,
	}

	if err := domainService.CreateDomain(domain); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Récupérer le nombre d'utilisateurs (sera 0 pour un nouveau domaine)
	userCount, _ := domainService.GetDomainUserCount(domain.ID)

	response := DomainResponse{
		ID:             domain.ID,
		Name:           domain.Name,
		DisplayName:    *domain.DisplayName,
		IsInternal:     domain.IsInternal,
		IsActive:       domain.IsActive,
		OrganizationID: domain.OrganizationID,
		CreatedAt:      domain.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt:      domain.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UserCount:      userCount,
		IsVerified:     false, // Nouveau domaine non vérifié
	}

	c.JSON(http.StatusCreated, response)
}

// GetDomain récupère un domaine par son ID
func GetDomain(c *gin.Context) {
	domainID := c.Param("domainId")

	domainService := services.NewDomainService(services.DB)

	domain, err := domainService.GetDomainByID(domainID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Domain not found",
		})
		return
	}

	userCount, _ := domainService.GetDomainUserCount(domainID)

	response := DomainResponse{
		ID:             domain.ID,
		Name:           domain.Name,
		DisplayName:    *domain.DisplayName,
		IsInternal:     domain.IsInternal,
		IsActive:       domain.IsActive,
		OrganizationID: domain.OrganizationID,
		CreatedAt:      domain.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt:      domain.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UserCount:      userCount,
		IsVerified:     domain.VerifiedAt != nil,
	}

	c.JSON(http.StatusOK, response)
}

// ListDomains liste tous les domaines
func ListDomains(c *gin.Context) {
	domainService := services.NewDomainService(services.DB)

	domains, err := domainService.ListDomains()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to list domains",
		})
		return
	}

	var responses []DomainResponse
	for _, domain := range domains {
		userCount, _ := domainService.GetDomainUserCount(domain.ID)

		responses = append(responses, DomainResponse{
			ID:             domain.ID,
			Name:           domain.Name,
			DisplayName:    *domain.DisplayName,
			IsInternal:     domain.IsInternal,
			IsActive:       domain.IsActive,
			OrganizationID: domain.OrganizationID,
			CreatedAt:      domain.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
			UpdatedAt:      domain.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
			UserCount:      userCount,
			IsVerified:     domain.VerifiedAt != nil,
		})
	}

	c.JSON(http.StatusOK, responses)
}

// UpdateDomain met à jour un domaine
func UpdateDomain(c *gin.Context) {
	domainID := c.Param("domainId")
	var req CreateDomainRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
		})
		return
	}

	domainService := services.NewDomainService(services.DB)

	id := 0
	fmt.Sscanf(domainID, "%d", &id)

	// Récupérer le domaine existant
	domain, err := domainService.GetDomainByID(domainID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Domain not found",
		})
		return
	}

	// Mettre à jour les champs
	domain.DisplayName = &req.DisplayName
	domain.IsActive = true // Toujours actif sauf si explicitement désactivé
	domain.Notes = &req.Notes

	if err := domainService.UpdateDomain(domain); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update domain",
		})
		return
	}

	userCount, _ := domainService.GetDomainUserCount(domainID)

	response := DomainResponse{
		ID:             domain.ID,
		Name:           domain.Name,
		DisplayName:    *domain.DisplayName,
		IsInternal:     domain.IsInternal,
		IsActive:       domain.IsActive,
		OrganizationID: domain.OrganizationID,
		CreatedAt:      domain.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt:      domain.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UserCount:      userCount,
		IsVerified:     domain.VerifiedAt != nil,
	}

	c.JSON(http.StatusOK, response)
}

// DeleteDomain supprime un domaine
func DeleteDomain(c *gin.Context) {
	domainID := c.Param("domainId")

	domainService := services.NewDomainService(services.DB)

	id := 0
	fmt.Sscanf(domainID, "%d", &id)

	// Vérifier si le domaine est interne (ne peut pas être supprimé)
	domain, err := domainService.GetDomainByID(domainID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Domain not found",
		})
		return
	}

	if domain.IsInternal {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Cannot delete internal domain",
		})
		return
	}

	if err := domainService.DeleteDomain(domainID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to delete domain",
		})
		return
	}

	c.Status(http.StatusNoContent)
}

// VerifyDomain vérifie un domaine
func VerifyDomain(c *gin.Context) {
	domainID := c.Param("domainId")
	var req struct {
		Method string `json:"method" binding:"required"`
		Value  string `json:"value" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
		})
		return
	}

	domainService := services.NewDomainService(services.DB)

	id := 0
	fmt.Sscanf(domainID, "%d", &id)

	if err := domainService.VerifyDomain(domainID, req.Method, req.Value); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to verify domain",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Domain verified successfully",
	})
}

// GetDomainUsers récupère les utilisateurs d'un domaine
func GetDomainUsers(c *gin.Context) {
	domainID := c.Param("domainId")

	domainService := services.NewDomainService(services.DB)
	userService := services.NewUserService(services.DB)

	id := 0
	fmt.Sscanf(domainID, "%d", &id)

	users, err := domainService.GetUsersByDomain(domainID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get domain users",
		})
		return
	}

	var userResponses []interface{}
	for _, user := range users {
		userResponses = append(userResponses, userService.UserToResponse(&user))
	}

	c.JSON(http.StatusOK, userResponses)
}

// AddUserToDomain ajoute un utilisateur à un domaine
func AddUserToDomain(c *gin.Context) {
	domainID := c.Param("domainId")
	var req struct {
		UserID  uint `json:"userId" binding:"required"`
		IsAdmin bool `json:"isAdmin"`
		IsOwner bool `json:"isOwner"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
		})
		return
	}

	domainService := services.NewDomainService(services.DB)

	domainIDInt := 0
	fmt.Sscanf(domainID, "%d", &domainIDInt)

	if err := domainService.AddUserToDomain(domainID, fmt.Sprintf("%d", req.UserID), req.IsAdmin, req.IsOwner); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to add user to domain",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "User added to domain successfully",
	})
}

// RemoveUserFromDomain retire un utilisateur d'un domaine
func RemoveUserFromDomain(c *gin.Context) {
	domainID := c.Param("domainId")
	userID := c.Param("userId")

	domainService := services.NewDomainService(services.DB)

	domainIDInt := 0
	fmt.Sscanf(domainID, "%d", &domainIDInt)
	userIDInt := 0
	fmt.Sscanf(userID, "%d", &userIDInt)

	if err := domainService.RemoveUserFromDomain(domainID, userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to remove user from domain",
		})
		return
	}

	c.Status(http.StatusNoContent)
}

// GetDomainDetails récupère les détails complets d'un domaine
func GetDomainDetails(c *gin.Context) {
	domainID := c.Param("domainId")

	domainService := services.NewDomainService(services.DB)

	id := 0
	fmt.Sscanf(domainID, "%d", &id)

	domainDetails, err := domainService.GetDomainWithDetails(domainID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Domain not found",
		})
		return
	}

	c.JSON(http.StatusOK, domainDetails)
}

// CheckEmailDomain vérifie si une adresse email appartient à un domaine géré
func CheckEmailDomain(c *gin.Context) {
	email := c.Query("email")

	if email == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Email parameter is required",
		})
		return
	}

	domainService := services.NewDomainService(services.DB)

	isManaged, domain, err := domainService.IsEmailFromManagedDomain(email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to check email domain",
		})
		return
	}

	if !isManaged {
		c.JSON(http.StatusOK, gin.H{
			"isManaged": false,
		})
		return
	}

	response := gin.H{
		"isManaged": true,
		"domain": gin.H{
			"id":   domain.ID,
			"name": domain.Name,
		},
	}

	c.JSON(http.StatusOK, response)
}
