package main

import (
	"log"

	"website-crawler/internal/database"
)

func main() {
	log.Println("Starting database migration...")

	db, err := database.InitDB()
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	log.Println("Database migration completed successfully!")
}
