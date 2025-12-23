package routes

import (

	"github.com/skygenesisenterprise/aether-mailer/server/src/controllers"
	"github.com/skygenesisenterprise/aether-mailer/server/src/middleware"
	"github.com/gin-gonic/gin"
)

// UserRoutes handles user management routes
type UserRoutes struct {
	userController *controllers.UserController
	authMiddleware *middleware.AuthMiddleware
}

// NewUserRoutes creates new user routes
func NewUserRoutes(userController *controllers.UserController, authMiddleware *middleware.AuthMiddleware) *UserRoutes {
	return &UserRoutes{
		userController: userController,
		authMiddleware: authMiddleware,
	}
}

// SetupRoutes configures user routes
func (r *UserRoutes) SetupRoutes(router *gin.RouterGroup) {
	// Apply authentication middleware to all user routes
	users := router.Group("/users")
	users.Use(r.authMiddleware.AuthenticateToken())
	{
		// User CRUD operations
		users.GET("/", r.userController.GetUsers)
		users.GET("/:id", r.userController.GetUserByID)
		users.POST("/", r.userController.CreateUser)
		users.PUT("/:id", r.userController.UpdateUser)
		users.DELETE("/:id", r.userController.DeleteUser)

		// Password management
		users.PUT("/:id/change-password", r.userController.ChangePassword)

		// User suspension/activation
		users.PUT("/:id/suspend", r.userController.SuspendUser)
		users.PUT("/:id/activate", r.userController.ActivateUser)

		// User statistics
		users.GET("/stats", r.userController.GetUserStats)
	}
}
