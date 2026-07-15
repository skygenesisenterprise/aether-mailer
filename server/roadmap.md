# Aether Mailer — Go Server API Roadmap

> Full list of REST endpoints to implement, inspired by the Stalwart Mail Server
> management architecture. Organized to match the frontend navigation:
> **Management / Configuration / Monitoring**.
>
> All routes are prefixed with `/api/v1` and require `Auth + WorkspaceContext`
> middleware unless explicitly marked `[public]`.

---

## Conventions

| Convention | Detail |
|---|---|
| **Base path** | `/api/v1/mail` |
| **Auth** | JWT Bearer via `middleware.Auth` |
| **Tenant scope** | All queries scoped to `workspaceId` from `middleware.WorkspaceContext` |
| **Pagination** | Cursor-based via `utils.Pagination` (already implemented) |
| **Error format** | `utils.AppError` → RFC 7807 `application/problem+json` |
| **Repository** | New interfaces added to `src/interfaces/repositories.go` |
| **Service** | New files under `src/services/mail_*.go` |
| **Handler** | New file `src/routes/mail.go` |
| **Model** | New file `src/models/mail.go` |

---

## 1 — Management (`/api/v1/mail/management/`)

### 1.1 Accounts

| Method | Path | Handler | Status | Description |
|---|---|---|---|---|
| `GET` | `/accounts` | `ListAccounts` | ⬜ | List all mail accounts (paginated, filterable by domain) |
| `POST` | `/accounts` | `CreateAccount` | ⬜ | Create a new mail account |
| `GET` | `/accounts/:accountId` | `GetAccount` | ⬜ | Get account details |
| `PATCH` | `/accounts/:accountId` | `UpdateAccount` | ⬜ | Update account settings |
| `DELETE` | `/accounts/:accountId` | `DeleteAccount` | ⬜ | Soft-delete an account |
| `POST` | `/accounts/:accountId/enable` | `EnableAccount` | ⬜ | Enable a disabled account |
| `POST` | `/accounts/:accountId/disable` | `DisableAccount` | ⬜ | Disable an account |
| `POST` | `/accounts/:accountId/password` | `ResetAccountPassword` | ⬜ | Admin password reset |
| `GET` | `/accounts/:accountId/quota` | `GetAccountQuota` | ⬜ | Get storage quota usage |
| `PATCH` | `/accounts/:accountId/quota` | `UpdateAccountQuota` | ⬜ | Update storage quota limit |
| `GET` | `/accounts/:accountId/aliases` | `ListAliases` | ⬜ | List email aliases for account |
| `POST` | `/accounts/:accountId/aliases` | `CreateAlias` | ⬜ | Add an email alias |
| `DELETE` | `/accounts/:accountId/aliases/:aliasId` | `DeleteAlias` | ⬜ | Remove an email alias |
| `GET` | `/accounts/:accountId/identities` | `ListIdentities` | ⬜ | List sending identities |
| `POST` | `/accounts/:accountId/identities` | `CreateIdentity` | ⬜ | Create a sending identity |
| `PATCH` | `/accounts/:accountId/identities/:identityId` | `UpdateIdentity` | ⬜ | Update sending identity |
| `DELETE` | `/accounts/:accountId/identities/:identityId` | `DeleteIdentity` | ⬜ | Delete sending identity |
| `GET` | `/accounts/:accountId/sessions` | `ListAccountSessions` | ⬜ | List active IMAP/JMAP sessions |
| `DELETE` | `/accounts/:accountId/sessions/:sessionId` | `RevokeAccountSession` | ⬜ | Revoke a specific session |
| `GET` | `/accounts/:accountId/filters` | `ListFilterRules` | ⬜ | List Sieve filter rules |
| `POST` | `/accounts/:accountId/filters` | `CreateFilterRule` | ⬜ | Create a Sieve filter rule |
| `PATCH` | `/accounts/:accountId/filters/:filterId` | `UpdateFilterRule` | ⬜ | Update a Sieve filter rule |
| `DELETE` | `/accounts/:accountId/filters/:filterId` | `DeleteFilterRule` | ⬜ | Delete a Sieve filter rule |
| `GET` | `/accounts/:accountId/vacation` | `GetVacationResponder` | ⬜ | Get auto-reply settings |
| `PUT` | `/accounts/:accountId/vacation` | `UpdateVacationResponder` | ⬜ | Set auto-reply settings |
| `GET` | `/accounts/:accountId/signature` | `GetSignature` | ⬜ | Get email signature |
| `PUT` | `/accounts/:accountId/signature` | `UpdateSignature` | ⬜ | Set email signature |
| `GET` | `/accounts/:accountId/forwarding` | `GetForwarding` | ⬜ | Get forwarding settings |
| `PUT` | `/accounts/:accountId/forwarding` | `UpdateForwarding` | ⬜ | Set forwarding settings |
| `GET` | `/accounts/:accountId/app-passwords` | `ListAppPasswords` | ⬜ | List application-specific passwords |
| `POST` | `/accounts/:accountId/app-passwords` | `CreateAppPassword` | ⬜ | Generate an app password |
| `DELETE` | `/accounts/:accountId/app-passwords/:passwordId` | `DeleteAppPassword` | ⬜ | Revoke an app password |
| `GET` | `/accounts/:accountId/2fa` | `Get2FASettings` | ⬜ | Get TOTP 2FA status |
| `POST` | `/accounts/:accountId/2fa/enable` | `Enable2FA` | ⬜ | Enable TOTP 2FA (returns QR + recovery codes) |
| `POST` | `/accounts/:accountId/2fa/disable` | `Disable2FA` | ⬜ | Disable TOTP 2FA |
| `GET` | `/accounts/:accountId/sieve` | `ListSieveScripts` | ⬜ | List ManageSieve scripts |
| `POST` | `/accounts/:accountId/sieve` | `CreateSieveScript` | ⬜ | Create a Sieve script |
| `PATCH` | `/accounts/:accountId/sieve/:scriptId` | `UpdateSieveScript` | ⬜ | Update a Sieve script |
| `DELETE` | `/accounts/:accountId/sieve/:scriptId` | `DeleteSieveScript` | ⬜ | Delete a Sieve script |
| `POST` | `/accounts/:accountId/sieve/:scriptId/activate` | `ActivateSieveScript` | ⬜ | Set active Sieve script |

