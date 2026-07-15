package middleware

import "github.com/gin-gonic/gin"

func WorkspaceContext() gin.HandlerFunc {
	return func(c *gin.Context) {
		if workspaceID := c.Param("workspaceId"); workspaceID != "" {
			c.Set("workspace_id", workspaceID)
		}
		c.Next()
	}
}
