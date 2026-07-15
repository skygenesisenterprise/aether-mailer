package routes

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/skygenesisenterprise/aether-mailer/server/src/interfaces"
	"github.com/skygenesisenterprise/aether-mailer/server/src/middleware"
	"github.com/skygenesisenterprise/aether-mailer/server/src/services"
	"github.com/skygenesisenterprise/aether-mailer/server/src/utils"
)

type MailHandler struct {
	deps Dependencies
}

func NewMailHandler(deps Dependencies) *MailHandler {
	return &MailHandler{deps: deps}
}

func (h *MailHandler) principal(c *gin.Context) (interfaces.Principal, bool) {
	return middleware.PrincipalFromGin(c)
}

func (h *MailHandler) tenantID(c *gin.Context) string {
	p, ok := h.principal(c)
	if !ok {
		return ""
	}
	return p.WorkspaceID
}

func (h *MailHandler) SetupMailRoutes(protected *gin.RouterGroup) {
	mail := protected.Group("/mail")

	mgmt := mail.Group("/management")
	{
		h.setupAccounts(mgmt)
		h.setupRoles(mgmt)
		h.setupGroups(mgmt)
		h.setupDomains(mgmt)
		h.setupTenants(mgmt)
		h.setupMailingLists(mgmt)
	}

	cfg := mail.Group("/config")
	{
		h.setupAuthConfig(cfg)
		h.setupSecurityConfig(cfg)
		h.setupNetworkConfig(cfg)
		h.setupSmtpConfig(cfg)
		h.setupStorageConfig(cfg)
		h.setupServerConfig(cfg)
		h.setupTlsConfig(cfg)
		h.setupPoliciesConfig(cfg)
	}

	mon := mail.Group("/monitoring")
	{
		h.setupEvents(mon)
		h.setupDiagnostics(mon)
		h.setupMetrics(mon)
		h.setupLogs(mon)
		h.setupReports(mon)
	}
}

// ──────────────────────────────────────────────────────
// 1.1 Accounts
// ──────────────────────────────────────────────────────

func (h *MailHandler) setupAccounts(r *gin.RouterGroup) {
	acc := r.Group("/accounts")
	{
		acc.GET("", h.ListAccounts)
		acc.POST("", h.CreateAccount)
		acc.GET("/:accountId", h.GetAccount)
		acc.PATCH("/:accountId", h.UpdateAccount)
		acc.DELETE("/:accountId", h.DeleteAccount)
		acc.POST("/:accountId/enable", h.EnableAccount)
		acc.POST("/:accountId/disable", h.DisableAccount)
		acc.POST("/:accountId/password", h.ResetAccountPassword)
		acc.GET("/:accountId/quota", h.GetAccountQuota)
		acc.PATCH("/:accountId/quota", h.UpdateAccountQuota)
		acc.GET("/:accountId/aliases", h.ListAliases)
		acc.POST("/:accountId/aliases", h.CreateAlias)
		acc.DELETE("/:accountId/aliases/:aliasId", h.DeleteAlias)
		acc.GET("/:accountId/identities", h.ListIdentities)
		acc.POST("/:accountId/identities", h.CreateIdentity)
		acc.PATCH("/:accountId/identities/:identityId", h.UpdateIdentity)
		acc.DELETE("/:accountId/identities/:identityId", h.DeleteIdentity)
		acc.GET("/:accountId/sessions", h.ListAccountSessions)
		acc.DELETE("/:accountId/sessions/:sessionId", h.RevokeAccountSession)
		acc.GET("/:accountId/filters", h.ListFilterRules)
		acc.POST("/:accountId/filters", h.CreateFilterRule)
		acc.PATCH("/:accountId/filters/:filterId", h.UpdateFilterRule)
		acc.DELETE("/:accountId/filters/:filterId", h.DeleteFilterRule)
		acc.GET("/:accountId/vacation", h.GetVacationResponder)
		acc.PUT("/:accountId/vacation", h.UpdateVacationResponder)
		acc.GET("/:accountId/signature", h.GetSignature)
		acc.PUT("/:accountId/signature", h.UpdateSignature)
		acc.GET("/:accountId/forwarding", h.GetForwarding)
		acc.PUT("/:accountId/forwarding", h.UpdateForwarding)
		acc.GET("/:accountId/app-passwords", h.ListAppPasswords)
		acc.POST("/:accountId/app-passwords", h.CreateAppPassword)
		acc.DELETE("/:accountId/app-passwords/:passwordId", h.DeleteAppPassword)
		acc.GET("/:accountId/2fa", h.Get2FASettings)
		acc.POST("/:accountId/2fa/enable", h.Enable2FA)
		acc.POST("/:accountId/2fa/disable", h.Disable2FA)
		acc.GET("/:accountId/sieve", h.ListSieveScripts)
		acc.POST("/:accountId/sieve", h.CreateSieveScript)
		acc.PATCH("/:accountId/sieve/:scriptId", h.UpdateSieveScript)
		acc.DELETE("/:accountId/sieve/:scriptId", h.DeleteSieveScript)
		acc.POST("/:accountId/sieve/:scriptId/activate", h.ActivateSieveScript)
	}
}

func (h *MailHandler) ListAccounts(c *gin.Context) {
	tid := h.tenantID(c)
	domainID := c.Query("domainId")
	items, err := h.deps.AccountService.List(c.Request.Context(), tid, domainID)
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, items)
}

func (h *MailHandler) CreateAccount(c *gin.Context) {
	tid := h.tenantID(c)
	var req struct {
		DomainID    string `json:"domainId"`
		Name        string `json:"name"`
		DisplayName string `json:"displayName"`
		Password    string `json:"password"`
		QuotaBytes  int64  `json:"quotaBytes"`
	}
	if c.ShouldBindJSON(&req) != nil {
		utils.Error(c, utils.ErrValidationFailed)
		return
	}
	account, err := h.deps.AccountService.Create(c.Request.Context(), services.CreateAccountInput{
		TenantID:    tid,
		DomainID:    req.DomainID,
		Name:        req.Name,
		DisplayName: req.DisplayName,
		Password:    req.Password,
		QuotaBytes:  req.QuotaBytes,
	})
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusCreated, account)
}

func (h *MailHandler) GetAccount(c *gin.Context) {
	account, err := h.deps.AccountService.Get(c.Request.Context(), h.tenantID(c), c.Param("accountId"))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, account)
}

func (h *MailHandler) UpdateAccount(c *gin.Context) {
	var req struct {
		DisplayName *string `json:"displayName"`
		QuotaBytes  *int64  `json:"quotaBytes"`
	}
	_ = c.ShouldBindJSON(&req)
	account, err := h.deps.AccountService.Update(c.Request.Context(), h.tenantID(c), c.Param("accountId"), req.DisplayName, req.QuotaBytes)
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, account)
}

func (h *MailHandler) DeleteAccount(c *gin.Context) {
	if err := h.deps.AccountService.Delete(c.Request.Context(), h.tenantID(c), c.Param("accountId")); err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, gin.H{"deleted": true})
}

func (h *MailHandler) EnableAccount(c *gin.Context) {
	if err := h.deps.AccountService.Enable(c.Request.Context(), h.tenantID(c), c.Param("accountId")); err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, gin.H{"enabled": true})
}

func (h *MailHandler) DisableAccount(c *gin.Context) {
	if err := h.deps.AccountService.Disable(c.Request.Context(), h.tenantID(c), c.Param("accountId")); err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, gin.H{"disabled": true})
}

func (h *MailHandler) ResetAccountPassword(c *gin.Context) {
	account, err := h.deps.AccountService.ResetPassword(c.Request.Context(), h.tenantID(c), c.Param("accountId"))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, account)
}

func (h *MailHandler) GetAccountQuota(c *gin.Context) {
	account, err := h.deps.AccountService.GetQuota(c.Request.Context(), h.tenantID(c), c.Param("accountId"))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, gin.H{"quotaBytes": account.QuotaBytes, "usedBytes": account.UsedBytes})
}

func (h *MailHandler) UpdateAccountQuota(c *gin.Context) {
	var req struct {
		QuotaBytes int64 `json:"quotaBytes"`
	}
	if c.ShouldBindJSON(&req) != nil {
		utils.Error(c, utils.ErrValidationFailed)
		return
	}
	account, err := h.deps.AccountService.UpdateQuota(c.Request.Context(), h.tenantID(c), c.Param("accountId"), req.QuotaBytes)
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, account)
}

func (h *MailHandler) ListAliases(c *gin.Context) {
	items, err := h.deps.AliasService.List(c.Request.Context(), h.tenantID(c), c.Param("accountId"))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, items)
}

func (h *MailHandler) CreateAlias(c *gin.Context) {
	var req struct {
		SourceAddress string `json:"sourceAddress"`
		Destination   string `json:"destination"`
	}
	if c.ShouldBindJSON(&req) != nil {
		utils.Error(c, utils.ErrValidationFailed)
		return
	}
	alias, err := h.deps.AliasService.Create(c.Request.Context(), h.tenantID(c), c.Param("accountId"), req.SourceAddress, req.Destination)
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusCreated, alias)
}

func (h *MailHandler) DeleteAlias(c *gin.Context) {
	if err := h.deps.AliasService.Delete(c.Request.Context(), h.tenantID(c), c.Param("accountId"), c.Param("aliasId")); err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, gin.H{"deleted": true})
}

func (h *MailHandler) ListIdentities(c *gin.Context) {
	items, err := h.deps.IdentityService.List(c.Request.Context(), h.tenantID(c), c.Param("accountId"))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, items)
}

func (h *MailHandler) CreateIdentity(c *gin.Context) {
	var req struct {
		Name      string `json:"name"`
		Email     string `json:"email"`
		ReplyTo   string `json:"replyTo"`
		Signature string `json:"signature"`
		IsDefault bool   `json:"isDefault"`
	}
	if c.ShouldBindJSON(&req) != nil {
		utils.Error(c, utils.ErrValidationFailed)
		return
	}
	identity, err := h.deps.IdentityService.Create(c.Request.Context(), h.tenantID(c), c.Param("accountId"), req.Name, req.Email, req.ReplyTo, req.Signature, req.IsDefault)
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusCreated, identity)
}

func (h *MailHandler) UpdateIdentity(c *gin.Context) {
	var req struct {
		Name      string `json:"name"`
		Email     string `json:"email"`
		ReplyTo   string `json:"replyTo"`
		Signature string `json:"signature"`
		IsDefault *bool  `json:"isDefault"`
	}
	_ = c.ShouldBindJSON(&req)
	identity, err := h.deps.IdentityService.Update(c.Request.Context(), h.tenantID(c), c.Param("accountId"), c.Param("identityId"), req.Name, req.Email, req.ReplyTo, req.Signature, req.IsDefault)
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, identity)
}

func (h *MailHandler) DeleteIdentity(c *gin.Context) {
	if err := h.deps.IdentityService.Delete(c.Request.Context(), h.tenantID(c), c.Param("accountId"), c.Param("identityId")); err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, gin.H{"deleted": true})
}

func (h *MailHandler) ListAccountSessions(c *gin.Context) {
	items, err := h.deps.MailSessionService.List(c.Request.Context(), h.tenantID(c), c.Param("accountId"))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, items)
}

