package controllers

import (
	"fmt"
	"net/http"
	"os"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/skygenesisenterprise/aether-mailer/server/src/config"
	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
	"github.com/skygenesisenterprise/aether-mailer/server/src/services"
)

func uintFromStringPtr(s *string) uint {
	if s == nil {
		return 0
	}
	val, _ := strconv.ParseUint(*s, 10, 32)
	return uint(val)
}

// ExternalAuthController gère les endpoints OAuth externes
type ExternalAuthController struct {
	externalAuthService *services.ExternalAuthService
	oauthService        *services.OAuthService
	jwtService          *services.JWTService
	userService         *services.UserService
}

// NewExternalAuthController crée une nouvelle instance du contrôleur
func NewExternalAuthController() *ExternalAuthController {
	encryptKey := os.Getenv("OAUTH_ENCRYPT_KEY")
	if encryptKey == "" {
		encryptKey = config.LoadConfig().JWTSecret // Fallback sur JWTSecret
	}

	cfg := config.LoadConfig()

	return &ExternalAuthController{
		externalAuthService: services.NewExternalAuthService(services.DB, encryptKey),
		oauthService:        services.NewOAuthService(services.DB, services.NewJWTService(cfg.JWTSecret, cfg.AccessTokenExp, cfg.RefreshTokenExp)),
		jwtService:          services.NewJWTService(cfg.JWTSecret, cfg.AccessTokenExp, cfg.RefreshTokenExp),
		userService:         services.NewUserService(services.DB),
	}
}

// InitiateOAuthRequest représente la requête d'initiation OAuth
type InitiateOAuthRequest struct {
	Provider string `json:"provider" binding:"required,oneof=github google microsoft discord"`
	Action   string `json:"action" binding:"required,oneof=login link"`
}

// InitiateOAuth initie le flux OAuth avec un provider externe
func (ctrl *ExternalAuthController) InitiateOAuth(c *gin.Context) {
	provider := c.Param("provider")
	action := c.Query("action")
	if action == "" {
		action = "login"
	}

	// Vérifier si le provider est configuré
	if !ctrl.externalAuthService.Config.IsProviderEnabled(provider) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Provider not configured"})
		return
	}

	// Récupérer l'userID si l'utilisateur est déjà authentifié (pour le linking)
	var userID *uint
	if action == "link" {
		if id, exists := c.Get("user_id"); exists {
			uid := id.(uint)
			userID = &uid
		} else {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required for account linking"})
			return
		}
	}

	// Générer l'URL OAuth
	authURL, state, err := ctrl.externalAuthService.GenerateOAuthURL(provider, action, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate OAuth URL"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"auth_url": authURL,
		"state":    state,
	})
}

// HandleOAuthCallback gère le callback OAuth des providers externes
func (ctrl *ExternalAuthController) HandleOAuthCallback(c *gin.Context) {
	provider := c.Param("provider")
	code := c.Query("code")
	state := c.Query("state")
	errorMsg := c.Query("error")

	// Vérifier s'il y a une erreur du provider
	if errorMsg != "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":             "OAuth error",
			"error_description": c.Query("error_description"),
		})
		return
	}

	// Valider le state
	oauthState, err := ctrl.externalAuthService.ValidateOAuthState(state)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid or expired state"})
		return
	}

	// Échanger le code contre des tokens
	tokenResult, err := ctrl.externalAuthService.ExchangeCode(provider, code)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to exchange code", "details": err.Error()})
		return
	}

	// Récupérer les informations utilisateur
	userInfo, err := ctrl.externalAuthService.GetUserInfo(provider, tokenResult.AccessToken)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to get user info", "details": err.Error()})
		return
	}

	// Traiter selon l'action
	if oauthState.Action == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid action"})
		return
	}

	switch *oauthState.Action {
	case "login":
		ctrl.handleLoginOAuth(c, provider, userInfo, tokenResult)
	case "link":
		userIDVal := uintFromStringPtr(oauthState.UserID)
		userID := &userIDVal
		ctrl.handleLinkOAuth(c, provider, userID, userInfo, tokenResult)
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid action"})
	}
}

