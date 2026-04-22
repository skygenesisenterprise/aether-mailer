package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
	"github.com/skygenesisenterprise/aether-mailer/server/src/services"
)

func CreateBranding(c *gin.Context) {
	var branding models.Branding
	if err := c.ShouldBindJSON(&branding); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	brandingService := services.NewBrandingService(services.DB)
	if err := brandingService.CreateBranding(&branding); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, branding)
}

func GetBranding(c *gin.Context) {
	id := c.Param("id")
	brandingService := services.NewBrandingService(services.DB)

	branding, err := brandingService.GetBranding(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Branding not found"})
		return
	}

	c.JSON(http.StatusOK, branding)
}

func UpdateBranding(c *gin.Context) {
	id := c.Param("id")
	var branding models.Branding
	if err := c.ShouldBindJSON(&branding); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	branding.ID = id
	brandingService := services.NewBrandingService(services.DB)

	if err := brandingService.UpdateBranding(&branding); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, branding)
}

func DeleteBranding(c *gin.Context) {
	id := c.Param("id")
	brandingService := services.NewBrandingService(services.DB)

	if err := brandingService.DeleteBranding(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}

func ListCustomDomains(c *gin.Context) {
	brandingService := services.NewBrandingService(services.DB)

	domains, err := brandingService.ListCustomDomains()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, domains)
}

func ListBrandingTemplates(c *gin.Context) {
	brandingService := services.NewBrandingService(services.DB)

	templates, err := brandingService.ListTemplates()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, templates)
}

func GetBrandingSettings(c *gin.Context) {
	brandingService := services.NewBrandingService(services.DB)
	branding, err := brandingService.GetBrandingByTenant(c.Query("tenant_id"))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Branding settings not found"})
		return
	}

	c.JSON(http.StatusOK, branding)
}

func UpdateBrandingSettings(c *gin.Context) {
	var branding models.Branding
	if err := c.ShouldBindJSON(&branding); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	brandingService := services.NewBrandingService(services.DB)
	if err := brandingService.UpdateBranding(&branding); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, branding)
}

func GetUniversalLoginConfig(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		id = "default"
	}
	brandingService := services.NewBrandingService(services.DB)
	config, err := brandingService.GetUniversalLoginConfig(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Universal login config not found"})
		return
	}

	c.JSON(http.StatusOK, config)
}

func UpdateUniversalLogin(c *gin.Context) {
	var config models.UniversalLoginConfig
	if err := c.ShouldBindJSON(&config); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	brandingService := services.NewBrandingService(services.DB)
	if err := brandingService.UpdateUniversalLoginConfig(&config); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, config)
}

func ListLoginPages(c *gin.Context) {
	brandingService := services.NewBrandingService(services.DB)
	pages, err := brandingService.ListUniversalLoginConfigs()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, pages)
}

func CreateLoginPage(c *gin.Context) {
	var page models.LoginPage
	if err := c.ShouldBindJSON(&page); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	brandingService := services.NewBrandingService(services.DB)
	if err := brandingService.CreateLoginPage(&page); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, page)
}

func UpdateLoginPage(c *gin.Context) {
	id := c.Param("id")
	var page models.LoginPage
	if err := c.ShouldBindJSON(&page); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	page.ID = id
	brandingService := services.NewBrandingService(services.DB)
	if err := brandingService.UpdateLoginPage(&page); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, page)
}

func GetCustomLoginSettings(c *gin.Context) {
	brandingService := services.NewBrandingService(services.DB)
	branding, err := brandingService.GetBrandingByTenant(c.Query("tenant_id"))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Custom login settings not found"})
		return
	}

	c.JSON(http.StatusOK, branding)
}

func UpdateCustomLogin(c *gin.Context) {
	var branding models.Branding
	if err := c.ShouldBindJSON(&branding); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	brandingService := services.NewBrandingService(services.DB)
	if err := brandingService.UpdateBranding(&branding); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, branding)
}

func GetTemplateDetails(c *gin.Context) {
	id := c.Param("id")
	brandingService := services.NewBrandingService(services.DB)
	template, err := brandingService.GetTemplate(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Template not found"})
		return
	}

	c.JSON(http.StatusOK, template)
}

func CreateTemplate(c *gin.Context) {
	var template models.BrandingTemplate
	if err := c.ShouldBindJSON(&template); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	brandingService := services.NewBrandingService(services.DB)
	if err := brandingService.CreateTemplate(&template); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, template)
}

func DeleteTemplate(c *gin.Context) {
	id := c.Param("id")
	brandingService := services.NewBrandingService(services.DB)
	if err := brandingService.DeleteTemplate(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}

func CreateCustomDomain(c *gin.Context) {
	var domain models.CustomDomain
	if err := c.ShouldBindJSON(&domain); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	brandingService := services.NewBrandingService(services.DB)
	if err := brandingService.CreateCustomDomain(&domain); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, domain)
}

func GetCustomDomainDetails(c *gin.Context) {
	id := c.Param("id")
	brandingService := services.NewBrandingService(services.DB)
	domain, err := brandingService.GetCustomDomain(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Custom domain not found"})
		return
	}

	c.JSON(http.StatusOK, domain)
}

func DeleteCustomDomain(c *gin.Context) {
	id := c.Param("id")
	brandingService := services.NewBrandingService(services.DB)
	if err := brandingService.DeleteCustomDomain(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}

func VerifyCustomDomain(c *gin.Context) {
	id := c.Param("id")
	var input struct {
		Method string `json:"method"`
		Value  string `json:"value"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	brandingService := services.NewBrandingService(services.DB)
	domain, err := brandingService.GetCustomDomain(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Custom domain not found"})
		return
	}

	domain.Status = "verified"
	if err := brandingService.UpdateCustomDomain(domain); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"verified": true, "domain": domain})
}