func (h *MailHandler) RevokeAccountSession(c *gin.Context) {
	if err := h.deps.MailSessionService.Revoke(c.Request.Context(), h.tenantID(c), c.Param("accountId"), c.Param("sessionId")); err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, gin.H{"revoked": true})
}

func (h *MailHandler) ListFilterRules(c *gin.Context) {
	items, err := h.deps.FilterRuleService.List(c.Request.Context(), h.tenantID(c), c.Param("accountId"))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, items)
}

func (h *MailHandler) CreateFilterRule(c *gin.Context) {
	var req struct {
		Name       string `json:"name"`
		Priority   int    `json:"priority"`
		Conditions []byte `json:"conditions"`
		Actions    []byte `json:"actions"`
		IsEnabled  bool   `json:"isEnabled"`
	}
	if c.ShouldBindJSON(&req) != nil {
		utils.Error(c, utils.ErrValidationFailed)
		return
	}
	rule, err := h.deps.FilterRuleService.Create(c.Request.Context(), h.tenantID(c), c.Param("accountId"), req.Name, req.Priority, req.Conditions, req.Actions, req.IsEnabled)
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusCreated, rule)
}

func (h *MailHandler) UpdateFilterRule(c *gin.Context) {
	var req struct {
		Name       string `json:"name"`
		Priority   *int   `json:"priority"`
		Conditions []byte `json:"conditions"`
		Actions    []byte `json:"actions"`
		IsEnabled  *bool  `json:"isEnabled"`
	}
	_ = c.ShouldBindJSON(&req)
	rule, err := h.deps.FilterRuleService.Update(c.Request.Context(), h.tenantID(c), c.Param("accountId"), c.Param("filterId"), req.Name, req.Priority, req.Conditions, req.Actions, req.IsEnabled)
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, rule)
}

func (h *MailHandler) DeleteFilterRule(c *gin.Context) {
	if err := h.deps.FilterRuleService.Delete(c.Request.Context(), h.tenantID(c), c.Param("accountId"), c.Param("filterId")); err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, gin.H{"deleted": true})
}

func (h *MailHandler) GetVacationResponder(c *gin.Context) {
	account, err := h.deps.AccountService.GetVacation(c.Request.Context(), h.tenantID(c), c.Param("accountId"))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, gin.H{"subject": account.VacationSubject, "message": account.VacationMessage, "enabled": account.VacationEnabled})
}

func (h *MailHandler) UpdateVacationResponder(c *gin.Context) {
	var req struct {
		Subject string `json:"subject"`
		Message string `json:"message"`
		Enabled bool   `json:"enabled"`
	}
	if c.ShouldBindJSON(&req) != nil {
		utils.Error(c, utils.ErrValidationFailed)
		return
	}
	account, err := h.deps.AccountService.UpdateVacation(c.Request.Context(), h.tenantID(c), c.Param("accountId"), req.Subject, req.Message, req.Enabled)
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, account)
}

func (h *MailHandler) GetSignature(c *gin.Context) {
	account, err := h.deps.AccountService.GetSignature(c.Request.Context(), h.tenantID(c), c.Param("accountId"))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, gin.H{"signature": account.Signature})
}

func (h *MailHandler) UpdateSignature(c *gin.Context) {
	var req struct {
		Signature string `json:"signature"`
	}
	if c.ShouldBindJSON(&req) != nil {
		utils.Error(c, utils.ErrValidationFailed)
		return
	}
	account, err := h.deps.AccountService.UpdateSignature(c.Request.Context(), h.tenantID(c), c.Param("accountId"), req.Signature)
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, account)
}

func (h *MailHandler) GetForwarding(c *gin.Context) {
	account, err := h.deps.AccountService.GetForwarding(c.Request.Context(), h.tenantID(c), c.Param("accountId"))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, gin.H{"forwardingAddress": account.ForwardingAddress})
}

func (h *MailHandler) UpdateForwarding(c *gin.Context) {
	var req struct {
		ForwardingAddress string `json:"forwardingAddress"`
	}
	if c.ShouldBindJSON(&req) != nil {
		utils.Error(c, utils.ErrValidationFailed)
		return
	}
	account, err := h.deps.AccountService.UpdateForwarding(c.Request.Context(), h.tenantID(c), c.Param("accountId"), req.ForwardingAddress)
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, account)
}

func (h *MailHandler) ListAppPasswords(c *gin.Context) {
	items, err := h.deps.AppPasswordService.List(c.Request.Context(), h.tenantID(c), c.Param("accountId"))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, items)
}

func (h *MailHandler) CreateAppPassword(c *gin.Context) {
	var req struct {
		Name string `json:"name"`
	}
	if c.ShouldBindJSON(&req) != nil {
		utils.Error(c, utils.ErrValidationFailed)
		return
	}
	pw, err := h.deps.AppPasswordService.Create(c.Request.Context(), h.tenantID(c), c.Param("accountId"), req.Name, "")
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusCreated, pw)
}

func (h *MailHandler) DeleteAppPassword(c *gin.Context) {
	if err := h.deps.AppPasswordService.Delete(c.Request.Context(), h.tenantID(c), c.Param("accountId"), c.Param("passwordId")); err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, gin.H{"deleted": true})
}

func (h *MailHandler) Get2FASettings(c *gin.Context) {
	account, err := h.deps.AccountService.Get2FA(c.Request.Context(), h.tenantID(c), c.Param("accountId"))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, gin.H{"enabled": account.TwoFactorEnabled})
}

func (h *MailHandler) Enable2FA(c *gin.Context) {
	account, err := h.deps.AccountService.Enable2FA(c.Request.Context(), h.tenantID(c), c.Param("accountId"), "")
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, account)
}

func (h *MailHandler) Disable2FA(c *gin.Context) {
	account, err := h.deps.AccountService.Disable2FA(c.Request.Context(), h.tenantID(c), c.Param("accountId"))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, account)
}

func (h *MailHandler) ListSieveScripts(c *gin.Context) {
	items, err := h.deps.SieveService.List(c.Request.Context(), h.tenantID(c), c.Param("accountId"))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, items)
}

func (h *MailHandler) CreateSieveScript(c *gin.Context) {
	var req struct {
		Name       string `json:"name"`
		ScriptBody string `json:"scriptBody"`
	}
	if c.ShouldBindJSON(&req) != nil {
		utils.Error(c, utils.ErrValidationFailed)
		return
	}
	script, err := h.deps.SieveService.Create(c.Request.Context(), h.tenantID(c), c.Param("accountId"), req.Name, req.ScriptBody)
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusCreated, script)
}

func (h *MailHandler) UpdateSieveScript(c *gin.Context) {
	var req struct {
		Name       string `json:"name"`
		ScriptBody string `json:"scriptBody"`
	}
	_ = c.ShouldBindJSON(&req)
	script, err := h.deps.SieveService.Update(c.Request.Context(), h.tenantID(c), c.Param("accountId"), c.Param("scriptId"), req.Name, req.ScriptBody)
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, script)
}

func (h *MailHandler) DeleteSieveScript(c *gin.Context) {
	if err := h.deps.SieveService.Delete(c.Request.Context(), h.tenantID(c), c.Param("accountId"), c.Param("scriptId")); err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, gin.H{"deleted": true})
}

func (h *MailHandler) ActivateSieveScript(c *gin.Context) {
	script, err := h.deps.SieveService.Activate(c.Request.Context(), h.tenantID(c), c.Param("accountId"), c.Param("scriptId"))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, script)
}

// ──────────────────────────────────────────────────────
// 1.2 Roles & Permissions
// ──────────────────────────────────────────────────────

func (h *MailHandler) setupRoles(r *gin.RouterGroup) {
	roles := r.Group("/roles")
	{
		roles.GET("", h.ListRoles)
		roles.POST("", h.CreateRole)
		roles.GET("/:roleId", h.GetRole)
		roles.PATCH("/:roleId", h.UpdateRole)
		roles.DELETE("/:roleId", h.DeleteRole)
		roles.GET("/:roleId/members", h.ListRoleMembers)
		roles.POST("/:roleId/members", h.AddRoleMember)
		roles.DELETE("/:roleId/members/:principalId", h.RemoveRoleMember)
	}
	r.GET("/permissions", h.ListPermissions)
}

func (h *MailHandler) ListRoles(c *gin.Context) {
	items, err := h.deps.RoleService.List(c.Request.Context(), h.tenantID(c))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, items)
}

func (h *MailHandler) CreateRole(c *gin.Context) {
	var req struct {
		Name        string   `json:"name"`
		Description string   `json:"description"`
		Permissions []string `json:"permissions"`
	}
	if c.ShouldBindJSON(&req) != nil {
		utils.Error(c, utils.ErrValidationFailed)
		return
	}
	role, err := h.deps.RoleService.Create(c.Request.Context(), h.tenantID(c), req.Name, req.Description, req.Permissions)
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusCreated, role)
}

func (h *MailHandler) GetRole(c *gin.Context) {
	role, err := h.deps.RoleService.Get(c.Request.Context(), h.tenantID(c), c.Param("roleId"))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, role)
}

func (h *MailHandler) UpdateRole(c *gin.Context) {
	var req struct {
		Name        string `json:"name"`
		Description string `json:"description"`
	}
	_ = c.ShouldBindJSON(&req)
	role, err := h.deps.RoleService.Update(c.Request.Context(), h.tenantID(c), c.Param("roleId"), req.Name, req.Description)
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, role)
}

func (h *MailHandler) DeleteRole(c *gin.Context) {
	if err := h.deps.RoleService.Delete(c.Request.Context(), h.tenantID(c), c.Param("roleId")); err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, gin.H{"deleted": true})
}

func (h *MailHandler) ListRoleMembers(c *gin.Context) {
	items, err := h.deps.RoleService.ListMembers(c.Request.Context(), h.tenantID(c), c.Param("roleId"))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, items)
}

func (h *MailHandler) AddRoleMember(c *gin.Context) {
	var req struct {
		PrincipalID string `json:"principalId"`
	}
	if c.ShouldBindJSON(&req) != nil {
		utils.Error(c, utils.ErrValidationFailed)
		return
	}
	member, err := h.deps.RoleService.AddMember(c.Request.Context(), h.tenantID(c), c.Param("roleId"), req.PrincipalID)
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusCreated, member)
}

func (h *MailHandler) RemoveRoleMember(c *gin.Context) {
	if err := h.deps.RoleService.RemoveMember(c.Request.Context(), h.tenantID(c), c.Param("roleId"), c.Param("principalId")); err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, gin.H{"removed": true})
}

func (h *MailHandler) ListPermissions(c *gin.Context) {
	utils.Success(c, http.StatusOK, h.deps.RoleService.ListPermissions(c.Request.Context()))
}

// ──────────────────────────────────────────────────────
// 1.3 Groups
// ──────────────────────────────────────────────────────

func (h *MailHandler) setupGroups(r *gin.RouterGroup) {
	groups := r.Group("/groups")
	{
		groups.GET("", h.ListGroups)
		groups.POST("", h.CreateGroup)
		groups.GET("/:groupId", h.GetGroup)
		groups.PATCH("/:groupId", h.UpdateGroup)
		groups.DELETE("/:groupId", h.DeleteGroup)
		groups.GET("/:groupId/members", h.ListGroupMembers)
		groups.POST("/:groupId/members", h.AddGroupMember)
		groups.DELETE("/:groupId/members/:memberId", h.RemoveGroupMember)
		groups.GET("/:groupId/permissions", h.ListGroupPermissions)
		groups.POST("/:groupId/permissions", h.SetGroupPermissions)
	}
}

