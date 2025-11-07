package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type BeginRegistrationRequest struct {
	UserID string `json:"userId" binding:"required"`
}

type FinishRegistrationRequest struct {
	UserID    string `json:"userId" binding:"required"`
	SessionID string `json:"sessionId" binding:"required"`
}

type BeginLoginRequest struct {
	UserID string `json:"userId" binding:"required"`
}

type FinishLoginRequest struct {
	UserID    string `json:"userId" binding:"required"`
	SessionID string `json:"sessionId" binding:"required"`
}

func (h *Handlers) BeginRegistration(c *gin.Context) {
	var req BeginRegistrationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	sessionID, session, err := h.webauthnService.BeginRegistration(req.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"sessionId": sessionID,
		"session":   session,
	})
}

func (h *Handlers) FinishRegistration(c *gin.Context) {
	var req FinishRegistrationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.webauthnService.FinishRegistration(req.UserID, req.SessionID, c.Request); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Registration successful"})
}

func (h *Handlers) BeginLogin(c *gin.Context) {
	var req BeginLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	sessionID, session, err := h.webauthnService.BeginLogin(req.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"sessionId": sessionID,
		"session":   session,
	})
}

func (h *Handlers) FinishLogin(c *gin.Context) {
	var req FinishLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.webauthnService.FinishLogin(req.UserID, req.SessionID, c.Request); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Login successful"})
}

