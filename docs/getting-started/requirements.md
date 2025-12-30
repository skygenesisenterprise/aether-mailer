# System Requirements

This document outlines the system requirements for running Aether Mailer in different environments.

## 📋 Overview

Aether Mailer is designed to be flexible and can run on various systems, from development machines to production servers. Requirements vary based on your deployment method and expected load.

---

## 🖥️ Minimum Requirements

### Development Environment

| Component   | Minimum             | Recommended       |
| ----------- | ------------------- | ----------------- |
| **CPU**     | 2 cores             | 4 cores           |
| **Memory**  | 4GB RAM             | 8GB RAM           |
| **Storage** | 10GB                | 20GB SSD          |
| **OS**      | Linux/macOS/Windows | Ubuntu 22.04+ LTS |

### Software Dependencies

| Software       | Minimum Version | Recommended Version |
| -------------- | --------------- | ------------------- |
| **Node.js**    | 18.0.0          | 20.0.0+             |
| **PostgreSQL** | 14.0            | 15.0+               |
| **Redis**      | 7.0             | 7.2+                |
| **Docker**     | 20.0.0          | 24.0.0+             |
| **pnpm**       | 8.0.0           | 9.0.0+              |

---

## 🚀 Production Requirements

### Small Production (1-100 users)

| Component   | Minimum       | Recommended       |
| ----------- | ------------- | ----------------- |
| **CPU**     | 2 cores       | 4 cores           |
| **Memory**  | 8GB RAM       | 16GB RAM          |
| **Storage** | 50GB SSD      | 100GB SSD         |
| **Network** | 100 Mbps      | 1 Gbps            |
| **OS**      | Ubuntu 20.04+ | Ubuntu 22.04+ LTS |

### Medium Production (100-1000 users)

| Component   | Minimum       | Recommended       |
| ----------- | ------------- | ----------------- |
| **CPU**     | 4 cores       | 8 cores           |
| **Memory**  | 16GB RAM      | 32GB RAM          |
| **Storage** | 200GB SSD     | 500GB SSD         |
| **Network** | 1 Gbps        | 10 Gbps           |
| **OS**      | Ubuntu 22.04+ | Ubuntu 22.04+ LTS |

### Large Production (1000+ users)

| Component         | Minimum       | Recommended       |
| ----------------- | ------------- | ----------------- |
| **CPU**           | 8 cores       | 16+ cores         |
| **Memory**        | 32GB RAM      | 64GB+ RAM         |
| **Storage**       | 1TB SSD       | 2TB+ SSD          |
| **Network**       | 10 Gbps       | 10+ Gbps          |
| **OS**            | Ubuntu 22.04+ | Ubuntu 22.04+ LTS |
| **Load Balancer** | Nginx/HAProxy | Hardware LB       |

---

## 🐳 Docker Requirements

### Docker Development

| Component          | Requirement |
| ------------------ | ----------- |
| **Docker Engine**  | 20.0.0+     |
| **Docker Compose** | 2.0.0+      |
| **Memory**         | 4GB+        |
| **Storage**        | 20GB+       |

### Docker Production

| Component          | Requirement             |
| ------------------ | ----------------------- |
| **Docker Engine**  | 24.0.0+                 |
| **Docker Compose** | 2.20.0+                 |
| **Memory**         | 8GB+                    |
| **Storage**        | 100GB+                  |
| **Orchestration**  | Docker Swarm/Kubernetes |

---

## 💾 Database Requirements

### PostgreSQL

| Environment           | Version | Memory | Storage | Connections |
| --------------------- | ------- | ------ | ------- | ----------- |
| **Development**       | 14.0+   | 1GB    | 10GB    | 100         |
| **Small Production**  | 15.0+   | 4GB    | 50GB    | 200         |
| **Medium Production** | 15.0+   | 8GB    | 200GB   | 500         |
| **Large Production**  | 15.0+   | 16GB+  | 1TB+    | 1000+       |

