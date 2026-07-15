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

	// Mail domain errors
	ErrMailAccountNotFound    = NewError(http.StatusNotFound, "MAIL_ACCOUNT_NOT_FOUND", "The requested mail account was not found.", nil)
	ErrMailDomainNotFound     = NewError(http.StatusNotFound, "MAIL_DOMAIN_NOT_FOUND", "The requested mail domain was not found.", nil)
	ErrMailAliasNotFound      = NewError(http.StatusNotFound, "MAIL_ALIAS_NOT_FOUND", "The requested mail alias was not found.", nil)
	ErrMailIdentityNotFound   = NewError(http.StatusNotFound, "MAIL_IDENTITY_NOT_FOUND", "The requested mail identity was not found.", nil)
	ErrMailGroupNotFound      = NewError(http.StatusNotFound, "MAIL_GROUP_NOT_FOUND", "The requested mail group was not found.", nil)
	ErrMailRoleNotFound       = NewError(http.StatusNotFound, "MAIL_ROLE_NOT_FOUND", "The requested mail role was not found.", nil)
	ErrMailTenantNotFound     = NewError(http.StatusNotFound, "MAIL_TENANT_NOT_FOUND", "The requested mail tenant was not found.", nil)
	ErrMailingListNotFound    = NewError(http.StatusNotFound, "MAILING_LIST_NOT_FOUND", "The requested mailing list was not found.", nil)
	ErrSubscriberNotFound     = NewError(http.StatusNotFound, "SUBSCRIBER_NOT_FOUND", "The requested subscriber was not found.", nil)
	ErrSmtpRouteNotFound      = NewError(http.StatusNotFound, "SMTP_ROUTE_NOT_FOUND", "The requested SMTP route was not found.", nil)
	ErrQueuedMessageNotFound  = NewError(http.StatusNotFound, "QUEUED_MESSAGE_NOT_FOUND", "The requested queued message was not found.", nil)
	ErrCertificateNotFound    = NewError(http.StatusNotFound, "CERTIFICATE_NOT_FOUND", "The requested certificate was not found.", nil)
	ErrSieveScriptNotFound    = NewError(http.StatusNotFound, "SIEVE_SCRIPT_NOT_FOUND", "The requested Sieve script was not found.", nil)
	ErrFilterRuleNotFound     = NewError(http.StatusNotFound, "FILTER_RULE_NOT_FOUND", "The requested filter rule was not found.", nil)
	ErrAppPasswordNotFound    = NewError(http.StatusNotFound, "APP_PASSWORD_NOT_FOUND", "The requested app password was not found.", nil)
	ErrMailSessionNotFound    = NewError(http.StatusNotFound, "MAIL_SESSION_NOT_FOUND", "The requested mail session was not found.", nil)
	ErrApiKeyNotFound         = NewError(http.StatusNotFound, "API_KEY_NOT_FOUND", "The requested API key was not found.", nil)
	ErrSpamRuleNotFound       = NewError(http.StatusNotFound, "SPAM_RULE_NOT_FOUND", "The requested spam rule was not found.", nil)
	ErrIpRuleNotFound         = NewError(http.StatusNotFound, "IP_RULE_NOT_FOUND", "The requested IP rule was not found.", nil)
	ErrAclEntryNotFound       = NewError(http.StatusNotFound, "ACL_ENTRY_NOT_FOUND", "The requested ACL entry was not found.", nil)
	ErrDnsblServerNotFound    = NewError(http.StatusNotFound, "DNSBL_SERVER_NOT_FOUND", "The requested DNSBL server was not found.", nil)
	ErrBlockedIpNotFound      = NewError(http.StatusNotFound, "BLOCKED_IP_NOT_FOUND", "The requested blocked IP was not found.", nil)
	ErrPolicyRuleNotFound     = NewError(http.StatusNotFound, "POLICY_RULE_NOT_FOUND", "The requested policy rule was not found.", nil)
	ErrEventNotFound          = NewError(http.StatusNotFound, "EVENT_NOT_FOUND", "The requested event was not found.", nil)
	ErrReportNotFound         = NewError(http.StatusNotFound, "REPORT_NOT_FOUND", "The requested report was not found.", nil)
	ErrSystemSieveNotFound    = NewError(http.StatusNotFound, "SYSTEM_SIEVE_NOT_FOUND", "The requested system Sieve script was not found.", nil)
	ErrMailDomainAlreadyExists = NewError(http.StatusConflict, "MAIL_DOMAIN_ALREADY_EXISTS", "A domain with this name already exists.", nil)
	ErrMailAccountExists      = NewError(http.StatusConflict, "MAIL_ACCOUNT_EXISTS", "An account with this name already exists in this domain.", nil)
)
