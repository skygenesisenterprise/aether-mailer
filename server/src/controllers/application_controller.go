package controllers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
	"github.com/skygenesisenterprise/aether-mailer/server/src/services"
)

func CreateApplication(c *gin.Context) {
	var app models.Application
	if err := c.ShouldBindJSON(&app); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	appService := services.NewApplicationService(services.DB)
	if err := appService.Create(&app); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, app)
}

func GetApplication(c *gin.Context) {
	id := c.Param("id")
	appService := services.NewApplicationService(services.DB)

	app, err := appService.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Application not found"})
		return
	}

	c.JSON(http.StatusOK, app)
}

func ListApplications(c *gin.Context) {
	appService := services.NewApplicationService(services.DB)

	apps, _, err := appService.List(1, 100)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, apps)
}

func UpdateApplication(c *gin.Context) {
	id := c.Param("id")
	var app models.Application
	if err := c.ShouldBindJSON(&app); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	appService := services.NewApplicationService(services.DB)

	if err := appService.Update(id, &app); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, app)
}

func DeleteApplication(c *gin.Context) {
	id := c.Param("id")
	appService := services.NewApplicationService(services.DB)

	if err := appService.Delete(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}

func GetApplicationCredentials(c *gin.Context) {
	id := c.Param("id")
	appService := services.NewApplicationService(services.DB)

	app, err := appService.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Application not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"clientId":     app.ClientID,
		"clientSecret": app.ClientSecret,
	})
}

func RotateApplicationSecret(c *gin.Context) {
	id := c.Param("id")
	appService := services.NewApplicationService(services.DB)

	newSecret, err := appService.RotateSecret(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"clientSecret": newSecret})
}

func GetApplicationStats(c *gin.Context) {
	id := c.Param("id")
	appService := services.NewApplicationService(services.DB)

	stats, err := appService.GetStats(id, time.Now().AddDate(0, -1, 0), time.Now())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}

func ListApiApplications(c *gin.Context) {
	appService := services.NewApplicationService(services.DB)
	apps, _, err := appService.ListByType(models.ApplicationTypeAPI, 1, 100)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, apps)
}

func ListExternalApplications(c *gin.Context) {
	appService := services.NewApplicationService(services.DB)
	apps, _, err := appService.ListByType(models.ApplicationTypeExternal, 1, 100)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, apps)
}
