package services

import (
	"context"

	"github.com/skygenesisenterprise/aether-mailer/server/src/interfaces"
	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
	"github.com/skygenesisenterprise/aether-mailer/server/src/utils"
	"gorm.io/gorm"
)

func (r *Repositories) MailAccounts() interfaces.MailAccountRepository      { return &mailAccountRepository{db: r.db} }
func (r *Repositories) MailDomains() interfaces.MailDomainRepository        { return &mailDomainRepository{db: r.db} }
func (r *Repositories) MailAliases() interfaces.MailAliasRepository         { return &mailAliasRepository{db: r.db} }
func (r *Repositories) MailIdentities() interfaces.MailIdentityRepository   { return &mailIdentityRepository{db: r.db} }
func (r *Repositories) SieveScripts() interfaces.SieveScriptRepository      { return &sieveScriptRepository{db: r.db} }
func (r *Repositories) FilterRules() interfaces.FilterRuleRepository        { return &filterRuleRepository{db: r.db} }
func (r *Repositories) AppPasswords() interfaces.AppPasswordRepository      { return &appPasswordRepository{db: r.db} }
func (r *Repositories) MailSessions() interfaces.MailSessionRepository      { return &mailSessionRepository{db: r.db} }
func (r *Repositories) MailGroups() interfaces.MailGroupRepository          { return &mailGroupRepository{db: r.db} }
func (r *Repositories) MailGroupMembers() interfaces.MailGroupMemberRepository { return &mailGroupMemberRepository{db: r.db} }
func (r *Repositories) MailGroupPermissions() interfaces.MailGroupPermissionRepository { return &mailGroupPermissionRepository{db: r.db} }
func (r *Repositories) MailRoles() interfaces.MailRoleRepository            { return &mailRoleRepository{db: r.db} }
func (r *Repositories) MailRoleMembers() interfaces.MailRoleMemberRepository { return &mailRoleMemberRepository{db: r.db} }
func (r *Repositories) MailTenants() interfaces.MailTenantRepository        { return &mailTenantRepository{db: r.db} }
func (r *Repositories) MailingLists() interfaces.MailingListRepository      { return &mailingListRepository{db: r.db} }
func (r *Repositories) MailingListSubscribers() interfaces.MailingListSubscriberRepository { return &mailingListSubscriberRepository{db: r.db} }
func (r *Repositories) MailingListModerations() interfaces.MailingListModerationRepository { return &mailingListModerationRepository{db: r.db} }
func (r *Repositories) SmtpRoutes() interfaces.SmtpRouteRepository          { return &smtpRouteRepository{db: r.db} }
func (r *Repositories) SmtpQueue() interfaces.SmtpQueueRepository           { return &smtpQueueRepository{db: r.db} }
func (r *Repositories) Certificates() interfaces.CertificateRepository      { return &certificateRepository{db: r.db} }
func (r *Repositories) LogEntries() interfaces.LogEntryRepository           { return &logEntryRepository{db: r.db} }
func (r *Repositories) Reports() interfaces.ReportRepository                { return &reportRepository{db: r.db} }
func (r *Repositories) Metrics() interfaces.MetricsRepository               { return &metricsRepository{db: r.db} }
func (r *Repositories) ApiKeys() interfaces.ApiKeyRepository                { return &apiKeyRepository{db: r.db} }
func (r *Repositories) SpamRules() interfaces.SpamRuleRepository            { return &spamRuleRepository{db: r.db} }
func (r *Repositories) IpRules() interfaces.IpRuleRepository                { return &ipRuleRepository{db: r.db} }
func (r *Repositories) BlockedIps() interfaces.BlockedIpRepository          { return &blockedIpRepository{db: r.db} }
func (r *Repositories) AclEntries() interfaces.AclEntryRepository           { return &aclEntryRepository{db: r.db} }
func (r *Repositories) DnsblServers() interfaces.DnsblServerRepository      { return &dnsblServerRepository{db: r.db} }
func (r *Repositories) PolicyRules() interfaces.PolicyRuleRepository        { return &policyRuleRepository{db: r.db} }
func (r *Repositories) SystemSieveScripts() interfaces.SystemSieveScriptRepository { return &systemSieveScriptRepository{db: r.db} }

// ──────────────────────────────────────────────────────
// MailAccount
// ──────────────────────────────────────────────────────

type mailAccountRepository struct{ db *gorm.DB }

func (r *mailAccountRepository) List(ctx context.Context, tenantID string, domainID string) ([]models.MailAccount, error) {
	var items []models.MailAccount
	q := r.db.WithContext(ctx).Where("tenant_id = ?", tenantID)
	if domainID != "" {
		q = q.Where("domain_id = ?", domainID)
	}
	err := q.Order("name asc").Find(&items).Error
	return items, err
}

