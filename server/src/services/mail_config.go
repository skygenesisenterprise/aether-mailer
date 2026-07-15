package services

import (
	"context"
	"time"

	"github.com/skygenesisenterprise/aether-mailer/server/src/interfaces"
	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
	"github.com/skygenesisenterprise/aether-mailer/server/src/utils"
)

type ConfigService struct {
	repos interfaces.MailRepositorySet
}

func NewConfigService(repos interfaces.MailRepositorySet) *ConfigService {
	return &ConfigService{repos: repos}
}

// ── Auth Config ──

func (s *ConfigService) GetLdapConfig(_ context.Context) map[string]any {
	return map[string]any{"enabled": false, "host": "", "port": 389, "bindDn": "", "bindPassword": "", "userBaseDn": "", "userFilter": "", "groupBaseDn": ""}
}

func (s *ConfigService) UpdateLdapConfig(_ context.Context, _ map[string]any) map[string]any {
	return map[string]any{"updated": true}
}

func (s *ConfigService) TestLdapConnection(_ context.Context) map[string]any {
	return map[string]any{"connected": false}
}

func (s *ConfigService) GetOidcConfig(_ context.Context) map[string]any {
	return map[string]any{"enabled": false, "issuer": "", "clientId": "", "scopes": []string{"openid", "email", "profile"}}
}

func (s *ConfigService) UpdateOidcConfig(_ context.Context, _ map[string]any) map[string]any {
	return map[string]any{"updated": true}
}

func (s *ConfigService) GetSqlAuthConfig(_ context.Context) map[string]any {
	return map[string]any{"enabled": false, "driver": "postgres", "dsn": ""}
}

func (s *ConfigService) UpdateSqlAuthConfig(_ context.Context, _ map[string]any) map[string]any {
	return map[string]any{"updated": true}
}

func (s *ConfigService) TestSqlAuthConnection(_ context.Context) map[string]any {
	return map[string]any{"connected": false}
}

func (s *ConfigService) GetMfaConfig(_ context.Context) map[string]any {
	return map[string]any{"enabled": false, "methods": []string{"totp"}}
}

func (s *ConfigService) UpdateMfaConfig(_ context.Context, _ map[string]any) map[string]any {
	return map[string]any{"updated": true}
}

func (s *ConfigService) GetAppPasswordPolicy(_ context.Context) map[string]any {
	return map[string]any{"enabled": true, "maxPerAccount": 10}
}

func (s *ConfigService) UpdateAppPasswordPolicy(_ context.Context, _ map[string]any) map[string]any {
	return map[string]any{"updated": true}
}

func (s *ConfigService) ListAuthProviders(_ context.Context) []map[string]any {
	return []map[string]any{}
}

func (s *ConfigService) CreateAuthProvider(_ context.Context, _ map[string]any) map[string]any {
	return map[string]any{"created": true}
}

func (s *ConfigService) UpdateAuthProvider(_ context.Context, _ string, _ map[string]any) map[string]any {
	return map[string]any{"updated": true}
}

func (s *ConfigService) DeleteAuthProvider(_ context.Context, _ string) error {
	return nil
}

func (s *ConfigService) ListApiKeys(ctx context.Context, tenantID string) ([]models.ApiKey, error) {
	return s.repos.ApiKeys().List(ctx, tenantID)
}

func (s *ConfigService) CreateApiKey(ctx context.Context, tenantID, name string, scopes []byte) (*models.ApiKey, error) {
	key := &models.ApiKey{
		Common:   models.Common{ID: utils.NewID()},
		Name:     name,
		TenantID: tenantID,
		Prefix:   "ak_",
		Scopes:   scopes,
	}
	if err := s.repos.ApiKeys().Create(ctx, key); err != nil {
		return nil, err
	}
	return key, nil
}

func (s *ConfigService) DeleteApiKey(ctx context.Context, tenantID, keyID string) error {
	return s.repos.ApiKeys().Delete(ctx, tenantID, keyID)
}

// ── Security Config ──

