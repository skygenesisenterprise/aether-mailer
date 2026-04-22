package controllers

import (
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/skygenesisenterprise/aether-mailer/server/src/config"
	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
	"github.com/skygenesisenterprise/aether-mailer/server/src/services"
)

// LoginResponse représente la réponse de connexion avec redirection
type LoginResponse struct {
	Success      bool        `json:"success"`
	AccessToken  string      `json:"accessToken,omitempty"`
	RefreshToken string      `json:"refreshToken,omitempty"`
	ExpiresIn    int         `json:"expiresIn,omitempty"`
	User         *models.User `json:"user,omitempty"`
	Redirect     string      `json:"redirect,omitempty"`
}

// RegisterResponse représente la réponse d'inscription
type RegisterResponse struct {
	Success      bool                `json:"success"`
	Message      string              `json:"message,omitempty"`
	AccessToken  string              `json:"accessToken,omitempty"`
	RefreshToken string              `json:"refreshToken,omitempty"`
	ExpiresIn    int                 `json:"expiresIn,omitempty"`
	User         *models.UserResponse `json:"user,omitempty"`
}

// ValidationErrorResponse représente une erreur de validation
type ValidationErrorResponse struct {
	Success bool              `json:"success"`
	Error   string            `json:"error"`
	Fields  map[string]string `json:"fields,omitempty"`
}

// Login gère la connexion des utilisateurs avec support des redirections personnalisées
func Login(c *gin.Context) {
	var loginData models.LoginRequest

	if err := c.ShouldBindJSON(&loginData); err != nil {
		c.JSON(http.StatusBadRequest, ValidationErrorResponse{
			Success: false,
			Error:   "Invalid request body",
		})
		return
	}

	// Valider le format de l'email
	if err := services.ValidateEmail(loginData.Email); err != nil {
		c.JSON(http.StatusBadRequest, ValidationErrorResponse{
			Success: false,
			Error:   "Invalid email format",
			Fields:  map[string]string{"email": err.Error()},
		})
		return
	}

	// Authentifier l'utilisateur
	userService := services.NewUserService(services.DB)
	user, err := userService.AuthenticateUser(loginData.Email, loginData.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "Invalid email or password",
		})
		return
	}

	// Vérifier que le compte est actif
	if !user.IsActive {
		c.JSON(http.StatusForbidden, gin.H{
			"success": false,
			"error":   "Account is inactive. Please contact support.",
		})
		return
	}

	// Générer les tokens JWT
	cfg := config.LoadConfig()
	jwtService := services.NewJWTService(cfg.JWTSecret, cfg.AccessTokenExp, cfg.RefreshTokenExp)
	accessToken, err := jwtService.GenerateToken(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to generate access token",
		})
		return
	}

	refreshTokenString, err := jwtService.GenerateRefreshToken(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to generate refresh token",
		})
		return
	}

	// Stocker le refresh token en base
	emailService := services.NewEmailService(services.DB)
	_, err = emailService.CreateRefreshToken(user.ID, refreshTokenString)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to store refresh token",
		})
		return
	}

	// Déterminer l'origine de la requête pour la configuration des cookies
	origin := c.GetHeader("Origin")
	isLocalhost := isLocalhostRequest(origin)

	// Déterminer l'URL de redirection personnalisée
	redirectURL := determineRedirectURL(loginData, cfg)

	// Set cookies HTTPOnly pour le token d'accès et le refresh
	// En localhost, on désactive Secure pour permettre les cookies non-HTTPS
	ExpiresAccess := time.Now().Add(time.Duration(cfg.AccessTokenExp) * time.Minute)
	ExpiresRefresh := time.Now().Add(time.Duration(cfg.RefreshTokenExp) * time.Minute)

	http.SetCookie(c.Writer, &http.Cookie{
		Name:     "AETHER_ACCESS_TOKEN",
		Value:    accessToken,
		Path:     "/",
		HttpOnly: true,
		Secure:   !isLocalhost, // Désactivé en localhost
		SameSite: http.SameSiteLaxMode,
		Expires:  ExpiresAccess,
	})
	http.SetCookie(c.Writer, &http.Cookie{
		Name:     "AETHER_REFRESH_TOKEN",
		Value:    refreshTokenString,
		Path:     "/",
		HttpOnly: true,
		Secure:   !isLocalhost, // Désactivé en localhost
		SameSite: http.SameSiteLaxMode,
		Expires:  ExpiresRefresh,
	})

	// Retourner la réponse avec redirection
	c.JSON(http.StatusOK, LoginResponse{
		Success:      true,
		AccessToken:  accessToken,
		RefreshToken: refreshTokenString,
		ExpiresIn:    cfg.AccessTokenExp,
		User:         user,
		Redirect:     redirectURL,
	})
}