func (h *MailHandler) ListGroups(c *gin.Context) {
	items, err := h.deps.GroupService.List(c.Request.Context(), h.tenantID(c))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, items)
}

func (h *MailHandler) CreateGroup(c *gin.Context) {
	var req struct {
		Name  string `json:"name"`
		Email string `json:"email"`
	}
	if c.ShouldBindJSON(&req) != nil {
		utils.Error(c, utils.ErrValidationFailed)
		return
	}
	group, err := h.deps.GroupService.Create(c.Request.Context(), h.tenantID(c), req.Name, req.Email)
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusCreated, group)
}

func (h *MailHandler) GetGroup(c *gin.Context) {
	group, err := h.deps.GroupService.Get(c.Request.Context(), h.tenantID(c), c.Param("groupId"))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, group)
}

func (h *MailHandler) UpdateGroup(c *gin.Context) {
	var req struct {
		Name  string `json:"name"`
		Email string `json:"email"`
	}
	_ = c.ShouldBindJSON(&req)
	group, err := h.deps.GroupService.Update(c.Request.Context(), h.tenantID(c), c.Param("groupId"), req.Name, req.Email)
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, group)
}

func (h *MailHandler) DeleteGroup(c *gin.Context) {
	if err := h.deps.GroupService.Delete(c.Request.Context(), h.tenantID(c), c.Param("groupId")); err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, gin.H{"deleted": true})
}

func (h *MailHandler) ListGroupMembers(c *gin.Context) {
	items, err := h.deps.GroupService.ListMembers(c.Request.Context(), h.tenantID(c), c.Param("groupId"))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, items)
}

func (h *MailHandler) AddGroupMember(c *gin.Context) {
	var req struct {
		AccountID string `json:"accountId"`
		Role      string `json:"role"`
	}
	if c.ShouldBindJSON(&req) != nil {
		utils.Error(c, utils.ErrValidationFailed)
		return
	}
	member, err := h.deps.GroupService.AddMember(c.Request.Context(), h.tenantID(c), c.Param("groupId"), req.AccountID, req.Role)
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusCreated, member)
}

func (h *MailHandler) RemoveGroupMember(c *gin.Context) {
	if err := h.deps.GroupService.RemoveMember(c.Request.Context(), h.tenantID(c), c.Param("groupId"), c.Param("memberId")); err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, gin.H{"removed": true})
}

func (h *MailHandler) ListGroupPermissions(c *gin.Context) {
	items, err := h.deps.GroupService.ListPermissions(c.Request.Context(), h.tenantID(c), c.Param("groupId"))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, items)
}

func (h *MailHandler) SetGroupPermissions(c *gin.Context) {
	utils.Success(c, http.StatusOK, gin.H{"updated": true})
}

// ──────────────────────────────────────────────────────
// 1.4 Domains
// ──────────────────────────────────────────────────────

func (h *MailHandler) setupDomains(r *gin.RouterGroup) {
	domains := r.Group("/domains")
	{
		domains.GET("", h.ListDomains)
		domains.POST("", h.CreateDomain)
		domains.GET("/:domainId", h.GetDomain)
		domains.PATCH("/:domainId", h.UpdateDomain)
		domains.DELETE("/:domainId", h.DeleteDomain)
		domains.GET("/:domainId/dns", h.GetDnsConfig)
		domains.POST("/:domainId/dns/verify", h.VerifyDnsRecords)
		domains.GET("/:domainId/dkim", h.GetDkimConfig)
		domains.POST("/:domainId/dkim/rotate", h.RotateDkimKey)
		domains.GET("/:domainId/dmarc", h.GetDmarcConfig)
		domains.PATCH("/:domainId/dmarc", h.UpdateDmarcConfig)
		domains.GET("/:domainId/spf", h.GetSpfConfig)
		domains.PATCH("/:domainId/spf", h.UpdateSpfConfig)
		domains.GET("/:domainId/tls", h.GetDomainTls)
		domains.POST("/:domainId/tls/provision", h.ProvisionDomainTls)
		domains.GET("/:domainId/metrics", h.GetDomainMetrics)
	}
}

func (h *MailHandler) ListDomains(c *gin.Context) {
	items, err := h.deps.DomainService.List(c.Request.Context(), h.tenantID(c))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, items)
}

func (h *MailHandler) CreateDomain(c *gin.Context) {
	var req struct {
		Name string `json:"name"`
	}
	if c.ShouldBindJSON(&req) != nil {
		utils.Error(c, utils.ErrValidationFailed)
		return
	}
	domain, err := h.deps.DomainService.Create(c.Request.Context(), h.tenantID(c), req.Name)
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusCreated, domain)
}

func (h *MailHandler) GetDomain(c *gin.Context) {
	domain, err := h.deps.DomainService.Get(c.Request.Context(), h.tenantID(c), c.Param("domainId"))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, domain)
}

func (h *MailHandler) UpdateDomain(c *gin.Context) {
	var req struct {
		IsCatchAll *bool `json:"isCatchAll"`
	}
	_ = c.ShouldBindJSON(&req)
	domain, err := h.deps.DomainService.Update(c.Request.Context(), h.tenantID(c), c.Param("domainId"), req.IsCatchAll)
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, domain)
}

func (h *MailHandler) DeleteDomain(c *gin.Context) {
	if err := h.deps.DomainService.Delete(c.Request.Context(), h.tenantID(c), c.Param("domainId")); err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, gin.H{"deleted": true})
}

func (h *MailHandler) GetDnsConfig(c *gin.Context) {
	domain, err := h.deps.DomainService.GetDnsConfig(c.Request.Context(), h.tenantID(c), c.Param("domainId"))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, domain)
}

func (h *MailHandler) VerifyDnsRecords(c *gin.Context) {
	domain, err := h.deps.DomainService.VerifyDnsRecords(c.Request.Context(), h.tenantID(c), c.Param("domainId"))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, domain)
}

func (h *MailHandler) GetDkimConfig(c *gin.Context) {
	domain, err := h.deps.DomainService.GetDkimConfig(c.Request.Context(), h.tenantID(c), c.Param("domainId"))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, domain)
}

func (h *MailHandler) RotateDkimKey(c *gin.Context) {
	domain, err := h.deps.DomainService.RotateDkimKey(c.Request.Context(), h.tenantID(c), c.Param("domainId"))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, domain)
}

func (h *MailHandler) GetDmarcConfig(c *gin.Context) {
	domain, err := h.deps.DomainService.GetDmarcConfig(c.Request.Context(), h.tenantID(c), c.Param("domainId"))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, domain)
}

func (h *MailHandler) UpdateDmarcConfig(c *gin.Context) {
	var req struct {
		Policy string `json:"policy"`
		Rua    string `json:"rua"`
	}
	_ = c.ShouldBindJSON(&req)
	domain, err := h.deps.DomainService.UpdateDmarcConfig(c.Request.Context(), h.tenantID(c), c.Param("domainId"), req.Policy, req.Rua)
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, domain)
}

func (h *MailHandler) GetSpfConfig(c *gin.Context) {
	domain, err := h.deps.DomainService.GetSpfConfig(c.Request.Context(), h.tenantID(c), c.Param("domainId"))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, domain)
}

func (h *MailHandler) UpdateSpfConfig(c *gin.Context) {
	var req struct {
		Enabled  bool     `json:"enabled"`
		Includes []string `json:"includes"`
	}
	_ = c.ShouldBindJSON(&req)
	domain, err := h.deps.DomainService.UpdateSpfConfig(c.Request.Context(), h.tenantID(c), c.Param("domainId"), req.Enabled, req.Includes)
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, domain)
}

func (h *MailHandler) GetDomainTls(c *gin.Context) {
	domain, err := h.deps.DomainService.GetDomainTls(c.Request.Context(), h.tenantID(c), c.Param("domainId"))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, domain)
}

func (h *MailHandler) ProvisionDomainTls(c *gin.Context) {
	domain, err := h.deps.DomainService.ProvisionDomainTls(c.Request.Context(), h.tenantID(c), c.Param("domainId"))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, domain)
}

func (h *MailHandler) GetDomainMetrics(c *gin.Context) {
	domain, err := h.deps.DomainService.GetDomainMetrics(c.Request.Context(), h.tenantID(c), c.Param("domainId"))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, domain)
}

// ──────────────────────────────────────────────────────
// 1.5 Tenants
// ──────────────────────────────────────────────────────

func (h *MailHandler) setupTenants(r *gin.RouterGroup) {
	tenants := r.Group("/tenants")
	{
		tenants.GET("", h.ListTenants)
		tenants.POST("", h.CreateTenant)
		tenants.GET("/:tenantId", h.GetTenant)
		tenants.PATCH("/:tenantId", h.UpdateTenant)
		tenants.DELETE("/:tenantId", h.DeleteTenant)
		tenants.GET("/:tenantId/limits", h.GetTenantLimits)
		tenants.PATCH("/:tenantId/limits", h.UpdateTenantLimits)
		tenants.GET("/:tenantId/rules", h.GetTenantRules)
		tenants.PATCH("/:tenantId/rules", h.UpdateTenantRules)
		tenants.GET("/:tenantId/accounts", h.ListTenantAccounts)
	}
}

func (h *MailHandler) ListTenants(c *gin.Context) {
	items, err := h.deps.TenantService.List(c.Request.Context())
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, items)
}

func (h *MailHandler) CreateTenant(c *gin.Context) {
	var req struct {
		Name            string `json:"name"`
		MaxAccounts     int    `json:"maxAccounts"`
		MaxDomains      int    `json:"maxDomains"`
		MaxGroups       int    `json:"maxGroups"`
		MaxMailingLists int    `json:"maxMailingLists"`
		MaxStorageBytes int64  `json:"maxStorageBytes"`
	}
	if c.ShouldBindJSON(&req) != nil {
		utils.Error(c, utils.ErrValidationFailed)
		return
	}
	tenant, err := h.deps.TenantService.Create(c.Request.Context(), req.Name, req.MaxAccounts, req.MaxDomains, req.MaxGroups, req.MaxMailingLists, req.MaxStorageBytes)
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusCreated, tenant)
}

func (h *MailHandler) GetTenant(c *gin.Context) {
	tenant, err := h.deps.TenantService.Get(c.Request.Context(), c.Param("tenantId"))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, tenant)
}

func (h *MailHandler) UpdateTenant(c *gin.Context) {
	var req struct {
		Name string `json:"name"`
	}
	_ = c.ShouldBindJSON(&req)
	tenant, err := h.deps.TenantService.Update(c.Request.Context(), c.Param("tenantId"), req.Name)
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, tenant)
}

func (h *MailHandler) DeleteTenant(c *gin.Context) {
	if err := h.deps.TenantService.Delete(c.Request.Context(), c.Param("tenantId")); err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, gin.H{"deleted": true})
}

func (h *MailHandler) GetTenantLimits(c *gin.Context) {
	tenant, err := h.deps.TenantService.GetLimits(c.Request.Context(), c.Param("tenantId"))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, tenant)
}

