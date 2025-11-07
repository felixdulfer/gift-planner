package config

import (
	"os"
)

type Config struct {
	DatabaseURL      string
	Environment      string
	WebAuthnRPID     string
	WebAuthnRPOrigin string
	WebAuthnRPName   string
	JWTSecret        string
}

func Load() *Config {
	return &Config{
		DatabaseURL:      getEnv("DATABASE_URL", "postgres://giftplanner:giftplanner@postgres:5432/giftplanner?sslmode=disable"),
		Environment:      getEnv("ENVIRONMENT", "development"),
		WebAuthnRPID:     getEnv("WEBAUTHN_RP_ID", "localhost"),
		WebAuthnRPOrigin: getEnv("WEBAUTHN_RP_ORIGIN", "http://localhost:3000"),
		WebAuthnRPName:   getEnv("WEBAUTHN_RP_NAME", "Gift Planner"),
		JWTSecret:        getEnv("JWT_SECRET", "change-me-in-production"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

