package routes

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/skygenesisenterprise/aether-account/server/src/config"
	"github.com/skygenesisenterprise/aether-account/server/src/interfaces"
	"gorm.io/gorm"
)

type databaseStub struct{}

func (databaseStub) Gorm() *gorm.DB                                             { return nil }
func (databaseStub) Ping(context.Context) error                                 { return nil }
func (databaseStub) Close() error                                               { return nil }
func (databaseStub) Transaction(context.Context, func(tx *gorm.DB) error) error { return nil }

type eventBusStub struct{}

func (eventBusStub) Publish(context.Context, interfaces.Event) error { return nil }
func (eventBusStub) Subscribe(context.Context, string, interfaces.EventHandler) error {
	return nil
}
func (eventBusStub) Close() error                  { return nil }
func (eventBusStub) Healthy(context.Context) error { return nil }

type identityProviderStub struct{}

func (identityProviderStub) Authenticate(context.Context, string) (*interfaces.Principal, error) {
	return &interfaces.Principal{UserID: "user-1"}, nil
}
func (identityProviderStub) IssueToken(context.Context, interfaces.Principal) (string, error) {
	return "", nil
}

func TestHealthRoutes(t *testing.T) {
	t.Parallel()

	gin.SetMode(gin.TestMode)
	router := gin.New()
	SetupRoutes(router, Dependencies{
		Config: config.Config{
			App: config.AppConfig{Version: "test"},
		},
		Database:    databaseStub{},
		EventBus:    eventBusStub{},
		RuntimeRole: "api",
	})

	for _, target := range []string{"/health/live", "/health/ready", "/api/v1/health", "/api/v1/ready"} {
		req := httptest.NewRequest(http.MethodGet, target, nil)
		rec := httptest.NewRecorder()

		router.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("%s returned %d", target, rec.Code)
		}
	}
}

func TestProtectedRoutesRequireAuthentication(t *testing.T) {
	t.Parallel()

	gin.SetMode(gin.TestMode)
	router := gin.New()
	SetupRoutes(router, Dependencies{
		Config: config.Config{
			App: config.AppConfig{Version: "test"},
		},
		Database:    databaseStub{},
		EventBus:    eventBusStub{},
		RuntimeRole: "api",
	})

	protected := []string{
		"/api/v1/platform/home",
		"/api/v1/platform/wallet",
		"/api/v1/platform/user-info",
		"/api/v1/platform/security",
		"/api/v1/platform/applications",
		"/api/v1/platform/data-privacy",
		"/api/v1/platform/contacts",
		"/api/v1/platform/family",
		"/api/v1/platform/storage",
		"/api/v1/platform/settings",
		"/api/v1/workspaces",
	}

	for _, target := range protected {
		req := httptest.NewRequest(http.MethodGet, target, nil)
		rec := httptest.NewRecorder()

		router.ServeHTTP(rec, req)

		if rec.Code != http.StatusUnauthorized {
			t.Fatalf("%s expected 401, got %d", target, rec.Code)
		}
	}
}
