package models

import "time"

type LoginRequest struct {
	Email         string `json:"email" binding:"required"`
	Password      string `json:"password" binding:"required"`
	ClientID      string `json:"clientId"`
	RedirectURI   string `json:"redirectUri"`
	PostLoginPath string `json:"postLoginPath"`
}

type RegisterRequest struct {
	Name            string `json:"name" binding:"required"`
	Email           string `json:"email" binding:"required"`
	Password        string `json:"password" binding:"required"`
	ConfirmPassword string `json:"confirmPassword" binding:"required"`
}

type JWTTokenResponse struct {
	AccessToken  string `json:"accessToken"`
	RefreshToken string `json:"refreshToken"`
	ExpiresIn    int    `json:"expiresIn"`
}

type RefreshTokenRequest struct {
	RefreshToken string `json:"refreshToken" binding:"required"`
}

type RefreshTokenData struct {
	UserID    uint      `json:"userId"`
	Token     string    `json:"token"`
	ExpiresAt time.Time `json:"expiresAt"`
	ClientID  string    `json:"clientId"`
	IPAddress string    `json:"ipAddress"`
	UserAgent string    `json:"userAgent"`
	CreatedAt time.Time `json:"createdAt"`
}

type LoginResponse struct {
	Success bool   `json:"success"`
	User    *User  `json:"user,omitempty"`
	Error   string `json:"error,omitempty"`
}
