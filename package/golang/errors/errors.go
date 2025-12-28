package errors

import (
	"fmt"
)

// ErrorCode represents typed error codes
type ErrorCode string

const (
	// Domain errors
	ErrCodeDomainNotFound      ErrorCode = "DOMAIN_NOT_FOUND"
	ErrCodeDomainAlreadyExists ErrorCode = "DOMAIN_ALREADY_EXISTS"
	ErrCodeDomainInactive      ErrorCode = "DOMAIN_INACTIVE"
	ErrCodeDomainNotVerified   ErrorCode = "DOMAIN_NOT_VERIFIED"

	// User errors
	ErrCodeUserNotFound       ErrorCode = "USER_NOT_FOUND"
	ErrCodeUserAlreadyExists  ErrorCode = "USER_ALREADY_EXISTS"
	ErrCodeUserInactive       ErrorCode = "USER_INACTIVE"
	ErrCodeUserNotVerified    ErrorCode = "USER_NOT_VERIFIED"
	ErrCodeInvalidCredentials ErrorCode = "INVALID_CREDENTIALS"
	ErrCodeUnauthorized       ErrorCode = "UNAUTHORIZED"
	ErrCodeForbidden          ErrorCode = "FORBIDDEN"

	// Email account errors
	ErrCodeEmailAccountNotFound      ErrorCode = "EMAIL_ACCOUNT_NOT_FOUND"
	ErrCodeEmailAccountAlreadyExists ErrorCode = "EMAIL_ACCOUNT_ALREADY_EXISTS"
	ErrCodeEmailAccountInactive      ErrorCode = "EMAIL_ACCOUNT_INACTIVE"
	ErrCodeInvalidEmailAddress       ErrorCode = "INVALID_EMAIL_ADDRESS"

	// Message errors
	ErrCodeMessageNotFound   ErrorCode = "MESSAGE_NOT_FOUND"
	ErrCodeMessageTooLarge   ErrorCode = "MESSAGE_TOO_LARGE"
	ErrCodeInvalidRecipients ErrorCode = "INVALID_RECIPIENTS"
	ErrCodeMessageRejected   ErrorCode = "MESSAGE_REJECTED"

	// Quota errors
	ErrCodeQuotaExceeded        ErrorCode = "QUOTA_EXCEEDED"
	ErrCodeStorageQuotaExceeded ErrorCode = "STORAGE_QUOTA_EXCEEDED"
	ErrCodeDailyQuotaExceeded   ErrorCode = "DAILY_QUOTA_EXCEEDED"

	// Policy errors
	ErrCodePolicyViolation ErrorCode = "POLICY_VIOLATION"
	ErrCodePolicyNotFound  ErrorCode = "POLICY_NOT_FOUND"

	// Routing errors
	ErrCodeRoutingFailed  ErrorCode = "ROUTING_FAILED"
	ErrCodeDeliveryFailed ErrorCode = "DELIVERY_FAILED"
	ErrCodeRelayDenied    ErrorCode = "RELAY_DENIED"

	// System errors
	ErrCodeInternalError   ErrorCode = "INTERNAL_ERROR"
	ErrCodeDatabaseError   ErrorCode = "DATABASE_ERROR"
	ErrCodeNetworkError    ErrorCode = "NETWORK_ERROR"
	ErrCodeTimeout         ErrorCode = "TIMEOUT"
	ErrCodeValidationError ErrorCode = "VALIDATION_ERROR"
)

// Error represents a typed business error
type Error struct {
	Code    ErrorCode
	Message string
	Details map[string]interface{}
	Cause   error
}

func (e *Error) Error() string {
	if e.Cause != nil {
		return fmt.Sprintf("%s: %s (caused by: %v)", e.Code, e.Message, e.Cause)
	}
	return fmt.Sprintf("%s: %s", e.Code, e.Message)
}

func (e *Error) Unwrap() error {
	return e.Cause
}

// NewError creates a new business error
func NewError(code ErrorCode, message string) *Error {
	return &Error{
		Code:    code,
		Message: message,
		Details: make(map[string]interface{}),
	}
}

// NewErrorWithCause creates a new business error with a cause
func NewErrorWithCause(code ErrorCode, message string, cause error) *Error {
	return &Error{
		Code:    code,
		Message: message,
		Details: make(map[string]interface{}),
		Cause:   cause,
	}
}

// WithDetail adds a detail to the error
func (e *Error) WithDetail(key string, value interface{}) *Error {
	e.Details[key] = value
	return e
}

// IsErrorCode checks if an error matches a specific error code
func IsErrorCode(err error, code ErrorCode) bool {
	if businessErr, ok := err.(*Error); ok {
		return businessErr.Code == code
	}
	return false
}

// Predefined error constructors
func DomainNotFound(id string) *Error {
	return NewError(ErrCodeDomainNotFound, "Domain not found").WithDetail("domain_id", id)
}

func DomainAlreadyExists(name string) *Error {
	return NewError(ErrCodeDomainAlreadyExists, "Domain already exists").WithDetail("domain_name", name)
}

func UserNotFound(id string) *Error {
	return NewError(ErrCodeUserNotFound, "User not found").WithDetail("user_id", id)
}

func UserAlreadyExists(email string) *Error {
	return NewError(ErrCodeUserAlreadyExists, "User already exists").WithDetail("email", email)
}

func InvalidCredentials() *Error {
	return NewError(ErrCodeInvalidCredentials, "Invalid credentials")
}

func EmailAccountNotFound(id string) *Error {
	return NewError(ErrCodeEmailAccountNotFound, "Email account not found").WithDetail("account_id", id)
}

func MessageNotFound(id string) *Error {
	return NewError(ErrCodeMessageNotFound, "Message not found").WithDetail("message_id", id)
}

func QuotaExceeded(resource string, limit int) *Error {
	return NewError(ErrCodeQuotaExceeded, "Quota exceeded").
		WithDetail("resource", resource).
		WithDetail("limit", limit)
}

func MessageRejected(reason string) *Error {
	return NewError(ErrCodeMessageRejected, "Message rejected").WithDetail("reason", reason)
}

func PolicyViolation(policy string, reason string) *Error {
	return NewError(ErrCodePolicyViolation, "Policy violation").
		WithDetail("policy", policy).
		WithDetail("reason", reason)
}

func RoutingFailed(destination string, reason string) *Error {
	return NewError(ErrCodeRoutingFailed, "Routing failed").
		WithDetail("destination", destination).
		WithDetail("reason", reason)
}

func InternalError(cause error) *Error {
	return NewErrorWithCause(ErrCodeInternalError, "Internal error occurred", cause)
}