// handleLoginOAuth gère la connexion via OAuth
func (ctrl *ExternalAuthController) handleLoginOAuth(c *gin.Context, provider string, userInfo *models.ProviderUserInfo, tokenResult *services.TokenExchangeResult) {
	// Chercher ou créer l'utilisateur
	user, isNew, err := ctrl.externalAuthService.FindOrCreateUser(provider, userInfo)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process user", "details": err.Error()})
		return
	}

	// Générer les tokens JWT
	client := &models.OAuthClient{
		ClientID: "external_auth",
	}

	accessToken, err := ctrl.oauthService.GenerateAccessToken(user, client, []string{"openid", "profile", "email"})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate access token"})
		return
	}

	refreshToken, err := ctrl.oauthService.GenerateRefreshToken(user.ID, client.ClientID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate refresh token"})
		return
	}

	// Stocker les tokens
	_, err = ctrl.oauthService.CreateAccessToken(accessToken, client.ClientID, user.ID, []string{"openid", "profile", "email"})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to store access token"})
		return
	}

	_, err = ctrl.oauthService.CreateRefreshToken(refreshToken, client.ClientID, user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to store refresh token"})
		return
	}

	// Générer l'ID token
	idToken, err := ctrl.oauthService.GenerateIDToken(user, client, []string{"openid", "profile", "email"}, "")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate ID token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"access_token":  accessToken,
		"refresh_token": refreshToken,
		"id_token":      idToken,
		"token_type":    "Bearer",
		"expires_in":    config.LoadConfig().AccessTokenExp,
		"user":          user.ToResponse(),
		"is_new":        isNew,
		"provider":      provider,
	})
}

// handleLinkOAuth gère le liaison d'un compte externe
func (ctrl *ExternalAuthController) handleLinkOAuth(c *gin.Context, provider string, userID *uint, userInfo *models.ProviderUserInfo, tokenResult *services.TokenExchangeResult) {
	if userID == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User ID required for linking"})
		return
	}

	// Lier le compte
	err := ctrl.externalAuthService.LinkExternalAccount(fmt.Sprintf("%d", *userID), provider, userInfo, tokenResult)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to link account", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  "Account linked successfully",
		"provider": provider,
	})
}

// GetLinkedAccounts retourne les comptes externes liés à l'utilisateur
func (ctrl *ExternalAuthController) GetLinkedAccounts(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	accounts, err := ctrl.externalAuthService.GetUserExternalAccounts(userID.(uint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get linked accounts"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"accounts": accounts,
	})
}

// UnlinkAccount supprime le lien avec un compte externe
func (ctrl *ExternalAuthController) UnlinkAccount(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	provider := c.Param("provider")

	err := ctrl.externalAuthService.UnlinkExternalAccount(fmt.Sprintf("%d", userID.(uint)), provider)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  "Account unlinked successfully",
		"provider": provider,
	})
}

// GetEnabledProviders retourne la liste des providers OAuth configurés
func (ctrl *ExternalAuthController) GetEnabledProviders(c *gin.Context) {
	providers := ctrl.externalAuthService.Config.GetEnabledProviders()

	// Construire les URLs d'autorisation pour chaque provider
	providerConfigs := make([]gin.H, len(providers))
	for i, provider := range providers {
		config := ctrl.externalAuthService.Config.GetProviderConfig(provider)
		if config != nil {
			providerConfigs[i] = gin.H{
				"name":     provider,
				"auth_url": config.AuthURL,
				"scopes":   config.Scopes,
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"providers": providerConfigs,
	})
}

// RedirectToOAuth redirige directement vers le provider OAuth
func (ctrl *ExternalAuthController) RedirectToOAuth(c *gin.Context) {
	provider := c.Param("provider")
	action := c.Query("action")
	if action == "" {
		action = "login"
	}

	// Vérifier si le provider est configuré
	if !ctrl.externalAuthService.Config.IsProviderEnabled(provider) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Provider not configured"})
		return
	}

	// Récupérer l'userID si l'utilisateur est déjà authentifié (pour le linking)
	var userID *uint
	if action == "link" {
		if id, exists := c.Get("user_id"); exists {
			uid := id.(uint)
			userID = &uid
		} else {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required for account linking"})
			return
		}
	}

	// Générer l'URL OAuth
	authURL, _, err := ctrl.externalAuthService.GenerateOAuthURL(provider, action, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate OAuth URL"})
		return
	}

	c.Redirect(http.StatusFound, authURL)
}

// GetMigrationStatus retourne le statut de la migration des comptes externes
func (ctrl *ExternalAuthController) GetMigrationStatus(c *gin.Context) {
	status := ctrl.externalAuthService.GetMigrationStatus()
	c.JSON(http.StatusOK, status)
}

// MigrateExternalAccounts exécute la migration des comptes externes (Discord)
func (ctrl *ExternalAuthController) MigrateExternalAccounts(c *gin.Context) {
	err := ctrl.externalAuthService.MigrateDiscordAccounts()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Migration failed", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Migration completed successfully"})
}
