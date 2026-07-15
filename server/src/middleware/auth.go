package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/skygenesisenterprise/aether-account/server/src/interfaces"
	"github.com/skygenesisenterprise/aether-account/server/src/utils"
)

type contextKey string

const principalKey contextKey = "principal"

func Auth(provider interfaces.IdentityProvider) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if !strings.HasPrefix(header, "Bearer ") && websocketProtocolToken(c.GetHeader("Sec-WebSocket-Protocol")) == "" {
			utils.Error(c, utils.ErrUnauthorized)
			c.Abort()
			return
		}
		token := strings.TrimPrefix(header, "Bearer ")
		if token == header {
			token = websocketProtocolToken(c.GetHeader("Sec-WebSocket-Protocol"))
			if token != "" {
				c.Header("Sec-WebSocket-Protocol", "bearer")
			}
		}
		principal, err := provider.Authenticate(c.Request.Context(), token)
		if err != nil {
			utils.Error(c, err)
			c.Abort()
			return
		}
		c.Set(string(principalKey), *principal)
		c.Next()
	}
}

func websocketProtocolToken(header string) string {
	if header == "" {
		return ""
	}

	parts := strings.Split(header, ",")
	if len(parts) < 2 {
		return ""
	}

	if strings.TrimSpace(parts[0]) != "bearer" {
		return ""
	}

	token := strings.TrimSpace(parts[1])
	if token == "" || strings.ContainsAny(token, " \t") {
		return ""
	}

	return token
}

func GetPrincipal(c *gin.Context) (interfaces.Principal, bool) {
	value, ok := c.Get(string(principalKey))
	if !ok {
		return interfaces.Principal{}, false
	}
	principal, ok := value.(interfaces.Principal)
	return principal, ok
}

func PrincipalFromGin(c *gin.Context) (interfaces.Principal, bool) { return GetPrincipal(c) }

func RequireAuth(provider interfaces.IdentityProvider) gin.HandlerFunc {
	return Auth(provider)
}

func RequireRole(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		principal, ok := GetPrincipal(c)
		if !ok {
			utils.Error(c, utils.ErrUnauthorized)
			c.Abort()
			return
		}
		for _, current := range principal.Roles {
			for _, allowed := range roles {
				if current == allowed {
					c.Next()
					return
				}
			}
		}
		utils.Error(c, utils.ErrForbidden)
		c.Abort()
	}
}

func RequirePermission(permissions ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		principal, ok := GetPrincipal(c)
		if !ok {
			utils.Error(c, utils.ErrUnauthorized)
			c.Abort()
			return
		}
		for _, current := range principal.Permissions {
			for _, allowed := range permissions {
				if current == allowed {
					c.Next()
					return
				}
			}
		}
		utils.Error(c, utils.ErrForbidden)
		c.Abort()
	}
}
