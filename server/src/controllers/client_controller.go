package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
	"github.com/skygenesisenterprise/aether-mailer/server/src/services"
)

// CreateClientRequest représente une requête de création de client

type CreateClientRequest struct {
	Name         string   `json:"name" binding:"required"`
	RedirectURIs []string `json:"redirectUris" binding:"required"`
	Scopes       []string `json:"scopes" binding:"required"`
	GrantTypes   []string `json:"grantTypes" binding:"required"`
}

// ClientResponse représente une réponse de client
type ClientResponse struct {
	ID           string   `json:"id"`
	ClientID     string   `json:"clientId"`
	ClientSecret string   `json:"clientSecret"`
	Name         string   `json:"name"`
	RedirectURIs []string `json:"redirectUris"`
	Scopes       []string `json:"scopes"`
	GrantTypes   []string `json:"grantTypes"`
}

// CreateClient crée un nouveau client OAuth
func CreateClient(c *gin.Context) {
	var req CreateClientRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
		})
		return
	}

	// Générer un client ID et secret uniques
	clientID, err := services.GenerateRandomString(32)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to generate client ID",
		})
		return
	}

	clientSecret, err := services.GenerateRandomString(64)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to generate client secret",
		})
		return
	}

	// Créer le client
	oauthService := services.NewOAuthService(services.DB, services.NewJWTService(
		"test-secret-key", // À remplacer par la clé réelle
		15,
		720,
	))

	client := &models.OAuthClient{
		ClientID:     clientID,
		ClientSecret: clientSecret,
		Name:         req.Name,
		RedirectURIs: req.RedirectURIs,
		Scopes:       req.Scopes,
		GrantTypes:   req.GrantTypes,
	}

	if err := oauthService.CreateClient(client); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create client",
		})
		return
	}

	// Retourner la réponse
	response := ClientResponse{
		ID:           client.ID,
		ClientID:     client.ClientID,
		ClientSecret: client.ClientSecret,
		Name:         client.Name,
		RedirectURIs: client.RedirectURIs,
		Scopes:       client.Scopes,
		GrantTypes:   client.GrantTypes,
	}

	c.JSON(http.StatusCreated, response)
}

// GetClient récupère un client par son ID
func GetClient(c *gin.Context) {
	clientID := c.Param("clientId")

	oauthService := services.NewOAuthService(services.DB, services.NewJWTService(
		"test-secret-key", // À remplacer par la clé réelle
		15,
		720,
	))

	client, err := oauthService.GetClientByID(clientID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Client not found",
		})
		return
	}

	response := ClientResponse{
		ID:           client.ID,
		ClientID:     client.ClientID,
		ClientSecret: "*****", // Masquer le secret pour la sécurité
		Name:         client.Name,
		RedirectURIs: client.RedirectURIs,
		Scopes:       client.Scopes,
		GrantTypes:   client.GrantTypes,
	}

	c.JSON(http.StatusOK, response)
}

// ListClients liste tous les clients
func ListClients(c *gin.Context) {
	var clients []models.OAuthClient

	if err := services.DB.Find(&clients).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to list clients",
		})
		return
	}

	var responses []ClientResponse
	for _, client := range clients {
		responses = append(responses, ClientResponse{
			ID:           client.ID,
			ClientID:     client.ClientID,
			ClientSecret: "*****", // Masquer le secret pour la sécurité
			Name:         client.Name,
			RedirectURIs: client.RedirectURIs,
			Scopes:       client.Scopes,
			GrantTypes:   client.GrantTypes,
		})
	}

	c.JSON(http.StatusOK, responses)
}

// UpdateClient met à jour un client existant
func UpdateClient(c *gin.Context) {
	clientID := c.Param("clientId")
	var req CreateClientRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
		})
		return
	}

	oauthService := services.NewOAuthService(services.DB, services.NewJWTService(
		"test-secret-key", // À remplacer par la clé réelle
		15,
		720,
	))

	// Récupérer le client existant
	client, err := oauthService.GetClientByID(clientID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Client not found",
		})
		return
	}

	// Mettre à jour les champs
	client.Name = req.Name
	client.RedirectURIs = req.RedirectURIs
	client.Scopes = req.Scopes
	client.GrantTypes = req.GrantTypes

	if err := services.DB.Save(client).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update client",
		})
		return
	}

	response := ClientResponse{
		ID:           client.ID,
		ClientID:     client.ClientID,
		ClientSecret: "*****", // Masquer le secret pour la sécurité
		Name:         client.Name,
		RedirectURIs: client.RedirectURIs,
		Scopes:       client.Scopes,
		GrantTypes:   client.GrantTypes,
	}

	c.JSON(http.StatusOK, response)
}

// RotateClientSecret fait tourner le secret client
func RotateClientSecret(c *gin.Context) {
	clientID := c.Param("clientId")

	oauthService := services.NewOAuthService(services.DB, services.NewJWTService(
		"test-secret-key", // À remplacer par la clé réelle
		15,
		720,
	))

	// Récupérer le client existant
	client, err := oauthService.GetClientByID(clientID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Client not found",
		})
		return
	}

	// Générer un nouveau secret
	newSecret, err := services.GenerateRandomString(64)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to generate new client secret",
		})
		return
	}

	// Mettre à jour le secret
	client.ClientSecret = newSecret
	if err := services.DB.Save(client).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update client secret",
		})
		return
	}

	response := ClientResponse{
		ID:           client.ID,
		ClientID:     client.ClientID,
		ClientSecret: newSecret,
		Name:         client.Name,
		RedirectURIs: client.RedirectURIs,
		Scopes:       client.Scopes,
		GrantTypes:   client.GrantTypes,
	}

	c.JSON(http.StatusOK, response)
}

// DeleteClient supprime un client
func DeleteClient(c *gin.Context) {
	clientID := c.Param("clientId")

	oauthService := services.NewOAuthService(services.DB, services.NewJWTService(
		"test-secret-key", // À remplacer par la clé réelle
		15,
		720,
	))

	// Récupérer le client existant
	client, err := oauthService.GetClientByID(clientID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Client not found",
		})
		return
	}

	// Supprimer le client
	if err := services.DB.Delete(client).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to delete client",
		})
		return
	}

	c.Status(http.StatusNoContent)
}