### PostgreSQL Configuration

```sql
-- Development settings
shared_buffers = 256MB
effective_cache_size = 1GB
max_connections = 100
work_mem = 4MB

-- Production settings
shared_buffers = 2GB
effective_cache_size = 8GB
max_connections = 500
work_mem = 16MB
maintenance_work_mem = 512MB
```

### Redis (Optional)

| Environment     | Version | Memory | Storage | Persistence |
| --------------- | ------- | ------ | ------- | ----------- |
| **Development** | 7.0+    | 512MB  | 1GB     | RDB/AOF     |
| **Production**  | 7.2+    | 2GB+   | 10GB+   | RDB+AOF     |

---

## 🌐 Network Requirements

### Bandwidth Requirements

| Users      | Concurrent | Bandwidth | Messages/day   |
| ---------- | ---------- | --------- | -------------- |
| **Small**  | 10-50      | 100 Mbps  | 1,000-10,000   |
| **Medium** | 50-200     | 1 Gbps    | 10,000-100,000 |
| **Large**  | 200+       | 10 Gbps   | 100,000+       |

### Port Requirements

| Port     | Protocol | Service           | Required        |
| -------- | -------- | ----------------- | --------------- |
| **25**   | TCP      | SMTP              | Outgoing mail   |
| **587**  | TCP      | SMTP (Submission) | Outgoing mail   |
| **143**  | TCP      | IMAP              | Incoming mail   |
| **993**  | TCP      | IMAPS             | Secure incoming |
| **80**   | TCP      | HTTP              | Web interface   |
| **443**  | TCP      | HTTPS             | Secure web      |
| **8080** | TCP      | API               | Backend API     |
| **3000** | TCP      | Frontend          | Development     |
| **5432** | TCP      | PostgreSQL        | Database        |
| **6379** | TCP      | Redis             | Caching         |

### Firewall Configuration

```bash
# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow email ports
sudo ufw allow 25/tcp
sudo ufw allow 587/tcp
sudo ufw allow 143/tcp
sudo ufw allow 993/tcp

# Allow SSH (remote management)
sudo ufw allow 22/tcp

# Enable firewall
sudo ufw enable
```

---

## 🔧 Software Dependencies

### Node.js Runtime

```bash
# Install Node.js 20.x (recommended)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should be v20.x.x
npm --version   # Should be 10.x.x
```

### Package Manager

```bash
# Install pnpm (recommended)
npm install -g pnpm

# Verify installation
pnpm --version  # Should be 9.x.x
```

### Build Tools

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y build-essential git

# CentOS/RHEL
sudo yum groupinstall "Development Tools"
sudo yum install git
```

---

## 🖥️ Operating System Support

### Supported Operating Systems

| OS          | Version    | Support Level | Notes         |
| ----------- | ---------- | ------------- | ------------- |
| **Ubuntu**  | 20.04+ LTS | ✅ Full       | Recommended   |
| **Debian**  | 11+        | ✅ Full       | Stable option |
| **CentOS**  | 9+         | ✅ Full       | Enterprise    |
| **RHEL**    | 9+         | ✅ Full       | Commercial    |
| **Fedora**  | 38+        | ✅ Full       | Cutting-edge  |
| **macOS**   | 12+        | ✅ Full       | Development   |
| **Windows** | 10+        | ⚠️ Limited    | WSL2 required |

### Linux Distribution Details

```bash
# Ubuntu 22.04 LTS (Recommended)
# - Latest packages
# - Long-term support
# - Excellent Docker support

# Debian 11 (Stable)
# - Very stable
# - Conservative package updates
# - Good for production