func (r *mailAccountRepository) Create(ctx context.Context, account *models.MailAccount) error {
	return r.db.WithContext(ctx).Create(account).Error
}

func (r *mailAccountRepository) GetByID(ctx context.Context, tenantID, id string) (*models.MailAccount, error) {
	var item models.MailAccount
	err := r.db.WithContext(ctx).Where("tenant_id = ? AND id = ?", tenantID, id).First(&item).Error
	return &item, normalizeNotFound(err, utils.ErrMailAccountNotFound)
}

func (r *mailAccountRepository) Update(ctx context.Context, account *models.MailAccount) error {
	return r.db.WithContext(ctx).Save(account).Error
}

func (r *mailAccountRepository) Delete(ctx context.Context, tenantID, id string) error {
	return r.db.WithContext(ctx).Where("tenant_id = ? AND id = ?", tenantID, id).Delete(&models.MailAccount{}).Error
}

func (r *mailAccountRepository) CountByDomain(ctx context.Context, tenantID, domainID string) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&models.MailAccount{}).Where("tenant_id = ? AND domain_id = ?", tenantID, domainID).Count(&count).Error
	return count, err
}

func (r *mailAccountRepository) CountByTenant(ctx context.Context, tenantID string) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&models.MailAccount{}).Where("tenant_id = ?", tenantID).Count(&count).Error
	return count, err
}

// ──────────────────────────────────────────────────────
// MailDomain
// ──────────────────────────────────────────────────────

type mailDomainRepository struct{ db *gorm.DB }

func (r *mailDomainRepository) List(ctx context.Context, tenantID string) ([]models.MailDomain, error) {
	var items []models.MailDomain
	err := r.db.WithContext(ctx).Where("tenant_id = ?", tenantID).Order("name asc").Find(&items).Error
	return items, err
}

func (r *mailDomainRepository) Create(ctx context.Context, domain *models.MailDomain) error {
	return r.db.WithContext(ctx).Create(domain).Error
}

func (r *mailDomainRepository) GetByID(ctx context.Context, tenantID, id string) (*models.MailDomain, error) {
	var item models.MailDomain
	err := r.db.WithContext(ctx).Where("tenant_id = ? AND id = ?", tenantID, id).First(&item).Error
	return &item, normalizeNotFound(err, utils.ErrMailDomainNotFound)
}

func (r *mailDomainRepository) Update(ctx context.Context, domain *models.MailDomain) error {
	return r.db.WithContext(ctx).Save(domain).Error
}

func (r *mailDomainRepository) Delete(ctx context.Context, tenantID, id string) error {
	return r.db.WithContext(ctx).Where("tenant_id = ? AND id = ?", tenantID, id).Delete(&models.MailDomain{}).Error
}

func (r *mailDomainRepository) GetByName(ctx context.Context, name string) (*models.MailDomain, error) {
	var item models.MailDomain
	err := r.db.WithContext(ctx).Where("name = ?", name).First(&item).Error
	return &item, normalizeNotFound(err, utils.ErrMailDomainNotFound)
}

// ──────────────────────────────────────────────────────
// MailAlias
// ──────────────────────────────────────────────────────

type mailAliasRepository struct{ db *gorm.DB }

func (r *mailAliasRepository) ListByAccount(ctx context.Context, tenantID, accountID string) ([]models.MailAlias, error) {
	var items []models.MailAlias
	err := r.db.WithContext(ctx).Where("tenant_id = ? AND account_id = ?", tenantID, accountID).Find(&items).Error
	return items, err
}

func (r *mailAliasRepository) Create(ctx context.Context, alias *models.MailAlias) error {
	return r.db.WithContext(ctx).Create(alias).Error
}

func (r *mailAliasRepository) Delete(ctx context.Context, tenantID, accountID, aliasID string) error {
	return r.db.WithContext(ctx).Where("tenant_id = ? AND account_id = ? AND id = ?", tenantID, accountID, aliasID).Delete(&models.MailAlias{}).Error
}

// ──────────────────────────────────────────────────────
// MailIdentity
// ──────────────────────────────────────────────────────

type mailIdentityRepository struct{ db *gorm.DB }

func (r *mailIdentityRepository) ListByAccount(ctx context.Context, tenantID, accountID string) ([]models.MailIdentity, error) {
	var items []models.MailIdentity
	err := r.db.WithContext(ctx).Where("tenant_id = ? AND account_id = ?", tenantID, accountID).Find(&items).Error
	return items, err
}

func (r *mailIdentityRepository) Create(ctx context.Context, identity *models.MailIdentity) error {
	return r.db.WithContext(ctx).Create(identity).Error
}

func (r *mailIdentityRepository) Update(ctx context.Context, identity *models.MailIdentity) error {
	return r.db.WithContext(ctx).Save(identity).Error
}