func (h *MailHandler) UpdateTenantLimits(c *gin.Context) {
	var req struct {
		MaxAccounts     int   `json:"maxAccounts"`
		MaxStorageBytes int64 `json:"maxStorageBytes"`
		MaxDomains      int   `json:"maxDomains"`
		MaxGroups       int   `json:"maxGroups"`
		MaxMailingLists int   `json:"maxMailingLists"`
	}
	if c.ShouldBindJSON(&req) != nil {
		utils.Error(c, utils.ErrValidationFailed)
		return
	}
	tenant, err := h.deps.TenantService.UpdateLimits(c.Request.Context(), c.Param("tenantId"), req.MaxAccounts, req.MaxDomains, req.MaxGroups, req.MaxMailingLists, req.MaxStorageBytes)
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, tenant)
}

func (h *MailHandler) GetTenantRules(c *gin.Context) {
	tenant, err := h.deps.TenantService.GetRules(c.Request.Context(), c.Param("tenantId"))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, tenant)
}

func (h *MailHandler) UpdateTenantRules(c *gin.Context) {
	tenant, err := h.deps.TenantService.UpdateRules(c.Request.Context(), c.Param("tenantId"))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, tenant)
}

func (h *MailHandler) ListTenantAccounts(c *gin.Context) {
	items, err := h.deps.TenantService.ListAccounts(c.Request.Context(), c.Param("tenantId"))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, items)
}

// ──────────────────────────────────────────────────────
// 1.6 Mailing Lists
// ──────────────────────────────────────────────────────

func (h *MailHandler) setupMailingLists(r *gin.RouterGroup) {
	lists := r.Group("/mailing-lists")
	{
		lists.GET("", h.ListMailingLists)
		lists.POST("", h.CreateMailingList)
		lists.GET("/:listId", h.GetMailingList)
		lists.PATCH("/:listId", h.UpdateMailingList)
		lists.DELETE("/:listId", h.DeleteMailingList)
		lists.GET("/:listId/subscribers", h.ListSubscribers)
		lists.POST("/:listId/subscribers", h.AddSubscriber)
		lists.DELETE("/:listId/subscribers/:subscriberId", h.RemoveSubscriber)
		lists.POST("/:listId/subscribers/import", h.ImportSubscribers)
		lists.GET("/:listId/moderation", h.GetModerationSettings)
		lists.PATCH("/:listId/moderation", h.UpdateModerationSettings)
	}
}

func (h *MailHandler) ListMailingLists(c *gin.Context) {
	items, err := h.deps.MailingListService.List(c.Request.Context(), h.tenantID(c))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, items)
}

func (h *MailHandler) CreateMailingList(c *gin.Context) {
	var req struct {
		Name        string `json:"name"`
		Email       string `json:"email"`
		Description string `json:"description"`
	}
	if c.ShouldBindJSON(&req) != nil {
		utils.Error(c, utils.ErrValidationFailed)
		return
	}
	list, err := h.deps.MailingListService.Create(c.Request.Context(), h.tenantID(c), req.Name, req.Email, req.Description)
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusCreated, list)
}

func (h *MailHandler) GetMailingList(c *gin.Context) {
	list, err := h.deps.MailingListService.Get(c.Request.Context(), h.tenantID(c), c.Param("listId"))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, list)
}

func (h *MailHandler) UpdateMailingList(c *gin.Context) {
	var req struct {
		Name           string  `json:"name"`
		Email          string  `json:"email"`
		Description    string  `json:"description"`
		IsEnabled      *bool   `json:"isEnabled"`
		ModerationMode *string `json:"moderationMode"`
	}
	_ = c.ShouldBindJSON(&req)
	list, err := h.deps.MailingListService.Update(c.Request.Context(), h.tenantID(c), c.Param("listId"), req.Name, req.Email, req.Description, req.IsEnabled, req.ModerationMode)
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, list)
}

func (h *MailHandler) DeleteMailingList(c *gin.Context) {
	if err := h.deps.MailingListService.Delete(c.Request.Context(), h.tenantID(c), c.Param("listId")); err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, gin.H{"deleted": true})
}

func (h *MailHandler) ListSubscribers(c *gin.Context) {
	items, err := h.deps.MailingListService.ListSubscribers(c.Request.Context(), h.tenantID(c), c.Param("listId"))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, items)
}

func (h *MailHandler) AddSubscriber(c *gin.Context) {
	var req struct {
		Email string `json:"email"`
	}
	if c.ShouldBindJSON(&req) != nil {
		utils.Error(c, utils.ErrValidationFailed)
		return
	}
	sub, err := h.deps.MailingListService.AddSubscriber(c.Request.Context(), h.tenantID(c), c.Param("listId"), req.Email)
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusCreated, sub)
}

func (h *MailHandler) RemoveSubscriber(c *gin.Context) {
	if err := h.deps.MailingListService.RemoveSubscriber(c.Request.Context(), h.tenantID(c), c.Param("listId"), c.Param("subscriberId")); err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, gin.H{"removed": true})
}

func (h *MailHandler) ImportSubscribers(c *gin.Context) {
	utils.Success(c, http.StatusNotImplemented, gin.H{"imported": 0})
}

func (h *MailHandler) GetModerationSettings(c *gin.Context) {
	mod, err := h.deps.MailingListService.GetModeration(c.Request.Context(), h.tenantID(c), c.Param("listId"))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, mod)
}

func (h *MailHandler) UpdateModerationSettings(c *gin.Context) {
	var req struct {
		PostingMode    string   `json:"postingMode"`
		ModeratorEmails []string `json:"moderatorEmails"`
	}
	_ = c.ShouldBindJSON(&req)
	mod, err := h.deps.MailingListService.UpdateModeration(c.Request.Context(), h.tenantID(c), c.Param("listId"), req.PostingMode, req.ModeratorEmails)
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, mod)
}

// ──────────────────────────────────────────────────────
// 2.1 Auth Config
// ──────────────────────────────────────────────────────

func (h *MailHandler) setupAuthConfig(r *gin.RouterGroup) {
	auth := r.Group("/auth")
	{
		auth.GET("/ldap", h.GetLdapConfig)
		auth.PATCH("/ldap", h.UpdateLdapConfig)
		auth.POST("/ldap/test", h.TestLdapConnection)
		auth.GET("/oidc", h.GetOidcConfig)
		auth.PATCH("/oidc", h.UpdateOidcConfig)
		auth.GET("/providers", h.ListAuthProviders)
		auth.POST("/providers", h.CreateAuthProvider)
		auth.PATCH("/providers/:providerId", h.UpdateAuthProvider)
		auth.DELETE("/providers/:providerId", h.DeleteAuthProvider)
		auth.GET("/mfa", h.GetMfaConfig)
		auth.PATCH("/mfa", h.UpdateMfaConfig)
		auth.GET("/app-passwords", h.GetAppPasswordPolicy)
		auth.PATCH("/app-passwords", h.UpdateAppPasswordPolicy)
		auth.GET("/sql", h.GetSqlAuthConfig)
		auth.PATCH("/sql", h.UpdateSqlAuthConfig)
		auth.POST("/sql/test", h.TestSqlAuthConnection)
		auth.GET("/api-keys", h.ListApiKeys)
		auth.POST("/api-keys", h.CreateApiKey)
		auth.DELETE("/api-keys/:keyId", h.DeleteApiKey)
	}
}

func (h *MailHandler) GetLdapConfig(c *gin.Context)            { utils.Success(c, http.StatusOK, h.deps.ConfigService.GetLdapConfig(c.Request.Context())) }
func (h *MailHandler) UpdateLdapConfig(c *gin.Context)         { utils.Success(c, http.StatusOK, h.deps.ConfigService.UpdateLdapConfig(c.Request.Context(), nil)) }
func (h *MailHandler) TestLdapConnection(c *gin.Context)       { utils.Success(c, http.StatusOK, h.deps.ConfigService.TestLdapConnection(c.Request.Context())) }
func (h *MailHandler) GetOidcConfig(c *gin.Context)            { utils.Success(c, http.StatusOK, h.deps.ConfigService.GetOidcConfig(c.Request.Context())) }
func (h *MailHandler) UpdateOidcConfig(c *gin.Context)         { utils.Success(c, http.StatusOK, h.deps.ConfigService.UpdateOidcConfig(c.Request.Context(), nil)) }
func (h *MailHandler) GetMfaConfig(c *gin.Context)             { utils.Success(c, http.StatusOK, h.deps.ConfigService.GetMfaConfig(c.Request.Context())) }
func (h *MailHandler) UpdateMfaConfig(c *gin.Context)          { utils.Success(c, http.StatusOK, h.deps.ConfigService.UpdateMfaConfig(c.Request.Context(), nil)) }
func (h *MailHandler) GetAppPasswordPolicy(c *gin.Context)     { utils.Success(c, http.StatusOK, h.deps.ConfigService.GetAppPasswordPolicy(c.Request.Context())) }
func (h *MailHandler) UpdateAppPasswordPolicy(c *gin.Context)  { utils.Success(c, http.StatusOK, h.deps.ConfigService.UpdateAppPasswordPolicy(c.Request.Context(), nil)) }
func (h *MailHandler) GetSqlAuthConfig(c *gin.Context)         { utils.Success(c, http.StatusOK, h.deps.ConfigService.GetSqlAuthConfig(c.Request.Context())) }
func (h *MailHandler) UpdateSqlAuthConfig(c *gin.Context)      { utils.Success(c, http.StatusOK, h.deps.ConfigService.UpdateSqlAuthConfig(c.Request.Context(), nil)) }
func (h *MailHandler) TestSqlAuthConnection(c *gin.Context)    { utils.Success(c, http.StatusOK, h.deps.ConfigService.TestSqlAuthConnection(c.Request.Context())) }

func (h *MailHandler) ListAuthProviders(c *gin.Context) {
	utils.Success(c, http.StatusOK, h.deps.ConfigService.ListAuthProviders(c.Request.Context()))
}

func (h *MailHandler) CreateAuthProvider(c *gin.Context) {
	utils.Success(c, http.StatusCreated, h.deps.ConfigService.CreateAuthProvider(c.Request.Context(), nil))
}

func (h *MailHandler) UpdateAuthProvider(c *gin.Context) {
	utils.Success(c, http.StatusOK, h.deps.ConfigService.UpdateAuthProvider(c.Request.Context(), c.Param("providerId"), nil))
}

func (h *MailHandler) DeleteAuthProvider(c *gin.Context) {
	if err := h.deps.ConfigService.DeleteAuthProvider(c.Request.Context(), c.Param("providerId")); err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, gin.H{"deleted": true})
}

func (h *MailHandler) ListApiKeys(c *gin.Context) {
	items, err := h.deps.ConfigService.ListApiKeys(c.Request.Context(), h.tenantID(c))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, items)
}

func (h *MailHandler) CreateApiKey(c *gin.Context) {
	var req struct {
		Name   string `json:"name"`
		Scopes []byte `json:"scopes"`
	}
	if c.ShouldBindJSON(&req) != nil {
		utils.Error(c, utils.ErrValidationFailed)
		return
	}
	key, err := h.deps.ConfigService.CreateApiKey(c.Request.Context(), h.tenantID(c), req.Name, req.Scopes)
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusCreated, key)
}

