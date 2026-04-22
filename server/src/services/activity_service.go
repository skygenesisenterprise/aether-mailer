package services

import (
	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
	"gorm.io/gorm"
)

type ActivityService struct {
	DB *gorm.DB
}

func NewActivityService(db *gorm.DB) *ActivityService {
	return &ActivityService{DB: db}
}

func (s *ActivityService) CreateActivity(activity *models.ActivityOverview) error {
	return s.DB.Create(activity).Error
}

func (s *ActivityService) GetActivity(date string) (*models.ActivityOverview, error) {
	var activity models.ActivityOverview
	if err := s.DB.Where("date = ?", date).First(&activity).Error; err != nil {
		return nil, err
	}
	return &activity, nil
}

func (s *ActivityService) ListActivities(limit int) ([]models.ActivityOverview, error) {
	var activities []models.ActivityOverview
	if err := s.DB.Limit(limit).Order("date DESC").Find(&activities).Error; err != nil {
		return nil, err
	}
	return activities, nil
}

func (s *ActivityService) UpdateActivity(activity *models.ActivityOverview) error {
	return s.DB.Save(activity).Error
}

func (s *ActivityService) CreateDAU(dau *models.DailyActiveUsers) error {
	return s.DB.Create(dau).Error
}

func (s *ActivityService) GetDAU(date string) (*models.DailyActiveUsers, error) {
	var dau models.DailyActiveUsers
	if err := s.DB.Where("date = ?", date).First(&dau).Error; err != nil {
		return nil, err
	}
	return &dau, nil
}

func (s *ActivityService) ListDAU(limit int) ([]models.DailyActiveUsers, error) {
	var dauList []models.DailyActiveUsers
	if err := s.DB.Limit(limit).Order("date DESC").Find(&dauList).Error; err != nil {
		return nil, err
	}
	return dauList, nil
}

func (s *ActivityService) CreateRetention(retention *models.UserRetention) error {
	return s.DB.Create(retention).Error
}

func (s *ActivityService) GetRetention(cohortMonth string, period int) (*models.UserRetention, error) {
	var retention models.UserRetention
	if err := s.DB.Where("cohort_month = ? AND period = ?", cohortMonth, period).First(&retention).Error; err != nil {
		return nil, err
	}
	return &retention, nil
}

func (s *ActivityService) ListRetentions() ([]models.UserRetention, error) {
	var retentions []models.UserRetention
	if err := s.DB.Find(&retentions).Error; err != nil {
		return nil, err
	}
	return retentions, nil
}

func (s *ActivityService) CreateSignup(signup *models.SignupData) error {
	return s.DB.Create(signup).Error
}

func (s *ActivityService) GetSignup(date string) (*models.SignupData, error) {
	var signup models.SignupData
	if err := s.DB.Where("date = ?", date).First(&signup).Error; err != nil {
		return nil, err
	}
	return &signup, nil
}

func (s *ActivityService) ListSignups(limit int) ([]models.SignupData, error) {
	var signups []models.SignupData
	if err := s.DB.Limit(limit).Order("date DESC").Find(&signups).Error; err != nil {
		return nil, err
	}
	return signups, nil
}

func (s *ActivityService) GetFailedLogins() ([]map[string]interface{}, error) {
	return []map[string]interface{}{}, nil
}

func (s *ActivityService) GetUserStats() (map[string]interface{}, error) {
	var count int64
	s.DB.Model(&models.User{}).Count(&count)
	return map[string]interface{}{
		"total_users": count,
		"active":      count,
	}, nil
}

func (s *ActivityService) GetSessionStats() (map[string]interface{}, error) {
	return map[string]interface{}{
		"total_sessions": 0,
		"active":         0,
	}, nil
}

func (s *ActivityService) GetLoginStats() (map[string]interface{}, error) {
	return map[string]interface{}{
		"total_logins": 0,
		"failed":       0,
	}, nil
}
