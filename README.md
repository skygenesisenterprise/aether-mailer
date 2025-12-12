<div align="center">

# 🚀 Aether Mailer

[![Version](https://img.shields.io/badge/version-0.1.0-alpha-orange?style=for-the-badge)](https://github.com/skygenesisenterprise/aether-mailer) [![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](https://github.com/skygenesisenterprise/aether-mailer/blob/main/LICENSE) [![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/) [![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/) [![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js)](https://nodejs.org/)

**🔥 Modern Mail Server Foundation - Built with Next.js & Express.js**

A next-generation mail server foundation currently in early development, featuring a modern web stack and enterprise-ready architecture.

[🚀 Quick Start](#-quick-start) • [📋 Current Status](#-current-status) • [🛠️ Tech Stack](#️-tech-stack) • [🗺️ Roadmap](#-roadmap) • [🤝 Contributing](#-contributing)

[![GitHub stars](https://img.shields.io/github/stars/skygenesisenterprise/aether-mailer?style=social)](https://github.com/skygenesisenterprise/aether-mailer/stargazers) [![GitHub forks](https://img.shields.io/github/forks/skygenesisenterprise/aether-mailer?style=social)](https://github.com/skygenesisenterprise/aether-mailer/network) [![GitHub issues](https://img.shields.io/github/issues/github/skygenesisenterprise/aether-mailer)](https://github.com/skygenesisenterprise/aether-mailer/issues)

</div>

---

## 🌟 What is Aether Mailer?

**Aether Mailer** is an ambitious project to build a modern, enterprise-grade mail server from the ground up. Currently in **alpha development**, we're establishing the foundation with a modern web stack and scalable architecture.

### 🎯 Our Vision
- **Modern Architecture** - Built with TypeScript, Next.js, and Express.js
- **Enterprise-Ready** - Designed for scalability, security, and maintainability  
- **Web-First Administration** - Intuitive web-based management interface
- **Protocol Support** - Planned support for SMTP, IMAP, JMAP, CalDAV, and CardDAV
- **Developer-Friendly** - Clean code, comprehensive documentation, and extensible design

---

## 📋 Current Status

> **⚠️ Early Development Notice**: This project is in **alpha stage** with basic infrastructure only. Core mail server functionality is under development.

### ✅ **Currently Implemented**
- **Next.js 16 Frontend** - Modern React application with TypeScript
- **Express.js API Server** - RESTful API foundation with middleware
- **Database Layer** - Prisma ORM with PostgreSQL configuration
- **Authentication Structure** - JWT-based auth context (implementation pending)
- **Development Environment** - Hot reload, TypeScript, and ESLint setup
- **Styling System** - Tailwind CSS v4 with dark mode support

### 🔄 **In Development**
- **User Management System** - Registration, login, and profile management
- **Database Schema** - User, domain, and email storage models
- **API Endpoints** - User CRUD operations and authentication
- **Security Middleware** - Rate limiting, CORS, and validation

### 📋 **Planned Features**
- **Mail Protocol Engines** - SMTP, IMAP, POP3 implementation
- **Web Administration** - Complete dashboard for server management
- **Multi-Domain Support** - Enterprise domain management
- **Email Processing** - Queue system and delivery mechanisms
- **Security Features** - Spam filtering, virus scanning, encryption

---

## 🚀 Quick Start

### 📋 Prerequisites

- **Node.js** 18.0.0 or higher
- **pnpm** 9.0.0 or higher (recommended package manager)
- **PostgreSQL** 14.0 or higher (for database)

### 🔧 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/skygenesisenterprise/aether-mailer.git
   cd aether-mailer
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   # Configure your database and environment variables
   ```

4. **Database initialization**
   ```bash
   # Generate Prisma client
   pnpm prisma generate
   
   # Run database migrations (when schema is ready)
   pnpm prisma migrate dev
   ```

5. **Start development servers**
   ```bash
   # Start both frontend and backend
   pnpm dev
   
   # Or start individually:
   pnpm dev:frontend  # Next.js on port 3000
   pnpm dev:backend   # Express.js on port 8080
   ```

### 🌐 Access Points

Once running, you can access:
- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **API Server**: [http://localhost:8080](http://localhost:8080)
- **Health Check**: [http://localhost:8080/health](http://localhost:8080/health)

---

## 🛠️ Tech Stack

### 🎨 **Frontend Layer**
```
Next.js 16 + React 19 + TypeScript 5.9
├── 🎨 Tailwind CSS v4 (Styling & Dark Mode)
├── 🔄 React Context (State Management)
├── 🛣️ Next.js App Router (Routing)
├── 📝 TypeScript Strict Mode (Type Safety)
└── 🔧 ESLint + Prettier (Code Quality)
```

### ⚙️ **Backend Layer**
```
Express.js 5.2.1 + TypeScript
├── 🗄️ Prisma ORM (Database Layer)
├── 🔐 JWT (Authentication - Pending)
├── 🛡️ Helmet.js (Security Headers)
├── 🌐 CORS (Cross-Origin Requests)
├── 📦 Compression (Response Optimization)
└── 📊 Morgan (Logging - Planned)
```

### 🗄️ **Data Layer**
```
PostgreSQL + Prisma
├── 🏗️ Schema Management (Migrations)
├── 🔍 Query Builder (Type-Safe Queries)
├── 🔄 Connection Pooling (Performance)
└── 📈 Seed Scripts (Development Data)
```

### 🐳 **Infrastructure**
```
Development & Deployment
├── 🐳 Docker (Containerization - Planned)
├── 🔧 Docker Compose (Multi-Service - Planned)
├── 🚀 CI/CD Pipeline (GitHub Actions - Planned)
└── ☁️ Cloud Deployment (AWS/GCP - Planned)
```

---

## 📁 Project Structure

```
aether-mailer/
├── app/                     # Next.js App Router
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Home page
│   ├── login/              # Authentication pages
│   ├── register/           # User registration
│   ├── forgot/             # Password recovery
│   └── styles/             # Global CSS and themes
├── server/                 # Express.js API server
│   ├── src/
│   │   ├── config/         # Database and server config
│   │   ├── controllers/    # Request handlers
│   │   ├── middlewares/    # Express middleware
│   │   ├── models/         # Data models
│   │   ├── routes/         # API route definitions
│   │   ├── services/       # Business logic
│   │   └── server.ts       # Main server entry point
│   └── tsconfig.json       # TypeScript configuration
├── services/               # Core mail services (Future)
├── cmd/                    # CLI tools (Future)
├── prisma/                 # Database schema and migrations
├── public/                 # Static assets
├── docs/                   # Documentation (Future)
└── tools/                  # Development utilities
```

---

## 🗺️ Development Roadmap

### 🎯 **Phase 1: Foundation (Current - Q1 2025)**
- ✅ **Project Setup** - Next.js + Express.js architecture
- ✅ **Development Environment** - TypeScript, ESLint, hot reload
- 🔄 **Database Schema** - User, domain, and email models
- 🔄 **Authentication System** - JWT-based login/registration
- 📋 **API Endpoints** - User management and configuration
- 📋 **Frontend Pages** - Login, register, dashboard skeleton

### 🚀 **Phase 2: Core Features (Q2 2025)**
- 📋 **User Management** - Complete CRUD operations
- 📋 **Domain Administration** - Multi-domain support
- 📋 **Basic Email Storage** - Message persistence and retrieval
- 📋 **Web Dashboard** - Administration interface
- 📋 **Security Implementation** - Rate limiting, validation
- 📋 **Testing Suite** - Unit and integration tests

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
- 📋 **Performance Optimization** - Caching and scaling

---

## 💻 Development

### 🎯 **Available Commands**

```bash
# 🚀 Development
pnpm dev              # Start both frontend and backend
pnpm dev:frontend     # Next.js only (port 3000)
pnpm dev:backend      # Express.js only (port 8080)

# 🏗️ Building
pnpm build            # Production build for both
pnpm build:frontend   # Next.js production build
pnpm build:backend    # Express.js TypeScript compilation

# 🔧 Code Quality
pnpm lint             # ESLint checking
pnpm lint:fix         # Auto-fix linting issues
pnpm typecheck        # TypeScript type checking

# 🗄️ Database
pnpm prisma generate  # Generate Prisma client
pnpm prisma migrate   # Run database migrations
pnpm prisma studio    # Database browser
pnpm prisma db seed   # Seed development data
```

### 📋 **Development Guidelines**

- **TypeScript Strict Mode** - All code must pass strict type checking
- **Conventional Commits** - Use standardized commit messages
- **Component Structure** - Follow established patterns for React components
- **API Design** - RESTful endpoints with proper HTTP methods
- **Error Handling** - Comprehensive error handling and logging
- **Testing** - Write tests for all new features (when test framework is added)

---

## 🤝 Contributing

We're looking for contributors to help build this ambitious project! Whether you're experienced with mail protocols, web development, or infrastructure, there's a place for you.

### 🎯 **How to Get Started**

1. **Fork the repository** and create a feature branch
2. **Check the issues** for tasks that need help
3. **Join discussions** about architecture and features
4. **Start small** - Documentation, tests, or minor features
5. **Follow our code standards** and commit guidelines

### 🏗️ **Areas Needing Help**

- **Frontend Development** - React components, UI/UX design
- **Backend Development** - API endpoints, business logic
- **Database Design** - Schema development, migrations
- **Mail Protocol Experts** - SMTP, IMAP, JMAP implementation
- **Security Specialists** - Authentication, encryption, filtering
- **DevOps Engineers** - Docker, deployment, CI/CD
- **Documentation** - API docs, user guides, tutorials

### 📝 **Contribution Process**

1. **Choose an issue** or create a new one with your proposal
2. **Create a branch** with a descriptive name
3. **Implement your changes** following our guidelines
4. **Test thoroughly** (when test framework is available)
5. **Submit a pull request** with clear description
6. **Address feedback** from maintainers and community

---

## 📞 Support & Community

### 💬 **Get Help**

- 📖 **[Documentation](docs/)** - Comprehensive guides (in development)
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
| **Frontend Framework** | ✅ Working | Next.js 16 + React 19 |
| **Backend API** | ✅ Working | Express.js with basic middleware |
| **Database Layer** | 🔄 In Progress | Prisma configured, schema pending |
| **Authentication** | 📋 Planned | JWT structure ready |
| **User Management** | 📋 Planned | Basic CRUD operations |
| **Mail Protocols** | 📋 Planned | SMTP/IMAP engines |
| **Web Dashboard** | 📋 Planned | Administration interface |
| **Security Features** | 📋 Planned | Rate limiting, validation |
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
- **Open Source Community** - Tools, libraries, and inspiration

---

<div align="center">

### 🚀 **Join Us in Building the Future of Email Infrastructure!**

[⭐ Star This Repo](https://github.com/skygenesisenterprise/aether-mailer) • [🐛 Report Issues](https://github.com/skygenesisenterprise/aether-mailer/issues) • [💡 Start a Discussion](https://github.com/skygenesisenterprise/aether-mailer/discussions)

---

**🔧 Currently in Alpha Development - All Contributions Welcome!**

**Made with ❤️ by the [Sky Genesis Enterprise](https://skygenesisenterprise.com) team**

*Building a modern mail server, one commit at a time*

</div>