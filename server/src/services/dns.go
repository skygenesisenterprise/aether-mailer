package services

import (
	"context"
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"encoding/base64"
	"fmt"
	"net"
	"strings"
	"time"

	"github.com/miekg/dns"
	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
	"gorm.io/gorm"
)

// convertDNSRecordType converts models.DNSRecordType to dns.Type
func convertDNSRecordType(recordType models.DNSRecordType) uint16 {
	switch recordType {
	case models.DNSRecordTypeA:
		return dns.TypeA
	case models.DNSRecordTypeAAAA:
		return dns.TypeAAAA
	case models.DNSRecordTypeMX:
		return dns.TypeMX
	case models.DNSRecordTypeTXT:
		return dns.TypeTXT
	case models.DNSRecordTypeCNAME:
		return dns.TypeCNAME
	case models.DNSRecordTypeNS:
		return dns.TypeNS
	case models.DNSRecordTypeSOA:
		return dns.TypeSOA
	case models.DNSRecordTypeSRV:
		return dns.TypeSRV
	case models.DNSRecordTypePTR:
		return dns.TypePTR
	case models.DNSRecordTypeCAA:
		return dns.TypeCAA
	default:
		return dns.TypeA
	}
}

// DNSService represents DNS service
type DNSService struct {
	db *gorm.DB
}

// NewDNSService creates a new DNS service
func NewDNSService(db *gorm.DB) *DNSService {
	return &DNSService{db: db}
}

// CreateDNSZone creates a new DNS zone
func (s *DNSService) CreateDNSZone(ctx context.Context, domainID uint, name, primaryNS, adminEmail string) (*models.DNSZone, error) {
	zone := &models.DNSZone{
		DomainID:   domainID,
		Name:       name,
		Serial:     uint32(time.Now().Unix()),
		PrimaryNS:  primaryNS,
		AdminEmail: adminEmail,
		IsActive:   true,
	}

	if err := s.db.WithContext(ctx).Create(zone).Error; err != nil {
		return nil, fmt.Errorf("failed to create DNS zone: %w", err)
	}

	return zone, nil
}

// CreateDNSRecord creates a new DNS record
func (s *DNSService) CreateDNSRecord(ctx context.Context, record *models.DNSRecord) error {
	if err := s.db.WithContext(ctx).Create(record).Error; err != nil {
		return fmt.Errorf("failed to create DNS record: %w", err)
	}

	// Update zone serial
	if err := s.updateZoneSerial(ctx, record.DomainID); err != nil {
		return fmt.Errorf("failed to update zone serial: %w", err)
	}

	return nil
}

// GetDNSRecords gets DNS records for a domain
func (s *DNSService) GetDNSRecords(ctx context.Context, domainID uint, recordType *models.DNSRecordType) ([]*models.DNSRecord, error) {
	var records []*models.DNSRecord
	query := s.db.WithContext(ctx).Where("domain_id = ?", domainID)

	if recordType != nil {
		query = query.Where("type = ?", *recordType)
	}

	if err := query.Find(&records).Error; err != nil {
		return nil, fmt.Errorf("failed to get DNS records: %w", err)
	}

	return records, nil
}

// UpdateDNSRecord updates a DNS record
func (s *DNSService) UpdateDNSRecord(ctx context.Context, id uint, updates map[string]interface{}) error {
	if err := s.db.WithContext(ctx).Model(&models.DNSRecord{}).Where("id = ?", id).Updates(updates).Error; err != nil {
		return fmt.Errorf("failed to update DNS record: %w", err)
	}

	// Get record to update zone serial
	var record models.DNSRecord
	if err := s.db.WithContext(ctx).First(&record, id).Error; err != nil {
		return fmt.Errorf("failed to get DNS record: %w", err)
	}

	// Update zone serial
	if err := s.updateZoneSerial(ctx, record.DomainID); err != nil {
		return fmt.Errorf("failed to update zone serial: %w", err)
	}

	return nil
}