func (h *MailHandler) DeleteApiKey(c *gin.Context) {
	if err := h.deps.ConfigService.DeleteApiKey(c.Request.Context(), h.tenantID(c), c.Param("keyId")); err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, gin.H{"deleted": true})
}

// ──────────────────────────────────────────────────────
// 2.2 Security Config
// ──────────────────────────────────────────────────────

func (h *MailHandler) setupSecurityConfig(r *gin.RouterGroup) {
	sec := r.Group("/security")
	{
		sec.GET("/spam", h.GetSpamConfig)
		sec.PATCH("/spam", h.UpdateSpamConfig)
		sec.GET("/spam/rules", h.ListSpamRules)
		sec.POST("/spam/rules", h.CreateSpamRule)
		sec.PATCH("/spam/rules/:ruleId", h.UpdateSpamRule)
		sec.DELETE("/spam/rules/:ruleId", h.DeleteSpamRule)
		sec.GET("/spam/dnsbl", h.ListDnsblServers)
		sec.POST("/spam/dnsbl", h.AddDnsblServer)
		sec.DELETE("/spam/dnsbl/:serverId", h.RemoveDnsblServer)
		sec.GET("/spam/classifier", h.GetClassifierConfig)
		sec.PATCH("/spam/classifier", h.UpdateClassifierConfig)
		sec.POST("/spam/classifier/train", h.TrainClassifier)
		sec.GET("/rate-limits", h.GetRateLimits)
		sec.PATCH("/rate-limits", h.UpdateRateLimits)
		sec.GET("/ips", h.ListIpRules)
		sec.POST("/ips", h.CreateIpRule)
		sec.DELETE("/ips/:ruleId", h.DeleteIpRule)
		sec.GET("/ips/blocked", h.ListBlockedIps)
		sec.DELETE("/ips/banned/:ipId", h.UnblockIp)
		sec.GET("/abuse", h.GetAbuseConfig)
		sec.PATCH("/abuse", h.UpdateAbuseConfig)
		sec.GET("/access-control", h.ListAclEntries)
		sec.POST("/access-control", h.CreateAclEntry)
		sec.PATCH("/access-control/:aclId", h.UpdateAclEntry)
		sec.DELETE("/access-control/:aclId", h.DeleteAclEntry)
	}
}

func (h *MailHandler) GetSpamConfig(c *gin.Context)            { utils.Success(c, http.StatusOK, h.deps.ConfigService.GetSpamConfig(c.Request.Context())) }
func (h *MailHandler) UpdateSpamConfig(c *gin.Context)         { utils.Success(c, http.StatusOK, h.deps.ConfigService.UpdateSpamConfig(c.Request.Context(), nil)) }
func (h *MailHandler) GetClassifierConfig(c *gin.Context)      { utils.Success(c, http.StatusOK, h.deps.ConfigService.GetClassifierConfig(c.Request.Context())) }
func (h *MailHandler) UpdateClassifierConfig(c *gin.Context)   { utils.Success(c, http.StatusOK, h.deps.ConfigService.UpdateClassifierConfig(c.Request.Context(), nil)) }
func (h *MailHandler) TrainClassifier(c *gin.Context)          { utils.Success(c, http.StatusOK, h.deps.ConfigService.TrainClassifier(c.Request.Context(), "", false)) }
func (h *MailHandler) GetRateLimits(c *gin.Context)            { utils.Success(c, http.StatusOK, h.deps.ConfigService.GetRateLimits(c.Request.Context())) }
func (h *MailHandler) UpdateRateLimits(c *gin.Context)         { utils.Success(c, http.StatusOK, h.deps.ConfigService.UpdateRateLimits(c.Request.Context(), nil)) }
func (h *MailHandler) GetAbuseConfig(c *gin.Context)           { utils.Success(c, http.StatusOK, h.deps.ConfigService.GetAbuseConfig(c.Request.Context())) }
func (h *MailHandler) UpdateAbuseConfig(c *gin.Context)        { utils.Success(c, http.StatusOK, h.deps.ConfigService.UpdateAbuseConfig(c.Request.Context(), nil)) }

func (h *MailHandler) ListSpamRules(c *gin.Context) {
	items, err := h.deps.ConfigService.ListSpamRules(c.Request.Context(), h.tenantID(c))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, items)
}

func (h *MailHandler) CreateSpamRule(c *gin.Context) {
	var req struct {
		Name      string `json:"name"`
		Condition string `json:"condition"`
		Action    string `json:"action"`
		Score     int    `json:"score"`
	}
	if c.ShouldBindJSON(&req) != nil {
		utils.Error(c, utils.ErrValidationFailed)
		return
	}
	rule, err := h.deps.ConfigService.CreateSpamRule(c.Request.Context(), h.tenantID(c), req.Name, req.Condition, req.Action, req.Score)
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusCreated, rule)
}

func (h *MailHandler) UpdateSpamRule(c *gin.Context) {
	var req struct {
		Name      string `json:"name"`
		Condition string `json:"condition"`
		Action    string `json:"action"`
		Score     int    `json:"score"`
		IsEnabled bool   `json:"isEnabled"`
	}
	_ = c.ShouldBindJSON(&req)
	rule, err := h.deps.ConfigService.UpdateSpamRule(c.Request.Context(), h.tenantID(c), c.Param("ruleId"), req.Name, req.Condition, req.Action, req.Score, req.IsEnabled)
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, rule)
}

func (h *MailHandler) DeleteSpamRule(c *gin.Context) {
	if err := h.deps.ConfigService.DeleteSpamRule(c.Request.Context(), h.tenantID(c), c.Param("ruleId")); err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, gin.H{"deleted": true})
}

func (h *MailHandler) ListDnsblServers(c *gin.Context) {
	items, err := h.deps.ConfigService.ListDnsblServers(c.Request.Context(), h.tenantID(c))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, items)
}

func (h *MailHandler) AddDnsblServer(c *gin.Context) {
	var req struct {
		Hostname string `json:"hostname"`
	}
	if c.ShouldBindJSON(&req) != nil {
		utils.Error(c, utils.ErrValidationFailed)
		return
	}
	server, err := h.deps.ConfigService.AddDnsblServer(c.Request.Context(), h.tenantID(c), req.Hostname)
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusCreated, server)
}

func (h *MailHandler) RemoveDnsblServer(c *gin.Context) {
	if err := h.deps.ConfigService.RemoveDnsblServer(c.Request.Context(), h.tenantID(c), c.Param("serverId")); err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, gin.H{"removed": true})
}

func (h *MailHandler) ListIpRules(c *gin.Context) {
	items, err := h.deps.ConfigService.ListIpRules(c.Request.Context(), h.tenantID(c))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, items)
}

func (h *MailHandler) CreateIpRule(c *gin.Context) {
	var req struct {
		CIDR   string `json:"cidr"`
		Action string `json:"action"`
		Note   string `json:"note"`
	}
	if c.ShouldBindJSON(&req) != nil {
		utils.Error(c, utils.ErrValidationFailed)
		return
	}
	rule, err := h.deps.ConfigService.CreateIpRule(c.Request.Context(), h.tenantID(c), req.CIDR, req.Action, req.Note)
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusCreated, rule)
}

func (h *MailHandler) DeleteIpRule(c *gin.Context) {
	if err := h.deps.ConfigService.DeleteIpRule(c.Request.Context(), h.tenantID(c), c.Param("ruleId")); err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, gin.H{"deleted": true})
}

func (h *MailHandler) ListBlockedIps(c *gin.Context) {
	items, err := h.deps.ConfigService.ListBlockedIps(c.Request.Context())
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, items)
}

func (h *MailHandler) UnblockIp(c *gin.Context) {
	if err := h.deps.ConfigService.UnblockIp(c.Request.Context(), c.Param("ipId")); err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, gin.H{"unblocked": true})
}

func (h *MailHandler) ListAclEntries(c *gin.Context) {
	items, err := h.deps.ConfigService.ListAclEntries(c.Request.Context(), h.tenantID(c))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, items)
}

func (h *MailHandler) CreateAclEntry(c *gin.Context) {
	var req struct {
		Principal   string `json:"principal"`
		Permission  string `json:"permission"`
		Description string `json:"description"`
	}
	if c.ShouldBindJSON(&req) != nil {
		utils.Error(c, utils.ErrValidationFailed)
		return
	}
	entry, err := h.deps.ConfigService.CreateAclEntry(c.Request.Context(), h.tenantID(c), req.Principal, req.Permission, req.Description)
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusCreated, entry)
}

func (h *MailHandler) UpdateAclEntry(c *gin.Context) {
	var req struct {
		Principal   string `json:"principal"`
		Permission  string `json:"permission"`
		Description string `json:"description"`
	}
	_ = c.ShouldBindJSON(&req)
	entry, err := h.deps.ConfigService.UpdateAclEntry(c.Request.Context(), h.tenantID(c), c.Param("aclId"), req.Principal, req.Permission, req.Description)
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, entry)
}

func (h *MailHandler) DeleteAclEntry(c *gin.Context) {
	if err := h.deps.ConfigService.DeleteAclEntry(c.Request.Context(), h.tenantID(c), c.Param("aclId")); err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, gin.H{"deleted": true})
}

// ──────────────────────────────────────────────────────
// 2.3 Network Config
// ──────────────────────────────────────────────────────

func (h *MailHandler) setupNetworkConfig(r *gin.RouterGroup) {
	net := r.Group("/network")
	{
		net.GET("/listeners", h.ListListeners)
		net.POST("/listeners", h.CreateListener)
		net.PATCH("/listeners/:listenerId", h.UpdateListener)
		net.DELETE("/listeners/:listenerId", h.DeleteListener)
		net.GET("/imap", h.GetImapConfig)
		net.PATCH("/imap", h.UpdateImapConfig)
		net.GET("/smtp", h.GetSmtpConfig)
		net.PATCH("/smtp", h.UpdateSmtpConfig)
		net.GET("/jmap", h.GetJmapConfig)
		net.PATCH("/jmap", h.UpdateJmapConfig)
		net.GET("/http", h.GetHttpConfig)
		net.PATCH("/http", h.UpdateHttpConfig)
		net.GET("/webdav", h.GetWebdavConfig)
		net.PATCH("/webdav", h.UpdateWebdavConfig)
	}
}

