package handlers

import (
	"github.com/felixdulfer/gift-planner/backend/internal/auth"
	"gorm.io/gorm"
)

type Handlers struct {
	db             *gorm.DB
	webauthnService *auth.WebAuthnService
}

func NewHandlers(db *gorm.DB, webauthnService *auth.WebAuthnService) *Handlers {
	return &Handlers{
		db:             db,
		webauthnService: webauthnService,
	}
}