// DeleteDNSRecord deletes a DNS record
func (s *DNSService) DeleteDNSRecord(ctx context.Context, id uint) error {
	// Get record to update zone serial
	var record models.DNSRecord
	if err := s.db.WithContext(ctx).First(&record, id).Error; err != nil {
		return fmt.Errorf("failed to get DNS record: %w", err)
	}

	if err := s.db.WithContext(ctx).Delete(&models.DNSRecord{}, id).Error; err != nil {
		return fmt.Errorf("failed to delete DNS record: %w", err)
	}

	// Update zone serial
	if err := s.updateZoneSerial(ctx, record.DomainID); err != nil {
		return fmt.Errorf("failed to update zone serial: %w", err)
	}

	return nil
}

// CreateMXRecord creates an MX record
func (s *DNSService) CreateMXRecord(ctx context.Context, domainID uint, name, target string, priority, ttl int) error {
	record := &models.DNSRecord{
		DomainID: domainID,
		Type:     models.DNSRecordTypeMX,
		Name:     name,
		Target:   &target,
		Priority: &priority,
		TTL:      ttl,
	}

	return s.CreateDNSRecord(ctx, record)
}

// CreateTXTRecord creates a TXT record
func (s *DNSService) CreateTXTRecord(ctx context.Context, domainID uint, name, value string, ttl int) error {
	record := &models.DNSRecord{
		DomainID: domainID,
		Type:     models.DNSRecordTypeTXT,
		Name:     name,
		Value:    value,
		TTL:      ttl,
	}

	return s.CreateDNSRecord(ctx, record)
}

// CreateARecord creates an A record
func (s *DNSService) CreateARecord(ctx context.Context, domainID uint, name, value string, ttl int) error {
	// Validate IP address
	if net.ParseIP(value) == nil {
		return fmt.Errorf("invalid IP address: %s", value)
	}

	record := &models.DNSRecord{
		DomainID: domainID,
		Type:     models.DNSRecordTypeA,
		Name:     name,
		Value:    value,
		TTL:      ttl,
	}

	return s.CreateDNSRecord(ctx, record)
}

// CreateAAAARecord creates an AAAA record
func (s *DNSService) CreateAAAARecord(ctx context.Context, domainID uint, name, value string, ttl int) error {
	// Validate IPv6 address
	if net.ParseIP(value) == nil {
		return fmt.Errorf("invalid IPv6 address: %s", value)
	}

	record := &models.DNSRecord{
		DomainID: domainID,
		Type:     models.DNSRecordTypeAAAA,
		Name:     name,
		Value:    value,
		TTL:      ttl,
	}

	return s.CreateDNSRecord(ctx, record)
}

// CreateSPFRecord creates an SPF record
func (s *DNSService) CreateSPFRecord(ctx context.Context, domainID uint, spfValue string, ttl int) error {
	return s.CreateTXTRecord(ctx, domainID, "@", spfValue, ttl)
}

// CreateDKIMRecord creates a DKIM record
func (s *DNSService) CreateDKIMRecord(ctx context.Context, domainID uint, selector, publicKey string, ttl int) error {
	recordName := fmt.Sprintf("%s._domainkey", selector)
	return s.CreateTXTRecord(ctx, domainID, recordName, publicKey, ttl)
}

// CreateDMARCRecord creates a DMARC record
func (s *DNSService) CreateDMARCRecord(ctx context.Context, domainID uint, dmarcValue string, ttl int) error {
	recordName := "_dmarc"
	return s.CreateTXTRecord(ctx, domainID, recordName, dmarcValue, ttl)
}

