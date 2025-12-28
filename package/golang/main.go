// Main entry point for Aether Mailer Go SDK demonstration
package main

import (
	"fmt"
	"log"
	"time"

	"github.com/skygenesisenterprise/aether-mailer/package/golang/config"
	"github.com/skygenesisenterprise/aether-mailer/package/golang/domain"
)

func main() {
	fmt.Println("Aether Mailer Go SDK")
	fmt.Println("====================")

	// Initialize configuration
	cfg := config.DefaultConfig()

	// Demonstrate basic functionality
	fmt.Printf("Database Host: %s\n", cfg.Database.Host)
	fmt.Printf("Redis Host: %s\n", cfg.Redis.Host)
	fmt.Printf("SMTP Host: %s\n", cfg.SMTP.Host)

	// Create a sample user
	user := &domain.User{
		ID:              "demo-user-001",
		Username:        "demo_user",
		Email:           "demo@example.com",
		PasswordHash:    "hashed_password",
		Role:            domain.UserRoleUser,
		IsActive:        true,
		IsVerified:      true,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
		Timezone:        "UTC",
		Locale:          "en",
		Theme:           "light",
		MaxEmailsPerDay: 100,
		MaxStorageMB:    1024,
	}

	fmt.Printf("Sample user: %+v\n", user)

	// Create a sample message
	message := &domain.Message{
		ID:         "demo-message-001",
		AccountID:  "demo-account-001",
		From:       "sender@example.com",
		To:         []string{"recipient@example.com"},
		Subject:    "Welcome to Aether Mailer",
		BodyText:   stringPtr("This is a demonstration of the Go SDK"),
		Size:       1024,
		IsRead:     false,
		IsDraft:    false,
		IsSent:     false,
		IsDeleted:  false,
		ReceivedAt: time.Now(),
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	}

	fmt.Printf("Sample message: %+v\n", message)
	log.Println("SDK demonstration completed successfully")
}

func stringPtr(s string) *string {
	return &s
}
