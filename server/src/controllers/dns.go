package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
	"github.com/skygenesisenterprise/aether-mailer/server/src/services"
)

// DNSController represents DNS controller
type DNSController struct {
	dnsService *services.DNSService
}

// NewDNSController creates a new DNS controller
func NewDNSController(db *gorm.DB) *DNSController {
	return &DNSController{
		dnsService: services.NewDNSService(db),
	}
}

// CreateDNSZone creates a new DNS zone
func (c *DNSController) CreateDNSZone(ctx *gin.Context) {
	var req struct {
		DomainID   uint   `json:"domainId" binding:"required"`
		Name       string `json:"name" binding:"required"`
		PrimaryNS  string `json:"primaryNS" binding:"required"`
		AdminEmail string `json:"adminEmail" binding:"required"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	zone, err := c.dnsService.CreateDNSZone(ctx.Request.Context(), req.DomainID, req.Name, req.PrimaryNS, req.AdminEmail)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, zone)
}

// GetDNSZone gets a DNS zone
func (c *DNSController) GetDNSZone(ctx *gin.Context) {
	domainID, err := strconv.ParseUint(ctx.Param("domainId"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid domain ID"})
		return
	}

	zone, err := c.dnsService.GetDNSZone(ctx.Request.Context(), uint(domainID))
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "DNS zone not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, zone)
}

// CreateDNSRecord creates a new DNS record
func (c *DNSController) CreateDNSRecord(ctx *gin.Context) {
	var req models.DNSRecord

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate record
	if err := c.dnsService.ValidateDNSRecord(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := c.dnsService.CreateDNSRecord(ctx.Request.Context(), &req); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, req)
}

// GetDNSRecords gets DNS records
func (c *DNSController) GetDNSRecords(ctx *gin.Context) {
	domainID, err := strconv.ParseUint(ctx.Param("domainId"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid domain ID"})
		return
	}

	var recordType *models.DNSRecordType
	if typeStr := ctx.Query("type"); typeStr != "" {
		rt := models.DNSRecordType(typeStr)
		recordType = &rt
	}

	records, err := c.dnsService.GetDNSRecords(ctx.Request.Context(), uint(domainID), recordType)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, records)
}

// UpdateDNSRecord updates a DNS record
func (c *DNSController) UpdateDNSRecord(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid record ID"})
		return
	}

	var updates map[string]interface{}
	if err := ctx.ShouldBindJSON(&updates); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := c.dnsService.UpdateDNSRecord(ctx.Request.Context(), uint(id), updates); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "DNS record updated successfully"})
}

// DeleteDNSRecord deletes a DNS record
func (c *DNSController) DeleteDNSRecord(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid record ID"})
		return
	}

	if err := c.dnsService.DeleteDNSRecord(ctx.Request.Context(), uint(id)); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "DNS record deleted successfully"})
}

// CreateMXRecord creates an MX record
func (c *DNSController) CreateMXRecord(ctx *gin.Context) {
	var req struct {
		DomainID uint   `json:"domainId" binding:"required"`
		Name     string `json:"name" binding:"required"`
		Target   string `json:"target" binding:"required"`
		Priority int    `json:"priority" binding:"required"`
		TTL      int    `json:"ttl"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.TTL == 0 {
		req.TTL = 3600
	}

	if err := c.dnsService.CreateMXRecord(ctx.Request.Context(), req.DomainID, req.Name, req.Target, req.Priority, req.TTL); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{"message": "MX record created successfully"})
}