func (h *MailHandler) ListListeners(c *gin.Context)       { utils.Success(c, http.StatusOK, []any{}) }
func (h *MailHandler) CreateListener(c *gin.Context)      { utils.Success(c, http.StatusCreated, gin.H{"created": true}) }
func (h *MailHandler) UpdateListener(c *gin.Context)      { utils.Success(c, http.StatusOK, gin.H{"updated": true}) }
func (h *MailHandler) DeleteListener(c *gin.Context)      { utils.Success(c, http.StatusOK, gin.H{"deleted": true}) }
func (h *MailHandler) GetImapConfig(c *gin.Context)       { utils.Success(c, http.StatusOK, h.deps.ConfigService.GetNetworkConfig(c.Request.Context(), "imap")) }
func (h *MailHandler) UpdateImapConfig(c *gin.Context)    { utils.Success(c, http.StatusOK, h.deps.ConfigService.UpdateNetworkConfig(c.Request.Context(), "imap", nil)) }
func (h *MailHandler) GetSmtpConfig(c *gin.Context)       { utils.Success(c, http.StatusOK, h.deps.ConfigService.GetNetworkConfig(c.Request.Context(), "smtp")) }
func (h *MailHandler) UpdateSmtpConfig(c *gin.Context)    { utils.Success(c, http.StatusOK, h.deps.ConfigService.UpdateNetworkConfig(c.Request.Context(), "smtp", nil)) }
func (h *MailHandler) GetJmapConfig(c *gin.Context)       { utils.Success(c, http.StatusOK, h.deps.ConfigService.GetNetworkConfig(c.Request.Context(), "jmap")) }
func (h *MailHandler) UpdateJmapConfig(c *gin.Context)    { utils.Success(c, http.StatusOK, h.deps.ConfigService.UpdateNetworkConfig(c.Request.Context(), "jmap", nil)) }
func (h *MailHandler) GetHttpConfig(c *gin.Context)       { utils.Success(c, http.StatusOK, h.deps.ConfigService.GetNetworkConfig(c.Request.Context(), "http")) }
func (h *MailHandler) UpdateHttpConfig(c *gin.Context)    { utils.Success(c, http.StatusOK, h.deps.ConfigService.UpdateNetworkConfig(c.Request.Context(), "http", nil)) }
func (h *MailHandler) GetWebdavConfig(c *gin.Context)     { utils.Success(c, http.StatusOK, h.deps.ConfigService.GetNetworkConfig(c.Request.Context(), "webdav")) }
func (h *MailHandler) UpdateWebdavConfig(c *gin.Context)  { utils.Success(c, http.StatusOK, h.deps.ConfigService.UpdateNetworkConfig(c.Request.Context(), "webdav", nil)) }

// ──────────────────────────────────────────────────────
// 2.4 SMTP Queue
// ──────────────────────────────────────────────────────

func (h *MailHandler) setupSmtpConfig(r *gin.RouterGroup) {
	smtp := r.Group("/smtp")
	{
		smtp.GET("/queue", h.ListQueue)
		smtp.DELETE("/queue/:messageId", h.DeleteQueuedMessage)
		smtp.POST("/queue/:messageId/retry", h.RetryQueuedMessage)
		smtp.POST("/queue/purge", h.PurgeQueue)
		smtp.GET("/queue/stats", h.GetQueueStats)
		smtp.GET("/incoming", h.GetInboundConfig)
		smtp.PATCH("/incoming", h.UpdateInboundConfig)
		smtp.GET("/outgoing", h.GetOutboundConfig)
		smtp.PATCH("/outgoing", h.UpdateOutboundConfig)
		smtp.GET("/routes", h.ListSmtpRoutes)
		smtp.POST("/routes", h.CreateSmtpRoute)
		smtp.PATCH("/routes/:routeId", h.UpdateSmtpRoute)
		smtp.DELETE("/routes/:routeId", h.DeleteSmtpRoute)
	}
}

func (h *MailHandler) ListQueue(c *gin.Context) {
	items, err := h.deps.QueueService.List(c.Request.Context(), h.tenantID(c))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, items)
}

func (h *MailHandler) DeleteQueuedMessage(c *gin.Context) {
	if err := h.deps.QueueService.Delete(c.Request.Context(), h.tenantID(c), c.Param("messageId")); err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, gin.H{"deleted": true})
}

func (h *MailHandler) RetryQueuedMessage(c *gin.Context) {
	if err := h.deps.QueueService.Retry(c.Request.Context(), h.tenantID(c), c.Param("messageId")); err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, gin.H{"retrying": true})
}

func (h *MailHandler) PurgeQueue(c *gin.Context) {
	count, err := h.deps.QueueService.PurgeExpired(c.Request.Context(), h.tenantID(c))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, gin.H{"purged": count})
}

func (h *MailHandler) GetQueueStats(c *gin.Context) {
	stats, err := h.deps.QueueService.Stats(c.Request.Context(), h.tenantID(c))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, stats)
}

func (h *MailHandler) GetInboundConfig(c *gin.Context)      { utils.Success(c, http.StatusOK, h.deps.ConfigService.GetNetworkConfig(c.Request.Context(), "smtp-in")) }
func (h *MailHandler) UpdateInboundConfig(c *gin.Context)   { utils.Success(c, http.StatusOK, h.deps.ConfigService.UpdateNetworkConfig(c.Request.Context(), "smtp-in", nil)) }
func (h *MailHandler) GetOutboundConfig(c *gin.Context)     { utils.Success(c, http.StatusOK, h.deps.ConfigService.GetNetworkConfig(c.Request.Context(), "smtp-out")) }
func (h *MailHandler) UpdateOutboundConfig(c *gin.Context)  { utils.Success(c, http.StatusOK, h.deps.ConfigService.UpdateNetworkConfig(c.Request.Context(), "smtp-out", nil)) }

func (h *MailHandler) ListSmtpRoutes(c *gin.Context) {
	items, err := h.deps.ConfigService.ListSmtpRoutes(c.Request.Context(), h.tenantID(c))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, items)
}

func (h *MailHandler) CreateSmtpRoute(c *gin.Context) {
	var req struct {
		Name       string `json:"name"`
		RemoteHost string `json:"remoteHost"`
		Port       int    `json:"port"`
		RequireTls bool   `json:"requireTls"`
		Username   string `json:"username"`
		Password   string `json:"password"`
		MaxRetries int    `json:"maxRetries"`
		Priority   int    `json:"priority"`
	}
	if c.ShouldBindJSON(&req) != nil {
		utils.Error(c, utils.ErrValidationFailed)
		return
	}
	route, err := h.deps.ConfigService.CreateSmtpRoute(c.Request.Context(), h.tenantID(c), req.Name, req.RemoteHost, req.Port, req.RequireTls, req.Username, req.Password, req.MaxRetries, req.Priority)
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusCreated, route)
}

func (h *MailHandler) UpdateSmtpRoute(c *gin.Context) {
	var req struct {
		Name       string `json:"name"`
		RemoteHost string `json:"remoteHost"`
		Port       int    `json:"port"`
		RequireTls bool   `json:"requireTls"`
		MaxRetries int    `json:"maxRetries"`
		Priority   int    `json:"priority"`
		IsEnabled  bool   `json:"isEnabled"`
	}
	_ = c.ShouldBindJSON(&req)
	route, err := h.deps.ConfigService.UpdateSmtpRoute(c.Request.Context(), h.tenantID(c), c.Param("routeId"), req.Name, req.RemoteHost, req.Port, req.RequireTls, req.MaxRetries, req.Priority, req.IsEnabled)
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, route)
}

func (h *MailHandler) DeleteSmtpRoute(c *gin.Context) {
	if err := h.deps.ConfigService.DeleteSmtpRoute(c.Request.Context(), h.tenantID(c), c.Param("routeId")); err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, gin.H{"deleted": true})
}

// ──────────────────────────────────────────────────────
// 2.5 Storage Config
// ──────────────────────────────────────────────────────

func (h *MailHandler) setupStorageConfig(r *gin.RouterGroup) {
	storage := r.Group("/storage")
	{
		storage.GET("/data", h.GetDataStoreConfig)
		storage.PATCH("/data", h.UpdateDataStoreConfig)
		storage.GET("/blob", h.GetBlobStoreConfig)
		storage.PATCH("/blob", h.UpdateBlobStoreConfig)
		storage.GET("/search", h.GetSearchStoreConfig)
		storage.PATCH("/search", h.UpdateSearchStoreConfig)
		storage.GET("/cache", h.GetCacheConfig)
		storage.PATCH("/cache", h.UpdateCacheConfig)
		storage.POST("/test", h.TestStorageConnection)
		storage.GET("/backends", h.ListStorageBackends)
	}
}

func (h *MailHandler) GetDataStoreConfig(c *gin.Context)         { utils.Success(c, http.StatusOK, h.deps.ConfigService.GetStorageConfig(c.Request.Context(), "data")) }
func (h *MailHandler) UpdateDataStoreConfig(c *gin.Context)      { utils.Success(c, http.StatusOK, h.deps.ConfigService.UpdateStorageConfig(c.Request.Context(), "data", nil)) }
func (h *MailHandler) GetBlobStoreConfig(c *gin.Context)         { utils.Success(c, http.StatusOK, h.deps.ConfigService.GetStorageConfig(c.Request.Context(), "blob")) }
func (h *MailHandler) UpdateBlobStoreConfig(c *gin.Context)      { utils.Success(c, http.StatusOK, h.deps.ConfigService.UpdateStorageConfig(c.Request.Context(), "blob", nil)) }
func (h *MailHandler) GetSearchStoreConfig(c *gin.Context)       { utils.Success(c, http.StatusOK, h.deps.ConfigService.GetStorageConfig(c.Request.Context(), "search")) }
func (h *MailHandler) UpdateSearchStoreConfig(c *gin.Context)    { utils.Success(c, http.StatusOK, h.deps.ConfigService.UpdateStorageConfig(c.Request.Context(), "search", nil)) }
func (h *MailHandler) GetCacheConfig(c *gin.Context)             { utils.Success(c, http.StatusOK, h.deps.ConfigService.GetStorageConfig(c.Request.Context(), "cache")) }
func (h *MailHandler) UpdateCacheConfig(c *gin.Context)          { utils.Success(c, http.StatusOK, h.deps.ConfigService.UpdateStorageConfig(c.Request.Context(), "cache", nil)) }
func (h *MailHandler) TestStorageConnection(c *gin.Context)      { utils.Success(c, http.StatusOK, h.deps.ConfigService.TestStorageConnection(c.Request.Context(), "", nil)) }
func (h *MailHandler) ListStorageBackends(c *gin.Context)        { utils.Success(c, http.StatusOK, h.deps.ConfigService.ListStorageBackends(c.Request.Context())) }

// ──────────────────────────────────────────────────────
// 2.6 Server Config
// ──────────────────────────────────────────────────────

func (h *MailHandler) setupServerConfig(r *gin.RouterGroup) {
	srv := r.Group("/server")
	{
		srv.GET("/overview", h.GetServerOverview)
		srv.GET("/hostname", h.GetHostnameConfig)
		srv.PATCH("/hostname", h.UpdateHostnameConfig)
		srv.GET("/identity", h.GetServerIdentity)
		srv.PATCH("/identity", h.UpdateServerIdentity)
		srv.GET("/settings", h.GetSystemSettings)
		srv.PATCH("/settings", h.UpdateSystemSettings)
		srv.GET("/cache", h.GetCacheStats)
		srv.POST("/cache/flush", h.FlushCache)
		srv.GET("/dns", h.GetDnsServerConfig)
		srv.PATCH("/dns", h.UpdateDnsServerConfig)
		srv.POST("/dns/test", h.TestDnsResolution)
		srv.GET("/autoconfig", h.GetAutoconfigConfig)
		srv.PATCH("/autoconfig", h.UpdateAutoconfigConfig)
	}
}

