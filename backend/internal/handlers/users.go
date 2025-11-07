package handlers

import (
	"net/http"
	"strings"

	"github.com/felixdulfer/gift-planner/backend/internal/database"
	"github.com/gin-gonic/gin"
)

func (h *Handlers) CreateUser(c *gin.Context) {
	var userData struct {
		Name  string `json:"name" binding:"required"`
		Email string `json:"email" binding:"required,email"`
	}

	if err := c.ShouldBindJSON(&userData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Normalize email to lowercase
	userData.Email = strings.ToLower(strings.TrimSpace(userData.Email))

	user := database.User{
		Name:  userData.Name,
		Email: userData.Email,
	}

	if err := h.db.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, user)
}

func (h *Handlers) GetUsers(c *gin.Context) {
	var users []database.User
	if err := h.db.Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, users)
}

func (h *Handlers) GetUser(c *gin.Context) {
	id := c.Param("id")
	var user database.User
	if err := h.db.First(&user, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, user)
}

func (h *Handlers) UpdateUser(c *gin.Context) {
	id := c.Param("id")
	var user database.User
	if err := h.db.First(&user, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	var updateData struct {
		Name  *string `json:"name"`
		Email *string `json:"email" binding:"omitempty,email"`
	}

	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if updateData.Name != nil {
		user.Name = *updateData.Name
	}
	if updateData.Email != nil {
		// Normalize email to lowercase
		normalizedEmail := strings.ToLower(strings.TrimSpace(*updateData.Email))
		user.Email = normalizedEmail
	}

	if err := h.db.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, user)
}

