package services

import (
	"bytes"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/skygenesisenterprise/aether-mailer/server/src/config"
	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
	"gorm.io/gorm"
)

// ExternalAuthService gère l'authentification via des providers externes
type ExternalAuthService struct {
	DB         *gorm.DB
	Config     *config.OAuthProvidersConfig
	EncryptKey []byte
}

// NewExternalAuthService crée une nouvelle instance du service
func NewExternalAuthService(db *gorm.DB, encryptKey string) *ExternalAuthService {
	key := []byte(encryptKey)
	if len(key) < 32 {
		// Pad la clé à 32 bytes si nécessaire
		key = append(key, make([]byte, 32-len(key))...)
	}
	if len(key) > 32 {
		key = key[:32]
	}

	return &ExternalAuthService{
		DB:         db,
		Config:     config.LoadOAuthProvidersConfig(),
		EncryptKey: key,
	}
}

// GenerateOAuthURL génère l'URL d'authentification pour un provider
func (s *ExternalAuthService) GenerateOAuthURL(provider, action string, userID *uint) (string, string, error) {
	providerConfig := s.Config.GetProviderConfig(provider)
	if providerConfig == nil {
		return "", "", errors.New("provider not configured")
	}

	// Générer un state aléatoire
	state, err := s.generateRandomState()
	if err != nil {
		return "", "", err
	}

	// Convert userID from *uint to *string
	var userIDStr *string
	if userID != nil {
		idStr := fmt.Sprintf("%d", *userID)
		userIDStr = &idStr
	}

	// Sauvegarder le state en base
	actionStr := action
	oauthState := &models.OAuthState{
		State:     state,
		Provider:  provider,
		UserID:    userIDStr,
		Action:    &actionStr,
		ExpiresAt: time.Now().Add(10 * time.Minute),
	}

	if err := s.DB.Create(oauthState).Error; err != nil {
		return "", "", err
	}

	// Construire l'URL d'autorisation
	params := url.Values{}
	params.Set("client_id", providerConfig.ClientID)
	params.Set("redirect_uri", providerConfig.RedirectURL)
	params.Set("response_type", "code")
	params.Set("state", state)
	params.Set("scope", strings.Join(providerConfig.Scopes, " "))

	authURL := providerConfig.AuthURL + "?" + params.Encode()

	return authURL, state, nil
}

// ValidateOAuthState valide et récupère un state OAuth
func (s *ExternalAuthService) ValidateOAuthState(state string) (*models.OAuthState, error) {
	var oauthState models.OAuthState
	if err := s.DB.Where("state = ?", state).First(&oauthState).Error; err != nil {
		return nil, errors.New("invalid state")
	}

	if oauthState.IsExpired() {
		s.DB.Delete(&oauthState)
		return nil, errors.New("state expired")
	}

	// Supprimer le state après utilisation
	s.DB.Delete(&oauthState)

	return &oauthState, nil
}

// ExchangeCode échange le code OAuth contre des tokens
func (s *ExternalAuthService) ExchangeCode(provider, code string) (*TokenExchangeResult, error) {
	providerConfig := s.Config.GetProviderConfig(provider)
	if providerConfig == nil {
		return nil, errors.New("provider not configured")
	}

	params := url.Values{}
	params.Set("grant_type", "authorization_code")
	params.Set("code", code)
	params.Set("redirect_uri", providerConfig.RedirectURL)
	params.Set("client_id", providerConfig.ClientID)
	params.Set("client_secret", providerConfig.ClientSecret)

	req, err := http.NewRequest("POST", providerConfig.TokenURL, strings.NewReader(params.Encode()))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Accept", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("token exchange failed: %s", string(body))
	}

	var result TokenExchangeResult
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	return &result, nil
}

// TokenExchangeResult représente le résultat d'un échange de code
type TokenExchangeResult struct {
	AccessToken  string `json:"access_token"`
	TokenType    string `json:"token_type"`
	ExpiresIn    int    `json:"expires_in"`
	RefreshToken string `json:"refresh_token"`
	Scope        string `json:"scope"`
}

// GetUserInfo récupère les informations utilisateur d'un provider
func (s *ExternalAuthService) GetUserInfo(provider, accessToken string) (*models.ProviderUserInfo, error) {
	switch provider {
	case "github":
		return s.getGitHubUserInfo(accessToken)
	case "google":
		return s.getGoogleUserInfo(accessToken)
	case "microsoft":
		return s.getMicrosoftUserInfo(accessToken)
	case "discord":
		return s.getDiscordUserInfo(accessToken)
	default:
		return nil, errors.New("unsupported provider")
	}
}

