# Troubleshooting Guide

This guide covers common issues and solutions for Aether Mailer installation and operation.

## 📋 Table of Contents

- [Installation Issues](#installation-issues)
- [Database Problems](#database-problems)
- [Network Issues](#network-issues)
- [Performance Issues](#performance-issues)
- [Authentication Issues](#authentication-issues)
- [Email Issues](#email-issues)
- [Docker Issues](#docker-issues)
- [Getting Help](#getting-help)

---

## 🚀 Installation Issues

### Problem: Port Already in Use

**Symptoms**: Services fail to start with "port already in use" error

**Solutions**:

```bash
# 1. Find process using the port
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :8080

# 2. Kill the process
sudo kill -9 <PID>

# 3. Or change ports in .env
echo "FRONTEND_PORT=3001" >> .env
echo "BACKEND_PORT=8081" >> .env

# 4. Restart services
make docker-dev-restart
```

### Problem: Permission Denied

**Symptoms**: "Permission denied" errors when running scripts

**Solutions**:

```bash
# 1. Fix file permissions
chmod +x docker-entrypoint.sh
chmod +x scripts/*.sh

# 2. Fix directory permissions
sudo chown -R $USER:$USER /opt/aether-mailer
chmod -R 755 storage/

# 3. Check user groups
groups $USER
# Add user to docker group if needed
sudo usermod -aG docker $USER
```

### Problem: Node.js Version Incompatible

**Symptoms**: "Node.js version too old" or module loading errors

**Solutions**:

```bash
# 1. Check current version
node --version

# 2. Install correct version (using nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20

# 3. Or install from package manager
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Problem: Dependencies Installation Failed

**Symptoms**: npm/pnpm install errors with missing dependencies

**Solutions**:

```bash
# 1. Clear package manager cache
pnpm store prune
npm cache clean --force

# 2. Delete node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install

# 3. Install build tools
sudo apt update
sudo apt install -y build-essential python3 make g++

# 4. Try with different registry
pnpm config set registry https://registry.npmjs.org/
```

---

## 🗄️ Database Problems

### Problem: Database Connection Failed

**Symptoms**: "ECONNREFUSED" or database connection errors

**Solutions**:

```bash
# 1. Check PostgreSQL status
sudo systemctl status postgresql

# 2. Start PostgreSQL if stopped
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 3. Test connection
psql "postgresql://mailer:password@localhost:5432/aether_mailer" -c "SELECT 1;"

# 4. Check database exists
sudo -u postgres psql -c "\l"

# 5. Create database if missing
sudo -u postgres createdb aether_mailer
sudo -u postgres createuser mailer
sudo -u postgres psql -c "ALTER USER mailer PASSWORD 'your_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE aether_mailer TO mailer;"
```

### Problem: Migration Failed

**Symptoms**: Database migration errors or schema conflicts

**Solutions**:

```bash
# 1. Check migration status
pnpm db:migrate status

# 2. Reset database (WARNING: Deletes all data)
pnpm db:reset

# 3. Run specific migration
pnpm db:migrate deploy

# 4. Generate Prisma client
pnpm db:generate

# 5. Check Prisma schema
npx prisma db pull
```

### Problem: Database Performance Issues

**Symptoms**: Slow queries, timeouts, high CPU usage

**Solutions**:

```sql
-- 1. Check active connections
SELECT count(*) FROM pg_stat_activity;

-- 2. Check slow queries
SELECT query, mean_time, calls
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- 3. Check database size
SELECT pg_size_pretty(pg_database_size('aether_mailer'));

-- 4. Analyze table statistics
ANALYZE;

-- 5. Reindex if needed
REINDEX DATABASE aether_mailer;
```

### PostgreSQL Configuration

```ini
# /etc/postgresql/15/main/postgresql.conf
# Performance tuning
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
```

---

## 🌐 Network Issues

### Problem: Services Not Accessible

**Symptoms**: Connection refused, timeout errors

**Solutions**:

```bash
# 1. Check if services are running
docker-compose ps
make docker-dev-status

# 2. Check port binding
netstat -tulpn | grep :3000
netstat -tulpn | grep :8080

# 3. Check firewall status
sudo ufw status
sudo iptables -L

# 4. Allow ports through firewall
sudo ufw allow 3000/tcp
sudo ufw allow 8080/tcp
sudo ufw allow 5432/tcp

# 5. Check Docker network
docker network ls
docker network inspect aether-mailer_default
```

### Problem: CORS Errors

**Symptoms**: Cross-origin request blocked in browser

**Solutions**:

```bash
# 1. Check CORS configuration
grep CORS_ORIGIN .env

# 2. Update CORS settings
echo "CORS_ORIGIN=http://localhost:3000,http://localhost:3001" >> .env

# 3. Restart services
make docker-dev-restart

# 4. Verify in browser console
# Network tab should show successful requests
```

### Problem: SSL/HTTPS Issues

**Symptoms**: Certificate errors, HTTPS not working

**Solutions**:

```bash
# 1. Generate self-signed certificate (development)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/private.key -out ssl/certificate.crt

# 2. Update configuration
echo "SSL_CERT_PATH=./ssl/certificate.crt" >> .env
echo "SSL_KEY_PATH=./ssl/private.key" >> .env

# 3. Use Let's Encrypt (production)
sudo apt install certbot
sudo certbot --nginx -d your-domain.com

# 4. Test SSL configuration
curl -I https://localhost:3000
```

---

## ⚡ Performance Issues

### Problem: Slow Application Response

**Symptoms**: High response times, sluggish interface

**Solutions**:

```bash
# 1. Check system resources
htop
df -h
free -h

# 2. Check application logs
tail -f logs/app.log
docker-compose logs app-dev

# 3. Profile Node.js application
node --prof server/dist/main.js
node --prof-process isolate-*.log > processed.txt

# 4. Check database performance
pnpm db:studio
# Run EXPLAIN ANALYZE on slow queries

# 5. Monitor memory usage
node --inspect server/dist/main.js
# Open Chrome DevTools > Node.js
```

### Problem: High Memory Usage

**Symptoms**: Out of memory errors, system swapping

**Solutions**:

```bash
# 1. Check memory usage
ps aux --sort=-%mem | head
docker stats

# 2. Optimize Node.js memory
echo "NODE_OPTIONS=--max-old-space-size=4096" >> .env

# 3. Check for memory leaks
node --inspect server/dist/main.js
# Use Chrome DevTools Memory tab

# 4. Restart services if needed
make docker-dev-restart

# 5. Add swap space if needed
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### Problem: High CPU Usage

**Symptoms**: System running at 100% CPU

**Solutions**:

```bash
# 1. Identify CPU-intensive processes
top
ps aux --sort=-%cpu | head

# 2. Check application performance
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:8080/health

# 3. Optimize database queries
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';

# 4. Enable caching
echo "REDIS_URL=redis://localhost:6379" >> .env

# 5. Scale horizontally
docker-compose up -d --scale app-dev=2
```

---

## 🔐 Authentication Issues

### Problem: Login Failed

**Symptoms**: Invalid credentials, authentication errors

**Solutions**:

```bash
# 1. Check user exists
pnpm cli users list
pnpm cli users get user@domain.com

# 2. Reset user password
pnpm cli users update user@domain.com --password NewPassword123!

# 3. Check JWT configuration
grep JWT_SECRET .env
grep JWT_EXPIRES_IN .env

# 4. Verify database user table
psql "postgresql://mailer:password@localhost:5432/aether_mailer" \
  -c "SELECT email, is_active FROM users WHERE email = 'user@domain.com';"

# 5. Test authentication manually
curl -X POST "http://localhost:8080/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@domain.com", "password": "password"}'
```

### Problem: JWT Token Issues

**Symptoms**: Token expired, invalid token errors

**Solutions**:

```bash
# 1. Check JWT secret
echo $JWT_SECRET
# Ensure it's set and not empty

# 2. Verify token format
# Decode JWT at https://jwt.io
# Check exp (expiration) and iat (issued at)

# 3. Refresh token
curl -X POST "http://localhost:8080/api/v1/auth/refresh" \
  -H "Authorization: Bearer YOUR_REFRESH_TOKEN"

# 4. Extend token expiration
echo "JWT_EXPIRES_IN=30d" >> .env

# 5. Regenerate JWT secret
echo "JWT_SECRET=$(openssl rand -base64 32)" >> .env
```

### Problem: Permission Denied

**Symptoms**: Access denied, insufficient privileges

**Solutions**:

```bash
# 1. Check user role
pnpm cli users get user@domain.com

# 2. Update user role
pnpm cli users update user@domain.com --role admin

# 3. Check permissions
curl -X GET "http://localhost:8080/api/v1/users" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 4. Verify RBAC configuration
grep ROLE_ .env

# 5. Create admin user if needed
pnpm cli users create admin@domain.com --password AdminPass123! --role admin
```

---

## 📧 Email Issues

### Problem: Email Sending Failed

**Symptoms**: Emails not delivered, SMTP errors

**Solutions**:

```bash
# 1. Check SMTP configuration
grep SMTP_ .env

# 2. Test SMTP connection
telnet smtp.gmail.com 587
# Commands: EHLO localhost, STARTTLS, AUTH LOGIN

# 3. Check email logs
tail -f logs/email.log
docker-compose logs app-dev | grep email

# 4. Verify SMTP credentials
curl -X POST "http://localhost:8080/api/v1/emails/test-smtp" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 5. Use alternative SMTP
echo "SMTP_HOST=smtp.mailgun.org" >> .env
echo "SMTP_PORT=587" >> .env
```

### Problem: Email Receiving Issues

**Symptoms**: Incoming emails not appearing

**Solutions**:

```bash
# 1. Check IMAP configuration
grep IMAP_ .env

# 2. Test IMAP connection
telnet imap.gmail.com 143
# Commands: . LOGIN user password, . SELECT INBOX

# 3. Check MX records
dig MX your-domain.com

# 4. Verify domain configuration
pnpm cli domains get your-domain.com

# 5. Check email queue
pnpm cli emails queue
pnpm cli emails status
```

### Problem: Email Delivery Delays

**Symptoms**: Emails taking long to deliver

**Solutions**:

```bash
# 1. Check email queue
pnpm cli emails queue

# 2. Process queue manually
pnpm cli emails process

# 3. Check rate limits
grep RATE_LIMIT_ .env

# 4. Monitor email logs
tail -f logs/email.log | grep "sent\|failed"

# 5. Configure retry settings
echo "EMAIL_RETRY_ATTEMPTS=5" >> .env
echo "EMAIL_RETRY_DELAY=300" >> .env
```

---

## 🐳 Docker Issues

### Problem: Container Won't Start

**Symptoms**: Docker containers failing to start

**Solutions**:

```bash
# 1. Check Docker status
sudo systemctl status docker

# 2. Check container logs
docker-compose logs app-dev
docker logs aether-mailer_app-dev_1

# 3. Rebuild containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# 4. Check Docker resources
docker system df
docker system prune -f

# 5. Check Docker daemon
sudo dockerd --debug
```

### Problem: Volume Mount Issues

**Symptoms**: Files not visible in containers, permission errors

**Solutions**:

```bash
# 1. Check volume mounts
docker-compose config | grep -A5 volumes

# 2. Fix permissions
sudo chown -R $USER:$USER ./app
sudo chmod -R 755 ./app

# 3. Check Docker volumes
docker volume ls
docker volume inspect aether-mailer_postgres_data

# 4. Recreate volumes
docker-compose down -v
docker-compose up -d

# 5. Use bind mounts instead
# Update docker-compose.yml with absolute paths
```

### Problem: Network Issues

**Symptoms**: Containers can't communicate, connection refused

**Solutions**:

```bash
# 1. Check Docker network
docker network ls
docker network inspect aether-mailer_default

# 2. Test container connectivity
docker-compose exec app-dev ping postgres
docker-compose exec postgres ping app-dev

# 3. Recreate network
docker network rm aether-mailer_default
docker-compose up -d

# 4. Check DNS resolution
docker-compose exec app-dev nslookup postgres

# 5. Use service names
# Ensure containers communicate using service names
```

---

## 🔍 Debugging Tools

### System Monitoring

```bash
# Real-time monitoring
htop                    # CPU/Memory
iotop                   # Disk I/O
nethogs                 # Network usage
docker stats            # Container stats

# Log monitoring
tail -f logs/app.log
journalctl -u aether-mailer -f
docker-compose logs -f
```

### Database Debugging

```bash
# Database monitoring
pnpm db:studio          # Prisma Studio
psql -d aether_mailer   # Direct database access

# Performance monitoring
pg_stat_activity        # Active connections
pg_stat_statements     # Query statistics
EXPLAIN ANALYZE         # Query planning
```

### Application Debugging

```bash
# Node.js debugging
node --inspect server/dist/main.js
node --prof server/dist/main.js

# API testing
curl -v http://localhost:8080/health
http -v http://localhost:8080/api/v1/users

# Frontend debugging
# Open Chrome DevTools
# Check Console, Network, Performance tabs
```

---

## 📞 Getting Help

### Self-Service Resources

- **Documentation**: [Main docs](../README.md)
- **API Reference**: [API docs](../api/README.md)
- **Configuration**: [Config guide](../configuration/README.md)

### Community Support

- **GitHub Issues**: [Report bugs](https://github.com/skygenesisenterprise/aether-mailer/issues)
- **GitHub Discussions**: [Ask questions](https://github.com/skygenesisenterprise/aether-mailer/discussions)
- **Discord Community**: [Join chat](https://discord.gg/aethermailer)

### Professional Support

- **Email Support**: support@aethermailer.com
- **Priority Support**: Available for enterprise customers
- **Consulting Services**: Custom setup and optimization

### Bug Report Template

When reporting issues, include:

```markdown
## Environment

- OS: Ubuntu 22.04
- Node.js: v20.0.0
- Docker: 24.0.0
- Aether Mailer: v0.1.0

## Issue Description

[Detailed description of the problem]

## Steps to Reproduce

1. Step one
2. Step two
3. Step three

## Expected Behavior

[What should happen]

## Actual Behavior

[What actually happened]

## Logs

[Relevant log entries]

## Additional Context

[Any other relevant information]
```

---

## 🚨 Emergency Procedures

### Complete System Reset

```bash
# WARNING: Deletes all data
docker-compose down -v
docker system prune -af
rm -rf data/
git checkout .
pnpm install
make docker-dev
```

### Database Recovery

```bash
# Restore from backup
psql aether_mailer < backup_20250112.sql

# Or use timestamped backup
psql aether_mailer < backup_$(date +%Y%m%d_%H%M%S).sql
```

### Service Restart

```bash
# Full service restart
make docker-dev-restart

# Individual service restart
docker-compose restart app-dev
docker-compose restart postgres
docker-compose restart redis
```

---

_Last updated: January 12, 2025_  
_Version: 0.1.0_
