package services

import (
	"context"
	"strings"
	"time"

	"github.com/skygenesisenterprise/aether-account/server/src/interfaces"
	"github.com/skygenesisenterprise/aether-account/server/src/models"
	"github.com/skygenesisenterprise/aether-account/server/src/utils"
)

type UserService struct {
	users                   interfaces.UserRepository
	settings                interfaces.UserSettingsRepository
	notificationPreferences interfaces.NotificationPreferenceRepository
	presence                *PresenceService
}

type UserPreferencesDTO struct {
	Theme         string `json:"theme"`
	Language      string `json:"language"`
	Locale        string `json:"locale"`
	Timezone      string `json:"timezone"`
	StatusMessage string `json:"statusMessage,omitempty"`
	Density       string `json:"density"`
	Contrast      string `json:"contrast"`
	SoundEnabled  bool   `json:"soundEnabled"`
	SecureSession bool   `json:"secureSession"`
}

type NotificationPreferencesDTO struct {
	DirectMessages       bool `json:"directMessages"`
	Mentions             bool `json:"mentions"`
	ChannelMessages      bool `json:"channelMessages"`
	MeetingReminders     bool `json:"meetingReminders"`
	IncomingCalls        bool `json:"incomingCalls"`
	EmailNotifications   bool `json:"emailNotifications"`
	Sounds               bool `json:"sounds"`
	DesktopNotifications bool `json:"desktopNotifications"`
}

func NewUserService(
	users interfaces.UserRepository,
	settings interfaces.UserSettingsRepository,
	notificationPreferences interfaces.NotificationPreferenceRepository,
	presence *PresenceService,
) *UserService {
	return &UserService{
		users:                   users,
		settings:                settings,
		notificationPreferences: notificationPreferences,
		presence:                presence,
	}
}

func (s *UserService) EnsureUser(ctx context.Context, principal interfaces.Principal) (*models.User, error) {
	user, err := s.users.GetByID(ctx, principal.UserID)
	if err == nil {
		return user, nil
	}
	user = &models.User{
		Common:          models.Common{ID: principal.UserID, CreatedAt: time.Now().UTC(), UpdatedAt: time.Now().UTC()},
		Email:           principal.UserID + "@local.aether",
		EmailNormalized: principal.UserID + "@local.aether",
		DisplayName:     principal.UserID,
		Status:          "active",
		PresenceStatus:  "online",
	}
	if createErr := s.users.Create(ctx, user); createErr != nil {
		return nil, createErr
	}
	return user, nil
}

func (s *UserService) GetMe(ctx context.Context, principal interfaces.Principal) (*models.User, error) {
	return s.EnsureUser(ctx, principal)
}

func (s *UserService) UpdateMe(ctx context.Context, principal interfaces.Principal, displayName, avatarURL, status string) (*models.User, error) {
	user, err := s.EnsureUser(ctx, principal)
	if err != nil {
		return nil, err
	}
	if displayName != "" {
		user.DisplayName = strings.TrimSpace(displayName)
	}
	if trimmed := strings.TrimSpace(avatarURL); trimmed != "" {
		user.AvatarURL = &trimmed
	} else {
		user.AvatarURL = nil
	}
	if status != "" {
		normalizedStatus := normalizePresenceState(status)
		if normalizedStatus == "" {
			return nil, utils.ErrValidationFailed
		}
		user.PresenceStatus = normalizedStatus
	}
	user.UpdatedAt = time.Now().UTC()
	if err := s.users.Update(ctx, user); err != nil {
		return nil, err
	}
	if s.presence != nil {
		if err := s.presence.RefreshUserState(ctx, user.ID); err != nil {
			return nil, err
		}
	}
	return user, nil
}

