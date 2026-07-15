package utils

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

const requestIDKey = "request_id"

func RequestIDFromGin(c *gin.Context) string {
	value, _ := c.Get(requestIDKey)
	if id, ok := value.(string); ok {
		return id
	}
	return ""
}

func Success(c *gin.Context, status int, data any) {
	c.JSON(status, gin.H{
		"data": data,
		"meta": gin.H{
			"requestId": RequestIDFromGin(c),
		},
	})
}

func List(c *gin.Context, data any, nextCursor string, hasMore bool) {
	c.JSON(http.StatusOK, gin.H{
		"data": data,
		"meta": gin.H{
			"requestId":  RequestIDFromGin(c),
			"nextCursor": nextCursor,
			"hasMore":    hasMore,
		},
	})
}

func Error(c *gin.Context, err error) {
	appErr := AsAppError(err)
	c.JSON(appErr.Status, gin.H{
		"error": gin.H{
			"code":    appErr.Code,
			"message": appErr.Message,
			"details": appErr.Details,
		},
		"meta": gin.H{
			"requestId": RequestIDFromGin(c),
		},
	})
}
