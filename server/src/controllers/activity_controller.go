package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/skygenesisenterprise/aether-mailer/server/src/services"
)

func GetActivityStats(c *gin.Context) {
	date := c.Query("date")
	activityService := services.NewActivityService(services.DB)

	activity, err := activityService.GetActivity(date)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Activity not found"})
		return
	}

	c.JSON(http.StatusOK, activity)
}

func ListActivities(c *gin.Context) {
	activityService := services.NewActivityService(services.DB)

	activities, err := activityService.ListActivities(30)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, activities)
}

func ListDAU(c *gin.Context) {
	activityService := services.NewActivityService(services.DB)

	dauList, err := activityService.ListDAU(30)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, dauList)
}

func ListRetentions(c *gin.Context) {
	activityService := services.NewActivityService(services.DB)

	retentions, err := activityService.ListRetentions()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, retentions)
}

func ListSignups(c *gin.Context) {
	activityService := services.NewActivityService(services.DB)

	signups, err := activityService.ListSignups(30)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, signups)
}

func GetActivityOverview(c *gin.Context) {
	GetActivityStats(c)
}

func GetDailyActiveUsers(c *gin.Context) {
	ListDAU(c)
}

func GetUserRetention(c *gin.Context) {
	ListRetentions(c)
}

func GetSignupData(c *gin.Context) {
	ListSignups(c)
}

func GetFailedLoginData(c *gin.Context) {
	activityService := services.NewActivityService(services.DB)
	data, err := activityService.GetFailedLogins()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, data)
}

func GetDashboardStats(c *gin.Context) {
	GetActivityStats(c)
}

func GetUserStats(c *gin.Context) {
	activityService := services.NewActivityService(services.DB)
	stats, err := activityService.GetUserStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}

func GetSessionStats(c *gin.Context) {
	activityService := services.NewActivityService(services.DB)
	stats, err := activityService.GetSessionStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}

func GetLoginStats(c *gin.Context) {
	activityService := services.NewActivityService(services.DB)
	stats, err := activityService.GetLoginStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}
