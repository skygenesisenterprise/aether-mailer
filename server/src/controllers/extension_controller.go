package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
	"github.com/skygenesisenterprise/aether-mailer/server/src/services"
)

func CreateExtension(c *gin.Context) {
	var ext models.Extension
	if err := c.ShouldBindJSON(&ext); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	extService := services.NewExtensionService(services.DB)
	if err := extService.CreateExtension(&ext); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, ext)
}

func GetExtension(c *gin.Context) {
	id := c.Param("id")
	extService := services.NewExtensionService(services.DB)

	ext, err := extService.GetExtension(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Extension not found"})
		return
	}

	c.JSON(http.StatusOK, ext)
}

func ListExtensions(c *gin.Context) {
	extService := services.NewExtensionService(services.DB)

	extensions, err := extService.ListExtensions()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, extensions)
}

func UpdateExtension(c *gin.Context) {
	id := c.Param("id")
	var ext models.Extension
	if err := c.ShouldBindJSON(&ext); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	ext.ID = id
	extService := services.NewExtensionService(services.DB)

	if err := extService.UpdateExtension(&ext); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, ext)
}

func DeleteExtension(c *gin.Context) {
	id := c.Param("id")
	extService := services.NewExtensionService(services.DB)

	if err := extService.DeleteExtension(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}

func InstallExtension(c *gin.Context) {
	var ext models.Extension
	if err := c.ShouldBindJSON(&ext); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	extService := services.NewExtensionService(services.DB)
	if err := extService.InstallExtension(&ext); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, ext)
}

func UninstallExtension(c *gin.Context) {
	id := c.Param("id")
	extService := services.NewExtensionService(services.DB)
	if err := extService.UninstallExtension(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Extension uninstalled"})
}

func GetExtensionConfig(c *gin.Context) {
	id := c.Param("id")
	extService := services.NewExtensionService(services.DB)
	config, err := extService.GetExtensionConfig(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Extension config not found"})
		return
	}

	c.JSON(http.StatusOK, config)
}

func UpdateExtensionConfig(c *gin.Context) {
	id := c.Param("id")
	var config map[string]interface{}
	if err := c.ShouldBindJSON(&config); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	extService := services.NewExtensionService(services.DB)
	if err := extService.UpdateExtensionConfig(id, config); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Config updated"})
}
