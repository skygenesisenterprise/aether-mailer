# Installation Guide

This comprehensive guide covers all installation methods for Aether Mailer, from quick development setup to production deployment.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Installation Methods](#installation-methods)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Post-Installation](#post-installation)
- [Verification](#verification)
- [Upgrading](#upgrading)

---

## 🔧 Prerequisites

### System Requirements

| Component      | Minimum             | Recommended       |
| -------------- | ------------------- | ----------------- |
| **CPU**        | 2 cores             | 4+ cores          |
| **Memory**     | 4GB RAM             | 8GB+ RAM          |
| **Storage**    | 10GB                | 50GB+ SSD         |
| **OS**         | Linux/macOS/Windows | Ubuntu 22.04+ LTS |
| **Node.js**    | 18.0.0              | 20.0.0+           |
| **PostgreSQL** | 14.0                | 15.0+             |
| **Redis**      | 7.0                 | 7.2+              |
| **Docker**     | 20.0.0              | 24.0.0+           |

### Software Dependencies

#### Required

- **Node.js**: JavaScript runtime
- **PostgreSQL**: Primary database
- **pnpm**: Package manager (preferred)

#### Optional

- **Redis**: Caching and sessions
- **Docker**: Containerization
- **Nginx**: Reverse proxy (production)
- **SSL Certificate**: HTTPS (production)

---

## 🚀 Installation Methods

### Method 1: Docker Development (Recommended)

**Best for**: Quick start, development, testing

```bash
# 1. Clone repository
git clone https://github.com/skygenesisenterprise/aether-mailer.git
cd aether-mailer

# 2. Start development environment
make docker-dev

# Alternative: Using docker-compose directly
docker-compose -f docker-compose.dev.yml up --build
```

**Services started:**

- Frontend (Next.js): http://localhost:3000
- Backend API: http://localhost:8080
- PostgreSQL: localhost:5432
- Redis: localhost:6379

### Method 2: Local Development

**Best for**: Custom development, debugging

```bash
# 1. Install Node.js dependencies
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Install pnpm
npm install -g pnpm

# 3. Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# 4. Install Redis (optional)
sudo apt install redis-server

# 5. Clone and setup project
git clone https://github.com/skygenesisenterprise/aether-mailer.git
cd aether-mailer
pnpm install
```

### Method 3: Production Installation

**Best for**: Production servers, cloud deployment

#### Option A: Docker Production

```bash
# 1. Pull production image
docker pull ghcr.io/skygenesisenterprise/aether-mailer:latest

# 2. Create production environment
cp .env.example .env.production
# Edit .env.production with production settings

# 3. Start with docker-compose
docker-compose -f docker-compose.yml up -d
```

#### Option B: Source Installation

```bash
# 1. Install system dependencies
sudo apt update
sudo apt install -y build-essential postgresql redis-server nginx

# 2. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Install pnpm
npm install -g pnpm

# 4. Clone and build
git clone https://github.com/skygenesisenterprise/aether-mailer.git
cd aether-mailer
pnpm install
pnpm build

# 5. Setup systemd service (see below)
```

---

## ⚙️ Environment Configuration

### Environment Variables

Create `.env` file from template:

```bash
cp .env.example .env
```

#### Core Configuration

```bash
# Application
NODE_ENV=development
APP_NAME=Aether Mailer
APP_VERSION=0.1.0

# Server
HOST=0.0.0.0
PORT=8080
FRONTEND_PORT=3000

# Database
DATABASE_URL=postgresql://mailer:password@localhost:5432/aether_mailer
POSTGRES_DB=aether_mailer
POSTGRES_USER=mailer
POSTGRES_PASSWORD=your_secure_password

# Redis (optional)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_redis_password

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@your-domain.com

# Security
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

#### Production Configuration

```bash
# Production environment
NODE_ENV=production
LOG_LEVEL=info

# Security
JWT_SECRET=your_production_jwt_secret
CORS_ORIGIN=https://your-domain.com

# Database (use strong passwords)
DATABASE_URL=postgresql://mailer:strong_password@db:5432/aether_mailer_prod

# SSL
SSL_CERT_PATH=/etc/ssl/certs/your-domain.crt
SSL_KEY_PATH=/etc/ssl/private/your-domain.key

# Monitoring
SENTRY_DSN=your_sentry_dsn
METRICS_ENABLED=true
```

---

## 🗄️ Database Setup

### PostgreSQL Configuration

#### 1. Create Database User

```bash
# Switch to postgres user
sudo -u postgres psql

# Create user and database
CREATE USER mailer WITH PASSWORD 'your_secure_password';
CREATE DATABASE aether_mailer OWNER mailer;
GRANT ALL PRIVILEGES ON DATABASE aether_mailer TO mailer;
\q
```

#### 2. Configure PostgreSQL

Edit `/etc/postgresql/14/main/postgresql.conf`:

```ini
# Connection settings
listen_addresses = 'localhost'
port = 5432
max_connections = 100

# Memory settings
shared_buffers = 256MB
effective_cache_size = 1GB

# Logging
log_statement = 'all'
log_duration = on
```

Edit `/etc/postgresql/14/main/pg_hba.conf`:

```
# Local connections
local   all             postgres                                peer
local   all             all                                     md5

# IPv4 local connections
host    all             all             127.0.0.1/32            md5

# IPv6 local connections
host    all             all             ::1/128                 md5
```

#### 3. Restart PostgreSQL

```bash
sudo systemctl restart postgresql
sudo systemctl enable postgresql
```

### Redis Configuration (Optional)

#### 1. Install Redis

```bash
sudo apt install redis-server
```

#### 2. Configure Redis

Edit `/etc/redis/redis.conf`:

```ini
# Network
bind 127.0.0.1
port 6379
requirepass your_redis_password

# Memory
maxmemory 512mb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000
```

#### 3. Restart Redis

```bash
sudo systemctl restart redis-server
sudo systemctl enable redis-server
```

---

## 🔄 Database Migrations

### Run Migrations

```bash
# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed database (optional)
pnpm db:seed
```

### Migration Commands

```bash
# Create new migration
pnpm db:migrate dev --name add_new_feature

# Reset database
pnpm db:reset

# View migration status
pnpm db:migrate status

# Deploy migrations to production
pnpm db:migrate deploy
```

---

## ✅ Post-Installation

### 1. Create Administrator Account

```bash
# Using CLI
pnpm cli users create admin@your-domain.com --password secure_password --role admin

# Or via web interface
# Navigate to http://localhost:3000 and sign up
```

### 2. Configure Email Domain

```bash
# Add domain using CLI
pnpm cli domains create your-domain.com

# Configure domain settings
pnpm cli domains config your-domain.com --quota 10000
```

### 3. Test Email Sending

```bash
# Send test email
curl -X POST "http://localhost:8080/api/v1/emails/send" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@external.com",
    "subject": "Test Email",
    "body": "Aether Mailer is working!"
  }'
```

### 4. Setup Systemd Service (Production)

Create `/etc/systemd/system/aether-mailer.service`:

```ini
[Unit]
Description=Aether Mailer
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=mailer
WorkingDirectory=/opt/aether-mailer
ExecStart=/usr/bin/node server/dist/main.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Enable and start service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable aether-mailer
sudo systemctl start aether-mailer
```

---

## 🔍 Verification

### Health Checks

```bash
# Backend health
curl http://localhost:8080/health

# Frontend status
curl http://localhost:3000/api/health

# Database connection
psql "postgresql://mailer:password@localhost:5432/aether_mailer" -c "SELECT 1;"

# Redis connection
redis-cli ping
```

### Service Status

```bash
# Using Make
make health

# Systemd (production)
sudo systemctl status aether-mailer
sudo systemctl status postgresql
sudo systemctl status redis-server

# Docker
docker-compose ps
```

### Log Monitoring

```bash
# Application logs
tail -f logs/app.log

# Database logs
tail -f /var/log/postgresql/postgresql-14-main.log

# System logs
journalctl -u aether-mailer -f
```

---

## 🔄 Upgrading

### Upgrade Process

```bash
# 1. Backup data
pg_dump aether_mailer > backup_$(date +%Y%m%d).sql

# 2. Update source
git pull origin main

# 3. Update dependencies
pnpm install

# 4. Build application
pnpm build

# 5. Run migrations
pnpm db:migrate

# 6. Restart services
sudo systemctl restart aether-mailer
```

### Version Compatibility

| Version | Node.js | PostgreSQL | Redis |
| ------- | ------- | ---------- | ----- |
| 0.1.x   | 18+     | 14+        | 7+    |
| 0.2.x   | 20+     | 15+        | 7+    |

---

## 🛠️ Troubleshooting

### Common Installation Issues

#### Database Connection Failed

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test connection
psql -U mailer -d aether_mailer -h localhost

# Check configuration
sudo -u postgres psql -c "\l"
```

#### Port Already in Use

```bash
# Find process using port
sudo netstat -tulpn | grep :8080

# Kill process
sudo kill -9 <PID>

# Or change port in .env
PORT=8081
```

#### Permission Denied

```bash
# Fix file permissions
sudo chown -R $USER:$USER /opt/aether-mailer
chmod +x docker-entrypoint.sh

# Check user groups
groups $USER
```

#### Docker Issues

```bash
# Clean Docker environment
docker system prune -f
docker volume prune -f

# Rebuild containers
docker-compose build --no-cache
```

### Getting Help

- [Documentation](../README.md)
- [GitHub Issues](https://github.com/skygenesisenterprise/aether-mailer/issues)
- [Community Forum](https://github.com/skygenesisenterprise/aether-mailer/discussions)
- [Email Support](mailto:support@aethermailer.com)

---

## 📚 Next Steps

After successful installation:

1. **Security Setup**: [Security Guide](../security/README.md)
2. **User Management**: [Admin Guide](../admin-guide/README.md)
3. **API Integration**: [API Documentation](../api/README.md)
4. **Monitoring**: [Monitoring Guide](../admin-guide/monitoring.md)
5. **Backup Strategy**: [Backup Guide](../admin-guide/backup-restore.md)

---

_Last updated: January 12, 2025_  
_Version: 0.1.0_
