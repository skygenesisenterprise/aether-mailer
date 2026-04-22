package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
	"github.com/skygenesisenterprise/aether-mailer/server/src/services"
)

type CreateFooterLinkRequest struct {
	Title     string `json:"title" binding:"required"`
	Name      string `json:"name"`
	Href      string `json:"href" binding:"required"`
	Category  string `json:"category"`
	Locale    string `json:"locale"`
	Position  int    `json:"position"`
	IsVisible bool   `json:"isVisible"`
}

func CreateFooterLink(c *gin.Context) {
	var req CreateFooterLinkRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request body",
		})
		return
	}

	footerLink := &models.FooterLink{
		Title:     req.Title,
		Name:      req.Name,
		Href:      req.Href,
		Category:  req.Category,
		Locale:    req.Locale,
		Position:  req.Position,
		IsVisible: req.IsVisible,
	}

	if err := services.DB.Create(footerLink).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to create footer link: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Footer link created successfully",
		"link":    footerLink,
	})
}