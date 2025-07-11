package api

import (
	"website-crawler/internal/api/handlers"
	"website-crawler/internal/middleware"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// SetupRoutes configures all API routes
func SetupRoutes(r *gin.Engine, db *gorm.DB) {
	// Initialize handlers
	authHandler := handlers.NewAuthHandler(db)
	wsHandler := handlers.NewWebSocketHandler()
	urlHandler := handlers.NewURLHandler(db, wsHandler)

	// Public routes
	api := r.Group("/api")
	{
		// Authentication routes
		auth := api.Group("/auth")
		{
			auth.POST("/login", authHandler.Login)
			auth.POST("/register", authHandler.Register)
			auth.POST("/logout", authHandler.Logout)
		}

		// WebSocket route
		api.GET("/ws", wsHandler.HandleWebSocket)

		// Protected routes
		protected := api.Group("/")
		protected.Use(middleware.AuthMiddleware())
		{
			// URL management
			urls := protected.Group("/urls")
			{
				urls.GET("", urlHandler.ListURLs)
				urls.POST("", urlHandler.AddURL)
				urls.GET("/:id", urlHandler.GetURL)
				urls.PUT("/:id/rerun", urlHandler.RerunAnalysis)
				urls.DELETE("/:id", urlHandler.DeleteURL)
				urls.POST("/bulk-delete", urlHandler.BulkDelete)
				urls.POST("/bulk-rerun", urlHandler.BulkRerun)
			}
		}
	}
}