// GenerateDKIMKeyPair generates a DKIM key pair
func (s *DNSService) GenerateDKIMKeyPair(bits int) (string, string, error) {
	privateKey, err := rsa.GenerateKey(rand.Reader, bits)
	if err != nil {
		return "", "", fmt.Errorf("failed to generate RSA key: %w", err)
	}

	// Encode private key to PKCS8
	privateKeyBytes, err := x509.MarshalPKCS8PrivateKey(privateKey)
	if err != nil {
		return "", "", fmt.Errorf("failed to marshal private key: %w", err)
	}

	privateKeyBase64 := base64.StdEncoding.EncodeToString(privateKeyBytes)

	// Encode public key
	publicKeyBytes, err := x509.MarshalPKIXPublicKey(&privateKey.PublicKey)
	if err != nil {
		return "", "", fmt.Errorf("failed to marshal public key: %w", err)
	}

	publicKeyBase64 := base64.StdEncoding.EncodeToString(publicKeyBytes)

	return privateKeyBase64, publicKeyBase64, nil
}

// CreateDNSSECKey creates a DNSSEC key
func (s *DNSService) CreateDNSSECKey(ctx context.Context, domainID uint, keyType models.DNSSECKeyType, flags, algorithm int) (*models.DNSSECKey, error) {
	privateKey, publicKey, err := s.GenerateDKIMKeyPair(2048)
	if err != nil {
		return nil, fmt.Errorf("failed to generate key pair: %w", err)
	}

	key := &models.DNSSECKey{
		DomainID:   domainID,
		KeyType:    keyType,
		Flags:      flags,
		Algorithm:  algorithm,
		PublicKey:  publicKey,
		PrivateKey: privateKey,
		IsActive:   true,
	}

	if err := s.db.WithContext(ctx).Create(key).Error; err != nil {
		return nil, fmt.Errorf("failed to create DNSSEC key: %w", err)
	}

	return key, nil
}

// ValidateDNSRecord validates a DNS record
func (s *DNSService) ValidateDNSRecord(record *models.DNSRecord) error {
	switch record.Type {
	case models.DNSRecordTypeA:
		if net.ParseIP(record.Value) == nil {
			return fmt.Errorf("invalid IP address for A record: %s", record.Value)
		}
	case models.DNSRecordTypeAAAA:
		if net.ParseIP(record.Value) == nil {
			return fmt.Errorf("invalid IPv6 address for AAAA record: %s", record.Value)
		}
	case models.DNSRecordTypeMX:
		if record.Target == nil || *record.Target == "" {
			return fmt.Errorf("MX record must have a target")
		}
		if record.Priority == nil {
			return fmt.Errorf("MX record must have a priority")
		}
	case models.DNSRecordTypeCNAME:
		if record.Value == "" {
			return fmt.Errorf("CNAME record must have a value")
		}
	case models.DNSRecordTypeTXT:
		if record.Value == "" {
			return fmt.Errorf("TXT record must have a value")
		}
	case models.DNSRecordTypeNS:
		if record.Value == "" {
			return fmt.Errorf("NS record must have a value")
		}
	case models.DNSRecordTypeSRV:
		if record.Target == nil || *record.Target == "" {
			return fmt.Errorf("SRV record must have a target")
		}
		if record.Priority == nil || record.Weight == nil || record.Port == nil {
			return fmt.Errorf("SRV record must have priority, weight, and port")
		}
	}

	return nil
}

