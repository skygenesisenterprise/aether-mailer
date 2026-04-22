package controllers

import (
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/skygenesisenterprise/aether-mailer/server/src/config"
	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
	"github.com/skygenesisenterprise/aether-mailer/server/src/services"
)

// OAuthTokenResponse is an alias for the OAuth-specific TokenResponse
type OAuthTokenResponse struct {
	AccessToken  string `json:"access_token"`
	TokenType    string `json:"token_type"`
	ExpiresIn    int    `json:"expires_in"`
	RefreshToken string `json:"refresh_token,omitempty"`
	IDToken      string `json:"id_token,omitempty"`
	Scope        string `json:"scope,omitempty"`
}

// AuthorizationHandler gère les requêtes d'autorisation OAuth2
func AuthorizationHandler(c *gin.Context) {
	var authReq models.AuthorizationRequest

	if err := c.ShouldBindQuery(&authReq); err != nil {
		c.Redirect(http.StatusFound, buildErrorRedirect(authReq.RedirectURI, "invalid_request", "Invalid request parameters"))
		return
	}

	// Valider le client
	oauthService := services.NewOAuthService(services.DB, services.NewJWTService(config.LoadConfig().JWTSecret, config.LoadConfig().AccessTokenExp, config.LoadConfig().RefreshTokenExp))
	client, err := oauthService.GetClientByID(authReq.ClientID)
	if err != nil {
		c.Redirect(http.StatusFound, buildErrorRedirect(authReq.RedirectURI, "invalid_client", "Invalid client"))
		return
	}

	// Valider la redirection URI
	if !isRedirectURIVailable(authReq.RedirectURI, client.RedirectURIs) {
		c.Redirect(http.StatusFound, buildErrorRedirect(authReq.RedirectURI, "invalid_redirect_uri", "Invalid redirect URI"))
		return
	}

	// Valider le type de réponse
	if authReq.ResponseType != "code" && authReq.ResponseType != "token" {
		c.Redirect(http.StatusFound, buildErrorRedirect(authReq.RedirectURI, "unsupported_response_type", "Unsupported response type"))
		return
	}

	// Valider les scopes
	requestedScopes := services.ParseScopes(authReq.Scope)
	validScopes, err := oauthService.ValidateScopes(requestedScopes, client.Scopes)
	if err != nil {
		c.Redirect(http.StatusFound, buildErrorRedirect(authReq.RedirectURI, "invalid_scope", "Invalid scope"))
		return
	}

	// Vérifier si l'utilisateur est connecté
	userID, isAuthenticated := c.Get("user_id")
	if !isAuthenticated {
		// Rediriger vers la page de login Next.js avec les paramètres OAuth
		params := c.Request.URL.Query()
		params.Set("oauth", "true")
		params.Set("client_id", authReq.ClientID)
		params.Set("redirect_uri", authReq.RedirectURI)
		params.Set("response_type", authReq.ResponseType)
		params.Set("scope", authReq.Scope)
		params.Set("state", authReq.State)

		loginURL := "/login?" + params.Encode()
		c.Redirect(http.StatusFound, loginURL)
		return
	}

	// Pour un vrai système, nous devrions afficher une page de consentement
	// Pour l'instant, nous supposons que l'utilisateur a consenti

	// Créer un code d'autorisation
	authCode, err := services.GenerateRandomString(32)
	if err != nil {
		c.Redirect(http.StatusFound, buildErrorRedirect(authReq.RedirectURI, "server_error", "Failed to generate authorization code"))
		return
	}

	_, err = oauthService.CreateAuthorizationCode(authCode, client.ClientID, fmt.Sprintf("%d", userID), authReq.RedirectURI, validScopes)
	if err != nil {
		c.Redirect(http.StatusFound, buildErrorRedirect(authReq.RedirectURI, "server_error", "Failed to create authorization code"))
		return
	}

	// Construire la réponse
	redirectURL := authReq.RedirectURI + "?code=" + authCode + "&state=" + authReq.State
	if authReq.ResponseType == "token" {
		// Flux implicite (non recommandé pour la production)
		// Rediriger avec le token directement dans l'URL
		redirectURL = buildImplicitFlowRedirect(authReq, uint(userID.(uint)), client, validScopes)
	}

	c.Redirect(http.StatusFound, redirectURL)
}