### 1.2 Roles & Permissions

| Method | Path | Handler | Status | Description |
|---|---|---|---|---|
| `GET` | `/roles` | `ListRoles` | ⬜ | List all roles |
| `POST` | `/roles` | `CreateRole` | ⬜ | Create a new role |
| `GET` | `/roles/:roleId` | `GetRole` | ⬜ | Get role details |
| `PATCH` | `/roles/:roleId` | `UpdateRole` | ⬜ | Update role permissions |
| `DELETE` | `/roles/:roleId` | `DeleteRole` | ⬜ | Delete a role |
| `GET` | `/roles/:roleId/members` | `ListRoleMembers` | ⬜ | List principals with this role |
| `POST` | `/roles/:roleId/members` | `AddRoleMember` | ⬜ | Assign role to a principal |
| `DELETE` | `/roles/:roleId/members/:principalId` | `RemoveRoleMember` | ⬜ | Unassign role from a principal |
| `GET` | `/permissions` | `ListPermissions` | ⬜ | List available permission constants |

### 1.3 Groups

| Method | Path | Handler | Status | Description |
|---|---|---|---|---|
| `GET` | `/groups` | `ListGroups` | ⬜ | List all groups |
| `POST` | `/groups` | `CreateGroup` | ⬜ | Create a new group |
| `GET` | `/groups/:groupId` | `GetGroup` | ⬜ | Get group details |
| `PATCH` | `/groups/:groupId` | `UpdateGroup` | ⬜ | Update group |
| `DELETE` | `/groups/:groupId` | `DeleteGroup` | ⬜ | Delete a group |
| `GET` | `/groups/:groupId/members` | `ListGroupMembers` | ⬜ | List group members |
| `POST` | `/groups/:groupId/members` | `AddGroupMember` | ⬜ | Add member to group |
| `DELETE` | `/groups/:groupId/members/:memberId` | `RemoveGroupMember` | ⬜ | Remove member from group |
| `GET` | `/groups/:groupId/permissions` | `ListGroupPermissions` | ⬜ | List group permissions |
| `POST` | `/groups/:groupId/permissions` | `SetGroupPermissions` | ⬜ | Set group permissions |

### 1.4 Domains

| Method | Path | Handler | Status | Description |
|---|---|---|---|---|
| `GET` | `/domains` | `ListDomains` | ⬜ | List all domains |
| `POST` | `/domains` | `CreateDomain` | ⬜ | Create a new domain |
| `GET` | `/domains/:domainId` | `GetDomain` | ⬜ | Get domain details |
| `PATCH` | `/domains/:domainId` | `UpdateDomain` | ⬜ | Update domain settings |
| `DELETE` | `/domains/:domainId` | `DeleteDomain` | ⬜ | Delete a domain |
| `GET` | `/domains/:domainId/dns` | `GetDnsConfig` | ⬜ | Get DNS records (MX, SPF, DKIM, DMARC) |
| `POST` | `/domains/:domainId/dns/verify` | `VerifyDnsRecords` | ⬜ | Trigger DNS verification |
| `GET` | `/domains/:domainId/dkim` | `GetDkimConfig` | ⬜ | Get DKIM signing configuration |
| `POST` | `/domains/:domainId/dkim/rotate` | `RotateDkimKey` | ⬜ | Rotate DKIM key pair |
| `GET` | `/domains/:domainId/dmarc` | `GetDmarcConfig` | ⬜ | Get DMARC policy |
| `PATCH` | `/domains/:domainId/dmarc` | `UpdateDmarcConfig` | ⬜ | Update DMARC policy |
| `GET` | `/domains/:domainId/spf` | `GetSpfConfig` | ⬜ | Get SPF configuration |
| `PATCH` | `/domains/:domainId/spf` | `UpdateSpfConfig` | ⬜ | Update SPF configuration |
| `GET` | `/domains/:domainId/tls` | `GetDomainTls` | ⬜ | Get domain TLS certificate status |
| `POST` | `/domains/:domainId/tls/provision` | `ProvisionDomainTls` | ⬜ | Request ACME certificate for domain |
| `GET` | `/domains/:domainId/metrics` | `GetDomainMetrics` | ⬜ | Get domain-specific metrics |

### 1.5 Tenants

| Method | Path | Handler | Status | Description |
|---|---|---|---|---|
| `GET` | `/tenants` | `ListTenants` | ⬜ | List all tenants |
| `POST` | `/tenants` | `CreateTenant` | ⬜ | Create a new tenant |
| `GET` | `/tenants/:tenantId` | `GetTenant` | ⬜ | Get tenant details |
| `PATCH` | `/tenants/:tenantId` | `UpdateTenant` | ⬜ | Update tenant |
| `DELETE` | `/tenants/:tenantId` | `DeleteTenant` | ⬜ | Delete a tenant |
| `GET` | `/tenants/:tenantId/limits` | `GetTenantLimits` | ⬜ | Get resource limits |
| `PATCH` | `/tenants/:tenantId/limits` | `UpdateTenantLimits` | ⬜ | Update resource limits |
| `GET` | `/tenants/:tenantId/rules` | `GetTenantRules` | ⬜ | Get tenant-level rules |
| `PATCH` | `/tenants/:tenantId/rules` | `UpdateTenantRules` | ⬜ | Update tenant-level rules |
| `GET` | `/tenants/:tenantId/accounts` | `ListTenantAccounts` | ⬜ | List accounts in tenant |

### 1.6 Mailing Lists

