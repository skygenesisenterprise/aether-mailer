package services

import (
	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
	"gorm.io/gorm"
)

type QueueService struct {
	DB *gorm.DB
}

func NewQueueService(db *gorm.DB) *QueueService {
	return &QueueService{DB: db}
}

func (s *QueueService) GetQueuedMessages() ([]models.MessageQueue, error) {
	var messages []models.MessageQueue
	if err := s.DB.Where("status = ?", "pending").Find(&messages).Error; err != nil {
		return nil, err
	}
	return messages, nil
}

func (s *QueueService) GetMessageQueue(id string) (*models.MessageQueue, error) {
	var message models.MessageQueue
	if err := s.DB.First(&message, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &message, nil
}

func (s *QueueService) CreateMessageQueue(queue *models.MessageQueue) error {
	return s.DB.Create(queue).Error
}

func (s *QueueService) UpdateMessageQueue(queue *models.MessageQueue) error {
	return s.DB.Save(queue).Error
}

func (s *QueueService) DeleteMessageQueue(id string) error {
	return s.DB.Delete(&models.MessageQueue{}, "id = ?", id).Error
}

func (s *QueueService) GetQueueReports() ([]models.ReportQueue, error) {
	var reports []models.ReportQueue
	if err := s.DB.Where("status = ?", "pending").Find(&reports).Error; err != nil {
		return nil, err
	}
	return reports, nil
}

func (s *QueueService) GetReportQueue(id string) (*models.ReportQueue, error) {
	var report models.ReportQueue
	if err := s.DB.First(&report, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &report, nil
}

func (s *QueueService) CreateReportQueue(queue *models.ReportQueue) error {
	return s.DB.Create(queue).Error
}

func (s *QueueService) UpdateReportQueue(queue *models.ReportQueue) error {
	return s.DB.Save(queue).Error
}

func (s *QueueService) DeleteReportQueue(id string) error {
	return s.DB.Delete(&models.ReportQueue{}, "id = ?", id).Error
}