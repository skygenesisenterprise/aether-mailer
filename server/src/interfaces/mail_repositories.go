package interfaces

import (
	"context"

	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
)

type MailAccountRepository interface {
	List(ctx context.Context, tenantID string, domainID string) ([]models.MailAccount, error)
	Create(ctx context.Context, account *models.MailAccount) error
	GetByID(ctx context.Context, tenantID, id string) (*models.MailAccount, error)
	Update(ctx context.Context, account *models.MailAccount) error
	Delete(ctx context.Context, tenantID, id string) error
	CountByDomain(ctx context.Context, tenantID, domainID string) (int64, error)
	CountByTenant(ctx context.Context, tenantID string) (int64, error)
}

type MailDomainRepository interface {
	List(ctx context.Context, tenantID string) ([]models.MailDomain, error)
	Create(ctx context.Context, domain *models.MailDomain) error
	GetByID(ctx context.Context, tenantID, id string) (*models.MailDomain, error)
	Update(ctx context.Context, domain *models.MailDomain) error
	Delete(ctx context.Context, tenantID, id string) error
	GetByName(ctx context.Context, name string) (*models.MailDomain, error)
}

type MailAliasRepository interface {
	ListByAccount(ctx context.Context, tenantID, accountID string) ([]models.MailAlias, error)
	Create(ctx context.Context, alias *models.MailAlias) error
	Delete(ctx context.Context, tenantID, accountID, aliasID string) error
}

type MailIdentityRepository interface {
	ListByAccount(ctx context.Context, tenantID, accountID string) ([]models.MailIdentity, error)
	Create(ctx context.Context, identity *models.MailIdentity) error
	Update(ctx context.Context, identity *models.MailIdentity) error
	Delete(ctx context.Context, tenantID, accountID, identityID string) error
}

type SieveScriptRepository interface {
	ListByAccount(ctx context.Context, tenantID, accountID string) ([]models.SieveScript, error)
	Create(ctx context.Context, script *models.SieveScript) error
	Update(ctx context.Context, script *models.SieveScript) error
	Delete(ctx context.Context, tenantID, accountID, scriptID string) error
}

type FilterRuleRepository interface {
	ListByAccount(ctx context.Context, tenantID, accountID string) ([]models.FilterRule, error)
	Create(ctx context.Context, rule *models.FilterRule) error
	Update(ctx context.Context, rule *models.FilterRule) error
	Delete(ctx context.Context, tenantID, accountID, ruleID string) error
}

type AppPasswordRepository interface {
	ListByAccount(ctx context.Context, tenantID, accountID string) ([]models.AppPassword, error)
	Create(ctx context.Context, pw *models.AppPassword) error
	Delete(ctx context.Context, tenantID, accountID, passwordID string) error
}

type MailSessionRepository interface {
	ListByAccount(ctx context.Context, tenantID, accountID string) ([]models.MailSession, error)
	Revoke(ctx context.Context, tenantID, accountID, sessionID string) error
}

type MailGroupRepository interface {
	List(ctx context.Context, tenantID string) ([]models.MailGroup, error)
	Create(ctx context.Context, group *models.MailGroup) error
	GetByID(ctx context.Context, tenantID, id string) (*models.MailGroup, error)
	Update(ctx context.Context, group *models.MailGroup) error
	Delete(ctx context.Context, tenantID, id string) error
}

type MailGroupMemberRepository interface {
	ListByGroup(ctx context.Context, tenantID, groupID string) ([]models.MailGroupMember, error)
	Add(ctx context.Context, member *models.MailGroupMember) error
	Remove(ctx context.Context, tenantID, groupID, memberID string) error
}

type MailGroupPermissionRepository interface {
	ListByGroup(ctx context.Context, tenantID, groupID string) ([]models.MailGroupPermission, error)
	Set(ctx context.Context, tenantID, groupID string, permissions []models.MailGroupPermission) error
}

type MailRoleRepository interface {
	List(ctx context.Context, tenantID string) ([]models.MailRole, error)
	Create(ctx context.Context, role *models.MailRole) error
	GetByID(ctx context.Context, tenantID, id string) (*models.MailRole, error)
	Update(ctx context.Context, role *models.MailRole) error
	Delete(ctx context.Context, tenantID, id string) error
}

type MailRoleMemberRepository interface {
	ListByRole(ctx context.Context, tenantID, roleID string) ([]models.MailRoleMember, error)
	Add(ctx context.Context, member *models.MailRoleMember) error
	Remove(ctx context.Context, tenantID, roleID, principalID string) error
}

type MailTenantRepository interface {
	List(ctx context.Context) ([]models.MailTenant, error)
	Create(ctx context.Context, tenant *models.MailTenant) error
	GetByID(ctx context.Context, id string) (*models.MailTenant, error)
	Update(ctx context.Context, tenant *models.MailTenant) error
	Delete(ctx context.Context, id string) error
}

type MailingListRepository interface {
	List(ctx context.Context, tenantID string) ([]models.MailingList, error)
	Create(ctx context.Context, list *models.MailingList) error
	GetByID(ctx context.Context, tenantID, id string) (*models.MailingList, error)
	Update(ctx context.Context, list *models.MailingList) error
	Delete(ctx context.Context, tenantID, id string) error
}

type MailingListSubscriberRepository interface {
	ListByList(ctx context.Context, tenantID, listID string) ([]models.MailingListSubscriber, error)
	Add(ctx context.Context, sub *models.MailingListSubscriber) error
	Remove(ctx context.Context, tenantID, listID, subscriberID string) error
}

