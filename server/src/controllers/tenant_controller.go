package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
	"github.com/skygenesisenterprise/aether-mailer/server/src/services"
)

func CreateTenant(c *gin.Context) {
	var tenant models.Tenant
	if err := c.ShouldBindJSON(&tenant); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	tenantService := services.NewTenantService(services.DB)
	if err := tenantService.CreateTenant(&tenant); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, tenant)
}

func GetTenant(c *gin.Context) {
	id := c.Param("id")
	tenantService := services.NewTenantService(services.DB)

	tenant, err := tenantService.GetTenant(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Tenant not found"})
		return
	}

	c.JSON(http.StatusOK, tenant)
}

func ListTenants(c *gin.Context) {
	tenantService := services.NewTenantService(services.DB)

	tenants, err := tenantService.ListTenants()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, tenants)
}

func UpdateTenant(c *gin.Context) {
	id := c.Param("id")
	var tenant models.Tenant
	if err := c.ShouldBindJSON(&tenant); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	tenant.ID = id
	tenantService := services.NewTenantService(services.DB)

	if err := tenantService.UpdateTenant(&tenant); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, tenant)
}

func DeleteTenant(c *gin.Context) {
	id := c.Param("id")
	tenantService := services.NewTenantService(services.DB)

	if err := tenantService.DeleteTenant(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}

func GetTenantUsage(c *gin.Context) {
	tenantID := c.Param("id")
	tenantService := services.NewTenantService(services.DB)

	usage, err := tenantService.GetTenantUsage(tenantID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Usage not found"})
		return
	}

	c.JSON(http.StatusOK, usage)
}

func GetBillingInfo(c *gin.Context) {
	tenantID := c.Param("id")
	tenantService := services.NewTenantService(services.DB)

	billing, err := tenantService.GetBillingInfo(tenantID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Billing info not found"})
		return
	}

	c.JSON(http.StatusOK, billing)
}

func UpdateBillingInfo(c *gin.Context) {
	tenantID := c.Param("id")
	var billing models.BillingInfo
	if err := c.ShouldBindJSON(&billing); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	billing.TenantID = tenantID
	tenantService := services.NewTenantService(services.DB)

	if err := tenantService.UpdateBillingInfo(&billing); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, billing)
}

func GetTenantInfo(c *gin.Context) {
	tenantID := c.Query("tenant_id")
	tenantService := services.NewTenantService(services.DB)
	tenant, err := tenantService.GetTenant(tenantID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Tenant not found"})
		return
	}

	c.JSON(http.StatusOK, tenant)
}

func UpdateTenantSettings(c *gin.Context) {
	UpdateTenant(c)
}
