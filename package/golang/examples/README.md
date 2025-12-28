# Examples

This directory contains comprehensive examples demonstrating how to use the Aether Mailer Go SDK.

## 📁 Example Structure

```
examples/
├── basic/              # Basic usage examples
│   ├── user_management/  # User creation, updates, listing
│   ├── domain_setup/     # Domain creation and management
│   └── email_sending/    # Send and receive emails
├── advanced/           # Advanced usage patterns
│   ├── custom_repo/     # Custom repository implementations
│   ├── event_handling/  # Event-driven architecture
│   └── multi_node/      # Distributed deployment
├── integration/        # Integration examples
│   ├── http_server/     # HTTP API server
│   ├── smtp_gateway/    # SMTP gateway
│   └── background/      # Background workers
└── testing/           # Testing examples
    ├── mocks/           # Mock implementations
    └── tests/           # Unit test examples
```

## 🚀 Quick Start Examples

### 1. Basic User Management

See `basic/user_management/` for examples of:

- Creating users
- Managing user profiles
- User authentication flows
- Permission management

### 2. Domain Setup

See `basic/domain_setup/` for examples of:

- Creating email domains
- DNS configuration
- Domain verification
- User invitations

### 3. Email Operations

See `basic/email_sending/` for examples of:

- Sending emails
- Managing messages
- Working with attachments
- Email routing

## 🔧 Advanced Examples

### Custom Repository Implementations

See `advanced/custom_repo/` for examples of implementing repositories with:

- PostgreSQL + GORM
- MongoDB
- Redis cache layer
- Custom data stores

### Event-Driven Architecture

See `advanced/event_handling/` for examples of:

- Custom event handlers
- Event publishing
- Asynchronous processing
- Event sourcing

### Multi-Node Deployment

See `advanced/multi_node/` for examples of:

- Cluster setup
- Node communication
- Load balancing
- Failover handling

## 🌐 Integration Examples

### HTTP API Server

See `integration/http_server/` for a complete example of:

- REST API implementation
- Middleware setup
- Authentication handling
- Error responses

### SMTP Gateway

See `integration/smtp_gateway/` for examples of:

- SMTP server implementation
- Email parsing
- Spam filtering
- Integration with routing

### Background Workers

See `integration/background/` for examples of:

- Email queue processing
- Scheduled tasks
- Rate limiting
- Monitoring

## 🧪 Testing Examples

### Mock Implementations

See `testing/mocks/` for:

- Mock repository implementations
- Test utilities
- Test data generators
- Assertion helpers

### Unit Test Examples

See `testing/tests/` for:

- Service testing patterns
- Integration tests
- Performance tests
- Security tests

## 📚 Running Examples

Each example includes a README with specific instructions:

```bash
# Navigate to example directory
cd examples/basic/user_management

# Install dependencies
go mod tidy

# Run the example
go run main.go
```

## 🎯 Prerequisites for Examples

- Go 1.25 or higher
- PostgreSQL (for database examples)
- Redis (for caching examples)
- Docker (for containerized examples)

## 📖 Learn More

- [Go SDK Documentation](https://pkg.go.dev/github.com/skygenesisenterprise/aether-mailer/package/golang)
- [Main README](../README.md)
- [Architecture Guide](https://github.com/skygenesisenterprise/aether-mailer/wiki/Go-SDK-Architecture)

## 🤝 Contributing Examples

We welcome contributions to the examples! Please:

1. Create a new directory for your example
2. Include a comprehensive README
3. Add proper error handling
4. Follow Go best practices
5. Include tests when appropriate

---

## 🎉 Getting Help

- Open an [Issue](https://github.com/skygenesisenterprise/aether-mailer/issues) for questions
- Join our [Discussions](https://github.com/skygenesisenterprise/aether-mailer/discussions)
- Check the [Documentation](https://pkg.go.dev/github.com/skygenesisenterprise/aether-mailer/package/golang)
