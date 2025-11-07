package handlers

import (
	"net/http"
	"time"

	"github.com/felixdulfer/gift-planner/backend/internal/database"
	"github.com/gin-gonic/gin"
)

func (h *Handlers) GetEvents(c *gin.Context) {
	groupId := c.Param("id")
	var events []database.Event
	if err := h.db.Where("group_id = ?", groupId).Find(&events).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, events)
}

func (h *Handlers) CreateEvent(c *gin.Context) {
	groupId := c.Param("id")
	userID, _ := c.Get("userID")

	var eventData struct {
		Name        string     `json:"name" binding:"required"`
		Description *string    `json:"description"`
		Date        *time.Time `json:"date"`
	}

	if err := c.ShouldBindJSON(&eventData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	event := database.Event{
		GroupID:     groupId,
		Name:        eventData.Name,
		Description: eventData.Description,
		Date:        eventData.Date,
		CreatedBy:   userID.(string),
	}

	if err := h.db.Create(&event).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, event)
}

func (h *Handlers) GetEvent(c *gin.Context) {
	id := c.Param("id")
	var event database.Event
	if err := h.db.Preload("Receivers").Preload("Wishlists").First(&event, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Event not found"})
		return
	}

	c.JSON(http.StatusOK, event)
}

func (h *Handlers) UpdateEvent(c *gin.Context) {
	id := c.Param("id")
	var event database.Event
	if err := h.db.First(&event, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Event not found"})
		return
	}

	var updateData struct {
		Name        *string    `json:"name"`
		Description *string   `json:"description"`
		Date        *time.Time `json:"date"`
	}

	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if updateData.Name != nil {
		event.Name = *updateData.Name
	}
	if updateData.Description != nil {
		event.Description = updateData.Description
	}
	if updateData.Date != nil {
		event.Date = updateData.Date
	}

	if err := h.db.Save(&event).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, event)
}

func (h *Handlers) DeleteEvent(c *gin.Context) {
	id := c.Param("id")
	if err := h.db.Delete(&database.Event{}, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Event deleted"})
}

