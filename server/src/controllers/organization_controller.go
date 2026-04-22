package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
	"github.com/skygenesisenterprise/aether-mailer/server/src/services"
)

func CreateOrganization(c *gin.Context) {
	var org models.Organization
	if err := c.ShouldBindJSON(&org); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	orgService := services.NewOrganizationService(services.DB)
	if err := orgService.CreateOrganization(&org); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, org)
}

func GetOrganization(c *gin.Context) {
	id := c.Param("id")
	orgService := services.NewOrganizationService(services.DB)

	org, err := orgService.GetOrganizationByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Organization not found"})
		return
	}

	c.JSON(http.StatusOK, org)
}

func ListOrganizations(c *gin.Context) {
	orgService := services.NewOrganizationService(services.DB)

	orgs, err := orgService.ListOrganizations()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, orgs)
}

func UpdateOrganization(c *gin.Context) {
	id := c.Param("id")
	var org models.Organization
	if err := c.ShouldBindJSON(&org); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	org.ID = id
	orgService := services.NewOrganizationService(services.DB)

	if err := orgService.UpdateOrganization(&org); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, org)
}

func DeleteOrganization(c *gin.Context) {
	id := c.Param("id")
	orgService := services.NewOrganizationService(services.DB)

	if err := orgService.DeleteOrganization(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}

func ListOrganizationMembers(c *gin.Context) {
	orgID := c.Param("id")
	orgService := services.NewOrganizationService(services.DB)

	members, err := orgService.GetMembers(orgID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, members)
}

func AddOrganizationMember(c *gin.Context) {
	orgID := c.Param("id")
	var req struct {
		UserID string `json:"userId" binding:"required"`
		RoleID string `json:"roleId" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	orgService := services.NewOrganizationService(services.DB)
	if err := orgService.AddMember(orgID, req.UserID, req.RoleID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Member added"})
}

func RemoveOrganizationMember(c *gin.Context) {
	orgID := c.Param("id")
	userID := c.Param("userId")

	orgService := services.NewOrganizationService(services.DB)
	if err := orgService.RemoveMember(orgID, userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}

func UpdateOrganizationMember(c *gin.Context) {
	orgID := c.Param("id")
	userID := c.Param("userId")
	var req struct {
		RoleID string `json:"roleId" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	orgService := services.NewOrganizationService(services.DB)
	if err := orgService.UpdateMemberRole(orgID, userID, req.RoleID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Member updated"})
}
