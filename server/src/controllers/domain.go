package controllers

import (
	"net/http"
	"time"

	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
	"github.com/skygenesisenterprise/aether-mailer/server/src/services"
	"github.com/gin-gonic/gin"
)

// DomainController handles domain endpoints
type DomainController struct {
	domainService *services.DomainService
}

// NewDomainController creates a new domain controller
func NewDomainController(domainService *services.DomainService) *DomainController {
	return &DomainController{
		domainService: domainService,
	}
}

// GetAllDomains retrieves all domains with filtering and pagination
func (c *DomainController) GetAllDomains(ctx *gin.Context) {
	var params models.DomainQueryParams
	if err := ctx.ShouldBindQuery(&params); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": err.Error(),
			},
		})
		return
	}

	result, err := c.domainService.GetAllDomains(params)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "DOMAINS_ERROR",
				"message": "Failed to retrieve domains",
			},
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success":   true,
		"data":      result,
		"message":   "Domains retrieved successfully",
		"timestamp": time.Now().Format(time.RFC3339),
	})
}

// GetDomainByID retrieves a domain by ID
func (c *DomainController) GetDomainByID(ctx *gin.Context) {
	id := ctx.Param("id")

	domain, err := c.domainService.GetDomainByID(id)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "DOMAIN_ERROR",
				"message": "Failed to retrieve domain",
			},
		})
		return
	}

	if domain == nil {
		ctx.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "DOMAIN_NOT_FOUND",
				"message": "Domain not found",
				"details": gin.H{"id": id},
			},
			"timestamp": time.Now().Format(time.RFC3339),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success":   true,
		"data":      domain,
		"message":   "Domain retrieved successfully",
		"timestamp": time.Now().Format(time.RFC3339),
	})
}

// CreateDomain creates a new domain
func (c *DomainController) CreateDomain(ctx *gin.Context) {
	var req models.CreateDomainRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": err.Error(),
			},
		})
		return
	}

	// Validate required fields
	if req.Name == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "Domain name is required",
				"details": gin.H{"field": "name"},
			},
			"timestamp": time.Now().Format(time.RFC3339),
		})
		return
	}

	// Get user from context (set by auth middleware)
	var createdBy *string
	if user, exists := ctx.Get("user"); exists {
		if userProfile, ok := user.(models.UserProfile); ok {
			createdBy = &userProfile.ID
		}
	}

	domain, err := c.domainService.CreateDomain(req, createdBy)
	if err != nil {
		if err.Error() == "domain with this name already exists" {
			ctx.JSON(http.StatusConflict, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "DOMAIN_EXISTS",
					"message": err.Error(),
					"details": gin.H{"name": req.Name},
				},
				"timestamp": time.Now().Format(time.RFC3339),
			})
			return
		}

		ctx.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "DOMAIN_ERROR",
				"message": "Failed to create domain",
			},
		})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{
		"success":   true,
		"data":      domain,
		"message":   "Domain created successfully",
		"timestamp": time.Now().Format(time.RFC3339),
	})
}

// UpdateDomain updates an existing domain
func (c *DomainController) UpdateDomain(ctx *gin.Context) {
	id := ctx.Param("id")

	var req models.UpdateDomainRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": err.Error(),
			},
		})
		return
	}

	// Get user from context (set by auth middleware)
	var updatedBy *string
	if user, exists := ctx.Get("user"); exists {
		if userProfile, ok := user.(models.UserProfile); ok {
			updatedBy = &userProfile.ID
		}
	}

	domain, err := c.domainService.UpdateDomain(id, req, updatedBy)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "DOMAIN_ERROR",
				"message": "Failed to update domain",
			},
		})
		return
	}

	if domain == nil {
		ctx.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "DOMAIN_NOT_FOUND",
				"message": "Domain not found",
				"details": gin.H{"id": id},
			},
			"timestamp": time.Now().Format(time.RFC3339),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success":   true,
		"data":      domain,
		"message":   "Domain updated successfully",
		"timestamp": time.Now().Format(time.RFC3339),
	})
}

