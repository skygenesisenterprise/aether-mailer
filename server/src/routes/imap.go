package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/skygenesisenterprise/aether-mailer/server/src/controllers"
	"github.com/skygenesisenterprise/aether-mailer/server/src/middleware"
)

// IMAPRoutes handles IMAP routes
type IMAPRoutes struct {
	imapController *controllers.IMAPController
	authMiddleware *middleware.AuthMiddleware
}

// NewIMAPRoutes creates new IMAP routes
func NewIMAPRoutes(imapController *controllers.IMAPController, authMiddleware *middleware.AuthMiddleware) *IMAPRoutes {
	return &IMAPRoutes{
		imapController: imapController,
		authMiddleware: authMiddleware,
	}
}

// SetupRoutes configures IMAP routes
func (r *IMAPRoutes) SetupRoutes(router *gin.RouterGroup) {
	imap := router.Group("/imap")
	{
		// Apply authentication middleware to all IMAP routes
		imap.Use(r.authMiddleware.AuthenticateToken())

		// Mailbox routes
		mailboxes := imap.Group("/mailboxes")
		{
			mailboxes.GET("", r.imapController.GetMailboxes)
			mailboxes.POST("", r.imapController.CreateMailbox)
			mailboxes.GET("/:id", r.imapController.GetMailbox)
			mailboxes.PUT("/:id", r.imapController.GetMailbox) // Placeholder for update
			mailboxes.DELETE("/:id", r.imapController.DeleteMailbox)
			mailboxes.GET("/:id/stats", r.imapController.GetMailboxStats)
			mailboxes.POST("/:id/expunge", r.imapController.ExpungeMailbox)

			// Message routes within mailboxes
			mailboxes.GET("/:id/messages", r.imapController.GetMessages)
			mailboxes.POST("/:id/search", r.imapController.SearchMessages)
			mailboxes.GET("/:id/messages/:messageId", r.imapController.GetMessage)
			mailboxes.PUT("/:id/messages/:messageId/flags", r.imapController.UpdateMessageFlags)
			mailboxes.POST("/:id/messages/:messageId/move", r.imapController.MoveMessage)
			mailboxes.DELETE("/:id/messages/:messageId", r.imapController.DeleteMessage)
		}

		// Global message routes
		messages := imap.Group("/messages")
		{
			messages.POST("/search", r.imapController.SearchMessages)
		}
	}
}

// EmailRoutes handles generic email routes
type EmailRoutes struct {
	imapController *controllers.IMAPController
	smtpController *controllers.SMTPController
	authMiddleware *middleware.AuthMiddleware
}

// NewEmailRoutes creates new email routes
func NewEmailRoutes(imapController *controllers.IMAPController, smtpController *controllers.SMTPController, authMiddleware *middleware.AuthMiddleware) *EmailRoutes {
	return &EmailRoutes{
		imapController: imapController,
		smtpController: smtpController,
		authMiddleware: authMiddleware,
	}
}

// SetupRoutes configures email routes
func (r *EmailRoutes) SetupRoutes(router *gin.RouterGroup) {
	email := router.Group("/emails")
	{
		// Apply authentication middleware to all email routes
		email.Use(r.authMiddleware.AuthenticateToken())

		// Send email (proxies to SMTP)
		email.POST("/send", r.smtpController.SendEmail)

		// Get emails (proxies to IMAP)
		email.GET("", func(ctx *gin.Context) {
			// Default to INBOX if no mailbox specified
			ctx.Params = gin.Params{
				gin.Param{Key: "id", Value: "INBOX"},
			}
			r.imapController.GetMessages(ctx)
		})

		// Search emails (proxies to IMAP)
		email.POST("/search", r.imapController.SearchMessages)

		// Get specific email
		email.GET("/:id", func(ctx *gin.Context) {
			messageID := ctx.Param("id")
			ctx.Params = gin.Params{
				gin.Param{Key: "id", Value: "INBOX"},
				gin.Param{Key: "messageId", Value: messageID},
			}
			r.imapController.GetMessage(ctx)
		})

		// Update email flags
		email.PUT("/:id/flags", func(ctx *gin.Context) {
			messageID := ctx.Param("id")
			ctx.Params = gin.Params{
				gin.Param{Key: "id", Value: "INBOX"},
				gin.Param{Key: "messageId", Value: messageID},
			}
			r.imapController.UpdateMessageFlags(ctx)
		})

		// Move email
		email.POST("/:id/move", func(ctx *gin.Context) {
			messageID := ctx.Param("id")
			ctx.Params = gin.Params{
				gin.Param{Key: "id", Value: "INBOX"},
				gin.Param{Key: "messageId", Value: messageID},
			}
			r.imapController.MoveMessage(ctx)
		})

		// Delete email
		email.DELETE("/:id", func(ctx *gin.Context) {
			messageID := ctx.Param("id")
			ctx.Params = gin.Params{
				gin.Param{Key: "id", Value: "INBOX"},
				gin.Param{Key: "messageId", Value: messageID},
			}
			r.imapController.DeleteMessage(ctx)
		})

		// Mark as read/unread
		email.PUT("/:id/read", func(ctx *gin.Context) {
			var req struct {
				Read bool `json:"read"`
			}
			ctx.ShouldBindJSON(&req)

			flags := []string{}
			if req.Read {
				flags = append(flags, "\\Seen")
			}

			messageID := ctx.Param("id")
			ctx.Params = gin.Params{
				gin.Param{Key: "id", Value: "INBOX"},
				gin.Param{Key: "messageId", Value: messageID},
			}
			ctx.Set("flags", flags)
			r.imapController.UpdateMessageFlags(ctx)
		})

		// Star/unstar email
		email.PUT("/:id/star", func(ctx *gin.Context) {
			var req struct {
				Starred bool `json:"starred"`
			}
			ctx.ShouldBindJSON(&req)

			flags := []string{}
			if req.Starred {
				flags = append(flags, "\\Flagged")
			}

			messageID := ctx.Param("id")
			ctx.Params = gin.Params{
				gin.Param{Key: "id", Value: "INBOX"},
				gin.Param{Key: "messageId", Value: messageID},
			}
			ctx.Set("flags", flags)
			r.imapController.UpdateMessageFlags(ctx)
		})

		// Archive email
		email.POST("/:id/archive", func(ctx *gin.Context) {
			messageID := ctx.Param("id")
			ctx.Params = gin.Params{
				gin.Param{Key: "id", Value: "INBOX"},
				gin.Param{Key: "messageId", Value: messageID},
			}

			// Move to Archive mailbox
			ctx.Set("targetMailboxId", "Archive")
			r.imapController.MoveMessage(ctx)
		})
	}
}
