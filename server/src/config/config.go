package config

import (
	"fmt"
	"os"
	"strings"
)

// Config représente la configuration de l'application
type Config struct {
	JWTSecret             string
	AccessTokenExp        int
	RefreshTokenExp       int
	DatabaseURL           string
	Port                  string
	SystemKey             string   // Clé système pour les requêtes internes de l'application
	CORSAllowedOrigins    []string // Origines CORS autorisées
	DefaultPostLoginPath  string   // Chemin par défaut après login
	DefaultPostLogoutPath string   // Chemin par défaut après logout
}

// LoadConfig charge la configuration depuis les variables d'environnement
func LoadConfig() *Config {
	return &Config{
		JWTSecret:             getEnv("JWT_SECRET", "votre-cle-secrete-ici"),
		AccessTokenExp:        getEnvAsInt("ACCESS_TOKEN_EXP", 15),
		RefreshTokenExp:       getEnvAsInt("REFRESH_TOKEN_EXP", 720),
		DatabaseURL:           getEnv("DATABASE_URL", "host=localhost user=postgres password=postgres dbname=aether_identity port=5432 sslmode=disable"),
		Port:                  getEnv("PORT", "8080"),
		SystemKey:             getEnv("SYSTEM_KEY", "sk_system_default_key_change_in_production"),
		CORSAllowedOrigins:    parseEnvList(getEnv("CORS_ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:8080")),
		DefaultPostLoginPath:  getEnv("DEFAULT_POST_LOGIN_PATH", "/"),
		DefaultPostLogoutPath: getEnv("DEFAULT_POST_LOGOUT_PATH", "/"),
	}
}

// parseEnvList parse une liste de valeurs séparées par des virgules
func parseEnvList(value string) []string {
	if value == "" {
		return []string{}
	}
	var result []string
	for _, item := range strings.Split(value, ",") {
		trimmed := strings.TrimSpace(item)
		if trimmed != "" {
			result = append(result, trimmed)
		}
	}
	return result
}

// getEnv récupère une variable d'environnement avec une valeur par défaut
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

// getEnvAsInt récupère une variable d'environnement en tant qu'entier
func getEnvAsInt(key string, defaultValue int) int {
	valueStr := os.Getenv(key)
	if valueStr == "" {
		return defaultValue
	}
	var value int
	_, err := fmt.Sscanf(valueStr, "%d", &value)
	if err != nil {
		return defaultValue
	}
	return value
}
