package routes

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/skygenesisenterprise/aether-account/server/src/middleware"
	"github.com/skygenesisenterprise/aether-account/server/src/services"
	"github.com/skygenesisenterprise/aether-account/server/src/utils"
)

type PlatformHandler struct {
	deps Dependencies
}

func NewPlatformHandler(deps Dependencies) *PlatformHandler {
	return &PlatformHandler{deps: deps}
}

// --- Home Routes ---

func (h *PlatformHandler) GetHomeData(c *gin.Context) {
	principal, ok := middleware.GetPrincipal(c)
	if !ok {
		utils.Error(c, utils.ErrUnauthorized)
		return
	}

	user, err := h.deps.UserService.GetByID(c.Request.Context(), principal.UserID)
	if err != nil {
		utils.Error(c, err)
		return
	}

	workspace, err := h.deps.WorkspaceService.GetByID(c.Request.Context(), principal.WorkspaceID)
	if err != nil {
		utils.Error(c, err)
		return
	}

	utils.Success(c, http.StatusOK, gin.H{
		"user":      user,
		"workspace": workspace,
		"stats": gin.H{
			"totalProjects": 0,
			"totalTasks":    0,
			"totalMessages": 0,
			"storageUsed":   0,
			"storageLimit":  0,
		},
	})
}

// --- Wallet Routes ---

func (h *PlatformHandler) GetWalletInfo(c *gin.Context) {
	utils.Success(c, http.StatusOK, gin.H{
		"billingInfo": gin.H{
			"customerId":    "",
			"paymentMethod": "",
			"currency":     "EUR",
		},
		"subscriptions": []gin.H{},
		"transactions":  []gin.H{},
	})
}

// --- User Info Routes ---

func (h *PlatformHandler) GetUserInfo(c *gin.Context) {
	principal, ok := middleware.GetPrincipal(c)
	if !ok {
		utils.Error(c, utils.ErrUnauthorized)
		return
	}

	user, err := h.deps.UserService.GetByID(c.Request.Context(), principal.UserID)
	if err != nil {
		utils.Error(c, err)
		return
	}

	utils.Success(c, http.StatusOK, user)
}

func (h *PlatformHandler) UpdateUserInfo(c *gin.Context) {
	principal, ok := middleware.GetPrincipal(c)
	if !ok {
		utils.Error(c, utils.ErrUnauthorized)
		return
	}

	var req struct {
		DisplayName string `json:"displayName,omitempty"`
		AvatarURL  string `json:"avatarUrl,omitempty"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, utils.ErrValidationFailed)
		return
	}

	user, err := h.deps.UserService.UpdateProfile(c.Request.Context(), principal.UserID, services.UpdateProfileInput{
		DisplayName: req.DisplayName,
		AvatarURL:  req.AvatarURL,
	})
	if err != nil {
		utils.Error(c, err)
		return
	}

	utils.Success(c, http.StatusOK, user)
}

// --- Security Routes ---

func (h *PlatformHandler) GetSecurityInfo(c *gin.Context) {
	principal, ok := middleware.GetPrincipal(c)
	if !ok {
		utils.Error(c, utils.ErrUnauthorized)
		return
	}

	sessions, err := h.deps.AuthService.ListSessions(c.Request.Context(), principal)
	if err != nil {
		utils.Error(c, err)
		return
	}

	utils.Success(c, http.StatusOK, gin.H{
		"sessions":     sessions,
		"devices":      []gin.H{},
		"loginHistory": []gin.H{},
		"twoFaEnabled": false,
	})
}

// --- Password Routes ---

func (h *PlatformHandler) ChangePassword(c *gin.Context) {
	principal, ok := middleware.GetPrincipal(c)
	if !ok {
		utils.Error(c, utils.ErrUnauthorized)
		return
	}

	var req struct {
		CurrentPassword string `json:"currentPassword"`
		NewPassword     string `json:"newPassword"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, utils.ErrValidationFailed)
		return
	}

	if req.CurrentPassword == "" || len(req.NewPassword) < 12 {
		utils.Error(c, utils.ErrValidationFailed)
		return
	}

	err := h.deps.AuthService.ChangePassword(c.Request.Context(), principal, req.CurrentPassword, req.NewPassword, services.RequestMetadata{})
	if err != nil {
		utils.Error(c, err)
		return
	}

	utils.Success(c, http.StatusOK, gin.H{"message": "Password changed successfully"})
}

// --- Applications Routes ---

func (h *PlatformHandler) ListApplications(c *gin.Context) {
	utils.Success(c, http.StatusOK, []gin.H{})
}

