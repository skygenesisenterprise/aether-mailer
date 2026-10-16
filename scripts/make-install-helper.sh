#!/bin/bash
set -euo pipefail

# Notploy self-hosted installation helper
# Orchestrates the full setup for 'make install'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[✓]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[✗]${NC} $1"; }

# Check if running as root
check_root() {
    if [ "$(id -u)" -eq 0 ]; then
        log_warn "Running as root - this is acceptable for server installation"
    else
        log_info "Not running as root - some operations may require sudo"
    fi
}

# Check system requirements
check_requirements() {
    log_info "Checking system requirements..."
    
    # OS
    if [ "$(uname -s)" = "Linux" ]; then
        log_success "Linux"
    else
        log_error "Only Linux is supported"
        exit 1
    fi
    
    # Architecture
    ARCH=$(uname -m)
    log_success "Architecture: $ARCH"
    
    # Docker
    if command -v docker >/dev/null 2>&1; then
        log_success "Docker"
    else
        log_error "Docker not found. Please install Docker first."
        exit 1
    fi
    
    # Docker Compose
    if docker compose version >/dev/null 2>&1; then
        log_success "Docker Compose"
    elif docker-compose --version >/dev/null 2>&1; then
        log_success "Docker Compose (legacy)"
    else
        log_error "Docker Compose not found"
        exit 1
    fi
    
    # Git
    if command -v git >/dev/null 2>&1; then
        log_success "Git"
    else
        log_error "Git not found"
        exit 1
    fi
    
    # Make
    if command -v make >/dev/null 2>&1; then
        log_success "Make"
    else
        log_error "Make not found"
        exit 1
    fi
    
    # Disk space (need at least ~10GB)
    AVAILABLE=$(df -BG . | awk 'NR==2 {gsub("G","",$4); print $4}')
    if [ "$AVAILABLE" -gt 10 ]; then
        log_success "Disk space (${AVAILABLE}GB available)"
    else
        log_warn "Low disk space: ${AVAILABLE}GB available (recommended 20GB+)"
    fi
    
    # Memory
    MEM_GB=$(free -g | awk '/^Mem:/{print $2}')
    if [ "$MEM_GB" -gt 1 ]; then
        log_success "Memory (${MEM_GB}GB available)"
    else
        log_warn "Low memory: ${MEM_GB}GB available (recommended 2GB+)"
    fi
}

# Setup configuration
setup_config() {
    log_info "Setting up configuration..."
    
    if [ -f .env ]; then
        log_success "Existing .env found, reusing configuration"
        return 0
    fi
    
    if [ -f .env.example ]; then
        cp .env.example .env
        log_success "Generated .env from .env.example"
        log_warn "You may want to customize .env for production use"
    else
        log_error ".env.example not found"
        exit 1
    fi
}

# Generate secrets if needed
generate_secrets() {
    log_info "Generating secure secrets..."
    
    if command -v openssl >/dev/null 2>&1; then
        # Check if secrets are still default values
        if grep -q "change-me-postgres-password" .env 2>/dev/null; then
            POSTGRES_PASS=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
            sed -i "s/change-me-postgres-password/$POSTGRES_PASS/g" .env
            log_success "Generated PostgreSQL password"
        fi
        
        if grep -q "change-me-better-auth-secret" .env 2>/dev/null; then
            AUTH_SECRET=$(openssl rand -hex 32)
            sed -i "s/change-me-better-auth-secret/$AUTH_SECRET/g" .env
            log_success "Generated auth secret"
        fi
    else
        log_warn "openssl not found, skipping automatic secret generation"
    fi
}

# Create necessary directories
setup_directories() {
    log_info "Creating directories..."
    mkdir -p /etc/notploy 2>/dev/null || sudo mkdir -p /etc/notploy 2>/dev/null || true
    log_success "Directories ready"
}

# Start the stack
start_stack() {
    log_info "Starting Notploy stack..."
    docker compose up -d --build
    log_success "Stack started"
}

# Wait for services to be healthy
wait_for_health() {
    log_info "Waiting for services to become healthy..."
    local max_wait=120
    local count=0
    
    while [ $count -lt $max_wait ]; do
        if docker compose ps postgres 2>&1 | grep -q "healthy"; then
            log_success "Database healthy"
            break
        fi
        sleep 2
        count=$((count + 2))
    done
    
    if [ $count -ge $max_wait ]; then
        log_warn "Database health check timeout - continuing anyway"
    fi
}

# Check final status
check_status() {
    log_info "Verifying installation..."
    docker compose ps 2>&1 | grep -v "NAME\|----" | head -5
    log_success "Installation completed"
}

main() {
    echo -e "${GREEN}=====================================${NC}"
    echo -e "${GREEN}   Notploy Installation Script       ${NC}"
    echo -e "${GREEN}=====================================${NC}"
    echo ""
    
    check_root
    check_requirements
    setup_config
    generate_secrets
    setup_directories
    start_stack
    wait_for_health
    check_status
    
    echo ""
    echo -e "${GREEN}✓ Notploy installation completed${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo -e "  1. Open http://localhost:3000 in your browser"
    echo -e "  2. Complete the initial setup"
    echo -e "  3. Use 'make status' to check service status"
    echo -e "  4. Use 'make logs' to view logs"
    echo ""
}

main "$@"
