package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/skygenesisenterprise/aether-mailer/server/src/controllers"
	"github.com/skygenesisenterprise/aether-mailer/server/src/middleware"
)

func SetupRoutes(r *gin.Engine) {
	api := r.Group("/api/v1")
	{
		auth := api.Group("/auth")
		{
			auth.POST("/login", controllers.Login)
			auth.POST("/register", controllers.Register)
			auth.POST("/logout", controllers.Logout)
			auth.POST("/refresh", controllers.RefreshToken)
			auth.POST("/change-password", controllers.ChangePassword)
			auth.POST("/reset-password", controllers.ResetPassword)
			auth.POST("/token", controllers.Token)
			auth.GET("/authorize", controllers.Authorize)
			auth.POST("/authorize", controllers.AuthorizeSubmit)
			auth.POST("/request-password-reset", controllers.RequestPasswordReset)
			auth.POST("/confirm-password-reset", controllers.ConfirmPasswordReset)

			totp := auth.Group("/totp")
			{
				totp.POST("/login", controllers.TOTPLogin)
				totp.GET("/setup", controllers.TOTPSetup)
				totp.POST("/verify", controllers.TOTPVerify)
				totp.GET("/status", controllers.TOTPStatus)
				totp.POST("/disable", controllers.TOTPDisable)
			}

			external := auth.Group("/external")
			{
				external.GET("/providers", controllers.ListProviders)
				external.GET("/:provider", controllers.ExternalLogin)
				external.GET("/:provider/callback", controllers.ExternalCallback)
			}
		}

		oauth2 := api.Group("/oauth2")
		{
			oauth2.GET("/.well-known/openid-configuration", controllers.OIDCDiscovery)
			oauth2.GET("/jwks", controllers.JWKS)
			oauth2.GET("/userinfo", controllers.UserInfo)
			oauth2.POST("/revoke", controllers.RevokeToken)
		}

		api.POST("/account/me", controllers.GetAccountMe)

		profile := api.Group("/profile")
		{
			profile.GET("", controllers.GetProfile)
			profile.PUT("", controllers.UpdateProfile)
			profile.POST("/avatar", controllers.UploadAvatar)
		}

		passwords := api.Group("/passwords")
		{
			passwords.GET("", controllers.ListPasswords)
			passwords.GET("/:id", controllers.GetPassword)
			passwords.POST("", controllers.CreatePassword)
			passwords.PUT("/:id", controllers.UpdatePassword)
			passwords.DELETE("/:id", controllers.DeletePassword)
		}

		security := api.Group("/security")
		{
			security.GET("", controllers.GetSecurityInfo)
			security.GET("/devices", controllers.ListDevices)
			security.GET("/sessions", controllers.ListSessions)
			security.GET("/activities", controllers.ListActivities)
			security.POST("/devices/:id/trust", controllers.TrustDevice)
			security.DELETE("/devices/:id", controllers.RevokeDevice)
			security.DELETE("/sessions/:id", controllers.RevokeSession)
			security.POST("/2fa/enable", controllers.Enable2FA)
			security.POST("/2fa/disable", controllers.Disable2FA)
			security.POST("/2fa/verify", controllers.Verify2FA)

			mfa := security.Group("/mfa")
			{
				mfa.GET("/methods", controllers.ListMfaMethods)
				mfa.GET("/methods/:id", controllers.GetMfaMethod)
				mfa.PATCH("/methods/:id", controllers.UpdateMfaMethod)
				mfa.GET("/policies", controllers.ListMfaPolicies)
				mfa.POST("/policies", controllers.CreateMfaPolicy)
				mfa.PATCH("/policies/:id", controllers.UpdateMfaPolicy)
				mfa.DELETE("/policies/:id", controllers.DeleteMfaPolicy)
				mfa.GET("/stats", controllers.GetMfaStats)
				mfa.GET("/activity", controllers.GetMfaActivity)
			}

			attack := security.Group("/attack-protection")
			{
				attack.GET("", controllers.GetAttackProtection)
				attack.PATCH("", controllers.UpdateAttackProtection)
				attack.GET("/brute-force", controllers.GetBruteForceSettings)
				attack.PATCH("/brute-force", controllers.UpdateBruteForceSettings)
				attack.GET("/breached-passwords", controllers.GetBreachedPasswords)
				attack.PATCH("/breached-passwords", controllers.UpdateBreachedPasswords)
			}

			security.GET("/analytics", controllers.GetSecurityAnalytics)
			security.GET("/analytics/threats", controllers.GetThreats)
			security.GET("/monitoring", controllers.GetSecurityMonitoring)
		}

		connections := api.Group("/connections")
		{
			connections.GET("", controllers.ListConnections)
			connections.GET("/:id", controllers.GetConnection)
			connections.POST("", controllers.CreateConnection)
			connections.PATCH("/:id", controllers.UpdateConnection)
			connections.DELETE("/:id", controllers.DeleteConnection)
			connections.POST("/:id/enable", controllers.EnableConnection)
			connections.POST("/:id/disable", controllers.DisableConnection)

			db := connections.Group("/database")
			{
				db.GET("", controllers.ListDatabaseConnections)
				db.POST("", controllers.CreateDatabaseConnection)
				db.PATCH("/:id", controllers.UpdateDatabaseConnection)
			}

			social := connections.Group("/social")
			{
				social.GET("", controllers.ListSocialConnections)
				social.POST("", controllers.CreateSocialConnection)
			}

			enterprise := connections.Group("/enterprise")
			{
				enterprise.GET("", controllers.ListEnterpriseConnections)
				enterprise.POST("/saml", controllers.CreateSAMLConnection)
				enterprise.POST("/oidc", controllers.CreateOIDCConnection)
				enterprise.POST("/ad", controllers.CreateADConnection)
			}

			passwordless := connections.Group("/passwordless")
			{
				passwordless.GET("", controllers.ListPasswordlessConnections)
				passwordless.POST("", controllers.CreatePasswordlessConnection)
			}

			authProfiles := connections.Group("/authentication-profiles")
			{
				authProfiles.GET("", controllers.ListAuthProfiles)
				authProfiles.POST("", controllers.CreateAuthProfile)
			}
		}

		users := api.Group("/users")
		{
			users.GET("/:id", controllers.GetUser)
			users.PATCH("/:id", controllers.UpdateUser)
			users.DELETE("/:id", controllers.DeleteUser)
			users.POST("/:id/block", controllers.BlockUser)
			users.POST("/:id/unblock", controllers.UnblockUser)
			users.POST("/:id/reset-password", controllers.ResetUserPassword)
			users.POST("/:id/send-email", controllers.SendUserEmail)
			users.POST("/:id/force-logout", controllers.ForceLogoutUser)
		}

		admin := api.Group("/admin")
		{
			adminUsers := admin.Group("/users")
			{
				adminUsers.GET("", controllers.ListUsers)
				adminUsers.GET("/:id", controllers.GetUserAdmin)
				adminUsers.POST("", controllers.CreateUser)
				adminUsers.PATCH("/:id", controllers.UpdateUser)
				adminUsers.DELETE("/:id", controllers.DeleteUser)
			}

			adminFooterLinks := admin.Group("/footer-links")
			{
				adminFooterLinks.POST("", controllers.CreateFooterLink)
				adminFooterLinks.PUT("/:id", controllers.UpdateFooterLink)
				adminFooterLinks.DELETE("/:id", controllers.DeleteFooterLink)
			}
		}

		applications := api.Group("/applications")
		{
			applications.GET("", controllers.ListApplications)
			applications.GET("/:id", controllers.GetApplication)
			applications.POST("", controllers.CreateApplication)
			applications.PATCH("/:id", controllers.UpdateApplication)
			applications.DELETE("/:id", controllers.DeleteApplication)
			applications.GET("/:id/credentials", controllers.GetAppCredentials)
			applications.POST("/:id/rotate-secret", controllers.RotateSecret)
			applications.GET("/:id/stats", controllers.GetAppStats)
		}

		organizations := api.Group("/organizations")
		{
			organizations.GET("", controllers.ListOrganizations)
			organizations.GET("/:id", controllers.GetOrganization)
			organizations.POST("", controllers.CreateOrganization)
			organizations.PATCH("/:id", controllers.UpdateOrganization)
			organizations.DELETE("/:id", controllers.DeleteOrganization)
			organizations.GET("/:id/members", controllers.ListOrgMembers)
			organizations.POST("/:id/members", controllers.AddOrgMember)
			organizations.DELETE("/:id/members/:userId", controllers.RemoveOrgMember)
			organizations.PATCH("/:id/members/:userId", controllers.UpdateOrgMember)
		}

		contacts := api.Group("/contacts")
		{
			contacts.GET("", controllers.ListContacts)
			contacts.GET("/:id", controllers.GetContact)
			contacts.POST("", controllers.CreateContact)
			contacts.PUT("/:id", controllers.UpdateContact)
			contacts.DELETE("/:id", controllers.DeleteContact)
			contacts.GET("/groups", controllers.ListContactGroups)
			contacts.POST("/groups", controllers.CreateContactGroup)
		}

		branding := api.Group("/branding")
		{
			branding.GET("/universal-login", controllers.GetUniversalLogin)
			branding.PATCH("/universal-login", controllers.UpdateUniversalLogin)
			branding.GET("/universal-login/pages", controllers.ListLoginPages)
			branding.POST("/universal-login/pages", controllers.CreateLoginPage)
			branding.PATCH("/universal-login/pages/:id", controllers.UpdateLoginPage)
			branding.GET("/custom-login", controllers.GetCustomLogin)
			branding.PATCH("/custom-login", controllers.UpdateCustomLogin)
			branding.GET("/templates", controllers.ListTemplates)
			branding.POST("/templates", controllers.CreateTemplate)
			branding.PATCH("/templates/:id", controllers.UpdateTemplate)
			branding.DELETE("/templates/:id", controllers.DeleteTemplate)

			domains := branding.Group("/custom-domains")
			{
				domains.GET("", controllers.ListDomains)
				domains.POST("", controllers.CreateDomain)
				domains.PATCH("/:id", controllers.UpdateDomain)
				domains.DELETE("/:id", controllers.DeleteDomain)
				domains.POST("/:id/verify", controllers.VerifyDomain)
			}
		}

		logs := api.Group("/logs")
		{
			logs.GET("", controllers.ListLogs)
			logs.GET("/:id", controllers.GetLog)
			logs.GET("/stats", controllers.GetLogStats)
			logs.GET("/export", controllers.ExportLogs)
			logs.GET("/stream", controllers.StreamLogs)

			actionLogs := logs.Group("/actions")
			{
				actionLogs.GET("", controllers.ListActionLogs)
				actionLogs.GET("/:id", controllers.GetActionLog)
				actionLogs.GET("/stats", controllers.GetActionLogStats)
			}
		}

		monitoring := api.Group("/monitoring")
		{
			monitoring.GET("/status", controllers.GetStatus)
			monitoring.GET("/health", controllers.GetHealth)
		}

		activity := api.Group("/activity")
		{
			activity.GET("", controllers.GetActivity)
			activity.GET("/dau", controllers.GetDAU)
			activity.GET("/retention", controllers.GetRetention)
			activity.GET("/signups", controllers.GetSignups)
		}

		stats := api.Group("/stats")
		{
			stats.GET("", controllers.GetStats)
			stats.GET("/users", controllers.GetUserStats)
			stats.GET("/sessions", controllers.GetSessionStats)
		}

		events := api.Group("/events")
		{
			events.GET("", controllers.ListEvents)
			events.GET("/:id", controllers.GetEvent)
			events.GET("/stats", controllers.GetEventStats)
		}

		marketplace := api.Group("/marketplace")
		{
			marketplace.GET("", controllers.ListExtensions)
			marketplace.GET("/:id", controllers.GetExtension)
			marketplace.POST("/:id/install", controllers.InstallExtension)
			marketplace.POST("/:id/uninstall", controllers.UninstallExtension)
			marketplace.GET("/installed", controllers.ListInstalledExtensions)
			marketplace.GET("/trending", controllers.GetTrendingExtensions)
		}

		thirdParty := api.Group("/third-party")
		{
			thirdParty.GET("", controllers.ListThirdPartyApps)
			thirdParty.POST("", controllers.ConnectThirdPartyApp)
			thirdParty.DELETE("/:id", controllers.RevokeThirdPartyApp)
		}

		privacy := api.Group("/privacy")
		{
			privacy.GET("", controllers.GetPrivacySettings)
			privacy.PUT("", controllers.UpdatePrivacySettings)
			privacy.POST("/export", controllers.ExportData)
			privacy.POST("/delete", controllers.DeleteAccount)
		}

		actions := api.Group("/actions")
		{
			actions.GET("", controllers.ListActions)
			actions.GET("/:id", controllers.GetAction)
			actions.POST("", controllers.CreateAction)
			actions.PATCH("/:id", controllers.UpdateAction)
			actions.DELETE("/:id", controllers.DeleteAction)
			actions.POST("/:id/deploy", controllers.DeployAction)
			actions.POST("/:id/test", controllers.TestAction)
			actions.GET("/library", controllers.GetActionLibrary)
			actions.GET("/triggers", controllers.ListTriggers)
			actions.GET("/triggers/mappings", controllers.GetTriggerMappings)
			actions.GET("/triggers/events", controllers.GetTriggerEvents)

			forms := actions.Group("/forms")
			{
				forms.GET("", controllers.ListForms)
				forms.GET("/:id", controllers.GetForm)
				forms.POST("", controllers.CreateForm)
				forms.PATCH("/:id", controllers.UpdateForm)
				forms.DELETE("/:id", controllers.DeleteForm)
				forms.GET("/templates", controllers.ListFormTemplates)
			}
		}

		extensions := api.Group("/extensions")
		{
			extensions.GET("", controllers.ListUserExtensions)
			extensions.GET("/:id", controllers.GetUserExtension)
			extensions.POST("", controllers.CreateUserExtension)
			extensions.PATCH("/:id", controllers.UpdateUserExtension)
			extensions.DELETE("/:id", controllers.DeleteUserExtension)
			extensions.GET("/:id/config", controllers.GetExtensionConfig)
			extensions.PATCH("/:id/config", controllers.UpdateExtensionConfig)
			extensions.GET("/marketplace", controllers.ListMarketplaceExtensions)
		}

		agents := api.Group("/agents")
		{
			agents.GET("", controllers.ListAgents)
			agents.GET("/:id", controllers.GetAgent)
			agents.POST("", controllers.CreateAgent)
			agents.PATCH("/:id", controllers.UpdateAgent)
			agents.DELETE("/:id", controllers.DeleteAgent)
			agents.GET("/:id/status", controllers.GetAgentStatus)
			agents.POST("/:id/restart", controllers.RestartAgent)
		}

		queues := api.Group("/queues")
		{
			queues.GET("/messages", controllers.GetQueuedMessages)
			queues.GET("/reports", controllers.GetQueueReports)
		}

		reports := api.Group("/reports")
		{
			reports.GET("/dmarc", controllers.GetDMARCReports)
			reports.GET("/arf", controllers.GetARFReports)
			reports.GET("/tls", controllers.GetTLSReports)
		}

		footerLinks := api.Group("/footer-links")
		{
			footerLinks.GET("", controllers.ListFooterLinks)
		}

		articles := api.Group("/articles")
		{
			articles.GET("", controllers.ListArticles)
			articles.GET("/:id", controllers.GetArticle)
			articles.GET("/slug/:slug", controllers.GetArticleBySlug)
			articles.POST("", controllers.CreateArticle)
			articles.PUT("/:id", controllers.UpdateArticle)
			articles.DELETE("/:id", controllers.DeleteArticle)
			articles.POST("/:id/publish", controllers.PublishArticle)
			articles.POST("/:id/archive", controllers.ArchiveArticle)
			articles.POST("/:id/feature", controllers.FeatureArticle)
			articles.GET("/homepage", controllers.GetHomepageArticles)
			articles.GET("/section/:section", controllers.GetArticlesBySection)
		}

		categories := api.Group("/categories")
		{
			categories.GET("", controllers.ListCategories)
			categories.GET("/:id", controllers.GetCategory)
			categories.POST("", controllers.CreateCategory)
			categories.PUT("/:id", controllers.UpdateCategory)
			categories.DELETE("/:id", controllers.DeleteCategory)
		}

		comments := api.Group("/comments")
		{
			comments.GET("/article/:articleId", controllers.ListComments)
			comments.POST("", controllers.CreateComment)
			comments.PUT("/:id", controllers.UpdateComment)
			comments.DELETE("/:id", controllers.DeleteComment)
			comments.POST("/:id/flag", controllers.FlagComment)
			comments.POST("/:id/approve", controllers.ApproveComment)
		}

		media := api.Group("/media")
		{
			media.GET("", controllers.ListMedia)
			media.POST("", controllers.UploadMedia)
			media.DELETE("/:id", controllers.DeleteMedia)
		}

		user := api.Group("/user")
		{
			user.GET("/bookmarks", controllers.ListBookmarks)
			user.POST("/bookmarks", controllers.AddBookmark)
			user.DELETE("/bookmarks/:articleId", controllers.RemoveBookmark)
			user.GET("/history", controllers.GetReadHistory)
			user.POST("/history", controllers.AddToHistory)
			user.DELETE("/history", controllers.ClearHistory)
			user.DELETE("/history/:articleId", controllers.RemoveFromHistory)
			user.GET("/notifications", controllers.ListNotifications)
			user.PUT("/notifications/:id/read", controllers.MarkNotificationRead)
			user.PUT("/notifications/read-all", controllers.MarkAllNotificationsRead)
			user.DELETE("/notifications/:id", controllers.DeleteNotification)
			user.GET("/subscription", controllers.GetSubscription)
			user.POST("/subscription", controllers.CreateSubscription)
			user.PUT("/subscription", controllers.UpdateSubscription)
			user.POST("/subscription/cancel", controllers.CancelSubscription)
		}

		settings := api.Group("/settings")
		{
			settings.GET("", controllers.GetSettings)
			settings.PUT("", controllers.UpdateSettings)
			settings.POST("/test-email", controllers.TestEmail)
		}
	}

	r.GET("/health", controllers.HealthCheck)
	r.GET("/ready", controllers.ReadyCheck)
}