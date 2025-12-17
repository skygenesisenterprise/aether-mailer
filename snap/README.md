<div align="center">

# 📦 Aether Mailer Snap Services

[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](https://github.com/skygenesisenterprise/aether-mailer/blob/main/LICENSE) [![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/) [![Snap](https://img.shields.io/badge/Snap-Store-green?style=for-the-badge&logo=snapcraft)](https://snapcraft.io/)

**🚀 Snap Package for Aether Mailer - Universal Linux Distribution**

Cross-platform package distribution for Aether Mailer using Snap technology.

[📋 Installation](#-installation) • [🛠️ Development](#️-development) • [📁 Structure](#-structure) • [🔧 Configuration](#-configuration)

</div>

---

## 🌟 What is @aether-mailer/snap?

**@aether-mailer/snap** provides universal Linux package distribution for Aether Mailer through the Snap ecosystem. This package enables easy installation and updates across all major Linux distributions.

### 🎯 Key Features

- **Universal Distribution** - Works on Ubuntu, Debian, Fedora, Arch, and more
- **Automatic Updates** - Seamless version management through Snap channels
- **Sandboxed Security** - Confined execution with controlled permissions
- **Dependency Management** - Bundled dependencies for reliable operation
- **Cross-Platform** - Single package for all Linux distributions

---

## 📋 Installation

### 🚀 **Quick Install**

```bash
# Install from Snap Store (recommended)
sudo snap install mailer

# Install with specific channel
sudo snap install mailer --channel=stable
```

### 🔧 **Development Install**

```bash
# Install local development build
sudo snap install --dangerous mailer*.snap

# Connect required interfaces
sudo snap connect mailer:network-bind
sudo snap connect mailer:home
```

### 📋 **Available Channels**

```bash
# Stable channel (recommended for production)
sudo snap refresh mailer --channel=stable

# Beta channel (new features, tested)
sudo snap refresh mailer --channel=beta

# Edge channel (latest development)
sudo snap refresh mailer --channel=edge

# Candidate channel (pre-release testing)
sudo snap refresh mailer --channel=candidate
```

---

## 🛠️ Development

### 🏗️ **Building Snap Package**

```bash
# Navigate to snap package directory
cd snap/

# Install dependencies
pnpm install

# Build TypeScript
pnpm run build

# Create snap package
snapcraft

# Install local build for testing
sudo snap install --dangerful *.snap
```

### 🧪 **Testing Snap Package**

```bash
# Test snap installation
snap info mailer

# Check snap status
snap services mailer

# View snap logs
snap logs mailer

# Test snap functionality
mailer --help
mailer status
mailer version
```

### 🔧 **Development Workflow**

```bash
# 1. Make changes to source code
pnpm dev

# 2. Run tests and type checking
pnpm test
pnpm run typecheck
pnpm run lint

# 3. Build new version
pnpm run build

# 4. Create snap package
snapcraft

# 5. Test locally
sudo snap install --dangerous *.snap

# 6. Verify functionality
mailer status
```

---

## 📁 Structure

### 📦 **Package Organization**

```
snap/
├── src/                    # TypeScript source code
│   ├── index.ts           # Main entry point
│   ├── commands/          # Snap-specific commands
│   ├── utils/             # Utility functions
│   └── types/             # TypeScript definitions
├── snap/                  # Snap configuration
│   ├── snapcraft.yaml     # Snap build configuration
│   └── setup/             # Installation scripts
├── build/                 # Build output directory
├── dist/                  # Compiled JavaScript
├── package.json           # Package metadata
├── tsconfig.json          # TypeScript configuration
└── README.md              # This documentation
```

### ⚙️ **Snap Configuration**

```yaml
# snap/snapcraft.yaml
name: aether-mailer
version: git
summary: Modern mail server foundation
description: |
  Aether Mailer is a comprehensive mail server foundation with
  complete authentication system and modern web stack.

grade: stable
confinement: strict

apps:
  aether-mailer:
    command: bin/mailer
    plugs:
      - network-bind
      - home
      - network

parts:
  aether-mailer:
    plugin: nodejs
    source: .
    build-packages:
      - nodejs
      - npm
```

---

## 🔧 Configuration

### 🌐 **Snap Interfaces**

```bash
# Network access (required)
sudo snap connect mailer:network

# Network binding (for server)
sudo snap connect mailer:network-bind

# Home directory access
sudo snap connect mailer:home

# System configuration (optional)
sudo snap connect mailer:system-observe
```

### 📋 **Configuration Files**

```bash
# Snap configuration directory
~/snap/mailer/common/

# Configuration files
~/snap/mailer/common/config/
├── app.json              # Application settings
├── database.json         # Database configuration
└── logging.json          # Logging preferences

# Data directory
~/snap/mailer/common/data/
├── database/             # Database files
├── logs/                 # Log files
└── certificates/        # SSL certificates
```

### 🔧 **Environment Variables**

```bash
# Snap-specific environment
SNAP_USER_COMMON=$HOME/snap/mailer/common
SNAP_USER_DATA=$HOME/snap/mailer/current
SNAP_COMMON=/snap/mailer/common
SNAP_DATA=/snap/mailer/current

# Application configuration
AETHER_MAILER_CONFIG=$SNAP_USER_COMMON/config
AETHER_MAILER_DATA=$SNAP_USER_COMMON/data
AETHER_MAILER_LOGS=$SNAP_USER_COMMON/logs
```

---

## 🚀 Usage

> **💡 Note:** The snap package installs under the name `aether-mailer` but exposes the `mailer` command for simplified use.

### 🎯 **Basic Commands**

```bash
# Start Aether Mailer
sudo snap start mailer

# Stop Aether Mailer
sudo snap stop mailer

# Restart service
sudo snap restart mailer

# Check service status
sudo snap services mailer

# View logs
snap logs mailer

# Run commands
mailer status
mailer start
mailer stop
```

### 📊 **Service Management**

```bash
# Enable auto-start
sudo snap enable mailer

# Disable auto-start
sudo snap disable mailer

# Run as daemon
sudo snap run --daemon mailer

# Run in foreground
mailer --foreground
```

---

## 🔄 Updates & Maintenance

### 📦 **Automatic Updates**

```bash
# Check for updates
snap refresh --list

# Update to latest version
sudo snap refresh mailer

# Update to specific channel
sudo snap refresh mailer --channel=beta

# Hold current version
sudo snap refresh --hold mailer

# Remove hold
sudo snap refresh --unhold mailer
```

### 🔧 **Maintenance Commands**

```bash
# Clean old versions
sudo snap remove mailer --revision=<old-revision>

# Check disk usage
du -sh ~/snap/mailer/

# Backup configuration
cp -r ~/snap/mailer/common/ ~/mailer-backup/

# Reset to defaults
sudo snap remove mailer
sudo snap install mailer
```

---

## 🐛 Troubleshooting

### 🔍 **Common Issues**

```bash
# Permission denied
sudo snap connect mailer:network-bind

# Service not starting
snap logs mailer
sudo snap restart mailer

# Configuration issues
mailer config --validate
mailer config --reset

# Network problems
sudo snap connect mailer:network
ping 8.8.8.8
```

### 📋 **Debug Information**

```bash
# Snap information
snap info mailer

# Service status
systemctl status snap.mailer.mailer.service

# Network connections
netstat -tlnp | grep :3000
netstat -tlnp | grep :8080

# Process information
ps aux | grep mailer
```

---

## 📚 Development Resources

### 🛠️ **Snap Development**

- **[Snapcraft Documentation](https://snapcraft.io/docs)** - Official Snap documentation
- **[Snapcraft Forum](https://forum.snapcraft.io)** - Community support
- **[Snap Store](https://snapcraft.io/store)** - Browse available snaps

### 🔧 **Aether Mailer Development**

- **[Main Repository](https://github.com/skygenesisenterprise/aether-mailer)** - Project source code
- **[Documentation](../../docs/)** - Comprehensive guides
- **[API Reference](../../docs/api/)** - API documentation

---

## 🤝 Contributing

### 🎯 **How to Contribute**

1. **Fork the repository** and create a feature branch
2. **Make changes** to the snap package or configuration
3. **Test locally** with `snapcraft` and `snap install --dangerous`
4. **Submit pull request** with clear description of changes
5. **Community review** and merge to main branch

### 📋 **Areas for Contribution**

- **Snap Configuration** - Optimize snapcraft.yaml and interfaces
- **Build Automation** - Improve build scripts and CI/CD
- **Documentation** - Enhance guides and examples
- **Testing** - Add automated tests for snap functionality
- **Security** - Review and improve confinement policies

---

## 📄 License

This package is part of Aether Mailer and is licensed under the **MIT License** - see the [LICENSE](../../LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Snapcraft Team** - Excellent packaging framework
- **Canonical** - Snap technology and support
- **Linux Community** - Distribution and packaging expertise
- **Sky Genesis Enterprise** - Project leadership and development

---

<div align="center">

### 🚀 **Universal Linux Distribution Made Easy!**

[📦 Download from Snap Store](https://snapcraft.io/aether-mailer) • [🐛 Report Issues](https://github.com/skygenesisenterprise/aether-mailer/issues) • [💡 Join Discussions](https://github.com/skygenesisenterprise/aether-mailer/discussions)

---

**🔧 Cross-Platform Compatibility - One Package, All Linux Distributions**

**Made with ❤️ by the [Sky Genesis Enterprise](https://skygenesisenterprise.com) team**

</div>
