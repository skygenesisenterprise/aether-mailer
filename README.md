<div align="center">

# 🚀 Aether Mailer

[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](https://github.com/skygenesisenterprise/aether-mailer/blob/main/LICENSE) [![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/) [![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/) [![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js)](https://nodejs.org/) [![React](https://img.shields.io/badge/React-19.2.1-blue?style=for-the-badge&logo=react)](https://react.dev/)

**🔥 Modern Mail Server Foundation - Complete Authentication System & Monorepo Architecture**

A next-generation mail server foundation with a complete authentication system, modern web stack, and enterprise-ready monorepo architecture.

[🚀 Quick Start](#-quick-start) • [📋 Current Status](#-current-status) • [🛠️ Tech Stack](#️-tech-stack) • [📁 Architecture](#-architecture) • [🤝 Contributing](#-contributing)

[![GitHub stars](https://img.shields.io/github/stars/skygenesisenterprise/aether-mailer?style=social)](https://github.com/skygenesisenterprise/aether-mailer/stargazers) [![GitHub forks](https://img.shields.io/github/forks/skygenesisenterprise/aether-mailer?style=social)](https://github.com/skygenesisenterprise/aether-mailer/network) [![GitHub issues](https://img.shields.io/github/issues/github/skygenesisenterprise/aether-mailer)](https://github.com/skygenesisenterprise/aether-mailer/issues)

</div>

---

## 🌟 What is Aether Mailer?

**Aether Mailer** is a comprehensive mail server foundation built with modern technologies. Featuring a **complete authentication system**, **monorepo architecture**, and **enterprise-ready design**, we're building the future of email infrastructure.

### 🎯 Our Vision
- **Modern Architecture** - TypeScript monorepo with Next.js 16 and Express.js
- **Complete Authentication** - JWT-based system with login/register forms
- **Enterprise-Ready** - Scalable, secure, and maintainable design  
- **Web-First Administration** - Intuitive web-based management interface
- **Protocol Support** - Planned support for SMTP, IMAP, JMAP, CalDAV, and CardDAV
- **Developer-Friendly** - Clean code, comprehensive documentation, and extensible design

---

## 📋 Current Status

> **✅ Active Development**: Authentication system complete, monorepo structure established, core infrastructure functional.

### ✅ **Currently Implemented**
- **Complete Authentication System** - JWT authentication with login/register forms and context
- **Monorepo Architecture** - pnpm workspaces with project references
- **Next.js 16 Frontend** - Modern React 19.2.1 application with TypeScript
- **Express.js API Server** - Complete RESTful API with authentication endpoints
- **Database Layer** - Prisma ORM with PostgreSQL and user models
- **UI Component Library** - shadcn/ui integration with Tailwind CSS v4
- **Development Environment** - Hot reload, TypeScript strict mode, and ESLint
- **CLI Tools** - Complete command-line interface for server management
- **TypeScript Project Structure** - Individual tsconfig files for each workspace

### 🔄 **In Development**
- **User Management Dashboard** - Complete CRUD interface for user administration
- **Domain Management** - Multi-domain configuration and management
- **Security Enhancements** - Rate limiting, input validation, and CORS
- **API Documentation** - Comprehensive API documentation and testing

### 📋 **Planned Features**
- **Mail Protocol Engines** - SMTP, IMAP, POP3 implementation
- **Web Administration Dashboard** - Complete server management interface
- **Email Processing** - Queue system and delivery mechanisms
- **Advanced Security** - Spam filtering, virus scanning, encryption
- **Mobile Application** - React Native companion app

---

## 🚀 Quick Start

### 📋 Prerequisites

- **Node.js** 18.0.0 or higher
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
   # Install dependencies
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
Express.js 5.2.1 + TypeScript
├── 🗄️ Prisma ORM (Database Layer)
├── 🔐 JWT Authentication (Complete Implementation)
├── 🛡️ Helmet.js (Security Headers)
├── 🌐 CORS (Cross-Origin Requests)
├── 📦 Compression (Response Optimization)
├── 🔍 bcryptjs (Password Hashing)
└── 📊 Morgan (Logging)
```

### 🗄️ **Data Layer**
```
PostgreSQL + Prisma
├── 🏗️ Schema Management (Migrations)
├── 🔍 Query Builder (Type-Safe Queries)
├── 🔄 Connection Pooling (Performance)
├── 👤 User Models (Complete Implementation)
└── 📈 Seed Scripts (Development Data)
```

### 🏗️ **Monorepo Infrastructure**
```
Make + pnpm Workspaces + TypeScript Project References
├── 📦 app/ (Next.js Frontend)
├── ⚙️ server/ (Express.js API)
├── 🛠️ cli/ (Command Line Tools)
├── 🔧 tools/ (Development Utilities)
├── 📚 services/ (Core Mail Services)
└── 🗂️ routers/ (API Routing)
```

---

## 📁 Architecture

### 🏗️ **Monorepo Structure**

```
aether-mailer/
├── app/                     # Next.js 16 Frontend Application
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
├── server/                 # Express.js API Server
│   ├── src/
│   │   ├── config/        # Database and server configuration
│   │   ├── controllers/   # Request handlers (auth, users)
│   │   ├── middlewares/   # Express middleware (auth, validation)
│   │   ├── models/        # Data models
│   │   ├── routes/        # API route definitions
│   │   ├── services/      # Business logic (auth, users)
│   │   └── server.ts      # Main server entry point
│   └── package.json       # Server-specific dependencies
├── cli/                    # Command Line Interface
│   ├── src/
│   │   ├── commands/      # CLI commands (users, domains, backup)
│   │   ├── utils/         # CLI utilities
│   │   └── types/         # TypeScript definitions
│   └── package.json       # CLI-specific dependencies
├── services/               # Core Mail Services (Future)
├── tools/                  # Development Utilities
├── routers/                # API Routing Services
├── prisma/                 # Database Schema & Migrations
│   ├── schema.prisma      # Database schema definition
│   └── config.ts          # Prisma configuration
├── public/                 # Static Assets
├── docs/                   # Documentation
├── docker/                 # Docker Configuration
├── .storybook/             # Storybook Configuration
└── electron/               # Electron App (Future)
```

### 🔄 **Data Flow Architecture**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Next.js App   │    │   Express API    │    │   PostgreSQL    │
│   (Frontend)    │◄──►│   (Backend)      │◄──►│   (Database)    │
│  Port 3000      │    │  Port 8080       │    │  Port 5432      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
   JWT Tokens            API Endpoints         User/Domain Data
   React Context        Authentication         Prisma ORM
   shadcn/ui Components  Business Logic        Migrations
```

---

## 🗺️ Development Roadmap

### 🎯 **Phase 1: Foundation (✅ Complete - Q1 2025)**
- ✅ **Monorepo Setup** - pnpm workspaces with TypeScript project references
- ✅ **Authentication System** - Complete JWT implementation with forms
- ✅ **Frontend Framework** - Next.js 16 + React 19.2.1 + shadcn/ui
- ✅ **Backend API** - Express.js with authentication endpoints
- ✅ **Database Layer** - Prisma with PostgreSQL and user models
- ✅ **CLI Tools** - Complete command-line interface
- ✅ **Development Environment** - TypeScript strict mode, ESLint, hot reload

### 🚀 **Phase 2: Core Features (🔄 In Progress - Q2 2025)**
- 🔄 **User Management Dashboard** - Complete CRUD interface
- 🔄 **Domain Administration** - Multi-domain support
- 🔄 **Security Enhancements** - Rate limiting, validation, CORS
- 📋 **API Documentation** - Comprehensive API docs
- 📋 **Testing Suite** - Unit and integration tests
- 📋 **Performance Optimization** - Caching and optimization

### ⚙️ **Phase 3: Mail Protocols (Q3 2025)**
- 📋 **SMTP Engine** - Incoming email processing
- 📋 **IMAP Server** - Email retrieval and folder management
- 📋 **Email Queue** - Outbound delivery system
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

### 🎯 **Make Command Interface**

The project uses a comprehensive **Makefile** with 60+ commands for streamlined development:

```bash
# 🚀 Quick Start & Development
make quick-start          # Install, migrate, and start dev servers
make dev                 # Start all services (frontend + backend)
make dev-frontend        # Frontend only (port 3000)
make dev-backend         # Backend only (port 8080)
make dev-cli             # CLI development mode

# 🏗️ Building & Production
make build               # Build all packages
make build-frontend       # Frontend production build
make build-backend        # Backend TypeScript compilation
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

### 📋 **Development Workflow**

```bash
# New developer setup
make quick-start

# Daily development
make dev                 # Start working
make lint-fix            # Fix code issues
make typecheck           # Verify types
make test                # Run tests

# Before committing
make format              # Format code
make lint                # Check code quality
make typecheck           # Verify types

# Database changes
make db-migrate          # Apply migrations
make db-studio           # Browse database

# Production deployment
make build               # Build everything
make docker-build        # Create Docker image
make docker-run          # Deploy
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

### 📋 **Development Guidelines**

- **Make-First Workflow** - Use `make` commands for all operations
- **TypeScript Strict Mode** - All code must pass strict type checking
- **Monorepo Best Practices** - Use workspace-specific dependencies
- **Conventional Commits** - Use standardized commit messages
- **Component Structure** - Follow established patterns for React components
- **API Design** - RESTful endpoints with proper HTTP methods
- **Error Handling** - Comprehensive error handling and logging
- **Security First** - Validate all inputs and implement proper authentication

### 🛠️ **Makefile Philosophy**

The Makefile provides:
- **Unified Interface** - Single command system for all operations
- **Cross-Platform** - Works on Linux, macOS, and Windows (with WSL)
- **Colored Output** - Visual feedback for better UX
- **Error Handling** - Proper error messages and exit codes
- **Documentation** - Built-in help system with `make help`
- **Automation** - Complex workflows simplified to single commands

---

## 🔐 Authentication System

### 🎯 **Complete Implementation**

The authentication system is fully implemented with:

- **JWT Tokens** - Secure token-based authentication with refresh mechanism
- **Login/Register Forms** - Complete user authentication flow with validation
- **Auth Context** - Global authentication state management in React
- **Protected Routes** - Route-based authentication guards
- **API Endpoints** - Complete authentication API with Express.js
- **Password Security** - bcryptjs hashing for secure password storage
- **Session Management** - LocalStorage-based session persistence

### 🔄 **Authentication Flow**

```typescript
// Registration Process
1. User submits registration → API validation
2. Password hashing with bcryptjs → Database storage
3. JWT tokens generated → Client receives tokens
4. Auth context updates → User logged in

// Login Process
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

We're looking for contributors to help build this comprehensive mail server! Whether you're experienced with mail protocols, web development, or infrastructure, there's a place for you.

### 🎯 **How to Get Started**

1. **Fork the repository** and create a feature branch
2. **Check the issues** for tasks that need help
3. **Join discussions** about architecture and features
4. **Start small** - Documentation, tests, or minor features
5. **Follow our code standards** and commit guidelines

### 🏗️ **Areas Needing Help**

- **Frontend Development** - React components, UI/UX design, dashboard
- **Backend Development** - API endpoints, business logic, security
- **Database Design** - Schema development, migrations, optimization
- **Mail Protocol Experts** - SMTP, IMAP, JMAP implementation
- **Security Specialists** - Authentication, encryption, filtering
- **DevOps Engineers** - Docker, deployment, CI/CD
- **CLI Development** - Command-line tools and utilities
- **Documentation** - API docs, user guides, tutorials

### 📝 **Contribution Process**

1. **Choose an issue** or create a new one with your proposal
2. **Create a branch** with a descriptive name
3. **Implement your changes** following our guidelines
4. **Test thoroughly** in the monorepo environment
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
- Environment information (Node.js version, OS, etc.)
- Error logs or screenshots
- Expected vs actual behavior

---

## 📊 Project Status

| Component | Status | Notes |
|-----------|--------|-------|
| **Monorepo Architecture** | ✅ Working | pnpm workspaces with TypeScript |
| **Authentication System** | ✅ Working | Complete JWT implementation |
| **Frontend Framework** | ✅ Working | Next.js 16 + React 19.2.1 |
| **UI Component Library** | ✅ Working | shadcn/ui with Tailwind CSS |
| **Backend API** | ✅ Working | Express.js with auth endpoints |
| **Database Layer** | ✅ Working | Prisma with PostgreSQL |
| **CLI Tools** | ✅ Working | Complete command-line interface |
| **User Management** | 🔄 In Progress | Dashboard interface |
| **Domain Management** | 📋 Planned | Multi-domain support |
| **Mail Protocols** | 📋 Planned | SMTP/IMAP engines |
| **Testing Suite** | 📋 Planned | Unit and integration tests |
| **Documentation** | 📋 Planned | API docs and guides |

---

## 🏆 Sponsors & Partners

**Development led by [Sky Genesis Enterprise](https://skygenesisenterprise.com)**

We're looking for sponsors and partners to help accelerate development of this open-source mail server project.

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
- **Next.js Team** - Excellent React framework
- **Express.js Community** - Robust web server framework
- **Prisma Team** - Modern database toolkit
- **shadcn/ui** - Beautiful component library
- **pnpm** - Fast, disk space efficient package manager
- **Make** - Universal build automation and command interface
- **Open Source Community** - Tools, libraries, and inspiration

---

<div align="center">

### 🚀 **Join Us in Building the Future of Email Infrastructure!**

[⭐ Star This Repo](https://github.com/skygenesisenterprise/aether-mailer) • [🐛 Report Issues](https://github.com/skygenesisenterprise/aether-mailer/issues) • [💡 Start a Discussion](https://github.com/skygenesisenterprise/aether-mailer/discussions)

---

**🔧 Active Development - Authentication System Complete!**

**Made with ❤️ by the [Sky Genesis Enterprise](https://skygenesisenterprise.com) team**

*Building a modern mail server with complete authentication and monorepo architecture*

</div>