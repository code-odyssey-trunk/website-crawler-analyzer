package database

import (
	"fmt"
	"log"
	"os"

	"website-crawler/internal/models"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

// InitDB initializes the database connection and runs migrations
func InitDB() (*gorm.DB, error) {
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_HOST"),
		os.Getenv("DB_PORT"),
		os.Getenv("DB_NAME"),
	)

	// Set default values if not provided
	if os.Getenv("DB_HOST") == "" {
		dsn = "crawler:crawlerpass@tcp(localhost:3306)/website_crawler?charset=utf8mb4&parseTime=True&loc=Local"
	}

	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	// Auto migrate the schema
	if err := db.AutoMigrate(&models.User{}, &models.URL{}, &models.Analysis{}); err != nil {
		return nil, fmt.Errorf("failed to migrate database: %w", err)
	}

	// Create default user if none exists
	var userCount int64
	db.Model(&models.User{}).Count(&userCount)
	if userCount == 0 {
		adminPassword := os.Getenv("ADMIN_PASSWORD")
		if adminPassword == "" {
			log.Fatal("ADMIN_PASSWORD env variable must be set for default admin user")
		}
		hashed, err := bcrypt.GenerateFromPassword([]byte(adminPassword), bcrypt.DefaultCost)
		if err != nil {
			log.Fatal("Failed to hash admin password:", err)
		}
		defaultUser := models.User{
			Email:    "admin@example.com",
			Password: string(hashed),
		}
		if err := db.Create(&defaultUser).Error; err != nil {
			log.Printf("Failed to create default user: %v", err)
		} else {
			log.Println("Created default user: admin@example.com / password")
		}
	}

	DB = db
	return db, nil
}

// GetDB returns the database instance
func GetDB() *gorm.DB {
	return DB
}
