<div align="center">

# 🗄️ Aether Mailer Prisma Database

[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](https://github.com/skygenesisenterprise/aether-mailer/blob/main/LICENSE) [![Prisma](https://img.shields.io/badge/Prisma-7.2.0-blue?style=for-the-badge&logo=prisma)](https://www.prisma.io/) [![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/) [![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js)](https://nodejs.org/)

**🔧 Modern Database Layer for Aether Mailer Ecosystem**

Complete Prisma database configuration with comprehensive mail server schema, supporting SQLite for development and PostgreSQL for production.

[🚀 Quick Start](#-quick-start) • [📋 Schema Overview](#-schema-overview) • [🛠️ Development](#️-development) • [📁 Architecture](#-architecture)

</div>

---

## 🌟 What is Aether Mailer Prisma?

**Aether Mailer Prisma** provides the complete database layer for the Aether Mailer ecosystem. Featuring a comprehensive mail server schema with user management, domain administration, email processing, and security features.

### 🎯 Key Features

- **Complete Mail Server Schema** - Comprehensive data models for modern email infrastructure
- **Multi-Database Support** - SQLite for development, PostgreSQL for production
- **Type-Safe Queries** - Full TypeScript integration with Prisma Client
- **Comprehensive Models** - Users, domains, emails, filters, security, and more
- **Performance Optimized** - Efficient queries with proper indexing
- **Migration Ready** - Seamless schema evolution with Prisma Migrate

---

## 🚀 Quick Start

### 📋 Prerequisites

- **Node.js** 18.0.0 or higher
- **pnpm** 9.0.0 or higher
- **Database** - SQLite (dev) or PostgreSQL (prod)

### 🔧 Installation

```bash
# Install within the monorepo
pnpm add @aether-mailer/prisma

# Install dependencies
pnpm install
```

### 🎯 Database Setup

```bash
# Generate Prisma Client
pnpm db:generate

# Run database migrations
pnpm db:migrate

# (Optional) Seed development data
pnpm db:seed

# Open Prisma Studio
pnpm db:studio
```

### 🏗️ Basic Usage

```typescript
import { prisma } from "@aether-mailer/prisma";

// Create a new user
const user = await prisma.user.create({
  data: {
    username: "john.doe",
    email: "john@example.com",
    passwordHash: "hashed_password",
  },
});

// Query users with their domains
const users = await prisma.user.findMany({
  include: {
    ownedDomains: true,
    accounts: true,
  },
});
```

---

## 📋 Schema Overview

### 🏗️ Core Models

#### **User Management**

```typescript
User {
  id, username, email, passwordHash
  firstName, lastName, displayName, role
  isActive, isVerified, twoFactorEnabled
  createdAt, updatedAt, lastLoginAt
  timezone, locale, theme
  maxEmailsPerDay, maxStorageMB
  // Relations: domains, accounts, sessions, etc.
}
```

#### **Domain Administration**

```typescript
Domain {
  id, name, displayName, description
  isActive, isVerified
  maxUsers, maxEmailsPerDay, maxStorageMB
  dkimSelector, dkimPublicKey, spfRecord
  createdAt, verifiedAt
  // Relations: owner, members, accounts, aliases
}
```

#### **Email Accounts**

```typescript
EmailAccount {
  id, email, domainId, userId, passwordHash
  isActive, isDefault, displayName, replyTo
  currentStorage, maxStorageMB
  autoReplyEnabled, forwardEnabled
  spamFilterLevel, quarantineMode
  // Relations: domain, user, sentEmails
}
```

### 📧 Email Management

#### **Email Processing**

```typescript
SentEmail {
  id, fromAccountId, messageId, subject
  bodyText, bodyHtml, recipients (JSON)
  status, sentAt, deliveredAt, openedAt
  size, priority
  // Relations: account, attachments, events
}
```

#### **Email Events & Tracking**

```typescript
EmailEvent {
  id, emailId, event, data (JSON)
  timestamp
  // Events: SENT, DELIVERED, OPENED, CLICKED, BOUNCED
}
```

### 🔐 Security & Authentication

#### **Session Management**

```typescript
Session {
  id, userId, token, userAgent
  ipAddress, expiresAt, createdAt
}
```

#### **API Keys & Usage**

```typescript
ApiKey {
  id, userId, name, keyHash
  permissions (JSON), expiresAt, lastUsedAt
  // Relations: usageLogs
}
```

### 📊 Advanced Features

#### **Email Filters & Signatures**

```typescript
EmailFilter {
  id, userId, name, conditions (JSON)
  action, isActive, priority
  // Actions: MOVE_TO_FOLDER, DELETE, FORWARD, etc.
}
```

#### **Mailing Lists**

```typescript
MailingList {
  id, name, email, domainId
  isActive, moderated, allowSubscribe
  // Relations: subscribers
}
```

---

## 🛠️ Development

### 📁 Project Structure

```
prisma/
├── schema.prisma          # Complete database schema
├── config.ts              # Prisma client configuration
├── seed.ts                # Database seeding script
├── migrations/            # Database migration files
├── package.json
├── tsconfig.json
└── README.md
```

### 🎯 Development Scripts

```bash
# Database Operations
pnpm db:generate          # Generate Prisma Client
pnpm db:migrate           # Run database migrations
pnpm db:push             # Push schema to database
pnpm db:reset            # Reset database
pnpm db:studio           # Open Prisma Studio
pnpm db:seed             # Seed development data

# Development
pnpm dev                 # Start development mode
pnpm build              # Build the package
pnpm typecheck          # Type checking
pnpm lint               # Run ESLint
```

### 🔧 Configuration

```typescript
// config.ts - Dynamic database configuration
import { PrismaClient } from "@prisma/client";

const getDatabaseConfig = () => {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    // Development with SQLite
    return { datasources: { db: { url: "file:./dev.db" } } };
  }

  // Production with PostgreSQL
  return { datasources: { db: { url: databaseUrl } } };
};

export const prisma = new PrismaClient(getDatabaseConfig());
```

### 📝 Environment Variables

```bash
# Database Configuration
DATABASE_URL="postgresql://user:password@localhost:5432/aether"
# or for development: "file:./dev.db"

# Prisma Configuration
PRISMA_GENERATE_DATAPROXY="false"
PRISMA_HIDE_WARNINGS="false"
```

---

## 📁 Architecture

### 🏗️ Database Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   AETHER MAILER DATABASE                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   USERS     │  │   DOMAINS   │  │  EMAIL ACCT │     │
│  │             │  │             │  │             │     │
│  │ • Auth      │  │ • DNS       │  │ • Mailbox   │     │
│  │ • Roles     │  │ • Security  │  │ • Quota     │     │
│  │ • Sessions  │  │ • Members   │  │ • Forward   │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   EMAILS    │  │   FILTERS   │  │   SECURITY  │     │
│  │             │  │             │  │             │     │
│  │ • Tracking  │  │ • Rules     │  │ • API Keys  │     │
│  │ • Events    │  │ • Actions   │  │ • Access    │     │
│  │ • Attach    │  │ • Priority  │  │ • Logs      │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 🔄 Data Flow

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Application   │    │   Prisma Client  │    │   Database      │
│   (API/Web)     │◄──►│   (Type-Safe)    │◄──►│   (SQLite/PG)   │
│                 │    │                  │    │                 │
│ • User Auth     │    │ • Query Builder  │    │ • Schema        │
│ • Email Send    │    │ • Type Safety    │    │ • Migrations    │
│ • Domain Mgmt   │    │ • Relations      │    │ • Indexes       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

---

## 📊 Model Relationships

### 🔗 Key Relationships

```mermaid
erDiagram
    User ||--o{ Domain : owns
    User ||--o{ EmailAccount : has
    User ||--o{ Session : creates
    User ||--o{ ApiKey : generates

    Domain ||--o{ EmailAccount : contains
    Domain ||--o{ DomainMember : has
    Domain ||--o{ EmailAlias : hosts

    EmailAccount ||--o{ SentEmail : sends
    SentEmail ||--o{ EmailAttachment : contains
    SentEmail ||--o{ EmailEvent : tracks

    User ||--o{ EmailFilter : creates
    User ||--o{ EmailSignature : has
```

### 📈 Schema Statistics

| Model            | Fields  | Relations | Indexes |
| ---------------- | ------- | --------- | ------- |
| **User**         | 25      | 10        | 3       |
| **Domain**       | 18      | 6         | 2       |
| **EmailAccount** | 22      | 3         | 4       |
| **SentEmail**    | 15      | 4         | 3       |
| **Total Models** | **20+** | **50+**   | **15+** |

---

## 🔗 Dependencies

### 📦 Core Dependencies

- **@prisma/client**: 7.2.0 - Type-safe database client
- **Node.js**: >=18.0.0 - Runtime environment
- **TypeScript**: ^5.7.3 - Type safety

### 🔗 Database Support

- **SQLite** - Development and testing
- **PostgreSQL** - Production deployment
- **MySQL** - Future support (planned)

---

## 🚀 Migration Guide

### 📋 Schema Evolution

```bash
# Create new migration
npx prisma migrate dev --name add_new_feature

# Apply migrations in production
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

### 🔄 Migration Best Practices

1. **Descriptive Names** - Use clear migration names
2. **Backward Compatibility** - Maintain compatibility during transitions
3. **Testing** - Test migrations in development first
4. **Backup** - Always backup before production migrations

---

## 🤝 Contributing

We welcome contributions to the database schema! Whether you're adding new models, optimizing queries, or improving documentation, there's a place for you.

### 🎯 How to Contribute

1. **Study the Schema** - Understand existing relationships
2. **Design Changes** - Plan modifications carefully
3. **Create Migration** - Generate proper migration files
4. **Test Thoroughly** - Verify in development environment
5. **Update Documentation** - Keep README and comments current

### 🏗️ Areas Needing Help

- **Performance Optimization** - Query optimization and indexing
- **Schema Evolution** - New models for advanced features
- **Testing** - Database test suites
- **Documentation** - Schema documentation improvements
- **Migration Tools** - Automated migration utilities

---

## 📞 Support & Community

### 💬 Get Help

- 📖 **[Prisma Docs](https://www.prisma.io/docs)** - Official Prisma documentation
- 🐛 **[GitHub Issues](https://github.com/skygenesisenterprise/aether-mailer/issues)** - Bug reports and feature requests
- 💡 **[GitHub Discussions](https://github.com/skygenesisenterprise/aether-mailer/discussions)** - General questions

### 🐛 Reporting Database Issues

When reporting database issues, please include:

- Schema changes or migration files
- Query examples and expected results
- Database type and version
- Error messages and stack traces
- Performance metrics (if applicable)

---

## 📊 Database Status

| Feature                      | Status         | Notes                             |
| ---------------------------- | -------------- | --------------------------------- |
| **Core Schema**              | ✅ Working     | Users, domains, emails functional |
| **Authentication**           | ✅ Working     | Sessions, API keys implemented    |
| **Email Processing**         | ✅ Working     | Sent emails, events, tracking     |
| **Security Models**          | ✅ Working     | Access logs, permissions          |
| **Migration System**         | ✅ Working     | Prisma Migrate integrated         |
| **Multi-Database**           | ✅ Working     | SQLite/PostgreSQL support         |
| **Performance Optimization** | 🔄 In Progress | Indexing and query tuning         |
| **Testing Suite**            | 📋 Planned     | Database test coverage            |

---

## 📄 License

This package is licensed under the **MIT License** - see the [LICENSE](../LICENSE) file for details.

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
- **Prisma Team** - Excellent modern database toolkit
- **PostgreSQL Community** - Robust relational database
- **SQLite Team** - Lightweight embedded database
- **TypeScript Team** - Type-safe development experience
- **Open Source Community** - Tools and inspiration

---

<div align="center">

### 🚀 **Building the Database Foundation for Modern Email Infrastructure!**

[⭐ Star This Repo](https://github.com/skygenesisenterprise/aether-mailer) • [🐛 Report Issues](https://github.com/skygenesisenterprise/aether-mailer/issues) • [💡 Start a Discussion](https://github.com/skygenesisenterprise/aether-mailer/discussions)

---

**🗄️ Complete Database Schema with 20+ Models**

**Made with ❤️ by the [Sky Genesis Enterprise](https://skygenesisenterprise.com) team**

_Building a comprehensive database layer for modern mail server infrastructure_

</div>
