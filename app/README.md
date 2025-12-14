<div align="center">

# 🚀 Aether Mailer Web Application

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19.2.1-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?style=for-the-badge&logo=tailwind-css)

**Complete Mail Server Administration Interface with Dashboard & Management Tools**

[🎯 Purpose](#-purpose) • [🏗️ Architecture](#️-architecture) • [📁 Structure](#-structure) • [🛠️ Development](#️-development) • [🔐 Authentication](#-authentication) • [📊 Features](#-features)

</div>

---

## 🎯 Purpose

The `/app/` directory contains the **Next.js 16 web application** that serves as the comprehensive administration interface for Aether Mailer. This is the primary web UI for managing the mail server, users, domains, monitoring system operations, and complete server administration.

### 🔄 Role in Ecosystem

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Next.js App   │    │   Express API    │    │  Core Services  │
│   (This Dir)    │◄──►│   (Admin API)   │◄──►│  (Mail Engine)  │
│  Port 3000      │    │  Port 8080      │    │  Background     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

- **Web Interface** - Complete administration dashboard with all management tools
- **API Client** - Communicates with Express.js backend for all operations
- **Authentication** - JWT-based login and session management
- **Responsive Design** - Works on desktop, tablet, and mobile browsers
- **Comprehensive Management** - Full mail server administration capabilities

---

## 🏗️ Architecture

### 📋 Current Implementation Status

> **✅ Active Development**: Complete dashboard and management interface implemented and functional.

#### ✅ **Currently Implemented**

- **Next.js 16 Setup** - App Router with TypeScript strict mode
- **Authentication System** - Complete JWT authentication with login/register forms
- **UI Component Library** - Button, Card, Input components with shadcn/ui
- **Layout System** - Root layout with theme and auth providers
- **Styling Foundation** - Tailwind CSS v4 with dark mode support
- **Font Configuration** - Geist Sans and Geist Mono fonts
- **Authentication Pages** - Login, register, forgot password with forms
- **Auth Context** - JWT authentication with token management
- **Complete Dashboard** - Overview, delivery, network, performance, security
- **Account Management** - Passwords, crypto, MFA, app passwords
- **Directory System** - Accounts, domains, groups, roles, tenants management
- **Settings Interface** - Application configuration management
- **Reporting System** - ARF, DMARC, TLS analytics
- **History Tracking** - Delivery and received message history
- **Management Tools** - Logs and tracing interface
- **Queue Management** - Queue monitoring and reporting
- **Spam Management** - Testing and training interface
- **Troubleshooting Tools** - Delivery and DMARC troubleshooting

#### 🔄 **In Development**

- **Email Interface** - Webmail client integration
- **Advanced Analytics** - Detailed system monitoring
- **Multi-language Support** - Internationalization
- **Mobile App** - React Native companion app

#### 📋 **Planned Features**

- **Real-time Monitoring** - Live system metrics
- **Advanced Security** - Enhanced security features
- **API Documentation** - Interactive API docs
- **Testing Suite** - Comprehensive testing framework

---

## 📁 Directory Structure

```
app/
├── account/                    # Account management
│   ├── app-passwords/         # Application passwords
│   ├── crypto/                # Cryptographic settings
│   ├── mfa/                   # Multi-factor authentication
│   ├── password/              # Password management
│   └── page.tsx              # Account overview
├── assets/                    # Static assets
│   └── favicon.ico           # Site favicon
├── components/                # React components
│   ├── ui/                   # UI component library
│   │   ├── button.tsx       # Button component
│   │   ├── card.tsx         # Card component
│   │   └── input.tsx        # Input component
│   ├── Sidebar.tsx           # Main navigation sidebar
│   ├── SidebarSetting.tsx   # Settings navigation sidebar
│   └── login-form.tsx       # Login form component
├── context/                  # React contexts
│   └── JwtAuthContext.tsx   # JWT authentication context
├── dashboard/                # Main dashboard
│   ├── delivry/             # Delivery metrics
│   ├── network/             # Network statistics
│   ├── overview/           # System overview
│   ├── performance/        # Performance metrics
│   ├── security/           # Security dashboard
│   └── page.tsx           # Dashboard home
├── directory/               # Directory management
│   ├── accounts/           # User accounts
│   ├── api_keys/          # API key management
│   ├── domains/           # Domain configuration
│   ├── groups/            # User groups
│   ├── lists/             # Mailing lists
│   ├── oauth-clients/     # OAuth clients
│   ├── roles/             # Role management
│   ├── tenants/           # Tenant management
│   └── page.tsx          # Directory overview
├── forgot/                 # Password recovery
│   └── page.tsx          # Forgot password form
├── history/                # History tracking
│   ├── delivery/          # Delivery history
│   ├── received/          # Received messages
│   └── page.tsx          # History overview
├── lib/                    # Utility libraries
│   ├── logger.ts         # Logging utilities
│   ├── navigation-config.ts # Navigation configuration
│   └── utils.ts          # Helper functions
├── login/                  # Authentication pages
│   ├── loading.tsx       # Loading state
│   ├── options/          # Login options
│   │   └── page.tsx      # Login options page
│   └── page.tsx          # Main login page
├── manage/                 # Management interface
│   ├── logs/             # Log management
│   ├── tracing/         # Tracing tools
│   │   └── live/        # Live tracing
│   └── page.tsx         # Management overview
├── queues/                 # Queue management
│   ├── reports/          # Queue reports
│   └── page.tsx         # Queue overview
├── register/               # User registration
│   └── page.tsx          # Registration form
├── reports/                # Reporting system
│   ├── arf/              # ARF reports
│   ├── dmarc/            # DMARC reports
│   ├── tls/              # TLS reports
│   └── page.tsx         # Reports overview
├── settings/               # Settings interface
│   └── page.tsx         # Application settings
├── spam/                   # Spam management
│   ├── test/             # Spam testing
│   ├── train/            # Spam training
│   └── page.tsx         # Spam overview
├── styles/                 # Global styles
│   └── globals.css       # Tailwind CSS with theme variables
├── troubleshoot/           # Troubleshooting tools
│   ├── delivery/         # Delivery troubleshooting
│   ├── dmarc/            # DMARC troubleshooting
│   └── page.tsx         # Troubleshooting overview
├── layout.tsx             # Root layout with providers
├── page.tsx              # Home page with auth redirect
├── package.json          # Package configuration
├── tsconfig.json         # TypeScript configuration
├── tsconfig.build.json   # Build TypeScript config
├── components.json       # shadcn/ui configuration
├── CODEOWNERS            # Code ownership rules
└── README.md             # This documentation
```

---

## 🛠️ Development

### 🚀 **Getting Started**

1. **Install dependencies**

   ```bash
   pnpm install
   ```

2. **Start development server**

   ```bash
   pnpm dev
   ```

3. **Access the application**
   - **Development**: [http://localhost:3000](http://localhost:3000)
   - **Authentication**: Fully functional login/register system
   - **Dashboard**: Complete administration interface

### 📋 **Available Commands**

```bash
# Development
pnpm dev              # Start Next.js dev server
pnpm build            # Production build
pnpm start            # Start production server
pnpm lint             # ESLint checking
```

### 🔧 **Development Features**

- **Hot Reload** - Fast refresh for components and styles
- **TypeScript Strict** - Type safety throughout the application
- **ESLint Integration** - Code quality and consistency
- **Tailwind CSS** - Utility-first styling with JIT compilation
- **App Router** - Next.js 16 routing with layouts and streaming
- **shadcn/ui** - Modern component library integration

---

## 🔐 Authentication

### 🎯 **Current Implementation**

The authentication system is fully implemented with:

- **JWT Tokens** - Secure token-based authentication
- **Login/Register Forms** - Complete user authentication flow
- **Auth Context** - Global authentication state management
- **Protected Routes** - Route-based authentication guards
- **Token Refresh** - Automatic token renewal
- **Session Persistence** - LocalStorage-based session management

### 🔄 **Authentication Flow**

```typescript
// Login Process
1. User submits credentials → API validation
2. Server returns JWT tokens → Client stores tokens
3. Auth context updates → UI redirects to dashboard
4. Token refresh → Automatic background renewal

// Protected Route Access
1. Route guard checks auth state
2. Valid token → Access granted
3. Invalid/missing token → Redirect to login
```

---

## 📊 Features Overview

### 🎯 **Dashboard Features**

| Feature                 | Description                              | Status     |
| ----------------------- | ---------------------------------------- | ---------- |
| **System Overview**     | Real-time system metrics and status      | ✅ Working |
| **Delivery Metrics**    | Email delivery statistics and monitoring | ✅ Working |
| **Network Statistics**  | Network performance and traffic analysis | ✅ Working |
| **Performance Metrics** | System performance monitoring            | ✅ Working |
| **Security Dashboard**  | Security events and threat monitoring    | ✅ Working |

### 👥 **Account Management**

| Feature                 | Description                       | Status     |
| ----------------------- | --------------------------------- | ---------- |
| **Account Overview**    | User account management interface | ✅ Working |
| **Password Management** | Password change and recovery      | ✅ Working |
| **App Passwords**       | Application-specific passwords    | ✅ Working |
| **Crypto Settings**     | Cryptographic configuration       | ✅ Working |
| **MFA Configuration**   | Multi-factor authentication setup | ✅ Working |

### 🗂️ **Directory Management**

| Feature                  | Description                        | Status     |
| ------------------------ | ---------------------------------- | ---------- |
| **User Accounts**        | Complete user account management   | ✅ Working |
| **Domain Configuration** | Multi-domain setup and management  | ✅ Working |
| **Group Management**     | User group creation and management | ✅ Working |
| **Role Management**      | Role-based access control          | ✅ Working |
| **Tenant Management**    | Multi-tenant support               | ✅ Working |
| **API Key Management**   | API key generation and management  | ✅ Working |
| **OAuth Clients**        | OAuth client configuration         | ✅ Working |
| **Mailing Lists**        | Email list management              | ✅ Working |

### 📈 **Reporting & Analytics**

| Feature              | Description                           | Status     |
| -------------------- | ------------------------------------- | ---------- |
| **ARF Reports**      | Abuse Reporting Format analysis       | ✅ Working |
| **DMARC Reports**    | DMARC authentication reports          | ✅ Working |
| **TLS Reports**      | TLS encryption statistics             | ✅ Working |
| **Queue Reports**    | Queue performance and status          | ✅ Working |
| **History Tracking** | Message delivery and received history | ✅ Working |

### 🛠️ **Management Tools**

| Feature              | Description                           | Status     |
| -------------------- | ------------------------------------- | ---------- |
| **Log Management**   | System log viewing and filtering      | ✅ Working |
| **Tracing Tools**    | Request tracing and debugging         | ✅ Working |
| **Live Tracing**     | Real-time request monitoring          | ✅ Working |
| **Queue Management** | Email queue monitoring and management | ✅ Working |
| **Spam Management**  | Spam testing and training tools       | ✅ Working |
| **Troubleshooting**  | Delivery and DMARC troubleshooting    | ✅ Working |

---

## 🎨 Styling & Theming

### 🎨 **Design System**

#### **Component Library**

- **shadcn/ui Integration** - Modern, accessible components
- **Tailwind CSS v4** - Utility-first styling framework
- **CSS Variables** - Dynamic theme customization
- **Dark Mode Support** - Automatic system preference detection

#### **Available Components**

```typescript
// UI Components
<Button variant="default|destructive|outline|secondary|ghost|link">
<Card className="custom-styles">
<Input type="text|email|password" placeholder="...">
```

#### **Typography**

- **Primary Font**: Geist Sans (variable font)
- **Monospace Font**: Geist Mono (for code and technical content)
- **Font Loading**: Optimized with `subsets: ["latin"]`

---

## 📱 Responsive Design

### 📐 **Breakpoints**

Following Tailwind CSS default breakpoints:

```css
/* Mobile First Approach */
sm: 640px   /* Small tablets */
md: 768px   /* Tablets */
lg: 1024px  /* Laptops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large screens */
```

---

## 🔌 API Integration

### 📡 **Backend Communication**

The web application communicates with the Express.js API server:

```typescript
// API client configuration
const apiClient = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
};
```

### 🔄 **Data Flow**

```
Web App (Next.js) → API Server (Express) → Database (PostgreSQL)
        ↑                        ↓
    JWT Tokens            Core Services
```

---

## 📊 Current Status

| Component              | Status     | Notes                                |
| ---------------------- | ---------- | ------------------------------------ |
| **Next.js Setup**      | ✅ Working | App Router with TypeScript           |
| **Authentication**     | ✅ Working | Complete JWT system with forms       |
| **UI Components**      | ✅ Working | shadcn/ui integration                |
| **Styling System**     | ✅ Working | Tailwind CSS v4 with dark mode       |
| **Layout System**      | ✅ Working | Root layout with providers           |
| **Dashboard**          | ✅ Working | Complete dashboard with all sections |
| **Account Management** | ✅ Working | Full account management interface    |
| **Directory System**   | ✅ Working | Complete directory management        |
| **Settings Interface** | ✅ Working | Application configuration            |
| **Reporting System**   | ✅ Working | ARF, DMARC, TLS reports              |
| **History Tracking**   | ✅ Working | Delivery and received history        |
| **Management Tools**   | ✅ Working | Logs, tracing, queue management      |
| **Spam Management**    | ✅ Working | Testing and training interface       |
| **Troubleshooting**    | ✅ Working | Delivery and DMARC tools             |
| **API Integration**    | ✅ Working | All endpoints connected              |
| **Navigation**         | ✅ Working | Complete navigation system           |

---

## 🚀 Next Steps

### 📋 **Immediate Priorities**

1. **Email Interface**
   - Webmail client integration
   - Email composition and sending
   - Inbox management

2. **Advanced Analytics**
   - Real-time monitoring
   - Detailed performance metrics
   - Custom reporting

3. **Multi-language Support**
   - i18n implementation
   - Translation management
   - Locale switching

### 🎯 **Short-term Goals**

- Complete email interface
- Implement advanced analytics
- Add multi-language support
- Set up comprehensive testing
- Optimize performance

---

## 📞 Support & Resources

### 📖 **Documentation**

- **[Next.js Documentation](https://nextjs.org/docs)** - Framework reference
- **[Tailwind CSS](https://tailwindcss.com/docs)** - Styling guide
- **[shadcn/ui](https://ui.shadcn.com)** - Component library
- **[React Documentation](https://react.dev)** - Component patterns
- **[TypeScript](https://www.typescriptlang.org/docs)** - Type system

### 💬 **Getting Help**

- **GitHub Issues** - Bug reports and feature requests
- **Discussions** - General questions and ideas
- **Development Team** - Contact frontend maintainers

---

## 📄 License

This web application is part of the Aether Mailer project, licensed under the **MIT License** - see the [LICENSE](../LICENSE) file for details.

---

<div align="center">

### 🎨 **Complete Mail Server Administration Interface**

[⭐ Star Project](https://github.com/skygenesisenterprise/aether-mailer) • [🐛 Report Issues](https://github.com/skygenesisenterprise/aether-mailer/issues) • [💡 Start Discussion](https://github.com/skygenesisenterprise/aether-mailer/discussions)

---

**🔧 Active Development - Complete Dashboard & Management Interface!**

**Made with ❤️ by the [Sky Genesis Enterprise](https://skygenesisenterprise.com) frontend team**

_Creating a comprehensive, powerful, and beautiful mail server management experience_

</div>