// CheckDNSPropagation checks DNS propagation for a record
func (s *DNSService) CheckDNSPropagation(ctx context.Context, domainID uint, recordType models.DNSRecordType, recordValue string) ([]*models.DNSPropagation, error) {
	var results []*models.DNSPropagation

	// Get domain name
	var domain models.Domain
	if err := s.db.WithContext(ctx).First(&domain, domainID).Error; err != nil {
		return nil, fmt.Errorf("failed to get domain: %w", err)
	}

	// Get active DNS providers
	var providers []models.DNSProvider
	if err := s.db.WithContext(ctx).Where("is_active = ?", true).Find(&providers).Error; err != nil {
		return nil, fmt.Errorf("failed to get DNS providers: %w", err)
	}

	// Build list of DNS servers from providers
	var dnsServers []string
	for _, provider := range providers {
		if provider.Type == models.DNSProviderTypeCustom {
			// For custom providers, use their configured DNS servers
			if provider.APIEndpoint != "" {
				dnsServers = append(dnsServers, provider.APIEndpoint)
			}
		} else {
			// For built-in providers, use their standard DNS servers
			switch provider.Type {
			case models.DNSProviderTypeGoogle:
				dnsServers = append(dnsServers, "8.8.8.8:53", "8.8.4.4:53")
			case models.DNSProviderTypeCloudflare:
				dnsServers = append(dnsServers, "1.1.1.1:53", "1.0.0.1:53")
			case models.DNSProviderTypeOpenDNS:
				dnsServers = append(dnsServers, "208.67.222.222:53", "208.67.220.220:53")
			}
		}
	}

	// If no custom providers, use default ones
	if len(dnsServers) == 0 {
		dnsServers = []string{
			"8.8.8.8:53",        // Google
			"1.1.1.1:53",        // Cloudflare
			"208.67.222.222:53", // OpenDNS
		}
	}

	for _, server := range dnsServers {
		propagation := &models.DNSPropagation{
			DomainID:    domainID,
			RecordType:  recordType,
			RecordValue: recordValue,
			Provider:    strings.Split(server, ":")[0],
			Region:      "global",
			CheckedAt:   time.Now(),
		}

		start := time.Now()
		m := new(dns.Msg)
		m.SetQuestion(dns.Fqdn(domain.Name), convertDNSRecordType(recordType))
		m.RecursionDesired = true

		c := new(dns.Client)
		r, _, err := c.Exchange(m, server)
		latency := time.Since(start).Milliseconds()

		propagation.ResponseTime = latency

		if err != nil {
			propagation.Status = "error"
		} else if r.Rcode == dns.RcodeNameError {
			propagation.Status = "nxdomain"
		} else if r.Rcode == dns.RcodeSuccess {
			propagation.Status = "success"
			// Check if our record is present
			found := false
			for _, ans := range r.Answer {
				if strings.Contains(ans.String(), recordValue) {
					found = true
					break
				}
			}
			if !found {
				propagation.Status = "not_found"
			}
		} else {
			propagation.Status = "error"
		}

		results = append(results, propagation)
	}

	// Save propagation results
	for _, result := range results {
		if err := s.db.WithContext(ctx).Create(result).Error; err != nil {
			// Log error but continue
			continue
		}
	}

	return results, nil
}

// GetDNSZone gets a DNS zone by domain ID
func (s *DNSService) GetDNSZone(ctx context.Context, domainID uint) (*models.DNSZone, error) {
	var zone models.DNSZone
	if err := s.db.WithContext(ctx).Preload("Records").Where("domain_id = ?", domainID).First(&zone).Error; err != nil {
		return nil, fmt.Errorf("failed to get DNS zone: %w", err)
	}

	return &zone, nil
}

// updateZoneSerial updates the zone serial number
func (s *DNSService) updateZoneSerial(ctx context.Context, domainID uint) error {
	return s.db.WithContext(ctx).Model(&models.DNSZone{}).
		Where("domain_id = ?", domainID).
		Update("serial", time.Now().Unix()).Error
}

// LogDNSQuery logs a DNS query
func (s *DNSService) LogDNSQuery(ctx context.Context, query *models.DNSQuery) error {
	return s.db.WithContext(ctx).Create(query).Error
}

// DNS Provider Management

