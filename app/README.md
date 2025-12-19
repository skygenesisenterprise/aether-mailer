<div align="center">

# 🚀 Aether Mailer Web Application

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19.2.3-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?style=for-the-badge&logo=tailwind-css)

**Complete Mail Server Administration Interface with Dashboard & Management Tools**

[🎯 Purpose](#-purpose) • [🏗️ Architecture](#️-architecture) • [📁 Structure](#-structure) • [🛠️ Development](#️-development) • [🎨 Styling](#-styling) • [🔐 Authentication](#-authentication) • [📊 Features](#-features)

</div>

---

## 🎯 Purpose

The `/app/` directory contains the **Next.js 16 web application** serving as the comprehensive administration interface for Aether Mailer. This is the primary web UI for managing the mail server, users, domains, monitoring systems, and complete server administration.

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
- **Authentication** - JWT-based login and session management with context providers
- **Responsive Design** - Works on desktop, tablet, and mobile browsers
- **Comprehensive Management** - Full mail server administration capabilities

---

## 🏗️ Architecture

### 📋 Current Implementation Status

> **✅ Active Development**: Complete dashboard and management interface implemented and functional.

#### ✅ **Currently Implemented**

- **Next.js 16 Setup** - App Router with TypeScript strict mode and ES modules
- **Authentication System** - Complete JWT authentication with login/register forms
- **UI Component Library** - Button, Card, Input components with shadcn/ui integration
- **Layout System** - Root layout with theme and auth providers
- **Styling Foundation** - Tailwind CSS v4 with @import syntax and dark mode
- **Font Configuration** - Geist Sans and Geist Mono fonts with optimized loading
- **Configuration Files** - Migrated config files to app/ directory with proper ES module support
- **Complete Dashboard** - Overview, delivery, network, performance, security sections
- **Account Management** - Passwords, crypto, MFA, app passwords interfaces
- **Directory System** - Accounts, domains, groups, roles, tenants management
- **Settings Interface** - Application configuration management
- **Reporting System** - ARF, DMARC, TLS analytics and reporting
- **History Tracking** - Delivery and received message history
- **Management Tools** - Logs and tracing interface with live monitoring
- **Queue Management** - Queue monitoring and reporting interface
- **Spam Management** - Testing and training interface
- **Troubleshooting Tools** - Delivery and DMARC troubleshooting

#### 🔄 **Recent Updates**

- **Migrated to Tailwind CSS v4** - Updated configuration and syntax
- **ES Module Configuration** - All config files now use ES module syntax
- **Localized Config Files** - Moved Next.js, PostCSS, and Tailwind configs to app/ directory
- **Enhanced ESLint** - Added ES module support and App Router compatibility
- **Updated Dependencies** - Added clsx, tailwind-merge, tw-animate-css

#### 📋 **In Development**

- **Email Interface** - Webmail client integration
- **Advanced Analytics** - Detailed system monitoring with real-time metrics
- **Multi-language Support** - Internationalization with i18next
- **Mobile App** - React Native companion app integration

#### 📋 **Planned Features**

- **Real-time Monitoring** - Live system metrics and WebSocket integration
- **Advanced Security** - Enhanced security features and auditing
- **API Documentation** - Interactive API docs with Swagger/OpenAPI
- **Testing Suite** - Comprehensive testing framework with Jest and Playwright

---

## 📁 Directory Structure

```
app/
├── account/                    # Account management
│   ├── app-passwords/         # Application passwords management
│   ├── crypto/                # Cryptographic settings interface
│   ├── mfa/                   # Multi-factor authentication setup
│   ├── password/              # Password management interface
│   └── page.tsx              # Account overview dashboard
├── assets/                    # Static assets
│   └── favicon.ico           # Site favicon
├── components/                # React components
│   ├── ui/                   # UI component library (shadcn/ui)
│   │   ├── button.tsx       # Button component with variants
│   │   ├── card.tsx         # Card component for layouts
│   │   └── input.tsx        # Input component with validation
│   ├── Sidebar.tsx           # Main navigation sidebar
│   ├── SidebarSetting.tsx   # Settings navigation sidebar
│   └── login-form.tsx       # Login form component with validation
├── context/                  # React contexts
│   └── JwtAuthContext.tsx   # JWT authentication state management
├── dashboard/                # Main dashboard
│   ├── delivry/             # Delivery metrics and monitoring
│   ├── network/             # Network statistics and analysis
│   ├── overview/           # System overview dashboard
│   ├── performance/        # Performance metrics and monitoring
│   ├── security/           # Security dashboard and alerts
│   └── page.tsx           # Dashboard home page
├── directory/               # Directory management
│   ├── accounts/           # User accounts management
│   ├── api_keys/          # API key management interface
│   ├── domains/           # Domain configuration and management
│   ├── groups/            # User group management
│   ├── lists/             # Mailing lists management
│   ├── oauth-clients/     # OAuth client configuration
│   ├── roles/             # Role-based access control
│   ├── tenants/           # Multi-tenant management
│   └── page.tsx          # Directory overview page
├── forgot/                 # Password recovery
│   └── page.tsx          # Forgot password form
├── history/                # History tracking
│   ├── delivery/          # Delivery history and logs
│   ├── received/          # Received message history
│   └── page.tsx          # History overview
├── lib/                    # Utility libraries
│   ├── logger.ts         # Logging utilities for debugging
│   ├── navigation-config.ts # Navigation configuration and routes
│   └── utils.ts          # Helper functions (clsx, twMerge)
├── login/                  # Authentication pages
│   ├── loading.tsx       # Loading state for authentication
│   ├── options/          # Login options and methods
│   │   └── page.tsx      # Login options page
│   └── page.tsx          # Main login page
├── manage/                 # Management interface
│   ├── logs/             # Log management interface
│   ├── tracing/         # Tracing tools and debugging
│   │   └── live/        # Live tracing monitoring
│   └── page.tsx         # Management overview
├── queues/                 # Queue management
│   ├── reports/          # Queue reports and analytics
│   └── page.tsx         # Queue overview
├── register/               # User registration
│   └── page.tsx          # Registration form with validation
├── reports/                # Reporting system
│   ├── arf/              # ARF (Abuse Reporting Format) reports
│   ├── dmarc/            # DMARC authentication reports
│   ├── tls/              # TLS encryption reports
│   └── page.tsx         # Reports overview
├── settings/               # Settings interface
│   └── page.tsx         # Application settings management
├── spam/                   # Spam management
│   ├── test/             # Spam testing interface
│   ├── train/            # Spam training interface
│   └── page.tsx         # Spam overview
├── styles/                 # Global styles
│   └── globals.css       # Tailwind CSS v4 with theme variables
├── troubleshoot/           # Troubleshooting tools
│   ├── delivery/         # Delivery troubleshooting tools
│   ├── dmarc/            # DMARC troubleshooting interface
│   └── page.tsx         # Troubleshooting overview
├── layout.tsx             # Root layout with providers
├── page.tsx              # Home page with auth redirect
├── package.json          # Package configuration and dependencies
├── tsconfig.json         # TypeScript configuration
├── tsconfig.build.json   # Build TypeScript config
├── components.json       # shadcn/ui configuration
├── eslint.config.mjs     # ESLint configuration for ES modules
├── next.config.ts        # Next.js 16 configuration
├── postcss.config.mjs    # PostCSS configuration for Tailwind
├── tailwind.config.js    # Tailwind CSS v4 configuration
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
   - **API Backend**: Requires server running on port 8080

### 📋 **Available Commands**

```bash
# Development
pnpm dev              # Start Next.js development server
pnpm build            # Production build with optimization
pnpm start            # Start production server
pnpm lint             # ESLint checking with custom config
```

### 🔧 **Development Features**

- **Hot Reload** - Fast refresh for components and styles with Next.js
- **TypeScript Strict** - Type safety throughout the application
- **ESLint Integration** - Code quality and consistency with custom rules
- **Tailwind CSS v4** - Utility-first styling with JIT compilation
- **App Router** - Next.js 16 routing with layouts and streaming
- **shadcn/ui** - Modern, accessible component library
- **ES Modules** - Modern module system for all configuration files
- **Dark Mode** - Automatic system preference detection and manual toggle

---

## 🎨 Styling & Theming

### 🎨 **Design System**

#### **Component Library**

- **shadcn/ui Integration** - Modern, accessible components with Radix UI
- **Tailwind CSS v4** - Utility-first styling framework with @import syntax
- **CSS Variables** - Dynamic theme customization with oklch color space
- **Dark Mode Support** - Automatic system preference detection
- **Animation Support** - tw-animate-css for smooth transitions

#### **Updated Configuration Files**

- **app/tailwind.config.js** - Migrated to v4 ES module syntax
- **app/postcss.config.mjs** - PostCSS configuration for Tailwind v4
- **app/next.config.ts** - Next.js 16 with API rewrites and headers
- **app/eslint.config.mjs** - ESLint with ES module support
- **app/components.json** - shadcn/ui configuration with correct paths

#### **Available Components**

```typescript
// UI Components (shadcn/ui)
<Button variant="default|destructive|outline|secondary|ghost|link" size="sm|md|lg">
<Card className="custom-styles">
<Input type="text|email|password" placeholder="..." className="..." />
```

#### **Typography & Fonts**

- **Primary Font**: Geist Sans (variable font, optimized loading)
- **Monospace Font**: Geist Mono (for code and technical content)
- **Font Loading**: Optimized with `subsets: ["latin"]` and display swap
- **CSS Variables**: Complete color system with oklch color space

---

## 🔐 Authentication

### 🎯 **Current Implementation**

The authentication system is fully implemented with:

- **JWT Tokens** - Secure token-based authentication with refresh mechanism
- **Login/Register Forms** - Complete user authentication flow with validation
- **Auth Context** - Global authentication state management with React Context
- **Protected Routes** - Route-based authentication guards with navigation config
- **Token Refresh** - Automatic token renewal and session management
- **Session Persistence** - LocalStorage-based session management

### 🔄 **Authentication Flow**

```typescript
// Login Process
1. User submits credentials → API validation at /api/v1/auth/login
2. Server returns JWT tokens → Client stores in localStorage/cookies
3. Auth context updates → UI redirects to dashboard
4. Token refresh → Automatic background renewal

// Protected Route Access
1. Route guard checks auth state via JwtAuthContext
2. Valid token → Access granted to protected routes
3. Invalid/missing token → Redirect to login with return URL
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

## 📱 Responsive Design

### 📐 **Breakpoints**

Following Tailwind CSS default breakpoints with mobile-first approach:

```css
/* Mobile First Responsive Design */
sm: 640px   /* Small tablets and large phones */
md: 768px   /* Tablets */
lg: 1024px  /* Laptops and small desktops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large screens and ultra-wide displays */
```

---

## 🔌 API Integration

### 📡 **Backend Communication**

The web application communicates with Express.js API server through Next.js rewrites:

```typescript
// API client configuration (handled by Next.js rewrites)
const apiRoutes = {
  authentication: "/api/v1/auth/*",
  userManagement: "/api/v1/users/*",
  systemHealth: "/api/v1/health",
  backendProxy: "http://localhost:8080", // Development
};
```

### 🔄 **Data Flow**

```
Web App (Next.js) → API Rewrites → Express API → Database (PostgreSQL)
         ↑                        ↓                ↓
    JWT Tokens            HTTP Requests      Core Services
    LocalStorage          API Responses     Mail Engine
```

---

## 📊 Current Status

| Component                | Status     | Notes                                |
| ------------------------ | ---------- | ------------------------------------ |
| **Next.js Setup**        | ✅ Working | App Router with ES modules           |
| **Authentication**       | ✅ Working | Complete JWT system with context     |
| **UI Components**        | ✅ Working | shadcn/ui with Tailwind v4           |
| **Styling System**       | ✅ Working | Tailwind v4 with dark mode           |
| **Configuration Files**  | ✅ Working | All configs migrated to app/         |
| **Layout System**        | ✅ Working | Root layout with providers           |
| **Dashboard**            | ✅ Working | Complete dashboard with sections     |
| **Account Management**   | ✅ Working | Full account management interface    |
| **Directory System**     | ✅ Working | Complete directory management        |
| **Settings Interface**   | ✅ Working | Application configuration            |
| **Reporting System**     | ✅ Working | ARF, DMARC, TLS reports              |
| **History Tracking**     | ✅ Working | Delivery and received history        |
| **Management Tools**     | ✅ Working | Logs, tracing, queue management      |
| **Spam Management**      | ✅ Working | Testing and training interface       |
| **Troubleshooting**      | ✅ Working | Delivery and DMARC tools             |
| **API Integration**      | ✅ Working | All endpoints connected via rewrites |
| **Navigation**           | ✅ Working | Complete navigation system           |
| **ESLint Configuration** | ✅ Working | ES module compatible                 |

---

## 🚀 Next Steps

### 📋 **Immediate Priorities**

1. **Email Interface**
   - Webmail client integration
   - Email composition and sending
   - Inbox management with folders

2. **Advanced Analytics**
   - Real-time monitoring with WebSockets
   - Detailed performance metrics
   - Custom reporting and dashboards

3. **Multi-language Support**
   - i18next implementation
   - Translation management system
   - Locale switching and RTL support

### 🎯 **Short-term Goals**

- Complete email interface implementation
- Implement real-time monitoring dashboard
- Add comprehensive multi-language support
- Set up testing framework (Jest + Playwright)
- Optimize performance and bundle size
- Add PWA capabilities

---

## 📞 Support & Resources

### 📖 **Documentation**

- **[Next.js 16 Documentation](https://nextjs.org/docs)** - Framework reference and guides
- **[Tailwind CSS v4](https://tailwindcss.com/docs)** - Styling framework documentation
- **[shadcn/ui](https://ui.shadcn.com)** - Component library documentation
- **[React 19 Documentation](https://react.dev)** - Component patterns and hooks
- **[TypeScript 5.7](https://www.typescriptlang.org/docs)** - Type system and features

### 💬 **Getting Help**

- **GitHub Issues** - Bug reports and feature requests
- **Discussions** - General questions and ideas
- **Development Team** - Contact frontend maintainers
- **Documentation** - Check app-specific docs and comments

---

## 📄 License

This web application is part of the Aether Mailer project, licensed under the **MIT License** - see the [LICENSE](../LICENSE) file for details.

---

<div align="center">

### 🎨 **Complete Mail Server Administration Interface**

[⭐ Star Project](https://github.com/skygenesisenterprise/aether-mailer) • [🐛 Report Issues](https://github.com/skygenesisenterprise/aether-mailer/issues) • [💡 Start Discussion](https://github.com/skygenesisenterprise/aether-mailer/discussions)

---

**🔧 Active Development - Tailwind CSS v4 Migration Complete!**

**Made with ❤️ by the [Sky Genesis Enterprise](https://skygenesisenterprise.com) frontend team**

_Creating a comprehensive, powerful, and beautiful mail server management experience_

</div>