func (r *mailIdentityRepository) Delete(ctx context.Context, tenantID, accountID, identityID string) error {
	return r.db.WithContext(ctx).Where("tenant_id = ? AND account_id = ? AND id = ?", tenantID, accountID, identityID).Delete(&models.MailIdentity{}).Error
}

// ──────────────────────────────────────────────────────
// SieveScript
// ──────────────────────────────────────────────────────

type sieveScriptRepository struct{ db *gorm.DB }

func (r *sieveScriptRepository) ListByAccount(ctx context.Context, tenantID, accountID string) ([]models.SieveScript, error) {
	var items []models.SieveScript
	err := r.db.WithContext(ctx).Where("tenant_id = ? AND account_id = ?", tenantID, accountID).Find(&items).Error
	return items, err
}

func (r *sieveScriptRepository) Create(ctx context.Context, script *models.SieveScript) error {
	return r.db.WithContext(ctx).Create(script).Error
}

func (r *sieveScriptRepository) Update(ctx context.Context, script *models.SieveScript) error {
	return r.db.WithContext(ctx).Save(script).Error
}

func (r *sieveScriptRepository) Delete(ctx context.Context, tenantID, accountID, scriptID string) error {
	return r.db.WithContext(ctx).Where("tenant_id = ? AND account_id = ? AND id = ?", tenantID, accountID, scriptID).Delete(&models.SieveScript{}).Error
}

// ──────────────────────────────────────────────────────
// FilterRule
// ──────────────────────────────────────────────────────

type filterRuleRepository struct{ db *gorm.DB }

func (r *filterRuleRepository) ListByAccount(ctx context.Context, tenantID, accountID string) ([]models.FilterRule, error) {
	var items []models.FilterRule
	err := r.db.WithContext(ctx).Where("tenant_id = ? AND account_id = ?", tenantID, accountID).Order("priority asc").Find(&items).Error
	return items, err
}

func (r *filterRuleRepository) Create(ctx context.Context, rule *models.FilterRule) error {
	return r.db.WithContext(ctx).Create(rule).Error
}

func (r *filterRuleRepository) Update(ctx context.Context, rule *models.FilterRule) error {
	return r.db.WithContext(ctx).Save(rule).Error
}

func (r *filterRuleRepository) Delete(ctx context.Context, tenantID, accountID, ruleID string) error {
	return r.db.WithContext(ctx).Where("tenant_id = ? AND account_id = ? AND id = ?", tenantID, accountID, ruleID).Delete(&models.FilterRule{}).Error
}

// ──────────────────────────────────────────────────────
// AppPassword
// ──────────────────────────────────────────────────────

type appPasswordRepository struct{ db *gorm.DB }

func (r *appPasswordRepository) ListByAccount(ctx context.Context, tenantID, accountID string) ([]models.AppPassword, error) {
	var items []models.AppPassword
	err := r.db.WithContext(ctx).Where("tenant_id = ? AND account_id = ?", tenantID, accountID).Find(&items).Error
	return items, err
}

func (r *appPasswordRepository) Create(ctx context.Context, pw *models.AppPassword) error {
	return r.db.WithContext(ctx).Create(pw).Error
}

func (r *appPasswordRepository) Delete(ctx context.Context, tenantID, accountID, passwordID string) error {
	return r.db.WithContext(ctx).Where("tenant_id = ? AND account_id = ? AND id = ?", tenantID, accountID, passwordID).Delete(&models.AppPassword{}).Error
}

// ──────────────────────────────────────────────────────
// MailSession
// ──────────────────────────────────────────────────────

type mailSessionRepository struct{ db *gorm.DB }

func (r *mailSessionRepository) ListByAccount(ctx context.Context, tenantID, accountID string) ([]models.MailSession, error) {
	var items []models.MailSession
	err := r.db.WithContext(ctx).Where("tenant_id = ? AND account_id = ? AND revoked_at IS NULL", tenantID, accountID).Order("created_at desc").Find(&items).Error
	return items, err
}

func (r *mailSessionRepository) Revoke(ctx context.Context, tenantID, accountID, sessionID string) error {
	return r.db.WithContext(ctx).Model(&models.MailSession{}).Where("tenant_id = ? AND account_id = ? AND id = ? AND revoked_at IS NULL", tenantID, accountID, sessionID).Update("revoked_at", gorm.Expr("NOW()")).Error
}

// ──────────────────────────────────────────────────────
// MailGroup
// ──────────────────────────────────────────────────────

type mailGroupRepository struct{ db *gorm.DB }

func (r *mailGroupRepository) List(ctx context.Context, tenantID string) ([]models.MailGroup, error) {
	var items []models.MailGroup
	err := r.db.WithContext(ctx).Where("tenant_id = ?", tenantID).Order("name asc").Find(&items).Error
	return items, err
}

func (r *mailGroupRepository) Create(ctx context.Context, group *models.MailGroup) error {
	return r.db.WithContext(ctx).Create(group).Error
}