# CentOS 9 Stream
# - Enterprise-grade
# - Long support cycle
# - RHEL-compatible
```

---

## 📊 Performance Benchmarks

### Expected Performance

| Load                   | CPU Usage | Memory Usage | Response Time |
| ---------------------- | --------- | ------------ | ------------- |
| **Light** (10 users)   | <10%      | <2GB         | <100ms        |
| **Medium** (100 users) | <25%      | <8GB         | <200ms        |
| **Heavy** (1000 users) | <50%      | <16GB        | <500ms        |

### Scaling Factors

- **CPU**: ~50 users per core
- **Memory**: ~100 users per 4GB
- **Storage**: ~1000 messages per GB
- **Network**: ~1000 emails per 100Mbps

---

## 🔍 System Validation

### Pre-Installation Check

```bash
#!/bin/bash
# System requirements check script

echo "🔍 Checking system requirements..."

# Check OS
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "✅ Linux detected"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    echo "✅ macOS detected"
else
    echo "⚠️  Unsupported OS: $OSTYPE"
fi

# Check CPU cores
CPU_CORES=$(nproc)
echo "🖥️  CPU cores: $CPU_CORES"
if [ $CPU_CORES -lt 2 ]; then
    echo "⚠️  Minimum 2 CPU cores required"
fi

# Check Memory
MEMORY_KB=$(grep MemTotal /proc/meminfo | awk '{print $2}')
MEMORY_GB=$((MEMORY_KB / 1024 / 1024))
echo "💾 Memory: ${MEMORY_GB}GB"
if [ $MEMORY_GB -lt 4 ]; then
    echo "⚠️  Minimum 4GB RAM required"
fi

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "📦 Node.js: $NODE_VERSION"
else
    echo "❌ Node.js not installed"
fi

# Check PostgreSQL
if command -v psql &> /dev/null; then
    PG_VERSION=$(psql --version | awk '{print $3}')
    echo "🗄️  PostgreSQL: $PG_VERSION"
else
    echo "❌ PostgreSQL not installed"
fi

# Check Docker
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version | awk '{print $3}' | sed 's/,//')
    echo "🐳 Docker: $DOCKER_VERSION"
else
    echo "❌ Docker not installed"
fi

echo "✅ System check complete!"
```

### Performance Testing

```bash
# Load test script
ab -n 1000 -c 10 http://localhost:8080/health

# Database performance
pgbench -i -s 10 aether_mailer
pgbench -c 10 -j 2 -t 1000 aether_mailer
```

---

## 🚨 Limitations and Constraints

### Known Limitations

- **Windows**: Requires WSL2 for full functionality
- **ARM64**: Experimental support
- **Cloud Providers**: Some have specific requirements
- **Email Volume**: High volume may require additional infrastructure

### Resource Constraints

- **File Uploads**: Limited by available storage
- **Concurrent Connections**: Limited by database connections
- **Email Queue**: Limited by Redis memory
- **SSL/TLS**: Certificate management required

---

## 📈 Upgrade Path

### Scaling Recommendations

1. **Start**: Docker development environment
2. **Grow**: Single server production setup
3. **Scale**: Multi-server with load balancer
4. **Enterprise**: Kubernetes cluster

### Hardware Upgrade Timeline

| Users        | Timeline    | Recommended Upgrade       |
| ------------ | ----------- | ------------------------- |
| **0-50**     | Initial     | Development setup         |
| **50-200**   | 3-6 months  | Production server         |
| **200-1000** | 6-12 months | Load balancer + 2 servers |
| **1000+**    | 12+ months  | Kubernetes cluster        |

---

## 📞 Support

### System Requirements Support

- **Documentation**: [Installation Guide](installation.md)
- **Community**: [GitHub Discussions](https://github.com/skygenesisenterprise/aether-mailer/discussions)
- **Issues**: [GitHub Issues](https://github.com/skygenesisenterprise/aether-mailer/issues)
- **Email**: support@aethermailer.com

### Professional Services

- **System Architecture**: Custom setup consultation
- **Performance Tuning**: Optimization services
- **Security Audit**: Security assessment
- **Migration Support**: Data migration assistance

---

_Last updated: January 12, 2025_  
_Version: 0.1.0_
