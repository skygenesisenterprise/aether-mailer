package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
	"github.com/skygenesisenterprise/aether-mailer/server/src/services"
)

func ListMfaMethods(c *gin.Context) {
	securityService := services.NewSecurityService(services.DB)

	methods, err := securityService.ListMfaMethods()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, methods)
}

func CreateMfaMethod(c *gin.Context) {
	var method models.MfaMethod
	if err := c.ShouldBindJSON(&method); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	securityService := services.NewSecurityService(services.DB)
	if err := securityService.CreateMfaMethod(&method); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, method)
}

func GetMfaMethod(c *gin.Context) {
	id := c.Param("id")
	securityService := services.NewSecurityService(services.DB)

	method, err := securityService.GetMfaMethod(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "MFA method not found"})
		return
	}

	c.JSON(http.StatusOK, method)
}

func UpdateMfaMethod(c *gin.Context) {
	id := c.Param("id")
	var method models.MfaMethod
	if err := c.ShouldBindJSON(&method); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	method.ID = id
	securityService := services.NewSecurityService(services.DB)

	if err := securityService.UpdateMfaMethod(&method); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, method)
}

func DeleteMfaMethod(c *gin.Context) {
	id := c.Param("id")
	securityService := services.NewSecurityService(services.DB)

	if err := securityService.DeleteMfaMethod(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}

func ListMfaPolicies(c *gin.Context) {
	securityService := services.NewSecurityService(services.DB)

	policies, err := securityService.ListMfaPolicies()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, policies)
}

func GetBruteForceConfig(c *gin.Context) {
	securityService := services.NewSecurityService(services.DB)

	config, err := securityService.GetBruteForceConfig()
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Brute force config not found"})
		return
	}

	c.JSON(http.StatusOK, config)
}

func UpdateBruteForceConfig(c *gin.Context) {
	var config models.BruteForceConfig
	if err := c.ShouldBindJSON(&config); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	securityService := services.NewSecurityService(services.DB)
	if err := securityService.UpdateBruteForceConfig(&config); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, config)
}

func EnableDisableMfaMethod(c *gin.Context) {
	id := c.Param("id")
	var method models.MfaMethod
	if err := c.ShouldBindJSON(&method); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	method.ID = id
	securityService := services.NewSecurityService(services.DB)
	if err := securityService.EnableDisableMfaMethod(&method); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, method)
}

func CreateMfaPolicy(c *gin.Context) {
	var policy models.MfaPolicy
	if err := c.ShouldBindJSON(&policy); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	securityService := services.NewSecurityService(services.DB)
	if err := securityService.CreateMfaPolicy(&policy); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, policy)
}

func UpdateMfaPolicy(c *gin.Context) {
	id := c.Param("id")
	var policy models.MfaPolicy
	if err := c.ShouldBindJSON(&policy); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	policy.ID = id
	securityService := services.NewSecurityService(services.DB)
	if err := securityService.UpdateMfaPolicy(&policy); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, policy)
}

func DeleteMfaPolicy(c *gin.Context) {
	id := c.Param("id")
	securityService := services.NewSecurityService(services.DB)
	if err := securityService.DeleteMfaPolicy(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}

func GetMfaStats(c *gin.Context) {
	securityService := services.NewSecurityService(services.DB)
	stats, err := securityService.GetMfaStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}

func GetMfaActivity(c *gin.Context) {
	securityService := services.NewSecurityService(services.DB)
	activity, err := securityService.GetMfaActivity()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, activity)
}

func InitiateMfaChallenge(c *gin.Context) {
	var challenge models.MfaChallenge
	if err := c.ShouldBindJSON(&challenge); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	securityService := services.NewSecurityService(services.DB)
	if err := securityService.InitiateMfaChallenge(&challenge); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, challenge)
}

func VerifyMfaCode(c *gin.Context) {
	var input struct {
		ChallengeID string `json:"challenge_id"`
		Code        string `json:"code"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	securityService := services.NewSecurityService(services.DB)
	result, err := securityService.VerifyMfaCode(input.ChallengeID, input.Code)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

func GetAttackProtectionSettings(c *gin.Context) {
	securityService := services.NewSecurityService(services.DB)
	settings, err := securityService.GetAttackProtectionSettings()
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Attack protection settings not found"})
		return
	}

	c.JSON(http.StatusOK, settings)
}

func UpdateAttackProtectionSettings(c *gin.Context) {
	var settings map[string]interface{}
	if err := c.ShouldBindJSON(&settings); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	securityService := services.NewSecurityService(services.DB)
	if err := securityService.UpdateAttackProtectionSettings(settings); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Settings updated"})
}

func GetBreachedPasswordsConfig(c *gin.Context) {
	securityService := services.NewSecurityService(services.DB)
	config, err := securityService.GetBreachedPasswordsConfig()
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Breached passwords config not found"})
		return
	}

	c.JSON(http.StatusOK, config)
}

func UpdateBreachedPasswordsConfig(c *gin.Context) {
	var config models.BreachedPasswordsConfig
	if err := c.ShouldBindJSON(&config); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	securityService := services.NewSecurityService(services.DB)
	if err := securityService.UpdateBreachedPasswordsConfig(&config); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, config)
}

func GetSecurityAnalytics(c *gin.Context) {
	securityService := services.NewSecurityService(services.DB)
	analytics, err := securityService.GetSecurityAnalytics()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, analytics)
}

func GetThreatData(c *gin.Context) {
	securityService := services.NewSecurityService(services.DB)
	threats, err := securityService.GetThreatData()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, threats)
}

func GetMonitoringStatus(c *gin.Context) {
	securityService := services.NewSecurityService(services.DB)
	status, err := securityService.GetMonitoringStatus()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, status)
}
