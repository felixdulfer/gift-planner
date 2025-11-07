package handlers

import (
	"net/http"
	"time"

	"github.com/felixdulfer/gift-planner/backend/internal/database"
	"github.com/gin-gonic/gin"
)

func (h *Handlers) GetGifts(c *gin.Context) {
	wishlistId := c.Param("id")
	var gifts []database.Gift
	if err := h.db.Where("wishlist_id = ?", wishlistId).Preload("Assignments").Find(&gifts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gifts)
}

func (h *Handlers) CreateGift(c *gin.Context) {
	wishlistId := c.Param("id")
	userID, _ := c.Get("userID")

	var giftData struct {
		Name        string  `json:"name" binding:"required"`
		Picture     *string `json:"picture"`
		Link        *string `json:"link"`
		IsQualified bool    `json:"isQualified"`
	}

	if err := c.ShouldBindJSON(&giftData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	gift := database.Gift{
		WishlistID:  wishlistId,
		Name:        giftData.Name,
		Picture:     giftData.Picture,
		Link:        giftData.Link,
		IsQualified: giftData.IsQualified,
		CreatedBy:   userID.(string),
	}

	if err := h.db.Create(&gift).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gift)
}

func (h *Handlers) GetGift(c *gin.Context) {
	id := c.Param("id")
	var gift database.Gift
	if err := h.db.Preload("Assignments").First(&gift, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Gift not found"})
		return
	}

	c.JSON(http.StatusOK, gift)
}

func (h *Handlers) UpdateGift(c *gin.Context) {
	id := c.Param("id")
	var gift database.Gift
	if err := h.db.First(&gift, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Gift not found"})
		return
	}

	var updateData struct {
		Name        *string `json:"name"`
		Picture     *string `json:"picture"`
		Link        *string `json:"link"`
		IsQualified *bool   `json:"isQualified"`
	}

	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if updateData.Name != nil {
		gift.Name = *updateData.Name
	}
	if updateData.Picture != nil {
		gift.Picture = updateData.Picture
	}
	if updateData.Link != nil {
		gift.Link = updateData.Link
	}
	if updateData.IsQualified != nil {
		gift.IsQualified = *updateData.IsQualified
	}

	if err := h.db.Save(&gift).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gift)
}

func (h *Handlers) DeleteGift(c *gin.Context) {
	id := c.Param("id")
	if err := h.db.Delete(&database.Gift{}, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Gift deleted"})
}

func (h *Handlers) GetGiftAssignments(c *gin.Context) {
	giftId := c.Param("id")
	var assignments []database.GiftAssignment
	if err := h.db.Where("gift_id = ?", giftId).Preload("AssignedToUser").Preload("AssignedByUser").Find(&assignments).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, assignments)
}

func (h *Handlers) CreateGiftAssignment(c *gin.Context) {
	giftId := c.Param("id")
	userID, _ := c.Get("userID")

	var assignmentData struct {
		AssignedToUserID string `json:"assignedToUserId" binding:"required"`
	}

	if err := c.ShouldBindJSON(&assignmentData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	assignment := database.GiftAssignment{
		GiftID:           giftId,
		AssignedToUserID: assignmentData.AssignedToUserID,
		AssignedBy:       userID.(string),
	}

	if err := h.db.Create(&assignment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, assignment)
}

func (h *Handlers) UpdateGiftAssignment(c *gin.Context) {
	id := c.Param("id")
	var assignment database.GiftAssignment
	if err := h.db.First(&assignment, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Assignment not found"})
		return
	}

	var updateData struct {
		IsPurchased *bool      `json:"isPurchased"`
		PurchasedAt *time.Time `json:"purchasedAt"`
	}

	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if updateData.IsPurchased != nil {
		assignment.IsPurchased = *updateData.IsPurchased
		if *updateData.IsPurchased && assignment.PurchasedAt == nil {
			now := time.Now()
			assignment.PurchasedAt = &now
		}
	}
	if updateData.PurchasedAt != nil {
		assignment.PurchasedAt = updateData.PurchasedAt
	}

	if err := h.db.Save(&assignment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, assignment)
}

func (h *Handlers) DeleteGiftAssignment(c *gin.Context) {
	id := c.Param("id")
	if err := h.db.Delete(&database.GiftAssignment{}, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Assignment deleted"})
}

