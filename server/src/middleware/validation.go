package middleware

import (
	"net/http"
	"regexp"
	"strings"

	"github.com/gin-gonic/gin"
)

// ValidationMiddleware ajoute la validation avancée des entrées
func ValidationMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Valider les headers
		if err := validateHeaders(c); err != nil {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{
				"error": err.Error(),
			})
			return
		}

		// Valider le body si présent
		if c.Request.ContentLength > 0 {
			if err := validateBody(c); err != nil {
				c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{
					"error": err.Error(),
				})
				return
			}
		}

		c.Next()
	}
}

// validateHeaders valide les en-têtes HTTP
func validateHeaders(c *gin.Context) error {
	// Valider Content-Type
	contentType := c.GetHeader("Content-Type")
	if contentType != "" && !strings.Contains(contentType, "application/json") {
		return gin.Error{
			Err:  gin.Error{Err: http.ErrBodyNotAllowed, Type: gin.ErrorTypeBind}.Err,
			Type: gin.ErrorTypeBind,
		}
	}

	// Valider User-Agent pour éviter les bots malveillants
	userAgent := c.GetHeader("User-Agent")
	if userAgent == "" {
		return gin.Error{
			Err:  gin.Error{Err: http.ErrBodyNotAllowed, Type: gin.ErrorTypeBind}.Err,
			Type: gin.ErrorTypeBind,
		}
	}

	// Vérifier les patterns suspects dans User-Agent
	suspiciousPatterns := []string{
		"bot", "crawler", "spider", "scraper", "curl", "wget",
	}

	userAgentLower := strings.ToLower(userAgent)
	for _, pattern := range suspiciousPatterns {
		if strings.Contains(userAgentLower, pattern) {
			// Pour le développement, on peut autoriser ces patterns
			// En production, vous voudrez peut-être bloquer ces requêtes
			break
		}
	}

	return nil
}

// validateBody valide le corps de la requête
func validateBody(c *gin.Context) error {
	// Lire et valider le body JSON
	var body map[string]interface{}
	if err := c.ShouldBindJSON(&body); err != nil {
		return err
	}

	// Valider les champs communs
	if err := validateCommonFields(body); err != nil {
		return err
	}

	// Valider les champs spécifiques selon l'endpoint
	path := c.Request.URL.Path
	if strings.Contains(path, "/auth/register") {
		return validateRegisterFields(body)
	} else if strings.Contains(path, "/auth/login") {
		return validateLoginFields(body)
	} else if strings.Contains(path, "/auth/confirm-password-reset") {
		return validatePasswordResetFields(body)
	}

	return nil
}

// validateCommonFields valide les champs communs
func validateCommonFields(body map[string]interface{}) error {
	// Limiter la taille du body
	if len(body) > 50 {
		return gin.Error{
			Err: gin.Error{
				Err:  http.ErrBodyNotAllowed,
				Type: gin.ErrorTypeBind,
			}.Err,
			Type: gin.ErrorTypeBind,
		}
	}

	return nil
}

// validateRegisterFields valide les champs d'inscription
func validateRegisterFields(body map[string]interface{}) error {
	// Valider le nom
	if name, ok := body["name"].(string); ok {
		if err := validateName(name); err != nil {
			return err
		}
	}

	// Valider l'email
	if email, ok := body["email"].(string); ok {
		if err := validateEmail(email); err != nil {
			return err
		}
	}

	// Valider le mot de passe
	if password, ok := body["password"].(string); ok {
		if err := validatePassword(password); err != nil {
			return err
		}
	}

	return nil
}

// validateLoginFields valide les champs de connexion
func validateLoginFields(body map[string]interface{}) error {
	// Valider l'email
	if email, ok := body["email"].(string); ok {
		if err := validateEmail(email); err != nil {
			return err
		}
	}

	// Valider le mot de passe
	if password, ok := body["password"].(string); ok {
		if len(password) < 1 {
			return gin.Error{
				Err:  gin.Error{Err: http.ErrBodyNotAllowed, Type: gin.ErrorTypeBind}.Err,
				Type: gin.ErrorTypeBind,
			}
		}
	}

	return nil
}

