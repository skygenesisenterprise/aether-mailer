<div align="center">

# Aether Mailer API Server

![Aether Mailer](https://img.shields.io/badge/Aether-Mailer-1.0.0-blue?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=for-the-badge&logo=typescript)
![Express](https://img.shields.io/badge/Express-5.2.1-black?style=for-the-badge&logo=express)

**Enterprise-grade REST API server for Aether Mailer administration**

[Features](#-features) • [Installation](#-installation) • [API Documentation](#-api-documentation) • [Development](#-development) • [Deployment](#-deployment)

</div>

---

## 📋 Overview

The Aether Mailer API Server is the backbone of the Aether Mailer web administration interface. Built with Express.js and TypeScript, it provides secure, scalable REST endpoints for managing users, domains, email configurations, and monitoring mail server operations.

### 🎯 Key Responsibilities

- **User Management** - Authentication, authorization, and user administration
- **Domain Administration** - Multi-domain support and DNS management
- **Configuration Management** - Server settings and policy management
- **Monitoring & Analytics** - Real-time metrics and health monitoring
- **Security** - Rate limiting, CORS, and security middleware

---

## ✨ Features

### 🔐 **Security & Authentication**
- JWT-based authentication with configurable expiration
- Password hashing with bcrypt
- Rate limiting per IP and endpoint
- CORS configuration for cross-origin requests
- Security headers with Helmet.js
- Request validation and sanitization

### 🛡️ **Enterprise Security**
- SQL injection prevention with Prisma ORM
- XSS protection with input sanitization
- CSRF protection for state-changing operations
- Request size limits (10MB default)
- Environment-based error reporting

### 📊 **Monitoring & Health**
- Comprehensive health check endpoint
- Database connection monitoring
- Service dependency tracking
- Performance metrics collection
- Graceful shutdown handling

### 🔧 **Developer Experience**
- TypeScript strict mode for type safety
- Hot reload in development mode
- Comprehensive error handling
- Structured logging
- API documentation ready

### 🚀 **Performance**
- Request compression with gzip
- Connection pooling for database
- Efficient middleware pipeline
- Memory-optimized operations
- Horizontal scaling support

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Aether Mailer API                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Routes    │  │ Controllers │  │     Services         │  │
│  │             │  │             │  │                       │  │
│  │ /api/v1/*   │──▶│ UserCtrl   │──▶│ UserService         │  │
│  │ /health     │  │ DomainCtrl  │  │ DomainService        │  │
│  │ /metrics    │  │ ConfigCtrl  │  │ ConfigService        │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Middleware  │  │   Models    │  │     Database         │  │
│  │             │  │             │  │                       │  │
│  │ Auth        │  │ User        │  │ PostgreSQL           │  │
│  │ RateLimit   │  │ Domain      │  │ Prisma ORM           │  │
│  │ Validation  │  │ Config      │  │ Connection Pool      │  │
│  │ CORS        │  │ Metrics     │  │ Migrations           │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 📁 Project Structure

```
server/
├── src/
│   ├── config/           # Configuration files
│   │   └── database.ts   # Database connection and config
│   ├── controllers/      # Request handlers
│   │   └── userControllers.ts
│   ├── middlewares/      # Express middleware
│   │   └── userMiddlewares.ts
│   ├── models/          # Data models and schemas
│   │   └── userModels.ts
│   ├── routes/          # API route definitions
│   │   └── userRoutes.ts
│   ├── services/        # Business logic layer
│   │   └── userServices.ts
│   ├── tests/           # Test suites
│   │   └── auth.test.ts
│   └── server.ts        # Main application entry point
├── CODEOWNERS           # Code ownership rules
├── README.md           # This documentation
├── tsconfig.json       # TypeScript configuration
└── tsconfig.build.json # Build-specific TypeScript config
```

---

## 🚀 Installation

### 📋 Prerequisites

- **Node.js** 18.0.0 or higher
- **pnpm** 9.0.0 or higher (recommended)
- **PostgreSQL** 14.0 or higher
- **TypeScript** 5.0 or higher

### 🔧 Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/skygenesisenterprise/aether-mailer.git
   cd server
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Environment configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Database setup**
   ```bash
   # Generate Prisma client
   pnpm prisma generate
   
   # Run database migrations
   pnpm prisma migrate dev
   
   # Seed database (optional)
   pnpm prisma db seed
   ```

5. **Start development server**
   ```bash
   pnpm dev
   ```

### 🌍 Environment Variables

Create a `.env` file in the server root:

```bash
# Server Configuration
NODE_ENV=development
PORT=8080
API_CORS_ORIGINS=http://localhost:3000,http://localhost:4000

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/aether_mailer

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Redis Configuration (optional, for caching/sessions)
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
```

---

## 📚 API Documentation

### 🔗 Base URL

- **Development**: `http://localhost:8080`
- **Production**: `https://api.yourdomain.com`

### 🏥 Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2025-01-12T10:30:00.000Z",
  "uptime": 3600.123,
  "environment": "development",
  "version": "1.0.0",
  "services": {
    "database": "connected",
    "api": "running",
    "monitoring": "active"
  }
}
```

### 🔐 Authentication

All API endpoints (except `/health`) require JWT authentication.

```http
Authorization: Bearer <jwt_token>
```

### 📊 API Endpoints

#### User Management
```http
GET    /api/v1/users          # List all users
POST   /api/v1/users          # Create new user
GET    /api/v1/users/:id      # Get user by ID
PUT    /api/v1/users/:id      # Update user
DELETE /api/v1/users/:id      # Delete user
```

#### Authentication
```http
POST   /api/v1/auth/login     # User login
POST   /api/v1/auth/logout    # User logout
POST   /api/v1/auth/refresh   # Refresh JWT token
GET    /api/v1/auth/profile   # Get current user profile
```

#### Domain Management
```http
GET    /api/v1/domains        # List all domains
POST   /api/v1/domains        # Create new domain
GET    /api/v1/domains/:id    # Get domain by ID
PUT    /api/v1/domains/:id    # Update domain
DELETE /api/v1/domains/:id    # Delete domain
```

#### Configuration
```http
GET    /api/v1/config         # Get server configuration
PUT    /api/v1/config         # Update server configuration
POST   /api/v1/config/test    # Test configuration changes
```

#### Monitoring
```http
GET    /api/v1/metrics        # Get system metrics
GET    /api/v1/logs           # Get application logs
GET    /api/v1/status         # Get detailed service status
```

### 📝 Response Format

**Success Response:**
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation completed successfully",
  "timestamp": "2025-01-12T10:30:00.000Z"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": { /* error details */ }
  },
  "timestamp": "2025-01-12T10:30:00.000Z"
}
```

---

## 🛠️ Development

### 🏃‍♂️ Running the Server

```bash
# Development mode with hot reload
pnpm dev