| Method | Path | Handler | Status | Description |
|---|---|---|---|---|
| `GET` | `/mailing-lists` | `ListMailingLists` | ⬜ | List all mailing lists |
| `POST` | `/mailing-lists` | `CreateMailingList` | ⬜ | Create a mailing list |
| `GET` | `/mailing-lists/:listId` | `GetMailingList` | ⬜ | Get mailing list details |
| `PATCH` | `/mailing-lists/:listId` | `UpdateMailingList` | ⬜ | Update mailing list |
| `DELETE` | `/mailing-lists/:listId` | `DeleteMailingList` | ⬜ | Delete a mailing list |
| `GET` | `/mailing-lists/:listId/subscribers` | `ListSubscribers` | ⬜ | List subscribers |
| `POST` | `/mailing-lists/:listId/subscribers` | `AddSubscriber` | ⬜ | Add a subscriber |
| `DELETE` | `/mailing-lists/:listId/subscribers/:subscriberId` | `RemoveSubscriber` | ⬜ | Remove a subscriber |
| `POST` | `/mailing-lists/:listId/subscribers/import` | `ImportSubscribers` | ⬜ | Bulk import subscribers (CSV) |
| `GET` | `/mailing-lists/:listId/moderation` | `GetModerationSettings` | ⬜ | Get moderation settings |
| `PATCH` | `/mailing-lists/:listId/moderation` | `UpdateModerationSettings` | ⬜ | Update moderation settings |

---

## 2 — Configuration (`/api/v1/mail/config/`)

### 2.1 Authentication Backends

| Method | Path | Handler | Status | Description |
|---|---|---|---|---|
| `GET` | `/auth/ldap` | `GetLdapConfig` | ⬜ | Get LDAP directory configuration |
| `PATCH` | `/auth/ldap` | `UpdateLdapConfig` | ⬜ | Update LDAP configuration |
| `POST` | `/auth/ldap/test` | `TestLdapConnection` | ⬜ | Test LDAP connection |
| `GET` | `/auth/oidc` | `GetOidcConfig` | ⬜ | Get OIDC provider configuration |
| `PATCH` | `/auth/oidc` | `UpdateOidcConfig` | ⬜ | Update OIDC configuration |
| `GET` | `/auth/providers` | `ListAuthProviders` | ⬜ | List all configured auth providers |
| `POST` | `/auth/providers` | `CreateAuthProvider` | ⬜ | Add an auth provider |
| `PATCH` | `/auth/providers/:providerId` | `UpdateAuthProvider` | ⬜ | Update auth provider |
| `DELETE` | `/auth/providers/:providerId` | `DeleteAuthProvider` | ⬜ | Remove auth provider |
| `GET` | `/auth/mfa` | `GetMfaConfig` | ⬜ | Get global MFA settings |
| `PATCH` | `/auth/mfa` | `UpdateMfaConfig` | ⬜ | Update global MFA policy |
| `GET` | `/auth/app-passwords` | `GetAppPasswordPolicy` | ⬜ | Get app password policy |
| `PATCH` | `/auth/app-passwords` | `UpdateAppPasswordPolicy` | ⬜ | Update app password policy |
| `GET` | `/auth/sql` | `GetSqlAuthConfig` | ⬜ | Get SQL auth backend config |
| `PATCH` | `/auth/sql` | `UpdateSqlAuthConfig` | ⬜ | Update SQL auth backend |
| `POST` | `/auth/sql/test` | `TestSqlAuthConnection` | ⬜ | Test SQL auth connection |
| `GET` | `/auth/api-keys` | `ListApiKeys` | ⬜ | List API keys |
| `POST` | `/auth/api-keys` | `CreateApiKey` | ⬜ | Create an API key |
| `DELETE` | `/auth/api-keys/:keyId` | `DeleteApiKey` | ⬜ | Revoke an API key |

### 2.2 Security

| Method | Path | Handler | Status | Description |
|---|---|---|---|---|
| `GET` | `/security/spam` | `GetSpamConfig` | ⬜ | Get spam filter settings |
| `PATCH` | `/security/spam` | `UpdateSpamConfig` | ⬜ | Update spam filter settings |
| `GET` | `/security/spam/rules` | `ListSpamRules` | ⬜ | List custom spam rules |
| `POST` | `/security/spam/rules` | `CreateSpamRule` | ⬜ | Add a custom spam rule |
| `PATCH` | `/security/spam/rules/:ruleId` | `UpdateSpamRule` | ⬜ | Update a spam rule |
| `DELETE` | `/security/spam/rules/:ruleId` | `DeleteSpamRule` | ⬜ | Delete a spam rule |
| `GET` | `/security/spam/dnsbl` | `ListDnsblServers` | ⬜ | List DNS blocklist servers |
| `POST` | `/security/spam/dnsbl` | `AddDnsblServer` | ⬜ | Add a DNS blocklist server |
| `DELETE` | `/security/spam/dnsbl/:serverId` | `RemoveDnsblServer` | ⬜ | Remove a DNS blocklist server |
| `GET` | `/security/spam/classifier` | `GetClassifierConfig` | ⬜ | Get Bayesian classifier settings |
| `PATCH` | `/security/spam/classifier` | `UpdateClassifierConfig` | ⬜ | Update classifier settings |
| `POST` | `/security/spam/classifier/train` | `TrainClassifier` | ⬜ | Submit training sample |
| `GET` | `/security/rate-limits` | `GetRateLimits` | ⬜ | Get rate limit configuration |
| `PATCH` | `/security/rate-limits` | `UpdateRateLimits` | ⬜ | Update rate limits |
| `GET` | `/security/ips` | `ListIpRules` | ⬜ | List IP allow/deny rules |
| `POST` | `/security/ips` | `CreateIpRule` | ⬜ | Add an IP rule |
| `DELETE` | `/security/ips/:ruleId` | `DeleteIpRule` | ⬜ | Remove an IP rule |
| `GET` | `/security/ips/blocked` | `ListBlockedIps` | ⬜ | List auto-banned IPs |
| `DELETE` | `/security/ips/banned/:ipId` | `UnblockIp` | ⬜ | Unblock an IP |
| `GET` | `/security/abuse` | `GetAbuseConfig` | ⬜ | Get abuse protection settings |
| `PATCH` | `/security/abuse` | `UpdateAbuseConfig` | ⬜ | Update abuse protection |
| `GET` | `/security/access-control` | `ListAclEntries` | ⬜ | List ACL entries |
| `POST` | `/security/access-control` | `CreateAclEntry` | ⬜ | Add an ACL entry |
| `PATCH` | `/security/access-control/:aclId` | `UpdateAclEntry` | ⬜ | Update an ACL entry |
| `DELETE` | `/security/access-control/:aclId` | `DeleteAclEntry` | ⬜ | Delete an ACL entry |