// DeleteDomain deletes a domain
func (c *DomainController) DeleteDomain(ctx *gin.Context) {
	id := ctx.Param("id")

	err := c.domainService.DeleteDomain(id)
	if err != nil {
		if err.Error() == "domain not found" {
			ctx.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "DOMAIN_NOT_FOUND",
					"message": "Domain not found",
					"details": gin.H{"id": id},
				},
				"timestamp": time.Now().Format(time.RFC3339),
			})
			return
		}

		ctx.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "DOMAIN_ERROR",
				"message": "Failed to delete domain",
			},
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success":   true,
		"data":      gin.H{"id": id},
		"message":   "Domain deleted successfully",
		"timestamp": time.Now().Format(time.RFC3339),
	})
}

// VerifyDomain verifies domain ownership
func (c *DomainController) VerifyDomain(ctx *gin.Context) {
	id := ctx.Param("id")

	domain, err := c.domainService.VerifyDomain(id)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "DOMAIN_ERROR",
				"message": "Failed to verify domain",
			},
		})
		return
	}

	if domain == nil {
		ctx.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "DOMAIN_NOT_FOUND",
				"message": "Domain not found",
				"details": gin.H{"id": id},
			},
			"timestamp": time.Now().Format(time.RFC3339),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success":   true,
		"data":      domain,
		"message":   "Domain verified successfully",
		"timestamp": time.Now().Format(time.RFC3339),
	})
}

// GetDomainStats retrieves domain statistics
func (c *DomainController) GetDomainStats(ctx *gin.Context) {
	stats, err := c.domainService.GetDomainStats()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "DOMAIN_ERROR",
				"message": "Failed to retrieve domain statistics",
			},
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success":   true,
		"data":      stats,
		"message":   "Domain statistics retrieved successfully",
		"timestamp": time.Now().Format(time.RFC3339),
	})
}

// CheckDomainAvailability checks if a domain name is available
func (c *DomainController) CheckDomainAvailability(ctx *gin.Context) {
	name := ctx.Query("name")

	if name == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "Domain name is required",
				"details": gin.H{"field": "name"},
			},
			"timestamp": time.Now().Format(time.RFC3339),
		})
		return
	}

	result, err := c.domainService.CheckDomainAvailability(name)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "DOMAIN_ERROR",
				"message": "Failed to check domain availability",
			},
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success":   true,
		"data":      result,
		"message":   "Domain availability checked successfully",
		"timestamp": time.Now().Format(time.RFC3339),
	})
}

// AddDnsRecord adds a DNS record to a domain
func (c *DomainController) AddDnsRecord(ctx *gin.Context) {
	id := ctx.Param("id")

	var req models.DnsRecord
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": err.Error(),
			},
		})
		return
	}

	// Validate required fields
	if req.Type == "" || req.Name == "" || req.Value == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "DNS record type, name, and value are required",
				"details": gin.H{"required": []string{"type", "name", "value"}},
			},
			"timestamp": time.Now().Format(time.RFC3339),
		})
		return
	}

	record, err := c.domainService.AddDnsRecord(id, req)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "DOMAIN_ERROR",
				"message": "Failed to add DNS record",
			},
		})
		return
	}

	if record == nil {
		ctx.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "DOMAIN_NOT_FOUND",
				"message": "Domain not found",
				"details": gin.H{"id": id},
			},
			"timestamp": time.Now().Format(time.RFC3339),
		})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{
		"success":   true,
		"data":      record,
		"message":   "DNS record added successfully",
		"timestamp": time.Now().Format(time.RFC3339),
	})
}

// UpdateMailServerConfig updates the mail server configuration for a domain
func (c *DomainController) UpdateMailServerConfig(ctx *gin.Context) {
	id := ctx.Param("id")

	var req models.UpdateMailServerConfig
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": err.Error(),
			},
		})
		return
	}

	config, err := c.domainService.UpdateMailServerConfig(id, req)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "DOMAIN_ERROR",
				"message": "Failed to update mail server configuration",
			},
		})
		return
	}

	if config == nil {
		ctx.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "DOMAIN_NOT_FOUND",
				"message": "Domain not found",
				"details": gin.H{"id": id},
			},
			"timestamp": time.Now().Format(time.RFC3339),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success":   true,
		"data":      config,
		"message":   "Mail server configuration updated successfully",
		"timestamp": time.Now().Format(time.RFC3339),
	})
}
