package routes

import (
	"encoding/base64"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/skygenesisenterprise/aether-mailer/server/src/middleware"
	"github.com/skygenesisenterprise/aether-mailer/server/src/services"
	"github.com/skygenesisenterprise/aether-mailer/server/src/utils"
)

type StalwartHandler struct {
	deps Dependencies
}

func NewStalwartHandler(deps Dependencies) *StalwartHandler {
	return &StalwartHandler{deps: deps}
}

func (h *StalwartHandler) SetupStalwartRoutes(api *gin.RouterGroup) {
	helper := api.Group("")
	{
		helper.POST("/auth", h.StalwartLogin)
		helper.GET("/discover/:email", h.DiscoverOidc)
		helper.GET("/account", h.GetStalwartAccount)
		helper.GET("/schema", h.GetSchemaRedirect)
		helper.GET("/schema/:hash", h.GetSchema)
		helper.GET("/token/delivery", h.IssueDeliveryToken)
		helper.GET("/token/tracing", h.IssueTracingToken)
		helper.GET("/token/metrics", h.IssueMetricsToken)
		helper.GET("/live/delivery/:target", h.LiveDeliverySSE)
		helper.GET("/live/tracing", h.LiveTracingSSE)
		helper.GET("/live/metrics", h.LiveMetricsSSE)
	}
}

func (h *StalwartHandler) StalwartLogin(c *gin.Context) {
	type loginRequest struct {
		Username string `json:"username" form:"username"`
		Password string `json:"password" form:"password"`
	}

	var req loginRequest
	if err := c.ShouldBind(&req); err != nil {
		_ = c.Request.ParseForm()
		req.Username = c.Request.FormValue("username")
		req.Password = c.Request.FormValue("password")
	}

	if req.Username == "" || req.Password == "" {
		authHeader := c.GetHeader("Authorization")
		if strings.HasPrefix(authHeader, "Basic ") {
			decoded, err := base64.StdEncoding.DecodeString(authHeader[6:])
			if err == nil {
				parts := strings.SplitN(string(decoded), ":", 2)
				if len(parts) == 2 {
					req.Username = parts[0]
					req.Password = parts[1]
				}
			}
		}
	}

	if req.Username == "" {
		utils.Error(c, utils.ErrValidationFailed)
		return
	}

	result, err := h.deps.AuthService.Login(c.Request.Context(), services.LoginInput{
		Email:    req.Username,
		Password: req.Password,
	}, services.RequestMetadata{
		UserAgent: c.GetHeader("User-Agent"),
		IPAddress: c.ClientIP(),
	})
	if err != nil {
		utils.Error(c, err)
		return
	}

	utils.Success(c, http.StatusOK, gin.H{
		"access_token": result.AccessToken,
		"token_type":   "Bearer",
		"expires_in":   result.ExpiresIn,
		"user":         result.User,
	})
}

func (h *StalwartHandler) DiscoverOidc(c *gin.Context) {
	email := c.Param("email")
	if email == "" {
		utils.Error(c, utils.ErrValidationFailed)
		return
	}

	parts := strings.SplitN(email, "@", 2)
	if len(parts) != 2 {
		utils.Error(c, utils.NewError(http.StatusBadRequest, "INVALID_EMAIL", "Invalid email address format.", nil))
		return
	}

	domain := parts[1]
	configService := h.deps.ConfigService
	oidcConfig := configService.GetOidcConfig(c.Request.Context())

	utils.Success(c, http.StatusOK, gin.H{
		"email":     email,
		"domain":    domain,
		"oidc":      oidcConfig,
		"discovery": true,
	})
}

func (h *StalwartHandler) GetStalwartAccount(c *gin.Context) {
	principal, ok := middleware.PrincipalFromGin(c)
	if !ok {
		utils.Error(c, utils.ErrUnauthorized)
		return
	}

	account, err := h.deps.AccountService.Get(c.Request.Context(), principal.WorkspaceID, principal.UserID)
	if err != nil {
		utils.Error(c, err)
		return
	}

	utils.Success(c, http.StatusOK, gin.H{
		"id":          account.ID,
		"name":        account.Name,
		"displayName": account.DisplayName,
		"domainId":    account.DomainID,
		"tenantId":    account.TenantID,
		"enabled":     !account.IsDisabled,
		"quotaBytes":  account.QuotaBytes,
		"usedBytes":   account.UsedBytes,
	})
}

