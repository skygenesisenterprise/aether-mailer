package monitoring

import (
	"encoding/json"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/rs/zerolog"
	"github.com/skygenesisenterprise/aether-mailer/services/config"
)

// LogLevel represents logging level
type LogLevel string

const (
	DebugLevel LogLevel = "debug"
	InfoLevel  LogLevel = "info"
	WarnLevel  LogLevel = "warn"
	ErrorLevel LogLevel = "error"
)

// LogEntry represents a structured log entry
type LogEntry struct {
	Timestamp     string                 `json:"timestamp"`
	Level         LogLevel               `json:"level"`
	Message       string                 `json:"message"`
	Service       string                 `json:"service"`
	CorrelationID string                 `json:"correlationId,omitempty"`
	Metadata      map[string]interface{} `json:"metadata,omitempty"`
	Error         *ErrorInfo             `json:"error,omitempty"`
}

// ErrorInfo represents error information in logs
type ErrorInfo struct {
	Name    string `json:"name"`
	Message string `json:"message"`
	Stack   string `json:"stack,omitempty"`
}

// Logger provides structured logging capabilities
type Logger struct {
	service string
	config  *config.LoggingConfig
	zerolog *zerolog.Logger
}

// NewLogger creates a new Logger instance
func NewLogger(service string, cfg *config.LoggingConfig) *Logger {
	var output = os.Stdout

	// Set log level
	level, err := zerolog.ParseLevel(cfg.Level)
	if err != nil {
		level = zerolog.InfoLevel
	}

	// Create zerolog logger
	zl := zerolog.New(output).Level(level).With().Timestamp().Logger()

	return &Logger{
		service: service,
		config:  cfg,
		zerolog: &zl,
	}
}

// shouldLog checks if the given level should be logged
func (l *Logger) shouldLog(level LogLevel) bool {
	levels := map[LogLevel]int{
		DebugLevel: 0,
		InfoLevel:  1,
		WarnLevel:  2,
		ErrorLevel: 3,
	}

	currentLevel, exists := levels[LogLevel(l.config.Level)]
	if !exists {
		currentLevel = 1 // Default to info
	}

	targetLevel, exists := levels[level]
	if !exists {
		return false
	}

	return targetLevel >= currentLevel
}

// formatLogEntry creates a formatted log entry
func (l *Logger) formatLogEntry(
	level LogLevel,
	message string,
	correlationID string,
	metadata map[string]interface{},
	err error,
) *LogEntry {
	entry := &LogEntry{
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Level:     level,
		Message:   message,
		Service:   l.service,
	}

	if correlationID != "" && l.config.EnableCorrelationID {
		entry.CorrelationID = correlationID
	}

	if metadata != nil {
		entry.Metadata = metadata
	}

	if err != nil {
		entry.Error = &ErrorInfo{
			Name:    fmt.Sprintf("%T", err),
			Message: err.Error(),
		}
	}

	return entry
}

// output outputs the log entry
func (l *Logger) output(entry *LogEntry) {
	if l.config.Format == "json" {
		jsonData, _ := json.Marshal(entry)
		fmt.Println(string(jsonData))
	} else {
		// Text format
		parts := []string{
			fmt.Sprintf("[%s]", entry.Timestamp),
			fmt.Sprintf("[%s]", entry.Level),
			fmt.Sprintf("[%s]", entry.Service),
		}

		if entry.CorrelationID != "" {
			parts = append(parts, fmt.Sprintf("[%s]", entry.CorrelationID))
		}

		parts = append(parts, entry.Message)

		output := strings.Join(parts, " ")

		if entry.Metadata != nil {
			metadataJSON, _ := json.Marshal(entry.Metadata)
			output += fmt.Sprintf(" | Metadata: %s", string(metadataJSON))
		}

		if entry.Error != nil {
			output += fmt.Sprintf("\nError: %s: %s", entry.Error.Name, entry.Error.Message)
			if entry.Error.Stack != "" {
				output += fmt.Sprintf("\nStack: %s", entry.Error.Stack)
			}
		}

		fmt.Println(output)
	}
}

// Debug logs a debug message
func (l *Logger) Debug(message string, correlationID string, metadata map[string]interface{}) {
	if !l.shouldLog(DebugLevel) {
		return
	}
	entry := l.formatLogEntry(DebugLevel, message, correlationID, metadata, nil)
	l.output(entry)
}

