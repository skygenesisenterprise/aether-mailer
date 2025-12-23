package main

import (
	"log"

	"skygenesisenterprise/server/cmd/server"
)

func main() {
	log.Println("🚀 Starting Aether Mailer Server...")

	server, err := server.NewServer()
	if err != nil {
		log.Fatalf("❌ Failed to create server: %v", err)
	}

	if err := server.Start(); err != nil {
		log.Fatalf("❌ Failed to start server: %v", err)
	}
}
