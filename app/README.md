<div align="center">

# Aether Mailer Web Application

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=for-the-badge&logo=typescript)

**Modern Web Administration Interface for Aether Mailer**

[🎯 Purpose](#-purpose) • [🏗️ Architecture](#️-architecture) • [📁 Structure](#-structure) • [🛠️ Development](#️-development) • [🎨 Styling](#-styling) • [🔧 Configuration](#-configuration)

</div>

---

## 🎯 Purpose

The `/app/` directory contains the **Next.js 16 web application** that serves as the administration interface for Aether Mailer. This is the primary web UI for managing the mail server, users, domains, and monitoring system operations.

### 🔄 Role in Ecosystem

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Next.js App   │    │   Express API    │    │  Core Services  │
│   (This Dir)    │◄──►│   (Admin API)   │◄──►│  (Mail Engine)  │
│  Port 3000      │    │  Port 8080      │    │  Background     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

- **Web Interface** - User-friendly administration dashboard
- **API Client** - Communicates with Express.js backend
- **Authentication** - JWT-based login and session management
- **Responsive Design** - Works on desktop, tablet, and mobile browsers

---

## 🏗️ Architecture

### 📋 Current Implementation Status

> **⚠️ Alpha Development**: This web application is in early development with basic structure only.

#### ✅ **Currently Implemented**
- **Next.js 16 Setup** - App Router with TypeScript strict mode
- **Layout System** - Root layout with theme and auth providers
- **Styling Foundation** - Tailwind CSS v4 with dark mode support
- **Font Configuration** - Geist Sans and Geist Mono fonts
- **Basic Routing** - Home page with authentication redirect
- **Component Structure** - Organized components directory

#### 🔄 **In Development**
- **Authentication Pages** - Login, register, forgot password (skeleton only)
- **Theme System** - Dark/light mode context (structure only)
- **Auth Context** - JWT authentication (structure only)
- **UI Components** - Reusable component library (planned)

#### 📋 **Planned Features**
- **Dashboard** - System overview and metrics
- **User Management** - CRUD operations for email accounts
- **Domain Administration** - Multi-domain configuration
- **Email Interface** - Webmail client integration
- **Settings Panel** - Server configuration management
- **Monitoring Dashboard** - Real-time system metrics

---

## 📁 Directory Structure

```
app/
├── assets/                 # Static assets
│   └── favicon.ico         # Site favicon
├── components/             # React components
│   └── Sidebar.tsx        # Navigation sidebar (empty)
├── contexts/              # React contexts (planned)
│   └── ThemeContext.tsx   # Theme management (missing)
├── context/               # Auth context (planned)
│   └── JwtAuthContext.tsx # JWT authentication (missing)
├── components/ui/         # UI component library (planned)
│   └── toaster.tsx       # Toast notifications (missing)
├── forgot/                # Password recovery page
│   └── page.tsx          # Forgot password form (empty)
├── login/                 # Authentication page
│   └── page.tsx          # Login form (empty)
├── register/             # User registration page
│   └── page.tsx          # Registration form (empty)
├── styles/               # Global styles
│   └── globals.css       # Tailwind CSS with theme variables
├── layout.tsx            # Root layout with providers
├── page.tsx              # Home page with auth redirect
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
   - **Authentication**: Currently redirects to `/login` (empty)

### 📋 **Available Commands**

```bash
# Development
pnpm dev              # Start Next.js dev server
pnpm dev:debug        # Start with Node.js debugging

# Building
pnpm build            # Production build
pnpm build:analyze    # Build with bundle analysis

# Code Quality
pnpm lint             # ESLint checking
pnpm lint:fix         # Auto-fix linting issues
pnpm typecheck        # TypeScript type checking

# Testing (when implemented)
pnpm test             # Run tests
pnpm test:watch       # Watch mode testing
pnpm test:coverage    # Coverage report
```

### 🔧 **Development Features**

- **Hot Reload** - Fast refresh for components and styles
- **TypeScript Strict** - Type safety throughout the application
- **ESLint Integration** - Code quality and consistency
- **Tailwind CSS** - Utility-first styling with JIT compilation
- **App Router** - Next.js 16 routing with layouts and streaming

---

## 🎨 Styling & Theming

### 🎨 **Design System**

#### **Color Palette**
```css
:root {
  --background: #ffffff;    /* Light mode background */
  --foreground: #171717;    /* Light mode text */
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;  /* Dark mode background */
    --foreground: #ededed;  /* Dark mode text */
  }
}
```

#### **Typography**
- **Primary Font**: Geist Sans (variable font)
- **Monospace Font**: Geist Mono (for code and technical content)
- **Font Loading**: Optimized with `subsets: ["latin"]`

#### **Styling Architecture**
- **Tailwind CSS v4** - Modern utility-first framework
- **CSS Variables** - Theme customization through custom properties
- **Responsive Design** - Mobile-first approach with breakpoints
- **Dark Mode** - Automatic system preference detection

### 🎯 **Component Styling Guidelines**

1. **Utility-First** - Use Tailwind utilities for most styling
2. **Component Variants** - Create reusable component classes
3. **Theme Variables** - Use CSS variables for dynamic theming
4. **Responsive Design** - Mobile-first with progressive enhancement
5. **Accessibility** - Semantic HTML with proper contrast ratios

---

## 🔧 Configuration

### ⚙️ **Next.js Configuration**

The app uses Next.js 16 with the App Router and these key configurations:

- **TypeScript** - Strict mode enabled for type safety
- **SWC Minification** - Fast compilation and minification
- **Image Optimization** - Next.js Image component (when implemented)
- **API Integration** - Proxy configuration for backend API

### 🌐 **Environment Variables**

Create `.env.local` for development:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_WS_URL=ws://localhost:8080

# Authentication
NEXT_PUBLIC_JWT_SECRET=your-jwt-secret
NEXT_PUBLIC_AUTH_REFRESH_INTERVAL=300000

# Feature Flags
NEXT_PUBLIC_ENABLE_DARK_MODE=true
NEXT_PUBLIC_ENABLE_ANALYTICS=false

# Development
NEXT_PUBLIC_DEBUG_MODE=true
```