func (r *mailGroupRepository) GetByID(ctx context.Context, tenantID, id string) (*models.MailGroup, error) {
	var item models.MailGroup
	err := r.db.WithContext(ctx).Where("tenant_id = ? AND id = ?", tenantID, id).First(&item).Error
	return &item, normalizeNotFound(err, utils.ErrMailGroupNotFound)
}

func (r *mailGroupRepository) Update(ctx context.Context, group *models.MailGroup) error {
	return r.db.WithContext(ctx).Save(group).Error
}

func (r *mailGroupRepository) Delete(ctx context.Context, tenantID, id string) error {
	return r.db.WithContext(ctx).Where("tenant_id = ? AND id = ?", tenantID, id).Delete(&models.MailGroup{}).Error
}

// ──────────────────────────────────────────────────────
// MailGroupMember
// ──────────────────────────────────────────────────────

type mailGroupMemberRepository struct{ db *gorm.DB }

func (r *mailGroupMemberRepository) ListByGroup(ctx context.Context, tenantID, groupID string) ([]models.MailGroupMember, error) {
	var items []models.MailGroupMember
	err := r.db.WithContext(ctx).Where("group_id = ?", groupID).Find(&items).Error
	return items, err
}

func (r *mailGroupMemberRepository) Add(ctx context.Context, member *models.MailGroupMember) error {
	return r.db.WithContext(ctx).Create(member).Error
}

func (r *mailGroupMemberRepository) Remove(ctx context.Context, tenantID, groupID, memberID string) error {
	return r.db.WithContext(ctx).Where("group_id = ? AND id = ?", groupID, memberID).Delete(&models.MailGroupMember{}).Error
}

// ──────────────────────────────────────────────────────
// MailGroupPermission
// ──────────────────────────────────────────────────────

type mailGroupPermissionRepository struct{ db *gorm.DB }

func (r *mailGroupPermissionRepository) ListByGroup(ctx context.Context, tenantID, groupID string) ([]models.MailGroupPermission, error) {
	var items []models.MailGroupPermission
	err := r.db.WithContext(ctx).Where("group_id = ?", groupID).Find(&items).Error
	return items, err
}

func (r *mailGroupPermissionRepository) Set(ctx context.Context, tenantID, groupID string, permissions []models.MailGroupPermission) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("group_id = ?", groupID).Delete(&models.MailGroupPermission{}).Error; err != nil {
			return err
		}
		if len(permissions) > 0 {
			for i := range permissions {
				permissions[i].GroupID = groupID
			}
			return tx.Create(&permissions).Error
		}
		return nil
	})
}

// ──────────────────────────────────────────────────────
// MailRole
// ──────────────────────────────────────────────────────

type mailRoleRepository struct{ db *gorm.DB }

func (r *mailRoleRepository) List(ctx context.Context, tenantID string) ([]models.MailRole, error) {
	var items []models.MailRole
	err := r.db.WithContext(ctx).Where("tenant_id = ?", tenantID).Order("name asc").Find(&items).Error
	return items, err
}

func (r *mailRoleRepository) Create(ctx context.Context, role *models.MailRole) error {
	return r.db.WithContext(ctx).Create(role).Error
}

func (r *mailRoleRepository) GetByID(ctx context.Context, tenantID, id string) (*models.MailRole, error) {
	var item models.MailRole
	err := r.db.WithContext(ctx).Where("tenant_id = ? AND id = ?", tenantID, id).First(&item).Error
	return &item, normalizeNotFound(err, utils.ErrMailRoleNotFound)
}

func (r *mailRoleRepository) Update(ctx context.Context, role *models.MailRole) error {
	return r.db.WithContext(ctx).Save(role).Error
}

func (r *mailRoleRepository) Delete(ctx context.Context, tenantID, id string) error {
	return r.db.WithContext(ctx).Where("tenant_id = ? AND id = ?", tenantID, id).Delete(&models.MailRole{}).Error
}

// ──────────────────────────────────────────────────────
// MailRoleMember
// ──────────────────────────────────────────────────────

type mailRoleMemberRepository struct{ db *gorm.DB }

func (r *mailRoleMemberRepository) ListByRole(ctx context.Context, tenantID, roleID string) ([]models.MailRoleMember, error) {
	var items []models.MailRoleMember
	err := r.db.WithContext(ctx).Where("role_id = ?", roleID).Find(&items).Error
	return items, err
}

func (r *mailRoleMemberRepository) Add(ctx context.Context, member *models.MailRoleMember) error {
	return r.db.WithContext(ctx).Create(member).Error
}

func (r *mailRoleMemberRepository) Remove(ctx context.Context, tenantID, roleID, principalID string) error {
	return r.db.WithContext(ctx).Where("role_id = ? AND principal_id = ?", roleID, principalID).Delete(&models.MailRoleMember{}).Error
}

