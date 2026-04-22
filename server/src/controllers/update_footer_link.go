package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
	"github.com/skygenesisenterprise/aether-mailer/server/src/services"
)

type UpdateFooterLinkRequest struct {
	Title     string `json:"title"`
	Name      string `json:"name"`
	Href      string `json:"href"`
	Category  string `json:"category"`
	Locale    string `json:"locale"`
	Position  int    `json:"position"`
	IsVisible bool   `json:"isVisible"`
}

func UpdateFooterLink(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Footer link ID is required",
		})
		return
	}

	var req UpdateFooterLinkRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request body",
		})
		return
	}

	var existingLink models.FooterLink
	if err := services.DB.First(&existingLink, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "Footer link not found",
		})
		return
	}

	if req.Title != "" {
		existingLink.Title = req.Title
	}
	if req.Name != "" {
		existingLink.Name = req.Name
	}
	if req.Href != "" {
		existingLink.Href = req.Href
	}
	if req.Category != "" {
		existingLink.Category = req.Category
	}
	if req.Locale != "" {
		existingLink.Locale = req.Locale
	}
	if req.Position != 0 {
		existingLink.Position = req.Position
	}
	if req.IsVisible {
		existingLink.IsVisible = req.IsVisible
	}

	if err := services.DB.Save(&existingLink).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to update footer link: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Footer link updated successfully",
		"link":    existingLink,
	})
}