// CreateDNSProvider creates a new DNS provider
func (s *DNSService) CreateDNSProvider(ctx context.Context, provider *models.DNSProvider) error {
	if err := s.db.WithContext(ctx).Create(provider).Error; err != nil {
		return fmt.Errorf("failed to create DNS provider: %w", err)
	}

	// Create default capabilities
	capabilities := []models.DNSProviderCapabilityType{
		models.DNSProviderCapabilityA,
		models.DNSProviderCapabilityAAAA,
		models.DNSProviderCapabilityMX,
		models.DNSProviderCapabilityTXT,
		models.DNSProviderCapabilityCNAME,
		models.DNSProviderCapabilityNS,
	}

	for _, capability := range capabilities {
		providerCapability := &models.DNSProviderCapability{
			ProviderID: provider.ID,
			Capability: capability,
			Supported:  true,
		}
		if err := s.db.WithContext(ctx).Create(providerCapability).Error; err != nil {
			// Log error but continue
			continue
		}
	}

	return nil
}

// GetDNSProviders gets all DNS providers
func (s *DNSService) GetDNSProviders(ctx context.Context, includeInactive bool) ([]*models.DNSProvider, error) {
	var providers []*models.DNSProvider
	query := s.db.WithContext(ctx).Preload("Capabilities")

	if !includeInactive {
		query = query.Where("is_active = ?", true)
	}

	if err := query.Find(&providers).Error; err != nil {
		return nil, fmt.Errorf("failed to get DNS providers: %w", err)
	}

	return providers, nil
}

// GetDNSProvider gets a DNS provider by ID
func (s *DNSService) GetDNSProvider(ctx context.Context, id uint) (*models.DNSProvider, error) {
	var provider models.DNSProvider
	if err := s.db.WithContext(ctx).Preload("Capabilities").Preload("Settings").First(&provider, id).Error; err != nil {
		return nil, fmt.Errorf("failed to get DNS provider: %w", err)
	}

	return &provider, nil
}

// UpdateDNSProvider updates a DNS provider
func (s *DNSService) UpdateDNSProvider(ctx context.Context, id uint, updates map[string]interface{}) error {
	if err := s.db.WithContext(ctx).Model(&models.DNSProvider{}).Where("id = ?", id).Updates(updates).Error; err != nil {
		return fmt.Errorf("failed to update DNS provider: %w", err)
	}

	return nil
}

// DeleteDNSProvider deletes a DNS provider
func (s *DNSService) DeleteDNSProvider(ctx context.Context, id uint) error {
	// Check if provider is being used by any zones
	var count int64
	if err := s.db.WithContext(ctx).Model(&models.DNSZone{}).Where("provider_id = ?", id).Count(&count).Error; err != nil {
		return fmt.Errorf("failed to check provider usage: %w", err)
	}

	if count > 0 {
		return fmt.Errorf("cannot delete provider: %d zones are using this provider", count)
	}

	if err := s.db.WithContext(ctx).Delete(&models.DNSProvider{}, id).Error; err != nil {
		return fmt.Errorf("failed to delete DNS provider: %w", err)
	}

	return nil
}

// CreateDNSProviderSetting creates a new DNS provider setting
func (s *DNSService) CreateDNSProviderSetting(ctx context.Context, setting *models.DNSProviderSetting) error {
	if err := s.db.WithContext(ctx).Create(setting).Error; err != nil {
		return fmt.Errorf("failed to create DNS provider setting: %w", err)
	}

	return nil
}

// GetDNSProviderSettings gets settings for a DNS provider
func (s *DNSService) GetDNSProviderSettings(ctx context.Context, providerID uint) ([]*models.DNSProviderSetting, error) {
	var settings []*models.DNSProviderSetting
	if err := s.db.WithContext(ctx).Where("provider_id = ?", providerID).Find(&settings).Error; err != nil {
		return nil, fmt.Errorf("failed to get DNS provider settings: %w", err)
	}

	return settings, nil
}

// CreateDNSProviderCredential creates a new DNS provider credential
func (s *DNSService) CreateDNSProviderCredential(ctx context.Context, credential *models.DNSProviderCredential) error {
	if err := s.db.WithContext(ctx).Create(credential).Error; err != nil {
		return fmt.Errorf("failed to create DNS provider credential: %w", err)
	}

	return nil
}

