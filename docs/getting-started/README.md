# Getting Started with Aether Mailer

Welcome to Aether Mailer! This guide will help you get up and running with our modern mail server foundation.

## 📋 Table of Contents

- [System Requirements](#system-requirements)
- [Quick Installation](#quick-installation)
- [First Steps](#first-steps)
- [Verification](#verification)
- [Next Steps](#next-steps)
- [Troubleshooting](#troubleshooting)

---

## 🖥️ System Requirements

### Minimum Requirements

- **Node.js**: 18.0.0 or higher
- **PostgreSQL**: 14.0 or higher
- **Redis**: 7.0 or higher (optional, for caching)
- **Docker**: 20.0 or higher (for container deployment)
- **Memory**: 4GB RAM minimum
- **Storage**: 10GB available space
- **OS**: Linux, macOS, or Windows (with WSL2)

### Recommended Requirements

- **Node.js**: 20.0.0 or higher
- **PostgreSQL**: 15.0 or higher
- **Redis**: 7.2 or higher
- **Memory**: 8GB RAM or more
- **Storage**: 50GB SSD storage
- **OS**: Ubuntu 22.04+ or CentOS 9+

### Development Environment

For local development, we recommend using Docker Compose for the easiest setup:

```bash
# Verify Docker installation
docker --version
docker-compose --version

# Minimum Docker versions
# Docker: 20.0.0+
# Docker Compose: 2.0.0+
```

---

## 🚀 Quick Installation

### Option 1: Docker Development (Recommended)

The fastest way to get started is using our Docker development environment:

```bash
# Clone the repository
git clone https://github.com/skygenesisenterprise/aether-mailer.git
cd aether-mailer

# Start development environment
make docker-dev

# Or use docker-compose directly
docker-compose -f docker-compose.dev.yml up --build
```

**Services will be available at:**

- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- PostgreSQL: localhost:5432
- Redis: localhost:6379

### Option 2: Local Development

For a local development setup without Docker:

```bash
# Clone the repository
git clone https://github.com/skygenesisenterprise/aether-mailer.git
cd aether-mailer

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start PostgreSQL and Redis
# (See configuration section for details)

# Run database migrations
pnpm db:migrate

# Start development servers
pnpm dev
```

### Option 3: Production Installation

For production deployment, see our [Deployment Guide](../deployment/README.md).

---

## 🎯 First Steps

Once your Aether Mailer instance is running, follow these steps:

### 1. Access the Web Interface

Open your browser and navigate to:

- **Development**: http://localhost:3000
- **Production**: https://your-domain.com

### 2. Create Administrator Account

The first user to sign up automatically becomes the system administrator:

1. Click "Sign Up" on the login page
2. Enter your email address and password
3. Verify your email (if configured)
4. You'll now have administrator privileges

### 3. Configure Your Email Domain

Add your first email domain:

```bash
# Using CLI
pnpm cli domains create your-domain.com

# Or via web interface
# Navigate to Settings → Domains → Add Domain
```

### 4. Test Email Flow

Verify everything is working by sending a test email:

```bash
# Create a test user
pnpm cli users create test@your-domain.com --password TestPass123!

# Send test email (using API)
curl -X POST "http://localhost:8080/api/v1/emails/send" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "external@example.com",
    "subject": "Test Email",
    "body": "This is a test email from Aether Mailer!"
  }'
```

---

## ✅ Verification

Ensure your installation is working correctly:

### Health Checks

```bash
# Check backend health
curl http://localhost:8080/health

# Check frontend status
curl http://localhost:3000/api/health

# Database connection
pnpm db:studio  # Opens Prisma Studio
```

### Service Status

```bash
# Using Make commands
make health

# Check all services
docker-compose -f docker-compose.dev.yml ps
```

### Expected Response

You should see a response like:

```json
{
  "status": "healthy",
  "timestamp": "2025-01-12T10:30:00.000Z",
  "services": {
    "database": "connected",
    "redis": "connected",
    "email": "ready"
  }
}
```

---

## 🔄 Next Steps

After successful installation, consider these next steps:

### 1. Security Configuration

- [Security Best Practices](../security/best-practices.md)
- [SSL/TLS Setup](../security/encryption.md)
- [Firewall Configuration](../admin-guide/security.md)

### 2. User Management

- [User Administration](../admin-guide/user-management.md)
- [Domain Configuration](../admin-guide/domain-management.md)
- [Access Control](../security/authentication.md)

### 3. Monitoring

- [System Monitoring](../admin-guide/monitoring.md)
- [Log Management](../troubleshooting/logs.md)
- [Performance Optimization](../troubleshooting/performance.md)

### 4. API Integration

- [API Documentation](../api/README.md)
- [Authentication Guide](../api/authentication.md)
- [Code Examples](../api/examples/)

---

## 🛠️ Troubleshooting

### Common Issues

#### Port Conflicts

**Problem**: Services fail to start due to port conflicts

**Solution**:

```bash
# Check port usage
netstat -tulpn | grep :3000
netstat -tulpn | grep :8080

# Change ports in .env file
# FRONTEND_PORT=3001
# BACKEND_PORT=8081
```

#### Database Connection Issues

**Problem**: Cannot connect to PostgreSQL

**Solution**:

```bash
# Check database status
systemctl status postgresql

# Verify connection string
psql "postgresql://user:password@localhost:5432/aether_mailer"

# Reset database
pnpm db:reset
```

#### Permission Issues

**Problem**: File permission errors

**Solution**:

```bash
# Fix file permissions
chmod +x docker-entrypoint.sh
chmod -R 755 storage/

# Check user permissions
whoami
groups
```

#### Docker Issues

**Problem**: Docker containers fail to start

**Solution**:

```bash
# Clean Docker environment
docker system prune -f
docker-compose down -v

# Rebuild containers
docker-compose build --no-cache
```

### Getting Help

If you encounter issues not covered here:

1. **Check the logs**: `make logs` or `docker-compose logs`
2. **Search issues**: [GitHub Issues](https://github.com/skygenesisenterprise/aether-mailer/issues)
3. **Join discussions**: [GitHub Discussions](https://github.com/skygenesisenterprise/aether-mailer/discussions)
4. **Contact support**: support@aethermailer.com

---

## 📚 Additional Resources

- [Architecture Overview](../architecture/overview.md)
- [API Reference](../api/README.md)
- [Administrator Guide](../admin-guide/README.md)
- [Deployment Guide](../deployment/README.md)
- [Development Guide](../development/README.md)

---

## 🎉 Congratulations!

You've successfully installed and configured Aether Mailer!

**What's next?**

- Explore the [API documentation](../api/README.md)
- Set up [monitoring and logging](../admin-guide/monitoring.md)
- Configure [security settings](../security/best-practices.md)
- Join our [community](https://github.com/skygenesisenterprise/aether-mailer/discussions)

---

_Last updated: January 12, 2025_  
_Version: 0.1.0_
