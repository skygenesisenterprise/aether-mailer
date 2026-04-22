package services

import (
	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
	"gorm.io/gorm"
)

type AgentService struct {
	DB *gorm.DB
}

func NewAgentService(db *gorm.DB) *AgentService {
	return &AgentService{DB: db}
}

func (s *AgentService) CreateAgent(agent *models.Agent) error {
	return s.DB.Create(agent).Error
}

func (s *AgentService) GetAgent(id string) (*models.Agent, error) {
	var agent models.Agent
	if err := s.DB.First(&agent, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &agent, nil
}

func (s *AgentService) GetAgentByName(name string) (*models.Agent, error) {
	var agent models.Agent
	if err := s.DB.Where("name = ?", name).First(&agent).Error; err != nil {
		return nil, err
	}
	return &agent, nil
}

func (s *AgentService) ListAgents() ([]models.Agent, error) {
	var agents []models.Agent
	if err := s.DB.Find(&agents).Error; err != nil {
		return nil, err
	}
	return agents, nil
}

func (s *AgentService) ListAgentsByTenant(tenantID string) ([]models.Agent, error) {
	var agents []models.Agent
	if err := s.DB.Where("tenant_id = ?", tenantID).Find(&agents).Error; err != nil {
		return nil, err
	}
	return agents, nil
}

func (s *AgentService) UpdateAgent(agent *models.Agent) error {
	return s.DB.Save(agent).Error
}

func (s *AgentService) DeleteAgent(id string) error {
	return s.DB.Delete(&models.Agent{}, "id = ?", id).Error
}

func (s *AgentService) GetAgentStatus(id string) (map[string]interface{}, error) {
	agent, err := s.GetAgent(id)
	if err != nil {
		return nil, err
	}
	return map[string]interface{}{
		"agent_id": agent.ID,
		"status":   "running",
		"uptime":   "0s",
	}, nil
}

func (s *AgentService) RestartAgent(id string) error {
	return nil
}