### 2.3 Network

| Method | Path | Handler | Status | Description |
|---|---|---|---|---|
| `GET` | `/network/listeners` | `ListListeners` | ⬜ | List network listeners |
| `POST` | `/network/listeners` | `CreateListener` | ⬜ | Add a listener |
| `PATCH` | `/network/listeners/:listenerId` | `UpdateListener` | ⬜ | Update listener config |
| `DELETE` | `/network/listeners/:listenerId` | `DeleteListener` | ⬜ | Remove a listener |
| `GET` | `/network/imap` | `GetImapConfig` | ⬜ | Get IMAP settings |
| `PATCH` | `/network/imap` | `UpdateImapConfig` | ⬜ | Update IMAP settings |
| `GET` | `/network/smtp` | `GetSmtpConfig` | ⬜ | Get SMTP settings |
| `PATCH` | `/network/smtp` | `UpdateSmtpConfig` | ⬜ | Update SMTP settings |
| `GET` | `/network/jmap` | `GetJmapConfig` | ⬜ | Get JMAP settings |
| `PATCH` | `/network/jmap` | `UpdateJmapConfig` | ⬜ | Update JMAP settings |
| `GET` | `/network/http` | `GetHttpConfig` | ⬜ | Get HTTP server settings |
| `PATCH` | `/network/http` | `UpdateHttpConfig` | ⬜ | Update HTTP settings |
| `GET` | `/network/webdav` | `GetWebdavConfig` | ⬜ | Get WebDAV settings |
| `PATCH` | `/network/webdav` | `UpdateWebdavConfig` | ⬜ | Update WebDAV settings |

### 2.4 SMTP Queue

| Method | Path | Handler | Status | Description |
|---|---|---|---|---|
| `GET` | `/smtp/queue` | `ListQueue` | ⬜ | List queued messages |
| `DELETE` | `/smtp/queue/:messageId` | `DeleteQueuedMessage` | ⬜ | Remove from queue |
| `POST` | `/smtp/queue/:messageId/retry` | `RetryQueuedMessage` | ⬜ | Force retry |
| `POST` | `/smtp/queue/purge` | `PurgeQueue` | ⬜ | Purge expired messages |
| `GET` | `/smtp/queue/stats` | `GetQueueStats` | ⬜ | Queue statistics |
| `GET` | `/smtp/incoming` | `GetInboundConfig` | ⬜ | Get inbound SMTP config |
| `PATCH` | `/smtp/incoming` | `UpdateInboundConfig` | ⬜ | Update inbound SMTP |
| `GET` | `/smtp/outgoing` | `GetOutboundConfig` | ⬜ | Get outbound SMTP config |
| `PATCH` | `/smtp/outgoing` | `UpdateOutboundConfig` | ⬜ | Update outbound SMTP |
| `GET` | `/smtp/routes` | `ListSmtpRoutes` | ⬜ | List outbound routes |
| `POST` | `/smtp/routes` | `CreateSmtpRoute` | ⬜ | Create an outbound route |
| `PATCH` | `/smtp/routes/:routeId` | `UpdateSmtpRoute` | ⬜ | Update an outbound route |
| `DELETE` | `/smtp/routes/:routeId` | `DeleteSmtpRoute` | ⬜ | Delete an outbound route |

### 2.5 Storage

| Method | Path | Handler | Status | Description |
|---|---|---|---|---|
| `GET` | `/storage/data` | `GetDataStoreConfig` | ⬜ | Get data store config |
| `PATCH` | `/storage/data` | `UpdateDataStoreConfig` | ⬜ | Update data store |
| `GET` | `/storage/blob` | `GetBlobStoreConfig` | ⬜ | Get blob store config |
| `PATCH` | `/storage/blob` | `UpdateBlobStoreConfig` | ⬜ | Update blob store |
| `GET` | `/storage/search` | `GetSearchStoreConfig` | ⬜ | Get search store config |
| `PATCH` | `/storage/search` | `UpdateSearchStoreConfig` | ⬜ | Update search store |
| `GET` | `/storage/cache` | `GetCacheConfig` | ⬜ | Get cache config |
| `PATCH` | `/storage/cache` | `UpdateCacheConfig` | ⬜ | Update cache config |
| `POST` | `/storage/test` | `TestStorageConnection` | ⬜ | Test a storage backend |
| `GET` | `/storage/backends` | `ListStorageBackends` | ⬜ | List configured backends |

### 2.6 Server

| Method | Path | Handler | Status | Description |
|---|---|---|---|---|
| `GET` | `/server/overview` | `GetServerOverview` | ⬜ | Server version, uptime, edition |
| `GET` | `/server/hostname` | `GetHostnameConfig` | ⬜ | Get hostname configuration |
| `PATCH` | `/server/hostname` | `UpdateHostnameConfig` | ⬜ | Update hostname |
| `GET` | `/server/identity` | `GetServerIdentity` | ⬜ | Get server identity (org name, etc.) |
| `PATCH` | `/server/identity` | `UpdateServerIdentity` | ⬜ | Update server identity |
| `GET` | `/server/settings` | `GetSystemSettings` | ⬜ | Get system-level settings |
| `PATCH` | `/server/settings` | `UpdateSystemSettings` | ⬜ | Update system settings |
| `GET` | `/server/cache` | `GetCacheStats` | ⬜ | Cache hit/miss statistics |
| `POST` | `/server/cache/flush` | `FlushCache` | ⬜ | Flush cache stores |
| `GET` | `/server/dns` | `GetDnsConfig` | ⬜ | Get DNS resolver config |
| `PATCH` | `/server/dns` | `UpdateDnsConfig` | ⬜ | Update DNS resolver |
| `POST` | `/server/dns/test` | `TestDnsResolution` | ⬜ | Test DNS resolution |
| `GET` | `/server/autoconfig` | `GetAutoconfigConfig` | ⬜ | Get autoconfig/autodiscover |
| `PATCH` | `/server/autoconfig` | `UpdateAutoconfigConfig` | ⬜ | Update autoconfig |

