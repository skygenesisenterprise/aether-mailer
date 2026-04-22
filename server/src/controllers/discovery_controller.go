package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/skygenesisenterprise/aether-mailer/server/src/config"
)

// DiscoveryResponse représente la réponse de discovery OpenID Connect
type DiscoveryResponse struct {
	Issuer                      string   `json:"issuer"`
	AuthorizationEndpoint       string   `json:"authorization_endpoint"`
	TokenEndpoint               string   `json:"token_endpoint"`
	UserInfoEndpoint            string   `json:"userinfo_endpoint"`
	JwksURI                     string   `json:"jwks_uri"`
	RegistrationEndpoint        string   `json:"registration_endpoint,omitempty"`
	ScopesSupported             []string `json:"scopes_supported"`
	ResponseTypesSupported      []string `json:"response_types_supported"`
	ResponseModesSupported      []string `json:"response_modes_supported,omitempty"`
	GrantTypesSupported         []string `json:"grant_types_supported"`
	SubjectTypesSupported       []string `json:"subject_types_supported"`
	IDTokenSigningAlgValuesSupported []string `json:"id_token_signing_alg_values_supported"`
	TokenEndpointAuthMethodsSupported []string `json:"token_endpoint_auth_methods_supported"`
	TokenEndpointAuthSigningAlgValuesSupported []string `json:"token_endpoint_auth_signing_alg_values_supported,omitempty"`
	RevocationEndpoint          string   `json:"revocation_endpoint,omitempty"`
	RevocationEndpointAuthMethodsSupported []string `json:"revocation_endpoint_auth_methods_supported,omitempty"`
	CodeChallengeMethodsSupported []string `json:"code_challenge_methods_supported,omitempty"`
	IntrospectionEndpoint       string   `json:"introspection_endpoint,omitempty"`
	IntrospectionEndpointAuthMethodsSupported []string `json:"introspection_endpoint_auth_methods_supported,omitempty"`
	ClaimsSupported             []string `json:"claims_supported,omitempty"`
	ServiceDocumentation       string   `json:"service_documentation,omitempty"`
	UILocalesSupported          []string `json:"ui_locales_supported,omitempty"`
	ClaimsLocalesSupported      []string `json:"claims_locales_supported,omitempty"`
	IDTokenEncryptionAlgValuesSupported []string `json:"id_token_encryption_alg_values_supported,omitempty"`
	IDTokenEncryptionEncValuesSupported []string `json:"id_token_encryption_enc_values_supported,omitempty"`
	UserInfoEncryptionAlgValuesSupported []string `json:"userinfo_encryption_alg_values_supported,omitempty"`
	UserInfoEncryptionEncValuesSupported []string `json:"userinfo_encryption_enc_values_supported,omitempty"`
	RequestObjectSigningAlgValuesSupported []string `json:"request_object_signing_alg_values_supported,omitempty"`
	RequestObjectEncryptionAlgValuesSupported []string `json:"request_object_encryption_alg_values_supported,omitempty"`
	RequestObjectEncryptionEncValuesSupported []string `json:"request_object_encryption_enc_values_supported,omitempty"`
	MTLSEndpointAliases         []string `json:"mtls_endpoint_aliases,omitempty"`
	AuthorizationSigningAlgValuesSupported []string `json:"authorization_signing_alg_values_supported,omitempty"`
	AuthorizationEncryptionAlgValuesSupported []string `json:"authorization_encryption_alg_values_supported,omitempty"`
	AuthorizationEncryptionEncValuesSupported []string `json:"authorization_encryption_enc_values_supported,omitempty"`
}

