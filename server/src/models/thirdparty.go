package models

type ThirdPartyApp struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	AccessLevel string `json:"access_level"`
	ConnectedAt string `json:"connected_at,omitempty"`
}

type ThirdPartyResponse struct {
	Success bool            `json:"success"`
	Data    []ThirdPartyApp `json:"data,omitempty"`
	Error   string          `json:"error,omitempty"`
}

type ConnectAppRequest struct {
	AppName  string `json:"app_name" binding:"required"`
	AuthCode string `json:"auth_code" binding:"required"`
}

type RevokeAppRequest struct {
	AppID string `json:"app_id" binding:"required"`
}
