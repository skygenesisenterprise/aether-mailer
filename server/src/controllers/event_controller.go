package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
	"github.com/skygenesisenterprise/aether-mailer/server/src/services"
)

func CreateEvent(c *gin.Context) {
	var event models.Event
	if err := c.ShouldBindJSON(&event); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	eventService := services.NewEventService(services.DB)
	if err := eventService.CreateEvent(&event); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, event)
}

func GetEvent(c *gin.Context) {
	id := c.Param("id")
	eventService := services.NewEventService(services.DB)

	event, err := eventService.GetEvent(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Event not found"})
		return
	}

	c.JSON(http.StatusOK, event)
}

func ListEvents(c *gin.Context) {
	eventService := services.NewEventService(services.DB)

	events, err := eventService.ListEvents(100, 0)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, events)
}

func GetEventsByType(c *gin.Context) {
	eventType := c.Query("type")
	eventService := services.NewEventService(services.DB)

	events, err := eventService.GetEventsByType(eventType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, events)
}

func GetEventDetails(c *gin.Context) {
	GetEvent(c)
}