// ──────────────────────────────────────────────────────
// MailTenant
// ──────────────────────────────────────────────────────

type mailTenantRepository struct{ db *gorm.DB }

func (r *mailTenantRepository) List(ctx context.Context) ([]models.MailTenant, error) {
	var items []models.MailTenant
	err := r.db.WithContext(ctx).Order("name asc").Find(&items).Error
	return items, err
}

func (r *mailTenantRepository) Create(ctx context.Context, tenant *models.MailTenant) error {
	return r.db.WithContext(ctx).Create(tenant).Error
}

func (r *mailTenantRepository) GetByID(ctx context.Context, id string) (*models.MailTenant, error) {
	var item models.MailTenant
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&item).Error
	return &item, normalizeNotFound(err, utils.ErrMailTenantNotFound)
}

func (r *mailTenantRepository) Update(ctx context.Context, tenant *models.MailTenant) error {
	return r.db.WithContext(ctx).Save(tenant).Error
}

func (r *mailTenantRepository) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Where("id = ?", id).Delete(&models.MailTenant{}).Error
}

// ──────────────────────────────────────────────────────
// MailingList
// ──────────────────────────────────────────────────────

type mailingListRepository struct{ db *gorm.DB }

func (r *mailingListRepository) List(ctx context.Context, tenantID string) ([]models.MailingList, error) {
	var items []models.MailingList
	err := r.db.WithContext(ctx).Where("tenant_id = ?", tenantID).Order("name asc").Find(&items).Error
	return items, err
}

func (r *mailingListRepository) Create(ctx context.Context, list *models.MailingList) error {
	return r.db.WithContext(ctx).Create(list).Error
}

func (r *mailingListRepository) GetByID(ctx context.Context, tenantID, id string) (*models.MailingList, error) {
	var item models.MailingList
	err := r.db.WithContext(ctx).Where("tenant_id = ? AND id = ?", tenantID, id).First(&item).Error
	return &item, normalizeNotFound(err, utils.ErrMailingListNotFound)
}

func (r *mailingListRepository) Update(ctx context.Context, list *models.MailingList) error {
	return r.db.WithContext(ctx).Save(list).Error
}

func (r *mailingListRepository) Delete(ctx context.Context, tenantID, id string) error {
	return r.db.WithContext(ctx).Where("tenant_id = ? AND id = ?", tenantID, id).Delete(&models.MailingList{}).Error
}

// ──────────────────────────────────────────────────────
// MailingListSubscriber
// ──────────────────────────────────────────────────────

type mailingListSubscriberRepository struct{ db *gorm.DB }

func (r *mailingListSubscriberRepository) ListByList(ctx context.Context, tenantID, listID string) ([]models.MailingListSubscriber, error) {
	var items []models.MailingListSubscriber
	err := r.db.WithContext(ctx).Where("list_id = ?", listID).Find(&items).Error
	return items, err
}

func (r *mailingListSubscriberRepository) Add(ctx context.Context, sub *models.MailingListSubscriber) error {
	return r.db.WithContext(ctx).Create(sub).Error
}

func (r *mailingListSubscriberRepository) Remove(ctx context.Context, tenantID, listID, subscriberID string) error {
	return r.db.WithContext(ctx).Where("list_id = ? AND id = ?", listID, subscriberID).Delete(&models.MailingListSubscriber{}).Error
}

// ──────────────────────────────────────────────────────
// MailingListModeration
// ──────────────────────────────────────────────────────

type mailingListModerationRepository struct{ db *gorm.DB }

func (r *mailingListModerationRepository) GetByList(ctx context.Context, tenantID, listID string) (*models.MailingListModeration, error) {
	var item models.MailingListModeration
	err := r.db.WithContext(ctx).Where("list_id = ?", listID).First(&item).Error
	return &item, normalizeNotFound(err, utils.ErrMailingListNotFound)
}

func (r *mailingListModerationRepository) Upsert(ctx context.Context, mod *models.MailingListModeration) error {
	return r.db.WithContext(ctx).Save(mod).Error
}

// ──────────────────────────────────────────────────────
// SmtpRoute
// ──────────────────────────────────────────────────────

type smtpRouteRepository struct{ db *gorm.DB }

func (r *smtpRouteRepository) List(ctx context.Context, tenantID string) ([]models.SmtpRoute, error) {
	var items []models.SmtpRoute
	err := r.db.WithContext(ctx).Where("tenant_id = ?", tenantID).Order("priority asc").Find(&items).Error
	return items, err
}

func (r *smtpRouteRepository) Create(ctx context.Context, route *models.SmtpRoute) error {
	return r.db.WithContext(ctx).Create(route).Error
}