// getGitHubUserInfo récupère les infos utilisateur GitHub
func (s *ExternalAuthService) getGitHubUserInfo(accessToken string) (*models.ProviderUserInfo, error) {
	req, err := http.NewRequest("GET", "https://api.github.com/user", nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Accept", "application/vnd.github.v3+json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to get user info: %d", resp.StatusCode)
	}

	var data struct {
		ID        int64  `json:"id"`
		Login     string `json:"login"`
		Name      string `json:"name"`
		Email     string `json:"email"`
		AvatarURL string `json:"avatar_url"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, err
	}

	// Si l'email est vide, essayer de le récupérer depuis les emails
	email := data.Email
	if email == "" {
		email, _ = s.getGitHubPrimaryEmail(accessToken)
	}

	return &models.ProviderUserInfo{
		ID:       fmt.Sprintf("%d", data.ID),
		Email:    email,
		Name:     data.Name,
		Username: data.Login,
		Avatar:   data.AvatarURL,
	}, nil
}

// getGitHubPrimaryEmail récupère l'email principal de GitHub
func (s *ExternalAuthService) getGitHubPrimaryEmail(accessToken string) (string, error) {
	req, err := http.NewRequest("GET", "https://api.github.com/user/emails", nil)
	if err != nil {
		return "", err
	}

	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Accept", "application/vnd.github.v3+json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var emails []struct {
		Email    string `json:"email"`
		Primary  bool   `json:"primary"`
		Verified bool   `json:"verified"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&emails); err != nil {
		return "", err
	}

	for _, e := range emails {
		if e.Primary && e.Verified {
			return e.Email, nil
		}
	}

	return "", nil
}

// getGoogleUserInfo récupère les infos utilisateur Google
func (s *ExternalAuthService) getGoogleUserInfo(accessToken string) (*models.ProviderUserInfo, error) {
	req, err := http.NewRequest("GET", "https://www.googleapis.com/oauth2/v2/userinfo", nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+accessToken)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to get user info: %d", resp.StatusCode)
	}

	var data struct {
		ID            string `json:"id"`
		Email         string `json:"email"`
		VerifiedEmail bool   `json:"verified_email"`
		Name          string `json:"name"`
		GivenName     string `json:"given_name"`
		FamilyName    string `json:"family_name"`
		Picture       string `json:"picture"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, err
	}

	return &models.ProviderUserInfo{
		ID:       data.ID,
		Email:    data.Email,
		Name:     data.Name,
		Avatar:   data.Picture,
		Verified: data.VerifiedEmail,
	}, nil
}

// getMicrosoftUserInfo récupère les infos utilisateur Microsoft
func (s *ExternalAuthService) getMicrosoftUserInfo(accessToken string) (*models.ProviderUserInfo, error) {
	req, err := http.NewRequest("GET", "https://graph.microsoft.com/v1.0/me", nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+accessToken)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to get user info: %d", resp.StatusCode)
	}

	var data struct {
		ID                string `json:"id"`
		DisplayName       string `json:"displayName"`
		GivenName         string `json:"givenName"`
		Surname           string `json:"surname"`
		Mail              string `json:"mail"`
		UserPrincipalName string `json:"userPrincipalName"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, err
	}

	email := data.Mail
	if email == "" {
		email = data.UserPrincipalName
	}

	return &models.ProviderUserInfo{
		ID:     data.ID,
		Email:  email,
		Name:   data.DisplayName,
		Avatar: "", // Microsoft Graph nécessite une requête supplémentaire pour l'avatar
	}, nil
}