func (h *PlatformHandler) GetApplicationDetails(c *gin.Context) {
	applicationID := c.Param("applicationId")
	if applicationID == "" {
		utils.Error(c, utils.ErrValidationFailed)
		return
	}
	utils.Success(c, http.StatusOK, gin.H{"id": applicationID, "name": "Application " + applicationID})
}

// --- Data & Privacy Routes ---

func (h *PlatformHandler) GetDataPrivacyInfo(c *gin.Context) {
	utils.Success(c, http.StatusOK, gin.H{
		"privacySettings": gin.H{
			"dataProcessing":  true,
			"marketingEmails": true,
			"analytics":       true,
			"publicProfile":   false,
		},
		"personalData": gin.H{
			"totalFiles":    0,
			"totalMessages": 0,
			"totalStorage":  0,
		},
		"dataRetention": "30 days",
		"gdprCompliant": true,
	})
}

func (h *PlatformHandler) UpdatePrivacySettings(c *gin.Context) {
	var req struct {
		DataProcessing  bool `json:"dataProcessing"`
		MarketingEmails bool `json:"marketingEmails"`
		Analytics      bool `json:"analytics"`
		PublicProfile  bool `json:"publicProfile"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, utils.ErrValidationFailed)
		return
	}

	utils.Success(c, http.StatusOK, gin.H{
		"message":  "Privacy settings updated",
		"settings": req,
	})
}

// --- Contacts & Sharing Routes ---

func (h *PlatformHandler) ListContacts(c *gin.Context) {
	utils.Success(c, http.StatusOK, []gin.H{})
}

func (h *PlatformHandler) GetContactDetails(c *gin.Context) {
	contactID := c.Param("contactId")
	if contactID == "" {
		utils.Error(c, utils.ErrValidationFailed)
		return
	}
	utils.Success(c, http.StatusOK, gin.H{"id": contactID, "name": "Contact " + contactID})
}

// --- Family Routes ---

func (h *PlatformHandler) ListFamilyMembers(c *gin.Context) {
	utils.Success(c, http.StatusOK, []gin.H{})
}

func (h *PlatformHandler) InviteFamilyMember(c *gin.Context) {
	var req struct {
		Email   string `json:"email"`
		Role    string `json:"role"`
		Message string `json:"message,omitempty"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, utils.ErrValidationFailed)
		return
	}

	if req.Email == "" {
		utils.Error(c, utils.ErrValidationFailed)
		return
	}

	utils.Success(c, http.StatusCreated, gin.H{
		"message": "Invitation sent",
		"email":   req.Email,
		"role":    req.Role,
	})
}

// --- Drive/Storage Routes ---

func (h *PlatformHandler) GetStorageInfo(c *gin.Context) {
	utils.Success(c, http.StatusOK, gin.H{
		"totalSpace":     int64(10 * 1024 * 1024 * 1024),
		"usedSpace":      int64(2 * 1024 * 1024 * 1024),
		"availableSpace": int64(8 * 1024 * 1024 * 1024),
		"usagePercent":   20.0,
		"maxFileSize":    int64(512 * 1024 * 1024),
		"fileCount":      150,
	})
}

func (h *PlatformHandler) ListFiles(c *gin.Context) {
	utils.Success(c, http.StatusOK, gin.H{
		"files":    []gin.H{},
		"total":    0,
		"page":     1,
		"pageSize": 20,
	})
}

// --- Settings Routes ---

func (h *PlatformHandler) GetSettings(c *gin.Context) {
	utils.Success(c, http.StatusOK, gin.H{
		"theme":              "system",
		"language":           "fr",
		"timezone":           "Europe/Paris",
		"dateFormat":        "DD/MM/YYYY",
		"timeFormat":        "24h",
		"notifications":     true,
		"emailNotifications": true,
		"pushNotifications":  true,
	})
}

func (h *PlatformHandler) UpdateSettings(c *gin.Context) {
	var req struct {
		Theme              string `json:"theme,omitempty"`
		Language           string `json:"language,omitempty"`
		Timezone           string `json:"timezone,omitempty"`
		DateFormat         string `json:"dateFormat,omitempty"`
		TimeFormat         string `json:"timeFormat,omitempty"`
		EmailNotifications bool   `json:"emailNotifications"`
		PushNotifications  bool   `json:"pushNotifications"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, utils.ErrValidationFailed)
		return
	}

	utils.Success(c, http.StatusOK, gin.H{
		"message":  "Settings updated",
		"settings": req,
	})
}