func (r *smtpRouteRepository) GetByID(ctx context.Context, tenantID, id string) (*models.SmtpRoute, error) {
	var item models.SmtpRoute
	err := r.db.WithContext(ctx).Where("tenant_id = ? AND id = ?", tenantID, id).First(&item).Error
	return &item, normalizeNotFound(err, utils.ErrSmtpRouteNotFound)
}

func (r *smtpRouteRepository) Update(ctx context.Context, route *models.SmtpRoute) error {
	return r.db.WithContext(ctx).Save(route).Error
}

func (r *smtpRouteRepository) Delete(ctx context.Context, tenantID, id string) error {
	return r.db.WithContext(ctx).Where("tenant_id = ? AND id = ?", tenantID, id).Delete(&models.SmtpRoute{}).Error
}

// ──────────────────────────────────────────────────────
// SmtpQueue
// ──────────────────────────────────────────────────────

type smtpQueueRepository struct{ db *gorm.DB }

func (r *smtpQueueRepository) List(ctx context.Context, tenantID string) ([]models.SmtpQueueEntry, error) {
	var items []models.SmtpQueueEntry
	err := r.db.WithContext(ctx).Where("tenant_id = ?", tenantID).Order("created_at desc").Find(&items).Error
	return items, err
}

func (r *smtpQueueRepository) Delete(ctx context.Context, tenantID, messageID string) error {
	return r.db.WithContext(ctx).Where("tenant_id = ? AND id = ?", tenantID, messageID).Delete(&models.SmtpQueueEntry{}).Error
}

func (r *smtpQueueRepository) Retry(ctx context.Context, tenantID, messageID string) error {
	return r.db.WithContext(ctx).Model(&models.SmtpQueueEntry{}).Where("tenant_id = ? AND id = ?", tenantID, messageID).Updates(map[string]any{
		"retries":    gorm.Expr("retries + 1"),
		"next_retry": gorm.Expr("NOW()"),
		"status":     "queued",
		"error":      "",
	}).Error
}

func (r *smtpQueueRepository) PurgeExpired(ctx context.Context, tenantID string) (int64, error) {
	result := r.db.WithContext(ctx).Where("tenant_id = ? AND (next_retry < NOW() OR status = 'failed')", tenantID).Delete(&models.SmtpQueueEntry{})
	return result.RowsAffected, result.Error
}

func (r *smtpQueueRepository) Stats(ctx context.Context, tenantID string) (map[string]int64, error) {
	stats := make(map[string]int64)
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.SmtpQueueEntry{}).Where("tenant_id = ?", tenantID).Count(&count).Error; err != nil {
		return nil, err
	}
	stats["total"] = count

	for _, status := range []string{"queued", "processing", "failed", "delivered"} {
		var s int64
		if err := r.db.WithContext(ctx).Model(&models.SmtpQueueEntry{}).Where("tenant_id = ? AND status = ?", tenantID, status).Count(&s).Error; err != nil {
			return nil, err
		}
		stats[status] = s
	}
	return stats, nil
}

// ──────────────────────────────────────────────────────
// Certificate
// ──────────────────────────────────────────────────────

type certificateRepository struct{ db *gorm.DB }

func (r *certificateRepository) List(ctx context.Context, tenantID string) ([]models.Certificate, error) {
	var items []models.Certificate
	err := r.db.WithContext(ctx).Where("tenant_id = ?", tenantID).Order("domain asc").Find(&items).Error
	return items, err
}

func (r *certificateRepository) Create(ctx context.Context, cert *models.Certificate) error {
	return r.db.WithContext(ctx).Create(cert).Error
}

func (r *certificateRepository) Delete(ctx context.Context, tenantID, certID string) error {
	return r.db.WithContext(ctx).Where("tenant_id = ? AND id = ?", tenantID, certID).Delete(&models.Certificate{}).Error
}

// ──────────────────────────────────────────────────────
// LogEntry
// ──────────────────────────────────────────────────────

type logEntryRepository struct{ db *gorm.DB }

func (r *logEntryRepository) List(ctx context.Context, tenantID, category string, limit int) ([]models.LogEntry, error) {
	var items []models.LogEntry
	q := r.db.WithContext(ctx).Where("tenant_id = ?", tenantID)
	if category != "" {
		q = q.Where("category = ?", category)
	}
	err := q.Order("created_at desc").Limit(limit).Find(&items).Error
	return items, err
}

func (r *logEntryRepository) Search(ctx context.Context, tenantID, query string, limit int) ([]models.LogEntry, error) {
	var items []models.LogEntry
	err := r.db.WithContext(ctx).Where("tenant_id = ? AND message ILIKE ?", tenantID, "%"+query+"%").Order("created_at desc").Limit(limit).Find(&items).Error
	return items, err
}

// ──────────────────────────────────────────────────────
// ReportRecord
// ──────────────────────────────────────────────────────

type reportRepository struct{ db *gorm.DB }

