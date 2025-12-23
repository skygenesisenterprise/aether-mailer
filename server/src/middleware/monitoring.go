package middleware

import (
	"fmt"
	"net/http"
	"runtime"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// MonitoringMiddleware handles request monitoring and metrics
type MonitoringMiddleware struct {
	requestCount  int
	responseTimes []int
}

// NewMonitoringMiddleware creates a new monitoring middleware
func NewMonitoringMiddleware() *MonitoringMiddleware {
	return &MonitoringMiddleware{
		responseTimes: make([]int, 0),
	}
}

// MonitoringMiddleware tracks requests and responses
func (m *MonitoringMiddleware) MonitoringMiddleware() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		startTime := time.Now()
		m.requestCount++

		// Generate request ID for tracing
		requestID := fmt.Sprintf("req_%d_%s", time.Now().UnixNano(), generateRandomString(9))
		ctx.Set("requestID", requestID)
		ctx.Header("X-Request-ID", requestID)

		// Log request start
		fmt.Printf("[%s] %s %s - User-Agent: %s - IP: %s\n",
			time.Now().Format(time.RFC3339),
			ctx.Request.Method,
			ctx.Request.URL.String(),
			ctx.GetHeader("User-Agent"),
			ctx.ClientIP(),
		)

		// Process request
		ctx.Next()

		// Calculate duration
		duration := time.Since(startTime).Milliseconds()
		m.responseTimes = append(m.responseTimes, int(duration))

		// Clean old response times (keep last 1000)
		if len(m.responseTimes) > 1000 {
			m.responseTimes = m.responseTimes[len(m.responseTimes)-1000:]
		}

		// Log response
		fmt.Printf("[%s] %s %s %d - %dms - Size: %d\n",
			time.Now().Format(time.RFC3339),
			ctx.Request.Method,
			ctx.Request.URL.String(),
			ctx.Writer.Status(),
			duration,
			ctx.Writer.Size(),
		)

		// Performance logging for slow requests
		if duration > 1000 {
			fmt.Printf("[PERFORMANCE] Slow request: %s %s - %dms - Status: %d\n",
				ctx.Request.Method,
				ctx.Request.URL.String(),
				duration,
				ctx.Writer.Status(),
			)
		}
	}
}

// ErrorTrackingMiddleware handles error tracking
func (m *MonitoringMiddleware) ErrorTrackingMiddleware() gin.HandlerFunc {
	return gin.CustomRecovery(func(ctx *gin.Context, recovered interface{}) {
		requestID, _ := ctx.Get("requestID")

		if err, ok := recovered.(string); ok {
			fmt.Printf("[ERROR] [%s] Request error: %s - Method: %s - URL: %s - User-Agent: %s - IP: %s\n",
				time.Now().Format(time.RFC3339),
				err,
				ctx.Request.Method,
				ctx.Request.URL.String(),
				ctx.GetHeader("User-Agent"),
				ctx.ClientIP(),
			)

			// Don't send error details in production
			if gin.Mode() == gin.ReleaseMode {
				ctx.JSON(http.StatusInternalServerError, gin.H{
					"error":     "Internal Server Error",
					"requestID": requestID,
				})
			} else {
				ctx.JSON(http.StatusInternalServerError, gin.H{
					"error":     err,
					"requestID": requestID,
				})
			}
		} else {
			fmt.Printf("[ERROR] [%s] Unknown error: %v - Method: %s - URL: %s\n",
				time.Now().Format(time.RFC3339),
				recovered,
				ctx.Request.Method,
				ctx.Request.URL.String(),
			)

			ctx.JSON(http.StatusInternalServerError, gin.H{
				"error": "Internal Server Error",
			})
		}
	})
}

