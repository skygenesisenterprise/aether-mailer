package utils

import (
	"errors"
	"net/http"
)

type AppError struct {
	Code    string         `json:"code"`
	Message string         `json:"message"`
	Status  int            `json:"-"`
	Details map[string]any `json:"details,omitempty"`
}

func (e *AppError) Error() string {
	return e.Message
}

func NewError(status int, code, message string, details map[string]any) *AppError {
	return &AppError{Status: status, Code: code, Message: message, Details: details}
}

func AsAppError(err error) *AppError {
	var appErr *AppError
	if errors.As(err, &appErr) {
		return appErr
	}
	return NewError(http.StatusInternalServerError, "INTERNAL_ERROR", "An internal error occurred.", nil)
}

var (
	ErrUnauthorized               = NewError(http.StatusUnauthorized, "UNAUTHORIZED", "Authentication is required.", nil)
	ErrForbidden                  = NewError(http.StatusForbidden, "FORBIDDEN", "You are not allowed to access this resource.", nil)
	ErrValidationFailed           = NewError(http.StatusBadRequest, "VALIDATION_ERROR", "The request payload is invalid.", nil)
	ErrEmailAlreadyExists         = NewError(http.StatusConflict, "EMAIL_ALREADY_EXISTS", "An account with this email already exists.", nil)
	ErrInvalidCredentials         = NewError(http.StatusUnauthorized, "INVALID_CREDENTIALS", "Invalid email or password.", nil)
	ErrAccountSuspended           = NewError(http.StatusForbidden, "ACCOUNT_SUSPENDED", "This account is suspended.", nil)
	ErrAccountPending             = NewError(http.StatusForbidden, "ACCOUNT_PENDING", "This account is pending verification.", nil)
	ErrSessionExpired             = NewError(http.StatusUnauthorized, "SESSION_EXPIRED", "The session has expired.", nil)
	ErrSessionRevoked             = NewError(http.StatusUnauthorized, "SESSION_REVOKED", "The session has been revoked.", nil)
	ErrTokenReuseDetected         = NewError(http.StatusUnauthorized, "TOKEN_REUSE_DETECTED", "Refresh token reuse was detected.", nil)
	ErrWorkspaceNotFound          = NewError(http.StatusNotFound, "WORKSPACE_NOT_FOUND", "The requested workspace was not found.", nil)
	ErrConversationNotFound       = NewError(http.StatusNotFound, "CONVERSATION_NOT_FOUND", "The requested conversation was not found.", nil)
	ErrMessageNotFound            = NewError(http.StatusNotFound, "MESSAGE_NOT_FOUND", "The requested message was not found.", nil)
	ErrMembershipRequired         = NewError(http.StatusForbidden, "MEMBERSHIP_REQUIRED", "Workspace membership is required.", nil)
	ErrMessageEditForbidden       = NewError(http.StatusForbidden, "MESSAGE_EDIT_FORBIDDEN", "You cannot edit this message.", nil)
	ErrMessageDeleteForbidden     = NewError(http.StatusForbidden, "MESSAGE_DELETE_FORBIDDEN", "You cannot delete this message.", nil)
	ErrIntegrationNotConfigured   = NewError(http.StatusServiceUnavailable, "INTEGRATION_NOT_CONFIGURED", "The integration is not configured.", nil)
	ErrMeetingProviderUnavailable = NewError(http.StatusServiceUnavailable, "MEETING_PROVIDER_NOT_CONFIGURED", "A meeting provider is not configured.", nil)
	ErrMeetingStateConflict       = NewError(http.StatusConflict, "MEETING_STATE_CONFLICT", "The meeting is not in a valid state for this operation.", nil)
	ErrMeetingSessionUnavailable  = NewError(http.StatusServiceUnavailable, "MEETING_SESSION_UNAVAILABLE", "The meeting media session is unavailable.", nil)
	ErrWebRTCHookUnauthorized     = NewError(http.StatusUnauthorized, "WEBRTC_WEBHOOK_UNAUTHORIZED", "The WebRTC webhook signature is invalid.", nil)
	ErrDependencyUnavailable      = NewError(http.StatusServiceUnavailable, "DEPENDENCY_UNAVAILABLE", "A required dependency is unavailable.", nil)
	ErrWorkerUnavailable          = NewError(http.StatusServiceUnavailable, "WORKER_UNAVAILABLE", "Background workers are unavailable.", nil)
	ErrUnknownJobType             = NewError(http.StatusBadRequest, "UNKNOWN_JOB_TYPE", "The requested job type is not registered.", nil)
	ErrOAuthProviderNotConfigured = NewError(http.StatusServiceUnavailable, "OAUTH_PROVIDER_NOT_CONFIGURED", "The OAuth provider is not configured.", nil)
	ErrOAuthProviderMismatch      = NewError(http.StatusBadRequest, "OAUTH_PROVIDER_MISMATCH", "The OAuth provider does not match.", nil)
	ErrOAuthAccountAlreadyLinked  = NewError(http.StatusConflict, "OAUTH_ACCOUNT_ALREADY_LINKED", "This OAuth account is already linked to a user.", nil)
	ErrOAuthAccountNotFound       = NewError(http.StatusNotFound, "OAUTH_ACCOUNT_NOT_FOUND", "The OAuth account was not found.", nil)
	ErrOAuthStateInvalid          = NewError(http.StatusBadRequest, "OAUTH_STATE_INVALID", "The OAuth state parameter is invalid or expired.", nil)
)