func (s *ConfigService) GetSpamConfig(_ context.Context) map[string]any {
	return map[string]any{"enabled": true, "threshold": 5.0, "action": "reject"}
}

func (s *ConfigService) UpdateSpamConfig(_ context.Context, _ map[string]any) map[string]any {
	return map[string]any{"updated": true}
}

func (s *ConfigService) ListSpamRules(ctx context.Context, tenantID string) ([]models.SpamRule, error) {
	return s.repos.SpamRules().List(ctx, tenantID)
}

func (s *ConfigService) CreateSpamRule(ctx context.Context, tenantID, name, condition, action string, score int) (*models.SpamRule, error) {
	rule := &models.SpamRule{
		Common:   models.Common{ID: utils.NewID()},
		TenantID: tenantID,
		Name:     name,
		Condition: condition,
		Action:   action,
		Score:    score,
		IsEnabled: true,
	}
	if err := s.repos.SpamRules().Create(ctx, rule); err != nil {
		return nil, err
	}
	return rule, nil
}

func (s *ConfigService) UpdateSpamRule(ctx context.Context, tenantID, ruleID, name, condition, action string, score int, isEnabled bool) (*models.SpamRule, error) {
	rules, err := s.repos.SpamRules().List(ctx, tenantID)
	if err != nil {
		return nil, err
	}
	for _, rule := range rules {
		if rule.ID == ruleID {
			rule.Name = name
			rule.Condition = condition
			rule.Action = action
			rule.Score = score
			rule.IsEnabled = isEnabled
			return &rule, s.repos.SpamRules().Update(ctx, &rule)
		}
	}
	return nil, utils.ErrSpamRuleNotFound
}

func (s *ConfigService) DeleteSpamRule(ctx context.Context, tenantID, ruleID string) error {
	return s.repos.SpamRules().Delete(ctx, tenantID, ruleID)
}

func (s *ConfigService) ListDnsblServers(ctx context.Context, tenantID string) ([]models.DnsblServer, error) {
	return s.repos.DnsblServers().List(ctx, tenantID)
}

func (s *ConfigService) AddDnsblServer(ctx context.Context, tenantID, hostname string) (*models.DnsblServer, error) {
	server := &models.DnsblServer{
		Common:    models.Common{ID: utils.NewID()},
		TenantID:  tenantID,
		Hostname:  hostname,
		IsEnabled: true,
	}
	if err := s.repos.DnsblServers().Add(ctx, server); err != nil {
		return nil, err
	}
	return server, nil
}

func (s *ConfigService) RemoveDnsblServer(ctx context.Context, tenantID, serverID string) error {
	return s.repos.DnsblServers().Remove(ctx, tenantID, serverID)
}

func (s *ConfigService) GetClassifierConfig(_ context.Context) map[string]any {
	return map[string]any{"enabled": false, "threshold": 0.9}
}

func (s *ConfigService) UpdateClassifierConfig(_ context.Context, _ map[string]any) map[string]any {
	return map[string]any{"updated": true}
}

func (s *ConfigService) TrainClassifier(_ context.Context, _ string, _ bool) map[string]any {
	return map[string]any{"trained": true}
}

func (s *ConfigService) GetRateLimits(_ context.Context) map[string]any {
	return map[string]any{"smtp": 100, "imap": 50, "jmap": 50, "window": "1m"}
}

func (s *ConfigService) UpdateRateLimits(_ context.Context, _ map[string]any) map[string]any {
	return map[string]any{"updated": true}
}

func (s *ConfigService) ListIpRules(ctx context.Context, tenantID string) ([]models.IpRule, error) {
	return s.repos.IpRules().List(ctx, tenantID)
}

func (s *ConfigService) CreateIpRule(ctx context.Context, tenantID, cidr, action, note string) (*models.IpRule, error) {
	rule := &models.IpRule{
		Common:   models.Common{ID: utils.NewID()},
		TenantID: tenantID,
		CIDR:     cidr,
		Action:   action,
		Note:     note,
	}
	if err := s.repos.IpRules().Create(ctx, rule); err != nil {
		return nil, err
	}
	return rule, nil
}