// Info logs an info message
func (l *Logger) Info(message string, correlationID string, metadata map[string]interface{}) {
	if !l.shouldLog(InfoLevel) {
		return
	}
	entry := l.formatLogEntry(InfoLevel, message, correlationID, metadata, nil)
	l.output(entry)
}

// Warn logs a warning message
func (l *Logger) Warn(message string, correlationID string, metadata map[string]interface{}) {
	if !l.shouldLog(WarnLevel) {
		return
	}
	entry := l.formatLogEntry(WarnLevel, message, correlationID, metadata, nil)
	l.output(entry)
}

// Error logs an error message
func (l *Logger) Error(message string, err error, correlationID string, metadata map[string]interface{}) {
	if !l.shouldLog(ErrorLevel) {
		return
	}
	entry := l.formatLogEntry(ErrorLevel, message, correlationID, metadata, err)
	l.output(entry)
}

// LogConnection logs connection events
func (l *Logger) LogConnection(clientID, protocol string, action string) {
	metadata := map[string]interface{}{
		"clientId":  clientID,
		"protocol":  protocol,
		"action":    action,
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	}
	l.Info(fmt.Sprintf("%s client", action), "", metadata)
}

// LogEmail logs email events
func (l *Logger) LogEmail(messageID, action string, from string, to []string) {
	metadata := map[string]interface{}{
		"messageId": messageID,
		"action":    action,
		"from":      from,
		"to":        to,
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	}
	l.Info(fmt.Sprintf("Email %s", action), "", metadata)
}

// LogSecurity logs security events
func (l *Logger) LogSecurity(event string, details map[string]interface{}, severity string) {
	var level LogLevel
	switch severity {
	case "high":
		level = ErrorLevel
	case "medium":
		level = WarnLevel
	default:
		level = InfoLevel
	}

	metadata := map[string]interface{}{
		"event":     event,
		"severity":  severity,
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	}

	// Merge details into metadata
	for k, v := range details {
		metadata[k] = v
	}

	switch level {
	case ErrorLevel:
		l.Error(fmt.Sprintf("Security event: %s", event), nil, "", metadata)
	case WarnLevel:
		l.Warn(fmt.Sprintf("Security event: %s", event), "", metadata)
	default:
		l.Info(fmt.Sprintf("Security event: %s", event), "", metadata)
	}
}

// LogPerformance logs performance metrics
func (l *Logger) LogPerformance(operation string, duration time.Duration, metadata map[string]interface{}) {
	perfMetadata := map[string]interface{}{
		"operation": operation,
		"duration":  duration.Milliseconds(),
		"unit":      "ms",
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	}

	// Merge additional metadata
	if metadata != nil {
		for k, v := range metadata {
			perfMetadata[k] = v
		}
	}

	l.Info(fmt.Sprintf("Performance: %s", operation), "", perfMetadata)
}

// LogHealthCheck logs health check results
func (l *Logger) LogHealthCheck(service, status string, details map[string]interface{}) {
	level := InfoLevel
	if status == "unhealthy" {
		level = ErrorLevel
	}

	metadata := map[string]interface{}{
		"service":   service,
		"status":    status,
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	}

	// Merge details into metadata
	if details != nil {
		for k, v := range details {
			metadata[k] = v
		}
	}

	switch level {
	case ErrorLevel:
		l.Error(fmt.Sprintf("Health check: %s", service), nil, "", metadata)
	default:
		l.Info(fmt.Sprintf("Health check: %s", service), "", metadata)
	}
}

// LoggerFactory manages logger instances
type LoggerFactory struct {
	loggers map[string]*Logger
	config  *config.LoggingConfig
}

// NewLoggerFactory creates a new LoggerFactory
func NewLoggerFactory(cfg *config.LoggingConfig) *LoggerFactory {
	return &LoggerFactory{
		loggers: make(map[string]*Logger),
		config:  cfg,
	}
}

// GetLogger gets or creates a logger for a specified service
func (lf *LoggerFactory) GetLogger(service string) *Logger {
	if logger, exists := lf.loggers[service]; exists {
		return logger
	}

	logger := NewLogger(service, lf.config)
	lf.loggers[service] = logger
	return logger
}
