package handlers

import (
	"net/http"

	"github.com/felixdulfer/gift-planner/backend/internal/database"
	"github.com/gin-gonic/gin"
)

func (h *Handlers) GetGroups(c *gin.Context) {
	userID, _ := c.Get("userID")
	var groups []database.Group

	// Get groups where user is a member or creator
	if err := h.db.Where("created_by = ? OR id IN (SELECT group_id FROM group_members WHERE user_id = ?)", userID, userID).Find(&groups).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, groups)
}

func (h *Handlers) CreateGroup(c *gin.Context) {
	userID, _ := c.Get("userID")

	var groupData struct {
		Name        string  `json:"name" binding:"required"`
		Description *string `json:"description"`
	}

	if err := c.ShouldBindJSON(&groupData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	group := database.Group{
		Name:        groupData.Name,
		Description: groupData.Description,
		CreatedBy:   userID.(string),
	}

	if err := h.db.Create(&group).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Add creator as member
	member := database.GroupMember{
		GroupID: group.ID,
		UserID:  userID.(string),
	}
	h.db.Create(&member)

	c.JSON(http.StatusCreated, group)
}

func (h *Handlers) GetGroup(c *gin.Context) {
	id := c.Param("id")
	var group database.Group
	if err := h.db.Preload("Members").Preload("Events").First(&group, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Group not found"})
		return
	}

	c.JSON(http.StatusOK, group)
}

func (h *Handlers) UpdateGroup(c *gin.Context) {
	id := c.Param("id")
	var group database.Group
	if err := h.db.First(&group, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Group not found"})
		return
	}

	var updateData struct {
		Name        *string `json:"name"`
		Description *string `json:"description"`
	}

	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if updateData.Name != nil {
		group.Name = *updateData.Name
	}
	if updateData.Description != nil {
		group.Description = updateData.Description
	}

	if err := h.db.Save(&group).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, group)
}

func (h *Handlers) DeleteGroup(c *gin.Context) {
	id := c.Param("id")
	if err := h.db.Delete(&database.Group{}, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Group deleted"})
}

func (h *Handlers) GetGroupMembers(c *gin.Context) {
	groupId := c.Param("id")
	var members []database.GroupMember
	if err := h.db.Where("group_id = ?", groupId).Preload("User").Find(&members).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, members)
}

func (h *Handlers) AddGroupMember(c *gin.Context) {
	groupId := c.Param("id")

	var memberData struct {
		UserID string `json:"userId" binding:"required"`
	}

	if err := c.ShouldBindJSON(&memberData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	member := database.GroupMember{
		GroupID: groupId,
		UserID:  memberData.UserID,
	}

	if err := h.db.Create(&member).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, member)
}

func (h *Handlers) RemoveGroupMember(c *gin.Context) {
	memberId := c.Param("memberId")
	if err := h.db.Delete(&database.GroupMember{}, "id = ?", memberId).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Member removed"})
}

