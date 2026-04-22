package services

import (
	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
	"gorm.io/gorm"
)

type OrganizationService struct {
	DB *gorm.DB
}

func NewOrganizationService(db *gorm.DB) *OrganizationService {
	return &OrganizationService{DB: db}
}

func (s *OrganizationService) CreateOrganization(org *models.Organization) error {
	return s.DB.Create(org).Error
}

func (s *OrganizationService) GetOrganizationByID(id string) (*models.Organization, error) {
	var org models.Organization
	if err := s.DB.First(&org, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &org, nil
}

func (s *OrganizationService) GetOrganizationBySlug(slug string) (*models.Organization, error) {
	var org models.Organization
	if err := s.DB.Where("slug = ?", slug).First(&org).Error; err != nil {
		return nil, err
	}
	return &org, nil
}

func (s *OrganizationService) ListOrganizations() ([]models.Organization, error) {
	var orgs []models.Organization
	if err := s.DB.Find(&orgs).Error; err != nil {
		return nil, err
	}
	return orgs, nil
}

func (s *OrganizationService) UpdateOrganization(org *models.Organization) error {
	return s.DB.Save(org).Error
}

func (s *OrganizationService) DeleteOrganization(id string) error {
	return s.DB.Delete(&models.Organization{}, "id = ?", id).Error
}

func (s *OrganizationService) AddMember(orgID, userID, roleID string) error {
	member := &models.Membership{
		OrganizationID: orgID,
		UserID:         userID,
		RoleID:         &roleID,
		Status:         "active",
	}
	return s.DB.Create(member).Error
}

func (s *OrganizationService) RemoveMember(orgID, userID string) error {
	return s.DB.Where("organization_id = ? AND user_id = ?", orgID, userID).Delete(&models.Membership{}).Error
}

func (s *OrganizationService) GetMembers(orgID string) ([]models.Membership, error) {
	var members []models.Membership
	if err := s.DB.Where("organization_id = ?", orgID).Find(&members).Error; err != nil {
		return nil, err
	}
	return members, nil
}

func (s *OrganizationService) UpdateMemberRole(orgID, userID, roleID string) error {
	return s.DB.Model(&models.Membership{}).
		Where("organization_id = ? AND user_id = ?", orgID, userID).
		Update("role_id", roleID).Error
}
