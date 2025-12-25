# Aether Mailer Docker System Architecture

## Overview

The `docker/` directory contains a complete Linux distribution-like filesystem structure designed for container deployment of Aether Mailer. This approach follows the Filesystem Hierarchy Standard (FHS) to ensure compatibility with Linux conventions and best practices.

## Directory Structure

```
docker/
├── rootfs/                    # Root filesystem (like a Linux distro)
│   ├── etc/                   # System configuration
│   │   ├── ssh/              # SSH configuration
│   │   ├── pam.d/            # PAM authentication modules
│   │   ├── security/          # Security policies
│   │   ├── hosts             # Hostname resolution
│   │   ├── resolv.conf        # DNS configuration
│   │   └── environment        # System-wide environment variables
│   ├── usr/                   # User programs and data
│   │   ├── bin/             # User binaries
│   │   ├── lib/             # Shared libraries
│   │   ├── share/           # Architecture-independent data
│   │   └── local/           # Local software
│   ├── var/                   # Variable data
│   │   ├── log/             # System logs
│   │   ├── lib/             # Persistent data
│   │   ├── run/             # Runtime data
│   │   └── tmp/            # Persistent temporary files
│   ├── opt/                   # Optional add-on software
│   ├── home/                  # User home directories
│   ├── tmp/                   # Temporary files (tmpfs)
│   └── run/                   # Runtime files (tmpfs)
├── config/                     # Build and deployment configs
│   ├── environment/           # Environment-specific configs
│   └── features/             # Optional feature configs
├── scripts/                    # Build and deployment scripts
├── manifests/                  # Dockerfile and manifests
├── tests/                     # Testing framework
└── docs/                      # Documentation
```

## Key Features

### 1. FHS-Compliant Structure

- **Standard Linux Layout**: Follows Filesystem Hierarchy Standard
- **Container Optimized**: Adapted for container runtime requirements
- **Security Focused**: Proper permissions and isolation

### 2. Authentication System

- **PAM Integration**: Pluggable Authentication Modules
- **External Service Support**: Integration with external auth services
- **Fallback Local Auth**: Local authentication as backup

### 3. SSH Management

- **Secure Shell Access**: Remote CLI management capability
- **Custom Shell**: Limited CLI shell for security
- **Key-based Auth**: SSH key management support

### 4. System Scripts

- **Initialization**: `container-init.sh` for startup
- **Health Checks**: `container-health.sh` for monitoring
- **Cleanup**: `container-cleanup.sh` for shutdown

## Security Features

### 1. Multi-layered Security

```bash
# System limits (limits.conf)
* hard core 0
ssh-user soft nproc 1024
mailer hard nofile 8192

# Access control (access.conf)
+:ssh-user:ALL
-:ALL:ALL

# PAM authentication (pam.d/sshd)
auth sufficient pam_exec.so /usr/bin/ssh-auth.sh
```

### 2. Container Hardening

- **Non-root Users**: Application and SSH users
- **Minimal Base**: Alpine Linux for small attack surface
- **Read-only FS**: Critical filesystems read-only where possible
- **Resource Limits**: CPU, memory, and process limits

### 3. Audit and Logging

- **Centralized Logs**: All logs in `/var/log/`
- **SSH Access Logs**: Detailed SSH authentication logs
- **System Events**: Container lifecycle events logged

## Usage Examples

### Building the Container

```bash
# Build with Linux distro structure
docker build -f docker/manifests/Dockerfile -t aether-mailer:latest .

# Or using root Dockerfile (updated for new structure)
docker build -t aether-mailer:latest .
```

### Running with Environment

```bash
# Development
docker run -d --name aether-mailer-dev \
  --env-file docker/config/environment/dev.env \
  -p 3000:3000 -p 2222:2222 \
  aether-mailer:latest

# Production
docker run -d --name aether-mailer-prod \
  --env-file docker/config/environment/prod.env \
  -p 3000:3000 -p 2222:2222 \
  aether-mailer:latest
```

### SSH Access

```bash
# Connect to container CLI
ssh -p 2222 ssh-user@localhost

# Or using the Makefile
make docker-ssh
```

### Health Monitoring

```bash
# Check container health
docker exec aether-mailer /usr/bin/container-health.sh

# Or using the Makefile
make docker-exec CMD="/usr/bin/container-health.sh"
```

## Configuration Management

### 1. Environment Variables

- **System-wide**: `/etc/environment`
- **Service-specific**: Service configs in `/etc/`
- **Runtime**: Docker environment variables override

### 2. Authentication Configuration

- **Primary**: External auth service via `SSH_AUTH_SERVICE_URL`
- **Fallback**: Local authentication via `SSH_ENABLE_LOCAL_AUTH=true`
- **PAM Modules**: Configurable authentication methods

### 3. Security Policies

- **User Limits**: `/etc/security/limits.conf`
- **Access Control**: `/etc/security/access.conf`
- **SSH Security**: `/etc/ssh/sshd_config`

## Development Workflow

### 1. Adding New Services

```bash
# 1. Add service configuration
mkdir -p docker/rootfs/etc/myservice/
echo "config" > docker/rootfs/etc/myservice/myservice.conf

# 2. Add service binary
cp myservice docker/rootfs/usr/bin/

# 3. Add PAM config (if needed)
cp myservice.pam docker/rootfs/etc/pam.d/myservice

# 4. Update Dockerfile if needed
```

### 2. Testing Changes

```bash
# Build with changes
make docker-build

# Test functionality
make docker-run
make docker-ssh-test

# Verify health
make docker-exec CMD="/usr/bin/container-health.sh"
```

### 3. Environment Management

```bash
# Development
docker-compose -f docker-compose.dev.yml up

# Staging
docker-compose -f docker-compose.staging.yml up

# Production
docker-compose -f docker-compose.prod.yml up
```

## Migration from Previous Structure

### Before (Old Structure)

```
docker/
├── sshd_config          # SSH config at root
├── banner               # SSH banner at root
├── mailer-shell.sh      # Scripts at root
├── ssh-auth.sh          # Auth script at root
└── root/etc/            # Partial structure
```

### After (New FHS Structure)

```
docker/
├── rootfs/             # Complete Linux filesystem
│   ├── etc/ssh/        # SSH configuration
│   ├── etc/pam.d/      # Authentication modules
│   ├── usr/bin/         # User binaries
│   └── var/log/        # System logs
├── config/             # Environment configs
├── manifests/          # Dockerfiles
└── scripts/           # Build scripts
```

## Benefits

### 1. **Standard Compliance**

- FHS compliant for Linux compatibility
- Standard locations for system files
- Predictable structure for administrators

### 2. **Security Enhancement**

- Proper file permissions
- Isolated user environments
- Centralized security policies

### 3. **Maintainability**

- Clear separation of concerns
- Consistent structure across services
- Easy to extend and modify

### 4. **Container Optimization**

- Minimal runtime footprint
- Efficient layer caching
- Proper volume mounting

## Future Enhancements

### 1. Systemd Support

- Systemd unit files in `/etc/systemd/system/`
- Service management via systemctl
- Dependency management

### 2. Advanced Monitoring

- Prometheus metrics in `/var/lib/prometheus/`
- Custom health checks
- Alerting configurations

### 3. Multi-Service Support

- Service discovery configuration
- Inter-service communication
- Load balancing support

---

This architecture transforms the Docker directory into a proper Linux distribution-like environment while maintaining container best practices and security standards.