// TokenHandler gère les requêtes de token OAuth2
func TokenHandler(c *gin.Context) {
	var tokenReq models.TokenRequest

	if err := c.ShouldBind(&tokenReq); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":             "invalid_request",
			"error_description": "Invalid request parameters",
		})
		return
	}

	cfg := config.LoadConfig()
	oauthService := services.NewOAuthService(services.DB, services.NewJWTService(cfg.JWTSecret, cfg.AccessTokenExp, cfg.RefreshTokenExp))

	// Valider le client
	client, err := oauthService.ValidateClient(tokenReq.ClientID, tokenReq.ClientSecret)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":             "invalid_client",
			"error_description": "Invalid client credentials",
		})
		return
	}

	// Traiter selon le type de grant
	switch tokenReq.GrantType {
	case "authorization_code":
		handleAuthorizationCodeGrant(c, tokenReq, client, oauthService)
	case "refresh_token":
		handleRefreshTokenGrant(c, tokenReq, client, oauthService)
	case "password":
		handlePasswordGrant(c, tokenReq, client, oauthService)
	case "client_credentials":
		handleClientCredentialsGrant(c, tokenReq, client, oauthService)
	default:
		c.JSON(http.StatusBadRequest, gin.H{
			"error":             "unsupported_grant_type",
			"error_description": "Unsupported grant type",
		})
	}
}

// UserInfoHandler gère les requêtes d'information utilisateur OpenID Connect
func UserInfoHandler(c *gin.Context) {
	// Extraire et valider le token d'accès
	accessToken := c.GetHeader("Authorization")
	if accessToken == "" || len(accessToken) < 7 || accessToken[:7] != "Bearer " {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":             "invalid_token",
			"error_description": "Invalid authorization token",
		})
		return
	}

	tokenString := accessToken[7:]

	cfg := config.LoadConfig()
	oauthService := services.NewOAuthService(services.DB, services.NewJWTService(cfg.JWTSecret, cfg.AccessTokenExp, cfg.RefreshTokenExp))

	// Valider le token
	token, err := oauthService.ValidateToken(tokenString)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":             "invalid_token",
			"error_description": "Invalid or expired token",
		})
		return
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":             "invalid_token",
			"error_description": "Invalid token claims",
		})
		return
	}

	// Récupérer l'utilisateur
	userService := services.NewUserService(services.DB)
	user, err := userService.GetUserByID(fmt.Sprintf("%d", uint(claims["sub"].(float64))))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":             "user_not_found",
			"error_description": "User not found",
		})
		return
	}

	// Construire la réponse
	familyName := ""
	userInfo := models.UserInfoResponse{
		Sub:           user.ID,
		Name:          user.Name,
		Email:         user.Email,
		EmailVerified: true,
		GivenName:     user.Name,
		FamilyName:    &familyName,
		Roles:         []string{},
	}

	c.JSON(http.StatusOK, userInfo)
}

// RevokeHandler gère les requêtes de révocation de token
func RevokeHandler(c *gin.Context) {
	tokenTypeHint := c.Query("token_type_hint")
	token := c.Query("token")
	clientID := c.Query("client_id")
	clientSecret := c.Query("client_secret")

	if token == "" || clientID == "" || clientSecret == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":             "invalid_request",
			"error_description": "Missing required parameters",
		})
		return
	}

	oauthService := services.NewOAuthService(services.DB, services.NewJWTService(config.LoadConfig().JWTSecret, config.LoadConfig().AccessTokenExp, config.LoadConfig().RefreshTokenExp))

	// Valider le client
	_, err := oauthService.ValidateClient(clientID, clientSecret)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":             "invalid_client",
			"error_description": "Invalid client credentials",
		})
		return
	}

	// Révoquer le token selon son type
	switch tokenTypeHint {
	case "access_token":
		if err := oauthService.RevokeAccessToken(token); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":             "invalid_token",
				"error_description": "Invalid token",
			})
			return
		}
	case "refresh_token":
		if err := oauthService.RevokeRefreshToken(token); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":             "invalid_token",
				"error_description": "Invalid token",
			})
			return
		}
	default:
		// Essayer de révoquer les deux types
		oauthService.RevokeAccessToken(token)
		oauthService.RevokeRefreshToken(token)
	}

	c.Status(http.StatusOK)
}

