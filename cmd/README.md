<div align="center">

# Aether Mailer Command Suite

![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=for-the-badge&logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js)
![Command Line](https://img.shields.io/badge/Command-Suite-9cf?style=for-the-badge)

**Advanced Administrative Commands for Aether Mailer Server**

[🎯 Purpose](#-purpose) • [🏗️ Architecture](#️-architecture) • [📋 Commands](#-commands) • [🔧 Configuration](#-configuration) • [🛠️ Development](#️-development) • [🤝 Contributing](#-contributing)

</div>

---

## 🎯 Purpose

The `/cmd/` directory contains the **core command suite** for Aether Mailer server administration. This is distinct from the user-facing CLI (`/cli/`) and focuses on **system-level administrative operations**.

### 🔄 Role in Ecosystem

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   CMD Suite     │    │   Express API    │    │  Core Services  │
│   (Admin Ops)   │◄──►│   (Admin API)   │◄──►│  (Mail Engine)  │
│  System Level   │    │  Port 8080      │    │  Background     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         ▲
         │
    ┌─────────┐
    │ CLI Tool │
    │ (Users)  │
    └─────────┘
```

- **System Administration** - Server management and configuration
- **User Administration** - Advanced user management operations
- **Authentication** - LDAP, OAuth, and certificate management
- **Certificate Management** - SSL/TLS certificate operations
- **Web Services** - HTTP/HTTPS server management
- **Database Operations** - Direct database access and migrations

---

## 🏗️ Architecture

### 📋 Current Implementation Status

> **⚠️ Planning Phase**: This command suite is in early planning with file structure only.

#### ✅ **Currently Implemented**
- **File Structure** - Organized command categories
- **TypeScript Configuration** - Build setup for commands
- **Command Categories** - Logical grouping of operations
- **Code Ownership** - Defined in CODEOWNERS

#### 🔄 **In Development**
- **Command Framework** - Base command parsing and execution
- **Authentication Commands** - LDAP, OAuth integration
- **User Management** - Advanced user operations
- **Certificate Management** - SSL/TLS operations

#### 📋 **Planned Features**
- **Server Management** - Start, stop, restart operations
- **Configuration Management** - System configuration commands
- **Database Operations** - Direct database access
- **Web Service Management** - HTTP/HTTPS server control
- **Monitoring Commands** - System health and diagnostics

---

## 📁 Directory Structure

```
cmd/
├── src/
│   ├── actions.ts              # Core action definitions
│   ├── admin.ts               # General administration commands
│   ├── admin_auth.ts           # Authentication management
│   ├── admin_auth_ldap.ts      # LDAP authentication
│   ├── admin_auth_ldap_test.ts # LDAP authentication testing
│   ├── admin_auth_oauth.ts      # OAuth authentication
│   ├── admin_auth_oauth_test.ts # OAuth authentication testing
│   ├── admin_user.ts           # User administration
│   ├── admin_user_change_password.ts # Password change operations
│   ├── admin_user_change_password_test.ts # Password change testing
│   ├── admin_user_create.ts    # User creation operations
│   ├── cert.ts                # Certificate management
│   ├── cert_test.ts           # Certificate testing
│   ├── cmd.ts                # Main command entry point
│   ├── config.ts              # Configuration management
│   ├── config_test.ts         # Configuration testing
│   ├── manager.ts             # Command manager
│   ├── serv.ts               # Service management
│   ├── web.ts                # Web server management
│   ├── web_acme.ts           # ACME/Let's Encrypt integration
│   ├── web_graceful.ts       # Graceful shutdown handling
│   └── web_https.ts          # HTTPS server management
├── tests/                    # Test suites (planned)
├── docs/                     # Command documentation (planned)
├── tsconfig.json             # TypeScript configuration
├── tsconfig.build.json       # Build-specific TypeScript config
├── CODEOWNERS               # Code ownership rules
└── README.md                # This documentation
```

---

## 📋 Commands

### 🔐 **Authentication Management**

#### `aether-admin auth`
Manage authentication methods and configurations.

```bash
aether-admin auth <method> [options]

Methods:
  ldap         Configure LDAP authentication
  oauth        Configure OAuth authentication
  local        Configure local authentication
  test         Test authentication configuration

LDAP Options:
  --server, -s        LDAP server URL
  --bind-dn, -b       Bind DN for authentication
  --bind-password, -p  Bind password
  --user-base, -u      User search base DN
  --user-filter, -f    User search filter
  --test-user, -t      Test user credentials

OAuth Options:
  --provider, -p       OAuth provider (google|github|microsoft)
  --client-id, -i      OAuth client ID
  --client-secret, -s   OAuth client secret
  --redirect-uri, -r    OAuth redirect URI
  --scope, -c          OAuth scopes

Examples:
  aether-admin auth ldap --server ldap://ldap.example.com --bind-dn "cn=admin,dc=example,dc=com"
  aether-admin auth oauth --provider google --client-id "your-client-id"
  aether-admin auth test --method ldap --test-user user@example.com
```

### 👥 **User Administration**

#### `aether-admin user`
Advanced user management operations.

```bash
aether-admin user <action> [options]

Actions:
  create              Create new user account
  delete              Delete user account
  modify              Modify user account
  list                List user accounts
  change-password      Change user password
  enable              Enable user account
  disable             Disable user account
  reset-password      Reset user password

Create Options:
  --email, -e         User email address
  --password, -p       Initial password
  --name, -n          Display name
  --domain, -d        Domain (auto-detected)
  --quota, -q         Storage quota in MB
  --admin, -a         Admin privileges
  --force, -f         Skip confirmation prompts

Delete Options:
  --email, -e         User email to delete
  --backup, -b        Create backup before deletion
  --force, -f         Skip confirmation

Change Password Options:
  --email, -e         User email
  --old-password, -o   Old password (for user self-change)
  --new-password, -n   New password
  --require-change, -r Require change on next login

Examples:
  aether-admin user create --email admin@example.com --password securepass --admin
  aether-admin user delete --email olduser@example.com --backup
  aether-admin user change-password --email user@example.com --new-password newpass
  aether-admin user list --domain example.com --format table
```

### 🔒 **Certificate Management**

#### `aether-admin cert`
Manage SSL/TLS certificates for secure communications.

```bash
aether-admin cert <action> [options]

Actions:
  generate            Generate self-signed certificate
  install             Install certificate from file
  renew               Renew existing certificate
  list                List installed certificates
  remove              Remove certificate
  validate            Validate certificate

Generate Options:
  --domain, -d         Domain name for certificate
  --key-size, -k       RSA key size (2048|4096) [default: 2048]
  --days, -D          Certificate validity in days [default: 365]
  --country, -c        Country code
  --state, -s          State/province
  --city, -C           City name
  --organization, -o   Organization name
  --common-name, -n     Common name (domain)
  --san, -a           Subject Alternative Names

Install Options:
  --cert-file, -c       Certificate file path
  --key-file, -k        Private key file path
  --chain-file, -C      Certificate chain file path
  --service, -s         Service to install for (smtp|imap|web|all)

ACME/Let's Encrypt Options:
  --domain, -d         Domain name
  --email, -e          Contact email
  --staging, -S        Use Let's Encrypt staging
  --dns-provider, -D    DNS provider for challenges
  --api-key, -K        DNS provider API key

Examples:
  aether-admin cert generate --domain mail.example.com --organization "Example Corp"
  aether-admin cert install --cert-file cert.pem --key-file key.pem --service smtp
  aether-admin cert renew --domain mail.example.com
  aether-admin cert list --format json
```

### 🌐 **Web Service Management**

#### `aether-admin web`
Manage web server and HTTP services.

```bash
aether-admin web <action> [options]

Actions:
  start               Start web server
  stop                Stop web server
  restart             Restart web server
  status              Show web server status
  config              Configure web server
  logs                Show web server logs
  acme                ACME/Let's Encrypt management

Start Options:
  --port, -p          HTTP port [default: 80]
  --https-port, -P     HTTPS port [default: 443]
  --bind, -b          Bind address [default: 0.0.0.0]
  --workers, -w        Number of worker processes
  --config, -c         Configuration file path

Config Options:
  --max-connections, -m Maximum concurrent connections
  --timeout, -t        Request timeout in seconds
  --keep-alive, -k     Enable keep-alive
  --compression, -C     Enable compression
  --log-level, -l      Log level (error|warn|info|debug)

ACME Options:
  --domain, -d         Domain for certificate
  --email, -e          Contact email
  --webroot, -w        Webroot for challenges
  --auto-renew, -a     Enable automatic renewal

Examples:
  aether-admin web start --port 8080 --workers 4
  aether-admin web config --max-connections 1000 --timeout 30
  aether-admin web acme --domain mail.example.com --email admin@example.com
  aether-admin web logs --tail 100 --follow
```

### ⚙️ **Configuration Management**

#### `aether-admin config`
Manage system configuration and settings.

```bash
aether-admin config <action> [options]

Actions:
  get                 Get configuration value
  set                 Set configuration value
  list                List all configuration
  validate            Validate configuration
  import               Import configuration from file
  export               Export configuration to file
  reset               Reset to defaults

Get Options:
  --key, -k           Configuration key
  --format, -f        Output format (text|json|yaml)

Set Options:
  --key, -k           Configuration key
  --value, -v         Configuration value
  --type, -t          Value type (string|number|boolean|json)
  --restart, -r        Restart affected service

Import/Export Options:
  --file, -f          Configuration file path
  --format, -F        File format (json|yaml|toml)
  --section, -s        Configuration section to import/export
  --merge, -m         Merge with existing configuration

Examples:
  aether-admin config get server.port
  aether-admin config set server.port 8080 --type number
  aether-admin config list --format json
  aether-admin config import --file config.json --merge
  aether-admin config validate --section database
```

### 🔧 **Service Management**

#### `aether-admin service`
Manage core mail services.

```bash
aether-admin service <action> [options]

Actions:
  start               Start service
  stop                Stop service
  restart             Restart service
  status              Show service status
  enable              Enable service (auto-start)
  disable             Disable service
  logs                Show service logs
  metrics             Show service metrics

Service Names:
  smtp                SMTP server
  imap                IMAP server
  pop3                POP3 server
  jmap                JMAP server
  web                 Web administration
  api                 API server
  queue               Email queue processor
  filter               Spam/virus filter

Options:
  --service, -s        Specific service name
  --all, -a           All services
  --timeout, -t        Operation timeout in seconds
  --force, -f         Force operation
  --graceful, -g      Graceful shutdown/restart

Examples:
  aether-admin service start --service smtp
  aether-admin service restart --all --graceful
  aether-admin service status --service imap
  aether-admin service logs --service queue --tail 50
  aether-admin service enable --service smtp --service imap
```

---

## 🔧 Configuration

### 📄 **Configuration Files**

#### `/etc/aether-mailer/config.json`
```json
{
  "server": {
    "host": "0.0.0.0",
    "port": 8080,
    "workers": 4,
    "timeout": 30
  },
  "authentication": {
    "methods": ["ldap", "oauth", "local"],
    "ldap": {
      "server": "ldap://ldap.example.com",
      "bind_dn": "cn=admin,dc=example,dc=com",
      "user_base": "ou=users,dc=example,dc=com",
      "user_filter": "(uid=%u)"
    },
    "oauth": {
      "providers": ["google", "github"],
      "google": {
        "client_id": "your-google-client-id",
        "client_secret": "your-google-secret"
      }
    }
  },
  "certificates": {
    "auto_renew": true,
    "acme": {
      "provider": "letsencrypt",
      "staging": false,
      "email": "admin@example.com"
    }
  },
  "services": {
    "smtp": { "enabled": true, "port": 25 },
    "imap": { "enabled": true, "port": 143 },
    "pop3": { "enabled": false, "port": 110 },
    "web": { "enabled": true, "port": 80 }
  }
}
```

### 🌍 **Environment Variables**

```bash
# Server Configuration
AETHER_SERVER_HOST=0.0.0.0
AETHER_SERVER_PORT=8080
AETHER_SERVER_WORKERS=4

# Authentication
AETHER_LDAP_SERVER=ldap://ldap.example.com
AETHER_LDAP_BIND_DN=cn=admin,dc=example,dc=com
AETHER_OAUTH_GOOGLE_CLIENT_ID=your-client-id
AETHER_OAUTH_GOOGLE_CLIENT_SECRET=your-secret

# Certificate Management
AETHER_CERT_AUTO_RENEW=true
AETHER_ACME_EMAIL=admin@example.com
AETHER_ACME_STAGING=false

# Database
AETHER_DB_URL=postgresql://user:pass@localhost/aether_mailer
AETHER_DB_POOL_SIZE=20

# Logging
AETHER_LOG_LEVEL=info
AETHER_LOG_FORMAT=json
AETHER_LOG_FILE=/var/log/aether-mailer.log
```

---

## 🛠️ Development

### 📋 **Development Commands**

```bash
# Development
pnpm dev              # Run in development mode
pnpm build            # Build for production
pnpm build:watch      # Build with watch mode

# Testing
pnpm test             # Run all tests
pnpm test:watch       # Watch mode testing
pnpm test:coverage    # Coverage report

# Code Quality
pnpm lint             # ESLint checking
pnpm lint:fix         # Auto-fix linting issues
pnpm typecheck        # TypeScript type checking

# Command Testing
pnpm cmd --help       # Test command help
pnpm cmd auth --help   # Test specific command
```

### 🧪 **Testing Strategy**

```typescript
// Example command test
describe('UserCommand', () => {
  it('should create user with valid parameters', async () => {
    const mockDb = createMockDatabase();
    const command = new UserCreateCommand(mockDb);
    
    await command.execute({
      email: 'test@example.com',
      password: 'securepass',
      name: 'Test User'
    });
    
    expect(mockDb.createUser).toHaveBeenCalledWith({
      email: 'test@example.com',
      passwordHash: expect.any(String),
      name: 'Test User'
    });
  });
});
```

### 📝 **Code Standards**

- **TypeScript Strict** - All code must pass strict type checking
- **Command Pattern** - Use consistent command structure
- **Error Handling** - Comprehensive error handling with user-friendly messages
- **Input Validation** - Validate all command inputs
- **Security** - Follow security best practices for administrative operations
- **Testing** - Unit tests for all command logic

---

## 🚀 Deployment

### 🐳 **Binary Distribution**

```bash
# Build for multiple platforms
pnpm build:linux     # Build for Linux
pnpm build:macos      # Build for macOS
pnpm build:windows    # Build for Windows

# Create distribution package
pnpm package          # Create tarball with binaries
```

### 📦 **System Installation**

```bash
# Install system-wide
sudo pnpm install -g

# Create system user
sudo useradd -r -s /bin/false aether-mailer

# Set up configuration directory
sudo mkdir -p /etc/aether-mailer
sudo cp config.json /etc/aether-mailer/

# Set up log directory
sudo mkdir -p /var/log/aether-mailer
sudo chown aether-mailer:aether-mailer /var/log/aether-mailer

# Create systemd service
sudo cp scripts/aether-mailer.service /etc/systemd/system/
sudo systemctl enable aether-mailer
sudo systemctl start aether-mailer
```

---

## 📊 Current Status

| Component | Status | Notes |
|-----------|--------|-------|
| **Command Framework** | 📋 Planned | Base command parsing |
| **Authentication Commands** | 📋 Planned | LDAP, OAuth integration |
| **User Management** | 📋 Planned | Advanced user operations |
| **Certificate Management** | 📋 Planned | SSL/TLS operations |
| **Web Service Commands** | 📋 Planned | HTTP/HTTPS management |
| **Configuration Management** | 📋 Planned | System configuration |
| **Service Management** | 📋 Planned | Service control |
| **Testing Suite** | 📋 Planned | Unit and integration tests |

---

## 🚀 Roadmap

### 🎯 **Phase 1: Foundation (Q1 2025)**
- **Command Framework** - Base command parsing and execution
- **Configuration System** - Configuration file management
- **Basic Commands** - Status, help, version
- **Error Handling** - Comprehensive error management
- **Logging System** - Structured logging for commands

### 🚀 **Phase 2: Core Commands (Q2 2025)**
- **Authentication Commands** - LDAP, OAuth configuration
- **User Management** - Advanced user operations
- **Certificate Management** - SSL/TLS certificate operations
- **Web Service Management** - HTTP/HTTPS server control
- **Configuration Management** - Get/set configuration

### ⚙️ **Phase 3: Advanced Features (Q3 2025)**
- **Service Management** - Start/stop/restart services
- **Database Operations** - Direct database access
- **ACME Integration** - Let's Encrypt automation
- **Monitoring Commands** - System health and diagnostics
- **Batch Operations** - Bulk user/domain operations

### 🌟 **Phase 4: Enterprise Features (Q4 2025)**
- **Multi-Server Management** - Manage multiple instances
- **Role-Based Access** - Command-level permissions
- **Audit Logging** - Command execution logging
- **Backup/Restore** - System backup operations
- **Plugin System** - Extensible command plugins

---

## 🤝 Contributing

### 🎯 **How to Contribute**

The command suite is perfect for contributors with expertise in:

- **System Administration** - Server management and operations
- **Authentication Systems** - LDAP, OAuth, SAML integration
- **Certificate Management** - SSL/TLS and PKI operations
- **Command Line Tools** - CLI design and user experience
- **Security** - System security and access control
- **DevOps** - Deployment and automation

### 📝 **Adding New Commands**

1. **Create command file**
   ```typescript
   export class NewCommand implements Command {
     name = 'new';
     description = 'Description of command';
     usage = 'aether-admin new [options]';
     
     async execute(args: any, options: any): Promise<void> {
       // Command implementation
     }
   }
   ```

2. **Register command**
   ```typescript
   // Register in command manager
   commands.register('new', new NewCommand());
   ```

3. **Write tests**
   ```typescript
   describe('NewCommand', () => {
     // Test implementation
   });
   ```

4. **Update documentation**
   ```markdown
   ## New Command
   
   Description and usage examples...
   ```

### 🏗️ **Development Guidelines**

- **Security First** - All administrative operations must be secure
- **Input Validation** - Validate all user inputs
- **Error Handling** - Provide clear error messages and exit codes
- **Logging** - Log all administrative operations for audit trails
- **Testing** - Unit tests for all command logic
- **Documentation** - Comprehensive help for all commands

---

## 📞 Support & Resources

### 📖 **Documentation**

- **[Command Reference](docs/commands/)** - Complete command documentation
- **[Configuration Guide](docs/config/)** - Configuration options
- **[Security Guide](docs/security/)** - Security best practices
- **[Deployment Guide](docs/deployment/)** - Installation and setup

### 💬 **Getting Help**

- **Built-in Help** - `aether-admin --help` and `aether-admin <command> --help`
- **GitHub Issues** - Bug reports and feature requests
- **Discussions** - General questions and ideas
- **Development Team** - Contact backend maintainers

---

## 📄 License

This command suite is part of the Aether Mailer project, licensed under the **MIT License** - see the [LICENSE](../LICENSE) file for details.

---

<div align="center">

### 🔧 **Powerful System Administration for Aether Mailer**

[⭐ Star Project](https://github.com/skygenesisenterprise/aether-mailer) • [🐛 Report Issues](https://github.com/skygenesisenterprise/aether-mailer/issues) • [💡 Start Discussion](https://github.com/skygenesisenterprise/aether-mailer/discussions)

---

**🔧 Currently in Planning Phase - Systems Administrators Welcome!**

**Made with ❤️ by the [Sky Genesis Enterprise](https://skygenesisenterprise.com) backend team**

*Building robust, secure, and powerful administrative command tools*

</div>