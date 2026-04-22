package services

import (
	"fmt"

	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
)

// MigrateDiscordAccounts migre les anciens comptes Discord vers le nouveau système ExternalAccount
// Cette fonction peut être appelée au démarrage de l'application ou via une route admin
func (s *ExternalAuthService) MigrateDiscordAccounts() error {
	// Récupérer tous les utilisateurs avec DiscordLinked=true
	var users []models.User
	if err := s.DB.Where("discord_linked = ?", true).Find(&users).Error; err != nil {
		return fmt.Errorf("failed to fetch users with Discord linked: %w", err)
	}

	migratedCount := 0
	existingCount := 0
	errorCount := 0

	for _, user := range users {
		// Vérifier si un compte externe Discord existe déjà
		var existing models.ExternalAccount
		err := s.DB.Where("user_id = ? AND provider = ?", user.ID, "discord").First(&existing).Error
		if err == nil {
			// Déjà migré
			existingCount++
			continue
		}

		// Créer le compte externe
		externalAccount := &models.ExternalAccount{
			UserID:            user.ID,
			Provider:          "discord",
			ProviderAccountID: *user.DiscordID,
			Email:             nil, // Non disponible dans l'ancien système
			DisplayName:       user.Name,
			IsPrimary:         false,
		}

		if err := s.DB.Create(externalAccount).Error; err != nil {
			errorCount++
			continue
		}

		migratedCount++
	}

	fmt.Printf("Discord migration completed: %d migrated, %d already existing, %d errors\n",
		migratedCount, existingCount, errorCount)

	return nil
}

// GetMigrationStatus retourne le statut de la migration Discord
func (s *ExternalAuthService) GetMigrationStatus() map[string]interface{} {
	var totalDiscordUsers int64
	var migratedCount int64
	var unmigratedCount int64

	// Compter les utilisateurs avec DiscordLinked=true
	s.DB.Model(&models.User{}).Where("discord_linked = ?", true).Count(&totalDiscordUsers)

	// Compter les comptes externes Discord
	s.DB.Model(&models.ExternalAccount{}).Where("provider = ?", "discord").Count(&migratedCount)

	unmigratedCount = totalDiscordUsers - migratedCount

	return map[string]interface{}{
		"total_discord_users": totalDiscordUsers,
		"migrated_accounts":   migratedCount,
		"unmigrated_accounts": unmigratedCount,
		"migration_complete":  unmigratedCount == 0,
	}
}

// AutoMigrateExternalAccounts exécute la migration automatique si nécessaire
// Cette fonction peut être appelée au démarrage de l'application
func (s *ExternalAuthService) AutoMigrateExternalAccounts() error {
	// Vérifier si des migrations sont nécessaires
	status := s.GetMigrationStatus()

	if status["unmigrated_accounts"].(int64) > 0 {
		fmt.Printf("Found %d unmigrated Discord accounts, starting migration...\n", status["unmigrated_accounts"])
		return s.MigrateDiscordAccounts()
	}

	fmt.Println("No migration needed - all Discord accounts are up to date")
	return nil
}
