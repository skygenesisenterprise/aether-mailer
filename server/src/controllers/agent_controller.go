package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
	"github.com/skygenesisenterprise/aether-mailer/server/src/services"
)

func CreateAgent(c *gin.Context) {
	var agent models.Agent
	if err := c.ShouldBindJSON(&agent); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	agentService := services.NewAgentService(services.DB)
	if err := agentService.CreateAgent(&agent); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, agent)
}

func GetAgent(c *gin.Context) {
	id := c.Param("id")
	agentService := services.NewAgentService(services.DB)

	agent, err := agentService.GetAgent(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Agent not found"})
		return
	}

	c.JSON(http.StatusOK, agent)
}

func ListAgents(c *gin.Context) {
	agentService := services.NewAgentService(services.DB)

	agents, err := agentService.ListAgents()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, agents)
}

func UpdateAgent(c *gin.Context) {
	id := c.Param("id")
	var agent models.Agent
	if err := c.ShouldBindJSON(&agent); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	agent.ID = id
	agentService := services.NewAgentService(services.DB)

	if err := agentService.UpdateAgent(&agent); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, agent)
}

func DeleteAgent(c *gin.Context) {
	id := c.Param("id")
	agentService := services.NewAgentService(services.DB)

	if err := agentService.DeleteAgent(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}

func RegisterAgent(c *gin.Context) {
	CreateAgent(c)
}

func GetAgentDetails(c *gin.Context) {
	GetAgent(c)
}

func GetAgentStatus(c *gin.Context) {
	id := c.Param("id")
	agentService := services.NewAgentService(services.DB)
	status, err := agentService.GetAgentStatus(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Agent status not found"})
		return
	}

	c.JSON(http.StatusOK, status)
}

func RestartAgent(c *gin.Context) {
	id := c.Param("id")
	agentService := services.NewAgentService(services.DB)
	if err := agentService.RestartAgent(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Agent restarted"})
}
