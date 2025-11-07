package handlers

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"io"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

type BeginRegistrationRequest struct {
	UserID string `json:"userId" binding:"required"`
}

type FinishRegistrationRequest struct {
	UserID    string                 `json:"userId" binding:"required"`
	SessionID string                 `json:"sessionId" binding:"required"`
	Credential map[string]interface{} `json:"credential" binding:"required"`
}

type BeginLoginRequest struct {
	Email string `json:"email" binding:"required,email"`
}

type FinishLoginRequest struct {
	UserID    string                 `json:"userId" binding:"required"`
	SessionID string                 `json:"sessionId" binding:"required"`
	Credential map[string]interface{} `json:"credential" binding:"required"`
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

	// Create a new request body with just the credential for the webauthn library
	credentialBody, err := json.Marshal(req.Credential)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid credential format: " + err.Error()})
		return
	}

	// Replace the request body with just the credential
	// The go-webauthn library reads from the request body directly
	originalBody := c.Request.Body
	c.Request.Body = io.NopCloser(bytes.NewReader(credentialBody))
	c.Request.ContentLength = int64(len(credentialBody))
	c.Request.Header.Set("Content-Type", "application/json")

	// Call FinishRegistration with the modified request
	if err := h.webauthnService.FinishRegistration(req.UserID, req.SessionID, c.Request); err != nil {
		// Restore original body before returning
		c.Request.Body = originalBody
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Restore original body
	c.Request.Body = originalBody

	c.JSON(http.StatusOK, gin.H{"message": "Registration successful"})
}

func (h *Handlers) BeginLogin(c *gin.Context) {
	var req BeginLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Normalize email to lowercase for consistent lookup
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))

	sessionID, userId, session, err := h.webauthnService.BeginLogin(req.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"sessionId": sessionID,
		"session":   session,
		"userId":    userId,
	})
}

func (h *Handlers) FinishLogin(c *gin.Context) {
	var req FinishLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Create a new request body with just the credential for the webauthn library
	credentialBody, err := json.Marshal(req.Credential)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid credential format"})
		return
	}

	// Fix userHandle encoding if it's a plain string UUID
	// The go-webauthn library expects base64url encoded bytes
	var credentialData map[string]interface{}
	if err := json.Unmarshal(credentialBody, &credentialData); err == nil {
		if response, ok := credentialData["response"].(map[string]interface{}); ok {
			if userHandle, ok := response["userHandle"].(string); ok {
				// Check if it's a plain UUID string (contains hyphens)
				if len(userHandle) == 36 && strings.Count(userHandle, "-") == 4 {
					// Convert UUID string to bytes, then to base64url
					userHandleBytes := []byte(userHandle)
					userHandleBase64 := base64.RawURLEncoding.EncodeToString(userHandleBytes)
					response["userHandle"] = userHandleBase64
					// Re-marshal the credential with the fixed userHandle
					credentialBody, _ = json.Marshal(credentialData)
				}
			}
		}
	}

	// Replace the request body with just the credential
	// The go-webauthn library reads from the request body directly
	originalBody := c.Request.Body
	c.Request.Body = io.NopCloser(bytes.NewReader(credentialBody))
	c.Request.ContentLength = int64(len(credentialBody))
	c.Request.Header.Set("Content-Type", "application/json")

	// Call FinishLogin with the modified request
	if err := h.webauthnService.FinishLogin(req.UserID, req.SessionID, c.Request); err != nil {
		// Restore original body before returning
		c.Request.Body = originalBody
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Restore original body
	c.Request.Body = originalBody

	c.JSON(http.StatusOK, gin.H{"message": "Login successful"})
}

