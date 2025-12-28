package service

import (
	"context"
	"net"
	"net/mail"
	"strings"
	"time"

	"github.com/skygenesisenterprise/aether-mailer/package/golang/domain"
	"github.com/skygenesisenterprise/aether-mailer/package/golang/errors"
	"github.com/skygenesisenterprise/aether-mailer/package/golang/repository"
)

// RoutingService handles email routing and delivery decisions
type RoutingService struct {
	domainRepo  repository.DomainRepository
	accountRepo repository.EmailAccountRepository
	aliasRepo   repository.EmailAliasRepository
	policyRepo  repository.PolicyRepository
	eventPub    domain.EventPublisher
	config      *RoutingConfig
	nodeID      string
}

// RoutingConfig defines routing service configuration
type RoutingConfig struct {
	MaxHops         int
	MaxMessageSize  int64
	DeliveryTimeout time.Duration
	RetryAttempts   int
	RetryDelay      time.Duration
	EnableSPF       bool
	EnableDKIM      bool
	EnableDMARC     bool
	LocalDomains    []string
	RelayHosts      []string
	SmtpPort        int
}

// RoutingDecision represents a routing decision
type RoutingDecision struct {
	Action      RoutingAction
	Destination string
	NextHop     *string
	Reason      string
	Policies    []string
}

// RoutingAction defines routing actions
type RoutingAction string

const (
	RoutingActionDeliver    RoutingAction = "DELIVER"
	RoutingActionRelay      RoutingAction = "RELAY"
	RoutingActionReject     RoutingAction = "REJECT"
	RoutingActionQuarantine RoutingAction = "QUARANTINE"
	RoutingActionRedirect   RoutingAction = "REDIRECT"
)

// NewRoutingService creates a new routing service
func NewRoutingService(
	domainRepo repository.DomainRepository,
	accountRepo repository.EmailAccountRepository,
	aliasRepo repository.EmailAliasRepository,
	policyRepo repository.PolicyRepository,
	eventPub domain.EventPublisher,
	config *RoutingConfig,
	nodeID string,
) *RoutingService {
	return &RoutingService{
		domainRepo:  domainRepo,
		accountRepo: accountRepo,
		aliasRepo:   aliasRepo,
		policyRepo:  policyRepo,
		eventPub:    eventPub,
		config:      config,
		nodeID:      nodeID,
	}
}

// RouteMessage determines how to route a message
func (s *RoutingService) RouteMessage(ctx context.Context, message *domain.Message) (*RoutingDecision, error) {
	decision := &RoutingDecision{
		Action:   RoutingActionDeliver,
		Policies: []string{},
	}

	// Validate message size
	if message.Size > s.config.MaxMessageSize {
		decision.Action = RoutingActionReject
		decision.Reason = "Message too large"
		return decision, nil
	}

	// Check hop count
	if s.getHopCount(message) >= s.config.MaxHops {
		decision.Action = RoutingActionReject
		decision.Reason = "Too many hops"
		return decision, nil
	}

	// Process each recipient
	for _, recipient := range message.To {
		recipientDecision, err := s.routeRecipient(ctx, recipient, message)
		if err != nil {
			return nil, err
		}

		// Combine decisions (if any recipient is rejected, reject the whole message)
		if recipientDecision.Action == RoutingActionReject {
			decision.Action = RoutingActionReject
			decision.Reason = recipientDecision.Reason
			decision.Policies = append(decision.Policies, recipientDecision.Policies...)
			break
		}

		decision.Policies = append(decision.Policies, recipientDecision.Policies...)
	}

	// Apply domain-level policies
	if err := s.applyDomainPolicies(ctx, message, decision); err != nil {
		return nil, err
	}

	return decision, nil
}

// routeRecipient determines routing for a specific recipient
func (s *RoutingService) routeRecipient(ctx context.Context, recipient string, message *domain.Message) (*RoutingDecision, error) {
	decision := &RoutingDecision{
		Action:   RoutingActionDeliver,
		Policies: []string{},
	}

	// Parse recipient address
	addr, err := mail.ParseAddress(recipient)
	if err != nil {
		decision.Action = RoutingActionReject
		decision.Reason = "Invalid recipient address"
		return decision, nil
	}

	// Extract domain parts
	parts := strings.Split(addr.Address, "@")
	if len(parts) != 2 {
		decision.Action = RoutingActionReject
		decision.Reason = "Invalid email format"
		return decision, nil
	}

	localPart := parts[0]
	domainName := strings.ToLower(parts[1])

	// Check if this is a local domain
	if s.isLocalDomain(domainName) {
		return s.routeLocalRecipient(ctx, localPart, domainName, recipient)
	}

	// Check if this is a relay domain
	if s.isRelayDomain(domainName) {
		decision.Action = RoutingActionRelay
		decision.Destination = recipient
		decision.Reason = "Relay domain"
		return decision, nil
	}

	// External domain - relay or reject based on policies
	return s.routeExternalRecipient(ctx, domainName, recipient)
}

