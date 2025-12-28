# Basic User Management Example

This example demonstrates how to use the Aether Mailer Go SDK for basic user management operations including:

- Creating new users
- Updating user profiles
- Listing users with filtering
- Managing user roles and permissions

## 🚀 Quick Start

```bash
# Install dependencies
go mod tidy

# Run the example
go run main.go
```

## 📋 What This Example Does

1. **Initialize SDK**: Set up the Go SDK with mock repositories
2. **Create Users**: Demonstrate user creation with different roles
3. **Update Users**: Show how to update user information
4. **List Users**: Filter and list users
5. **Delete Users**: Clean up test users

## 📁 Example Structure

```
user_management/
├── main.go              # Main example execution
├── mock_repositories.go  # Mock implementations for testing
├── users.go             # User management helpers
└── README.md            # This file
```

## 🔧 Running the Example

The example uses in-memory mock repositories, so you don't need any database setup.

```bash
# From the examples directory
cd basic/user_management
go run main.go
```

You should see output similar to:

```
🚀 Starting Aether Mailer User Management Example

✅ Created admin user: admin@example.com (ID: user-123)
✅ Created regular user: john.doe@example.com (ID: user-456)
✅ Created domain admin: admin@company.com (ID: user-789)

📋 Listing all users:
  • admin@example.com (SUPER_ADMIN)
  • john.doe@example.com (USER)
  • admin@company.com (DOMAIN_ADMIN)

✏️  Updating John Doe's profile...
✅ Updated user display name to "John Doe"

🔍 Searching for users with 'admin' in email:
  • admin@example.com (SUPER_ADMIN)
  • admin@company.com (DOMAIN_ADMIN)

🗑️  Cleaning up test users...
✅ Deleted user: user-123
✅ Deleted user: user-456
✅ Deleted user: user-789

🎉 Example completed successfully!
```

## 🎯 Key Concepts Demonstrated

### 1. SDK Initialization

```go
import "github.com/skygenesisenterprise/aether-mailer/package/golang"

// Initialize mock repositories
userRepo := mock.NewMockUserRepository()
eventPub := mock.NewMockEventPublisher()

// Create user service
userService := service.NewUserService(userRepo, eventPub)

// Initialize SDK
sdk := &golang.SDK{
    Services: &golang.Services{
        User: userService,
        // ... other services
    },
    Config: config.DefaultConfig(),
}
```

### 2. User Creation

```go
user, err := sdk.Services.User.CreateUser(ctx, service.CreateUserRequest{
    Email:           "user@example.com",
    Username:        "johndoe",
    PasswordHash:    hashedPassword,
    FirstName:       &firstName,
    LastName:        &lastName,
    Role:            domain.UserRoleUser,
    MaxEmailsPerDay: 100,
    MaxStorageMB:    1024,
})
```

### 3. User Updates

```go
user, err := sdk.Services.User.UpdateUser(ctx, service.UpdateUserRequest{
    ID:          userID,
    DisplayName:  &newDisplayName,
    MaxStorageMB: &newStorageLimit,
})
```

### 4. User Listing with Filters

```go
users, err := sdk.Services.User.ListUsers(ctx, repository.UserFilter{
    Role:     &domain.UserRoleUser,
    IsActive: &[]bool{true}[0],
    Limit:     50,
})
```

## 🔐 Error Handling

The example demonstrates proper error handling:

```go
if err != nil {
    // Check for specific error types
    if errors.IsErrorCode(err, errors.ErrCodeUserAlreadyExists) {
        fmt.Printf("User already exists: %s\n", email)
        return
    }

    // Handle other errors
    fmt.Printf("Error creating user: %v\n", err)
    return
}
```

## 🏗️ Mock Repository Pattern

The example uses mock repositories to avoid database dependencies. In production, you would implement real repositories:

```go
// Mock implementation (for testing)
type MockUserRepository struct {
    users map[string]*domain.User
    mu    sync.RWMutex
}

// Real implementation (for production)
type PostgreSQLUserRepository struct {
    db *gorm.DB
}

func (r *PostgreSQLUserRepository) Create(ctx context.Context, user *domain.User) error {
    return r.db.WithContext(ctx).Create(user).Error
}
```

## 📚 Learn More

- [Go SDK Documentation](https://pkg.go.dev/github.com/skygenesisenterprise/aether-mailer/package/golang)
- [Domain Models](../../../domain/models.go)
- [Service Layer](../../../service/user_service.go)
- [Repository Interface](../../../repository/interfaces.go)

## 🔄 Next Steps

After mastering user management, explore these examples:

1. [Domain Setup](../domain_setup/) - Learn domain management
2. [Email Sending](../email_sending/) - Send and receive emails
3. [HTTP Server](../../integration/http_server/) - Build REST APIs

## 🤝 Contributing

Found an issue or want to improve the example? Please:

1. Open an [Issue](https://github.com/skygenesisenterprise/aether-mailer/issues)
2. Submit a [Pull Request](https://github.com/skygenesisenterprise/aether-mailer/pulls)
3. Follow the [Contributing Guide](../../../../CONTRIBUTING.md)

---

**Happy coding with Aether Mailer Go SDK! 🎉**
