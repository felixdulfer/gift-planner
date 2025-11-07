package auth

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/felixdulfer/gift-planner/backend/internal/config"
	"github.com/felixdulfer/gift-planner/backend/internal/database"
	"github.com/go-webauthn/webauthn/webauthn"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type WebAuthnService struct {
	webauthn *webauthn.WebAuthn
	db       *gorm.DB
}

type UserModel struct {
	ID          string
	Name        string
	Email       string
	Credentials []database.WebAuthnCredential
}

func (u *UserModel) WebAuthnID() []byte {
	return []byte(u.ID)
}

func (u *UserModel) WebAuthnName() string {
	return u.Name
}

func (u *UserModel) WebAuthnDisplayName() string {
	return u.Email
}

func (u *UserModel) WebAuthnIcon() string {
	return ""
}

func (u *UserModel) WebAuthnCredentials() []webauthn.Credential {
	creds := make([]webauthn.Credential, len(u.Credentials))
	for i, c := range u.Credentials {
		creds[i] = webauthn.Credential{
			ID:              c.CredentialID,
			PublicKey:       c.PublicKey,
			AttestationType: "",
			Authenticator: webauthn.Authenticator{
				AAGUID:    []byte{},
				SignCount: c.Counter,
			},
		}
	}
	return creds
}

func NewWebAuthnService(cfg *config.Config, db *gorm.DB) (*WebAuthnService, error) {
	w, err := webauthn.New(&webauthn.Config{
		RPDisplayName: cfg.WebAuthnRPName,
		RPID:          cfg.WebAuthnRPID,
		RPOrigins:     []string{cfg.WebAuthnRPOrigin},
	})

	if err != nil {
		return nil, err
	}

	return &WebAuthnService{
		webauthn: w,
		db:       db,
	}, nil
}

func (s *WebAuthnService) BeginRegistration(userID string) (string, *webauthn.SessionData, error) {
	var user database.User
	if err := s.db.Preload("Credentials").First(&user, "id = ?", userID).Error; err != nil {
		return "", nil, err
	}

	userModel := &UserModel{
		ID:          user.ID,
		Name:        user.Name,
		Email:       user.Email,
		Credentials: user.Credentials,
	}

	_, session, err := s.webauthn.BeginRegistration(userModel)
	if err != nil {
		return "", nil, err
	}

	// Store session data
	sessionData, _ := json.Marshal(session)
	sessionRecord := database.WebAuthnSession{
		UserID:      &userID,
		Challenge:   []byte(session.Challenge),
		SessionData: sessionData,
		ExpiresAt:   time.Now().Add(5 * time.Minute),
	}

	if err := s.db.Create(&sessionRecord).Error; err != nil {
		return "", nil, err
	}

	return sessionRecord.ID.String(), session, nil
}

func (s *WebAuthnService) FinishRegistration(userID, sessionID string, r *http.Request) error {
	sessionUUID, err := uuid.Parse(sessionID)
	if err != nil {
		return errors.New("invalid session ID")
	}

	var sessionRecord database.WebAuthnSession
	if err := s.db.First(&sessionRecord, "id = ?", sessionUUID).Error; err != nil {
		return errors.New("session not found")
	}

	if time.Now().After(sessionRecord.ExpiresAt) {
		return errors.New("session expired")
	}

	var user database.User
	if err := s.db.Preload("Credentials").First(&user, "id = ?", userID).Error; err != nil {
		return err
	}

	userModel := &UserModel{
		ID:          user.ID,
		Name:        user.Name,
		Email:       user.Email,
		Credentials: user.Credentials,
	}

	var session webauthn.SessionData
	if err := json.Unmarshal(sessionRecord.SessionData, &session); err != nil {
		return err
	}

	// Log the request body for debugging
	bodyBytes, _ := io.ReadAll(r.Body)
	r.Body = io.NopCloser(bytes.NewReader(bodyBytes))
	log.Printf("[WebAuthn] Request body length: %d bytes", len(bodyBytes))
	log.Printf("[WebAuthn] Request body: %s", string(bodyBytes))

	credential, err := s.webauthn.FinishRegistration(userModel, session, r)
	if err != nil {
		// Log the full error for debugging
		errorMsg := err.Error()
		log.Printf("[WebAuthn] Error: %s", errorMsg)
		// Return the full error message
		return fmt.Errorf("Parse error for Registration: %w", err)
	}

	// Store credential
	cred := database.WebAuthnCredential{
		UserID:       userID,
		CredentialID: credential.ID,
		PublicKey:    credential.PublicKey,
		Counter:      credential.Authenticator.SignCount,
	}

	if err := s.db.Create(&cred).Error; err != nil {
		return err
	}

	// Delete session
	s.db.Delete(&sessionRecord)

	return nil
}

func (s *WebAuthnService) BeginLogin(email string) (string, string, *webauthn.SessionData, error) {
	// Normalize email to lowercase for consistent lookup
	email = strings.ToLower(strings.TrimSpace(email))
	
	var user database.User
	if err := s.db.Preload("Credentials").First(&user, "LOWER(email) = ?", email).Error; err != nil {
		return "", "", nil, err
	}

	userModel := &UserModel{
		ID:          user.ID,
		Name:        user.Name,
		Email:       user.Email,
		Credentials: user.Credentials,
	}

	_, session, err := s.webauthn.BeginLogin(userModel)
	if err != nil {
		return "", "", nil, err
	}

	// Store session data
	sessionData, _ := json.Marshal(session)
	sessionRecord := database.WebAuthnSession{
		UserID:      &user.ID,
		Challenge:   []byte(session.Challenge),
		SessionData: sessionData,
		ExpiresAt:   time.Now().Add(5 * time.Minute),
	}

	if err := s.db.Create(&sessionRecord).Error; err != nil {
		return "", "", nil, err
	}

	return sessionRecord.ID.String(), user.ID, session, nil
}