func (s *ConfigService) DeleteIpRule(ctx context.Context, tenantID, ruleID string) error {
	return s.repos.IpRules().Delete(ctx, tenantID, ruleID)
}

func (s *ConfigService) ListBlockedIps(ctx context.Context) ([]models.BlockedIp, error) {
	return s.repos.BlockedIps().List(ctx)
}

func (s *ConfigService) UnblockIp(ctx context.Context, ipID string) error {
	return s.repos.BlockedIps().Unblock(ctx, ipID)
}

func (s *ConfigService) GetAbuseConfig(_ context.Context) map[string]any {
	return map[string]any{"enabled": true, "maxConnections": 100, "banDuration": "1h"}
}

func (s *ConfigService) UpdateAbuseConfig(_ context.Context, _ map[string]any) map[string]any {
	return map[string]any{"updated": true}
}

func (s *ConfigService) ListAclEntries(ctx context.Context, tenantID string) ([]models.AclEntry, error) {
	return s.repos.AclEntries().List(ctx, tenantID)
}

func (s *ConfigService) CreateAclEntry(ctx context.Context, tenantID, principal, permission, description string) (*models.AclEntry, error) {
	entry := &models.AclEntry{
		Common:      models.Common{ID: utils.NewID()},
		TenantID:    tenantID,
		Principal:   principal,
		Permission:  permission,
		Description: description,
	}
	if err := s.repos.AclEntries().Create(ctx, entry); err != nil {
		return nil, err
	}
	return entry, nil
}

func (s *ConfigService) UpdateAclEntry(ctx context.Context, tenantID, aclID, principal, permission, description string) (*models.AclEntry, error) {
	entries, err := s.repos.AclEntries().List(ctx, tenantID)
	if err != nil {
		return nil, err
	}
	for _, entry := range entries {
		if entry.ID == aclID {
			entry.Principal = principal
			entry.Permission = permission
			entry.Description = description
			return &entry, s.repos.AclEntries().Update(ctx, &entry)
		}
	}
	return nil, utils.ErrAclEntryNotFound
}

func (s *ConfigService) DeleteAclEntry(ctx context.Context, tenantID, aclID string) error {
	return s.repos.AclEntries().Delete(ctx, tenantID, aclID)
}

// ── Network / SMTP / Storage / Server / TLS / Policies Config ──

func (s *ConfigService) GetNetworkConfig(_ context.Context, protocol string) map[string]any {
	return map[string]any{"protocol": protocol, "enabled": true, "port": 0, "tls": true}
}

func (s *ConfigService) UpdateNetworkConfig(_ context.Context, _ string, _ map[string]any) map[string]any {
	return map[string]any{"updated": true}
}

func (s *ConfigService) ListSmtpRoutes(ctx context.Context, tenantID string) ([]models.SmtpRoute, error) {
	return s.repos.SmtpRoutes().List(ctx, tenantID)
}

func (s *ConfigService) CreateSmtpRoute(ctx context.Context, tenantID, name, remoteHost string, port int, requireTls bool, username, password string, maxRetries, priority int) (*models.SmtpRoute, error) {
	route := &models.SmtpRoute{
		Common:     models.Common{ID: utils.NewID()},
		TenantID:   tenantID,
		Name:       name,
		RemoteHost: remoteHost,
		Port:       port,
		RequireTls: requireTls,
		Username:   username,
		Password:   password,
		MaxRetries: maxRetries,
		Priority:   priority,
		IsEnabled:  true,
	}
	if err := s.repos.SmtpRoutes().Create(ctx, route); err != nil {
		return nil, err
	}
	return route, nil
}

func (s *ConfigService) UpdateSmtpRoute(ctx context.Context, tenantID, routeID, name, remoteHost string, port int, requireTls bool, maxRetries, priority int, isEnabled bool) (*models.SmtpRoute, error) {
	route, err := s.repos.SmtpRoutes().GetByID(ctx, tenantID, routeID)
	if err != nil {
		return nil, err
	}
	route.Name = name
	route.RemoteHost = remoteHost
	route.Port = port
	route.RequireTls = requireTls
	route.MaxRetries = maxRetries
	route.Priority = priority
	route.IsEnabled = isEnabled
	return route, s.repos.SmtpRoutes().Update(ctx, route)
}