// routeLocalRecipient handles routing for local recipients
func (s *RoutingService) routeLocalRecipient(ctx context.Context, localPart, domainName, recipient string) (*RoutingDecision, error) {
	decision := &RoutingDecision{
		Action:   RoutingActionDeliver,
		Policies: []string{},
	}

	// Check for email aliases
	alias, err := s.aliasRepo.GetByAlias(ctx, recipient)
	if err != nil {
		return nil, errors.InternalError(err)
	}
	if alias != nil && alias.IsActive {
		decision.Action = RoutingActionRedirect
		decision.Destination = alias.DestEmail
		decision.Reason = "Email alias"
		decision.Policies = append(decision.Policies, "alias:"+alias.Alias)
		return decision, nil
	}

	// Check for email account
	account, err := s.accountRepo.GetByEmail(ctx, recipient)
	if err != nil {
		return nil, errors.InternalError(err)
	}
	if account != nil && account.IsActive {
		decision.Action = RoutingActionDeliver
		decision.Destination = recipient
		decision.Reason = "Local account"
		return decision, nil
	}

	// Check for catch-all
	if err := s.checkCatchAll(ctx, domainName, decision); err != nil {
		return nil, err
	}

	// If no specific routing found, reject
	if decision.Action == RoutingActionDeliver {
		decision.Action = RoutingActionReject
		decision.Reason = "User not found"
	}

	return decision, nil
}

// routeExternalRecipient handles routing for external recipients
func (s *RoutingService) routeExternalRecipient(ctx context.Context, domainName, recipient string) (*RoutingDecision, error) {
	decision := &RoutingDecision{
		Action:   RoutingActionRelay,
		Policies: []string{},
	}

	// Check if relaying is allowed for this domain
	if !s.isRelayAllowed(domainName) {
		decision.Action = RoutingActionReject
		decision.Reason = "Relaying not allowed"
		return decision, nil
	}

	// Perform DNS lookup for MX records
	mxRecords, err := net.LookupMX(domainName)
	if err != nil {
		decision.Action = RoutingActionReject
		decision.Reason = "No MX records found"
		return decision, nil
	}

	if len(mxRecords) == 0 {
		decision.Action = RoutingActionReject
		decision.Reason = "No mail servers found"
		return decision, nil
	}

	// Use the highest priority MX record
	decision.Destination = recipient
	decision.NextHop = &mxRecords[0].Host
	decision.Reason = "External delivery"

	return decision, nil
}

// applyDomainPolicies applies domain-level policies
func (s *RoutingService) applyDomainPolicies(ctx context.Context, message *domain.Message, decision *RoutingDecision) error {
	// Get sender domain
	senderDomain := s.extractDomain(message.From)
	if senderDomain == "" {
		return nil
	}

	// Get active policies for sender domain
	routingType := domain.PolicyTypeRouting
	active := true
	filter := repository.PolicyFilter{
		DomainID: &senderDomain,
		Type:     &routingType,
		IsActive: &active,
	}

	policies, err := s.policyRepo.GetActivePolicies(ctx, filter)
	if err != nil {
		return errors.InternalError(err)
	}

	// Apply policies
	for _, policy := range policies {
		if s.matchesPolicy(message, policy) {
			decision.Policies = append(decision.Policies, policy.Name)

			switch policy.Action {
			case domain.PolicyActionBlock:
				decision.Action = RoutingActionReject
				decision.Reason = "Blocked by policy: " + policy.Name
			case domain.PolicyActionQuarantine:
				decision.Action = RoutingActionQuarantine
				decision.Reason = "Quarantined by policy: " + policy.Name
			case domain.PolicyActionRedirect:
				decision.Action = RoutingActionRedirect
				decision.Reason = "Redirected by policy: " + policy.Name
			}
		}
	}

	return nil
}

// checkCatchAll checks for catch-all email accounts
func (s *RoutingService) checkCatchAll(ctx context.Context, domainName string, decision *RoutingDecision) error {
	// Look for catch-all alias (@domain.com)
	catchAllAlias := "@" + domainName
	alias, err := s.aliasRepo.GetByAlias(ctx, catchAllAlias)
	if err != nil {
		return errors.InternalError(err)
	}
	if alias != nil && alias.IsActive {
		decision.Action = RoutingActionRedirect
		decision.Destination = alias.DestEmail
		decision.Reason = "Catch-all alias"
		decision.Policies = append(decision.Policies, "catchall")
	}

	return nil
}

// Helper functions

func (s *RoutingService) isLocalDomain(domainName string) bool {
	for _, localDomain := range s.config.LocalDomains {
		if strings.EqualFold(localDomain, domainName) {
			return true
		}
	}
	return false
}

func (s *RoutingService) isRelayDomain(domainName string) bool {
	for _, relayDomain := range s.config.RelayHosts {
		if strings.EqualFold(relayDomain, domainName) {
			return true
		}
	}
	return false
}

func (s *RoutingService) isRelayAllowed(domainName string) bool {
	// For now, allow relaying to any domain
	// In production, you might want to check against an allowlist
	return true
}

func (s *RoutingService) extractDomain(email string) string {
	parts := strings.Split(email, "@")
	if len(parts) == 2 {
		return strings.ToLower(parts[1])
	}
	return ""
}

func (s *RoutingService) getHopCount(message *domain.Message) int {
	// This would typically be extracted from message headers
	// For now, return a default value
	return 0
}

func (s *RoutingService) matchesPolicy(message *domain.Message, policy *domain.Policy) bool {
	// This would implement policy matching logic
	// For now, return true as a placeholder
	return true
}

// ValidateRecipient validates a recipient email address
func (s *RoutingService) ValidateRecipient(email string) error {
	_, err := mail.ParseAddress(email)
	if err != nil {
		return errors.NewError(errors.ErrCodeInvalidRecipients, "Invalid recipient address").WithDetail("email", email)
	}
	return nil
}

// ResolveDomain resolves a domain to its mail servers
func (s *RoutingService) ResolveDomain(ctx context.Context, domainName string) ([]string, error) {
	mxRecords, err := net.LookupMX(domainName)
	if err != nil {
		return nil, errors.RoutingFailed(domainName, "DNS lookup failed")
	}

	servers := make([]string, len(mxRecords))
	for i, mx := range mxRecords {
		servers[i] = mx.Host
	}

	return servers, nil
}
