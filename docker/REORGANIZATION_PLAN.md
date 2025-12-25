# Docker Filesystem Structure for Aether Mailer

# Reorganized to follow Linux Filesystem Hierarchy Standard (FHS)

# Root filesystem structure for containers

rootfs/
├── bin/ # Essential command binaries
│ ├── bash # Default shell
│ ├── sh # POSIX shell (symlink)
│ ├── coreutils/ # File utilities (ls, cp, mv, etc.)
│ ├── curl # HTTP client for external auth
│ └── docker-entrypoint # Container entrypoint script
├── sbin/ # System administration binaries
│ ├── sshd # SSH daemon
│ └── run-parts # Execute cron scripts
├── etc/ # System configuration
│ ├── passwd # User accounts (minimal)
│ ├── group # User groups
│ ├── shadow # Password hashes (if needed)
│ ├── hosts # Hostname resolution
│ ├── resolv.conf # DNS configuration
│ ├── nsswitch.conf # Name service switch
│ ├── localtime # Timezone (symlink)
│ ├── profile # Shell initialization
│ ├── ssh/ # SSH configuration
│ │ ├── sshd_config # SSH daemon configuration
│ │ ├── ssh_host_rsa_key # Host keys (generated)
│ │ └── ssh_host_ed25519_key # Host keys (generated)
│ ├── ssh_config # SSH client configuration
│ ├── banner # SSH login banner
│ ├── environment # Environment variables
│ ├── logrotate.conf # Log rotation settings
│ ├── cron.d/ # Cron job definitions
│ └── templates/ # Configuration templates
│ ├── app.ini # Application configuration template
│ └── sshd_config # SSH daemon template
├── lib/ # Essential shared libraries
│ └── x86_64-linux-gnu/ # Architecture-specific libraries
├── lib64/ # 64-bit shared libraries
├── usr/ # Secondary hierarchy
│ ├── bin/ # User binaries
│ │ └── mailer-shell # Application-specific shell
│ ├── lib/ # Application libraries
│ ├── share/ # Architecture-independent data
│ │ ├── man/ # Manual pages
│ │ └── doc/ # Documentation
│ └── local/ # Local software
│ └── bin/ # Local binaries
├── var/ # Variable data
│ ├── lib/ # Application state
│ │ ├── aether-mailer/ # Application-specific state
│ │ └── ssh/ # SSH runtime files
│ ├── log/ # Log files
│ │ ├── auth.log # Authentication logs
│ │ ├── mailer.log # Application logs
│ │ └── sshd.log # SSH daemon logs
│ ├── cache/ # Application cache
│ ├── tmp/ # Temporary files (persistent)
│ ├── spool/ # Spool directories
│ │ ├── mail/ # Mail queue (if applicable)
│ │ └── cron/ # Cron spool
│ └── run/ # Runtime data (tmpfs)
│ └── sshd.pid # SSH daemon PID file
├── tmp/ # Temporary files (cleared on restart)
├── app/ # Application-specific (container convention)
│ ├── bin/ # Application binaries
│ ├── config/ # Application configuration
│ ├── data/ # Application data (mounted volume)
│ └── logs/ # Application logs (mounted volume)
├── opt/ # Optional software packages
│ └── aether-mailer/ # Main application
│ ├── bin/ # Application binaries
│ ├── config/ # Configuration files
│ └── lib/ # Application libraries
└── proc/ # Process filesystem (Docker mount)
└── sys/ # System filesystem (Docker mount)
└── dev/ # Device filesystem (Docker mount)

# Container build files

├── Dockerfile # Standard container image
├── Dockerfile.rootless # Rootless container variant
├── Dockerfile.minimal # Minimal base image variant
├── .dockerignore # Docker ignore file

# Orchestration files

├── docker-compose.yml # Development environment
├── docker-compose.prod.yml # Production environment
├── docker-compose.test.yml # Testing environment
├── docker-compose.override.yml # Local overrides
├── .env.example # Environment variable template
├── .env.prod # Production environment variables

# Kubernetes manifests

kubernetes/
├── namespace.yaml # Namespace definition
├── configmap.yaml # Configuration data
├── secret.yaml # Sensitive configuration
├── deployment.yaml # Application deployment
├── service.yaml # Service exposure
├── ingress.yaml # External access
├── persistentvolume.yaml # Storage configuration
├── serviceaccount.yaml # Service account
├── rolebinding.yaml # RBAC configuration
└── networkpolicy.yaml # Network security

# Build and deployment scripts

scripts/
├── build.sh # Multi-architecture build
├── push.sh # Registry push automation
├── deploy.sh # Deployment automation
├── test.sh # Container testing
├── health-check.sh # Health monitoring
├── security-scan.sh # Security vulnerability scan
├── backup.sh # Backup utilities
└── cleanup.sh # Resource cleanup

# Configuration files

config/
├── nginx/ # Nginx configuration
│ ├── nginx.conf # Main configuration
│ └── sites-available/ # Site configurations
├── ssl/ # SSL certificates
├── monitoring/ # Monitoring configuration
│ ├── prometheus.yml # Prometheus config
│ └── grafana/ # Grafana dashboards
└── logging/ # Logging configuration
└── logstash.conf # Log processing

# Documentation

docs/
├── README.md # Main documentation
├── SECURITY.md # Security guidelines
├── DEPLOYMENT.md # Deployment guide
├── TROUBLESHOOTING.md # Troubleshooting guide
└── examples/ # Usage examples

# Templates

templates/
├── systemd/ # Systemd service files
├── upstart/ # Upstart configuration
└── sysvinit/ # SysV init scripts

# Tests

tests/
├── unit/ # Unit tests
├── integration/ # Integration tests
├── security/ # Security tests
└── performance/ # Performance tests

# Development tools

dev/
├── docker-compose.dev.yml # Development override
├── debug.yml # Debug configuration
└── tools/ # Development utilities