### 2.7 TLS

| Method | Path | Handler | Status | Description |
|---|---|---|---|---|
| `GET` | `/tls/certificates` | `ListCertificates` | ⬜ | List TLS certificates |
| `POST` | `/tls/certificates` | `UploadCertificate` | ⬜ | Upload a certificate |
| `DELETE` | `/tls/certificates/:certId` | `DeleteCertificate` | ⬜ | Remove a certificate |
| `GET` | `/tls/acme` | `GetAcmeConfig` | ⬜ | Get ACME settings |
| `PATCH` | `/tls/acme` | `UpdateAcmeConfig` | ⬜ | Update ACME settings |
| `POST` | `/tls/acme/provision` | `ProvisionAcmeCert` | ⬜ | Request ACME cert now |
| `GET` | `/tls/acme/challenges` | `GetAcmeChallenges` | ⬜ | Get challenge configuration |
| `PATCH` | `/tls/acme/challenges` | `UpdateAcmeChallenges` | ⬜ | Update challenge config |
| `GET` | `/tls/encryption` | `GetEncryptionConfig` | ⬜ | Get encryption-at-rest settings |
| `PATCH` | `/tls/encryption` | `UpdateEncryptionConfig` | ⬜ | Update encryption settings |

### 2.8 Policies & Filtering

| Method | Path | Handler | Status | Description |
|---|---|---|---|---|
| `GET` | `/policies/filtering` | `GetFilteringConfig` | ⬜ | Get message filtering config |
| `PATCH` | `/policies/filtering` | `UpdateFilteringConfig` | ⬜ | Update filtering config |
| `GET` | `/policies/rules` | `ListPolicyRules` | ⬜ | List policy rules |
| `POST` | `/policies/rules` | `CreatePolicyRule` | ⬜ | Create a policy rule |
| `PATCH` | `/policies/rules/:ruleId` | `UpdatePolicyRule` | ⬜ | Update a policy rule |
| `DELETE` | `/policies/rules/:ruleId` | `DeletePolicyRule` | ⬜ | Delete a policy rule |
| `GET` | `/policies/retention` | `GetRetentionConfig` | ⬜ | Get data retention policy |
| `PATCH` | `/policies/retention` | `UpdateRetentionConfig` | ⬜ | Update retention policy |
| `GET` | `/policies/compliance` | `GetComplianceConfig` | ⬜ | Get compliance settings |
| `PATCH` | `/policies/compliance` | `UpdateComplianceConfig` | ⬜ | Update compliance settings |
| `GET` | `/policies/sieve` | `GetSieveConfig` | ⬜ | Get system Sieve config |
| `PATCH` | `/policies/sieve` | `UpdateSieveConfig` | ⬜ | Update system Sieve config |
| `GET` | `/policies/sieve/scripts` | `ListSystemSieveScripts` | ⬜ | List system-level Sieve scripts |
| `POST` | `/policies/sieve/scripts` | `CreateSystemSieveScript` | ⬜ | Create a system Sieve script |
| `PATCH` | `/policies/sieve/scripts/:scriptId` | `UpdateSystemSieveScript` | ⬜ | Update a system Sieve script |
| `DELETE` | `/policies/sieve/scripts/:scriptId` | `DeleteSystemSieveScript` | ⬜ | Delete a system Sieve script |

---

## 3 — Monitoring (`/api/v1/mail/monitoring/`)

### 3.1 Events

| Method | Path | Handler | Status | Description |
|---|---|---|---|---|
| `GET` | `/events/mail` | `ListMailEvents` | ⬜ | List mail delivery events |
| `GET` | `/events/auth` | `ListAuthEvents` | ⬜ | List authentication events |
| `GET` | `/events/security` | `ListSecurityEvents` | ⬜ | List security events |
| `GET` | `/events/system` | `ListSystemEvents` | ⬜ | List system events |
| `GET` | `/events/:eventId` | `GetEvent` | ⬜ | Get event details |

### 3.2 Diagnostics

| Method | Path | Handler | Status | Description |
|---|---|---|---|---|
| `GET` | `/diagnostics/health` | `GetHealthReport` | ⬜ | Full health report (all subsystems) |
| `POST` | `/diagnostics/health/check` | `RunHealthCheck` | ⬜ | Trigger a health check |
| `GET` | `/diagnostics/system` | `GetSystemDiagnostics` | ⬜ | CPU, memory, disk, network |
| `GET` | `/diagnostics/queue` | `GetQueueDiagnostics` | ⬜ | Queue depth, age, retry stats |
| `GET` | `/diagnostics/connections` | `GetConnectionDiagnostics` | ⬜ | Active IMAP/SMTP/JMAP connections |
| `POST` | `/diagnostics/delivery-test` | `RunDeliveryTest` | ⬜ | Test outbound delivery to target |
| `GET` | `/diagnostics/dns-test` | `RunDnsTest` | ⬜ | Test DNS resolution for a domain |
| `GET` | `/diagnostics/tls-test` | `RunTlsTest` | ⬜ | Test TLS for a remote host |

### 3.3 Metrics

| Method | Path | Handler | Status | Description |
|---|---|---|---|---|
| `GET` | `/metrics/imap` | `GetImapMetrics` | ⬜ | IMAP session metrics |
| `GET` | `/metrics/jmap` | `GetJmapMetrics` | ⬜ | JMAP session metrics |
| `GET` | `/metrics/smtp` | `GetSmtpMetrics` | ⬜ | SMTP delivery metrics |
| `GET` | `/metrics/storage` | `GetStorageMetrics` | ⬜ | Storage usage metrics |
| `GET` | `/metrics/system` | `GetSystemMetrics` | ⬜ | System resource metrics |
| `GET` | `/metrics/history` | `GetMetricsHistory` | ⬜ | Historical metrics (time-series) |
| `GET` | `/metrics/domains` | `GetDomainMetrics` | ⬜ | Per-domain metrics |