// determineRedirectURL calcule l'URL de redirection post-login
func determineRedirectURL(loginData models.LoginRequest, cfg *config.Config) string {
	// Priorité 1: RedirectURI spécifié explicitement
	if loginData.RedirectURI != "" {
		return loginData.RedirectURI
	}

	// Priorité 2: Client OAuth avec redirection personnalisée
	if loginData.ClientID != "" && services.DB != nil {
		oauthService := services.NewOAuthService(services.DB, nil)
		if client, err := oauthService.GetClientByID(loginData.ClientID); err == nil {
			// Construire l'URL de redirection avec le chemin personnalisé
			postLoginPath := loginData.PostLoginPath
			if postLoginPath == "" {
				postLoginPath = client.PostLoginPath
			}
			if postLoginPath == "" {
				postLoginPath = cfg.DefaultPostLoginPath
			}

			// Utiliser la première origine autorisée du client comme base
			if len(client.AllowedOrigins) > 0 {
				baseURL := client.AllowedOrigins[0]
				return baseURL + postLoginPath
			}

			// Fallback: utiliser le chemin seul
			return postLoginPath
		}
	}

	// Priorité 3: Chemin personnalisé sans client
	if loginData.PostLoginPath != "" {
		return loginData.PostLoginPath
	}

	// Défaut: chemin par défaut de la config
	return cfg.DefaultPostLoginPath
}

// isLocalhostRequest vérifie si la requête provient de localhost
func isLocalhostRequest(origin string) bool {
	if origin == "" {
		return false
	}

	localhostPatterns := []string{
		"http://localhost",
		"https://localhost",
		"http://127.0.0.1",
		"https://127.0.0.1",
		"http://[::1]",
		"https://[::1]",
	}

	for _, pattern := range localhostPatterns {
		if strings.HasPrefix(origin, pattern) {
			return true
		}
	}
	return false
}

// Register gère l'inscription des nouveaux utilisateurs avec validation complète
func Register(c *gin.Context) {
	var registerData models.RegisterRequest

	if err := c.ShouldBindJSON(&registerData); err != nil {
		c.JSON(http.StatusBadRequest, ValidationErrorResponse{
			Success: false,
			Error:   "Invalid request body",
		})
		return
	}

	// Valider toutes les entrées
	validationErrors := make(map[string]string)

	// Valider le nom
	if err := services.ValidateName(registerData.Name); err != nil {
		validationErrors["name"] = err.Error()
	}

	// Valider l'email
	if err := services.ValidateEmail(registerData.Email); err != nil {
		validationErrors["email"] = err.Error()
	}

	// Valider le mot de passe
	if err := services.ValidatePassword(registerData.Password); err != nil {
		validationErrors["password"] = err.Error()
	}

	// Vérifier que les mots de passe correspondent
	if registerData.Password != registerData.ConfirmPassword {
		validationErrors["confirmPassword"] = "Passwords do not match"
	}

	// Si des erreurs de validation existent, les retourner
	if len(validationErrors) > 0 {
		c.JSON(http.StatusBadRequest, ValidationErrorResponse{
			Success: false,
			Error:   "Validation failed",
			Fields:  validationErrors,
		})
		return
	}

	// Nettoyer les données
	registerData.Name = services.SanitizeName(registerData.Name)
	registerData.Email = services.SanitizeEmail(registerData.Email)

	// Vérifier si l'email existe déjà
	userService := services.NewUserService(services.DB)
	if userService.CheckEmailExists(registerData.Email) {
		c.JSON(http.StatusConflict, ValidationErrorResponse{
			Success: false,
			Error:   "Email already exists",
			Fields:  map[string]string{"email": "This email is already registered"},
		})
		return
	}

	// Créer l'utilisateur
	name := registerData.Name
	email := registerData.Email
	user := &models.User{
		Name:     &name,
		Email:    &email,
		IsActive: true,
	}

	if err := userService.CreateUser(user, registerData.Password); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to create user: " + err.Error(),
		})
		return
	}

	// Générer les tokens JWT
	cfg := config.LoadConfig()
	jwtService := services.NewJWTService(cfg.JWTSecret, cfg.AccessTokenExp, cfg.RefreshTokenExp)
	accessToken, err := jwtService.GenerateToken(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to generate access token",
		})
		return
	}

	refreshTokenString, err := jwtService.GenerateRefreshToken(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to generate refresh token",
		})
		return
	}

	// Stocker le refresh token en base
	emailService := services.NewEmailService(services.DB)
	_, err = emailService.CreateRefreshToken(user.ID, refreshTokenString)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to store refresh token",
		})
		return
	}

	// Déterminer si c'est une requête localhost
	origin := c.GetHeader("Origin")
	isLocalhost := isLocalhostRequest(origin)

	// Set cookies HTTPOnly pour le token d'accès et le refresh
	ExpiresAccess := time.Now().Add(time.Duration(cfg.AccessTokenExp) * time.Minute)
	ExpiresRefresh := time.Now().Add(time.Duration(cfg.RefreshTokenExp) * time.Minute)

	http.SetCookie(c.Writer, &http.Cookie{
		Name:     "AETHER_ACCESS_TOKEN",
		Value:    accessToken,
		Path:     "/",
		HttpOnly: true,
		Secure:   !isLocalhost,
		SameSite: http.SameSiteLaxMode,
		Expires:  ExpiresAccess,
	})
	http.SetCookie(c.Writer, &http.Cookie{
		Name:     "AETHER_REFRESH_TOKEN",
		Value:    refreshTokenString,
		Path:     "/",
		HttpOnly: true,
		Secure:   !isLocalhost,
		SameSite: http.SameSiteLaxMode,
		Expires:  ExpiresRefresh,
	})

	c.JSON(http.StatusCreated, RegisterResponse{
		Success:      true,
		Message:      "User registered successfully",
		AccessToken:  accessToken,
		RefreshToken: refreshTokenString,
		ExpiresIn:    cfg.AccessTokenExp,
		User:         user.ToResponse(),
	})
}

