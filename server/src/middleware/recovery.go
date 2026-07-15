package middleware

import (
	"log/slog"

	"github.com/gin-gonic/gin"
	"github.com/skygenesisenterprise/aether-account/server/src/utils"
)

func Recovery(logger *slog.Logger) gin.HandlerFunc {
	return gin.CustomRecovery(func(c *gin.Context, recovered any) {
		logger.Error("panic recovered", "panic", recovered, "request_id", utils.RequestIDFromGin(c))
		utils.Error(c, utils.NewError(500, "INTERNAL_ERROR", "An internal error occurred.", nil))
		c.Abort()
	})
}
