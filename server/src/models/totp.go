package models

import (
	"image"
)

// TOTPResponse représente la réponse lors de la génération d'une clé TOTP
// Elle contient la clé secrète, le QR code et l'URL pour l'application TOTP
type TOTPResponse struct {
	Secret string      `json:"secret"`
	QRCode image.Image `json:"qrCode"`
	URL    string      `json:"url"`
}

// TOTPVerifyRequest représente la requête pour vérifier un code TOTP
type TOTPVerifyRequest struct {
	Secret string `json:"secret"`
	Code   string `json:"code"`
}

// TOTPLoginRequest représente la requête de connexion avec TOTP
type TOTPLoginRequest struct {
	Email     string `json:"email"`
	Password  string `json:"password"`
	TOTPCode  string `json:"totpCode"`
}

// TOTPStatusResponse représente le statut du 2FA pour un utilisateur
type TOTPStatusResponse struct {
	Enabled bool `json:"enabled"`
}