func (s *ConfigService) DeleteSmtpRoute(ctx context.Context, tenantID, routeID string) error {
	return s.repos.SmtpRoutes().Delete(ctx, tenantID, routeID)
}

func (s *ConfigService) GetStorageConfig(_ context.Context, storageType string) map[string]any {
	return map[string]any{"type": storageType, "enabled": true}
}

func (s *ConfigService) UpdateStorageConfig(_ context.Context, _ string, _ map[string]any) map[string]any {
	return map[string]any{"updated": true}
}

func (s *ConfigService) TestStorageConnection(_ context.Context, _ string, _ map[string]any) map[string]any {
	return map[string]any{"connected": false}
}

func (s *ConfigService) ListStorageBackends(_ context.Context) []map[string]any {
	return []map[string]any{}
}

func (s *ConfigService) GetServerConfig(_ context.Context, key string) map[string]any {
	return map[string]any{"key": key, "value": ""}
}

func (s *ConfigService) UpdateServerConfig(_ context.Context, _ string, _ map[string]any) map[string]any {
	return map[string]any{"updated": true}
}

func (s *ConfigService) FlushCache(_ context.Context) map[string]any {
	return map[string]any{"flushed": true}
}

func (s *ConfigService) TestDnsResolution(_ context.Context, _ string) map[string]any {
	return map[string]any{"resolved": false}
}

func (s *ConfigService) ListCertificates(ctx context.Context, tenantID string) ([]models.Certificate, error) {
	return s.repos.Certificates().List(ctx, tenantID)
}

func (s *ConfigService) UploadCertificate(ctx context.Context, tenantID, domain, certPEM, keyPEM, issuer string, expiresAt time.Time, isAutoRenew bool) (*models.Certificate, error) {
	cert := &models.Certificate{
		Common:      models.Common{ID: utils.NewID()},
		TenantID:    tenantID,
		Domain:      domain,
		CertPEM:     certPEM,
		KeyPEM:      keyPEM,
		Issuer:      issuer,
		ExpiresAt:   expiresAt,
		IsAutoRenew: isAutoRenew,
	}
	if err := s.repos.Certificates().Create(ctx, cert); err != nil {
		return nil, err
	}
	return cert, nil
}

func (s *ConfigService) DeleteCertificate(ctx context.Context, tenantID, certID string) error {
	return s.repos.Certificates().Delete(ctx, tenantID, certID)
}

func (s *ConfigService) GetAcmeConfig(_ context.Context) map[string]any {
	return map[string]any{"enabled": false, "ca": "letsencrypt", "email": ""}
}

func (s *ConfigService) UpdateAcmeConfig(_ context.Context, _ map[string]any) map[string]any {
	return map[string]any{"updated": true}
}

func (s *ConfigService) ProvisionAcmeCert(_ context.Context, _ string) map[string]any {
	return map[string]any{"provisioned": false}
}

func (s *ConfigService) GetAcmeChallenges(_ context.Context) map[string]any {
	return map[string]any{"http": true, "dns": false}
}

func (s *ConfigService) UpdateAcmeChallenges(_ context.Context, _ map[string]any) map[string]any {
	return map[string]any{"updated": true}
}

func (s *ConfigService) GetEncryptionConfig(_ context.Context) map[string]any {
	return map[string]any{"enabled": false, "algorithm": "aes-256-gcm"}
}

func (s *ConfigService) UpdateEncryptionConfig(_ context.Context, _ map[string]any) map[string]any {
	return map[string]any{"updated": true}
}

func (s *ConfigService) GetFilteringConfig(_ context.Context) map[string]any {
	return map[string]any{"enabled": true}
}

func (s *ConfigService) UpdateFilteringConfig(_ context.Context, _ map[string]any) map[string]any {
	return map[string]any{"updated": true}
}