### 3.4 Logs

| Method | Path | Handler | Status | Description |
|---|---|---|---|---|
| `GET` | `/logs/server` | `ListServerLogs` | ⬜ | Server log entries |
| `GET` | `/logs/security` | `ListSecurityLogs` | ⬜ | Security log entries |
| `GET` | `/logs/smtp` | `ListSmtpLogs` | ⬜ | SMTP log entries |
| `GET` | `/logs/auth` | `ListAuthLogs` | ⬜ | Authentication log entries |
| `GET` | `/logs/audit` | `ListAuditLogs` | ⬜ | Audit trail entries |
| `GET` | `/logs/search` | `SearchLogs` | ⬜ | Full-text log search |
| `GET` | `/logs/config` | `GetLogConfig` | ⬜ | Get logging configuration |
| `PATCH` | `/logs/config` | `UpdateLogConfig` | ⬜ | Update logging configuration |

### 3.5 Reports

| Method | Path | Handler | Status | Description |
|---|---|---|---|---|
| `GET` | `/reports/dmarc` | `ListDmarcReports` | ⬜ | List received DMARC reports |
| `GET` | `/reports/dmarc/:reportId` | `GetDmarcReport` | ⬜ | Get DMARC report details |
| `GET` | `/reports/tls` | `ListTlsReports` | ⬜ | List TLS-RPT reports |
| `GET` | `/reports/tls/:reportId` | `GetTlsReport` | ⬜ | Get TLS report details |
| `GET` | `/reports/arf` | `ListArfReports` | ⬜ | List ARF failure reports |
| `GET` | `/reports/arf/:reportId` | `GetArfReport` | ⬜ | Get ARF report details |
| `GET` | `/reports/summary` | `GetReportSummary` | ⬜ | Aggregated report summary |

---

## 4 — Stalwart REST Helpers (`/api/`)

These mirror the Stalwart OpenAPI spec helpers (not under `/api/v1/mail/`).

| Method | Path | Handler | Status | Description |
|---|---|---|---|---|
| `POST` | `/api/auth` | `StalwartLogin` | ⬜ | OAuth-style auth (authCode / authDevice) |
| `GET` | `/api/discover/:email` | `DiscoverOidc` | ⬜ | OIDC discovery for email domain |
| `GET` | `/api/account` | `GetStalwartAccount` | ⬜ | Permissions, edition, locale |
| `GET` | `/api/schema` | `GetSchemaRedirect` | ⬜ | Redirect to `/api/schema/{hash}` |
| `GET` | `/api/schema/:hash` | `GetSchema` | ⬜ | Configuration JSON Schema |
| `GET` | `/api/token/delivery` | `IssueDeliveryToken` | ⬜ | Short-lived SSE token (60s) |
| `GET` | `/api/token/tracing` | `IssueTracingToken` | ⬜ | Short-lived tracing SSE token |
| `GET` | `/api/token/metrics` | `IssueMetricsToken` | ⬜ | Short-lived metrics SSE token |
| `GET` | `/api/live/delivery/:target` | `LiveDeliverySSE` | ⬜ | SSE: outbound delivery diagnostics |
| `GET` | `/api/live/tracing` | `LiveTracingSSE` | ⬜ | SSE: live trace events |
| `GET` | `/api/live/metrics` | `LiveMetricsSSE` | ⬜ | SSE: live metric events |

---

## 5 — New Files to Create

```
server/src/
├── models/
│   └── mail.go                    # All mail-related GORM models
├── interfaces/
│   └── mail_repositories.go       # Repository interfaces for mail domain
├── services/
│   ├── mail_account.go            # AccountService (CRUD, quotas, aliases, 2FA, sieve)
│   ├── mail_domain.go             # DomainService (CRUD, DNS, DKIM, DMARC, SPF)
│   ├── mail_group.go              # GroupService (CRUD, members, permissions)
│   ├── mail_role.go               # RoleService (CRUD, members, permissions)
│   ├── mail_tenant.go             # TenantService (CRUD, limits, rules)
│   ├── mail_mailing_list.go       # MailingListService (CRUD, subscribers, moderation)
│   ├── mail_config.go             # ConfigService (all config read/write operations)
│   ├── mail_queue.go              # QueueService (list, purge, retry)
│   ├── mail_monitoring.go         # MonitoringService (events, diagnostics, metrics, logs)
│   ├── mail_reports.go            # ReportService (DMARC, TLS-RPT, ARF)
│   └── mail_live.go               # LiveService (SSE streams for delivery, tracing, metrics)
├── routes/
│   ├── mail.go                    # All /api/v1/mail/* route handlers
│   └── stalwart.go                # /api/* Stalwart-compatible helper handlers
└── middleware/
    └── sse.go                     # SSE helper middleware (flush, heartbeat)
```

---

## 6 — New Repository Interfaces

```go
// src/interfaces/mail_repositories.go

type MailAccountRepository interface {
    List(ctx context.Context, tenantID string, filter AccountFilter) ([]models.MailAccount, string, error)
    Create(ctx context.Context, account *models.MailAccount) error
    Get(ctx context.Context, tenantID, id string) (*models.MailAccount, error)
    Update(ctx context.Context, account *models.MailAccount) error
    Delete(ctx context.Context, tenantID, id string) error
    CountByDomain(ctx context.Context, tenantID, domainID string) (int64, error)
    CountByTenant(ctx context.Context, tenantID string) (int64, error)
}

type MailDomainRepository interface {
    List(ctx context.Context, tenantID string) ([]models.MailDomain, error)
    Create(ctx context.Context, domain *models.MailDomain) error
    Get(ctx context.Context, tenantID, id string) (*models.MailDomain, error)
    Update(ctx context.Context, domain *models.MailDomain) error
    Delete(ctx context.Context, tenantID, id string) error
    GetByName(ctx context.Context, tenantID, name string) (*models.MailDomain, error)
}

type MailGroupRepository interface { /* ... */ }
type MailRoleRepository interface { /* ... */ }
type MailTenantRepository interface { /* ... */ }
type MailingListRepository interface { /* ... */ }
type MailAliasRepository interface { /* ... */ }
type MailIdentityRepository interface { /* ... */ }
type SieveScriptRepository interface { /* ... */ }
type FilterRuleRepository interface { /* ... */ }
type SmtpRouteRepository interface { /* ... */ }
type SmtpQueueRepository interface { /* ... */ }
type CertificateRepository interface { /* ... */ }
type LogEntryRepository interface { /* ... */ }
type ReportRepository interface { /* ... */ }
type MetricsRepository interface { /* ... */ }
```