func (s *WebAuthnService) FinishLogin(userID, sessionID string, r *http.Request) error {
	sessionUUID, err := uuid.Parse(sessionID)
	if err != nil {
		return errors.New("invalid session ID")
	}

	var sessionRecord database.WebAuthnSession
	if err := s.db.First(&sessionRecord, "id = ?", sessionUUID).Error; err != nil {
		return errors.New("session not found")
	}

	if time.Now().After(sessionRecord.ExpiresAt) {
		return errors.New("session expired")
	}

	// Use the userID from the session record if available, otherwise use the provided userID
	// This ensures we're using the correct user ID that was used during BeginLogin
	var lookupUserID string
	if sessionRecord.UserID != nil {
		lookupUserID = *sessionRecord.UserID
	} else {
		lookupUserID = userID
	}

	var user database.User
	if err := s.db.Preload("Credentials").First(&user, "id = ?", lookupUserID).Error; err != nil {
		return err
	}

	userModel := &UserModel{
		ID:          user.ID,
		Name:        user.Name,
		Email:       user.Email,
		Credentials: user.Credentials,
	}

	var session webauthn.SessionData
	if err := json.Unmarshal(sessionRecord.SessionData, &session); err != nil {
		return err
	}

	// Log for debugging
	log.Printf("[WebAuthn FinishLogin] User ID from session record: %s", lookupUserID)
	log.Printf("[WebAuthn FinishLogin] User ID from userModel: %s", userModel.ID)
	log.Printf("[WebAuthn FinishLogin] User ID bytes: %v", userModel.WebAuthnID())
	log.Printf("[WebAuthn FinishLogin] Session data UserID: %v", session.UserID)
	log.Printf("[WebAuthn FinishLogin] Session data raw: %s", string(sessionRecord.SessionData))

	// Log the request body for debugging
	bodyBytes, _ := io.ReadAll(r.Body)
	r.Body = io.NopCloser(bytes.NewReader(bodyBytes))
	log.Printf("[WebAuthn FinishLogin] Request body: %s", string(bodyBytes))
	
	// Parse the credential to see what userHandle it contains
	var credentialData map[string]interface{}
	if err := json.Unmarshal(bodyBytes, &credentialData); err == nil {
		if response, ok := credentialData["response"].(map[string]interface{}); ok {
			if userHandle, ok := response["userHandle"].(string); ok {
				log.Printf("[WebAuthn FinishLogin] UserHandle from authenticator (base64): %s", userHandle)
				// Decode base64url userHandle
				userHandleBytes, err := base64.RawURLEncoding.DecodeString(userHandle)
				if err == nil {
					log.Printf("[WebAuthn FinishLogin] UserHandle from authenticator (decoded): %s", string(userHandleBytes))
				}
			} else {
				log.Printf("[WebAuthn FinishLogin] No userHandle in response")
			}
		}
	}
	
	// Reset body for the library
	r.Body = io.NopCloser(bytes.NewReader(bodyBytes))
	
	// Ensure the userModel ID matches the lookupUserID exactly
	// This is critical for userHandle validation
	if userModel.ID != lookupUserID {
		log.Printf("[WebAuthn FinishLogin] WARNING: User ID mismatch! userModel.ID=%s, lookupUserID=%s", userModel.ID, lookupUserID)
		// Update userModel to use the correct ID
		userModel.ID = lookupUserID
	}

	credential, err := s.webauthn.FinishLogin(userModel, session, r)
	if err != nil {
		// Check if it's a BackupEligible flag inconsistency - this can happen with some authenticators
		// We need to check if the credential is still valid despite this warning
		errorMsg := err.Error()
		if strings.Contains(errorMsg, "BackupEligible") || strings.Contains(errorMsg, "backup") {
			log.Printf("[WebAuthn FinishLogin] Warning: BackupEligible flag inconsistency detected: %v", err)
			// This is a validation warning, but we should still return the error
			// The go-webauthn library is strict about this validation
			// Users may need to re-register their authenticator
			return fmt.Errorf("authenticator validation failed: %w. Please try re-registering your security key", err)
		}
		log.Printf("[WebAuthn FinishLogin] Error: %v", err)
		return err
	}

	// Update credential counter
	var cred database.WebAuthnCredential
	if err := s.db.Where("credential_id = ?", credential.ID).First(&cred).Error; err != nil {
		return err
	}

	cred.Counter = credential.Authenticator.SignCount
	if err := s.db.Save(&cred).Error; err != nil {
		return err
	}

	// Delete session
	s.db.Delete(&sessionRecord)

	return nil
}

func (s *WebAuthnService) GetSession(sessionID string) (*webauthn.SessionData, error) {
	sessionUUID, err := uuid.Parse(sessionID)
	if err != nil {
		return nil, errors.New("invalid session ID")
	}

	var sessionRecord database.WebAuthnSession
	if err := s.db.First(&sessionRecord, "id = ?", sessionUUID).Error; err != nil {
		return nil, err
	}

	if time.Now().After(sessionRecord.ExpiresAt) {
		return nil, errors.New("session expired")
	}

	var session webauthn.SessionData
	if err := json.Unmarshal(sessionRecord.SessionData, &session); err != nil {
		return nil, err
	}

	return &session, nil
}