// GetDNSProviderCredentials gets credentials for a user and provider
func (s *DNSService) GetDNSProviderCredentials(ctx context.Context, userID, providerID uint) ([]*models.DNSProviderCredential, error) {
	var credentials []*models.DNSProviderCredential
	query := s.db.WithContext(ctx).Where("user_id = ? AND is_active = ?", userID, true)

	if providerID > 0 {
		query = query.Where("provider_id = ?", providerID)
	}

	if err := query.Find(&credentials).Error; err != nil {
		return nil, fmt.Errorf("failed to get DNS provider credentials: %w", err)
	}

	return credentials, nil
}

// TestDNSProviderConnection tests connection to a DNS provider
func (s *DNSService) TestDNSProviderConnection(ctx context.Context, providerID uint, credentials map[string]interface{}) error {
	provider, err := s.GetDNSProvider(ctx, providerID)
	if err != nil {
		return fmt.Errorf("failed to get DNS provider: %w", err)
	}

	switch provider.Type {
	case models.DNSProviderTypeCustom:
		// Test custom provider connection
		return s.testCustomProviderConnection(ctx, provider, credentials)
	case models.DNSProviderTypeGoogle:
		// Test Google DNS API connection
		return s.testGoogleDNSConnection(ctx, credentials)
	case models.DNSProviderTypeCloudflare:
		// Test Cloudflare API connection
		return s.testCloudflareDNSConnection(ctx, credentials)
	case models.DNSProviderTypeOpenDNS:
		// OpenDNS doesn't have API, just test basic DNS resolution
		return s.testOpenDNSConnection(ctx, provider)
	default:
		return fmt.Errorf("unsupported provider type: %s", provider.Type)
	}
}

// testCustomProviderConnection tests connection to custom DNS provider
func (s *DNSService) testCustomProviderConnection(ctx context.Context, provider *models.DNSProvider, credentials map[string]interface{}) error {
	// For custom providers, test basic DNS resolution
	if provider.APIEndpoint == "" {
		return fmt.Errorf("no DNS endpoint configured for custom provider")
	}

	// Test basic DNS query
	m := new(dns.Msg)
	m.SetQuestion(dns.Fqdn("example.com"), dns.TypeA)
	m.RecursionDesired = true

	c := new(dns.Client)
	c.Timeout = 5 * time.Second

	_, _, err := c.Exchange(m, provider.APIEndpoint)
	if err != nil {
		return fmt.Errorf("failed to connect to custom DNS provider: %w", err)
	}

	return nil
}

// testGoogleDNSConnection tests Google DNS API connection
func (s *DNSService) testGoogleDNSConnection(ctx context.Context, credentials map[string]interface{}) error {
	// TODO: Implement Google DNS API testing
	// For now, just test basic DNS resolution
	return s.testBasicDNSResolution("8.8.8.8:53")
}

// testCloudflareDNSConnection tests Cloudflare API connection
func (s *DNSService) testCloudflareDNSConnection(ctx context.Context, credentials map[string]interface{}) error {
	// TODO: Implement Cloudflare API testing
	// For now, just test basic DNS resolution
	return s.testBasicDNSResolution("1.1.1.1:53")
}

// testOpenDNSConnection tests OpenDNS connection
func (s *DNSService) testOpenDNSConnection(ctx context.Context, provider *models.DNSProvider) error {
	return s.testBasicDNSResolution("208.67.222.222:53")
}

// testBasicDNSResolution tests basic DNS resolution
func (s *DNSService) testBasicDNSResolution(server string) error {
	m := new(dns.Msg)
	m.SetQuestion(dns.Fqdn("example.com"), dns.TypeA)
	m.RecursionDesired = true

	c := new(dns.Client)
	c.Timeout = 5 * time.Second

	_, _, err := c.Exchange(m, server)
	if err != nil {
		return fmt.Errorf("DNS resolution test failed: %w", err)
	}

	return nil
}