---

## 7 — New GORM Models

```go
// src/models/mail.go

type MailAccount struct {
    Common
    TenantID        string
    DomainID        string
    Name            string         // local-part
    DisplayName     string
    PasswordHash    string
    QuotaBytes      int64
    UsedBytes       int64
    IsDisabled      bool
    DisabledAt      *time.Time
    TwoFactorSecret string
    TwoFactorEnabled bool
    VacationResponder *VacationResponder
    Signature       string
    ForwardingAddress string
    SieveScriptActive string
}

type MailDomain struct {
    Common
    TenantID          string
    Name              string         // e.g. "example.com"
    IsCatchAll        bool
    DkimPrivateKey    string
    DkimPublicKey     string
    DkimSelector      string
    DmarcPolicy       string         // none/quarantine/reject
    DmarcAggregateRua string
    SpfEnabled        bool
    SpfIncludes       []string
    TlsCertificateID  string
    VerifiedAt        *time.Time
}

type MailAlias struct {
    Common
    AccountID     string
    TenantID      string
    SourceAddress string
    Destination   string
    IsEnabled     bool
}

type MailIdentity struct {
    Common
    AccountID     string
    TenantID      string
    Name          string
    Email         string
    ReplyTo       string
    Signature     string
    IsDefault     bool
}

type SieveScript struct {
    Common
    AccountID    string
    TenantID     string
    Name         string
    ScriptBody   string
    IsActive     bool
}

type FilterRule struct {
    Common
    AccountID    string
    TenantID     string
    Name         string
    Priority     int
    Conditions   datatypes.JSON
    Actions      datatypes.JSON
    IsEnabled    bool
}

type MailGroup struct {
    Common
    TenantID   string
    Name       string
    Email      string
    Members    []MailGroupMember
}

type MailGroupMember struct {
    Common
    GroupID   string
    AccountID string
    Role      string
}

type MailRole struct {
    Common
    TenantID    string
    Name        string
    Permissions []string
    Description string
}

type Tenant struct {
    Common
    Name             string
    MaxAccounts      int
    MaxStorageBytes  int64
    MaxDomains       int
    MaxGroups        int
    MaxMailingLists  int
    Rules            datatypes.JSON
}

type MailingList struct {
    Common
    TenantID        string
    Name            string
    Email           string
    IsEnabled       bool
    ModerationMode  string         // none/moderated/open
    Description     string
}

type MailingListSubscriber struct {
    Common
    ListID    string
    Email     string
    IsEnabled bool
}

type SmtpRoute struct {
    Common
    TenantID     string
    Name         string
    RemoteHost   string
    Port         int
    RequireTls   bool
    Username     string
    Password     string
    MaxRetries   int
    Priority     int
    IsEnabled    bool
}

type Certificate struct {
    Common
    TenantID    string
    Domain      string
    CertPEM     string
    KeyPEM      string
    Issuer      string
    ExpiresAt   time.Time
    IsAutoRenew bool
}

type LogEntry struct {
    Common
    Level     string
    Category  string
    Message   string
    Metadata  datatypes.JSON
}

type ReportRecord struct {
    Common
    TenantID   string
    Domain     string
    Type       string         // dmarc/tls/arf
    Reporter   string
    Period     time.Time
    Summary    datatypes.JSON
    RawData    []byte
}

type ServerMetrics struct {
    Common
    Timestamp    time.Time
    ImapActive   int
    JmapActive   int
    SmtpActive   int
    QueueSize    int
    StorageUsed  int64
    CpuUsage     float64
    MemoryUsage  float64
}
```

---

## 8 — Implementation Priority

### Phase 1 — Foundation (Week 1-2)
1. `src/models/mail.go` — All GORM models
2. `src/interfaces/mail_repositories.go` — All repository interfaces
3. `src/services/mail_repositories.go` — GORM implementations
4. `src/routes/mail.go` — Route registration skeleton
5. `src/routes/stalwart.go` — Stalwart-compatible helpers

### Phase 2 — Management Core (Week 3-4)
1. Account CRUD + aliases + identities
2. Domain CRUD + DNS config
3. Role & permission management
4. Group management

### Phase 3 — Configuration (Week 5-6)
1. Auth backends (LDAP, OIDC, SQL)
2. Security (spam, rate limits, IP rules, ACL)
3. Network (listeners, IMAP/SMTP/JMAP config)
4. Storage (data, blob, search, cache backends)
5. Server (hostname, identity, DNS, autoconfig)
6. TLS (certificates, ACME, encryption)
7. Policies (filtering, rules, retention, compliance, sieve)

### Phase 4 — Monitoring (Week 7-8)
1. Events (mail, auth, security, system)
2. Diagnostics (health, system, queue, connections)
3. Metrics (IMAP, JMAP, SMTP, storage, system, history)
4. Logs (server, security, SMTP, auth, audit, search)
5. Reports (DMARC, TLS-RPT, ARF)

### Phase 5 — Advanced (Week 9-10)
1. Mailing lists (CRUD, subscribers, moderation)
2. Tenants (CRUD, limits, rules)
3. SMTP queue management (list, purge, retry, routes)
4. Live telemetry (SSE streams for delivery, tracing, metrics)
5. Sieve script management (system + user level)

### Phase 6 — Polish (Week 11-12)
1. Pagination consistency across all endpoints
2. Input validation for all endpoints
3. Error handling standardization
4. Integration tests for all handlers
5. OpenAPI spec generation

---

## 9 — Middleware Additions

