package services

import (
	"time"

	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
	"gorm.io/gorm"
)

type ReportService struct {
	DB *gorm.DB
}

func NewReportService(db *gorm.DB) *ReportService {
	return &ReportService{DB: db}
}

func (s *ReportService) GetDMARCReports() ([]models.DmarcReport, error) {
	var reports []models.DmarcReport
	if err := s.DB.Order("created_at desc").Find(&reports).Error; err != nil {
		return nil, err
	}
	return reports, nil
}

func (s *ReportService) GetDMARCReportsByDomain(domain string) ([]models.DmarcReport, error) {
	var reports []models.DmarcReport
	if err := s.DB.Where("domain = ?", domain).Order("created_at desc").Find(&reports).Error; err != nil {
		return nil, err
	}
	return reports, nil
}

func (s *ReportService) GetDMARCReportsByPeriod(start, end time.Time) ([]models.DmarcReport, error) {
	var reports []models.DmarcReport
	if err := s.DB.Where("period_start >= ? AND period_end <= ?", start, end).Find(&reports).Error; err != nil {
		return nil, err
	}
	return reports, nil
}

func (s *ReportService) GetARFReports() ([]models.ArfReport, error) {
	var reports []models.ArfReport
	if err := s.DB.Order("created_at desc").Find(&reports).Error; err != nil {
		return nil, err
	}
	return reports, nil
}

func (s *ReportService) GetARFReportsBySourceIP(sourceIP string) ([]models.ArfReport, error) {
	var reports []models.ArfReport
	if err := s.DB.Where("source_ip = ?", sourceIP).Order("created_at desc").Find(&reports).Error; err != nil {
		return nil, err
	}
	return reports, nil
}

func (s *ReportService) GetTLSReports() ([]models.TlsReport, error) {
	var reports []models.TlsReport
	if err := s.DB.Order("created_at desc").Find(&reports).Error; err != nil {
		return nil, err
	}
	return reports, nil
}

func (s *ReportService) GetTLSReportsByDomain(domain string) ([]models.TlsReport, error) {
	var reports []models.TlsReport
	if err := s.DB.Where("domain = ?", domain).Order("created_at desc").Find(&reports).Error; err != nil {
		return nil, err
	}
	return reports, nil
}

func (s *ReportService) CreateDmarcReport(report *models.DmarcReport) error {
	return s.DB.Create(report).Error
}

func (s *ReportService) CreateArfReport(report *models.ArfReport) error {
	return s.DB.Create(report).Error
}

func (s *ReportService) CreateTlsReport(report *models.TlsReport) error {
	return s.DB.Create(report).Error
}