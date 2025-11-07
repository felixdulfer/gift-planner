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

	// Handle migration for email field becoming required
	// Clean up users with null or empty emails before adding NOT NULL constraint
	// This handles the case where the database already has users with null emails
	log.Println("Checking for users with null or empty emails...")
	
	// Try to delete users with null or empty emails and their related data
	// Use raw SQL to handle this safely before GORM tries to alter the column
	var count int64
	if err := db.Raw(`SELECT COUNT(*) FROM users WHERE email IS NULL OR email = ''`).Scan(&count).Error; err == nil && count > 0 {
		log.Printf("Found %d users with null or empty email. Cleaning up...", count)
		
		// Delete related credentials first (to maintain referential integrity)
		db.Exec(`DELETE FROM web_authn_credentials WHERE user_id IN (SELECT id FROM users WHERE email IS NULL OR email = '')`)
		
		// Delete related sessions
		db.Exec(`DELETE FROM web_authn_sessions WHERE user_id IN (SELECT id FROM users WHERE email IS NULL OR email = '')`)
		
		// Delete users with null or empty emails
		db.Exec(`DELETE FROM users WHERE email IS NULL OR email = ''`)
		
		log.Printf("Deleted %d users without email addresses", count)
	}

	// Auto-migrate all models
	// This will now succeed since we've cleaned up null emails
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

