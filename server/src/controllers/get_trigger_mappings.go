package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/skygenesisenterprise/aether-mailer/server/src/services"
)

func GetTriggerMappings(c *gin.Context) {
	actionService := services.NewActionService(services.DB)
	triggers, err := actionService.ListActionTriggers()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	mappings := make([]map[string]interface{}, 0)
	for _, trigger := range triggers {
		actions, _ := actionService.ListActionsForTrigger(trigger.ID)
		mappings = append(mappings, map[string]interface{}{
			"trigger": trigger,
			"actions": actions,
		})
	}

	c.JSON(http.StatusOK, mappings)
}