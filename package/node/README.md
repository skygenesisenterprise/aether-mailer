<div align="center">

# 📦 Node.js Package: @aether-mailer/node

[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](https://github.com/skygenesisenterprise/aether-mailer/blob/main/LICENSE) [![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js)](https://nodejs.org/) [![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/) [![pnpm](https://img.shields.io/badge/pnpm-9+-red?style=for-the-badge&logo=pnpm)](https://pnpm.io/)

**🔥 Node.js Integration Package for Aether Mailer**

Complete Node.js client library for integrating with Aether Mailer's API services, providing TypeScript-based authentication, mail operations, and admin capabilities.

[🚀 Installation](#-installation) • [📋 Features](#-features) • [🛠️ Usage](#️-usage) • [📁 API Reference](#-api-reference) • [🤝 Contributing](#-contributing)

</div>

---

## 🌟 What is @aether-mailer/node?

**@aether-mailer/node** is the official Node.js client library for Aether Mailer, providing a comprehensive TypeScript-based interface for interacting with the mail server's API services. This package enables seamless integration of Aether Mailer functionality into any Node.js application.

### 🎯 Key Benefits

- **TypeScript-First Design** - Full type safety with comprehensive TypeScript definitions
- **JWT Authentication Support** - Built-in authentication token management
- **Comprehensive API Coverage** - Complete access to all Aether Mailer endpoints
- **Modern Node.js Support** - ES modules and CommonJS compatibility
- **Error Handling** - Robust error handling and retry mechanisms
- **Developer-Friendly** - Clean API with intuitive method names

---

## 📋 Features

### ✅ **Core Functionality**

- **Authentication Management** - Login, registration, token refresh, and logout
- **User Management** - CRUD operations for user accounts
- **Domain Administration** - Multi-domain configuration and management
- **Email Operations** - Send, receive, and manage emails
- **Mail Protocol Access** - SMTP, IMAP, and JMAP protocol interfaces
- **Admin Functions** - Server administration and monitoring

### 🔧 **Technical Features**

- **Full TypeScript Support** - Complete type definitions and IntelliSense
- **Promise-Based API** - Modern async/await support
- **Axios HTTP Client** - Reliable HTTP client with interceptors
- **JWT Token Management** - Automatic token refresh and validation
- **Environment Configuration** - Flexible configuration management
- **Error Handling** - Comprehensive error types and handling
- **Logging Integration** - Optional logging with configurable levels

---

## 🚀 Installation

### 📋 Prerequisites

- **Node.js** 18.0.0 or higher
- **TypeScript** 5.0.0 or higher (recommended)
- **pnpm** 9.0.0 or higher (recommended package manager)

### 🔧 Package Installation

```bash
# Using pnpm (recommended)
pnpm add @aether-mailer/node

# Using npm
npm install @aether-mailer/node

# Using yarn
yarn add @aether-mailer/node

# Development installation (for this monorepo)
pnpm install --filter=@aether-mailer/node
```

### 🔧 Peer Dependencies

The package has the following peer dependencies:

```json
{
  "axios": "^1.6.0",
  "typescript": "^5.0.0"
}
```

---

## 🛠️ Usage

### 🎯 **Basic Setup**

```typescript
import { AetherMailerClient } from "@aether-mailer/node";

// Initialize the client
const client = new AetherMailerClient({
  baseURL: "http://localhost:8080",
  timeout: 10000,
  retryAttempts: 3,
});
```

### 🔐 **Authentication**

```typescript
// Login
const loginResponse = await client.auth.login({
  email: "user@example.com",
  password: "password123",
});

console.log("Login successful:", loginResponse.user.email);

// Get current user
const currentUser = await client.auth.getCurrentUser();

// Refresh token
await client.auth.refreshToken();

// Logout
await client.auth.logout();
```

### 👤 **User Management**

```typescript
// Register new user
const newUser = await client.users.create({
  email: "newuser@example.com",
  password: "securePassword",
  firstName: "John",
  lastName: "Doe",
});

// Get all users (admin)
const users = await client.users.list({
  page: 1,
  limit: 10,
});

// Update user
const updatedUser = await client.users.update(userId, {
  firstName: "John Updated",
});

// Delete user
await client.users.delete(userId);
```

### 🌐 **Domain Management**

```typescript
// Create domain
const domain = await client.domains.create({
  name: "example.com",
  description: "Main domain",
});

// List domains
const domains = await client.domains.list();

// Update domain
const updatedDomain = await client.domains.update(domainId, {
  description: "Updated description",
});

// Delete domain
await client.domains.delete(domainId);
```

### 📧 **Email Operations**

```typescript
// Send email
const emailResult = await client.emails.send({
  to: "recipient@example.com",
  subject: "Hello from Aether Mailer",
  body: "This is a test email",
  htmlBody: "<p>This is a <strong>test</strong> email</p>",
});

// Get emails
const emails = await client.emails.list({
  folder: "inbox",
  page: 1,
  limit: 20,
});

// Get email by ID
const email = await client.emails.getById(emailId);

// Mark email as read
await client.emails.markAsRead(emailId);
```

### 🔧 **Advanced Configuration**

```typescript
const client = new AetherMailerClient({
  baseURL: "https://api.aether-mailer.com",
  timeout: 15000,
  retryAttempts: 5,
  retryDelay: 1000,
  headers: {
    "User-Agent": "MyApp/1.0",
  },
  transformRequest: [
    (data, headers) => {
      // Custom request transformation
      return data;
    },
  ],
  transformResponse: [
    (data) => {
      // Custom response transformation
      return data;
    },
  ],
});

// Custom authentication interceptor
client.addRequestInterceptor((config) => {
  // Add custom headers or modify request
  config.headers["X-Custom-Header"] = "value";
  return config;
});

// Custom response interceptor
client.addResponseInterceptor(
  (response) => {
    // Handle successful responses
    console.log("Response received:", response.status);
    return response;
  },
  (error) => {
    // Handle errors
    console.error("Request failed:", error.message);
    return Promise.reject(error);
  },
);
```

---

## 📁 API Reference

### 🔧 **AetherMailerClient**

The main client class for interacting with Aether Mailer API.

#### **Constructor Options**

```typescript
interface AetherMailerClientOptions {
  baseURL: string; // API base URL
  timeout?: number; // Request timeout in ms (default: 10000)
  retryAttempts?: number; // Retry attempts (default: 3)
  retryDelay?: number; // Retry delay in ms (default: 1000)
  headers?: Record<string, string>; // Default headers
  transformRequest?: AxiosTransformer[]; // Request transformers
  transformResponse?: AxiosTransformer[]; // Response transformers
}
```

### 🔐 **Authentication API**

```typescript
// Login
client.auth.login(credentials: LoginRequest): Promise<LoginResponse>

// Register
client.auth.register(userData: RegisterRequest): Promise<UserResponse>

// Get current user
client.auth.getCurrentUser(): Promise<UserResponse>

// Refresh token
client.auth.refreshToken(): Promise<TokenResponse>

// Logout
client.auth.logout(): Promise<void>
```

### 👤 **User Management API**

```typescript
// Create user
client.users.create(userData: CreateUserRequest): Promise<UserResponse>

// List users
client.users.list(params?: ListUsersParams): Promise<UsersListResponse>

// Get user by ID
client.users.getById(userId: string): Promise<UserResponse>

// Update user
client.users.update(userId: string, userData: UpdateUserRequest): Promise<UserResponse>

// Delete user
client.users.delete(userId: string): Promise<void>

// Change user password
client.users.changePassword(userId: string, passwordData: ChangePasswordRequest): Promise<void>
```

### 🌐 **Domain Management API**

```typescript
// Create domain
client.domains.create(domainData: CreateDomainRequest): Promise<DomainResponse>

// List domains
client.domains.list(): Promise<DomainsListResponse>

// Get domain by ID
client.domains.getById(domainId: string): Promise<DomainResponse>

// Update domain
client.domains.update(domainId: string, domainData: UpdateDomainRequest): Promise<DomainResponse>

// Delete domain
client.domains.delete(domainId: string): Promise<void>

// Verify domain
client.domains.verify(domainId: string): Promise<DomainVerificationResponse>
```

### 📧 **Email Operations API**

```typescript
// Send email
client.emails.send(emailData: SendEmailRequest): Promise<SendEmailResponse>

// List emails
client.emails.list(params?: ListEmailsParams): Promise<EmailsListResponse>

// Get email by ID
client.emails.getById(emailId: string): Promise<EmailResponse>

// Mark email as read
client.emails.markAsRead(emailId: string): Promise<void>

// Mark email as unread
client.emails.markAsUnread(emailId: string): Promise<void>

// Delete email
client.emails.delete(emailId: string): Promise<void>

// Move email to folder
client.emails.moveToFolder(emailId: string, folder: string): Promise<void>
```

### 🔧 **Admin API**

```typescript
// Get server status
client.admin.getServerStatus(): Promise<ServerStatusResponse>

// Get system metrics
client.admin.getSystemMetrics(): Promise<SystemMetricsResponse>

// Get logs
client.admin.getLogs(params?: GetLogsParams): Promise<LogsResponse>

// Perform maintenance
client.admin.performMaintenance(task: MaintenanceTask): Promise<MaintenanceResponse>
```

---

## 🔧 **Type Definitions**

### 🔐 **Authentication Types**

```typescript
interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

interface LoginResponse {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "admin" | "user";
  createdAt: string;
  updatedAt: string;
}
```

### 📧 **Email Types**

```typescript
interface SendEmailRequest {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  body: string;
  htmlBody?: string;
  attachments?: EmailAttachment[];
}

interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
}

interface Email {
  id: string;
  from: string;
  to: string[];
  subject: string;
  body: string;
  htmlBody?: string;
  attachments: EmailAttachment[];
  isRead: boolean;
  folder: string;
  createdAt: string;
  updatedAt: string;
}
```

---

## 🔧 **Error Handling**

### 🎯 **Error Types**

The library provides comprehensive error handling with custom error types:

```typescript
import {
  AetherMailerError,
  AuthenticationError,
  ValidationError,
  NetworkError,
  APIError,
} from "@aether-mailer/node";

try {
  await client.auth.login(credentials);
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error("Authentication failed:", error.message);
  } else if (error instanceof ValidationError) {
    console.error("Invalid credentials:", error.details);
  } else if (error instanceof NetworkError) {
    console.error("Network issue:", error.message);
  } else if (error instanceof APIError) {
    console.error("API error:", error.code, error.message);
  }
}
```

### 🔄 **Retry Mechanism**

The client includes automatic retry logic for transient failures:

```typescript
const client = new AetherMailerClient({
  baseURL: "https://api.aether-mailer.com",
  retryAttempts: 5,
  retryDelay: 2000,
});

// The client will automatically retry failed requests
// based on the configuration
```

---

## 🔧 **Environment Configuration**

### 📋 **Environment Variables**

The library supports configuration through environment variables:

```bash
# API Configuration
AETHER_MAILER_API_URL=https://api.aether-mailer.com
AETHER_MAILER_TIMEOUT=10000
AETHER_MAILER_RETRY_ATTEMPTS=3

# Authentication (optional)
AETHER_MAILER_API_KEY=your-api-key
AETHER_MAILER_JWT_SECRET=your-jwt-secret

# Logging
AETHER_MAILER_LOG_LEVEL=info
```

### 🔧 **Configuration Files**

You can also use configuration files:

```javascript
// aether-mailer.config.js
module.exports = {
  baseURL: process.env.AETHER_MAILER_API_URL || "https://api.aether-mailer.com",
  timeout: parseInt(process.env.AETHER_MAILER_TIMEOUT) || 10000,
  retryAttempts: parseInt(process.env.AETHER_MAILER_RETRY_ATTEMPTS) || 3,
  logLevel: process.env.AETHER_MAILER_LOG_LEVEL || "error",
};
```

---

## 🧪 **Testing**

### 📋 **Running Tests**

```bash
# Install dependencies
pnpm install --filter=@aether-mailer/node

# Run tests
pnpm test --filter=@aether-mailer/node

# Run tests with coverage
pnpm test:coverage --filter=@aether-mailer/node

# Run tests in watch mode
pnpm test:watch --filter=@aether-mailer/node
```

### 🎯 **Test Examples**

```typescript
import { AetherMailerClient } from "@aether-mailer/node";

describe("AetherMailerClient", () => {
  let client: AetherMailerClient;

  beforeEach(() => {
    client = new AetherMailerClient({
      baseURL: "http://localhost:8080",
    });
  });

  it("should authenticate user successfully", async () => {
    const result = await client.auth.login({
      email: "test@example.com",
      password: "password",
    });

    expect(result.user.email).toBe("test@example.com");
    expect(result.tokens.accessToken).toBeDefined();
  });
});
```

---

## 🤝 **Contributing**

We welcome contributions to the @aether-mailer/node package! Please see the [main contributing guide](../../CONTRIBUTING.md) for detailed instructions.

### 🎯 **Development Setup**

```bash
# Clone the repository
git clone https://github.com/skygenesisenterprise/aether-mailer.git
cd aether-mailer/package/node

# Install dependencies
pnpm install

# Start development
pnpm dev

# Build the package
pnpm build

# Run tests
pnpm test
```

### 📋 **Code Style**

- **TypeScript** - Strict mode enabled
- **ESLint** - Code linting and formatting
- **Prettier** - Code formatting
- **Husky** - Pre-commit hooks

### 🏗️ **Package Structure**

```
package/node/
├── src/
│   ├── index.ts              # Main package exports
│   ├── client/               # Client implementation
│   │   ├── AetherMailerClient.ts
│   │   ├── auth/             # Authentication API
│   │   ├── users/            # User management API
│   │   ├── domains/          # Domain management API
│   │   ├── emails/           # Email operations API
│   │   └── admin/            # Admin API
│   ├── types/                # TypeScript type definitions
│   │   ├── auth.ts
│   │   ├── user.ts
│   │   ├── domain.ts
│   │   ├── email.ts
│   │   └── index.ts
│   ├── errors/               # Error handling
│   │   ├── AetherMailerError.ts
│   │   ├── AuthenticationError.ts
│   │   ├── ValidationError.ts
│   │   └── index.ts
│   └── utils/                # Utility functions
│       ├── http.ts
│       ├── validation.ts
│       └── index.ts
├── tests/                    # Test files
├── package.json              # Package configuration
├── tsconfig.json             # TypeScript configuration
├── tsconfig.build.json       # Build configuration
└── README.md                 # This file
```

---

## 📄 **License**

This package is licensed under the **MIT License** - see the [LICENSE](../../../LICENSE) file for details.

---

## 🙏 **Acknowledgments**

- **Sky Genesis Enterprise** - Project leadership and development
- **Axios Team** - Excellent HTTP client library
- **TypeScript Team** - Modern typed JavaScript
- **Node.js Community** - Robust server-side JavaScript runtime
- **Open Source Community** - Tools, libraries, and inspiration

---

<div align="center">

### 🚀 **Enhance Your Node.js Apps with Aether Mailer Integration!**

[📦 npm package](https://www.npmjs.com/package/@aether-mailer/node) • [📚 Documentation](../../../docs/) • [🐛 Report Issues](https://github.com/skygenesisenterprise/aether-mailer/issues) • [💡 Start a Discussion](https://github.com/skygenesisenterprise/aether-mailer/discussions)

---

**🔧 TypeScript-First Node.js Client for Aether Mailer**

**Made with ❤️ by the [Sky Genesis Enterprise](https://skygenesisenterprise.com) team**

</div>
