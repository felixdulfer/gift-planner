package handlers

import (
	"net/http"

	"github.com/felixdulfer/gift-planner/backend/internal/database"
	"github.com/gin-gonic/gin"
)

func (h *Handlers) GetReceivers(c *gin.Context) {
	eventId := c.Param("id")
	var receivers []database.Receiver
	if err := h.db.Where("event_id = ?", eventId).Find(&receivers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, receivers)
}

func (h *Handlers) CreateReceiver(c *gin.Context) {
	eventId := c.Param("id")
	userID, _ := c.Get("userID")

	var receiverData struct {
		Name string `json:"name" binding:"required"`
	}

	if err := c.ShouldBindJSON(&receiverData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	receiver := database.Receiver{
		EventID:   eventId,
		Name:      receiverData.Name,
		CreatedBy: userID.(string),
	}

	if err := h.db.Create(&receiver).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, receiver)
}

func (h *Handlers) GetReceiver(c *gin.Context) {
	id := c.Param("id")
	var receiver database.Receiver
	if err := h.db.Preload("Wishlists").First(&receiver, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Receiver not found"})
		return
	}

	c.JSON(http.StatusOK, receiver)
}

func (h *Handlers) UpdateReceiver(c *gin.Context) {
	id := c.Param("id")
	var receiver database.Receiver
	if err := h.db.First(&receiver, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Receiver not found"})
		return
	}

	var updateData struct {
		Name *string `json:"name"`
	}

	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if updateData.Name != nil {
		receiver.Name = *updateData.Name
	}

	if err := h.db.Save(&receiver).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, receiver)
}

func (h *Handlers) DeleteReceiver(c *gin.Context) {
	id := c.Param("id")
	if err := h.db.Delete(&database.Receiver{}, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Receiver deleted"})
}

