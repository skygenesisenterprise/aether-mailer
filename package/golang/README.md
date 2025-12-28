<div align="center">

# 🐹 Aether Mailer Go SDK

[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](https://github.com/skygenesisenterprise/aether-mailer/blob/main/LICENSE) [![Go](https://img.shields.io/badge/Go-1.25+-blue?style=for-the-badge&logo=go)](https://golang.org/) [![GoDoc](https://img.shields.io/badge/godoc-reference-blue?style=for-the-badge)](https://pkg.go.dev/github.com/skygenesisenterprise/aether-mailer/package/golang) [![Go Report Card](https://img.shields.io/badge/go%20report-A+-brightgreen?style=for-the-badge)](https://goreportcard.com/report/github.com/skygenesisenterprise/aether-mailer/package/golang)

**📦 Core Business Logic SDK for Aether Mailer - Domain-Driven Design Architecture**

The definitive Go SDK that encapsulates all mailer business logic, independent from transport layers. Built with clean architecture principles for maximum reusability across distributed systems.

[🚀 Quick Start](#-quick-start) • [📖 Usage](#-usage) • [🏗️ Architecture](#-architecture) • [🔧 Configuration](#-configuration) • [📚 Examples](#-examples)

</div>

---

## 🌟 What is the Aether Mailer Go SDK?

The **Aether Mailer Go SDK** is the **single source of truth** for all Aether Mailer business logic. It provides a clean, testable, and reusable foundation that can be used by:

- **Backend API Servers** (HTTP, gRPC, WebSocket)
- **Infrastructure Routers** (SMTP/IMAP gateways)
- **Background Services** (Workers, processors, schedulers)
- **CLI Tools** (Management utilities)
- **Distributed Nodes** (Multi-node deployments)

### 🎯 **Core Design Principles**

- **Domain-Driven Design** - Clean separation of business logic from infrastructure
- **Framework Agnostic** - No HTTP, database, or web framework dependencies
- **Interface-Based** - All contracts defined as interfaces for maximum flexibility
- **Production Ready** - Built for distributed, multi-node environments
- **Context-Aware** - Full `context.Context` support for cancellation and timeouts
- **Typed Errors** - Comprehensive error handling with detailed error codes

---

## 🚀 Quick Start

### 📋 Prerequisites

- **Go** 1.25.0 or higher
- **Go modules** enabled (default in modern Go)

### 🔧 Installation

```bash
# Get the SDK
go get github.com/skygenesisenterprise/aether-mailer/package/golang

# Import in your code
import "github.com/skygenesisenterprise/aether-mailer/package/golang"
```

### ⚡ Basic Usage

```go
package main

import (
    "context"
    "log"

    "github.com/skygenesisenterprise/aether-mailer/package/golang"
    "github.com/skygenesisenterprise/aether-mailer/package/golang/config"
)

func main() {
    // Load configuration
    cfg := config.DefaultConfig()

    // Initialize SDK (you'll need to provide repository implementations)
    // See the "Repository Implementation" section below
    sdk, err := golang.NewSDK(cfg)
    if err != nil {
        log.Fatal("Failed to initialize SDK:", err)
    }

    // Use SDK services
    ctx := context.Background()

    // Example: Create a user
    user, err := sdk.Services.User.CreateUser(ctx, service.CreateUserRequest{
        Email:    "user@example.com",
        Username: "john_doe",
        Role:     domain.UserRoleUser,
        // ... other fields
    })
    if err != nil {
        log.Printf("Failed to create user: %v", err)
        return
    }

    log.Printf("Created user: %s (%s)", user.DisplayName, user.Email)
}
```

---

## 📖 Usage

### 🔗 **Core Components**

The SDK is organized into several key packages:

```
golang/
├── config/          # Configuration management
├── domain/          # Domain models and events
├── errors/          # Typed error handling
├── repository/      # Data access interfaces
├── service/         # Business logic services
│   ├── user_service.go      # User management
│   ├── domain_service.go    # Domain management
│   ├── message_service.go   # Email message handling
│   ├── quota_service.go     # Quota enforcement
│   └── routing_service.go   # Email routing logic
└── README.md        # This file
```

### 👤 **User Management**

```go
// Create a new user
user, err := userService.CreateUser(ctx, service.CreateUserRequest{
    Email:           "admin@example.com",
    Username:        "admin",
    PasswordHash:    hashedPassword,
    Role:            domain.UserRoleAdmin,
    MaxEmailsPerDay: 500,
    MaxStorageMB:    2048,
})

// Get user by ID
user, err := userService.GetUserByID(ctx, userID)

// Update user
user, err := userService.UpdateUser(ctx, service.UpdateUserRequest{
    ID:          userID,
    DisplayName:  &newDisplayName,
    MaxStorageMB: &newStorageLimit,
})

// List users with filtering
users, err := userService.ListUsers(ctx, repository.UserFilter{
    Role:     &domain.UserRoleUser,
    IsActive: &[]bool{true}[0],
    Limit:     50,
})
```

### 🏢 **Domain Management**

```go
// Create a new domain
domain, err := domainService.CreateDomain(ctx, service.CreateDomainRequest{
    Name:            "example.com",
    OwnerID:         ownerID,
    MaxUsers:        100,
    MaxEmailsPerDay: 1000,
    MaxStorageMB:    10240, // 10GB
})

// Verify a domain
err := domainService.VerifyDomain(ctx, domainID)

// Update domain settings
domain, err := domainService.UpdateDomain(ctx, service.UpdateDomainRequest{
    ID:              domainID,
    SPFRecord:       &spfRecord,
    DKIMSelector:    &dkimSelector,
    DMARCRecord:     &dmarcRecord,
})

// List domains
domains, err := domainService.ListDomains(ctx, repository.DomainFilter{
    IsActive:   &[]bool{true}[0],
    IsVerified: &[]bool{true}[0],
})
```

### 📧 **Message Handling**

```go
// Send a new message
message, err := messageService.SendMessage(ctx, service.SendMessageRequest{
    AccountID:   accountID,
    From:        "sender@example.com",
    To:          []string{"recipient@example.com"},
    Subject:     "Hello from Aether Mailer",
    BodyText:    &textBody,
    BodyHTML:    &htmlBody,
    Attachments: []service.AttachmentRequest{
        {
            Filename:    "document.pdf",
            ContentType: "application/pdf",
            Size:        fileSize,
            Content:     fileBytes,
        },
    },
})

// Retrieve messages
messages, err := messageService.ListMessages(ctx, accountID, repository.MessageFilter{
    IsRead:   &[]bool{false}[0],
    IsSent:   &[]bool{true}[0],
    Limit:     20,
})

// Search messages
results, err := messageService.SearchMessages(ctx, repository.MessageSearchQuery{
    AccountID: accountID,
    Query:     "important project",
    Limit:     10,
})
```

### 📊 **Quota Management**

```go
// Check quota status
status, err := quotaService.GetQuotaStatus(ctx, userID)
if err != nil {
    return err
}

fmt.Printf("Storage: %d/%d MB (%.1f%%)\n",
    status.UsedStorageMB,
    status.MaxStorageMB,
    status.StorageUsagePercent*100)

fmt.Printf("Emails: %d/%d today (%.1f%%)\n",
    status.SentEmailsToday,
    status.MaxEmailsPerDay,
    status.EmailUsagePercent*100)

// Check quota before sending
err := quotaService.CheckQuota(ctx, userID, &domainID)
if err != nil {
    return err // Quota exceeded
}

// Update storage usage
err := quotaService.UpdateStorageUsage(ctx, userID, messageSize)
```

### 🛣️ **Email Routing**

```go
// Route an incoming message
decision, err := routingService.RouteMessage(ctx, message)
if err != nil {
    return err
}

switch decision.Action {
case service.RoutingActionDeliver:
    // Deliver to local mailbox
    fmt.Printf("Delivering to: %s\n", decision.Destination)

case service.RoutingActionRelay:
    // Relay to external server
    fmt.Printf("Relaying via: %s\n", *decision.NextHop)

case service.RoutingActionReject:
    // Reject the message
    fmt.Printf("Rejected: %s\n", decision.Reason)

case service.RoutingActionQuarantine:
    // Quarantine for review
    fmt.Printf("Quarantined: %s\n", decision.Reason)
}

// Validate recipient
err := routingService.ValidateRecipient("user@example.com")

// Resolve domain MX records
servers, err := routingService.ResolveDomain(ctx, "example.com")
```

---

## 🏗️ Architecture

### 🎯 **Domain-Driven Design Structure**

```
┌─────────────────────────────────────────────────────────────┐
│                    Aether Mailer Go SDK                    │
├─────────────────────────────────────────────────────────────┤
│  Business Logic Layer (Framework Agnostic)                  │
│  ┌─────────────┬─────────────┬─────────────┬──────────────┐ │
│  │   Users    │   Domains  │  Messages   │   Quotas     │ │
│  │  Service   │  Service   │  Service    │  Service     │ │
│  └─────────────┴─────────────┴─────────────┴──────────────┘ │
│  ┌─────────────┬─────────────┬─────────────┬──────────────┐ │
│  │  Routing   │   Events    │   Errors    │ Config       │ │
│  │  Service   │  System     │ Handling    │ Management   │ │
│  └─────────────┴─────────────┴─────────────┴──────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  Domain Layer (Pure Business Logic)                       │
│  ┌─────────────┬─────────────┬─────────────┬──────────────┐ │
│  │   User     │   Domain    │  Message    │    Quota     │ │
│  │   Models   │   Models    │  Models     │   Models     │ │
│  └─────────────┴─────────────┴─────────────┴──────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  Repository Interfaces (Data Access Contracts)               │
│  ┌─────────────┬─────────────┬─────────────┬──────────────┐ │
│  │   User     │   Domain    │  Message    │ Event Store  │ │
│  │ Repository │ Repository  │ Repository  │  Interface   │ │
│  └─────────────┴─────────────┴─────────────┴──────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  Your Implementation Layer                                  │
│  ┌─────────────┬─────────────┬─────────────┬──────────────┐ │
│  │ PostgreSQL │   Redis     │  Message    │  HTTP/gRPC   │ │
│  │  Database  │   Cache     │   Queue     │   APIs       │ │
│  └─────────────┴─────────────┴─────────────┴──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 🔧 **Interface-Based Design**

All major components are defined as interfaces, allowing you to implement them with any technology:

```go
// Example: User Repository Interface
type UserRepository interface {
    Create(ctx context.Context, user *domain.User) error
    GetByID(ctx context.Context, id string) (*domain.User, error)
    GetByEmail(ctx context.Context, email string) (*domain.User, error)
    Update(ctx context.Context, user *domain.User) error
    Delete(ctx context.Context, id string) error
    List(ctx context.Context, filter UserFilter) ([]*domain.User, error)
}

// You can implement this with:
// - PostgreSQL + GORM
// - MongoDB + mgo
// - MySQL + sqlx
// - In-memory for testing
// - Any database technology
```

### 📡 **Event-Driven Architecture**

The SDK uses domain events for loose coupling:

```go
// Event types
const (
    EventTypeUserCreated     = "USER_CREATED"
    EventTypeDomainCreated   = "DOMAIN_CREATED"
    EventTypeMessageSent     = "MESSAGE_SENT"
    EventTypeQuotaExceeded   = "QUOTA_EXCEEDED"
    EventTypePolicyTriggered = "POLICY_TRIGGERED"
)

// Event publisher interface
type EventPublisher interface {
    Publish(ctx context.Context, event Event) error
    PublishBatch(ctx context.Context, events []Event) error
}
```

---

## 🔧 Configuration

### 📋 **Configuration Structure**

The SDK uses a comprehensive configuration system:

```go
type Config struct {
    Database   DatabaseConfig   `json:"database"`
    Redis      RedisConfig      `json:"redis"`
    SMTP       SMTPConfig       `json:"smtp"`
    IMAP       IMAPConfig       `json:"imap"`
    Security   SecurityConfig   `json:"security"`
    Routing    RoutingConfig    `json:"routing"`
    Monitoring MonitoringConfig `json:"monitoring"`
    Quotas     QuotaConfig      `json:"quotas"`
    Policies   PolicyConfig     `json:"policies"`
}
```

### ⚙️ **Default Configuration**

```go
// Get sensible defaults
cfg := config.DefaultConfig()

// Customize as needed
cfg.Database.Host = "localhost"
cfg.Database.Port = 5432
cfg.Database.Database = "aether_mailer"
cfg.Security.JWTSecret = "your-secret-key"
cfg.Routing.EnableDKIM = true
cfg.Quotas.DefaultMaxStorageMB = 2048

// Validate configuration
if err := cfg.Validate(); err != nil {
    log.Fatal("Invalid configuration:", err)
}
```

### 🔐 **Security Configuration**

```go
type SecurityConfig struct {
    JWTSecret         string        `json:"jwt_secret"`
    JWTExpiration     time.Duration `json:"jwt_expiration"`
    PasswordMinLength int           `json:"password_min_length"`
    Require2FA        bool          `json:"require_2fa"`
    MaxLoginAttempts  int           `json:"max_login_attempts"`
    LockoutDuration   time.Duration `json:"lockout_duration"`
    EncryptionKey     string        `json:"encryption_key"`
}
```

---

## 📚 Examples

### 🔗 **Repository Implementation Example**

Here's how to implement a PostgreSQL user repository:

```go
package repository

import (
    "context"
    "gorm.io/gorm"

    "github.com/skygenesisenterprise/aether-mailer/package/golang/domain"
)

type PostgreSQLUserRepository struct {
    db *gorm.DB
}

func NewPostgreSQLUserRepository(db *gorm.DB) *PostgreSQLUserRepository {
    return &PostgreSQLUserRepository{db: db}
}

func (r *PostgreSQLUserRepository) Create(ctx context.Context, user *domain.User) error {
    return r.db.WithContext(ctx).Create(user).Error
}

func (r *PostgreSQLUserRepository) GetByID(ctx context.Context, id string) (*domain.User, error) {
    var user domain.User
    err := r.db.WithContext(ctx).Where("id = ?", id).First(&user).Error
    if err != nil {
        if err == gorm.ErrRecordNotFound {
            return nil, nil
        }
        return nil, err
    }
    return &user, nil
}

// ... implement other methods
```

### 📧 **Complete Email Service Example**

```go
package main

import (
    "context"
    "log"

    "github.com/skygenesisenterprise/aether-mailer/package/golang"
    "github.com/skygenesisenterprise/aether-mailer/package/golang/config"
    "github.com/skygenesisenterprise/aether-mailer/package/golang/service"
)

// Implement your repositories
type MyRepositories struct {
    UserRepo     repository.UserRepository
    DomainRepo   repository.DomainRepository
    // ... other repos
}

func main() {
    // Initialize configuration
    cfg := config.DefaultConfig()
    cfg.Database.Host = "localhost"
    cfg.Database.Port = 5432

    // Initialize your repositories
    repos := &MyRepositories{
        UserRepo:   NewPostgreSQLUserRepository(db),
        DomainRepo: NewPostgreSQLDomainRepository(db),
    }

    // Initialize event publisher (your implementation)
    eventPub := NewRedisEventPublisher(redisClient)

    // Initialize services
    userService := service.NewUserService(
        repos.UserRepo,
        eventPub,
    )

    domainService := service.NewDomainService(
        repos.DomainRepo,
        repos.UserRepo,
        eventPub,
    )

    messageService := service.NewMessageService(
        repos.MessageRepo,
        repos.AccountRepo,
        repos.AttachmentRepo,
        repos.QuotaRepo,
        repos.PolicyRepo,
        eventPub,
        &service.MessageConfig{
            MaxMessageSize:   50 * 1024 * 1024, // 50MB
            MaxAttachments:   10,
            MaxAttachmentSize: 10 * 1024 * 1024, // 10MB
        },
    )

    // Create SDK
    sdk := &golang.SDK{
        Services: &golang.Services{
            User:    userService,
            Domain:  domainService,
            Message: messageService,
            Quota:   quotaService,
            Routing: routingService,
        },
        Config: cfg,
    }

    // Use the SDK
    ctx := context.Background()

    // Create a domain
    domain, err := sdk.Services.Domain.CreateDomain(ctx, service.CreateDomainRequest{
        Name:            "mycompany.com",
        OwnerID:         "user-123",
        MaxUsers:        50,
        MaxEmailsPerDay: 1000,
        MaxStorageMB:    10240,
    })
    if err != nil {
        log.Printf("Failed to create domain: %v", err)
        return
    }

    log.Printf("Created domain: %s (ID: %s)", domain.Name, domain.ID)
}
```

### 🛣️ **Email Routing Example**

```go
// Handle incoming SMTP email
func handleIncomingEmail(ctx context.Context, rawData []byte) error {
    // Parse raw email
    message, err := parseEmail(rawData)
    if err != nil {
        return err
    }

    // Route the message
    decision, err := routingService.RouteMessage(ctx, message)
    if err != nil {
        return err
    }

    // Apply routing decision
    switch decision.Action {
    case service.RoutingActionDeliver:
        return deliverToLocalMailbox(ctx, message, decision.Destination)

    case service.RoutingActionRelay:
        return relayToExternalServer(ctx, message, *decision.NextHop)

    case service.RoutingActionReject:
        return sendRejectResponse(ctx, message, decision.Reason)

    case service.RoutingActionQuarantine:
        return quarantineMessage(ctx, message, decision.Reason)

    default:
        return fmt.Errorf("unknown routing action: %s", decision.Action)
    }
}
```

---

## 🔌 Integration Points

### 🌐 **HTTP/gRPC API Integration**

The SDK is perfect for building API layers:

```go
// Example HTTP handler
func (h *UserHandler) CreateUser(w http.ResponseWriter, r *http.Request) {
    var req service.CreateUserRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }

    user, err := h.userService.CreateUser(r.Context(), req)
    if err != nil {
        // Handle different error types appropriately
        if errors.IsErrorCode(err, errors.ErrCodeUserAlreadyExists) {
            http.Error(w, "User already exists", http.StatusConflict)
        } else {
            http.Error(w, "Internal server error", http.StatusInternalServerError)
        }
        return
    }

    json.NewEncoder(w).Encode(user)
}
```

### 🚀 **SMTP/IMAP Gateway Integration**

Use the SDK for protocol gateways:

```go
// SMTP server using the SDK
func (s *SMTPServer) HandleMail(from string, to []string, data []byte) error {
    // Parse message
    message, err := parseMessage(from, to, data)
    if err != nil {
        return err
    }

    // Use SDK routing service
    decision, err := s.routingService.RouteMessage(ctx, message)
    if err != nil {
        return err
    }

    // Handle routing
    return s.handleRoutingDecision(ctx, message, decision)
}
```

### 📊 **Background Worker Integration**

Perfect for async processing:

```go
func (w *Worker) ProcessEmailQueue() {
    for {
        select {
        case msg := <-w.queue:
            ctx := context.Background()

            // Use SDK services
            if err := w.messageService.SendMessage(ctx, msg); err != nil {
                w.logger.Error("Failed to send message", "error", err)
                continue
            }

            w.logger.Info("Message sent successfully", "id", msg.ID)

        case <-ctx.Done():
            return
        }
    }
}
```

---

## 📋 Error Handling

### 🎯 **Typed Error System**

The SDK uses comprehensive typed errors:

```go
// Check for specific error types
if err != nil {
    if errors.IsErrorCode(err, errors.ErrCodeUserNotFound) {
        return fmt.Errorf("user not found: %s", userID)
    }

    if errors.IsErrorCode(err, errors.ErrCodeQuotaExceeded) {
        return fmt.Errorf("quota exceeded")
    }

    if errors.IsErrorCode(err, errors.ErrCodePolicyViolation) {
        return fmt.Errorf("policy blocked this operation")
    }

    return err
}

// Access error details
if businessErr, ok := err.(*errors.Error); ok {
    log.Printf("Error: %s", businessErr.Code)
    log.Printf("Message: %s", businessErr.Message)
    for key, value := range businessErr.Details {
        log.Printf("  %s: %v", key, value)
    }
}
```

---

## 🧪 Testing

### 📝 **Mock Implementations**

The SDK interfaces make testing easy:

```go
// Mock user repository for testing
type MockUserRepository struct {
    users map[string]*domain.User
}

func (m *MockUserRepository) GetByID(ctx context.Context, id string) (*domain.User, error) {
    return m.users[id], nil
}

// Test example
func TestUserService_CreateUser(t *testing.T) {
    // Setup mocks
    userRepo := &MockUserRepository{users: make(map[string]*domain.User)}
    eventPub := &MockEventPublisher{}

    // Create service
    userService := service.NewUserService(userRepo, eventPub)

    // Test
    user, err := userService.CreateUser(context.Background(), service.CreateUserRequest{
        Email:    "test@example.com",
        Username: "testuser",
        Role:     domain.UserRoleUser,
    })

    // Assertions
    assert.NoError(t, err)
    assert.Equal(t, "test@example.com", user.Email)
    assert.Equal(t, 1, len(eventPub.publishedEvents))
}
```

---

## 🚀 Production Deployment

### 🏗️ **Multi-Node Architecture**

The SDK is designed for distributed systems:

```go
// Example distributed setup
type Node struct {
    ID           string
    SDK          *golang.SDK
    EventStream  <-chan domain.Event
    HealthCheck  *http.Server
}

func (n *Node) Start() error {
    // Start event processor
    go n.processEvents()

    // Start health check server
    return n.HealthCheck.ListenAndServe()
}

func (n *Node) processEvents() {
    for event := range n.EventStream {
        // Handle events from other nodes
        switch event.EventType() {
        case domain.EventTypeUserCreated:
            // Sync user data
        case domain.EventTypeMessageSent:
            // Update metrics
        }
    }
}
```

---

## 📞 Support & Documentation

### 📚 **Resources**

- **[Go Documentation](https://pkg.go.dev/github.com/skygenesisenterprise/aether-mailer/package/golang)** - Full API reference
- **[Examples](https://github.com/skygenesisenterprise/aether-mailer/tree/main/package/golang/examples)** - Complete working examples
- **[Architecture Guide](https://github.com/skygenesisenterprise/aether-mailer/wiki/Go-SDK-Architecture)** - Deep dive into design
- **[Main Project](https://github.com/skygenesisenterprise/aether-mailer)** - Full Aether Mailer project

### 🐛 **Reporting Issues**

When reporting issues, please include:

- Go version and module version
- Complete error messages and stack traces
- Minimal reproduction code
- Expected vs actual behavior
- Environment details

### 💡 **Contributing**

We welcome contributions! See the [Contributing Guide](../../CONTRIBUTING.md) for details.

---

## 📄 License

This SDK is part of the Aether Mailer project, licensed under the **MIT License**. See the [LICENSE](../../LICENSE) file for details.

---

<div align="center">

### 🚀 **Start Building with the Aether Mailer Go SDK Today!**

[⭐ Star the Project](https://github.com/skygenesisenterprise/aether-mailer) • [📖 Read the Docs](https://pkg.go.dev/github.com/skygenesisenterprise/aether-mailer/package/golang) • [🐛 Report Issues](https://github.com/skygenesisenterprise/aether-mailer/issues)

---

**📦 The Single Source of Truth for Aether Mailer Business Logic**

**Made with ❤️ by the [Sky Genesis Enterprise](https://skygenesisenterprise.com) team**

</div>
