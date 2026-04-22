package services

import (
	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
	"gorm.io/gorm"
)

type LogService struct {
	DB *gorm.DB
}

func NewLogService(db *gorm.DB) *LogService {
	return &LogService{DB: db}
}

func (s *LogService) CreateLog(log *models.Log) error {
	return s.DB.Create(log).Error
}

func (s *LogService) GetLog(id string) (*models.Log, error) {
	var log models.Log
	if err := s.DB.First(&log, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &log, nil
}

func (s *LogService) ListLogs(limit, offset int) ([]models.Log, error) {
	var logs []models.Log
	if err := s.DB.Limit(limit).Offset(offset).Order("created_at DESC").Find(&logs).Error; err != nil {
		return nil, err
	}
	return logs, nil
}

func (s *LogService) GetLogsByLevel(level models.LogLevel) ([]models.Log, error) {
	var logs []models.Log
	if err := s.DB.Where("level = ?", level).Order("created_at DESC").Find(&logs).Error; err != nil {
		return nil, err
	}
	return logs, nil
}

func (s *LogService) GetLogsByUser(userID string) ([]models.Log, error) {
	var logs []models.Log
	if err := s.DB.Where("user_id = ?", userID).Order("created_at DESC").Find(&logs).Error; err != nil {
		return nil, err
	}
	return logs, nil
}

func (s *LogService) CreateLogStats(stats *models.LogStats) error {
	return s.DB.Create(stats).Error
}

func (s *LogService) GetLogStats(date string) (*models.LogStats, error) {
	var stats models.LogStats
	if err := s.DB.Where("date = ?", date).First(&stats).Error; err != nil {
		return nil, err
	}
	return &stats, nil
}

func (s *LogService) ListLogStats(limit int) ([]models.LogStats, error) {
	var stats []models.LogStats
	if err := s.DB.Limit(limit).Order("date DESC").Find(&stats).Error; err != nil {
		return nil, err
	}
	return stats, nil
}

func (s *LogService) CreateMonitoringStatus(status *models.MonitoringStatus) error {
	return s.DB.Create(status).Error
}

func (s *LogService) GetMonitoringStatus(service string) (*models.MonitoringStatus, error) {
	var status models.MonitoringStatus
	if err := s.DB.Where("service = ?", service).First(&status).Error; err != nil {
		return nil, err
	}
	return &status, nil
}

func (s *LogService) ListMonitoringStatuses() ([]models.MonitoringStatus, error) {
	var statuses []models.MonitoringStatus
	if err := s.DB.Find(&statuses).Error; err != nil {
		return nil, err
	}
	return statuses, nil
}

func (s *LogService) UpdateMonitoringStatus(status *models.MonitoringStatus) error {
	return s.DB.Save(status).Error
}
