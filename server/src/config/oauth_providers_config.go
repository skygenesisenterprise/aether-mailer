package config

import (
	"os"
)

// OAuthProviderConfig représente la configuration d'un provider OAuth
type OAuthProviderConfig struct {
	Name         string   // Nom du provider (github, google, microsoft, discord)
	ClientID     string   // Client ID de l'application
	ClientSecret string   // Client Secret de l'application
	AuthURL      string   // URL d'autorisation OAuth
	TokenURL     string   // URL d'échange du code contre token
	UserInfoURL  string   // URL pour récupérer les infos utilisateur
	Scopes       []string // Scopes demandés
	RedirectURL  string   // URL de callback
}

// OAuthProvidersConfig contient toutes les configurations OAuth
type OAuthProvidersConfig struct {
	GitHub    *OAuthProviderConfig
	Google    *OAuthProviderConfig
	Microsoft *OAuthProviderConfig
	Discord   *OAuthProviderConfig
}

// LoadOAuthProvidersConfig charge la configuration des providers OAuth
func LoadOAuthProvidersConfig() *OAuthProvidersConfig {
	baseURL := getEnv("BASE_URL", "http://localhost:3000")

	return &OAuthProvidersConfig{
		GitHub:    loadGitHubConfig(baseURL),
		Google:    loadGoogleConfig(baseURL),
		Microsoft: loadMicrosoftConfig(baseURL),
		Discord:   loadDiscordConfig(baseURL),
	}
}

// loadGitHubConfig charge la configuration GitHub OAuth
func loadGitHubConfig(baseURL string) *OAuthProviderConfig {
	clientID := os.Getenv("GITHUB_CLIENT_ID")
	if clientID == "" {
		return nil // Provider non configuré
	}

	return &OAuthProviderConfig{
		Name:         "github",
		ClientID:     clientID,
		ClientSecret: os.Getenv("GITHUB_CLIENT_SECRET"),
		AuthURL:      "https://github.com/login/oauth/authorize",
		TokenURL:     "https://github.com/login/oauth/access_token",
		UserInfoURL:  "https://api.github.com/user",
		Scopes:       []string{"read:user", "user:email"},
		RedirectURL:  baseURL + "/api/v1/auth/external/github/callback",
	}
}

// loadGoogleConfig charge la configuration Google OAuth
func loadGoogleConfig(baseURL string) *OAuthProviderConfig {
	clientID := os.Getenv("GOOGLE_CLIENT_ID")
	if clientID == "" {
		return nil // Provider non configuré
	}

	return &OAuthProviderConfig{
		Name:         "google",
		ClientID:     clientID,
		ClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
		AuthURL:      "https://accounts.google.com/o/oauth2/v2/auth",
		TokenURL:     "https://oauth2.googleapis.com/token",
		UserInfoURL:  "https://www.googleapis.com/oauth2/v2/userinfo",
		Scopes:       []string{"openid", "email", "profile"},
		RedirectURL:  baseURL + "/api/v1/auth/external/google/callback",
	}
}

// loadMicrosoftConfig charge la configuration Microsoft OAuth
func loadMicrosoftConfig(baseURL string) *OAuthProviderConfig {
	clientID := os.Getenv("MICROSOFT_CLIENT_ID")
	if clientID == "" {
		return nil // Provider non configuré
	}

	return &OAuthProviderConfig{
		Name:         "microsoft",
		ClientID:     clientID,
		ClientSecret: os.Getenv("MICROSOFT_CLIENT_SECRET"),
		AuthURL:      "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
		TokenURL:     "https://login.microsoftonline.com/common/oauth2/v2.0/token",
		UserInfoURL:  "https://graph.microsoft.com/v1.0/me",
		Scopes:       []string{"openid", "email", "profile", "User.Read"},
		RedirectURL:  baseURL + "/api/v1/auth/external/microsoft/callback",
	}
}

// loadDiscordConfig charge la configuration Discord OAuth
func loadDiscordConfig(baseURL string) *OAuthProviderConfig {
	clientID := os.Getenv("DISCORD_CLIENT_ID")
	if clientID == "" {
		return nil // Provider non configuré
	}

	return &OAuthProviderConfig{
		Name:         "discord",
		ClientID:     clientID,
		ClientSecret: os.Getenv("DISCORD_CLIENT_SECRET"),
		AuthURL:      "https://discord.com/api/oauth2/authorize",
		TokenURL:     "https://discord.com/api/oauth2/token",
		UserInfoURL:  "https://discord.com/api/users/@me",
		Scopes:       []string{"identify", "email"},
		RedirectURL:  baseURL + "/api/v1/auth/external/discord/callback",
	}
}

// GetProviderConfig retourne la configuration d'un provider spécifique
func (c *OAuthProvidersConfig) GetProviderConfig(provider string) *OAuthProviderConfig {
	switch provider {
	case "github":
		return c.GitHub
	case "google":
		return c.Google
	case "microsoft":
		return c.Microsoft
	case "discord":
		return c.Discord
	default:
		return nil
	}
}

// IsProviderEnabled vérifie si un provider est configuré
func (c *OAuthProvidersConfig) IsProviderEnabled(provider string) bool {
	return c.GetProviderConfig(provider) != nil
}

// GetEnabledProviders retourne la liste des providers configurés
func (c *OAuthProvidersConfig) GetEnabledProviders() []string {
	var providers []string
	if c.GitHub != nil {
		providers = append(providers, "github")
	}
	if c.Google != nil {
		providers = append(providers, "google")
	}
	if c.Microsoft != nil {
		providers = append(providers, "microsoft")
	}
	if c.Discord != nil {
		providers = append(providers, "discord")
	}
	return providers
}
