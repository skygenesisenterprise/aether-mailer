package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/skygenesisenterprise/aether-mailer/server/src/services"
)

type SendUserEmailRequest struct {
	Subject string `json:"subject" binding:"required"`
	Body    string `json:"body" binding:"required"`
}

func SendUserEmail(c *gin.Context) {
	userID := c.Param("id")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "User ID is required",
		})
		return
	}

	var req SendUserEmailRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request body: subject and body are required",
		})
		return
	}

	userService := services.NewUserService(services.DB)
	user, err := userService.GetUserByID(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "User not found",
		})
		return
	}

	if user.Email == nil || *user.Email == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "User has no email address",
		})
		return
	}

	emailService := services.NewEmailService(services.DB)
	if err := emailService.SendEmail(*user.Email, req.Subject, req.Body); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to send email: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Email sent successfully",
	})
}