package handlers

import (
	"net/http"

	"github.com/felixdulfer/gift-planner/backend/internal/database"
	"github.com/gin-gonic/gin"
)

func (h *Handlers) GetWishlists(c *gin.Context) {
	receiverId := c.Param("id")
	var wishlists []database.Wishlist
	if err := h.db.Where("receiver_id = ?", receiverId).Preload("Gifts").Find(&wishlists).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, wishlists)
}

func (h *Handlers) CreateWishlist(c *gin.Context) {
	receiverId := c.Param("id")
	userID, _ := c.Get("userID")

	var wishlistData struct {
		EventID *string `json:"eventId"`
		Name    *string `json:"name"`
	}

	if err := c.ShouldBindJSON(&wishlistData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	wishlist := database.Wishlist{
		ReceiverID: receiverId,
		EventID:    wishlistData.EventID,
		Name:       wishlistData.Name,
		CreatedBy:  userID.(string),
	}

	if err := h.db.Create(&wishlist).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, wishlist)
}

func (h *Handlers) GetWishlist(c *gin.Context) {
	id := c.Param("id")
	var wishlist database.Wishlist
	if err := h.db.Preload("Gifts").First(&wishlist, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Wishlist not found"})
		return
	}

	c.JSON(http.StatusOK, wishlist)
}

func (h *Handlers) UpdateWishlist(c *gin.Context) {
	id := c.Param("id")
	var wishlist database.Wishlist
	if err := h.db.First(&wishlist, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Wishlist not found"})
		return
	}

	var updateData struct {
		EventID *string `json:"eventId"`
		Name    *string `json:"name"`
	}

	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if updateData.EventID != nil {
		wishlist.EventID = updateData.EventID
	}
	if updateData.Name != nil {
		wishlist.Name = updateData.Name
	}

	if err := h.db.Save(&wishlist).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, wishlist)
}

func (h *Handlers) DeleteWishlist(c *gin.Context) {
	id := c.Param("id")
	if err := h.db.Delete(&database.Wishlist{}, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Wishlist deleted"})
}

