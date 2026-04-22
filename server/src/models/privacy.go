package models

type AccountPrivacySettings struct {
	ProfileVisibility string `json:"profile_visibility"`
	ShowEmail         bool   `json:"show_email"`
	ShowPhone         bool   `json:"show_phone"`
	ShowActivity      bool   `json:"show_activity"`
	DataCollection    bool   `json:"data_collection"`
	PersonalizedAds   bool   `json:"personalized_ads"`
	Analytics         bool   `json:"analytics"`
	LocationTracking  bool   `json:"location_tracking"`
}

type PrivacyResponse struct {
	Success bool                    `json:"success"`
	Data    *AccountPrivacySettings `json:"data,omitempty"`
	Error   string                  `json:"error,omitempty"`
}

type UpdatePrivacyRequest struct {
	ProfileVisibility *string `json:"profile_visibility,omitempty"`
	ShowEmail         *bool   `json:"show_email,omitempty"`
	ShowPhone         *bool   `json:"show_phone,omitempty"`
	ShowActivity      *bool   `json:"show_activity,omitempty"`
	DataCollection    *bool   `json:"data_collection,omitempty"`
	PersonalizedAds   *bool   `json:"personalized_ads,omitempty"`
	Analytics         *bool   `json:"analytics,omitempty"`
	LocationTracking  *bool   `json:"location_tracking,omitempty"`
}

type DeleteAccountRequest struct {
	Password string `json:"password" binding:"required"`
	Confirm  bool   `json:"confirm"`
}

type DataExportRequest struct {
	Format string `json:"format" binding:"required"` // json, csv, pdf
}

type DataExportResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message,omitempty"`
	DataURL string `json:"data_url,omitempty"`
	Error   string `json:"error,omitempty"`
}
