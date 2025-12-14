<div align="center">

# Aether Mailer Web Application

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19.2.1-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?style=for-the-badge&logo=tailwind-css)

**Modern Web Administration Interface for Aether Mailer**

[🎯 Purpose](#-purpose) • [🏗️ Architecture](#️-architecture) • [📁 Structure](#-structure) • [🛠️ Development](#️-development) • [🔐 Authentication](#-authentication) • [🎨 Styling](#-styling)

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

> **✅ Active Development**: Authentication system and UI components are implemented and functional.

#### ✅ **Currently Implemented**
- **Next.js 16 Setup** - App Router with TypeScript strict mode
- **Authentication System** - Complete JWT authentication with login/register forms
- **UI Component Library** - Button, Card, Input components with shadcn/ui
- **Layout System** - Root layout with theme and auth providers
- **Styling Foundation** - Tailwind CSS v4 with dark mode support
- **Font Configuration** - Geist Sans and Geist Mono fonts
- **Authentication Pages** - Login, register, forgot password with forms
- **Auth Context** - JWT authentication with token management
- **Utility Functions** - Helper functions for common operations

#### 🔄 **In Development**
- **Dashboard** - System overview and metrics
- **User Management** - CRUD operations for email accounts
- **Domain Administration** - Multi-domain configuration
- **Settings Panel** - Server configuration management
- **Monitoring Dashboard** - Real-time system metrics

#### 📋 **Planned Features**
- **Email Interface** - Webmail client integration
- **Advanced Analytics** - Detailed system monitoring
- **Multi-language Support** - Internationalization
- **Mobile App** - React Native companion app

---

## 📁 Directory Structure

```
app/
├── assets/                 # Static assets
│   └── favicon.ico         # Site favicon
├── components/             # React components
│   ├── ui/                # UI component library
│   │   ├── button.tsx     # Button component
│   │   ├── card.tsx       # Card component
│   │   └── input.tsx      # Input component
│   ├── Sidebar.tsx        # Navigation sidebar
│   └── login-form.tsx     # Login form component
├── context/               # React contexts
│   └── JwtAuthContext.tsx # JWT authentication context
├── forgot/                # Password recovery page
│   └── page.tsx          # Forgot password form
├── lib/                   # Utility libraries
│   └── utils.ts          # Helper functions
├── login/                 # Authentication pages
│   ├── loading.tsx       # Loading state
│   ├── options/          # Login options
│   │   └── page.tsx      # Login options page
│   └── page.tsx          # Main login page
├── register/             # User registration page
│   └── page.tsx          # Registration form
├── styles/               # Global styles
│   └── globals.css       # Tailwind CSS with theme variables
├── layout.tsx            # Root layout with providers
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

### 📋 **Auth Components**

- **`login-form.tsx`** - Complete login form with validation
- **`JwtAuthContext.tsx`** - Authentication state management
- **Login Pages** - Multiple login options and methods
- **Register Page** - User registration with form validation

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

### 🎯 **Styling Guidelines**

1. **Utility-First** - Use Tailwind utilities for most styling
2. **Component Variants** - Leverage shadcn/ui component patterns
3. **Theme Variables** - Use CSS variables for dynamic theming
4. **Responsive Design** - Mobile-first with progressive enhancement
5. **Accessibility** - Semantic HTML with proper contrast ratios

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
// API client configuration
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

### 📋 **API Endpoints**

- **Authentication** - `/api/auth/*` (login, register, refresh)
- **User Management** - `/api/users/*` (CRUD operations)
- **Domain Configuration** - `/api/domains/*` (planned)
- **System Metrics** - `/api/metrics/*` (planned)

---

## 🚀 Performance Optimization

### ⚡ **Current Optimizations**

- **Next.js 16** - Latest React features and optimizations
- **SWC Compiler** - Fast TypeScript compilation
- **Tailwind JIT** - On-demand CSS generation
- **Font Optimization** - Variable fonts with subset loading
- **Component Lazy Loading** - Route-based code splitting

### 📈 **Planned Optimizations**

- **Image Optimization** - Next.js Image with WebP support
- **Caching Strategy** - API response caching and stale-while-revalidate
- **Bundle Analysis** - Regular bundle size monitoring
- **Performance Monitoring** - Real user experience tracking

---

## 📊 Current Status

| Component | Status | Notes |
|-----------|--------|-------|
| **Next.js Setup** | ✅ Working | App Router with TypeScript |
| **Authentication** | ✅ Working | Complete JWT system with forms |
| **UI Components** | ✅ Working | shadcn/ui integration |
| **Styling System** | ✅ Working | Tailwind CSS v4 with dark mode |
| **Layout System** | ✅ Working | Root layout with providers |
| **API Integration** | 🔄 In Progress | Auth endpoints connected |
| **Dashboard** | 📋 Planned | Main admin interface |
| **User Management** | 📋 Planned | CRUD operations |
| **Testing Suite** | 📋 Planned | Framework selection needed |

---

## 🚀 Next Steps

### 📋 **Immediate Priorities**

1. **Dashboard Implementation**
   - System overview widgets
   - Real-time metrics display
   - Quick action buttons

2. **User Management**
   - User list with search/filter
   - User creation/editing forms
   - Role-based permissions

3. **API Integration**
   - Complete error handling
   - Loading states
   - Data caching strategies

### 🎯 **Short-term Goals**

- Complete dashboard interface
- Implement user management
- Add domain configuration
- Set up monitoring dashboard
- Implement testing framework

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

### 🎨 **Building the Modern Mail Server Administration Interface**

[⭐ Star Project](https://github.com/skygenesisenterprise/aether-mailer) • [🐛 Report Issues](https://github.com/skygenesisenterprise/aether-mailer/issues) • [💡 Start Discussion](https://github.com/skygenesisenterprise/aether-mailer/discussions)

---

**🔧 Active Development - Authentication System Complete!**

**Made with ❤️ by the [Sky Genesis Enterprise](https://skygenesisenterprise.com) frontend team**

*Creating an intuitive, powerful, and beautiful mail server management experience*

</div>