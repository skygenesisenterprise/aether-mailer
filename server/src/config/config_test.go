package config

import "testing"

func TestValidateMinimalConfig(t *testing.T) {
	t.Parallel()

	cfg := Config{
		Server: ServerConfig{Port: "8080"},
		Auth: AuthConfig{
			Mode:                   "jwt",
			JWTSecret:              "secret",
			LocalEnabled:           true,
			JWTIssuer:              "test",
			JWTAccessTTL:           1,
			JWTRefreshTTL:          1,
			EmailVerificationTTL:   1,
			PasswordResetTTL:       1,
			SessionCleanupInterval: 1,
			PasswordMinLength:      8,
			Argon2Memory:           1,
			Argon2Iterations:       1,
			Argon2Parallelism:      1,
		},
		Database: DatabaseConfig{URL: "host=localhost"},
	}

	if err := cfg.Validate(); err != nil {
		t.Fatalf("unexpected validation error: %v", err)
	}
}

func TestValidateProductionRequiresStrongJWTSecret(t *testing.T) {
	t.Parallel()

	cfg := Config{
		App:    AppConfig{Env: "production"},
		Server: ServerConfig{Port: "8080"},
		Auth: AuthConfig{
			Enabled:  true,
			Mode:     "jwt",
			JWTSecret: "weak",
			LocalEnabled:           true,
			JWTIssuer:              "test",
			JWTAccessTTL:           1,
			JWTRefreshTTL:          1,
			EmailVerificationTTL:   1,
			PasswordResetTTL:       1,
			SessionCleanupInterval: 1,
			PasswordMinLength:      8,
			Argon2Memory:           1,
			Argon2Iterations:       1,
			Argon2Parallelism:      1,
		},
		Database: DatabaseConfig{URL: "host=localhost"},
	}

	if err := cfg.Validate(); err == nil {
		t.Fatal("expected validation error for weak JWT secret")
	}
}
