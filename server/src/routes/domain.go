package routes

import (
	"net/http"

	"github.com/skygenesisenterprise/server/src/controllers"
	"github.com/skygenesisenterprise/server/src/middleware"
	"github.com/gin-gonic/gin"
)

// DomainRoutes handles domain management routes
type DomainRoutes struct {
	domainController *controllers.DomainController
	authMiddleware   *middleware.AuthMiddleware
	domainMiddleware *middleware.DomainMiddleware
}

// NewDomainRoutes creates new domain routes
func NewDomainRoutes(domainController *controllers.DomainController, authMiddleware *middleware.AuthMiddleware, domainMiddleware *middleware.DomainMiddleware) *DomainRoutes {
	return &DomainRoutes{
		domainController: domainController,
		authMiddleware:   authMiddleware,
		domainMiddleware: domainMiddleware,
	}
}

// SetupRoutes configures domain routes
func (r *DomainRoutes) SetupRoutes(router *gin.RouterGroup) {
	// Apply authentication middleware to all domain routes
	domains := router.Group("/domains")
	domains.Use(r.authMiddleware.AuthenticateToken())
	{
		// GET /api/v1/domains - List all domains with filtering and pagination
		domains.GET("/", r.domainMiddleware.ValidateDomainQueryParams(), r.domainController.GetAllDomains)

		// GET /api/v1/domains/stats - Get domain statistics
		domains.GET("/stats", r.domainController.GetDomainStats)

		// GET /api/v1/domains/check-availability - Check if a domain name is available
		domains.GET("/check-availability", r.domainController.CheckDomainAvailability)

		// GET /api/v1/domains/:id - Get a specific domain by ID
		domains.GET("/:id", r.domainMiddleware.ValidateDomainID(), r.domainController.GetDomainByID)

		// POST /api/v1/domains - Create a new domain
		domains.POST("/", r.domainMiddleware.ValidateCreateDomain(), r.domainController.CreateDomain)

		// PUT /api/v1/domains/:id - Update an existing domain
		domains.PUT("/:id", r.domainMiddleware.ValidateDomainID(), r.domainMiddleware.ValidateUpdateDomain(), r.domainController.UpdateDomain)

		// DELETE /api/v1/domains/:id - Delete a domain
		domains.DELETE("/:id", r.domainMiddleware.ValidateDomainID(), r.domainController.DeleteDomain)

		// POST /api/v1/domains/:id/verify - Verify domain ownership
		domains.POST("/:id/verify", r.domainMiddleware.ValidateDomainID(), r.domainController.VerifyDomain)

		// POST /api/v1/domains/:id/dns-records - Add DNS record to domain
		domains.POST("/:id/dns-records", r.domainMiddleware.ValidateDomainID(), r.domainController.AddDnsRecord)

		// PUT /api/v1/domains/:id/mail-server-config - Update mail server configuration
		domains.PUT("/:id/mail-server-config", r.domainMiddleware.ValidateDomainID(), r.domainController.UpdateMailServerConfig)
	}
}