# Production build
pnpm build

# Start production server
pnpm start

# Run in watch mode
pnpm dev:watch
```

### 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run specific test file
pnpm test auth.test.ts

# Run tests in watch mode
pnpm test:watch
```

### 🔍 Code Quality

```bash
# Lint code
pnpm lint

# Fix linting issues
pnpm lint:fix

# Type checking
pnpm typecheck

# Format code
pnpm format
```

### 📝 Database Operations

```bash
# Generate Prisma client
pnpm prisma generate

# Create new migration
pnpm prisma migrate dev --name migration_name

# Apply pending migrations
pnpm prisma migrate deploy

# Reset database
pnpm prisma migrate reset

# View database
pnpm prisma studio
```

### 🐛 Debugging

The server supports debugging with Node.js inspector:

```bash
# Debug with breakpoints
node --inspect-brk dist/server.js

# Debug with VS Code
# Use the provided .vscode/launch.json configuration
```

---

## 🚀 Deployment

### 🐳 Docker Deployment

1. **Build Docker image**
   ```bash
   docker build -t aether-mailer-api .
   ```

2. **Run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

3. **Production Docker Compose**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

### ☁️ Cloud Deployment

#### AWS ECS
```bash
# Build and push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ECR_REGISTRY
docker build -t aether-mailer-api .
docker tag aether-mailer-api:latest $ECR_REGISTRY/aether-mailer-api:latest
docker push $ECR_REGISTRY/aether-mailer-api:latest
```

#### Google Cloud Run
```bash
# Build and deploy
gcloud builds submit --tag gcr.io/PROJECT_ID/aether-mailer-api
gcloud run deploy aether-mailer-api --image gcr.io/PROJECT_ID/aether-mailer-api --platform managed
```

#### Azure Container Instances
```bash
# Deploy with Azure CLI
az container create \
  --resource-group aether-mailer \
  --name aether-mailer-api \
  --image aether-mailer-api:latest \
  --cpu 1 \
  --memory 2 \
  --ports 8080
```

### 🔧 Production Configuration

