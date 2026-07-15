package services

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"errors"
	"fmt"
	"strings"

	"github.com/skygenesisenterprise/aether-account/server/src/config"
	"golang.org/x/crypto/argon2"
)

const maxPasswordBytes = 4096

type PasswordHasher struct {
	memory      uint32
	iterations  uint32
	parallelism uint8
	saltLength  uint32
	keyLength   uint32
}

func NewPasswordHasher(cfg config.AuthConfig) *PasswordHasher {
	return &PasswordHasher{
		memory:      cfg.Argon2Memory,
		iterations:  cfg.Argon2Iterations,
		parallelism: cfg.Argon2Parallelism,
		saltLength:  16,
		keyLength:   32,
	}
}

func (h *PasswordHasher) Hash(password string) (string, error) {
	if err := validatePasswordInput(password); err != nil {
		return "", err
	}
	salt := make([]byte, h.saltLength)
	if _, err := rand.Read(salt); err != nil {
		return "", err
	}
	hash := argon2.IDKey([]byte(password), salt, h.iterations, h.memory, h.parallelism, h.keyLength)
	return fmt.Sprintf(
		"$argon2id$v=19$m=%d,t=%d,p=%d$%s$%s",
		h.memory,
		h.iterations,
		h.parallelism,
		base64.RawStdEncoding.EncodeToString(salt),
		base64.RawStdEncoding.EncodeToString(hash),
	), nil
}

func (h *PasswordHasher) Verify(password, encodedHash string) (bool, error) {
	if err := validatePasswordInput(password); err != nil {
		return false, err
	}
	params, salt, expected, err := parseArgon2Hash(encodedHash)
	if err != nil {
		return false, err
	}
	hash := argon2.IDKey([]byte(password), salt, params.iterations, params.memory, params.parallelism, uint32(len(expected)))
	return subtle.ConstantTimeCompare(hash, expected) == 1, nil
}

func (h *PasswordHasher) NeedsRehash(encodedHash string) bool {
	params, _, _, err := parseArgon2Hash(encodedHash)
	if err != nil {
		return true
	}
	return params.memory != h.memory || params.iterations != h.iterations || params.parallelism != h.parallelism
}

type parsedHashParams struct {
	memory      uint32
	iterations  uint32
	parallelism uint8
}

func parseArgon2Hash(encodedHash string) (parsedHashParams, []byte, []byte, error) {
	parts := strings.Split(encodedHash, "$")
	if len(parts) != 6 || parts[1] != "argon2id" || parts[2] != "v=19" {
		return parsedHashParams{}, nil, nil, errors.New("invalid argon2id hash format")
	}
	var params parsedHashParams
	if _, err := fmt.Sscanf(parts[3], "m=%d,t=%d,p=%d", &params.memory, &params.iterations, &params.parallelism); err != nil {
		return parsedHashParams{}, nil, nil, errors.New("invalid argon2id parameters")
	}
	salt, err := base64.RawStdEncoding.DecodeString(parts[4])
	if err != nil {
		return parsedHashParams{}, nil, nil, errors.New("invalid argon2id salt")
	}
	hash, err := base64.RawStdEncoding.DecodeString(parts[5])
	if err != nil {
		return parsedHashParams{}, nil, nil, errors.New("invalid argon2id hash")
	}
	return params, salt, hash, nil
}

func validatePasswordInput(password string) error {
	if password == "" {
		return errors.New("password is required")
	}
	if len(password) > maxPasswordBytes {
		return errors.New("password is too large")
	}
	return nil
}