// validatePasswordResetFields valide les champs de réinitialisation
func validatePasswordResetFields(body map[string]interface{}) error {
	// Valider le token
	if token, ok := body["token"].(string); ok {
		if len(token) < 32 {
			return gin.Error{
				Err:  gin.Error{Err: http.ErrBodyNotAllowed, Type: gin.ErrorTypeBind}.Err,
				Type: gin.ErrorTypeBind,
			}
		}
	}

	// Valider le mot de passe
	if password, ok := body["password"].(string); ok {
		if err := validatePassword(password); err != nil {
			return err
		}
	}

	return nil
}

// validateName valide le format du nom
func validateName(name string) error {
	if len(name) < 2 || len(name) > 100 {
		return gin.Error{
			Err:  gin.Error{Err: http.ErrBodyNotAllowed, Type: gin.ErrorTypeBind}.Err,
			Type: gin.ErrorTypeBind,
		}
	}

	// Vérifier les caractères autorisés
	nameRegex := regexp.MustCompile(`^[a-zA-ZÀ-ÿ\s\-']+$`)
	if !nameRegex.MatchString(name) {
		return gin.Error{
			Err:  gin.Error{Err: http.ErrBodyNotAllowed, Type: gin.ErrorTypeBind}.Err,
			Type: gin.ErrorTypeBind,
		}
	}

	return nil
}

// validateEmail valide le format de l'email
func validateEmail(email string) error {
	if len(email) < 5 || len(email) > 100 {
		return gin.Error{
			Err:  gin.Error{Err: http.ErrBodyNotAllowed, Type: gin.ErrorTypeBind}.Err,
			Type: gin.ErrorTypeBind,
		}
	}

	// Vérifier le format de l'email
	emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
	if !emailRegex.MatchString(email) {
		return gin.Error{
			Err:  gin.Error{Err: http.ErrBodyNotAllowed, Type: gin.ErrorTypeBind}.Err,
			Type: gin.ErrorTypeBind,
		}
	}

	return nil
}

// validatePassword valide la force du mot de passe
func validatePassword(password string) error {
	if len(password) < 8 || len(password) > 128 {
		return gin.Error{
			Err:  gin.Error{Err: http.ErrBodyNotAllowed, Type: gin.ErrorTypeBind}.Err,
			Type: gin.ErrorTypeBind,
		}
	}

	// Vérifier la complexité du mot de passe
	hasUpper := regexp.MustCompile(`[A-Z]`).MatchString(password)
	hasLower := regexp.MustCompile(`[a-z]`).MatchString(password)
	hasNumber := regexp.MustCompile(`[0-9]`).MatchString(password)
	hasSpecial := regexp.MustCompile(`[!@#$%^&*(),.?":{}|<>]`).MatchString(password)

	complexityScore := 0
	if hasUpper {
		complexityScore++
	}
	if hasLower {
		complexityScore++
	}
	if hasNumber {
		complexityScore++
	}
	if hasSpecial {
		complexityScore++
	}

	// Exiger au moins 3 des 4 types de caractères
	if complexityScore < 3 {
		return gin.Error{
			Err:  gin.Error{Err: http.ErrBodyNotAllowed, Type: gin.ErrorTypeBind}.Err,
			Type: gin.ErrorTypeBind,
		}
	}

	return nil
}

// SanitizeInput nettoie les entrées utilisateur
func SanitizeInput(input string) string {
	// Supprimer les espaces en début et fin
	input = strings.TrimSpace(input)

	// Échapper les caractères HTML dangereux
	htmlEscapes := map[string]string{
		"<":  "&lt;",
		">":  "&gt;",
		"&":  "&amp;",
		"\"": "&quot;",
		"'":  "&#x27;",
	}

	for escaped, replacement := range htmlEscapes {
		input = strings.ReplaceAll(input, escaped, replacement)
	}

	return input
}
