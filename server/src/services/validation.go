package services

import (
	"errors"
	"regexp"
	"strings"
	"unicode"
)

// Validation errors
var (
	ErrInvalidEmail        = errors.New("invalid email format")
	ErrEmailExists         = errors.New("email already exists")
	ErrPasswordTooShort    = errors.New("password must be at least 8 characters")
	ErrPasswordTooLong     = errors.New("password must be at most 128 characters")
	ErrPasswordNoUppercase = errors.New("password must contain at least one uppercase letter")
	ErrPasswordNoLowercase = errors.New("password must contain at least one lowercase letter")
	ErrPasswordNoNumber    = errors.New("password must contain at least one number")
	ErrPasswordNoSpecial   = errors.New("password must contain at least one special character")
	ErrPasswordsDontMatch  = errors.New("passwords do not match")
	ErrNameTooShort        = errors.New("name must be at least 2 characters")
	ErrNameTooLong         = errors.New("name must be at most 100 characters")
	ErrUserInactive        = errors.New("user account is inactive")
)

// emailRegex pattern pour validation d'email
var emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)

// ValidateEmail vérifie le format de l'email
func ValidateEmail(email string) error {
	email = strings.TrimSpace(strings.ToLower(email))

	if email == "" {
		return ErrInvalidEmail
	}

	if len(email) > 254 {
		return ErrInvalidEmail
	}

	if !emailRegex.MatchString(email) {
		return ErrInvalidEmail
	}

	return nil
}

// ValidatePassword vérifie la complexité du mot de passe
func ValidatePassword(password string) error {
	if len(password) < 8 {
		return ErrPasswordTooShort
	}

	if len(password) > 128 {
		return ErrPasswordTooLong
	}

	var (
		hasUpper   bool
		hasLower   bool
		hasNumber  bool
		hasSpecial bool
	)

	for _, char := range password {
		switch {
		case unicode.IsUpper(char):
			hasUpper = true
		case unicode.IsLower(char):
			hasLower = true
		case unicode.IsNumber(char):
			hasNumber = true
		case unicode.IsPunct(char) || unicode.IsSymbol(char):
			hasSpecial = true
		}
	}

	if !hasUpper {
		return ErrPasswordNoUppercase
	}
	if !hasLower {
		return ErrPasswordNoLowercase
	}
	if !hasNumber {
		return ErrPasswordNoNumber
	}
	if !hasSpecial {
		return ErrPasswordNoSpecial
	}

	return nil
}

// ValidateName vérifie la validité du nom
func ValidateName(name string) error {
	name = strings.TrimSpace(name)

	if len(name) < 2 {
		return ErrNameTooShort
	}

	if len(name) > 100 {
		return ErrNameTooLong
	}

	return nil
}

// ValidateRegistrationInput valide toutes les entrées d'inscription
func ValidateRegistrationInput(name, email, password, confirmPassword string) error {
	// Valider le nom
	if err := ValidateName(name); err != nil {
		return err
	}

	// Valider l'email
	if err := ValidateEmail(email); err != nil {
		return err
	}

	// Valider le mot de passe
	if err := ValidatePassword(password); err != nil {
		return err
	}

	// Vérifier que les mots de passe correspondent
	if password != confirmPassword {
		return ErrPasswordsDontMatch
	}

	return nil
}

// SanitizeEmail nettoie et normalise l'email
func SanitizeEmail(email string) string {
	return strings.TrimSpace(strings.ToLower(email))
}

// SanitizeName nettoie le nom
func SanitizeName(name string) string {
	return strings.TrimSpace(name)
}