// CreateTXTRecord creates a TXT record
func (c *DNSController) CreateTXTRecord(ctx *gin.Context) {
	var req struct {
		DomainID uint   `json:"domainId" binding:"required"`
		Name     string `json:"name" binding:"required"`
		Value    string `json:"value" binding:"required"`
		TTL      int    `json:"ttl"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.TTL == 0 {
		req.TTL = 3600
	}

	if err := c.dnsService.CreateTXTRecord(ctx.Request.Context(), req.DomainID, req.Name, req.Value, req.TTL); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{"message": "TXT record created successfully"})
}

// CreateARecord creates an A record
func (c *DNSController) CreateARecord(ctx *gin.Context) {
	var req struct {
		DomainID uint   `json:"domainId" binding:"required"`
		Name     string `json:"name" binding:"required"`
		Value    string `json:"value" binding:"required"`
		TTL      int    `json:"ttl"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.TTL == 0 {
		req.TTL = 3600
	}

	if err := c.dnsService.CreateARecord(ctx.Request.Context(), req.DomainID, req.Name, req.Value, req.TTL); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{"message": "A record created successfully"})
}

// CreateAAAARecord creates an AAAA record
func (c *DNSController) CreateAAAARecord(ctx *gin.Context) {
	var req struct {
		DomainID uint   `json:"domainId" binding:"required"`
		Name     string `json:"name" binding:"required"`
		Value    string `json:"value" binding:"required"`
		TTL      int    `json:"ttl"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.TTL == 0 {
		req.TTL = 3600
	}

	if err := c.dnsService.CreateAAAARecord(ctx.Request.Context(), req.DomainID, req.Name, req.Value, req.TTL); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{"message": "AAAA record created successfully"})
}

// CreateSPFRecord creates an SPF record
func (c *DNSController) CreateSPFRecord(ctx *gin.Context) {
	var req struct {
		DomainID uint   `json:"domainId" binding:"required"`
		SPFValue string `json:"spfValue" binding:"required"`
		TTL      int    `json:"ttl"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.TTL == 0 {
		req.TTL = 3600
	}

	if err := c.dnsService.CreateSPFRecord(ctx.Request.Context(), req.DomainID, req.SPFValue, req.TTL); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{"message": "SPF record created successfully"})
}

// CreateDKIMRecord creates a DKIM record
func (c *DNSController) CreateDKIMRecord(ctx *gin.Context) {
	var req struct {
		DomainID  uint   `json:"domainId" binding:"required"`
		Selector  string `json:"selector" binding:"required"`
		PublicKey string `json:"publicKey" binding:"required"`
		TTL       int    `json:"ttl"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.TTL == 0 {
		req.TTL = 3600
	}

	if err := c.dnsService.CreateDKIMRecord(ctx.Request.Context(), req.DomainID, req.Selector, req.PublicKey, req.TTL); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{"message": "DKIM record created successfully"})
}

// CreateDMARCRecord creates a DMARC record
func (c *DNSController) CreateDMARCRecord(ctx *gin.Context) {
	var req struct {
		DomainID   uint   `json:"domainId" binding:"required"`
		DMARCValue string `json:"dmarcValue" binding:"required"`
		TTL        int    `json:"ttl"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.TTL == 0 {
		req.TTL = 3600
	}

	if err := c.dnsService.CreateDMARCRecord(ctx.Request.Context(), req.DomainID, req.DMARCValue, req.TTL); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{"message": "DMARC record created successfully"})
}

// GenerateDKIMKeyPair generates a DKIM key pair
func (c *DNSController) GenerateDKIMKeyPair(ctx *gin.Context) {
	var req struct {
		Bits int `json:"bits" binding:"required"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	privateKey, publicKey, err := c.dnsService.GenerateDKIMKeyPair(req.Bits)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"privateKey": privateKey,
		"publicKey":  publicKey,
	})
}

// CreateDNSSECKey creates a DNSSEC key
func (c *DNSController) CreateDNSSECKey(ctx *gin.Context) {
	var req struct {
		DomainID  uint                 `json:"domainId" binding:"required"`
		KeyType   models.DNSSECKeyType `json:"keyType" binding:"required"`
		Flags     int                  `json:"flags" binding:"required"`
		Algorithm int                  `json:"algorithm" binding:"required"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	key, err := c.dnsService.CreateDNSSECKey(ctx.Request.Context(), req.DomainID, req.KeyType, req.Flags, req.Algorithm)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, key)
}