// SyncDNSZoneWithProvider syncs a DNS zone with its provider
func (s *DNSService) SyncDNSZoneWithProvider(ctx context.Context, zoneID uint) error {
	var zone models.DNSZone
	if err := s.db.WithContext(ctx).Preload("Provider").First(&zone, zoneID).Error; err != nil {
		return fmt.Errorf("failed to get DNS zone: %w", err)
	}

	if zone.Provider == nil {
		return fmt.Errorf("zone has no provider configured")
	}

	// Get user credentials for this provider
	var credentials []*models.DNSProviderCredential
	if err := s.db.WithContext(ctx).Where("provider_id = ? AND is_active = ?", zone.Provider.ID, true).Find(&credentials).Error; err != nil {
		return fmt.Errorf("failed to get provider credentials: %w", err)
	}

	if len(credentials) == 0 {
		return fmt.Errorf("no active credentials found for provider")
	}

	// TODO: Implement actual sync logic based on provider type
	// For now, just update the sync status
	now := time.Now()
	updates := map[string]interface{}{
		"sync_status": "synced",
		"last_synced": &now,
	}

	if err := s.db.WithContext(ctx).Model(&zone).Updates(updates).Error; err != nil {
		return fmt.Errorf("failed to update zone sync status: %w", err)
	}

	return nil
}

// GetDNSProviderCapabilities gets capabilities for a DNS provider
func (s *DNSService) GetDNSProviderCapabilities(ctx context.Context, providerID uint) ([]*models.DNSProviderCapability, error) {
	var capabilities []*models.DNSProviderCapability
	if err := s.db.WithContext(ctx).Where("provider_id = ? AND supported = ?", providerID, true).Find(&capabilities).Error; err != nil {
		return nil, fmt.Errorf("failed to get DNS provider capabilities: %w", err)
	}

	return capabilities, nil
}

// InitializeDefaultDNSProviders initializes default DNS providers
func (s *DNSService) InitializeDefaultDNSProviders(ctx context.Context) error {
	defaultProviders := []struct {
		Name        string
		DisplayName string
		Type        models.DNSProviderType
		Description string
		APIEndpoint string
		IsDefault   bool
	}{
		{
			Name:        "google",
			DisplayName: "Google DNS",
			Type:        models.DNSProviderTypeGoogle,
			Description: "Google Public DNS (8.8.8.8, 8.8.4.4)",
			APIEndpoint: "8.8.8.8:53",
			IsDefault:   true,
		},
		{
			Name:        "cloudflare",
			DisplayName: "Cloudflare DNS",
			Type:        models.DNSProviderTypeCloudflare,
			Description: "Cloudflare DNS (1.1.1.1, 1.0.0.1)",
			APIEndpoint: "1.1.1.1:53",
			IsDefault:   true,
		},
		{
			Name:        "opendns",
			DisplayName: "OpenDNS",
			Type:        models.DNSProviderTypeOpenDNS,
			Description: "OpenDNS (208.67.222.222, 208.67.220.220)",
			APIEndpoint: "208.67.222.222:53",
			IsDefault:   true,
		},
	}

	for _, dp := range defaultProviders {
		// Check if provider already exists
		var existingProvider models.DNSProvider
		err := s.db.WithContext(ctx).Where("name = ?", dp.Name).First(&existingProvider).Error
		if err == nil {
			// Provider already exists, skip
			continue
		}

		// Create new provider
		provider := &models.DNSProvider{
			Name:        dp.Name,
			DisplayName: dp.DisplayName,
			Type:        dp.Type,
			Description: dp.Description,
			APIEndpoint: dp.APIEndpoint,
			IsActive:    true,
			IsDefault:   dp.IsDefault,
			RateLimit:   1000,
		}

		if err := s.CreateDNSProvider(ctx, provider); err != nil {
			// Log error but continue with other providers
			continue
		}
	}

	return nil
}
