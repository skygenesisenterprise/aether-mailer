<div align="center">

# 🚀 Aether Mailer Server

[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](https://github.com/skygenesisenterprise/aether-mailer/blob/main/LICENSE) [![Go](https://img.shields.io/badge/Go-1.21+-blue?style=for-the-badge&logo=go)](https://golang.org/) [![Gin](https://img.shields.io/badge/Gin-1.9+-lightgrey?style=for-the-badge&logo=go)](https://gin-gonic.com/)

**🔥 Modern Mail Server Backend - Go-based RESTful API with Complete Authentication**

A high-performance mail server backend built with Go, featuring a complete authentication system, RESTful API, and enterprise-ready architecture.

[🚀 Quick Start](#-quick-start) • [📋 Current Status](#-current-status) • [🛠️ Tech Stack](#️-tech-stack) • [📁 Architecture](#-architecture) • [🔐 API Endpoints](#-api-endpoints)

[![GitHub stars](https://img.shields.io/github/stars/skygenesisenterprise/aether-mailer?style=social)](https://github.com/skygenesisenterprise/aether-mailer/stargazers) [![GitHub forks](https://img.shields.io/github/forks/skygenesisenterprise/aether-mailer?style=social)](https://github.com/skygenesisenterprise/aether-mailer/network) [![GitHub issues](https://img.shields.io/github/issues/github/skygenesisenterprise/aether-mailer)](https://github.com/skygenesisenterprise/aether-mailer/issues)

</div>

---

## 🌟 What is Aether Mailer Server?

**Aether Mailer Server** is a comprehensive mail server backend built with Go and modern web technologies. Featuring a **complete authentication system**, **RESTful API**, and **enterprise-ready design**, we're building the future of email infrastructure with Go's performance and concurrency.

### 🎯 Our Vision

- **High-Performance Architecture** - Go-based server with Gin framework
- **Complete Authentication** - JWT-based system with login/register endpoints
- **Enterprise-Ready** - Scalable, secure, and maintainable design
- **RESTful API** - Intuitive API with proper HTTP methods and error handling
- **Protocol Support** - Planned support for SMTP, IMAP, JMAP, CalDAV, and CardDAV
- **Developer-Friendly** - Clean code, comprehensive documentation, and extensible design

---

## 📋 Current Status

> **✅ Active Development**: Authentication system complete, Go project structure established, core infrastructure functional.

### ✅ **Currently Implemented**

- **Complete Authentication System** - JWT authentication with login/register endpoints
- **Go Project Structure** - Clean architecture with proper package organization
- **Gin API Server** - Complete RESTful API with authentication endpoints
- **Database Layer** - GORM with PostgreSQL and user models
- **Development Environment** - Hot reload, proper Go modules, and testing
- **Clean Architecture** - Separated concerns with controllers, services, and models

### 🔄 **In Development**

- **User Management Dashboard** - Complete CRUD API for user administration
- **Domain Management** - Multi-domain configuration and management
- **Security Enhancements** - Rate limiting, input validation, and CORS
- **API Documentation** - Comprehensive API documentation and testing

### 📋 **Planned Features**

- **Mail Protocol Engines** - SMTP, IMAP, POP3 implementation in Go
- **Email Processing** - Queue system and delivery mechanisms with goroutines
- **Advanced Security** - Spam filtering, virus scanning, encryption
- **Real-time Updates** - WebSocket support for live email updates

---

## 🚀 Quick Start

### 📋 Prerequisites

- **Go** 1.21.0 or higher
- **PostgreSQL** 14.0 or higher (for database)
- **Make** (for command shortcuts - included with most systems)

### 🔧 Installation & Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/skygenesisenterprise/aether-mailer.git
   cd aether-mailer/server
   ```

2. **Install dependencies**

   ```bash
   go mod download
   ```

3. **Set up environment**

   ```bash
   cp .env.example .env
   # Edit .env with your database configuration
   ```

4. **Run the server**

   ```bash
   go run main.go
   ```

### 🌐 Access Points

Once running, you can access:

- **API Server**: [http://localhost:8080](http://localhost:8080)
- **Health Check**: [http://localhost:8080/health](http://localhost:8080/health)

### 🎯 **Essential Commands**

```bash
go run main.go              # Start development server (port 8080)
go build -o server          # Build binary
go test ./...               # Run all tests
go mod tidy                 # Clean up dependencies
```

---

## 🛠️ Tech Stack

### ⚙️ **Backend Layer**

```
Go 1.21+ + Gin Framework
├── 🗄️ GORM (Database Layer)
├── 🔐 JWT Authentication (Complete Implementation)
├── 🛡️ Middleware (Security, CORS, Logging)
├── 🌐 HTTP Router (Gin Router)
├── 📦 JSON Serialization (Native Go)
└── 📊 Structured Logging (Logrus/Zap)
```

### 🗄️ **Data Layer**

```
 PostgreSQL + GORM
├── 🏗️ Schema Management (Auto-migration)
├── 🔍 Query Builder (Type-Safe Queries)
├── 🔄 Connection Pooling (Performance)
├── 👤 User Models (Complete Implementation)
└── 📈 Seed Scripts (Development Data)
```

---

## 📁 Architecture

### 🏗️ **Server Structure**

```
server/
├── cmd/
│   └── server/
│       └── main.go          # CLI entry point
├── src/
│   ├── config/             # Database and server configuration
│   ├── controllers/        # HTTP request handlers (auth, users, domains)
│   ├── middleware/         # Gin middleware (auth, validation, monitoring)
│   ├── models/            # Data models and structs
│   ├── routes/            # API route definitions
│   ├── services/          # Business logic (auth, users, domains)
│   └── tests/             # Unit and integration tests
├── main.go                # Main server entry point
├── go.mod                 # Go modules file
├── go.sum                 # Go modules checksum
└── README.md              # This file
```

### 🔄 **Data Flow Architecture**

```
┌──────────────────┐    ┌─────────────────┐
│   Gin API        │    │   PostgreSQL    │
│   (Backend)      │◄──►│   (Database)    │
│  Port 8080       │    │  Port 5432      │
└──────────────────┘    └─────────────────┘
          │                       │
          ▼                       ▼
    API Endpoints         User/Domain Data
    Authentication         GORM ORM
    Business Logic        Auto-migrations
```

---

## 🔐 API Endpoints

### Authentication Endpoints

#### POST `/api/auth/register`

Register a new user account.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

**Response (201):**

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "tokens": {
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token"
  }
}
```

#### POST `/api/auth/login`

Authenticate user and receive tokens.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200):**

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "tokens": {
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token"
  }
}
```

#### POST `/api/auth/refresh`

Refresh access token using refresh token.

**Request Body:**

```json
{
  "refreshToken": "jwt_refresh_token"
}
```

**Response (200):**

```json
{
  "tokens": {
    "accessToken": "new_jwt_access_token"
  }
}
```

#### POST `/api/auth/logout`

Invalidate current session.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response (200):**

```json
{
  "message": "Logged out successfully"
}
```

### Health Endpoint

#### GET `/health`

Check server health status.

**Response (200):**

```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:30:00Z",
  "database": "connected"
}
```

---

## 🔐 Authentication System

### 🎯 **Complete Implementation**

The authentication system is fully implemented with:

- **JWT Tokens** - Secure token-based authentication with refresh mechanism
- **Login/Register Endpoints** - Complete user authentication flow with validation
- **Password Security** - bcrypt hashing for secure password storage
- **Middleware Protection** - Route-based authentication guards
- **Token Refresh** - Automatic token renewal mechanism

### 🔄 **Authentication Flow**

```go
// Registration Process
1. User submits registration → API validation
2. Password hashing with bcrypt → Database storage
3. JWT tokens generated → Client receives tokens
4. User registered successfully

// Login Process
1. User submits credentials → API validation
2. Password verification → JWT token generation
3. Tokens returned → Client stores tokens
4. Authenticated requests with Bearer token

// Token Refresh
1. Client sends refresh token → Validate token
2. Generate new access token → Return to client
3. Invalid tokens → Error response
4. Expired refresh token → Re-authentication required
```

---

## 💻 Development

### 🎯 **Development Commands**

```bash
go run main.go              # Start development server (port 8080)
go build -o server          # Build production binary
go test ./...               # Run all tests
go test -v ./tests/...      # Run tests with verbose output
go mod tidy                # Clean up dependencies
go fmt ./...               # Format all Go files
go vet ./...               # Run Go vet for potential issues
```

### 📋 **Development Workflow**

```bash
# Daily development
go run main.go              # Start working
go fmt ./...               # Format code
go test ./...              # Run tests
go vet ./...               # Check for issues

# Database changes
go run main.go --migrate   # Run migrations (if implemented)
```

---

## 📊 Project Status

| Component                 | Status         | Notes                           |
| ------------------------- | -------------- | ------------------------------- |
| **Gin API Server**        | ✅ Working     | RESTful API with auth endpoints |
| **Authentication System** | ✅ Working     | Complete JWT implementation     |
| **Database Layer**        | ✅ Working     | GORM with PostgreSQL            |
| **Security**              | 🔄 In Progress | Rate limiting, validation       |
| **Mail Protocols**        | 📋 Planned     | SMTP/IMAP engines in Go         |
| **Testing Suite**         | 🔄 In Progress | Unit and integration tests      |

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](../LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Sky Genesis Enterprise** - Project leadership and development
- **Go Community** - High-performance programming language
- **Gin Framework** - Lightweight HTTP web framework
- **GORM Team** - Modern Go database library
- **Open Source Community** - Tools, libraries, and inspiration

---

<div align="center">

### 🚀 **Building the Future of Email Infrastructure with Go!**

[⭐ Star This Repo](https://github.com/skygenesisenterprise/aether-mailer) • [🐛 Report Issues](https://github.com/skygenesisenterprise/aether-mailer/issues)

**Made with ❤️ by the [Sky Genesis Enterprise](https://skygenesisenterprise.com) team**

_Building a modern mail server with complete authentication and Go's performance_

</div>