// CheckDNSPropagation checks DNS propagation
func (c *DNSController) CheckDNSPropagation(ctx *gin.Context) {
	var req struct {
		DomainID    uint                 `json:"domainId" binding:"required"`
		RecordType  models.DNSRecordType `json:"recordType" binding:"required"`
		RecordValue string               `json:"recordValue" binding:"required"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	results, err := c.dnsService.CheckDNSPropagation(ctx.Request.Context(), req.DomainID, req.RecordType, req.RecordValue)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, results)
}

// GetDNSQueries gets DNS query logs
func (c *DNSController) GetDNSQueries(ctx *gin.Context) {
	// This would require implementing a method in the service
	// For now, return a placeholder
	ctx.JSON(http.StatusOK, gin.H{"message": "DNS query logs not implemented yet"})
}

// DNS Provider Management

// GetDNSProviders gets all DNS providers
func (c *DNSController) GetDNSProviders(ctx *gin.Context) {
	includeInactive := ctx.DefaultQuery("includeInactive", "false") == "true"

	providers, err := c.dnsService.GetDNSProviders(ctx.Request.Context(), includeInactive)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    providers,
	})
}

// GetDNSProvider gets a specific DNS provider
func (c *DNSController) GetDNSProvider(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid provider ID"})
		return
	}

	provider, err := c.dnsService.GetDNSProvider(ctx.Request.Context(), uint(id))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    provider,
	})
}

// CreateDNSProvider creates a new DNS provider
func (c *DNSController) CreateDNSProvider(ctx *gin.Context) {
	var req struct {
		Name        string `json:"name" binding:"required"`
		DisplayName string `json:"displayName" binding:"required"`
		Type        string `json:"type" binding:"required"`
		Description string `json:"description"`
		APIEndpoint string `json:"apiEndpoint"`
		APIToken    string `json:"apiToken"`
		Secret      string `json:"secret"`
		Config      string `json:"config"`
		IsActive    bool   `json:"isActive"`
		IsDefault   bool   `json:"isDefault"`
		RateLimit   int    `json:"rateLimit"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	provider := &models.DNSProvider{
		Name:        req.Name,
		DisplayName: req.DisplayName,
		Type:        models.DNSProviderType(req.Type),
		Description: req.Description,
		APIEndpoint: req.APIEndpoint,
		APIToken:    req.APIToken,
		Secret:      req.Secret,
		Config:      req.Config,
		IsActive:    req.IsActive,
		IsDefault:   req.IsDefault,
		RateLimit:   req.RateLimit,
	}

	if req.RateLimit == 0 {
		provider.RateLimit = 1000
	}

	if err := c.dnsService.CreateDNSProvider(ctx.Request.Context(), provider); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    provider,
	})
}

// UpdateDNSProvider updates a DNS provider
func (c *DNSController) UpdateDNSProvider(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid provider ID"})
		return
	}

	var updates map[string]interface{}
	if err := ctx.ShouldBindJSON(&updates); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := c.dnsService.UpdateDNSProvider(ctx.Request.Context(), uint(id), updates); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "DNS provider updated successfully"})
}

// DeleteDNSProvider deletes a DNS provider
func (c *DNSController) DeleteDNSProvider(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid provider ID"})
		return
	}

	if err := c.dnsService.DeleteDNSProvider(ctx.Request.Context(), uint(id)); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "DNS provider deleted successfully"})
}