func (s *UserService) GetPreferences(ctx context.Context, principal interfaces.Principal) (*UserPreferencesDTO, error) {
	_, err := s.EnsureUser(ctx, principal)
	if err != nil {
		return nil, err
	}
	settings, err := s.settings.GetByUserID(ctx, principal.UserID)
	if err != nil {
		if utils.AsAppError(err).Code != "USER_SETTINGS_NOT_FOUND" {
			return nil, err
		}
		return &UserPreferencesDTO{
			Theme: "system", Language: "fr", Locale: "fr", Timezone: "Europe/Paris",
			Density: "comfortable", Contrast: "default", SoundEnabled: true, SecureSession: true,
		}, nil
	}
	statusMessage := ""
	if settings.StatusMessage != nil {
		statusMessage = *settings.StatusMessage
	}
	return &UserPreferencesDTO{
		Theme:         settings.Theme,
		Language:      settings.Language,
		Locale:        settings.Locale,
		Timezone:      settings.TimeZone,
		StatusMessage: statusMessage,
		Density:       settings.Density,
		Contrast:      settings.Contrast,
		SoundEnabled:  settings.SoundEnabled,
		SecureSession: settings.SecureSession,
	}, nil
}

func (s *UserService) UpdatePreferences(ctx context.Context, principal interfaces.Principal, input UserPreferencesDTO) (*UserPreferencesDTO, error) {
	_, err := s.EnsureUser(ctx, principal)
	if err != nil {
		return nil, err
	}
	now := time.Now().UTC()
	statusMessage := strings.TrimSpace(input.StatusMessage)
	settings := &models.UserSettings{
		Common:        models.Common{ID: utils.NewID(), CreatedAt: now, UpdatedAt: now},
		UserID:        principal.UserID,
		Theme:         defaultString(input.Theme, "system"),
		Language:      defaultString(input.Language, "fr"),
		Locale:        defaultString(input.Locale, "fr"),
		TimeZone:      defaultString(input.Timezone, "Europe/Paris"),
		Density:       defaultString(input.Density, "comfortable"),
		Contrast:      defaultString(input.Contrast, "default"),
		SoundEnabled:  input.SoundEnabled,
		SecureSession: input.SecureSession,
	}
	if statusMessage != "" {
		settings.StatusMessage = &statusMessage
	}
	if err := s.settings.Upsert(ctx, settings); err != nil {
		return nil, err
	}
	return s.GetPreferences(ctx, principal)
}

func (s *UserService) GetNotificationPreferences(ctx context.Context, principal interfaces.Principal) (*NotificationPreferencesDTO, error) {
	_, err := s.EnsureUser(ctx, principal)
	if err != nil {
		return nil, err
	}
	prefs, err := s.notificationPreferences.GetByUserID(ctx, principal.UserID)
	if err != nil {
		if utils.AsAppError(err).Code != "NOTIFICATION_PREFERENCES_NOT_FOUND" {
			return nil, err
		}
		return &NotificationPreferencesDTO{
			DirectMessages: true, Mentions: true, ChannelMessages: true, MeetingReminders: true,
			IncomingCalls: true, EmailNotifications: true, Sounds: true, DesktopNotifications: true,
		}, nil
	}
	return &NotificationPreferencesDTO{
		DirectMessages:       prefs.DirectMessageNotifications,
		Mentions:             prefs.MentionNotifications,
		ChannelMessages:      prefs.ChannelMessageNotifications,
		MeetingReminders:     prefs.MeetingReminders,
		IncomingCalls:        prefs.CallNotifications,
		EmailNotifications:   prefs.EmailNotifications,
		Sounds:               prefs.SoundEnabled,
		DesktopNotifications: prefs.DesktopNotifications,
	}, nil
}

func (s *UserService) UpdateNotificationPreferences(
	ctx context.Context,
	principal interfaces.Principal,
	input NotificationPreferencesDTO,
) (*NotificationPreferencesDTO, error) {
	_, err := s.EnsureUser(ctx, principal)
	if err != nil {
		return nil, err
	}
	now := time.Now().UTC()
	preference := &models.NotificationPreference{
		Common:                      models.Common{ID: utils.NewID(), CreatedAt: now, UpdatedAt: now},
		UserID:                      principal.UserID,
		DirectMessageNotifications:  input.DirectMessages,
		MentionNotifications:        input.Mentions,
		ChannelMessageNotifications: input.ChannelMessages,
		MeetingReminders:            input.MeetingReminders,
		CallNotifications:           input.IncomingCalls,
		EmailNotifications:          input.EmailNotifications,
		SoundEnabled:                input.Sounds,
		DesktopNotifications:        input.DesktopNotifications,
	}
	if err := s.notificationPreferences.Upsert(ctx, preference); err != nil {
		return nil, err
	}
	return s.GetNotificationPreferences(ctx, principal)
}

