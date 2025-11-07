package auth

import (
	"encoding/json"
	"errors"
	"net/http"
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
	Email       *string
	Credentials []database.WebAuthnCredential
}

func (u *UserModel) WebAuthnID() []byte {
	return []byte(u.ID)
}

func (u *UserModel) WebAuthnName() string {
	return u.Name
}

func (u *UserModel) WebAuthnDisplayName() string {
	if u.Email != nil {
		return *u.Email
	}
	return u.Name
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

	credential, err := s.webauthn.FinishRegistration(userModel, session, r)
	if err != nil {
		return err
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

func (s *WebAuthnService) BeginLogin(userID string) (string, *webauthn.SessionData, error) {
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

	_, session, err := s.webauthn.BeginLogin(userModel)
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

	credential, err := s.webauthn.FinishLogin(userModel, session, r)
	if err != nil {
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