// getDiscordUserInfo récupère les infos utilisateur Discord
func (s *ExternalAuthService) getDiscordUserInfo(accessToken string) (*models.ProviderUserInfo, error) {
	req, err := http.NewRequest("GET", "https://discord.com/api/users/@me", nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+accessToken)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to get user info: %d", resp.StatusCode)
	}

	var data struct {
		ID         string `json:"id"`
		Username   string `json:"username"`
		GlobalName string `json:"global_name"`
		Email      string `json:"email"`
		Avatar     string `json:"avatar"`
		Verified   bool   `json:"verified"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, err
	}

	name := data.GlobalName
	if name == "" {
		name = data.Username
	}

	avatarURL := ""
	if data.Avatar != "" {
		avatarURL = fmt.Sprintf("https://cdn.discordapp.com/avatars/%s/%s.png", data.ID, data.Avatar)
	}

	return &models.ProviderUserInfo{
		ID:       data.ID,
		Email:    data.Email,
		Name:     name,
		Username: data.Username,
		Avatar:   avatarURL,
		Verified: data.Verified,
	}, nil
}

// FindOrCreateUser trouve ou crée un utilisateur à partir des infos OAuth
func (s *ExternalAuthService) FindOrCreateUser(provider string, userInfo *models.ProviderUserInfo) (*models.User, bool, error) {
	// Chercher si un compte externe existe déjà
	var externalAccount models.ExternalAccount
	err := s.DB.Where("provider = ? AND provider_user_id = ?", provider, userInfo.ID).First(&externalAccount).Error

	if err == nil {
		// Compte externe trouvé, récupérer l'utilisateur
		var user models.User
		if err := s.DB.First(&user, externalAccount.UserID).Error; err != nil {
			return nil, false, err
		}

		// Mettre à jour le dernier login
		now := time.Now()
		externalAccount.LastLoginAt = &now
		s.DB.Save(&externalAccount)

		return &user, false, nil
	}

	// Chercher un utilisateur avec le même email
	var existingUser models.User
	if userInfo.Email != "" {
		err = s.DB.Where("email = ?", userInfo.Email).First(&existingUser).Error
		if err == nil {
			// Un utilisateur avec cet email existe déjà
			// Créer le lien avec le compte externe
			if err := s.LinkExternalAccount(existingUser.ID, provider, userInfo, nil); err != nil {
				return nil, false, err
			}
			return &existingUser, false, nil
		}
	}

	// Créer un nouvel utilisateur
	newUser := &models.User{
		Name:     &userInfo.Name,
		Email:    &userInfo.Email,
		IsActive: true,
	}

	if newUser.Email == nil {
		email := fmt.Sprintf("%s_%s@oauth.local", provider, userInfo.ID)
		newUser.Email = &email
	}

	if newUser.Name == nil {
		name := userInfo.Username
		newUser.Name = &name
	}

	if err := s.DB.Create(newUser).Error; err != nil {
		return nil, false, err
	}

	// Créer le compte externe
	if err := s.LinkExternalAccount(newUser.ID, provider, userInfo, nil); err != nil {
		return nil, false, err
	}

	return newUser, true, nil
}

// LinkExternalAccount lie un compte externe à un utilisateur existant
func (s *ExternalAuthService) LinkExternalAccount(userID string, provider string, userInfo *models.ProviderUserInfo, tokenData *TokenExchangeResult) error {
	// Vérifier si le compte n'est pas déjà lié
	var existing models.ExternalAccount
	err := s.DB.Where("user_id = ? AND provider = ?", userID, provider).First(&existing).Error
	if err == nil {
		return errors.New("account already linked for this provider")
	}

	// Vérifier si le provider user ID n'est pas déjà utilisé
	err = s.DB.Where("provider = ? AND provider_user_id = ?", provider, userInfo.ID).First(&existing).Error
	if err == nil {
		return errors.New("this external account is already linked to another user")
	}

	// Chiffrer les tokens si présents
	var accessToken, refreshToken string
	if tokenData != nil {
		accessToken = s.encrypt(tokenData.AccessToken)
		refreshToken = s.encrypt(tokenData.RefreshToken)
	}

	expiresAt := time.Now().Add(1 * time.Hour)
	if tokenData != nil && tokenData.ExpiresIn > 0 {
		expiresAt = time.Now().Add(time.Duration(tokenData.ExpiresIn) * time.Second)
	}

	// Créer le compte externe
	externalAccount := &models.ExternalAccount{
		UserID:            fmt.Sprint(userID),
		Provider:          provider,
		ProviderAccountID: userInfo.ID,
		Email:             &userInfo.Email,
		DisplayName:       &userInfo.Name,
		AvatarURL:         &userInfo.Avatar,
		AccessToken:       &accessToken,
		RefreshToken:      &refreshToken,
		ExpiresAt:         &expiresAt,
	}

	if err := s.DB.Create(externalAccount).Error; err != nil {
		return err
	}

	return nil
}

// UnlinkExternalAccount supprime le lien avec un compte externe
func (s *ExternalAuthService) UnlinkExternalAccount(userID string, provider string) error {
	// Vérifier que l'utilisateur a d'autres moyens d'authentification
	var externalAccounts []models.ExternalAccount
	if err := s.DB.Where("user_id = ?", userID).Find(&externalAccounts).Error; err != nil {
		return err
	}

	var user models.User
	if err := s.DB.First(&user, userID).Error; err != nil {
		return err
	}

	// S'il n'y a qu'un seul compte externe et pas de mot de passe, refuser
	if len(externalAccounts) == 1 && externalAccounts[0].Provider == provider && user.PasswordHash == nil {
		return errors.New("cannot unlink: no other authentication method available")
	}

	// Supprimer le compte externe
	result := s.DB.Where("user_id = ? AND provider = ?", userID, provider).Delete(&models.ExternalAccount{})
	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return errors.New("external account not found")
	}

	return nil
}

// GetUserExternalAccounts récupère tous les comptes externes d'un utilisateur
func (s *ExternalAuthService) GetUserExternalAccounts(userID uint) ([]*models.ExternalAccountResponse, error) {
	var accounts []models.ExternalAccount
	if err := s.DB.Where("user_id = ?", userID).Find(&accounts).Error; err != nil {
		return nil, err
	}

	responses := make([]*models.ExternalAccountResponse, len(accounts))
	for i, account := range accounts {
		responses[i] = account.ToResponse()
	}

	return responses, nil
}

// generateRandomState génère un state OAuth aléatoire
func (s *ExternalAuthService) generateRandomState() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

// encrypt chiffre une chaîne avec AES-GCM
func (s *ExternalAuthService) encrypt(plaintext string) string {
	if plaintext == "" {
		return ""
	}

	block, err := aes.NewCipher(s.EncryptKey)
	if err != nil {
		return ""
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return ""
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return ""
	}

	ciphertext := gcm.Seal(nonce, nonce, []byte(plaintext), nil)
	return base64.StdEncoding.EncodeToString(ciphertext)
}

// decrypt déchiffre une chaîne avec AES-GCM
func (s *ExternalAuthService) decrypt(ciphertext string) string {
	if ciphertext == "" {
		return ""
	}

	data, err := base64.StdEncoding.DecodeString(ciphertext)
	if err != nil {
		return ""
	}

	block, err := aes.NewCipher(s.EncryptKey)
	if err != nil {
		return ""
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return ""
	}

	nonceSize := gcm.NonceSize()
	if len(data) < nonceSize {
		return ""
	}

	nonce, ciphertextBytes := data[:nonceSize], data[nonceSize:]
	plaintext, err := gcm.Open(nil, nonce, ciphertextBytes, nil)
	if err != nil {
		return ""
	}

	return string(plaintext)
}

// RefreshAccessToken rafraîchit le token d'accès si possible
func (s *ExternalAuthService) RefreshAccessToken(userID string, provider string) (string, error) {
	var account models.ExternalAccount
	if err := s.DB.Where("user_id = ? AND provider = ?", userID, provider).First(&account).Error; err != nil {
		return "", err
	}

	refreshToken := s.decrypt(*account.RefreshToken)
	if refreshToken == "" {
		return "", errors.New("no refresh token available")
	}

	providerConfig := s.Config.GetProviderConfig(provider)
	if providerConfig == nil {
		return "", errors.New("provider not configured")
	}

	params := url.Values{}
	params.Set("grant_type", "refresh_token")
	params.Set("refresh_token", refreshToken)
	params.Set("client_id", providerConfig.ClientID)
	params.Set("client_secret", providerConfig.ClientSecret)

	req, err := http.NewRequest("POST", providerConfig.TokenURL, bytes.NewBufferString(params.Encode()))
	if err != nil {
		return "", err
	}

	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Accept", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", errors.New("failed to refresh token")
	}

	var result TokenExchangeResult
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", err
	}

	accessToken := s.encrypt(result.AccessToken)
	if result.RefreshToken != "" {
		refreshToken = s.encrypt(result.RefreshToken)
	}
	expiresAt := time.Now().Add(time.Duration(result.ExpiresIn) * time.Second)

	// Mettre à jour les tokens
	account.AccessToken = &accessToken
	if refreshToken != "" {
		account.RefreshToken = &refreshToken
	}
	account.ExpiresAt = &expiresAt

	s.DB.Save(&account)

	return result.AccessToken, nil
}

// CleanupExpiredStates nettoie les states OAuth expirés
func (s *ExternalAuthService) CleanupExpiredStates() error {
	return s.DB.Where("expires_at < ?", time.Now()).Delete(&models.OAuthState{}).Error
}