func defaultString(value string, fallback string) string {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return fallback
	}
	return trimmed
}

func roleAllowed(role string) bool {
	return utils.ValidRole(role)
}

// UpdateProfileInput représente les données pour mettre à jour le profil utilisateur
type UpdateProfileInput struct {
	DisplayName string
	AvatarURL  string
}

// UpdateProfile met à jour le profil utilisateur
func (s *UserService) UpdateProfile(ctx context.Context, userID string, input UpdateProfileInput) (*models.User, error) {
	user, err := s.users.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	if input.DisplayName != "" {
		user.DisplayName = strings.TrimSpace(input.DisplayName)
	}
	if input.AvatarURL != "" {
		user.AvatarURL = &input.AvatarURL
	}

	user.UpdatedAt = time.Now().UTC()

	if err := s.users.Update(ctx, user); err != nil {
		return nil, err
	}

	return user, nil
}

// GetByID retourne un utilisateur par son ID
func (s *UserService) GetByID(ctx context.Context, userID string) (*models.User, error) {
	return s.users.GetByID(ctx, userID)
}

// ListContacts liste les contacts de l'utilisateur
func (s *UserService) ListContacts(ctx context.Context, userID string) ([]*models.Contact, error) {
	// À implémenter avec le repository des contacts
	// Pour l'instant, retourner une liste vide
	return []*models.Contact{}, nil
}

// GetContactByID retourne un contact par son ID
func (s *UserService) GetContactByID(ctx context.Context, userID, contactID string) (*models.Contact, error) {
	// À implémenter avec le repository des contacts
	return nil, utils.NewError(404, "CONTACT_NOT_FOUND", "The requested contact was not found.", nil)
}

// ListFamilyMembers liste les membres de la famille
func (s *UserService) ListFamilyMembers(ctx context.Context, userID string) ([]*models.FamilyMember, error) {
	// À implémenter avec le repository de la famille
	return []*models.FamilyMember{}, nil
}

// InviteFamilyMemberInput représente les données pour inviter un membre de la famille
type InviteFamilyMemberInput struct {
	Email    string
	Role     string
	Message  string
}

// InviteFamilyMember invite un membre de la famille
func (s *UserService) InviteFamilyMember(ctx context.Context, userID string, input InviteFamilyMemberInput) (*models.Invitation, error) {
	// À implémenter avec le service d'invitation
	// Pour l'instant, retourner une invitation de base
	now := time.Now().UTC()
	return &models.Invitation{
		Common:    models.Common{ID: utils.NewID(), CreatedAt: now, UpdatedAt: now},
		Email:     input.Email,
		Role:      input.Role,
		Message:   input.Message,
		Token:     utils.NewID(),
		Status:    "pending",
		ExpiresAt: now.Add(7 * 24 * time.Hour).UTC(),
	}, nil
}

// GetStorageInfo retourne les informations de stockage
func (s *UserService) GetStorageInfo(ctx context.Context, userID string) (*models.StorageInfo, error) {
	// À implémenter avec le service de stockage
	return &models.StorageInfo{
		TotalSpace:     10 * 1024 * 1024 * 1024, // 10 GB
		UsedSpace:      2 * 1024 * 1024 * 1024, // 2 GB
		AvailableSpace: 8 * 1024 * 1024 * 1024, // 8 GB
		UsagePercent:   20.0,
		MaxFileSize:    512 * 1024 * 1024, // 512 MB
		FileCount:      150,
	}, nil
}

