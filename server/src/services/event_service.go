package services

import (
	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
	"gorm.io/gorm"
)

type EventService struct {
	DB *gorm.DB
}

func NewEventService(db *gorm.DB) *EventService {
	return &EventService{DB: db}
}

func (s *EventService) CreateEvent(event *models.Event) error {
	return s.DB.Create(event).Error
}

func (s *EventService) GetEvent(id string) (*models.Event, error) {
	var event models.Event
	if err := s.DB.First(&event, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &event, nil
}

func (s *EventService) ListEvents(limit, offset int) ([]models.Event, error) {
	var events []models.Event
	if err := s.DB.Limit(limit).Offset(offset).Order("created_at DESC").Find(&events).Error; err != nil {
		return nil, err
	}
	return events, nil
}

func (s *EventService) GetEventsByType(eventType string) ([]models.Event, error) {
	var events []models.Event
	if err := s.DB.Where("type = ?", eventType).Order("created_at DESC").Find(&events).Error; err != nil {
		return nil, err
	}
	return events, nil
}

func (s *EventService) GetEventsByUser(userID string) ([]models.Event, error) {
	var events []models.Event
	if err := s.DB.Where("user_id = ?", userID).Order("created_at DESC").Find(&events).Error; err != nil {
		return nil, err
	}
	return events, nil
}

func (s *EventService) GetEventsByTenant(tenantID string) ([]models.Event, error) {
	var events []models.Event
	if err := s.DB.Where("tenant_id = ?", tenantID).Order("created_at DESC").Find(&events).Error; err != nil {
		return nil, err
	}
	return events, nil
}
