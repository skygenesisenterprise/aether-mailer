<div align="center">

# 🚀 Aether Mailer

[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](https://github.com/skygenesisenterprise/aether-mailer/blob/main/LICENSE) [![Go](https://img.shields.io/badge/Go-1.21+-blue?style=for-the-badge&logo=go)](https://golang.org/) [![Gin](https://img.shields.io/badge/Gin-1.9+-lightgrey?style=for-the-badge&logo=go)](https://gin-gonic.com/) [![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/) [![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/) [![React](https://img.shields.io/badge/React-19.2.1-blue?style=for-the-badge&logo=react)](https://react.dev/)

**🔥 Modern Mail Server Foundation - Hybrid Go/TypeScript Architecture with Complete Authentication**

A next-generation mail server foundation with a complete authentication system, hybrid Go/TypeScript architecture, and enterprise-ready monorepo design.

[🚀 Quick Start](#-quick-start) • [📋 Current Status](#-current-status) • [🛠️ Tech Stack](#️-tech-stack) • [📁 Architecture](#-architecture) • [🤝 Contributing](#-contributing)

[![GitHub stars](https://img.shields.io/github/stars/skygenesisenterprise/aether-mailer?style=social)](https://github.com/skygenesisenterprise/aether-mailer/stargazers) [![GitHub forks](https://img.shields.io/github/forks/skygenesisenterprise/aether-mailer?style=social)](https://github.com/skygenesisenterprise/aether-mailer/network) [![GitHub issues](https://img.shields.io/github/issues/github/skygenesisenterprise/aether-mailer)](https://github.com/skygenesisenterprise/aether-mailer/issues)

</div>

---

## 🌟 What is Aether Mailer?

**Aether Mailer** is a comprehensive mail server foundation built with modern hybrid architecture. Featuring a **complete authentication system**, **Go-based high-performance backend**, **TypeScript frontend**, and **enterprise-ready monorepo design**, we're building the future of email infrastructure.

### 🎯 Our Vision

- **Hybrid Architecture** - Go 1.21+ backend with Gin framework + TypeScript 5 frontend with Next.js 16
- **High-Performance Backend** - Go-based server with concurrency and performance optimization
- **Modern Frontend** - TypeScript monorepo with Next.js 16 and React 19.2.1
- **Complete Authentication** - JWT-based system with login/register forms
- **Enterprise-Ready** - Scalable, secure, and maintainable design
- **Web-First Administration** - Intuitive web-based management interface
- **Protocol Support** - Planned support for SMTP, IMAP, JMAP, CalDAV, and CardDAV
- **Developer-Friendly** - Clean code, comprehensive documentation, and extensible design

---

## 📋 Current Status

> **✅ Active Development**: Authentication system complete, hybrid architecture established, core infrastructure functional.

### ✅ **Currently Implemented**

- **Complete Authentication System** - JWT authentication with login/register forms and context
- **Hybrid Monorepo Architecture** - Go backend + TypeScript frontend workspaces
- **Go Backend Server** - High-performance Gin API with authentication endpoints
- **Next.js 16 Frontend** - Modern React 19.2.1 application with TypeScript
- **Database Layer** - GORM with PostgreSQL and user models
- **UI Component Library** - shadcn/ui integration with Tailwind CSS v4
- **Development Environment** - Hot reload, TypeScript strict mode, Go modules
- **CLI Tools** - Complete command-line interface for server management
- **TypeScript Project Structure** - Individual tsconfig files for each workspace

### 🔄 **In Development**

- **User Management Dashboard** - Complete CRUD interface for user administration
- **Domain Management** - Multi-domain configuration and management
- **Security Enhancements** - Rate limiting, input validation, and CORS
- **API Documentation** - Comprehensive API documentation and testing

### 📋 **Planned Features**

- **Mail Protocol Engines** - SMTP, IMAP, POP3 implementation in Go
- **Web Administration Dashboard** - Complete server management interface
- **Email Processing** - Queue system and delivery mechanisms with Go goroutines
- **Advanced Security** - Spam filtering, virus scanning, encryption
- **Mobile Application** - React Native companion app

---

## 🚀 Quick Start

### 📋 Prerequisites

- **Go** 1.21.0 or higher (for backend)
- **Node.js** 18.0.0 or higher (for frontend)
- **pnpm** 9.0.0 or higher (recommended package manager)
- **PostgreSQL** 14.0 or higher (for database)
- **Make** (for command shortcuts - included with most systems)

### 🔧 Installation & Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/skygenesisenterprise/aether-mailer.git
   cd aether-mailer
   ```

2. **Quick start (recommended)**

   ```bash
   # One-command setup and start
   make quick-start
   ```

3. **Manual setup**

   ```bash
   # Install Go dependencies
   cd server && go mod download && cd ..

   # Install Node.js dependencies
   make install

   # Environment setup
   make env-dev

   # Database initialization
   make db-migrate

   # Start development servers
   make dev
   ```

### 🌐 Access Points

Once running, you can access:

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **API Server**: [http://localhost:8080](http://localhost:8080)
- **Health Check**: [http://localhost:8080/health](http://localhost:8080/health)
- **CLI**: `make cli` or `npx @aether-mailer/cli`

### 🎯 **Essential Make Commands**

```bash
# Quick start for new developers
make quick-start          # Install, migrate, and start dev servers

# Development
make dev                  # Start all services (frontend + backend)
make dev-frontend         # Frontend only (port 3000)
make dev-backend          # Backend only (port 8080)

# Go Backend Commands
make go-server            # Start Go server directly
make go-build             # Build Go binary
make go-test              # Run Go tests

# Building & Production
make build               # Build all packages
make start               # Start production servers

# Database
make db-studio           # Open Prisma Studio
make db-migrate          # Run migrations
make db-seed             # Seed development data

# Code Quality
make lint                # Lint all packages
make typecheck           # Type check all packages
make format              # Format code with Prettier

# Utilities
make help                # Show all available commands
make status              # Show project status
make health              # Check service health
```

> 💡 **Tip**: Run `make help` to see all 60+ available commands organized by category.

---

## 🛠️ Tech Stack

### 🎨 **Frontend Layer**

```
Next.js 16 + React 19.2.1 + TypeScript 5
├── 🎨 Tailwind CSS v4 + shadcn/ui (Styling & Components)
├── 🔐 JWT Authentication (Complete Implementation)
├── 🛣️ Next.js App Router (Routing)
├── 📝 TypeScript Strict Mode (Type Safety)
├── 🔄 React Context (State Management)
└── 🔧 ESLint + Prettier (Code Quality)
```

### ⚙️ **Backend Layer**

```
Go 1.21+ + Gin Framework
├── 🗄️ GORM (Database Layer)
├── 🔐 JWT Authentication (Complete Implementation)
├── 🛡️ Middleware (Security, CORS, Logging)
├── 🌐 HTTP Router (Gin Router)
├── 📦 JSON Serialization (Native Go)
└── 📊 Structured Logging (Zerolog)
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

### 🏗️ **Hybrid Monorepo Infrastructure**

```
Make + pnpm Workspaces + Go Modules
├── 📦 app/ (Next.js Frontend - TypeScript)
├── ⚙️ server/ (Gin API - Go)
├── 🛠️ cli/ (Command Line Tools - TypeScript)
├── 🔧 tools/ (Development Utilities - TypeScript)
├── 📚 services/ (Core Mail Services - TypeScript)
├── 🗂️ routers/ (API Routing - TypeScript)
└── 🐳 docker/ (Container Configuration)
```

---

## 📁 Architecture

### 🏗️ **Hybrid Monorepo Structure**

```
aether-mailer/
├── app/                     # Next.js 16 Frontend Application (TypeScript)
│   ├── components/         # React components with shadcn/ui
│   │   ├── ui/            # UI component library
│   │   ├── login-form.tsx # Authentication forms
│   │   └── Sidebar.tsx    # Navigation components
│   ├── context/           # React contexts
│   │   └── JwtAuthContext.tsx # Authentication state
│   ├── login/             # Authentication pages
│   ├── register/          # User registration
│   ├── forgot/            # Password recovery
│   ├── lib/               # Utility functions
│   └── styles/            # Tailwind CSS styling
├── server/                 # Go Backend Server
│   ├── cmd/
│   │   └── server/
│   │       └── main.go    # CLI entry point
│   ├── src/
│   │   ├── config/        # Database and server configuration
│   │   ├── controllers/   # HTTP request handlers (auth, users, domains)
│   │   ├── middleware/    # Gin middleware (auth, validation, monitoring)
│   │   ├── models/        # Data models and structs
│   │   ├── routes/        # API route definitions
│   │   ├── services/      # Business logic (auth, users, domains)
│   │   └── tests/         # Unit and integration tests
│   ├── main.go            # Main server entry point
│   ├── go.mod             # Go modules file
│   └── go.sum             # Go modules checksum
├── cli/                    # Command Line Interface (TypeScript)
│   ├── src/
│   │   ├── commands/      # CLI commands (users, domains, backup)
│   │   ├── utils/         # CLI utilities
│   │   └── types/         # TypeScript definitions
│   └── package.json       # CLI-specific dependencies
├── services/               # Core Mail Services (TypeScript)
├── tools/                  # Development Utilities (TypeScript)
├── routers/                # API Routing Services (TypeScript)
├── prisma/                 # Database Schema & Migrations
│   ├── schema.prisma      # Database schema definition
│   └── config.ts          # Prisma configuration
├── public/                 # Static Assets
├── docs/                   # Documentation
├── docker/                 # Docker Configuration
├── .storybook/             # Storybook Configuration
└── electron/               # Electron App (Future)
```

### 🔄 **Hybrid Data Flow Architecture**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Next.js App   │    │   Gin API        │    │   PostgreSQL    │
│   (Frontend)    │◄──►│   (Backend)      │◄──►│   (Database)    │
│  Port 3000      │    │  Port 8080       │    │  Port 5432      │
│  TypeScript     │    │  Go              │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
          │                       │                       │
          ▼                       ▼                       ▼
    JWT Tokens            API Endpoints         User/Domain Data
    React Context        Authentication         GORM ORM
    shadcn/ui Components  Business Logic        Auto-migrations
```

---

## 🗺️ Development Roadmap

### 🎯 **Phase 1: Foundation (✅ Complete - Q1 2025)**

- ✅ **Hybrid Monorepo Setup** - Go backend + TypeScript frontend workspaces
- ✅ **Authentication System** - Complete JWT implementation with forms
- ✅ **Frontend Framework** - Next.js 16 + React 19.2.1 + shadcn/ui
- ✅ **Go Backend API** - Gin with authentication endpoints
- ✅ **Database Layer** - GORM with PostgreSQL and user models
- ✅ **CLI Tools** - Complete command-line interface
- ✅ **Development Environment** - TypeScript strict mode, Go modules, hot reload

### 🚀 **Phase 2: Core Features (🔄 In Progress - Q2 2025)**

- 🔄 **User Management Dashboard** - Complete CRUD interface
- 🔄 **Domain Administration** - Multi-domain support
- 🔄 **Security Enhancements** - Rate limiting, validation, CORS
- 📋 **API Documentation** - Comprehensive API docs
- 📋 **Testing Suite** - Unit and integration tests
- 📋 **Performance Optimization** - Caching and optimization

### ⚙️ **Phase 3: Mail Protocols (Q3 2025)**

- 📋 **SMTP Engine** - Incoming email processing in Go
- 📋 **IMAP Server** - Email retrieval and folder management in Go
- 📋 **Email Queue** - Outbound delivery system with Go goroutines
- 📋 **Basic Security** - SPF, DKIM implementation
- 📋 **Webmail Interface** - Basic email client

### 🌟 **Phase 4: Enterprise Features (Q4 2025)**

- 📋 **Advanced Security** - Spam filtering, virus scanning
- 📋 **CalDAV/CardDAV** - Calendar and contacts sync
- 📋 **JMAP Support** - Modern email protocol
- 📋 **High Availability** - Clustering and failover
- 📋 **Mobile Application** - React Native companion app

---

## 💻 Development

### 🎯 **Hybrid Make Command Interface**

The project uses a comprehensive **Makefile** with 60+ commands for streamlined development across Go and TypeScript:

```bash
# 🚀 Quick Start & Development
make quick-start          # Install, migrate, and start dev servers
make dev                 # Start all services (frontend + backend)
make dev-frontend        # Frontend only (port 3000)
make dev-backend         # Backend only (port 8080)
make dev-cli             # CLI development mode

# 🔧 Go Backend Development
make go-server           # Start Go server directly
make go-build            # Build Go binary
make go-test             # Run Go tests
make go-mod-tidy         # Clean Go dependencies
make go-fmt              # Format Go code

# 🏗️ Building & Production
make build               # Build all packages
make build-frontend       # Frontend production build
make build-backend        # Backend TypeScript compilation (legacy)
make start               # Start production servers

# 🔧 Code Quality & Testing
make lint                # Lint all packages
make lint-fix            # Auto-fix linting issues
make typecheck           # TypeScript type checking
make format              # Format code with Prettier
make test                # Run all tests
make test-coverage       # Run tests with coverage

# 🗄️ Database Management
make db-generate         # Generate Prisma client
make db-migrate          # Run database migrations
make db-studio           # Open Prisma Studio
make db-seed             # Seed development data
make db-reset            # Reset database

# 🛠️ CLI Tools
make cli                 # Run CLI commands
make cli-install         # Install CLI globally

# 🐳 Docker & Deployment
make docker-build        # Build Docker image
make docker-run          # Run with Docker Compose
make docker-stop         # Stop Docker services

# 🔧 Maintenance & Utilities
make clean               # Clean build artifacts
make reset               # Reset project to clean state
make health              # Check service health
make status              # Show project status
make audit               # Security audit dependencies
```

### 📋 **Hybrid Development Workflow**

```bash
# New developer setup
make quick-start

# Daily development
make dev                 # Start working (Go + TypeScript)
make lint-fix            # Fix code issues
make typecheck           # Verify types
make test                # Run tests

# Go-specific development
cd server
go run main.go          # Start Go server
go test ./...           # Run Go tests
go fmt ./...            # Format Go code
go mod tidy             # Clean dependencies

# TypeScript-specific development
make dev-frontend       # Frontend only
make lint               # Check code quality
make typecheck          # Verify types

# Before committing
make format             # Format code
make lint               # Check code quality
make typecheck          # Verify types

# Database changes
make db-migrate         # Apply migrations
make db-studio          # Browse database

# Production deployment
make build              # Build everything
make docker-build       # Create Docker image
make docker-run         # Deploy
```

### 🎯 **Advanced Commands**

```bash
# Performance & Monitoring
make perf-build          # Build with performance analysis
make metrics             # Show project metrics
make monitor             # Start monitoring tools

# Environment Management
make env-dev             # Setup development environment
make env-prod            # Setup production environment

# Backup & Recovery
make backup              # Create project backup
make restore-backup BACKUP=filename.tar.gz

# CI/CD Helpers
make ci-install          # Install for CI environment
make ci-build            # Build for CI
make ci-test             # Test for CI

# Project Information
make tree                # Show project structure
make ports               # Show used ports
make deps                # Show dependency tree
make help                # Show all commands
```

### 📋 **Hybrid Development Guidelines**

- **Make-First Workflow** - Use `make` commands for all operations
- **Go Best Practices** - Follow Go conventions for backend code
- **TypeScript Strict Mode** - All frontend code must pass strict type checking
- **Hybrid Monorepo Best Practices** - Use workspace-specific dependencies
- **Conventional Commits** - Use standardized commit messages
- **Component Structure** - Follow established patterns for React components
- **API Design** - RESTful endpoints with proper HTTP methods
- **Error Handling** - Comprehensive error handling and logging
- **Security First** - Validate all inputs and implement proper authentication

### 🛠️ **Hybrid Makefile Philosophy**

The Makefile provides:

- **Unified Interface** - Single command system for Go and TypeScript operations
- **Cross-Platform** - Works on Linux, macOS, and Windows (with WSL)
- **Colored Output** - Visual feedback for better UX
- **Error Handling** - Proper error messages and exit codes
- **Documentation** - Built-in help system with `make help`
- **Automation** - Complex workflows simplified to single commands

---

## 🔐 Authentication System

### 🎯 **Complete Hybrid Implementation**

The authentication system is fully implemented with Go backend and TypeScript frontend:

- **JWT Tokens** - Secure token-based authentication with refresh mechanism
- **Login/Register Forms** - Complete user authentication flow with validation
- **Auth Context** - Global authentication state management in React
- **Protected Routes** - Route-based authentication guards
- **Go API Endpoints** - Complete authentication API with Gin framework
- **Password Security** - bcrypt hashing for secure password storage
- **Session Management** - LocalStorage-based session persistence

### 🔄 **Hybrid Authentication Flow**

```go
// Go Backend Registration Process
1. User submits registration → API validation
2. Password hashing with bcrypt → Database storage
3. JWT tokens generated → Client receives tokens
4. Auth context updates → User logged in

// Go Backend Login Process
1. User submits credentials → API validation
2. Password verification → JWT token generation
3. Tokens stored → Auth context updated
4. Redirect to dashboard → Protected route access

// Token Refresh
1. Background token refresh → Automatic renewal
2. Invalid tokens → Redirect to login
3. Session expiration → Clean logout
```

---

## 🤝 Contributing

We're looking for contributors to help build this comprehensive hybrid mail server! Whether you're experienced with Go, TypeScript, mail protocols, web development, or infrastructure, there's a place for you.

### 🎯 **How to Get Started**

1. **Fork the repository** and create a feature branch
2. **Check the issues** for tasks that need help
3. **Join discussions** about architecture and features
4. **Start small** - Documentation, tests, or minor features
5. **Follow our code standards** and commit guidelines

### 🏗️ **Areas Needing Help**

- **Go Backend Development** - API endpoints, business logic, security, mail protocols
- **TypeScript Frontend Development** - React components, UI/UX design, dashboard
- **Database Design** - Schema development, migrations, optimization
- **Mail Protocol Experts** - SMTP, IMAP, JMAP implementation in Go
- **Security Specialists** - Authentication, encryption, filtering
- **DevOps Engineers** - Docker, deployment, CI/CD for hybrid stack
- **CLI Development** - Command-line tools and utilities
- **Documentation** - API docs, user guides, tutorials

### 📝 **Hybrid Contribution Process**

1. **Choose an issue** or create a new one with your proposal
2. **Create a branch** with a descriptive name
3. **Implement your changes** following our hybrid guidelines
4. **Test thoroughly** in both Go and TypeScript environments
5. **Submit a pull request** with clear description
6. **Address feedback** from maintainers and community

---

## 📞 Support & Community

### 💬 **Get Help**

- 📖 **[Documentation](docs/)** - Comprehensive guides and API docs
- 🐛 **[GitHub Issues](https://github.com/skygenesisenterprise/aether-mailer/issues)** - Bug reports and feature requests
- 💡 **[GitHub Discussions](https://github.com/skygenesisenterprise/aether-mailer/discussions)** - General questions and ideas
- 📧 **Email** - support@skygenesisenterprise.com

### 🐛 **Reporting Issues**

When reporting bugs, please include:

- Clear description of the problem
- Steps to reproduce
- Environment information (Go version, Node.js version, OS, etc.)
- Error logs or screenshots
- Expected vs actual behavior

---

## 📊 Project Status

| Component                 | Status         | Technology                | Notes                           |
| ------------------------- | -------------- | ------------------------- | ------------------------------- |
| **Hybrid Architecture**   | ✅ Working     | Go + TypeScript           | Monorepo with workspaces        |
| **Authentication System** | ✅ Working     | JWT (Go/TS)               | Complete implementation         |
| **Go Backend API**        | ✅ Working     | Gin + GORM                | High-performance server         |
| **Frontend Framework**    | ✅ Working     | Next.js 16 + React 19.2.1 | TypeScript application          |
| **UI Component Library**  | ✅ Working     | shadcn/ui + Tailwind CSS  | Complete component set          |
| **Database Layer**        | ✅ Working     | GORM + PostgreSQL         | Auto-migrations                 |
| **CLI Tools**             | ✅ Working     | TypeScript                | Complete command-line interface |
| **User Management**       | 🔄 In Progress | Go/TS                     | Dashboard interface             |
| **Domain Management**     | 📋 Planned     | Go/TS                     | Multi-domain support            |
| **Mail Protocols**        | 📋 Planned     | Go                        | SMTP/IMAP engines               |
| **Testing Suite**         | 📋 Planned     | Go/TS                     | Unit and integration tests      |
| **Documentation**         | 📋 Planned     | Go/TS                     | API docs and guides             |

---

## 🏆 Sponsors & Partners

**Development led by [Sky Genesis Enterprise](https://skygenesisenterprise.com)**

We're looking for sponsors and partners to help accelerate development of this open-source hybrid mail server project.

[🤝 Become a Sponsor](https://github.com/sponsors/skygenesisenterprise)

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2025 Sky Genesis Enterprise

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

## 🙏 Acknowledgments

- **Sky Genesis Enterprise** - Project leadership and development
- **Go Community** - High-performance programming language and ecosystem
- **Gin Framework** - Lightweight HTTP web framework
- **GORM Team** - Modern Go database library
- **Next.js Team** - Excellent React framework
- **React Team** - Modern UI library
- **shadcn/ui** - Beautiful component library
- **pnpm** - Fast, disk space efficient package manager
- **Make** - Universal build automation and command interface
- **Open Source Community** - Tools, libraries, and inspiration

---

<div align="center">

### 🚀 **Join Us in Building the Future of Email Infrastructure with Go & TypeScript!**

[⭐ Star This Repo](https://github.com/skygenesisenterprise/aether-mailer) • [🐛 Report Issues](https://github.com/skygenesisenterprise/aether-mailer/issues) • [💡 Start a Discussion](https://github.com/skygenesisenterprise/aether-mailer/discussions)

---

**🔧 Active Development - Hybrid Go/TypeStack Authentication System Complete!**

**Made with ❤️ by the [Sky Genesis Enterprise](https://skygenesisenterprise.com) team**

_Building a modern mail server with complete authentication and hybrid Go/TypeScript architecture_

</div>