// ListFiles liste les fichiers de l'utilisateur
func (s *UserService) ListFiles(ctx context.Context, userID string, page, pageSize int) ([]*models.FileItem, int, error) {
	// À implémenter avec le repository des fichiers
	return []*models.FileItem{}, 0, nil
}

// UpdateSettingsInput représente les données pour mettre à jour les paramètres utilisateur
type UpdateSettingsInput struct {
	Theme                  string
	Language               string
	Timezone               string
	NotificationPreferences NotificationPreferencesDTO
}

// UpdateSettings met à jour les paramètres utilisateur
func (s *UserService) UpdateSettings(ctx context.Context, userID string, input UpdateSettingsInput) (*models.UserSettings, error) {
	settings, err := s.settings.GetByUserID(ctx, userID)
	if err != nil {
		if utils.AsAppError(err).Code != "USER_SETTINGS_NOT_FOUND" {
			return nil, err
		}
		settings = &models.UserSettings{}
	}

	if input.Theme != "" {
		settings.Theme = input.Theme
	}
	if input.Language != "" {
		settings.Language = input.Language
	}
	if input.Timezone != "" {
		settings.TimeZone = input.Timezone
	}

	settings.UpdatedAt = time.Now().UTC()

	if err := s.settings.Upsert(ctx, settings); err != nil {
		return nil, err
	}

	return settings, nil
}

// GetSettings retourne les paramètres utilisateur
func (s *UserService) GetSettings(ctx context.Context, userID string) (*models.UserSettings, error) {
	return s.settings.GetByUserID(ctx, userID)
}

// GetBillingInfo retourne les informations de facturation
func (s *UserService) GetBillingInfo(ctx context.Context, userID string) (*models.BillingInfo, error) {
	// À implémenter avec le service de facturation
	return &models.BillingInfo{
		Currency: "EUR",
	}, nil
}

// GetSubscriptions retourne les abonnements de l'utilisateur
func (s *UserService) GetSubscriptions(ctx context.Context, userID string) ([]*models.Subscription, error) {
	// À implémenter avec le service de facturation
	return []*models.Subscription{}, nil
}

// GetTransactions retourne l'historique des transactions
func (s *UserService) GetTransactions(ctx context.Context, userID string, limit int) ([]*models.Transaction, error) {
	// À implémenter avec le service de facturation
	return []*models.Transaction{}, nil
}

// GetPrivacySettings retourne les paramètres de confidentialité
func (s *UserService) GetPrivacySettings(ctx context.Context, userID string) (*models.PrivacySettings, error) {
	// À implémenter avec le repository des paramètres de confidentialité
	return &models.PrivacySettings{
		Common:          models.Common{UpdatedAt: time.Now().UTC()},
		DataProcessing:  true,
		MarketingEmails: true,
		Analytics:       true,
		PublicProfile:   false,
	}, nil
}

// UpdatePrivacySettingsInput représente les données pour mettre à jour les paramètres de confidentialité
type UpdatePrivacySettingsInput struct {
	DataProcessing  bool
	MarketingEmails bool
	Analytics      bool
	PublicProfile  bool
}

// UpdatePrivacySettings met à jour les paramètres de confidentialité
func (s *UserService) UpdatePrivacySettings(ctx context.Context, userID string, input UpdatePrivacySettingsInput) (*models.PrivacySettings, error) {
	// À implémenter avec le repository des paramètres de confidentialité
	return &models.PrivacySettings{
		Common:          models.Common{UpdatedAt: time.Now().UTC()},
		DataProcessing:  input.DataProcessing,
		MarketingEmails: input.MarketingEmails,
		Analytics:       input.Analytics,
		PublicProfile:   input.PublicProfile,
	}, nil
}

// GetPersonalDataSummary retourne un résumé des données personnelles
func (s *UserService) GetPersonalDataSummary(ctx context.Context, userID string) (*models.PersonalDataSummary, error) {
	// À implémenter
	return &models.PersonalDataSummary{
		TotalFiles:    0,
		TotalMessages: 0,
		TotalProjects: 0,
		TotalContacts: 0,
		TotalStorage:  0,
	}, nil
}