func (h *MailHandler) GetServerOverview(c *gin.Context)     { utils.Success(c, http.StatusOK, h.deps.ConfigService.GetServerConfig(c.Request.Context(), "overview")) }
func (h *MailHandler) GetHostnameConfig(c *gin.Context)     { utils.Success(c, http.StatusOK, h.deps.ConfigService.GetServerConfig(c.Request.Context(), "hostname")) }
func (h *MailHandler) UpdateHostnameConfig(c *gin.Context)  { utils.Success(c, http.StatusOK, h.deps.ConfigService.UpdateServerConfig(c.Request.Context(), "hostname", nil)) }
func (h *MailHandler) GetServerIdentity(c *gin.Context)     { utils.Success(c, http.StatusOK, h.deps.ConfigService.GetServerConfig(c.Request.Context(), "identity")) }
func (h *MailHandler) UpdateServerIdentity(c *gin.Context)  { utils.Success(c, http.StatusOK, h.deps.ConfigService.UpdateServerConfig(c.Request.Context(), "identity", nil)) }
func (h *MailHandler) GetSystemSettings(c *gin.Context)     { utils.Success(c, http.StatusOK, h.deps.ConfigService.GetServerConfig(c.Request.Context(), "settings")) }
func (h *MailHandler) UpdateSystemSettings(c *gin.Context)  { utils.Success(c, http.StatusOK, h.deps.ConfigService.UpdateServerConfig(c.Request.Context(), "settings", nil)) }
func (h *MailHandler) GetCacheStats(c *gin.Context)         { utils.Success(c, http.StatusOK, h.deps.ConfigService.GetServerConfig(c.Request.Context(), "cache")) }
func (h *MailHandler) FlushCache(c *gin.Context)            { utils.Success(c, http.StatusOK, h.deps.ConfigService.FlushCache(c.Request.Context())) }
func (h *MailHandler) GetDnsServerConfig(c *gin.Context)    { utils.Success(c, http.StatusOK, h.deps.ConfigService.GetServerConfig(c.Request.Context(), "dns")) }
func (h *MailHandler) UpdateDnsServerConfig(c *gin.Context) { utils.Success(c, http.StatusOK, h.deps.ConfigService.UpdateServerConfig(c.Request.Context(), "dns", nil)) }
func (h *MailHandler) TestDnsResolution(c *gin.Context)     { utils.Success(c, http.StatusOK, h.deps.ConfigService.TestDnsResolution(c.Request.Context(), c.Query("domain"))) }
func (h *MailHandler) GetAutoconfigConfig(c *gin.Context)   { utils.Success(c, http.StatusOK, h.deps.ConfigService.GetServerConfig(c.Request.Context(), "autoconfig")) }
func (h *MailHandler) UpdateAutoconfigConfig(c *gin.Context) { utils.Success(c, http.StatusOK, h.deps.ConfigService.UpdateServerConfig(c.Request.Context(), "autoconfig", nil)) }

// ──────────────────────────────────────────────────────
// 2.7 TLS Config
// ──────────────────────────────────────────────────────

func (h *MailHandler) setupTlsConfig(r *gin.RouterGroup) {
	tls := r.Group("/tls")
	{
		tls.GET("/certificates", h.ListCertificates)
		tls.POST("/certificates", h.UploadCertificate)
		tls.DELETE("/certificates/:certId", h.DeleteCertificate)
		tls.GET("/acme", h.GetAcmeConfig)
		tls.PATCH("/acme", h.UpdateAcmeConfig)
		tls.POST("/acme/provision", h.ProvisionAcmeCert)
		tls.GET("/acme/challenges", h.GetAcmeChallenges)
		tls.PATCH("/acme/challenges", h.UpdateAcmeChallenges)
		tls.GET("/encryption", h.GetEncryptionConfig)
		tls.PATCH("/encryption", h.UpdateEncryptionConfig)
	}
}

func (h *MailHandler) GetAcmeConfig(c *gin.Context)            { utils.Success(c, http.StatusOK, h.deps.ConfigService.GetAcmeConfig(c.Request.Context())) }
func (h *MailHandler) UpdateAcmeConfig(c *gin.Context)         { utils.Success(c, http.StatusOK, h.deps.ConfigService.UpdateAcmeConfig(c.Request.Context(), nil)) }
func (h *MailHandler) ProvisionAcmeCert(c *gin.Context)        { utils.Success(c, http.StatusOK, h.deps.ConfigService.ProvisionAcmeCert(c.Request.Context(), c.Query("domain"))) }
func (h *MailHandler) GetAcmeChallenges(c *gin.Context)        { utils.Success(c, http.StatusOK, h.deps.ConfigService.GetAcmeChallenges(c.Request.Context())) }
func (h *MailHandler) UpdateAcmeChallenges(c *gin.Context)     { utils.Success(c, http.StatusOK, h.deps.ConfigService.UpdateAcmeChallenges(c.Request.Context(), nil)) }
func (h *MailHandler) GetEncryptionConfig(c *gin.Context)      { utils.Success(c, http.StatusOK, h.deps.ConfigService.GetEncryptionConfig(c.Request.Context())) }
func (h *MailHandler) UpdateEncryptionConfig(c *gin.Context)   { utils.Success(c, http.StatusOK, h.deps.ConfigService.UpdateEncryptionConfig(c.Request.Context(), nil)) }

func (h *MailHandler) ListCertificates(c *gin.Context) {
	items, err := h.deps.ConfigService.ListCertificates(c.Request.Context(), h.tenantID(c))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, items)
}

func (h *MailHandler) UploadCertificate(c *gin.Context) {
	var req struct {
		Domain      string `json:"domain"`
		CertPEM     string `json:"certPem"`
		KeyPEM      string `json:"keyPem"`
		Issuer      string `json:"issuer"`
		ExpiresAt   string `json:"expiresAt"`
		IsAutoRenew bool   `json:"isAutoRenew"`
	}
	if c.ShouldBindJSON(&req) != nil {
		utils.Error(c, utils.ErrValidationFailed)
		return
	}
	expiresAt, _ := time.Parse(time.RFC3339, req.ExpiresAt)
	cert, err := h.deps.ConfigService.UploadCertificate(c.Request.Context(), h.tenantID(c), req.Domain, req.CertPEM, req.KeyPEM, req.Issuer, expiresAt, req.IsAutoRenew)
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusCreated, cert)
}

func (h *MailHandler) DeleteCertificate(c *gin.Context) {
	if err := h.deps.ConfigService.DeleteCertificate(c.Request.Context(), h.tenantID(c), c.Param("certId")); err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, gin.H{"deleted": true})
}

// ──────────────────────────────────────────────────────
// 2.8 Policies Config
// ──────────────────────────────────────────────────────

func (h *MailHandler) setupPoliciesConfig(r *gin.RouterGroup) {
	pol := r.Group("/policies")
	{
		pol.GET("/filtering", h.GetFilteringConfig)
		pol.PATCH("/filtering", h.UpdateFilteringConfig)
		pol.GET("/rules", h.ListPolicyRules)
		pol.POST("/rules", h.CreatePolicyRule)
		pol.PATCH("/rules/:ruleId", h.UpdatePolicyRule)
		pol.DELETE("/rules/:ruleId", h.DeletePolicyRule)
		pol.GET("/retention", h.GetRetentionConfig)
		pol.PATCH("/retention", h.UpdateRetentionConfig)
		pol.GET("/compliance", h.GetComplianceConfig)
		pol.PATCH("/compliance", h.UpdateComplianceConfig)
		pol.GET("/sieve", h.GetSieveConfig)
		pol.PATCH("/sieve", h.UpdateSieveConfig)
		pol.GET("/sieve/scripts", h.ListSystemSieveScripts)
		pol.POST("/sieve/scripts", h.CreateSystemSieveScript)
		pol.PATCH("/sieve/scripts/:scriptId", h.UpdateSystemSieveScript)
		pol.DELETE("/sieve/scripts/:scriptId", h.DeleteSystemSieveScript)
	}
}

func (h *MailHandler) GetFilteringConfig(c *gin.Context)          { utils.Success(c, http.StatusOK, h.deps.ConfigService.GetFilteringConfig(c.Request.Context())) }
func (h *MailHandler) UpdateFilteringConfig(c *gin.Context)       { utils.Success(c, http.StatusOK, h.deps.ConfigService.UpdateFilteringConfig(c.Request.Context(), nil)) }
func (h *MailHandler) GetRetentionConfig(c *gin.Context)          { utils.Success(c, http.StatusOK, h.deps.ConfigService.GetRetentionConfig(c.Request.Context())) }
func (h *MailHandler) UpdateRetentionConfig(c *gin.Context)       { utils.Success(c, http.StatusOK, h.deps.ConfigService.UpdateRetentionConfig(c.Request.Context(), nil)) }
func (h *MailHandler) GetComplianceConfig(c *gin.Context)         { utils.Success(c, http.StatusOK, h.deps.ConfigService.GetComplianceConfig(c.Request.Context())) }
func (h *MailHandler) UpdateComplianceConfig(c *gin.Context)      { utils.Success(c, http.StatusOK, h.deps.ConfigService.UpdateComplianceConfig(c.Request.Context(), nil)) }
func (h *MailHandler) GetSieveConfig(c *gin.Context)              { utils.Success(c, http.StatusOK, h.deps.ConfigService.GetSieveConfig(c.Request.Context())) }
func (h *MailHandler) UpdateSieveConfig(c *gin.Context)           { utils.Success(c, http.StatusOK, h.deps.ConfigService.UpdateSieveConfig(c.Request.Context(), nil)) }

func (h *MailHandler) ListPolicyRules(c *gin.Context) {
	items, err := h.deps.ConfigService.ListPolicyRules(c.Request.Context(), h.tenantID(c))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, items)
}

func (h *MailHandler) CreatePolicyRule(c *gin.Context) {
	var req struct {
		Name       string `json:"name"`
		Conditions []byte `json:"conditions"`
		Actions    []byte `json:"actions"`
		Priority   int    `json:"priority"`
	}
	if c.ShouldBindJSON(&req) != nil {
		utils.Error(c, utils.ErrValidationFailed)
		return
	}
	rule, err := h.deps.ConfigService.CreatePolicyRule(c.Request.Context(), h.tenantID(c), req.Name, req.Conditions, req.Actions, req.Priority)
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusCreated, rule)
}

func (h *MailHandler) UpdatePolicyRule(c *gin.Context) {
	var req struct {
		Name      string `json:"name"`
		Priority  *int   `json:"priority"`
		IsEnabled bool   `json:"isEnabled"`
	}
	_ = c.ShouldBindJSON(&req)
	rule, err := h.deps.ConfigService.UpdatePolicyRule(c.Request.Context(), h.tenantID(c), c.Param("ruleId"), req.Name, req.Priority, req.IsEnabled)
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, rule)
}

func (h *MailHandler) DeletePolicyRule(c *gin.Context) {
	if err := h.deps.ConfigService.DeletePolicyRule(c.Request.Context(), h.tenantID(c), c.Param("ruleId")); err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, gin.H{"deleted": true})
}

func (h *MailHandler) ListSystemSieveScripts(c *gin.Context) {
	items, err := h.deps.ConfigService.ListSystemSieveScripts(c.Request.Context(), h.tenantID(c))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, items)
}

