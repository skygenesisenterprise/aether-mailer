# Quick Start Guide

Get Aether Mailer running in minutes with this quick start guide.

## 🚀 5-Minute Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Git installed

### Step 1: Clone Repository

```bash
git clone https://github.com/skygenesisenterprise/aether-mailer.git
cd aether-mailer
```

### Step 2: Start Development Environment

```bash
# Using Make (recommended)
make docker-dev

# Or using docker-compose directly
docker-compose -f docker-compose.dev.yml up --build
```

### Step 3: Access Application

Open your browser and navigate to:

- **Web Interface**: http://localhost:3000
- **API Documentation**: http://localhost:8080/docs

### Step 4: Create Admin Account

1. Click "Sign Up" on the login page
2. Enter your email and password
3. You're now the system administrator!

### Step 5: Test Email Sending

```bash
# Get JWT token from login response
# Then send test email:
curl -X POST "http://localhost:8080/api/v1/emails/send" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Hello from Aether Mailer!",
    "body": "This is a test email."
  }'
```

🎉 **Congratulations! Aether Mailer is now running!**

---

## 📱 What's Next?

### Essential Tasks

- [ ] Configure your email domain
- [ ] Create user accounts
- [ ] Set up email clients
- [ ] Configure security settings

### Recommended Reading

- [Installation Guide](installation.md) - Detailed setup instructions
- [Administrator Guide](../admin-guide/README.md) - User and domain management
- [API Documentation](../api/README.md) - Integration guide
- [Security Best Practices](../security/best-practices.md) - Secure your setup

---

## 🛠️ Common Quick Tasks

### Add Email Domain

```bash
# Using CLI
pnpm cli domains create your-domain.com

# Using web interface
# Settings → Domains → Add Domain
```

### Create User Account

```bash
# Using CLI
pnpm cli users create user@your-domain.com --password SecurePass123!

# Using web interface
# Users → Add User
```

### Check System Status

```bash
# Health check
curl http://localhost:8080/health

# Service status
make health
```

### View Logs

```bash
# Application logs
make logs

# Docker logs
docker-compose logs -f
```

---

## 🔧 Customization

### Environment Variables

Edit `.env` file to customize:

```bash
# Change ports
FRONTEND_PORT=3001
BACKEND_PORT=8081

# Email configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### Database Configuration

```bash
# Access database
make docker-dev-db

# Reset database
pnpm db:reset
```

---

## 📊 Development vs Production

| Feature         | Development | Production   |
| --------------- | ----------- | ------------ |
| **Hot Reload**  | ✅ Enabled  | ❌ Disabled  |
| **Debug Logs**  | ✅ Verbose  | ⚠️ Minimal   |
| **Security**    | ⚠️ Basic    | ✅ Full      |
| **Performance** | ⚠️ Standard | ✅ Optimized |
| **SSL/HTTPS**   | ❌ HTTP     | ✅ HTTPS     |

### Switch to Production

```bash
# Build for production
pnpm build

# Start production services
docker-compose -f docker-compose.yml up -d
```

---

## 🆘 Need Help?

### Quick Troubleshooting

```bash
# Restart services
make docker-dev-restart

# Clean rebuild
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d

# Check logs
docker-compose logs app-dev
```

### Common Issues

- **Port conflicts**: Change ports in `.env`
- **Database errors**: Check PostgreSQL connection
- **Permission issues**: Run with proper user permissions

### Get Support

- [Documentation](../README.md)
- [GitHub Issues](https://github.com/skygenesisenterprise/aether-mailer/issues)
- [Community Discussions](https://github.com/skygenesisenterprise/aether-mailer/discussions)

---

## 🎯 Pro Tips

### 1. Use Make Commands

```bash
make help                    # Show all commands
make docker-dev-gui         # Start with GUI tools
make docker-dev-logs        # View logs
make docker-dev-db          # Access database
```

### 2. Enable GUI Tools

```bash
# Start with pgAdmin and Redis Commander
make docker-dev-gui

# Access GUI tools:
# pgAdmin: http://localhost:5050
# Redis Commander: http://localhost:8081
```

### 3. Development Workflow

```bash
# 1. Make changes
# 2. Watch hot reload
# 3. Test in browser
# 4. Commit changes
git add .
git commit -m "feat: add new feature"
```

### 4. Database Management

```bash
# View database
pnpm db:studio

# Run migrations
pnpm db:migrate

# Seed data
pnpm db:seed
```

---

## 📈 Scaling Up

When you're ready to move beyond development:

1. **Production Setup**: [Deployment Guide](../deployment/README.md)
2. **Security Configuration**: [Security Guide](../security/README.md)
3. **Monitoring Setup**: [Monitoring Guide](../admin-guide/monitoring.md)
4. **Backup Strategy**: [Backup Guide](../admin-guide/backup-restore.md)

---

## 🎉 You're Ready!

You now have a fully functional Aether Mailer instance running. Here's what you can do:

- **Send and receive emails** through the web interface
- **Manage users and domains** via admin panel
- **Integrate with applications** using REST API
- **Customize settings** to match your needs
- **Scale up** when ready for production

**Happy mailing! 📧**

---

_Last updated: January 12, 2025_  
_Version: 0.1.0_