type MailingListModerationRepository interface {
	GetByList(ctx context.Context, tenantID, listID string) (*models.MailingListModeration, error)
	Upsert(ctx context.Context, mod *models.MailingListModeration) error
}

type SmtpRouteRepository interface {
	List(ctx context.Context, tenantID string) ([]models.SmtpRoute, error)
	Create(ctx context.Context, route *models.SmtpRoute) error
	GetByID(ctx context.Context, tenantID, id string) (*models.SmtpRoute, error)
	Update(ctx context.Context, route *models.SmtpRoute) error
	Delete(ctx context.Context, tenantID, id string) error
}

type SmtpQueueRepository interface {
	List(ctx context.Context, tenantID string) ([]models.SmtpQueueEntry, error)
	Delete(ctx context.Context, tenantID, messageID string) error
	Retry(ctx context.Context, tenantID, messageID string) error
	PurgeExpired(ctx context.Context, tenantID string) (int64, error)
	Stats(ctx context.Context, tenantID string) (map[string]int64, error)
}

type CertificateRepository interface {
	List(ctx context.Context, tenantID string) ([]models.Certificate, error)
	Create(ctx context.Context, cert *models.Certificate) error
	Delete(ctx context.Context, tenantID, certID string) error
}

type LogEntryRepository interface {
	List(ctx context.Context, tenantID, category string, limit int) ([]models.LogEntry, error)
	Search(ctx context.Context, tenantID, query string, limit int) ([]models.LogEntry, error)
}

type ReportRepository interface {
	ListByType(ctx context.Context, tenantID, reportType string) ([]models.ReportRecord, error)
	GetByID(ctx context.Context, tenantID, reportType, id string) (*models.ReportRecord, error)
}

type MetricsRepository interface {
	Insert(ctx context.Context, metrics *models.ServerMetrics) error
	GetLatest(ctx context.Context) (*models.ServerMetrics, error)
	GetHistory(ctx context.Context, limit int) ([]models.ServerMetrics, error)
}

type ApiKeyRepository interface {
	List(ctx context.Context, tenantID string) ([]models.ApiKey, error)
	Create(ctx context.Context, key *models.ApiKey) error
	Delete(ctx context.Context, tenantID, keyID string) error
	GetByHash(ctx context.Context, keyHash string) (*models.ApiKey, error)
	UpdateLastUsed(ctx context.Context, keyID string) error
}

type SpamRuleRepository interface {
	List(ctx context.Context, tenantID string) ([]models.SpamRule, error)
	Create(ctx context.Context, rule *models.SpamRule) error
	Update(ctx context.Context, rule *models.SpamRule) error
	Delete(ctx context.Context, tenantID, ruleID string) error
}

type IpRuleRepository interface {
	List(ctx context.Context, tenantID string) ([]models.IpRule, error)
	Create(ctx context.Context, rule *models.IpRule) error
	Delete(ctx context.Context, tenantID, ruleID string) error
}

type BlockedIpRepository interface {
	List(ctx context.Context) ([]models.BlockedIp, error)
	Unblock(ctx context.Context, ipID string) error
}

type AclEntryRepository interface {
	List(ctx context.Context, tenantID string) ([]models.AclEntry, error)
	Create(ctx context.Context, entry *models.AclEntry) error
	Update(ctx context.Context, entry *models.AclEntry) error
	Delete(ctx context.Context, tenantID, aclID string) error
}

type DnsblServerRepository interface {
	List(ctx context.Context, tenantID string) ([]models.DnsblServer, error)
	Add(ctx context.Context, server *models.DnsblServer) error
	Remove(ctx context.Context, tenantID, serverID string) error
}

type PolicyRuleRepository interface {
	List(ctx context.Context, tenantID string) ([]models.PolicyRule, error)
	Create(ctx context.Context, rule *models.PolicyRule) error
	Update(ctx context.Context, rule *models.PolicyRule) error
	Delete(ctx context.Context, tenantID, ruleID string) error
}

type SystemSieveScriptRepository interface {
	List(ctx context.Context, tenantID string) ([]models.SystemSieveScript, error)
	Create(ctx context.Context, script *models.SystemSieveScript) error
	Update(ctx context.Context, script *models.SystemSieveScript) error
	Delete(ctx context.Context, tenantID, scriptID string) error
}

type MailRepositorySet interface {
	MailAccounts() MailAccountRepository
	MailDomains() MailDomainRepository
	MailAliases() MailAliasRepository
	MailIdentities() MailIdentityRepository
	SieveScripts() SieveScriptRepository
	FilterRules() FilterRuleRepository
	AppPasswords() AppPasswordRepository
	MailSessions() MailSessionRepository
	MailGroups() MailGroupRepository
	MailGroupMembers() MailGroupMemberRepository
	MailGroupPermissions() MailGroupPermissionRepository
	MailRoles() MailRoleRepository
	MailRoleMembers() MailRoleMemberRepository
	MailTenants() MailTenantRepository
	MailingLists() MailingListRepository
	MailingListSubscribers() MailingListSubscriberRepository
	MailingListModerations() MailingListModerationRepository
	SmtpRoutes() SmtpRouteRepository
	SmtpQueue() SmtpQueueRepository
	Certificates() CertificateRepository
	LogEntries() LogEntryRepository
	Reports() ReportRepository
	Metrics() MetricsRepository
	ApiKeys() ApiKeyRepository
	SpamRules() SpamRuleRepository
	IpRules() IpRuleRepository
	BlockedIps() BlockedIpRepository
	AclEntries() AclEntryRepository
	DnsblServers() DnsblServerRepository
	PolicyRules() PolicyRuleRepository
	SystemSieveScripts() SystemSieveScriptRepository
}
