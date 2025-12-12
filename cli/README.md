<div align="center">

# Aether Mailer CLI

![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=for-the-badge&logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js)

**Powerful Command Line Interface for Aether Mailer Administration**

[🎯 Purpose](#-purpose) • [🛠️ Installation](#️-installation) • [📋 Commands](#-commands) • [🏗️ Architecture](#️-architecture) • [🔧 Configuration](#-configuration) • [🤝 Contributing](#-contributing)

</div>

---

## 🎯 Purpose

The `/cli/` directory contains the **command line interface** for Aether Mailer, providing powerful administrative tools for server management, user administration, and system monitoring directly from the terminal.

### 🔄 Role in Ecosystem

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   CLI Tool      │    │   Express API    │    │  Core Services  │
│   (mailer)      │◄──►│   (Admin API)   │◄──►│  (Mail Engine)  │
│  Terminal       │    │  Port 8080      │    │  Background     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

- **Server Administration** - Direct server management commands
- **User Management** - Create, modify, delete email accounts
- **Domain Configuration** - Manage email domains and settings
- **System Monitoring** - Check status, logs, and metrics
- **Automation** - Scriptable operations for DevOps workflows

---

## 🛠️ Installation

### 📋 Prerequisites

- **Node.js** 18.0.0 or higher
- **TypeScript** 5.0 or higher
- **Aether Mailer Server** - Running API server instance

### 🔧 Setup Instructions

1. **Install dependencies**
   ```bash
   cd cli
   pnpm install
   ```

2. **Build the CLI**
   ```bash
   pnpm build
   ```

3. **Install globally (optional)**
   ```bash
   pnpm link --global
   ```

4. **Verify installation**
   ```bash
   mailer --version
   mailer --help
   ```

### 🚀 **Quick Start**

```bash
# Check server status
mailer status

# List all users
mailer users list

# Create a new user
mailer users create --email user@example.com --password securepass

# Check system logs
mailer logs --tail 50

# Get server metrics
mailer metrics --format json
```

---

## 📋 Commands

### 🏥 **Server Management**

#### `mailer status`
Check the overall status of the Aether Mailer server.

```bash
mailer status [options]

Options:
  --format, -f    Output format (table|json) [default: table]
  --verbose, -v   Detailed status information
  --watch, -w     Watch status changes continuously

Examples:
  mailer status
  mailer status --format json
  mailer status --verbose --watch
```

#### `mailer health`
Perform comprehensive health checks on all services.

```bash
mailer health [options]

Options:
  --check, -c     Specific service to check (database|redis|smtp|imap)
  --timeout, -t   Health check timeout in seconds [default: 30]
  --quiet, -q     Only exit code, no output

Examples:
  mailer health
  mailer health --check database
  mailer health --timeout 60
```

### 👥 **User Management**

#### `mailer users list`
List all email users in the system.

```bash
mailer users list [options]

Options:
  --domain, -d    Filter by domain
  --status, -s    Filter by status (active|inactive|suspended)
  --format, -f    Output format (table|json|csv)
  --limit, -l     Maximum number of results [default: 100]
  --offset, -o    Results offset [default: 0]

Examples:
  mailer users list
  mailer users list --domain example.com
  mailer users list --status active --format json
```

#### `mailer users create`
Create a new email user account.

```bash
mailer users create [options]

Required:
  --email, -e     Email address for the user
  --password, -p  Initial password

Optional:
  --domain, -d     Domain (auto-detected from email)
  --name, -n      Display name for the user
  --quota, -q     Storage quota in MB [default: 1000]
  --active, -a    Account status (true|false) [default: true]
  --admin, -A     Admin privileges (true|false) [default: false]

Examples:
  mailer users create --email user@example.com --password securepass
  mailer users create --email admin@example.com --password adminpass --admin --name "Admin User"
  mailer users create --email user@company.com --password pass123 --quota 5000
```

#### `mailer users update`
Update an existing user account.

```bash
mailer users update <email> [options]

Required:
  <email>         Email address of user to update

Optional:
  --password, -p  New password
  --name, -n      New display name
  --quota, -q     New storage quota in MB
  --status, -s    New status (active|inactive|suspended)
  --admin, -A     Admin privileges (true|false)

Examples:
  mailer users update user@example.com --password newpass
  mailer users update admin@example.com --name "New Name"
  mailer users update user@company.com --status suspended
```

#### `mailer users delete`
Delete a user account.

```bash
mailer users delete <email> [options]

Required:
  <email>         Email address of user to delete

Optional:
  --force, -f     Skip confirmation prompt
  --backup, -b    Create backup before deletion

Examples:
  mailer users delete user@example.com
  mailer users delete olduser@example.com --force
  mailer users delete user@company.com --backup
```

### 🌐 **Domain Management**

#### `mailer domains list`
List all configured email domains.

```bash
mailer domains list [options]

Options:
  --format, -f    Output format (table|json)
  --status, -s    Filter by status (active|inactive)

Examples:
  mailer domains list
  mailer domains list --format json
  mailer domains list --status active
```

#### `mailer domains create`
Create a new email domain configuration.

```bash
mailer domains create <domain> [options]

Required:
  <domain>        Domain name to configure

Optional:
  --description, -d  Domain description
  --active, -a    Domain status (true|false) [default: true]
  --quota, -q     Default user quota in MB [default: 1000]

Examples:
  mailer domains create example.com
  mailer domains create company.com --description "Company domain"
  mailer domains create newdomain.com --quota 2000
```

### 📊 **Monitoring & Logs**

#### `mailer logs`
View and filter system logs.

```bash
mailer logs [options]

Options:
  --service, -s   Service to filter (api|smtp|imap|all) [default: all]
  --level, -l     Log level (error|warn|info|debug) [default: info]
  --tail, -t      Number of lines to show [default: 100]
  --follow, -f    Follow log output (like tail -f)
  --since, -S     Show logs since timestamp (ISO 8601)
  --format, -F    Output format (text|json)

Examples:
  mailer logs
  mailer logs --service api --level error
  mailer logs --tail 50 --follow
  mailer logs --since 2025-01-01T00:00:00Z --format json
```

#### `mailer metrics`
Display system performance metrics.

```bash
mailer metrics [options]

Options:
  --type, -t      Metric type (system|email|users|all) [default: all]
  --format, -f    Output format (table|json|prometheus)
  --duration, -d  Time range (1h|6h|24h|7d) [default: 1h]
  --watch, -w     Watch metrics in real-time

Examples:
  mailer metrics
  mailer metrics --type system --format json
  mailer metrics --duration 24h --watch
  mailer metrics --type email --format prometheus
```

### ⚙️ **Configuration**

#### `mailer config get`
Get configuration values.

```bash
mailer config get <key> [options]

Required:
  <key>           Configuration key (use 'list' to see all)

Optional:
  --format, -f    Output format (text|json)

Examples:
  mailer config get server.port
  mailer config get database.url --format json
  mailer config get list
```

#### `mailer config set`
Set configuration values.

```bash
mailer config set <key> <value> [options]

Required:
  <key>           Configuration key
  <value>         Configuration value

Optional:
  --type, -t      Value type (string|number|boolean|json)
  --restart, -r   Restart server after config change

Examples:
  mailer config set server.port 8080
  mailer config set debug.enabled true --type boolean
  mailer config set features.new_feature false --restart
```

### 🔧 **Utilities**

#### `mailer backup`
Create and manage system backups.

```bash
mailer backup [action] [options]

Actions:
  create          Create a new backup
  list            List available backups
  restore <id>    Restore from backup
  delete <id>     Delete a backup

Options for 'create':
  --type, -t      Backup type (full|incremental) [default: full]
  --compress, -c  Compress backup [default: true]
  --path, -p      Custom backup path

Examples:
  mailer backup create
  mailer backup list
  mailer backup restore backup_20250112_1000
  mailer backup delete backup_20250112_1000
```

#### `mailer migrate`
Database migration management.

```bash
mailer migrate [action] [options]

Actions:
  status          Show migration status
  up              Run pending migrations
  down <version>  Rollback to version
  create <name>   Create new migration

Examples:
  mailer migrate status
  mailer migrate up
  mailer migrate down 20240101000000
  mailer migrate create add_user_settings
```

---

## 🏗️ Architecture

### 📁 **Directory Structure**

```
cli/
├── src/
│   ├── commands/           # Command implementations
│   │   ├── users.ts       # User management commands
│   │   ├── domains.ts     # Domain management commands
│   │   ├── server.ts      # Server management commands
│   │   ├── logs.ts        # Log viewing commands
│   │   ├── metrics.ts     # Metrics commands
│   │   ├── config.ts      # Configuration commands
│   │   └── backup.ts      # Backup commands
│   ├── utils/             # Utility functions
│   │   ├── api.ts         # API client for server communication
│   │   ├── config.ts      # CLI configuration management
│   │   ├── format.ts      # Output formatting utilities
│   │   ├── validation.ts  # Input validation
│   │   └── logger.ts      # CLI logging utilities
│   ├── types/             # TypeScript type definitions
│   │   ├── commands.ts    # Command interface types
│   │   ├── config.ts      # Configuration types
│   │   └── api.ts         # API response types
│   ├── main.ts            # Main CLI entry point
│   └── cli.ts             # CLI framework setup
├── tests/                 # Test suites
├── docs/                  # Command documentation
├── tsconfig.json          # TypeScript configuration
├── tsconfig.build.json    # Build-specific TypeScript config
├── package.json           # Package dependencies
├── CODEOWNERS             # Code ownership rules
└── README.md              # This documentation
```

### 🔧 **CLI Framework Architecture**

```typescript
// Command structure interface
interface Command {
  name: string;
  description: string;
  usage: string;
  options: CommandOption[];
  action: (args: any, options: any) => Promise<void>;
}

// Example command implementation
export class UsersCommand implements Command {
  name = 'users';
  description = 'Manage email users';
  
  subcommands = {
    list: new UsersListCommand(),
    create: new UsersCreateCommand(),
    update: new UsersUpdateCommand(),
    delete: new UsersDeleteCommand(),
  };
}
```

### 🌐 **API Integration**

The CLI communicates with the Aether Mailer API server:

```typescript
// API client configuration
class ApiClient {
  private baseURL: string;
  private authToken?: string;
  
  constructor(config: CLIConfig) {
    this.baseURL = config.server.url;
    this.authToken = config.server.token;
  }
  
  async request<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    // HTTP request implementation with error handling
  }
}
```

---

## 🔧 Configuration

### 📄 **Configuration Files**

#### `~/.mailer/config.json`
```json
{
  "server": {
    "url": "http://localhost:8080",
    "token": "jwt-token-here",
    "timeout": 30000
  },
  "cli": {
    "defaultFormat": "table",
    "confirmDestructive": true,
    "logLevel": "info"
  },
  "output": {
    "colors": true,
    "pager": true,
    "timestamp": false
  }
}
```

#### `.mailer.local.json` (Project-specific)
```json
{
  "server": {
    "url": "http://localhost:8080"
  },
  "cli": {
    "defaultFormat": "json"
  }
}
```

### 🌍 **Environment Variables**

```bash
# Server Configuration
MAILER_SERVER_URL=http://localhost:8080
MAILER_SERVER_TOKEN=jwt-token-here
MAILER_SERVER_TIMEOUT=30000

# CLI Configuration
MAILER_DEFAULT_FORMAT=table
MAILER_LOG_LEVEL=info
MAILER_CONFIRM_DESTRUCTIVE=true

# Output Configuration
MAILER_COLORS=true
MAILER_PAGER=true
NO_COLOR=true          # Disable colors
```

---

## 🛠️ Development

### 📋 **Development Commands**

```bash
# Development
pnpm dev              # Run CLI in development mode
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

# CLI Testing
pnpm cli --help       # Test CLI help
pnpm cli status       # Test CLI commands
```

### 🧪 **Testing Strategy**

```typescript
// Example command test
describe('UsersCommand', () => {
  it('should list users correctly', async () => {
    const mockApiClient = createMockApiClient();
    const command = new UsersListCommand(mockApiClient);
    
    await command.action({}, {});
    
    expect(mockApiClient.get).toHaveBeenCalledWith('/api/users');
  });
});
```

### 📝 **Code Standards**

- **TypeScript Strict** - All code must pass strict type checking
- **Command Pattern** - Use consistent command structure
- **Error Handling** - Graceful error handling with user-friendly messages
- **Input Validation** - Validate all user inputs
- **Help Documentation** - Comprehensive help for all commands

---

## 📊 Current Status

| Component | Status | Notes |
|-----------|--------|-------|
| **CLI Framework** | 📋 Planned | Command structure design |
| **API Client** | 📋 Planned | Server communication |
| **User Commands** | 📋 Planned | CRUD operations |
| **Domain Commands** | 📋 Planned | Domain management |
| **Server Commands** | 📋 Planned | Status and health |
| **Log Commands** | 📋 Planned | Log viewing and filtering |
| **Config Commands** | 📋 Planned | Configuration management |
| **Backup Commands** | 📋 Planned | Backup and restore |
| **Testing Suite** | 📋 Planned | Unit and integration tests |

---

## 🚀 Roadmap

### 🎯 **Phase 1: Foundation (Q1 2025)**
- **CLI Framework** - Command parsing and routing
- **API Client** - Server communication layer
- **Basic Commands** - Status, health, config
- **Error Handling** - Comprehensive error management
- **Help System** - Command documentation and help

### 🚀 **Phase 2: Core Commands (Q2 2025)**
- **User Management** - Complete CRUD operations
- **Domain Management** - Domain configuration
- **Log Viewing** - Log filtering and tailing
- **Metrics Display** - System performance metrics
- **Configuration** - Get/set config values

### ⚙️ **Phase 3: Advanced Features (Q3 2025)**
- **Backup System** - Create and manage backups
- **Migration Tools** - Database migration management
- **Batch Operations** - Bulk user/domain operations
- **Scripting Support** - JavaScript/TypeScript scripting
- **Plugin System** - Extensible command plugins

### 🌟 **Phase 4: Enterprise Features (Q4 2025)**
- **Multi-Server** - Manage multiple server instances
- **Role-Based Access** - Command-level permissions
- **Audit Logging** - Command execution logging
- **Integration APIs** - External system integration
- **Web Interface** - Web-based CLI terminal

---

## 🤝 Contributing

### 🎯 **How to Contribute**

The CLI is perfect for contributors with expertise in:

- **Command Line Tools** - CLI design and user experience
- **Node.js/TypeScript** - Server-side JavaScript development
- **API Integration** - REST API client development
- **DevOps Automation** - Scripting and automation
- **System Administration** - Server management experience

### 📝 **Adding New Commands**

1. **Create command class**
   ```typescript
   export class NewCommand implements Command {
     name = 'new';
     description = 'Description of the command';
     usage = 'mailer new [options]';
     
     async action(args: any, options: any): Promise<void> {
       // Command implementation
     }
   }
   ```

2. **Add to command registry**
   ```typescript
   // Register the command
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

- **Consistent Interface** - Follow established command patterns
- **Error Handling** - Provide clear error messages and exit codes
- **Input Validation** - Validate all user inputs
- **Help Documentation** - Comprehensive help for all commands
- **Testing** - Unit tests for all command logic

---

## 📞 Support & Resources

### 📖 **Documentation**

- **[Command Reference](docs/commands/)** - Complete command documentation
- **[API Documentation](docs/api/)** - Server API reference
- **[Configuration Guide](docs/config/)** - Configuration options
- **[Development Guide](docs/development/)** - Contributing guidelines

### 💬 **Getting Help**

- **Built-in Help** - `mailer --help` and `mailer <command> --help`
- **GitHub Issues** - Bug reports and feature requests
- **Discussions** - General questions and ideas
- **Development Team** - Contact CLI maintainers

---

## 📄 License

This CLI tool is part of the Aether Mailer project, licensed under the **MIT License** - see the [LICENSE](../LICENSE) file for details.

---

<div align="center">

### 🖥️ **Powerful Terminal Administration for Aether Mailer**

[⭐ Star Project](https://github.com/skygenesisenterprise/aether-mailer) • [🐛 Report Issues](https://github.com/skygenesisenterprise/aether-mailer/issues) • [💡 Start Discussion](https://github.com/skygenesisenterprise/aether-mailer/discussions)

---

**🔧 Currently in Planning Phase - CLI Developers Welcome!**

**Made with ❤️ by the [Sky Genesis Enterprise](https://skygenesisenterprise.com) CLI team**

*Building powerful, intuitive command-line tools for mail server administration*

</div>