### 🔐 **Authentication Flow**

```typescript
// Current authentication logic (simplified)
function checkServerAuth() {
  // TODO: Implement proper JWT validation
  // TODO: Check server-side session
  // TODO: Validate user permissions
  return true; // Temporary bypass for development
}
```

**Planned Authentication Features:**
- JWT token validation
- Refresh token mechanism
- Role-based access control
- Session persistence
- Multi-factor authentication

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

### 📱 **Mobile Considerations**

- **Touch Targets** - Minimum 44px tap targets
- **Viewport Meta** - Proper mobile viewport configuration
- **Performance** - Optimized for mobile networks
- **Progressive Enhancement** - Core functionality on all devices

---

## 🔌 API Integration

### 📡 **Backend Communication**

The web application communicates with the Express.js API server:

```typescript
// API client configuration (planned)
const apiClient = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
};
```

### 🔄 **Data Flow**

```
Web App (Next.js) → API Server (Express) → Database (PostgreSQL)
        ↑                        ↓
    JWT Tokens            Core Services
```

### 📋 **API Endpoints (Planned)**

- **Authentication** - `/api/auth/*`
- **User Management** - `/api/users/*`
- **Domain Configuration** - `/api/domains/*`
- **System Metrics** - `/api/metrics/*`
- **Email Operations** - `/api/email/*`

---

## 🚀 Performance Optimization

### ⚡ **Current Optimizations**

- **Next.js 16** - Latest React features and optimizations
- **SWC Compiler** - Fast TypeScript compilation
- **Tailwind JIT** - On-demand CSS generation
- **Font Optimization** - Variable fonts with subset loading

### 📈 **Planned Optimizations**

- **Code Splitting** - Route-based and component-based splitting
- **Image Optimization** - Next.js Image with WebP support
- **Caching Strategy** - API response caching and stale-while-revalidate
- **Bundle Analysis** - Regular bundle size monitoring
- **Performance Monitoring** - Real user experience tracking

---

## 🧪 Testing Strategy

### 📋 **Planned Test Suite**

```bash
# Component Testing
pnpm test:components     # React component tests
pnpm test:ui           # UI component library tests

# Integration Testing
pnpm test:integration   # API integration tests
pnpm test:e2e          # End-to-end user flows

# Performance Testing
pnpm test:lighthouse   # Lighthouse audits
pnpm test:performance  # Load testing
```

### 🎯 **Testing Frameworks**

- **Jest** - Unit and integration tests
- **React Testing Library** - Component testing
- **Playwright** - End-to-end testing
- **Lighthouse CI** - Performance testing

---

## 🤝 Contributing

### 📋 **Development Guidelines**

1. **Component Structure** - Follow established patterns
2. **TypeScript** - Strict typing for all new code
3. **Accessibility** - WCAG 2.1 AA compliance
4. **Performance** - Optimize for Core Web Vitals
5. **Testing** - Write tests for all new features

### 🎨 **UI/UX Guidelines**

- **Design System** - Use consistent component patterns
- **Responsive Design** - Mobile-first approach
- **Dark Mode** - Ensure proper contrast and readability
- **Loading States** - Provide feedback for async operations
- **Error Handling** - Graceful error states and recovery

---

## 📊 Current Status

| Component | Status | Notes |
|-----------|--------|-------|
| **Next.js Setup** | ✅ Working | App Router with TypeScript |
| **Styling System** | ✅ Working | Tailwind CSS v4 with dark mode |
| **Layout System** | ✅ Working | Root layout with providers |
| **Authentication** | 📋 Planned | JWT context structure ready |
| **UI Components** | 📋 Planned | Component library needed |
| **API Integration** | 📋 Planned | Client configuration needed |
| **Testing Suite** | 📋 Planned | Framework selection needed |
| **Performance** | 📋 Planned | Optimization strategies needed |

---

## 🚀 Next Steps

### 📋 **Immediate Priorities**

1. **Authentication Implementation**
   - Complete JWT context
   - Login/register forms
   - Session management

2. **UI Component Library**
   - Button, Input, Card components
   - Form validation
   - Toast notifications

3. **API Integration**
   - HTTP client setup
   - Error handling
   - Loading states

### 🎯 **Short-term Goals (Q1 2025)**

- Complete authentication flow
- Build dashboard interface
- Implement user management
- Add responsive design
- Set up testing framework

---

## 📞 Support & Resources

### 📖 **Documentation**

- **[Next.js Documentation](https://nextjs.org/docs)** - Framework reference
- **[Tailwind CSS](https://tailwindcss.com/docs)** - Styling guide
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

### 🎨 **Building the Modern Mail Server Administration Interface**

[⭐ Star Project](https://github.com/skygenesisenterprise/aether-mailer) • [🐛 Report Issues](https://github.com/skygenesisenterprise/aether-mailer/issues) • [💡 Start Discussion](https://github.com/skygenesisenterprise/aether-mailer/discussions)

---

**🔧 Currently in Alpha Development - Frontend Contributors Welcome!**

**Made with ❤️ by the [Sky Genesis Enterprise](https://skygenesisenterprise.com) frontend team**

*Creating an intuitive, powerful, and beautiful mail server management experience*

</div>