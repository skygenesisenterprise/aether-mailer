package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/skygenesisenterprise/aether-mailer/server/src/services"
)

func GetTriggerEvents(c *gin.Context) {
	actionService := services.NewActionService(services.DB)
	triggers, err := actionService.ListActionTriggers()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	events := make([]map[string]interface{}, 0)
	for _, trigger := range triggers {
		events = append(events, map[string]interface{}{
			"id":          trigger.ID,
			"name":        trigger.Name,
			"description": trigger.Description,
			"event_type":  trigger.EventType,
		})
	}

	c.JSON(http.StatusOK, events)
}