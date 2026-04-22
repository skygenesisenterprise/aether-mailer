package middleware

import (
	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
)

// OAuthSessionMiddleware configure le middleware de session pour OAuth
func OAuthSessionMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		session := sessions.Default(c)
		c.Set("session", session)
		c.Next()
	}
}

// SessionMiddleware configure le middleware de session
func SessionMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		session := sessions.Default(c)
		c.Set("session", session)
		c.Next()
	}
}

// OAuthStateMiddleware génère et valide l'état OAuth
func OAuthStateMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Cette méthode peut être utilisée pour générer et valider l'état OAuth
		// pour prévenir les attaques CSRF
		c.Next()
	}
}

// ExtractToken extrait le token d'accès de la requête
func ExtractToken(c *gin.Context) (string, error) {
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		return "", nil
	}
	
	// Vérifier si c'est un token Bearer
	if len(authHeader) > 7 && authHeader[:7] == "Bearer " {
		return authHeader[7:], nil
	}
	
	return "", nil
}

// OAuthClientMiddleware valide le client OAuth
func OAuthClientMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Valider le client OAuth
		// Cette méthode peut être étendue pour valider le client
		c.Next()
	}
}
