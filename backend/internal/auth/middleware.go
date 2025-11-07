package auth

import (
	"net/http"
	"strings"

	"github.com/felixdulfer/gift-planner/backend/internal/database"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func AuthMiddleware(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		// Extract token from "Bearer <token>"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization header format"})
			c.Abort()
			return
		}

		token := parts[1]

		// For now, we'll use a simple user ID token
		// In production, you'd verify a JWT token here
		var user database.User
		if err := db.First(&user, "id = ?", token).Error; err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		// Store user in context
		c.Set("userID", user.ID)
		c.Set("user", user)

		c.Next()
	}
}