// DiscoveryHandler gère les requêtes de discovery OpenID Connect
func DiscoveryHandler(c *gin.Context) {
	cfg := config.LoadOAuthConfig()
	
	response := DiscoveryResponse{
		Issuer:                      cfg.IssuerURL,
		AuthorizationEndpoint:       cfg.IssuerURL + cfg.AuthorizationURL,
		TokenEndpoint:               cfg.IssuerURL + cfg.TokenURL,
		UserInfoEndpoint:            cfg.IssuerURL + cfg.UserInfoURL,
		JwksURI:                     cfg.IssuerURL + cfg.JWKSURL,
		RegistrationEndpoint:        "", // Non implémenté pour l'instant
		ScopesSupported:             cfg.Scopes,
		ResponseTypesSupported:      cfg.ResponseTypes,
		ResponseModesSupported:      []string{"query", "fragment", "form_post"},
		GrantTypesSupported:         cfg.GrantTypes,
		SubjectTypesSupported:       []string{"public"},
		IDTokenSigningAlgValuesSupported: []string{"RS256", "HS256"},
		TokenEndpointAuthMethodsSupported: []string{"client_secret_basic", "client_secret_post"},
		TokenEndpointAuthSigningAlgValuesSupported: []string{"RS256", "HS256"},
		RevocationEndpoint:          cfg.IssuerURL + cfg.RevocationURL,
		RevocationEndpointAuthMethodsSupported: []string{"client_secret_basic", "client_secret_post"},
		CodeChallengeMethodsSupported: []string{"plain", "S256"},
		IntrospectionEndpoint:       cfg.IssuerURL + "/api/v1/oauth2/introspect",
		IntrospectionEndpointAuthMethodsSupported: []string{"client_secret_basic", "client_secret_post"},
		ClaimsSupported: []string{
			"sub",
			"name",
			"given_name",
			"family_name",
			"email",
			"email_verified",
			"preferred_username",
			"profile",
			"picture",
			"website",
			"gender",
			"birthdate",
			"zoneinfo",
			"locale",
			"phone_number",
			"phone_number_verified",
			"address",
			"updated_at",
		},
		ServiceDocumentation:       "https://aether-identity.example.com/docs",
		UILocalesSupported:          []string{"en-US", "fr-FR"},
		ClaimsLocalesSupported:      []string{"en-US", "fr-FR"},
		IDTokenEncryptionAlgValuesSupported: []string{"RSA-OAEP", "RSA-OAEP-256"},
		IDTokenEncryptionEncValuesSupported: []string{"A128CBC-HS256", "A192CBC-HS384", "A256CBC-HS512", "A128GCM", "A192GCM", "A256GCM"},
		UserInfoEncryptionAlgValuesSupported: []string{"RSA-OAEP", "RSA-OAEP-256"},
		UserInfoEncryptionEncValuesSupported: []string{"A128CBC-HS256", "A192CBC-HS384", "A256CBC-HS512", "A128GCM", "A192GCM", "A256GCM"},
		RequestObjectSigningAlgValuesSupported: []string{"none", "HS256", "HS384", "HS512", "RS256", "RS384", "RS512", "ES256", "ES384", "ES512", "PS256", "PS384", "PS512"},
		RequestObjectEncryptionAlgValuesSupported: []string{"RSA-OAEP", "RSA-OAEP-256", "A128KW", "A192KW", "A256KW"},
		RequestObjectEncryptionEncValuesSupported: []string{"A128CBC-HS256", "A192CBC-HS384", "A256CBC-HS512", "A128GCM", "A192GCM", "A256GCM"},
		MTLSEndpointAliases: []string{
			"token_endpoint",
			"userinfo_endpoint",
			"revocation_endpoint",
			"introspection_endpoint",
		},
		AuthorizationSigningAlgValuesSupported: []string{"HS256", "HS384", "HS512", "RS256", "RS384", "RS512", "ES256", "ES384", "ES512", "PS256", "PS384", "PS512"},
		AuthorizationEncryptionAlgValuesSupported: []string{"RSA-OAEP", "RSA-OAEP-256", "A128KW", "A192KW", "A256KW"},
		AuthorizationEncryptionEncValuesSupported: []string{"A128CBC-HS256", "A192CBC-HS384", "A256CBC-HS512", "A128GCM", "A192GCM", "A256GCM"},
	}
	
	c.JSON(http.StatusOK, response)
}

// JWKSHandler gère les requêtes JWKS (JSON Web Key Set)
func JWKSHandler(c *gin.Context) {
	// Pour l'instant, retourner une clé de test
	// En production, vous devriez utiliser une bibliothèque comme "github.com/lestrrat-go/jwx/jwk"
	jwks := map[string]interface{}{
		"keys": []map[string]interface{}{
			{
				"kty": "RSA",
				"use": "sig",
				"kid": "test-key-1",
				"alg": "RS256",
				"n": "ofgWCuLjybRlzo0tZWJjNiuSfb4p4fAkd_wWJcyQoTbji9k0l8W26mPddxHmfHQp-Vaw-4qPCJrcS2mJPMEzP1Pt0Bm4d4QlL-yRT-SFd2lZS-pCgNMsD1W_YpRPEwOWvG6b32690r2jZ47soMZo9wGzjb_7OMogn6ZtWHJ9E1tYI0SGSYxphA04eWIw0RzPrNAtLmZqRlgvBp6TNI2sCv-4n88i266w3bXrBlvXtMJ2t2VBMhDl1m8lUdUvT4LTrjxcmA-o3hGbLZG9iBx93T93853C45466X4Xy2uC8oh6593j4P9zHJz61uCOpz8GCkFYmgmGCxR3MIuUcNqoX4XQ",
				"e": "AQAB",
			},
		},
	}
	
	c.JSON(http.StatusOK, jwks)
}
