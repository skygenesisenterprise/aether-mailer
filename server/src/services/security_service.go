package services

import (
	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
	"gorm.io/gorm"
)

type SecurityService struct {
	DB *gorm.DB
}

func NewSecurityService(db *gorm.DB) *SecurityService {
	return &SecurityService{DB: db}
}

func (s *SecurityService) CreateMfaMethod(method *models.MfaMethod) error {
	return s.DB.Create(method).Error
}

func (s *SecurityService) GetMfaMethod(id string) (*models.MfaMethod, error) {
	var method models.MfaMethod
	if err := s.DB.First(&method, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &method, nil
}

func (s *SecurityService) GetMfaMethodByName(name models.MfaMethodType) (*models.MfaMethod, error) {
	var method models.MfaMethod
	if err := s.DB.Where("name = ?", name).First(&method).Error; err != nil {
		return nil, err
	}
	return &method, nil
}

func (s *SecurityService) ListMfaMethods() ([]models.MfaMethod, error) {
	var methods []models.MfaMethod
	if err := s.DB.Find(&methods).Error; err != nil {
		return nil, err
	}
	return methods, nil
}

func (s *SecurityService) UpdateMfaMethod(method *models.MfaMethod) error {
	return s.DB.Save(method).Error
}

func (s *SecurityService) DeleteMfaMethod(id string) error {
	return s.DB.Delete(&models.MfaMethod{}, "id = ?", id).Error
}

func (s *SecurityService) CreateMfaPolicy(policy *models.MfaPolicy) error {
	return s.DB.Create(policy).Error
}

func (s *SecurityService) GetMfaPolicy(id string) (*models.MfaPolicy, error) {
	var policy models.MfaPolicy
	if err := s.DB.First(&policy, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &policy, nil
}

func (s *SecurityService) ListMfaPolicies() ([]models.MfaPolicy, error) {
	var policies []models.MfaPolicy
	if err := s.DB.Find(&policies).Error; err != nil {
		return nil, err
	}
	return policies, nil
}

func (s *SecurityService) UpdateMfaPolicy(policy *models.MfaPolicy) error {
	return s.DB.Save(policy).Error
}

func (s *SecurityService) DeleteMfaPolicy(id string) error {
	return s.DB.Delete(&models.MfaPolicy{}, "id = ?", id).Error
}

func (s *SecurityService) CreateMfaEnrollment(enrollment *models.MfaEnrollment) error {
	return s.DB.Create(enrollment).Error
}

func (s *SecurityService) GetMfaEnrollment(id string) (*models.MfaEnrollment, error) {
	var enrollment models.MfaEnrollment
	if err := s.DB.First(&enrollment, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &enrollment, nil
}

func (s *SecurityService) GetMfaEnrollmentByUser(userID string) ([]models.MfaEnrollment, error) {
	var enrollments []models.MfaEnrollment
	if err := s.DB.Where("user_id = ?", userID).Find(&enrollments).Error; err != nil {
		return nil, err
	}
	return enrollments, nil
}

func (s *SecurityService) UpdateMfaEnrollment(enrollment *models.MfaEnrollment) error {
	return s.DB.Save(enrollment).Error
}

func (s *SecurityService) DeleteMfaEnrollment(id string) error {
	return s.DB.Delete(&models.MfaEnrollment{}, "id = ?", id).Error
}

func (s *SecurityService) CreateMfaChallenge(challenge *models.MfaChallenge) error {
	return s.DB.Create(challenge).Error
}

func (s *SecurityService) GetMfaChallenge(id string) (*models.MfaChallenge, error) {
	var challenge models.MfaChallenge
	if err := s.DB.First(&challenge, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &challenge, nil
}

func (s *SecurityService) GetValidMfaChallenge(userID string, method models.MfaMethodType) (*models.MfaChallenge, error) {
	var challenge models.MfaChallenge
	if err := s.DB.Where("user_id = ? AND method = ? AND is_verified = false", userID, method).
		Order("created_at DESC").First(&challenge).Error; err != nil {
		return nil, err
	}
	return &challenge, nil
}

func (s *SecurityService) UpdateMfaChallenge(challenge *models.MfaChallenge) error {
	return s.DB.Save(challenge).Error
}

func (s *SecurityService) DeleteMfaChallenge(id string) error {
	return s.DB.Delete(&models.MfaChallenge{}, "id = ?", id).Error
}

func (s *SecurityService) GetBruteForceConfig() (*models.BruteForceConfig, error) {
	var config models.BruteForceConfig
	if err := s.DB.First(&config).Error; err != nil {
		return nil, err
	}
	return &config, nil
}

func (s *SecurityService) UpdateBruteForceConfig(config *models.BruteForceConfig) error {
	return s.DB.Save(config).Error
}

func (s *SecurityService) GetBreachedPasswordsConfig() (*models.BreachedPasswordsConfig, error) {
	var config models.BreachedPasswordsConfig
	if err := s.DB.First(&config).Error; err != nil {
		return nil, err
	}
	return &config, nil
}

func (s *SecurityService) UpdateBreachedPasswordsConfig(config *models.BreachedPasswordsConfig) error {
	return s.DB.Save(config).Error
}

func (s *SecurityService) EnableDisableMfaMethod(method *models.MfaMethod) error {
	return s.DB.Save(method).Error
}

func (s *SecurityService) GetMfaStats() (map[string]interface{}, error) {
	var totalEnrollments int64
	s.DB.Model(&models.MfaEnrollment{}).Count(&totalEnrollments)
	var activeEnrollments int64
	s.DB.Model(&models.MfaEnrollment{}).Where("is_verified = ?", true).Count(&activeEnrollments)
	return map[string]interface{}{
		"total_enrollments":  totalEnrollments,
		"active_enrollments": activeEnrollments,
	}, nil
}

func (s *SecurityService) GetMfaActivity() ([]models.MfaEnrollment, error) {
	var enrollments []models.MfaEnrollment
	if err := s.DB.Order("created_at DESC").Limit(100).Find(&enrollments).Error; err != nil {
		return nil, err
	}
	return enrollments, nil
}

func (s *SecurityService) InitiateMfaChallenge(challenge *models.MfaChallenge) error {
	return s.DB.Create(challenge).Error
}

func (s *SecurityService) VerifyMfaCode(challengeID, code string) (map[string]interface{}, error) {
	challenge, err := s.GetMfaChallenge(challengeID)
	if err != nil {
		return nil, err
	}
	challenge.IsVerified = true
	if err := s.UpdateMfaChallenge(challenge); err != nil {
		return nil, err
	}
	return map[string]interface{}{
		"verified": true,
		"user_id":  challenge.UserID,
	}, nil
}

func (s *SecurityService) GetAttackProtectionSettings() (map[string]interface{}, error) {
	return map[string]interface{}{
		"enabled":                 true,
		"brute_force_protection":  true,
		"breached_password_check": true,
		"suspicious_ip_tracking":  true,
	}, nil
}

func (s *SecurityService) UpdateAttackProtectionSettings(settings map[string]interface{}) error {
	return nil
}

func (s *SecurityService) GetSecurityAnalytics() (map[string]interface{}, error) {
	return map[string]interface{}{
		"total_logins":          0,
		"failed_attempts":       0,
		"suspicious_activities": 0,
	}, nil
}

func (s *SecurityService) GetThreatData() ([]map[string]interface{}, error) {
	return []map[string]interface{}{}, nil
}

func (s *SecurityService) GetMonitoringStatus() (map[string]interface{}, error) {
	return map[string]interface{}{
		"status": "healthy",
		"uptime": "0s",
		"cpu":    0.0,
		"memory": 0.0,
	}, nil
}
