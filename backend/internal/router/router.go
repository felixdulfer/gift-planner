package router

import (
	"github.com/felixdulfer/gift-planner/backend/internal/auth"
	"github.com/felixdulfer/gift-planner/backend/internal/config"
	"github.com/felixdulfer/gift-planner/backend/internal/handlers"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func Setup(db *gorm.DB, cfg *config.Config) *gin.Engine {
	r := gin.Default()

	// CORS configuration
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{cfg.WebAuthnRPOrigin, "http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With"},
		ExposeHeaders:    []string{"Content-Length", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           12 * 60 * 60, // 12 hours
	}))

	// Initialize WebAuthn service
	webauthnService, err := auth.NewWebAuthnService(cfg, db)
	if err != nil {
		panic("Failed to initialize WebAuthn service: " + err.Error())
	}

	// Initialize handlers
	h := handlers.NewHandlers(db, webauthnService)

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// Auth routes (public)
	authGroup := r.Group("/api/auth")
	{
		authGroup.POST("/users", h.CreateUser) // Create user before WebAuthn registration
		authGroup.POST("/register/begin", h.BeginRegistration)
		authGroup.POST("/register/finish", h.FinishRegistration)
		authGroup.POST("/login/begin", h.BeginLogin)
		authGroup.POST("/login/finish", h.FinishLogin)
	}

	// Protected routes
	api := r.Group("/api")
	api.Use(auth.AuthMiddleware(db))
	{
		// Users
		api.GET("/users", h.GetUsers)
		api.GET("/users/:id", h.GetUser)
		api.PUT("/users/:id", h.UpdateUser)

		// Groups
		api.GET("/groups", h.GetGroups)
		api.POST("/groups", h.CreateGroup)
		
		// Group Members (must be before /groups/:id)
		api.GET("/groups/:id/members", h.GetGroupMembers)
		api.POST("/groups/:id/members", h.AddGroupMember)
		api.DELETE("/groups/:id/members/:memberId", h.RemoveGroupMember)
		
		// Events (must be before /groups/:id)
		api.GET("/groups/:id/events", h.GetEvents)
		api.POST("/groups/:id/events", h.CreateEvent)
		
		// Group CRUD (after nested routes)
		api.GET("/groups/:id", h.GetGroup)
		api.PUT("/groups/:id", h.UpdateGroup)
		api.DELETE("/groups/:id", h.DeleteGroup)

		// Events CRUD
		api.GET("/events/:id", h.GetEvent)
		api.PUT("/events/:id", h.UpdateEvent)
		api.DELETE("/events/:id", h.DeleteEvent)

		// Receivers (must be before /events/:id)
		api.GET("/events/:id/receivers", h.GetReceivers)
		api.POST("/events/:id/receivers", h.CreateReceiver)
		
		// Receivers CRUD
		api.GET("/receivers/:id", h.GetReceiver)
		api.PUT("/receivers/:id", h.UpdateReceiver)
		api.DELETE("/receivers/:id", h.DeleteReceiver)

		// Wishlists (must be before /receivers/:id)
		api.GET("/receivers/:id/wishlists", h.GetWishlists)
		api.POST("/receivers/:id/wishlists", h.CreateWishlist)
		
		// Wishlists CRUD
		api.GET("/wishlists/:id", h.GetWishlist)
		api.PUT("/wishlists/:id", h.UpdateWishlist)
		api.DELETE("/wishlists/:id", h.DeleteWishlist)

		// Gifts (must be before /wishlists/:id)
		api.GET("/wishlists/:id/gifts", h.GetGifts)
		api.POST("/wishlists/:id/gifts", h.CreateGift)
		
		// Gifts CRUD
		api.GET("/gifts/:id", h.GetGift)
		api.PUT("/gifts/:id", h.UpdateGift)
		api.DELETE("/gifts/:id", h.DeleteGift)

		// Gift Assignments (must be before /gifts/:id)
		api.GET("/gifts/:id/assignments", h.GetGiftAssignments)
		api.POST("/gifts/:id/assignments", h.CreateGiftAssignment)
		
		// Gift Assignments CRUD
		api.PUT("/assignments/:id", h.UpdateGiftAssignment)
		api.DELETE("/assignments/:id", h.DeleteGiftAssignment)
	}

	return r
}