func (s *ConfigService) ListPolicyRules(ctx context.Context, tenantID string) ([]models.PolicyRule, error) {
	return s.repos.PolicyRules().List(ctx, tenantID)
}

func (s *ConfigService) CreatePolicyRule(ctx context.Context, tenantID, name string, conditions, actions []byte, priority int) (*models.PolicyRule, error) {
	rule := &models.PolicyRule{
		Common:     models.Common{ID: utils.NewID()},
		TenantID:   tenantID,
		Name:       name,
		Conditions: conditions,
		Actions:    actions,
		Priority:   priority,
		IsEnabled:  true,
	}
	if err := s.repos.PolicyRules().Create(ctx, rule); err != nil {
		return nil, err
	}
	return rule, nil
}

func (s *ConfigService) UpdatePolicyRule(ctx context.Context, tenantID, ruleID, name string, priority *int, isEnabled bool) (*models.PolicyRule, error) {
	rules, err := s.repos.PolicyRules().List(ctx, tenantID)
	if err != nil {
		return nil, err
	}
	for _, rule := range rules {
		if rule.ID == ruleID {
			if name != "" {
				rule.Name = name
			}
			if priority != nil {
				rule.Priority = *priority
			}
			rule.IsEnabled = isEnabled
			return &rule, s.repos.PolicyRules().Update(ctx, &rule)
		}
	}
	return nil, utils.ErrPolicyRuleNotFound
}

func (s *ConfigService) DeletePolicyRule(ctx context.Context, tenantID, ruleID string) error {
	return s.repos.PolicyRules().Delete(ctx, tenantID, ruleID)
}

func (s *ConfigService) GetRetentionConfig(_ context.Context) map[string]any {
	return map[string]any{"enabled": false, "days": 90}
}

func (s *ConfigService) UpdateRetentionConfig(_ context.Context, _ map[string]any) map[string]any {
	return map[string]any{"updated": true}
}

func (s *ConfigService) GetComplianceConfig(_ context.Context) map[string]any {
	return map[string]any{"gdpr": true, "hipaa": false}
}

func (s *ConfigService) UpdateComplianceConfig(_ context.Context, _ map[string]any) map[string]any {
	return map[string]any{"updated": true}
}

func (s *ConfigService) GetSieveConfig(_ context.Context) map[string]any {
	return map[string]any{"enabled": true}
}

func (s *ConfigService) UpdateSieveConfig(_ context.Context, _ map[string]any) map[string]any {
	return map[string]any{"updated": true}
}

func (s *ConfigService) ListSystemSieveScripts(ctx context.Context, tenantID string) ([]models.SystemSieveScript, error) {
	return s.repos.SystemSieveScripts().List(ctx, tenantID)
}

func (s *ConfigService) CreateSystemSieveScript(ctx context.Context, tenantID, name, scriptBody string) (*models.SystemSieveScript, error) {
	script := &models.SystemSieveScript{
		Common:     models.Common{ID: utils.NewID()},
		TenantID:   tenantID,
		Name:       name,
		ScriptBody: scriptBody,
	}
	if err := s.repos.SystemSieveScripts().Create(ctx, script); err != nil {
		return nil, err
	}
	return script, nil
}

func (s *ConfigService) UpdateSystemSieveScript(ctx context.Context, tenantID, scriptID, name, scriptBody string, isActive bool) (*models.SystemSieveScript, error) {
	scripts, err := s.repos.SystemSieveScripts().List(ctx, tenantID)
	if err != nil {
		return nil, err
	}
	for _, script := range scripts {
		if script.ID == scriptID {
			if name != "" {
				script.Name = name
			}
			if scriptBody != "" {
				script.ScriptBody = scriptBody
			}
			script.IsActive = isActive
			return &script, s.repos.SystemSieveScripts().Update(ctx, &script)
		}
	}
	return nil, utils.ErrSystemSieveNotFound
}

func (s *ConfigService) DeleteSystemSieveScript(ctx context.Context, tenantID, scriptID string) error {
	return s.repos.SystemSieveScripts().Delete(ctx, tenantID, scriptID)
}