func (r *reportRepository) ListByType(ctx context.Context, tenantID, reportType string) ([]models.ReportRecord, error) {
	var items []models.ReportRecord
	err := r.db.WithContext(ctx).Where("tenant_id = ? AND type = ?", tenantID, reportType).Order("period desc").Find(&items).Error
	return items, err
}

func (r *reportRepository) GetByID(ctx context.Context, tenantID, reportType, id string) (*models.ReportRecord, error) {
	var item models.ReportRecord
	err := r.db.WithContext(ctx).Where("tenant_id = ? AND type = ? AND id = ?", tenantID, reportType, id).First(&item).Error
	return &item, normalizeNotFound(err, utils.ErrReportNotFound)
}

// ──────────────────────────────────────────────────────
// ServerMetrics
// ──────────────────────────────────────────────────────

type metricsRepository struct{ db *gorm.DB }

func (r *metricsRepository) Insert(ctx context.Context, metrics *models.ServerMetrics) error {
	return r.db.WithContext(ctx).Create(metrics).Error
}

func (r *metricsRepository) GetLatest(ctx context.Context) (*models.ServerMetrics, error) {
	var item models.ServerMetrics
	err := r.db.WithContext(ctx).Order("timestamp desc").First(&item).Error
	if err != nil {
		return &item, normalizeNotFound(err, nil)
	}
	return &item, err
}

func (r *metricsRepository) GetHistory(ctx context.Context, limit int) ([]models.ServerMetrics, error) {
	var items []models.ServerMetrics
	err := r.db.WithContext(ctx).Order("timestamp desc").Limit(limit).Find(&items).Error
	return items, err
}

// ──────────────────────────────────────────────────────
// ApiKey
// ──────────────────────────────────────────────────────

type apiKeyRepository struct{ db *gorm.DB }

func (r *apiKeyRepository) List(ctx context.Context, tenantID string) ([]models.ApiKey, error) {
	var items []models.ApiKey
	err := r.db.WithContext(ctx).Where("tenant_id = ? AND revoked_at IS NULL", tenantID).Order("created_at desc").Find(&items).Error
	return items, err
}

func (r *apiKeyRepository) Create(ctx context.Context, key *models.ApiKey) error {
	return r.db.WithContext(ctx).Create(key).Error
}

func (r *apiKeyRepository) Delete(ctx context.Context, tenantID, keyID string) error {
	return r.db.WithContext(ctx).Where("tenant_id = ? AND id = ?", tenantID, keyID).Delete(&models.ApiKey{}).Error
}

func (r *apiKeyRepository) GetByHash(ctx context.Context, keyHash string) (*models.ApiKey, error) {
	var item models.ApiKey
	err := r.db.WithContext(ctx).Where("key_hash = ? AND revoked_at IS NULL", keyHash).First(&item).Error
	return &item, normalizeNotFound(err, utils.ErrApiKeyNotFound)
}

func (r *apiKeyRepository) UpdateLastUsed(ctx context.Context, keyID string) error {
	return r.db.WithContext(ctx).Model(&models.ApiKey{}).Where("id = ?", keyID).Update("last_used_at", gorm.Expr("NOW()")).Error
}

// ──────────────────────────────────────────────────────
// SpamRule
// ──────────────────────────────────────────────────────

type spamRuleRepository struct{ db *gorm.DB }

func (r *spamRuleRepository) List(ctx context.Context, tenantID string) ([]models.SpamRule, error) {
	var items []models.SpamRule
	err := r.db.WithContext(ctx).Where("tenant_id = ?", tenantID).Order("name asc").Find(&items).Error
	return items, err
}

func (r *spamRuleRepository) Create(ctx context.Context, rule *models.SpamRule) error {
	return r.db.WithContext(ctx).Create(rule).Error
}

func (r *spamRuleRepository) Update(ctx context.Context, rule *models.SpamRule) error {
	return r.db.WithContext(ctx).Save(rule).Error
}

func (r *spamRuleRepository) Delete(ctx context.Context, tenantID, ruleID string) error {
	return r.db.WithContext(ctx).Where("tenant_id = ? AND id = ?", tenantID, ruleID).Delete(&models.SpamRule{}).Error
}

// ──────────────────────────────────────────────────────
// IpRule
// ──────────────────────────────────────────────────────

type ipRuleRepository struct{ db *gorm.DB }

func (r *ipRuleRepository) List(ctx context.Context, tenantID string) ([]models.IpRule, error) {
	var items []models.IpRule
	err := r.db.WithContext(ctx).Where("tenant_id = ?", tenantID).Find(&items).Error
	return items, err
}

func (r *ipRuleRepository) Create(ctx context.Context, rule *models.IpRule) error {
	return r.db.WithContext(ctx).Create(rule).Error
}

