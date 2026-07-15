package services

import (
	"context"

	"github.com/skygenesisenterprise/aether-mailer/server/src/interfaces"
	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
)

type ReportService struct {
	repos interfaces.MailRepositorySet
}

func NewReportService(repos interfaces.MailRepositorySet) *ReportService {
	return &ReportService{repos: repos}
}

func (s *ReportService) ListDmarcReports(ctx context.Context, tenantID string) ([]models.ReportRecord, error) {
	return s.repos.Reports().ListByType(ctx, tenantID, "dmarc")
}

func (s *ReportService) GetDmarcReport(ctx context.Context, tenantID, reportID string) (*models.ReportRecord, error) {
	return s.repos.Reports().GetByID(ctx, tenantID, "dmarc", reportID)
}

func (s *ReportService) ListTlsReports(ctx context.Context, tenantID string) ([]models.ReportRecord, error) {
	return s.repos.Reports().ListByType(ctx, tenantID, "tls")
}

func (s *ReportService) GetTlsReport(ctx context.Context, tenantID, reportID string) (*models.ReportRecord, error) {
	return s.repos.Reports().GetByID(ctx, tenantID, "tls", reportID)
}

func (s *ReportService) ListArfReports(ctx context.Context, tenantID string) ([]models.ReportRecord, error) {
	return s.repos.Reports().ListByType(ctx, tenantID, "arf")
}

func (s *ReportService) GetArfReport(ctx context.Context, tenantID, reportID string) (*models.ReportRecord, error) {
	return s.repos.Reports().GetByID(ctx, tenantID, "arf", reportID)
}

func (s *ReportService) GetReportSummary(ctx context.Context, tenantID string) map[string]any {
	return map[string]any{"dmarc": 0, "tls": 0, "arf": 0}
}