// handleAuthorizationCodeGrant gère le flux d'autorisation code
func handleAuthorizationCodeGrant(c *gin.Context, tokenReq models.TokenRequest, client *models.OAuthClient, oauthService *services.OAuthService) {
	if tokenReq.Code == "" || tokenReq.RedirectURI == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":             "invalid_request",
			"error_description": "Missing required parameters",
		})
		return
	}

	// Valider la redirection URI
	if !isRedirectURIVailable(tokenReq.RedirectURI, client.RedirectURIs) {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":             "invalid_redirect_uri",
			"error_description": "Invalid redirect URI",
		})
		return
	}

	// Récupérer et valider le code d'autorisation
	authCode, err := oauthService.GetAuthorizationCodeByCode(tokenReq.Code)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":             "invalid_grant",
			"error_description": "Invalid authorization code",
		})
		return
	}

	// Supprimer le code d'autorisation (one-time use)
	oauthService.DeleteAuthorizationCode(tokenReq.Code)

	// Récupérer l'utilisateur
	userService := services.NewUserService(services.DB)
	user, err := userService.GetUserByID(authCode.UserID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":             "invalid_grant",
			"error_description": "Invalid authorization code",
		})
		return
	}

	// Générer les tokens
	accessToken, err := oauthService.GenerateAccessToken(user, client, authCode.Scopes)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":             "server_error",
			"error_description": "Failed to generate access token",
		})
		return
	}

	refreshToken, err := oauthService.GenerateRefreshToken(user.ID, client.ClientID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":             "server_error",
			"error_description": "Failed to generate refresh token",
		})
		return
	}

	// Stocker les tokens en base
	_, err = oauthService.CreateAccessToken(accessToken, client.ClientID, user.ID, authCode.Scopes)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":             "server_error",
			"error_description": "Failed to store access token",
		})
		return
	}

	_, err = oauthService.CreateRefreshToken(refreshToken, client.ClientID, user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":             "server_error",
			"error_description": "Failed to store refresh token",
		})
		return
	}

	// Générer l'ID token pour OpenID Connect
	idToken, err := oauthService.GenerateIDToken(user, client, authCode.Scopes, "")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":             "server_error",
			"error_description": "Failed to generate ID token",
		})
		return
	}

	// Construire la réponse
	response := OAuthTokenResponse{
		AccessToken:  accessToken,
		TokenType:    "Bearer",
		ExpiresIn:    config.LoadConfig().AccessTokenExp,
		RefreshToken: refreshToken,
		IDToken:      idToken,
		Scope:        strings.Join(authCode.Scopes, " "),
	}

	c.JSON(http.StatusOK, response)
}

// handleRefreshTokenGrant gère le flux de rafraîchissement de token
func handleRefreshTokenGrant(c *gin.Context, tokenReq models.TokenRequest, client *models.OAuthClient, oauthService *services.OAuthService) {
	if tokenReq.RefreshToken == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":             "invalid_request",
			"error_description": "Missing refresh token",
		})
		return
	}

	// Valider le refresh token
	refreshToken, err := oauthService.GetRefreshTokenByToken(tokenReq.RefreshToken)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":             "invalid_grant",
			"error_description": "Invalid refresh token",
		})
		return
	}

	// Récupérer l'utilisateur
	userService := services.NewUserService(services.DB)
	user, err := userService.GetUserByID(refreshToken.UserID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":             "invalid_grant",
			"error_description": "Invalid refresh token",
		})
		return
	}

	// Générer un nouveau token d'accès
	accessToken, err := oauthService.GenerateAccessToken(user, client, []string{"openid", "profile", "email"})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":             "server_error",
			"error_description": "Failed to generate access token",
		})
		return
	}

	// Stocker le nouveau token d'accès
	_, err = oauthService.CreateAccessToken(accessToken, client.ClientID, user.ID, []string{"openid", "profile", "email"})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":             "server_error",
			"error_description": "Failed to store access token",
		})
		return
	}

	// Générer un nouvel ID token
	idToken, err := oauthService.GenerateIDToken(user, client, []string{"openid", "profile", "email"}, "")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":             "server_error",
			"error_description": "Failed to generate ID token",
		})
		return
	}

	// Construire la réponse
	response := OAuthTokenResponse{
		AccessToken:  accessToken,
		TokenType:    "Bearer",
		ExpiresIn:    config.LoadConfig().AccessTokenExp,
		RefreshToken: tokenReq.RefreshToken, // Retourner le même refresh token
		IDToken:      idToken,
		Scope:        "openid profile email",
	}

	c.JSON(http.StatusOK, response)
}