#### Environment Setup
```bash
# Production environment variables
NODE_ENV=production
PORT=8080
DATABASE_URL=postgresql://prod_user:prod_pass@db.example.com:5432/aether_mailer_prod
JWT_SECRET=production-jwt-secret-key
API_CORS_ORIGINS=https://admin.yourdomain.com
```

#### Security Considerations
- Use HTTPS in production
- Configure proper CORS origins
- Use strong JWT secrets
- Enable database connection SSL
- Configure proper rate limiting
- Set up monitoring and alerting

#### Performance Optimization
- Enable request compression
- Configure database connection pooling
- Use Redis for session storage
- Implement proper caching strategies
- Monitor memory usage and CPU

---

## 📊 Monitoring & Observability

### 📈 Metrics Collection

The server automatically collects and exposes metrics for:

- **Request Metrics** - Response times, error rates, throughput
- **Database Metrics** - Connection pool usage, query performance
- **System Metrics** - Memory usage, CPU utilization, disk space
- **Application Metrics** - Active users, email counts, domain stats

### 🔍 Logging

Structured logging with configurable levels:

```typescript
// Example log entry
{
  "timestamp": "2025-01-12T10:30:00.000Z",
  "level": "info",
  "message": "User login successful",
  "context": {
    "userId": "12345",
    "ip": "192.168.1.100",
    "userAgent": "Mozilla/5.0..."
  }
}
```

### 🏥 Health Checks

Comprehensive health monitoring for:

- **Database Connectivity** - Connection status and query performance
- **External Services** - Third-party API availability
- **System Resources** - Memory, disk, and CPU thresholds
- **Application Status** - Service dependencies and internal state

---

## 🔒 Security

### 🛡️ Security Features

- **Authentication** - JWT-based with configurable expiration
- **Authorization** - Role-based access control (RBAC)
- **Rate Limiting** - Configurable limits per IP and endpoint
- **Input Validation** - Comprehensive request validation
- **SQL Injection Prevention** - Parameterized queries with Prisma
- **XSS Protection** - Input sanitization and output encoding
- **CSRF Protection** - Token-based CSRF prevention
- **Security Headers** - Helmet.js for security headers

### 🔐 Security Best Practices

1. **Environment Variables** - Never commit secrets to version control
2. **Database Security** - Use SSL connections and proper user permissions
3. **API Security** - Implement proper authentication and authorization
4. **Input Validation** - Validate all incoming data
5. **Error Handling** - Don't expose sensitive information in error messages
6. **Logging** - Log security events for audit trails
7. **Dependencies** - Keep dependencies updated and scan for vulnerabilities

---

## 🤝 Contributing

We welcome contributions from the community! Please follow our guidelines:

### 📝 Development Guidelines

1. **Code Style** - Follow the existing TypeScript and ESLint configuration
2. **Testing** - Write tests for new features and bug fixes
3. **Documentation** - Update documentation for API changes
4. **Commits** - Use conventional commit messages
5. **Pull Requests** - Create PRs with clear descriptions and testing

### 🧪 Testing Requirements

- Unit tests for all new functions
- Integration tests for API endpoints
- Test coverage minimum 80%
- All tests must pass before merging

### 📋 Pull Request Process

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests and documentation
5. Submit a pull request
6. Address review feedback
7. Merge to main branch

---

## 📞 Support

### 🐛 Bug Reports

Found a bug? Please create an issue with:

- Clear description of the problem
- Steps to reproduce
- Environment information
- Error logs and screenshots
- Expected vs actual behavior

### 💡 Feature Requests

Have an idea for a new feature? Please:

- Check existing issues first
- Provide clear use case
- Describe expected behavior
- Consider implementation complexity

### 📧 Contact

- **GitHub Issues**: [Create an issue](https://github.com/skygenesisenterprise/aether-mailer/issues)
- **Discussions**: [Join the discussion](https://github.com/skygenesisenterprise/aether-mailer/discussions)
- **Email**: support@skygenesisenterprise.com

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

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

- **Sky Genesis Enterprise** - Development and maintenance
- **Express.js Team** - Excellent web framework
- **Prisma Team** - Modern database toolkit
- **TypeScript Team** - Type-safe JavaScript
- **Open Source Community** - Tools and libraries

---

<div align="center">

**🚀 Ready to power your mail server administration?**

[⭐ Star This Repo](https://github.com/skygenesisenterprise/aether-mailer) • [📖 Documentation](../docs/) • [🐛 Report Issues](https://github.com/skygenesisenterprise/aether-mailer/issues)

**Made with ❤️ by the [Sky Genesis Enterprise](https://skygenesisenterprise.com) team**

</div>