package services

import (
	"errors"
	"time"

	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
	"gorm.io/gorm"
)

type ApplicationService struct {
	DB *gorm.DB
}

func NewApplicationService(db *gorm.DB) *ApplicationService {
	return &ApplicationService{DB: db}
}

func (s *ApplicationService) Create(app *models.Application) error {
	app.ID = generateUUID()
	app.ClientID = generateUUID()
	app.CreatedAt = time.Now()
	app.UpdatedAt = time.Now()
	return s.DB.Create(app).Error
}

func (s *ApplicationService) GetByID(id string) (*models.Application, error) {
	var app models.Application
	if err := s.DB.Where("id = ?", id).First(&app).Error; err != nil {
		return nil, err
	}
	return &app, nil
}

func (s *ApplicationService) List(page, limit int) ([]models.Application, int64, error) {
	var apps []models.Application
	var total int64

	s.DB.Model(&models.Application{}).Count(&total)

	offset := (page - 1) * limit
	if err := s.DB.Offset(offset).Limit(limit).Find(&apps).Error; err != nil {
		return nil, 0, err
	}

	return apps, total, nil
}

func (s *ApplicationService) Update(id string, app *models.Application) error {
	app.UpdatedAt = time.Now()
	return s.DB.Model(app).Where("id = ?", id).Updates(app).Error
}

func (s *ApplicationService) Delete(id string) error {
	return s.DB.Where("id = ?", id).Delete(&models.Application{}).Error
}

func (s *ApplicationService) GetByClientID(clientID string) (*models.Application, error) {
	var app models.Application
	if err := s.DB.Where("client_id = ?", clientID).First(&app).Error; err != nil {
		return nil, err
	}
	return &app, nil
}

func (s *ApplicationService) RotateSecret(id string) (string, error) {
	newSecret := generateUUID()
	err := s.DB.Model(&models.Application{}).Where("id = ?", id).Update("client_secret", newSecret).Error
	return newSecret, err
}

func (s *ApplicationService) ListByType(appType models.ApplicationType, page, limit int) ([]models.Application, int64, error) {
	var apps []models.Application
	var total int64

	query := s.DB.Where("type = ?", appType)
	query.Model(&models.Application{}).Count(&total)

	offset := (page - 1) * limit
	if err := query.Offset(offset).Limit(limit).Find(&apps).Error; err != nil {
		return nil, 0, err
	}

	return apps, total, nil
}

func (s *ApplicationService) GetStats(id string, startDate, endDate time.Time) (*models.ApplicationStats, error) {
	var stats models.ApplicationStats
	err := s.DB.Where("application_id = ? AND date >= ? AND date <= ?", id, startDate, endDate).First(&stats).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &stats, err
}

func generateUUID() string {
	return "uuid-placeholder"
}