// GetMetrics returns current metrics
func (m *MonitoringMiddleware) GetMetrics() map[string]interface{} {
	stats := m.calculateStats()
	var memStats runtime.MemStats
	runtime.ReadMemStats(&memStats)

	return map[string]interface{}{
		"requests": map[string]interface{}{
			"total":        m.requestCount,
			"responseTime": stats,
		},
		"memory": map[string]interface{}{
			"rss":       memStats.HeapSys,
			"heapUsed":  memStats.HeapAlloc,
			"heapTotal": memStats.HeapSys,
			"external":  memStats.StackSys,
		},
		"uptime":    time.Since(time.Now()).Seconds(), // This would be actual startup time
		"timestamp": time.Now().Format(time.RFC3339),
	}
}

// calculateStats calculates response time statistics
func (m *MonitoringMiddleware) calculateStats() map[string]interface{} {
	if len(m.responseTimes) == 0 {
		return map[string]interface{}{
			"avg": 0,
			"p95": 0,
			"p99": 0,
		}
	}

	// Calculate average
	sum := 0
	for _, duration := range m.responseTimes {
		sum += duration
	}
	avg := sum / len(m.responseTimes)

	// Calculate percentiles (simple implementation)
	sorted := make([]int, len(m.responseTimes))
	copy(sorted, m.responseTimes)

	// Simple bubble sort for demonstration
	for i := 0; i < len(sorted); i++ {
		for j := 0; j < len(sorted)-1-i; j++ {
			if sorted[j] > sorted[j+1] {
				sorted[j], sorted[j+1] = sorted[j+1], sorted[j]
			}
		}
	}

	p95Index := len(sorted) * 95 / 100
	p99Index := len(sorted) * 99 / 100

	p95 := 0
	if p95Index < len(sorted) {
		p95 = sorted[p95Index]
	}

	p99 := 0
	if p99Index < len(sorted) {
		p99 = sorted[p99Index]
	}

	return map[string]interface{}{
		"avg": avg,
		"p95": p95,
		"p99": p99,
	}
}

// generateRandomString generates a random string of given length
func generateRandomString(length int) string {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	b := make([]byte, length)
	for i := range b {
		b[i] = charset[i%len(charset)]
	}
	return string(b)
}

// RequestLoggerMiddleware logs basic request information
func RequestLoggerMiddleware() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		start := time.Now()
		path := ctx.Request.URL.Path
		raw := ctx.Request.URL.RawQuery

		// Process request
		ctx.Next()

		// Calculate latency
		latency := time.Since(start)

		// Get client IP
		clientIP := ctx.ClientIP()

		// Get status code
		statusCode := ctx.Writer.Status()

		// Log request
		if raw != "" {
			path = path + "?" + raw
		}

		method := ctx.Request.Method
		userAgent := ctx.GetHeader("User-Agent")

		fmt.Printf("[%s] %s %s %d %v %s %s\n",
			time.Now().Format(time.RFC3339),
			method,
			path,
			statusCode,
			latency,
			clientIP,
			userAgent,
		)
	}
}

// RateLimitMiddleware provides basic rate limiting
func RateLimitMiddleware() gin.HandlerFunc {
	// This is a simplified rate limiter
	// In production, you'd use a more sophisticated solution like redis
	clients := make(map[string][]time.Time)

	return func(ctx *gin.Context) {
		clientIP := ctx.ClientIP()
		now := time.Now()

		// Clean old requests (older than 1 minute)
		if timestamps, exists := clients[clientIP]; exists {
			validTimestamps := make([]time.Time, 0)
			for _, timestamp := range timestamps {
				if now.Sub(timestamp) < time.Minute {
					validTimestamps = append(validTimestamps, timestamp)
				}
			}
			clients[clientIP] = validTimestamps
		}

		// Check current rate
		if timestamps, exists := clients[clientIP]; exists && len(timestamps) >= 100 {
			ctx.JSON(http.StatusTooManyRequests, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "RATE_LIMIT_EXCEEDED",
					"message": "Too many requests from this IP, please try again later.",
				},
			})
			ctx.Abort()
			return
		}

		// Add current request
		clients[clientIP] = append(clients[clientIP], now)

		ctx.Next()
	}
}