func (h *StalwartHandler) GetSchemaRedirect(c *gin.Context) {
	utils.Success(c, http.StatusOK, gin.H{
		"schema": "/api/schema/stalwart-mail",
		"hash":   "v1",
	})
}

func (h *StalwartHandler) GetSchema(c *gin.Context) {
	schemaHash := c.Param("hash")
	utils.Success(c, http.StatusOK, gin.H{
		"hash":    schemaHash,
		"version": "1.0.0",
		"name":    "stalwart-mail",
		"endpoints": gin.H{
			"auth":        "/api/auth",
			"account":     "/api/account",
			"management":  "/api/v1/mail/management",
			"config":      "/api/v1/mail/config",
			"monitoring":  "/api/v1/mail/monitoring",
		},
	})
}

func (h *StalwartHandler) IssueDeliveryToken(c *gin.Context) {
	principal, ok := middleware.PrincipalFromGin(c)
	if !ok {
		utils.Error(c, utils.ErrUnauthorized)
		return
	}

	target := c.Query("target")
	if target == "" {
		target = "global"
	}

	token, err := h.deps.LiveService.IssueToken(c.Request.Context(), principal, "delivery", target)
	if err != nil {
		utils.Error(c, err)
		return
	}

	utils.Success(c, http.StatusOK, gin.H{
		"token":     token,
		"type":      "delivery",
		"target":    target,
		"expiresAt": time.Now().Add(5 * time.Minute).UTC(),
	})
}

func (h *StalwartHandler) IssueTracingToken(c *gin.Context) {
	principal, ok := middleware.PrincipalFromGin(c)
	if !ok {
		utils.Error(c, utils.ErrUnauthorized)
		return
	}

	token, err := h.deps.LiveService.IssueToken(c.Request.Context(), principal, "tracing", "")
	if err != nil {
		utils.Error(c, err)
		return
	}

	utils.Success(c, http.StatusOK, gin.H{
		"token":     token,
		"type":      "tracing",
		"expiresAt": time.Now().Add(5 * time.Minute).UTC(),
	})
}

func (h *StalwartHandler) IssueMetricsToken(c *gin.Context) {
	principal, ok := middleware.PrincipalFromGin(c)
	if !ok {
		utils.Error(c, utils.ErrUnauthorized)
		return
	}

	token, err := h.deps.LiveService.IssueToken(c.Request.Context(), principal, "metrics", "")
	if err != nil {
		utils.Error(c, err)
		return
	}

	utils.Success(c, http.StatusOK, gin.H{
		"token":     token,
		"type":      "metrics",
		"expiresAt": time.Now().Add(5 * time.Minute).UTC(),
	})
}

func (h *StalwartHandler) LiveDeliverySSE(c *gin.Context) {
	target := c.Param("target")
	h.streamSSE(c, "delivery", target)
}

func (h *StalwartHandler) LiveTracingSSE(c *gin.Context) {
	h.streamSSE(c, "tracing", "")
}

func (h *StalwartHandler) LiveMetricsSSE(c *gin.Context) {
	h.streamSSE(c, "metrics", "")
}

func (h *StalwartHandler) streamSSE(c *gin.Context, streamType, target string) {
	flusher, ok := c.Writer.(http.Flusher)
	if !ok {
		utils.Error(c, utils.NewError(http.StatusInternalServerError, "STREAMING_UNSUPPORTED", "Streaming is not supported.", nil))
		return
	}

	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("X-Accel-Buffering", "no")
	c.Writer.WriteHeader(http.StatusOK)
	flusher.Flush()

	ctx := c.Request.Context()
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	sub := h.deps.LiveService.Subscribe(ctx, streamType, target)
	defer sub.Close()

	for {
		select {
		case <-ctx.Done():
			return
		case event, ok := <-sub.C():
			if !ok {
				return
			}
			_, _ = c.Writer.Write([]byte("data: " + event + "\n\n"))
			flusher.Flush()
		case <-ticker.C:
			_, _ = c.Writer.Write([]byte(": keepalive\n\n"))
			flusher.Flush()
		}
	}
}