// handlePasswordGrant gère le flux de mot de passe
func handlePasswordGrant(c *gin.Context, tokenReq models.TokenRequest, client *models.OAuthClient, oauthService *services.OAuthService) {
	if tokenReq.Username == "" || tokenReq.Password == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":             "invalid_request",
			"error_description": "Missing username or password",
		})
		return
	}

	// Authentifier l'utilisateur
	userService := services.NewUserService(services.DB)
	user, err := userService.AuthenticateUser(tokenReq.Username, tokenReq.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":             "invalid_grant",
			"error_description": "Invalid username or password",
		})
		return
	}

	// Générer les tokens
	accessToken, err := oauthService.GenerateAccessToken(user, client, []string{"openid", "profile", "email"})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":             "server_error",
			"error_description": "Failed to generate access token",
		})
		return
	}

	refreshToken, err := oauthService.GenerateRefreshToken(user.ID, client.ClientID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":             "server_error",
			"error_description": "Failed to generate refresh token",
		})
		return
	}

	// Stocker les tokens
	_, err = oauthService.CreateAccessToken(accessToken, client.ClientID, user.ID, []string{"openid", "profile", "email"})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":             "server_error",
			"error_description": "Failed to store access token",
		})
		return
	}

	_, err = oauthService.CreateRefreshToken(refreshToken, client.ClientID, user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":             "server_error",
			"error_description": "Failed to store refresh token",
		})
		return
	}

	// Générer l'ID token
	idToken, err := oauthService.GenerateIDToken(user, client, []string{"openid", "profile", "email"}, "")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":             "server_error",
			"error_description": "Failed to generate ID token",
		})
		return
	}

	// Construire la réponse
	response := OAuthTokenResponse{
		AccessToken:  accessToken,
		TokenType:    "Bearer",
		ExpiresIn:    config.LoadConfig().AccessTokenExp,
		RefreshToken: refreshToken,
		IDToken:      idToken,
		Scope:        "openid profile email",
	}

	c.JSON(http.StatusOK, response)
}

// handleClientCredentialsGrant gère le flux client credentials
func handleClientCredentialsGrant(c *gin.Context, tokenReq models.TokenRequest, client *models.OAuthClient, oauthService *services.OAuthService) {
	// Générer un token d'accès pour le client
	accessToken, err := oauthService.GenerateAccessToken(nil, client, []string{"api"})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":             "server_error",
			"error_description": "Failed to generate access token",
		})
		return
	}

	// Stocker le token
	_, err = oauthService.CreateAccessToken(accessToken, client.ClientID, "", []string{"api"})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":             "server_error",
			"error_description": "Failed to store access token",
		})
		return
	}

	// Construire la réponse
	response := OAuthTokenResponse{
		AccessToken: accessToken,
		TokenType:   "Bearer",
		ExpiresIn:   config.LoadConfig().AccessTokenExp,
		Scope:       "api",
	}

	c.JSON(http.StatusOK, response)
}

// buildErrorRedirect construit une URL de redirection avec une erreur
func buildErrorRedirect(redirectURI, errorType, errorDescription string) string {
	return redirectURI + "?error=" + errorType + "&error_description=" + url.QueryEscape(errorDescription)
}

// buildImplicitFlowRedirect construit une URL de redirection pour le flux implicite
func buildImplicitFlowRedirect(authReq models.AuthorizationRequest, userID uint, client *models.OAuthClient, scopes []string) string {
	cfg := config.LoadConfig()
	oauthService := services.NewOAuthService(services.DB, services.NewJWTService(cfg.JWTSecret, cfg.AccessTokenExp, cfg.RefreshTokenExp))

	userService := services.NewUserService(services.DB)
	user, _ := userService.GetUserByID(fmt.Sprintf("%d", userID))

	// Générer le token d'accès
	accessToken, _ := oauthService.GenerateAccessToken(user, client, scopes)

	// Générer l'ID token
	idToken, _ := oauthService.GenerateIDToken(user, client, scopes, authReq.Nonce)

	return authReq.RedirectURI + "#access_token=" + accessToken + "&token_type=Bearer&expires_in=" + strconv.Itoa(cfg.AccessTokenExp) + "&id_token=" + idToken + "&state=" + authReq.State
}

// isRedirectURIVailable vérifie si la redirection URI est autorisée
func isRedirectURIVailable(redirectURI string, allowedURIs []string) bool {
	for _, uri := range allowedURIs {
		if uri == redirectURI {
			return true
		}
	}
	return false
}
