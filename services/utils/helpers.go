package utils

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"math/big"
	"regexp"
	"strconv"
	"strings"
	"time"
)

// GenerateCorrelationID generates a unique correlation ID
func GenerateCorrelationID() string {
	timestamp := time.Now().Unix()
	randomBytes := make([]byte, 8)
	rand.Read(randomBytes)
	randomStr := base64.URLEncoding.EncodeToString(randomBytes)[:11]
	return fmt.Sprintf("corr_%d_%s", timestamp, randomStr)
}

// Sleep pauses execution for the specified duration
func Sleep(ms int) {
	time.Sleep(time.Duration(ms) * time.Millisecond)
}

// Retry executes a function with retry logic
func Retry(fn func() error, maxRetries int, delay int, exponentialBackoff bool) error {
	var lastErr error

	for attempt := 0; attempt <= maxRetries; attempt++ {
		if err := fn(); err != nil {
			lastErr = err

			if attempt == maxRetries {
				return fmt.Errorf("max retries (%d) exceeded: %w", maxRetries, lastErr)
			}

			currentDelay := delay
			if exponentialBackoff {
				currentDelay = delay * (1 << uint(attempt))
			}

			time.Sleep(time.Duration(currentDelay) * time.Millisecond)
			continue
		}
		return nil
	}

	return lastErr
}

// ValidateEmail validates an email address format
func ValidateEmail(email string) bool {
	emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
	return emailRegex.MatchString(email)
}

// ValidateDomain validates a domain name format
func ValidateDomain(domain string) bool {
	domainRegex := regexp.MustCompile(`^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
	return domainRegex.MatchString(domain)
}

// EmailAddress represents a parsed email address
type EmailAddress struct {
	Name   string
	Email  string
	Domain string
}

// ParseEmailAddress parses an email address string
func ParseEmailAddress(emailAddress string) (*EmailAddress, error) {
	// Simple regex to parse "Name <email@domain.com>" or just "email@domain.com"
	re := regexp.MustCompile(`^(?:"?([^"]*)"?\s)?(?:<?(.+@[^>]+)>?)`)
	matches := re.FindStringSubmatch(emailAddress)

	if len(matches) < 3 || matches[2] == "" {
		return nil, fmt.Errorf("invalid email address format: %s", emailAddress)
	}

	name := strings.TrimSpace(matches[1])
	email := strings.TrimSpace(matches[2])

	// Extract domain from email
	parts := strings.Split(email, "@")
	if len(parts) != 2 {
		return nil, fmt.Errorf("invalid email format: %s", email)
	}

	return &EmailAddress{
		Name:   name,
		Email:  email,
		Domain: strings.ToLower(parts[1]),
	}, nil
}

// FormatBytes formats bytes into human-readable string
func FormatBytes(bytes int64) string {
	if bytes == 0 {
		return "0 Bytes"
	}

	const k = 1024
	sizes := []string{"Bytes", "KB", "MB", "GB"}
	i := 0
	value := float64(bytes)

	for value >= k && i < len(sizes)-1 {
		value /= k
		i++
	}

	return fmt.Sprintf("%.2f %s", value, sizes[i])
}

// SanitizeFilename replaces unsafe characters in filename
func SanitizeFilename(filename string) string {
	re := regexp.MustCompile(`[^a-zA-Z0-9.-]`)
	return re.ReplaceAllString(filename, "_")
}

// IsValidPort checks if a port number is valid
func IsValidPort(port int) bool {
	return port >= 1 && port <= 65535
}

// IsValidHost checks if a hostname is valid
func IsValidHost(host string) bool {
	hostRegex := regexp.MustCompile(`^[a-zA-Z0-9.-]+$`)
	return hostRegex.MatchString(host) && len(host) <= 253
}

// CircularBuffer implements a circular buffer
type CircularBuffer struct {
	buffer []interface{}
	size   int
	index  int
	count  int
}

// NewCircularBuffer creates a new circular buffer
func NewCircularBuffer(size int) *CircularBuffer {
	return &CircularBuffer{
		buffer: make([]interface{}, size),
		size:   size,
	}
}

// Push adds an item to the circular buffer
func (cb *CircularBuffer) Push(item interface{}) {
	cb.buffer[cb.index] = item
	cb.index = (cb.index + 1) % cb.size
	if cb.count < cb.size {
		cb.count++
	}
}

// ToArray returns the buffer contents as a slice
func (cb *CircularBuffer) ToArray() []interface{} {
	if cb.count < cb.size {
		return cb.buffer[:cb.count]
	}

	result := make([]interface{}, cb.count)
	copy(result, cb.buffer[cb.index:])
	copy(result[cb.size-cb.index:], cb.buffer[:cb.index])
	return result
}

// Clear clears the circular buffer
func (cb *CircularBuffer) Clear() {
	cb.index = 0
	cb.count = 0
}

// Length returns the current number of items in the buffer
func (cb *CircularBuffer) Length() int {
	return cb.count
}

// Deferred represents a deferred value
type Deferred struct {
	Value interface{}
	Err   error
}

// NewDeferred creates a new deferred value that can be resolved later
func NewDeferred() *Deferred {
	return &Deferred{}
}

// Resolve sets the value of the deferred
func (d *Deferred) Resolve(value interface{}) {
	d.Value = value
}

// Reject sets the error of the deferred
func (d *Deferred) Reject(err error) {
	d.Err = err
}

// GenerateRandomString generates a random string of specified length
func GenerateRandomString(length int) string {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

	b := make([]byte, length)
	for i := range b {
		n, _ := rand.Int(rand.Reader, big.NewInt(int64(len(charset))))
		b[i] = charset[n.Int64()]
	}

	return string(b)
}

// StringSliceContains checks if a string slice contains a specific string
func StringSliceContains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}

// IntSliceContains checks if an int slice contains a specific int
func IntSliceContains(slice []int, item int) bool {
	for _, i := range slice {
		if i == item {
			return true
		}
	}
	return false
}

// ParsePort parses a port string to integer
func ParsePort(portStr string, defaultPort int) int {
	if port, err := strconv.Atoi(portStr); err == nil && IsValidPort(port) {
		return port
	}
	return defaultPort
}

// MergeMaps merges multiple maps
func MergeMaps(maps ...map[string]interface{}) map[string]interface{} {
	result := make(map[string]interface{})
	for _, m := range maps {
		for k, v := range m {
			result[k] = v
		}
	}
	return result
}

// CloneMap creates a shallow copy of a map
func CloneMap(m map[string]interface{}) map[string]interface{} {
	result := make(map[string]interface{})
	for k, v := range m {
		result[k] = v
	}
	return result
}