func (r *ipRuleRepository) Delete(ctx context.Context, tenantID, ruleID string) error {
	return r.db.WithContext(ctx).Where("tenant_id = ? AND id = ?", tenantID, ruleID).Delete(&models.IpRule{}).Error
}

// ──────────────────────────────────────────────────────
// BlockedIp
// ──────────────────────────────────────────────────────

type blockedIpRepository struct{ db *gorm.DB }

func (r *blockedIpRepository) List(ctx context.Context) ([]models.BlockedIp, error) {
	var items []models.BlockedIp
	err := r.db.WithContext(ctx).Order("banned_at desc").Find(&items).Error
	return items, err
}

func (r *blockedIpRepository) Unblock(ctx context.Context, ipID string) error {
	return r.db.WithContext(ctx).Where("id = ?", ipID).Delete(&models.BlockedIp{}).Error
}

// ──────────────────────────────────────────────────────
// AclEntry
// ──────────────────────────────────────────────────────

type aclEntryRepository struct{ db *gorm.DB }

func (r *aclEntryRepository) List(ctx context.Context, tenantID string) ([]models.AclEntry, error) {
	var items []models.AclEntry
	err := r.db.WithContext(ctx).Where("tenant_id = ?", tenantID).Find(&items).Error
	return items, err
}

func (r *aclEntryRepository) Create(ctx context.Context, entry *models.AclEntry) error {
	return r.db.WithContext(ctx).Create(entry).Error
}

func (r *aclEntryRepository) Update(ctx context.Context, entry *models.AclEntry) error {
	return r.db.WithContext(ctx).Save(entry).Error
}

func (r *aclEntryRepository) Delete(ctx context.Context, tenantID, aclID string) error {
	return r.db.WithContext(ctx).Where("tenant_id = ? AND id = ?", tenantID, aclID).Delete(&models.AclEntry{}).Error
}

// ──────────────────────────────────────────────────────
// DnsblServer
// ──────────────────────────────────────────────────────

type dnsblServerRepository struct{ db *gorm.DB }

func (r *dnsblServerRepository) List(ctx context.Context, tenantID string) ([]models.DnsblServer, error) {
	var items []models.DnsblServer
	err := r.db.WithContext(ctx).Where("tenant_id = ?", tenantID).Find(&items).Error
	return items, err
}

func (r *dnsblServerRepository) Add(ctx context.Context, server *models.DnsblServer) error {
	return r.db.WithContext(ctx).Create(server).Error
}

func (r *dnsblServerRepository) Remove(ctx context.Context, tenantID, serverID string) error {
	return r.db.WithContext(ctx).Where("tenant_id = ? AND id = ?", tenantID, serverID).Delete(&models.DnsblServer{}).Error
}

// ──────────────────────────────────────────────────────
// PolicyRule
// ──────────────────────────────────────────────────────

type policyRuleRepository struct{ db *gorm.DB }

func (r *policyRuleRepository) List(ctx context.Context, tenantID string) ([]models.PolicyRule, error) {
	var items []models.PolicyRule
	err := r.db.WithContext(ctx).Where("tenant_id = ?", tenantID).Order("priority asc").Find(&items).Error
	return items, err
}

func (r *policyRuleRepository) Create(ctx context.Context, rule *models.PolicyRule) error {
	return r.db.WithContext(ctx).Create(rule).Error
}

func (r *policyRuleRepository) Update(ctx context.Context, rule *models.PolicyRule) error {
	return r.db.WithContext(ctx).Save(rule).Error
}

func (r *policyRuleRepository) Delete(ctx context.Context, tenantID, ruleID string) error {
	return r.db.WithContext(ctx).Where("tenant_id = ? AND id = ?", tenantID, ruleID).Delete(&models.PolicyRule{}).Error
}

// ──────────────────────────────────────────────────────
// SystemSieveScript
// ──────────────────────────────────────────────────────

type systemSieveScriptRepository struct{ db *gorm.DB }

func (r *systemSieveScriptRepository) List(ctx context.Context, tenantID string) ([]models.SystemSieveScript, error) {
	var items []models.SystemSieveScript
	err := r.db.WithContext(ctx).Where("tenant_id = ?", tenantID).Order("name asc").Find(&items).Error
	return items, err
}

func (r *systemSieveScriptRepository) Create(ctx context.Context, script *models.SystemSieveScript) error {
	return r.db.WithContext(ctx).Create(script).Error
}

func (r *systemSieveScriptRepository) Update(ctx context.Context, script *models.SystemSieveScript) error {
	return r.db.WithContext(ctx).Save(script).Error
}

func (r *systemSieveScriptRepository) Delete(ctx context.Context, tenantID, scriptID string) error {
	return r.db.WithContext(ctx).Where("tenant_id = ? AND id = ?", tenantID, scriptID).Delete(&models.SystemSieveScript{}).Error
}