package routers

import (
    "log"
    "github.com/skygenesisenterprise/aether-mailer/routers/pkg/routerpkg"
)

func main() {
    router, err := routerpkg.NewRouter()
    if err != nil {
        log.Fatalf("Failed to create router: %v", err)
    }
    if err := router.Start(); err != nil {
        log.Fatalf("Failed to start router: %v", err)
    }
}