// TestDNSProviderConnection tests connection to a DNS provider
func (c *DNSController) TestDNSProviderConnection(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid provider ID"})
		return
	}

	var req struct {
		Credentials map[string]interface{} `json:"credentials"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := c.dnsService.TestDNSProviderConnection(ctx.Request.Context(), uint(id), req.Credentials); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "DNS provider connection test successful",
	})
}

// GetDNSProviderSettings gets settings for a DNS provider
func (c *DNSController) GetDNSProviderSettings(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid provider ID"})
		return
	}

	settings, err := c.dnsService.GetDNSProviderSettings(ctx.Request.Context(), uint(id))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    settings,
	})
}

// CreateDNSProviderSetting creates a new DNS provider setting
func (c *DNSController) CreateDNSProviderSetting(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid provider ID"})
		return
	}

	var req struct {
		Name         string `json:"name" binding:"required"`
		Type         string `json:"type" binding:"required"`
		Value        string `json:"value" binding:"required"`
		Description  string `json:"description"`
		IsRequired   bool   `json:"isRequired"`
		IsSecret     bool   `json:"isSecret"`
		DefaultValue string `json:"defaultValue"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	setting := &models.DNSProviderSetting{
		ProviderID:   uint(id),
		Name:         req.Name,
		Type:         models.DNSProviderSettingType(req.Type),
		Value:        req.Value,
		Description:  req.Description,
		IsRequired:   req.IsRequired,
		IsSecret:     req.IsSecret,
		DefaultValue: req.DefaultValue,
	}

	if err := c.dnsService.CreateDNSProviderSetting(ctx.Request.Context(), setting); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    setting,
	})
}

// GetDNSProviderCredentials gets credentials for DNS providers
func (c *DNSController) GetDNSProviderCredentials(ctx *gin.Context) {
	userID := ctx.GetString("userID")
	if userID == "" {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "UNAUTHORIZED",
				"message": "User not authenticated",
			},
		})
		return
	}

	providerIDStr := ctx.Query("providerId")
	var providerID uint
	if providerIDStr != "" {
		id, err := strconv.ParseUint(providerIDStr, 10, 32)
		if err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid provider ID"})
			return
		}
		providerID = uint(id)
	}

	// Convert userID string to uint (assuming it's stored as uint in the database)
	userIDUint, err := strconv.ParseUint(userID, 10, 32)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID"})
		return
	}

	credentials, err := c.dnsService.GetDNSProviderCredentials(ctx.Request.Context(), uint(userIDUint), providerID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    credentials,
	})
}

// CreateDNSProviderCredential creates a new DNS provider credential
func (c *DNSController) CreateDNSProviderCredential(ctx *gin.Context) {
	userID := ctx.GetString("userID")
	if userID == "" {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "UNAUTHORIZED",
				"message": "User not authenticated",
			},
		})
		return
	}

	var req struct {
		ProviderID  uint   `json:"providerId" binding:"required"`
		Name        string `json:"name" binding:"required"`
		Credentials string `json:"credentials" binding:"required"`
		IsActive    bool   `json:"isActive"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Convert userID string to uint
	userIDUint, err := strconv.ParseUint(userID, 10, 32)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID"})
		return
	}

	credential := &models.DNSProviderCredential{
		UserID:      uint(userIDUint),
		ProviderID:  req.ProviderID,
		Name:        req.Name,
		Credentials: req.Credentials,
		IsActive:    req.IsActive,
	}

	if err := c.dnsService.CreateDNSProviderCredential(ctx.Request.Context(), credential); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    credential,
	})
}

// SyncDNSZoneWithProvider syncs a DNS zone with its provider
func (c *DNSController) SyncDNSZoneWithProvider(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid zone ID"})
		return
	}

	if err := c.dnsService.SyncDNSZoneWithProvider(ctx.Request.Context(), uint(id)); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "DNS zone synced successfully",
	})
}

// GetDNSProviderCapabilities gets capabilities for a DNS provider
func (c *DNSController) GetDNSProviderCapabilities(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid provider ID"})
		return
	}

	capabilities, err := c.dnsService.GetDNSProviderCapabilities(ctx.Request.Context(), uint(id))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    capabilities,
	})
}

// InitializeDefaultDNSProviders initializes default DNS providers
func (c *DNSController) InitializeDefaultDNSProviders(ctx *gin.Context) {
	if err := c.dnsService.InitializeDefaultDNSProviders(ctx.Request.Context()); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Default DNS providers initialized successfully",
	})
}
