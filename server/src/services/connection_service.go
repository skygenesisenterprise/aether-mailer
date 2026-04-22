package services

import (
	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
	"gorm.io/gorm"
)

type ConnectionService struct {
	DB *gorm.DB
}

func NewConnectionService(db *gorm.DB) *ConnectionService {
	return &ConnectionService{DB: db}
}

func (s *ConnectionService) CreateConnection(conn *models.Connection) error {
	return s.DB.Create(conn).Error
}

func (s *ConnectionService) GetConnectionByID(id string) (*models.Connection, error) {
	var conn models.Connection
	if err := s.DB.First(&conn, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &conn, nil
}

func (s *ConnectionService) GetConnectionByName(name string) (*models.Connection, error) {
	var conn models.Connection
	if err := s.DB.Where("name = ?", name).First(&conn).Error; err != nil {
		return nil, err
	}
	return &conn, nil
}

func (s *ConnectionService) ListConnections() ([]models.Connection, error) {
	var conns []models.Connection
	if err := s.DB.Find(&conns).Error; err != nil {
		return nil, err
	}
	return conns, nil
}

func (s *ConnectionService) UpdateConnection(conn *models.Connection) error {
	return s.DB.Save(conn).Error
}

func (s *ConnectionService) DeleteConnection(id string) error {
	return s.DB.Delete(&models.Connection{}, "id = ?", id).Error
}

func (s *ConnectionService) CreateDatabaseConnection(dbConn *models.DatabaseConnection) error {
	return s.DB.Create(dbConn).Error
}

func (s *ConnectionService) GetDatabaseConnection(connectionID string) (*models.DatabaseConnection, error) {
	var dbConn models.DatabaseConnection
	if err := s.DB.Where("connection_id = ?", connectionID).First(&dbConn).Error; err != nil {
		return nil, err
	}
	return &dbConn, nil
}

func (s *ConnectionService) UpdateDatabaseConnection(dbConn *models.DatabaseConnection) error {
	return s.DB.Save(dbConn).Error
}

func (s *ConnectionService) CreateSocialProvider(provider *models.SocialProvider) error {
	return s.DB.Create(provider).Error
}

func (s *ConnectionService) GetSocialProvider(name string) (*models.SocialProvider, error) {
	var provider models.SocialProvider
	if err := s.DB.Where("name = ?", name).First(&provider).Error; err != nil {
		return nil, err
	}
	return &provider, nil
}

func (s *ConnectionService) ListSocialProviders() ([]models.SocialProvider, error) {
	var providers []models.SocialProvider
	if err := s.DB.Find(&providers).Error; err != nil {
		return nil, err
	}
	return providers, nil
}

func (s *ConnectionService) UpdateSocialProvider(provider *models.SocialProvider) error {
	return s.DB.Save(provider).Error
}

func (s *ConnectionService) CreateEnterpriseConnection(conn *models.EnterpriseConnection) error {
	return s.DB.Create(conn).Error
}

func (s *ConnectionService) GetEnterpriseConnection(name string) (*models.EnterpriseConnection, error) {
	var conn models.EnterpriseConnection
	if err := s.DB.Where("name = ?", name).First(&conn).Error; err != nil {
		return nil, err
	}
	return &conn, nil
}

func (s *ConnectionService) UpdateEnterpriseConnection(conn *models.EnterpriseConnection) error {
	return s.DB.Save(conn).Error
}

func (s *ConnectionService) CreatePasswordlessConnection(conn *models.PasswordlessConnection) error {
	return s.DB.Create(conn).Error
}

func (s *ConnectionService) GetPasswordlessConnection(name string) (*models.PasswordlessConnection, error) {
	var conn models.PasswordlessConnection
	if err := s.DB.Where("name = ?", name).First(&conn).Error; err != nil {
		return nil, err
	}
	return &conn, nil
}

func (s *ConnectionService) UpdatePasswordlessConnection(conn *models.PasswordlessConnection) error {
	return s.DB.Save(conn).Error
}

func (s *ConnectionService) CreateAuthenticationProfile(profile *models.AuthenticationProfile) error {
	return s.DB.Create(profile).Error
}

func (s *ConnectionService) GetAuthenticationProfile(id string) (*models.AuthenticationProfile, error) {
	var profile models.AuthenticationProfile
	if err := s.DB.First(&profile, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &profile, nil
}

func (s *ConnectionService) GetAuthenticationProfileByName(name string) (*models.AuthenticationProfile, error) {
	var profile models.AuthenticationProfile
	if err := s.DB.Where("name = ?", name).First(&profile).Error; err != nil {
		return nil, err
	}
	return &profile, nil
}

func (s *ConnectionService) ListAuthenticationProfiles() ([]models.AuthenticationProfile, error) {
	var profiles []models.AuthenticationProfile
	if err := s.DB.Find(&profiles).Error; err != nil {
		return nil, err
	}
	return profiles, nil
}

func (s *ConnectionService) UpdateAuthenticationProfile(profile *models.AuthenticationProfile) error {
	return s.DB.Save(profile).Error
}

func (s *ConnectionService) DeleteAuthenticationProfile(id string) error {
	return s.DB.Delete(&models.AuthenticationProfile{}, "id = ?", id).Error
}

func (s *ConnectionService) ListDatabaseConnectionUsers(connectionID string) ([]models.DatabaseConnectionUser, error) {
	var users []models.DatabaseConnectionUser
	if err := s.DB.Where("database_connection_id = ?", connectionID).Find(&users).Error; err != nil {
		return nil, err
	}
	return users, nil
}

func (s *ConnectionService) ListEnterpriseConnections() ([]models.EnterpriseConnection, error) {
	var conns []models.EnterpriseConnection
	if err := s.DB.Find(&conns).Error; err != nil {
		return nil, err
	}
	return conns, nil
}

func (s *ConnectionService) ListPasswordlessConnections() ([]models.PasswordlessConnection, error) {
	var conns []models.PasswordlessConnection
	if err := s.DB.Find(&conns).Error; err != nil {
		return nil, err
	}
	return conns, nil
}