// Logout gère la déconnexion
func Logout(c *gin.Context) {
	var request models.RefreshTokenRequest

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
		})
		return
	}

	// Révoquer le refresh token
	emailService := services.NewEmailService(services.DB)
	if err := emailService.RevokeRefreshToken(request.RefreshToken); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Failed to revoke refresh token",
		})
		return
	}

	// Supprimer les cookies
	origin := c.GetHeader("Origin")
	isLocalhost := isLocalhostRequest(origin)

	http.SetCookie(c.Writer, &http.Cookie{
		Name:     "AETHER_ACCESS_TOKEN",
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Secure:   !isLocalhost,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   -1,
	})
	http.SetCookie(c.Writer, &http.Cookie{
		Name:     "AETHER_REFRESH_TOKEN",
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Secure:   !isLocalhost,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   -1,
	})

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Logged out successfully",
	})
}

// RefreshToken rafraîchit le token JWT
func RefreshToken(c *gin.Context) {
	var refreshData models.RefreshTokenRequest

	if err := c.ShouldBindJSON(&refreshData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
		})
		return
	}

	// Valider le refresh token en base
	emailService := services.NewEmailService(services.DB)
	refreshToken, err := emailService.ValidateRefreshToken(refreshData.RefreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Invalid or expired refresh token",
		})
		return
	}

	// Récupérer l'utilisateur
	userService := services.NewUserService(services.DB)
	user, err := userService.GetUserByID(refreshToken.UserID)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not found",
		})
		return
	}

	// Vérifier que le compte est actif
	if !user.IsActive {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "Account is inactive",
		})
		return
	}

	// Générer un nouveau token d'accès
	cfg := config.LoadConfig()
	jwtService := services.NewJWTService(cfg.JWTSecret, cfg.AccessTokenExp, cfg.RefreshTokenExp)
	newAccessToken, err := jwtService.GenerateToken(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to generate new access token",
		})
		return
	}

	// Mettre à jour le cookie si présent
	origin := c.GetHeader("Origin")
	isLocalhost := isLocalhostRequest(origin)

	ExpiresAccess := time.Now().Add(time.Duration(cfg.AccessTokenExp) * time.Minute)
	http.SetCookie(c.Writer, &http.Cookie{
		Name:     "AETHER_ACCESS_TOKEN",
		Value:    newAccessToken,
		Path:     "/",
		HttpOnly: true,
		Secure:   !isLocalhost,
		SameSite: http.SameSiteLaxMode,
		Expires:  ExpiresAccess,
	})

	c.JSON(http.StatusOK, models.TokenResponse{
		AccessToken:  newAccessToken,
		RefreshToken: refreshData.RefreshToken,
		ExpiresIn:    cfg.AccessTokenExp,
	})
}