func (h *MailHandler) CreateSystemSieveScript(c *gin.Context) {
	var req struct {
		Name       string `json:"name"`
		ScriptBody string `json:"scriptBody"`
	}
	if c.ShouldBindJSON(&req) != nil {
		utils.Error(c, utils.ErrValidationFailed)
		return
	}
	script, err := h.deps.ConfigService.CreateSystemSieveScript(c.Request.Context(), h.tenantID(c), req.Name, req.ScriptBody)
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusCreated, script)
}

func (h *MailHandler) UpdateSystemSieveScript(c *gin.Context) {
	var req struct {
		Name       string `json:"name"`
		ScriptBody string `json:"scriptBody"`
		IsActive   bool   `json:"isActive"`
	}
	_ = c.ShouldBindJSON(&req)
	script, err := h.deps.ConfigService.UpdateSystemSieveScript(c.Request.Context(), h.tenantID(c), c.Param("scriptId"), req.Name, req.ScriptBody, req.IsActive)
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, script)
}

func (h *MailHandler) DeleteSystemSieveScript(c *gin.Context) {
	if err := h.deps.ConfigService.DeleteSystemSieveScript(c.Request.Context(), h.tenantID(c), c.Param("scriptId")); err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, gin.H{"deleted": true})
}

// ──────────────────────────────────────────────────────
// 3.1 Events
// ──────────────────────────────────────────────────────

func (h *MailHandler) setupEvents(r *gin.RouterGroup) {
	events := r.Group("/events")
	{
		events.GET("/mail", h.ListMailEvents)
		events.GET("/auth", h.ListAuthEvents)
		events.GET("/security", h.ListSecurityEvents)
		events.GET("/system", h.ListSystemEvents)
		events.GET("/:eventId", h.GetEvent)
	}
}

func (h *MailHandler) ListMailEvents(c *gin.Context) {
	items, err := h.deps.MonitoringService.ListMailEvents(c.Request.Context(), h.tenantID(c))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, items)
}

func (h *MailHandler) ListAuthEvents(c *gin.Context) {
	items, err := h.deps.MonitoringService.ListAuthEvents(c.Request.Context(), h.tenantID(c))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, items)
}

func (h *MailHandler) ListSecurityEvents(c *gin.Context) {
	items, err := h.deps.MonitoringService.ListSecurityEvents(c.Request.Context(), h.tenantID(c))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, items)
}

func (h *MailHandler) ListSystemEvents(c *gin.Context) {
	items, err := h.deps.MonitoringService.ListSystemEvents(c.Request.Context(), h.tenantID(c))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, items)
}

func (h *MailHandler) GetEvent(c *gin.Context) {
	utils.Success(c, http.StatusOK, gin.H{"eventId": c.Param("eventId")})
}

// ──────────────────────────────────────────────────────
// 3.2 Diagnostics
// ──────────────────────────────────────────────────────

func (h *MailHandler) setupDiagnostics(r *gin.RouterGroup) {
	diag := r.Group("/diagnostics")
	{
		diag.GET("/health", h.GetHealthReport)
		diag.POST("/health/check", h.RunHealthCheck)
		diag.GET("/system", h.GetSystemDiagnostics)
		diag.GET("/queue", h.GetQueueDiagnostics)
		diag.GET("/connections", h.GetConnectionDiagnostics)
		diag.POST("/delivery-test", h.RunDeliveryTest)
		diag.GET("/dns-test", h.RunDnsTest)
		diag.GET("/tls-test", h.RunTlsTest)
	}
}

func (h *MailHandler) GetHealthReport(c *gin.Context)         { utils.Success(c, http.StatusOK, h.deps.MonitoringService.GetHealthReport(c.Request.Context())) }
func (h *MailHandler) RunHealthCheck(c *gin.Context)          { utils.Success(c, http.StatusOK, h.deps.MonitoringService.RunHealthCheck(c.Request.Context())) }
func (h *MailHandler) GetSystemDiagnostics(c *gin.Context)    { utils.Success(c, http.StatusOK, h.deps.MonitoringService.GetSystemDiagnostics(c.Request.Context())) }
func (h *MailHandler) GetConnectionDiagnostics(c *gin.Context) { utils.Success(c, http.StatusOK, h.deps.MonitoringService.GetConnectionDiagnostics(c.Request.Context())) }
func (h *MailHandler) RunDnsTest(c *gin.Context)              { utils.Success(c, http.StatusOK, h.deps.MonitoringService.RunDnsTest(c.Request.Context(), c.Query("domain"))) }
func (h *MailHandler) RunTlsTest(c *gin.Context)              { utils.Success(c, http.StatusOK, h.deps.MonitoringService.RunTlsTest(c.Request.Context(), c.Query("host"))) }

func (h *MailHandler) GetQueueDiagnostics(c *gin.Context) {
	result, err := h.deps.MonitoringService.GetQueueDiagnostics(c.Request.Context(), h.tenantID(c))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, result)
}

func (h *MailHandler) RunDeliveryTest(c *gin.Context) {
	var req struct {
		From string `json:"from"`
		To   string `json:"to"`
	}
	_ = c.ShouldBindJSON(&req)
	utils.Success(c, http.StatusOK, h.deps.MonitoringService.RunDeliveryTest(c.Request.Context(), req.From, req.To))
}

// ──────────────────────────────────────────────────────
// 3.3 Metrics
// ──────────────────────────────────────────────────────

func (h *MailHandler) setupMetrics(r *gin.RouterGroup) {
	metrics := r.Group("/metrics")
	{
		metrics.GET("/imap", h.GetImapMetrics)
		metrics.GET("/jmap", h.GetJmapMetrics)
		metrics.GET("/smtp", h.GetSmtpMetrics)
		metrics.GET("/storage", h.GetStorageMetrics)
		metrics.GET("/system", h.GetSystemMetrics)
		metrics.GET("/history", h.GetMetricsHistory)
		metrics.GET("/domains", h.GetDomainMetricsMon)
	}
}

func (h *MailHandler) GetImapMetrics(c *gin.Context)      { utils.Success(c, http.StatusOK, gin.H{"protocol": "imap"}) }
func (h *MailHandler) GetJmapMetrics(c *gin.Context)      { utils.Success(c, http.StatusOK, gin.H{"protocol": "jmap"}) }
func (h *MailHandler) GetSmtpMetrics(c *gin.Context)      { utils.Success(c, http.StatusOK, gin.H{"protocol": "smtp"}) }
func (h *MailHandler) GetStorageMetrics(c *gin.Context)   { utils.Success(c, http.StatusOK, gin.H{"storage": true}) }

func (h *MailHandler) GetSystemMetrics(c *gin.Context) {
	m, err := h.deps.MonitoringService.GetLatestMetrics(c.Request.Context())
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, m)
}

func (h *MailHandler) GetMetricsHistory(c *gin.Context) {
	items, err := h.deps.MonitoringService.GetMetricsHistory(c.Request.Context())
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, items)
}

func (h *MailHandler) GetDomainMetricsMon(c *gin.Context) {
	utils.Success(c, http.StatusOK, []any{})
}

// ──────────────────────────────────────────────────────
// 3.4 Logs
// ──────────────────────────────────────────────────────

func (h *MailHandler) setupLogs(r *gin.RouterGroup) {
	logs := r.Group("/logs")
	{
		logs.GET("/server", h.ListServerLogs)
		logs.GET("/security", h.ListSecurityLogs)
		logs.GET("/smtp", h.ListSmtpLogs)
		logs.GET("/auth", h.ListAuthLogs)
		logs.GET("/audit", h.ListAuditLogs)
		logs.GET("/search", h.SearchLogs)
		logs.GET("/config", h.GetLogConfig)
		logs.PATCH("/config", h.UpdateLogConfig)
	}
}

func (h *MailHandler) ListServerLogs(c *gin.Context) {
	items, err := h.deps.MonitoringService.ListServerLogs(c.Request.Context(), h.tenantID(c))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, items)
}

func (h *MailHandler) ListSecurityLogs(c *gin.Context) {
	items, err := h.deps.MonitoringService.ListSecurityLogs(c.Request.Context(), h.tenantID(c))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, items)
}

func (h *MailHandler) ListSmtpLogs(c *gin.Context) {
	items, err := h.deps.MonitoringService.ListSmtpLogs(c.Request.Context(), h.tenantID(c))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, items)
}

func (h *MailHandler) ListAuthLogs(c *gin.Context) {
	items, err := h.deps.MonitoringService.ListAuthLogs(c.Request.Context(), h.tenantID(c))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, items)
}

func (h *MailHandler) ListAuditLogs(c *gin.Context) {
	items, err := h.deps.MonitoringService.ListAuditLogs(c.Request.Context(), h.tenantID(c))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, items)
}

func (h *MailHandler) SearchLogs(c *gin.Context) {
	query := c.Query("q")
	items, err := h.deps.MonitoringService.SearchLogs(c.Request.Context(), h.tenantID(c), query)
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, items)
}

func (h *MailHandler) GetLogConfig(c *gin.Context)        { utils.Success(c, http.StatusOK, h.deps.MonitoringService.GetLogConfig(c.Request.Context())) }
func (h *MailHandler) UpdateLogConfig(c *gin.Context)     { utils.Success(c, http.StatusOK, h.deps.MonitoringService.UpdateLogConfig(c.Request.Context(), nil)) }

// ──────────────────────────────────────────────────────
// 3.5 Reports
// ──────────────────────────────────────────────────────

func (h *MailHandler) setupReports(r *gin.RouterGroup) {
	reports := r.Group("/reports")
	{
		reports.GET("/dmarc", h.ListDmarcReports)
		reports.GET("/dmarc/:reportId", h.GetDmarcReport)
		reports.GET("/tls", h.ListTlsReports)
		reports.GET("/tls/:reportId", h.GetTlsReport)
		reports.GET("/arf", h.ListArfReports)
		reports.GET("/arf/:reportId", h.GetArfReport)
		reports.GET("/summary", h.GetReportSummary)
	}
}

func (h *MailHandler) ListDmarcReports(c *gin.Context) {
	items, err := h.deps.ReportService.ListDmarcReports(c.Request.Context(), h.tenantID(c))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, items)
}

func (h *MailHandler) GetDmarcReport(c *gin.Context) {
	report, err := h.deps.ReportService.GetDmarcReport(c.Request.Context(), h.tenantID(c), c.Param("reportId"))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, report)
}

func (h *MailHandler) ListTlsReports(c *gin.Context) {
	items, err := h.deps.ReportService.ListTlsReports(c.Request.Context(), h.tenantID(c))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, items)
}

func (h *MailHandler) GetTlsReport(c *gin.Context) {
	report, err := h.deps.ReportService.GetTlsReport(c.Request.Context(), h.tenantID(c), c.Param("reportId"))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, report)
}

func (h *MailHandler) ListArfReports(c *gin.Context) {
	items, err := h.deps.ReportService.ListArfReports(c.Request.Context(), h.tenantID(c))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, items)
}

func (h *MailHandler) GetArfReport(c *gin.Context) {
	report, err := h.deps.ReportService.GetArfReport(c.Request.Context(), h.tenantID(c), c.Param("reportId"))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, report)
}

func (h *MailHandler) GetReportSummary(c *gin.Context) {
	utils.Success(c, http.StatusOK, h.deps.ReportService.GetReportSummary(c.Request.Context(), h.tenantID(c)))
}