| Middleware | File | Purpose |
|---|---|---|
| `SSE` | `src/middleware/sse.go` | Set `Content-Type: text/event-stream`, flush writer, heartbeat |
| `RateLimit` | `src/middleware/ratelimit.go` | Per-endpoint rate limiting (already in auth, extend to mail) |
| `AuditLog` | `src/middleware/audit.go` | Log all write operations to audit trail |
| `SchemaValidation` | `src/middleware/validation.go` | Request body validation against schemas |

---

## 10 — Frontend Route Mapping

Each backend endpoint maps to a frontend page under `apps/app/(platform)/dash/`:

| Frontend Path | Backend Endpoints |
|---|---|
| `management/accounts/users` | `GET/POST /management/accounts` |
| `management/accounts/create` | `POST /management/accounts` |
| `management/accounts/aliases` | `GET/POST /management/accounts/:id/aliases` |
| `management/accounts/password` | `POST /management/accounts/:id/password` |
| `management/accounts/quotas` | `GET/PATCH /management/accounts/:id/quota` |
| `management/roles/list` | `GET/POST /management/roles` |
| `management/roles/perms` | `GET /management/permissions` |
| `management/roles/access-policies` | `GET/POST /management/security/access-control` |
| `management/groups/list` | `GET/POST /management/groups` |
| `management/domains/list` | `GET/POST /management/domains` |
| `management/domains/dns-config` | `GET /management/domains/:id/dns` |
| `management/domains/dkim` | `GET /management/domains/:id/dkim` |
| `management/domains/dmarc` | `GET/PATCH /management/domains/:id/dmarc` |
| `management/domains/spf` | `GET/PATCH /management/domains/:id/spf` |
| `management/tenants/list` | `GET/POST /management/tenants` |
| `management/mailing-lists/list` | `GET/POST /management/mailing-lists` |
| `config/auth/ldap` | `GET/PATCH /config/auth/ldap` |
| `config/auth/oidc` | `GET/PATCH /config/auth/oidc` |
| `config/auth/providers` | `GET/POST /config/auth/providers` |
| `config/auth/mfa` | `GET/PATCH /config/auth/mfa` |
| `config/auth/app-passwords` | `GET/PATCH /config/auth/app-passwords` |
| `config/auth/sql` | `GET/PATCH /config/auth/sql` |
| `config/security/spam` | `GET/PATCH /config/security/spam` |
| `config/security/rate-limits` | `GET/PATCH /config/security/rate-limits` |
| `config/security/virus` | `GET/PATCH /config/security/spam` (virus subsection) |
| `config/security/abuse` | `GET/PATCH /config/security/abuse` |
| `config/security/access-control` | `GET/POST /config/security/access-control` |
| `config/network/imap` | `GET/PATCH /config/network/imap` |
| `config/network/smtp` | `GET/PATCH /config/network/smtp` |
| `config/network/jmap` | `GET/PATCH /config/network/jmap` |
| `config/network/http` | `GET/PATCH /config/network/http` |
| `config/network/listeners` | `GET/POST /config/network/listeners` |
| `config/network/webdav` | `GET/PATCH /config/network/webdav` |
| `config/smtp/queue` | `GET /config/smtp/queue` |
| `config/smtp/incoming/*` | `GET/PATCH /config/smtp/incoming` |
| `config/smtp/outgoing/*` | `GET/PATCH /config/smtp/outgoing` + routes |
| `config/storage/cache` | `GET/PATCH /config/storage/cache` |
| `config/storage/search` | `GET/PATCH /config/storage/search` |
| `config/storage/blob` | `GET/PATCH /config/storage/blob` |
| `config/storage/store` | `GET/PATCH /config/storage/data` |
| `config/server/overview` | `GET /config/server/overview` |
| `config/server/hostname` | `GET/PATCH /config/server/hostname` |
| `config/server/identity` | `GET/PATCH /config/server/identity` |
| `config/server/system-settings` | `GET/PATCH /config/server/settings` |
| `config/tls/encryption` | `GET/PATCH /config/tls/encryption` |
| `config/tls/certs` | `GET/POST /config/tls/certificates` |
| `config/tls/acme` | `GET/PATCH /config/tls/acme` |
| `config/policies/filtering` | `GET/PATCH /config/policies/filtering` |
| `config/policies/rules` | `GET/POST /config/policies/rules` |
| `config/policies/retention` | `GET/PATCH /config/policies/retention` |
| `config/policies/compliance` | `GET/PATCH /config/policies/compliance` |
| `monitoring/events/mail` | `GET /monitoring/events/mail` |
| `monitoring/events/auth` | `GET /monitoring/events/auth` |
| `monitoring/events/security` | `GET /monitoring/events/security` |
| `monitoring/events/system` | `GET /monitoring/events/system` |
| `monitoring/diagnostics/health` | `GET /monitoring/diagnostics/health` |
| `monitoring/diagnostics/system` | `GET /monitoring/diagnostics/system` |
| `monitoring/diagnostics/queue` | `GET /monitoring/diagnostics/queue` |
| `monitoring/diagnostics/connections` | `GET /monitoring/diagnostics/connections` |
| `monitoring/metrics/imap` | `GET /monitoring/metrics/imap` |
| `monitoring/metrics/jmap` | `GET /monitoring/metrics/jmap` |
| `monitoring/metrics/smtp` | `GET /monitoring/metrics/smtp` |
| `monitoring/metrics/storage` | `GET /monitoring/metrics/storage` |
| `monitoring/metrics/system` | `GET /monitoring/metrics/system` |
| `monitoring/logs/server` | `GET /monitoring/logs/server` |
| `monitoring/logs/security` | `GET /monitoring/logs/security` |
| `monitoring/logs/smtp` | `GET /monitoring/logs/smtp` |
| `monitoring/logs/auth` | `GET /monitoring/logs/auth` |
| `monitoring/logs/audit` | `GET /monitoring/logs/audit` |
| `monitoring/reports/dmarc` | `GET /monitoring/reports/dmarc` |
| `monitoring/reports/tls` | `GET /monitoring/reports/tls` |
| `monitoring/reports/arf` | `GET /monitoring/reports/arf` |
