<div align="center">

# 📦 Aether Mailer Packages

[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](https://github.com/skygenesisenterprise/aether-mailer/blob/main/LICENSE) [![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/) [![Go](https://img.shields.io/badge/Go-1.21+-blue?style=for-the-badge&logo=go)](https://golang.org/) [![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js)](https://nodejs.org/)

**🔥 Modular Package Architecture - Multi-Language Ecosystem for Aether Mailer**

A comprehensive package ecosystem providing language-specific SDKs, tools, and integrations for the Aether Mailer platform. Built with TypeScript, Go, and designed for maximum extensibility.

[📁 Package Overview](#-package-overview) • [🏗️ Architecture](#-architecture) • [📋 Package Details](#-package-details) • [🚀 Usage](#-usage) • [🤝 Contributing](#-contributing)

</div>

---

## 🌟 What is Aether Mailer Packages?

**Aether Mailer Packages** is a modular ecosystem of language-specific packages that provide SDKs, tools, and integrations for the Aether Mailer platform. Each package is designed with specific use cases in mind while maintaining consistency across the ecosystem.

### 🎯 Our Vision

- **Multi-Language Support** - TypeScript, Go, and future language SDKs
- **Modular Architecture** - Independent packages with clear responsibilities
- **Consistent APIs** - Unified design patterns across all packages
- **Developer Experience** - Easy integration with comprehensive documentation
- **Production Ready** - Battle-tested, secure, and performant implementations
- **Ecosystem Integration** - Seamless interaction with Aether Mailer core

---

## 📁 Package Overview

### 🏗️ **Package Ecosystem Structure**

```
package/
├── github/                    # 🚀 GitHub App for Release Orchestration
│   ├── src/                  # TypeScript source code
│   ├── Dockerfile            # Container configuration
│   └── README.md             # Package documentation
├── golang/                   # 🐹 Go SDK & Tools
│   ├── go.mod                # Go modules configuration
│   └── README.md             # Go package documentation
├── node/                     # 📦 Node.js/TypeScript SDK
│   ├── src/                  # TypeScript source code
│   ├── examples/             # Usage examples
│   └── README.md             # Node.js package documentation
└── README.md                 # This overview document
```

---

## 🏗️ Architecture

### 🎯 **Package Responsibilities**

| Package    | Language   | Purpose                | Key Features                            |
| ---------- | ---------- | ---------------------- | --------------------------------------- |
| **github** | TypeScript | GitHub App Integration | Release orchestration, webhook handling |
| **golang** | Go         | Go SDK & Tools         | Native Go client, CLI tools             |
| **node**   | TypeScript | Node.js SDK            | Browser/Node.js client, examples        |

### 🔄 **Integration Architecture**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   GitHub App    │    │   Go SDK         │    │  Node.js SDK    │
│   (github/)     │    │   (golang/)      │    │   (node/)       │
│                 │    │                  │    │                 │
│ 🚀 Release      │    │ 🐹 Native Go     │    │ 📦 Universal     │
│ 📧 Orchestration│    │ 🛠️ CLI Tools     │    │ 🌐 Browser/Node │
│ 🔗 Webhooks     │    │ ⚡ High Perf     │    │ 🎯 TypeScript   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
           │                       │                       │
           └───────────────────────┼───────────────────────┘
                                   ▼
                    ┌─────────────────────────┐
                    │   Aether Mailer Core    │
                    │   (server/)            │
                    │   REST API + SMTP      │
                    │   Authentication       │
                    └─────────────────────────┘
```

---

## 📋 Package Details

### 🚀 **GitHub App Package** (`github/`)

**Purpose**: GitHub Marketplace application for release orchestration and Aether Mailer integration.

**Key Features**:

- ✅ Release type detection (general, mobile, desktop, cloud, sdk)
- ✅ Multi-target release support (+mobile+desktop)
- ✅ Workflow orchestration with GitHub Actions
- ✅ Aether Mailer notification integration
- ✅ Webhook security with HMAC-SHA256
- ✅ Docker deployment ready
- ✅ TypeScript strict mode

**Architecture**:

```
github/
├── src/
│   ├── core/                 # Core business logic
│   │   ├── release-detector.ts    # Release type detection
│   │   └── security.ts            # Security & validation
│   ├── handlers/             # Webhook event handlers
│   │   └── release.ts             # Release event processing
│   ├── services/             # External service integration
│   │   ├── aether-mailer.ts       # Mailer notifications
│   │   └── workflow-orchestrator.ts # CI/CD orchestration
│   ├── utils/                # Utilities & helpers
│   │   ├── logger.ts              # Structured logging
│   │   └── error-handler.ts       # Error handling
│   ├── types/                # TypeScript definitions
│   │   └── index.ts               # Core types
│   ├── config/               # Configuration management
│   │   └── index.ts               # Environment settings
│   └── index.ts              # Main application entry
├── Dockerfile               # Production container
├── docker-compose.yml       # Development deployment
└── package.json             # Dependencies & scripts
```

**Usage**:

```bash
# Development
cd package/github
pnpm install && pnpm dev

# Production
docker-compose up -d
```

---

### 🐹 **Go SDK Package** (`golang/`)

**Purpose**: Native Go SDK and CLI tools for Aether Mailer integration.

**Key Features**:

- ✅ Native Go client library
- ✅ CLI tools for server management
- ✅ High-performance HTTP client
- ✅ Type-safe Go structs
- ✅ Comprehensive error handling
- ✅ Go modules support

**Architecture**:

```
golang/
├── go.mod                   # Go modules configuration
├── go.sum                   # Dependency checksums
├── README.md                # Go package documentation
└── [source files]          # Go source code
```

**Usage**:

```go
// Example Go client usage
import "github.com/skygenesisenterprise/aether-mailer/package/golang"

client := golang.NewClient("http://localhost:8080")
err := client.SendEmail(email)
```

---

### 📦 **Node.js SDK Package** (`node/`)

**Purpose**: Universal TypeScript SDK for Node.js and browser environments.

**Key Features**:

- ✅ Universal client (Node.js + Browser)
- ✅ TypeScript strict mode
- ✅ Authentication handling
- ✅ Email sending capabilities
- ✅ Domain management
- ✅ Statistics and monitoring
- ✅ Comprehensive examples

**Architecture**:

```
node/
├── src/
│   ├── auth/                 # Authentication module
│   │   └── index.ts              # JWT handling
│   ├── client/               # HTTP client
│   │   └── index.ts              # Base client class
│   ├── domain/               # Domain management
│   │   └── index.ts              # Domain operations
│   ├── email/                # Email operations
│   │   └── index.ts              # Email sending
│   ├── stats/                # Statistics
│   │   └── index.ts              # Metrics & analytics
│   ├── types/                # Type definitions
│   │   ├── constants.ts          # Constants
│   │   └── index.ts              # Core types
│   ├── utils/                # Utilities
│   │   └── validation.ts         # Input validation
│   └── index.ts              # Main SDK entry
├── examples/                # Usage examples
│   └── usage-examples.ts         # Practical examples
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript config
└── README.md                # Package documentation
```

**Usage**:

```typescript
// Example Node.js SDK usage
import { AetherMailerClient } from "@aether-mailer/node";

const client = new AetherMailerClient({
  baseURL: "http://localhost:8080",
  apiKey: "your-api-key",
});

await client.email.send({
  to: "user@example.com",
  subject: "Hello from Aether",
  body: "This is a test email",
});
```

---

## 🚀 Usage

### 📋 **Installation Guide**

#### GitHub App

```bash
# Clone and setup
git clone https://github.com/skygenesisenterprise/aether-mailer.git
cd aether-mailer/package/github
pnpm install && pnpm build
```

#### Go SDK

```bash
# Install via go modules
go get github.com/skygenesisenterprise/aether-mailer/package/golang
```

#### Node.js SDK

```bash
# Install via npm
npm install @aether-mailer/node

# Or via pnpm
pnpm add @aether-mailer/node
```

### 🔧 **Configuration**

All packages support environment-based configuration:

```bash
# Core Aether Mailer Configuration
AETHER_MAILER_API_URL=http://localhost:8080
AETHER_MAILER_API_KEY=your-api-key
AETHER_MAILER_TIMEOUT=30000

# Package-specific configurations
GITHUB_APP_ID=12345
GITHUB_WEBHOOK_SECRET=your-secret
```

### 🌐 **Integration Examples**

#### Multi-Language Integration

```typescript
// TypeScript (Node.js SDK)
import { AetherMailerClient } from "@aether-mailer/node";

const tsClient = new AetherMailerClient(config);
```

```go
// Go SDK
import "github.com/skygenesisenterprise/aether-mailer/package/golang"

goClient := golang.NewClient(config)
```

#### GitHub App Integration

```yaml
# .github/workflows/release.yml
name: Release Notification
on:
  release:
    types: [published]
jobs:
  notify:
    runs-on: ubuntu-latest
    steps:
      - name: Notify Aether Mailer
        uses: ./package/github/.github/workflows/notify.yml
```

---

## 🛠️ Development

### 🎯 **Package Development Workflow**

```bash
# For TypeScript packages (github/, node/)
cd package/[package-name]
pnpm install
pnpm dev              # Development mode
pnpm build            # Build for production
pnpm test             # Run tests
pnpm lint             # Code quality
pnpm typecheck        # Type checking

# For Go package (golang/)
cd package/golang
go mod download
go build ./...
go test ./...
go fmt ./...
```

### 📋 **Package Standards**

All packages must follow:

- **Consistent API Design** - Unified patterns across languages
- **Comprehensive Testing** - Unit and integration tests
- **Documentation** - Complete README and API docs
- **Error Handling** - Proper error propagation and logging
- **Security** - Input validation and secure defaults
- **Performance** - Optimized for production use

### 🔄 **Cross-Package Integration**

Packages are designed to work together:

```typescript
// Example: GitHub App using Node.js SDK
import { AetherMailerClient } from "@aether-mailer/node";

// In GitHub App
const mailerClient = new AetherMailerClient(config);
await mailerClient.email.send(releaseNotification);
```

---

## 🤝 Contributing

We welcome contributions to any package in the ecosystem!

### 🎯 **How to Contribute**

1. **Choose a package** - github/, golang/, or node/
2. **Read package-specific README** - Understand package conventions
3. **Create an issue** - Describe your proposed changes
4. **Fork and branch** - Follow standard Git workflow
5. **Implement changes** - Follow package-specific standards
6. **Test thoroughly** - Ensure all tests pass
7. **Submit PR** - With clear description and testing

### 🏗️ **Areas Needing Help**

- **GitHub App** - Webhook handlers, security enhancements
- **Go SDK** - CLI tools, performance optimization
- **Node.js SDK** - Browser compatibility, examples
- **Documentation** - API docs, tutorials, guides
- **Testing** - Test coverage, integration tests
- **Examples** - Real-world usage scenarios

### 📝 **Package-Specific Guidelines**

#### GitHub App (TypeScript)

- Follow TypeScript strict mode
- Use Fastify for HTTP handling
- Implement proper webhook security
- Add comprehensive logging

#### Go SDK

- Follow Go conventions and idioms
- Use Go modules for dependency management
- Implement proper error handling
- Add CLI tool examples

#### Node.js SDK

- Support both Node.js and browser
- Use TypeScript strict mode
- Provide comprehensive examples
- Ensure backward compatibility

---

## 📊 Package Status

| Package    | Status         | Language   | Version | Coverage       | Notes                    |
| ---------- | -------------- | ---------- | ------- | -------------- | ------------------------ |
| **github** | ✅ Production  | TypeScript | 1.0.0   | 🔄 In Progress | GitHub Marketplace ready |
| **golang** | 🔄 Development | Go         | 0.1.0   | 📋 Planned     | Native Go SDK            |
| **node**   | ✅ Stable      | TypeScript | 1.0.0   | 🔄 In Progress | Universal SDK            |

---

## 🔗 Related Documentation

- **[Main Project README](../README.md)** - Overview of entire Aether Mailer project
- **[GitHub App Package](./github/README.md)** - Detailed GitHub App documentation
- **[Go SDK Package](./golang/README.md)** - Go SDK and CLI tools
- **[Node.js SDK Package](./node/README.md)** - Node.js/TypeScript SDK
- **[Server Documentation](../server/README.md)** - Core Aether Mailer server
- **[API Documentation](../docs/api/)** - Complete API reference

---

## 📞 Support & Community

### 💬 **Getting Help**

- 📖 **[Package Documentation](./)** - Individual package README files
- 🐛 **[GitHub Issues](https://github.com/skygenesisenterprise/aether-mailer/issues)** - Bug reports and feature requests
- 💡 **[GitHub Discussions](https://github.com/skygenesisenterprise/aether-mailer/discussions)** - General questions
- 📧 **Email** - packages@skygenesisenterprise.com

### 🐛 **Package-Specific Issues**

When reporting issues, please specify the package:

- **GitHub App**: Use `github` label
- **Go SDK**: Use `golang` label
- **Node.js SDK**: Use `node` label

---

## 📄 License

All packages in this ecosystem are licensed under the **MIT License** - see the [LICENSE](../LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Sky Genesis Enterprise** - Project leadership and package architecture
- **TypeScript Team** - Excellent type system and tooling
- **Go Team** - High-performance programming language
- **Node.js Community** - Universal JavaScript runtime
- **Open Source Contributors** - Package maintainers and contributors

---

<div align="center">

### 🚀 **Choose Your Package and Start Building with Aether Mailer!**

[📦 GitHub App](./github/) • [🐹 Go SDK](./golang/) • [📦 Node.js SDK](./node/)

---

**🔧 Modular Ecosystem - Language-Specific Packages for Maximum Flexibility!**

**Made with ❤️ by the [Sky Genesis Enterprise](https://skygenesisenterprise.com) team**

_Building a comprehensive package ecosystem for Aether Mailer integration_

</div>
