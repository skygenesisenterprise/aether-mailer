package router

import (
	"time"

	"github.com/skygenesisenterprise/aether-mailer/routers/pkg/routerpkg"
)

// MockLogEntry represents a mock log entry for testing
type MockLogEntry struct {
	Timestamp time.Time `json:"timestamp"`
	Level     string    `json:"level"`
	Service   string    `json:"service"`
	Message   string    `json:"message"`
}

// MockLogger implements the Logger interface for testing
type MockLogger struct {
	entries []MockLogEntry
}

// NewMockLogger creates a new mock logger
func NewMockLogger() *MockLogger {
	return &MockLogger{
		entries: make([]MockLogEntry, 0),
	}
}

// Debug logs a debug message
func (m *MockLogger) Debug(msg string, fields ...interface{}) {
	m.log("debug", msg, fields...)
}

// Info logs an info message
func (m *MockLogger) Info(msg string, fields ...interface{}) {
	m.log("info", msg, fields...)
}

// Warn logs a warning message
func (m *MockLogger) Warn(msg string, fields ...interface{}) {
	m.log("warn", msg, fields...)
}

// Error logs an error message
func (m *MockLogger) Error(msg string, fields ...interface{}) {
	m.log("error", msg, fields...)
}

// Fatal logs a fatal message
func (m *MockLogger) Fatal(msg string, fields ...interface{}) {
	m.log("fatal", msg, fields...)
}

// WithFields returns a logger with fields
func (m *MockLogger) WithFields(fields map[string]interface{}) routerpkg.Logger {
	return &MockLoggerWithFields{
		mockLogger: m,
		fields:     fields,
	}
}

// WithField returns a logger with a field
func (m *MockLogger) WithField(key string, value interface{}) routerpkg.Logger {
	return &MockLoggerWithFields{
		mockLogger: m,
		fields:     map[string]interface{}{key: value},
	}
}

// log adds an entry to the mock logger
func (m *MockLogger) log(level, msg string, fields ...interface{}) {
	entry := MockLogEntry{
		Timestamp: time.Now(),
		Level:     level,
		Message:   msg,
	}

	if len(fields) > 0 {
		// Convert variadic fields to map for storage
		fieldMap := make(map[string]interface{})
		for i, field := range fields {
			// Simple field pairing logic (every two consecutive args are key-value pairs)
			if i+1 < len(fields) {
				fieldMap[fmt.Sprintf("field_%d", i/2)] = fields[i]
				fieldMap[fmt.Sprintf("value_%d", i/2)] = fields[i+1]
			}
		}
		entry.Fields = fieldMap
	}

	m.entries = append(m.entries, entry)
}

// MockLoggerWithFields represents a logger with pre-configured fields
type MockLoggerWithFields struct {
	mockLogger *MockLogger
	fields     map[string]interface{}
}

// Debug logs a debug message with fields
func (m *MockLoggerWithFields) Debug(msg string, fields ...interface{}) {
	m.mockLogger.log("debug", msg, appendFields(m.fields, fields...)...)
}

// Info logs an info message with fields
func (m *MockLoggerWithFields) Info(msg string, fields ...interface{}) {
	m.mockLogger.log("info", msg, appendFields(m.fields, fields...)...)
}

// Warn logs a warning message with fields
func (m *MockLoggerWithFields) Warn(msg string, fields ...interface{}) {
	m.mockLogger.log("warn", msg, appendFields(m.fields, fields...)...)
}

// Error logs an error message with fields
func (m *MockLoggerWithFields) Error(msg string, fields ...interface{}) {
	m.mockLogger.log("error", msg, appendFields(m.fields, fields...)...)
}

// Fatal logs a fatal message with fields
func (m *MockLoggerWithFields) Fatal(msg string, fields ...interface{}) {
	m.mockLogger.log("fatal", msg, appendFields(m.fields, fields...)...)
}

// WithFields adds more fields to the logger
func (m *MockLoggerWithFields) WithFields(fields map[string]interface{}) routerpkg.Logger {
	mergedFields := make(map[string]interface{})

	// Merge existing fields
	for k, v := range m.fields {
		mergedFields[k] = v
	}

	// Add new fields
	for k, v := range fields {
		mergedFields[k] = v
	}

	return &MockLoggerWithFields{
		mockLogger: m.mockLogger,
		fields:     mergedFields,
	}
}

// WithField adds a field to the logger
func (m *MockLoggerWithFields) WithField(key string, value interface{}) routerpkg.Logger {
	mergedFields := make(map[string]interface{})

	// Merge existing fields
	for k, v := range m.fields {
		mergedFields[k] = v
	}

	// Add new field
	mergedFields[key] = value

	return &MockLoggerWithFields{
		mockLogger: m.mockLogger,
		fields:     mergedFields,
	}
}

// GetEntries returns all logged entries
func (m *MockLogger) GetEntries() []MockLogEntry {
	return m.entries
}

// Clear clears all logged entries
func (m *MockLogger) Clear() {
	m.entries = make([]MockLogEntry, 0)
}

// appendFields appends variadic fields to existing field map
func appendFields(existing map[string]interface{}, fields ...interface{}) map[string]interface{} {
	result := make(map[string]interface{})

	// Copy existing fields
	for k, v := range existing {
		result[k] = v
	}

	// Add new fields from variadic arguments
	for i := 0; i < len(fields); i += 2 {
		if i+1 < len(fields) {
			// Every pair of consecutive args is a key-value pair
			key := fmt.Sprintf("field_%d", i/2)
			value := fields[i]
			if i+1 < len(fields) {
				result[key] = fields[i+1]
			} else {
				// If odd number of fields, the last one has no value
				result[key] = nil
			}
		}
	}

	return result
}
