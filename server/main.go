package main

import (
    "log"
    "github.com/skygenesisenterprise/aether-mailer/server/pkg/serverpkg"
)

func main() {
    server, err := serverpkg.NewServer()
    if err != nil {
        log.Fatalf("Failed to create server: %v", err)
    }
    if err := server.Start(); err != nil {
        log.Fatalf("Failed to start server: %v", err)
    }
}
