package database

import (
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func Connect(databaseURL string) (*gorm.DB, error) {
	db, err := gorm.Open(postgres.Open(databaseURL), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return nil, err
	}

	return db, nil
}

func Migrate(db *gorm.DB) error {
	log.Println("Running database migrations...")

	// Auto-migrate all models
	err := db.AutoMigrate(
		&User{},
		&Group{},
		&GroupMember{},
		&Event{},
		&Receiver{},
		&Wishlist{},
		&Gift{},
		&GiftAssignment{},
		&WebAuthnCredential{},
		&WebAuthnSession{},
	)

	if err != nil {
		return err
	}

	log.Println("Database migrations completed successfully")
	return nil
}

