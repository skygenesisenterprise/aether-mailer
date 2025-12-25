#!/bin/sh
# Container health check script
# Performs comprehensive health checks for Aether Mailer container

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
HEALTH_URL="http://localhost:3000"
API_URL="http://localhost:8080"
SSH_PORT="${SSH_PORT:-2222}"
MAX_RETRIES=3
TIMEOUT=5

echo "${BLUE}🔍 Aether Mailer Container Health Check${NC}"
echo "=================================="

# Function to check service
check_service() {
    local service_name="$1"
    local check_command="$2"
    local description="$3"
    
    echo -n "Checking $service_name... "
    
    if eval "$check_command" >/dev/null 2>&1; then
        echo "${GREEN}✓ OK${NC}"
        return 0
    else
        echo "${RED}✗ FAILED${NC}"
        echo "  ${YELLOW}$description${NC}"
        return 1
    fi
}

# Function to check port
check_port() {
    local port="$1"
    local service="$2"
    
    # Check if port is listening
    if netstat -ln 2>/dev/null | grep -q ":$port "; then
        return 0
    elif ss -ln 2>/dev/null | grep -q ":$port "; then
        return 0
    else
        return 1
    fi
}

# Check HTTP services
echo "${BLUE}🌐 Web Services${NC}"
check_service "Frontend" "curl -s --max-time $TIMEOUT $HEALTH_URL >/dev/null" "Frontend not responding on port 3000"

check_service "Backend API" "curl -s --max-time $TIMEOUT $API_URL/health >/dev/null" "Backend API not responding on port 8080"

# Check SSH service
echo ""
echo "${BLUE}🔐 SSH Service${NC}"
check_service "SSH Daemon" "check_port $SSH_PORT" "SSH not listening on port $SSH_PORT"

# Check system resources
echo ""
echo "${BLUE}💾 System Resources${NC}"

# Check disk space
disk_usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$disk_usage" -lt 90 ]; then
    echo "Disk Usage: ${GREEN}$disk_usage%${NC} ✓"
else
    echo "Disk Usage: ${RED}$disk_usage%${NC} ✗ (High usage warning)"
fi

# Check memory
if [ -f /proc/meminfo ]; then
    mem_total=$(grep MemTotal /proc/meminfo | awk '{print $2}')
    mem_available=$(grep MemAvailable /proc/meminfo | awk '{print $2}')
    mem_usage=$(( (mem_total - mem_available) * 100 / mem_total ))
    
    if [ "$mem_usage" -lt 90 ]; then
        echo "Memory Usage: ${GREEN}$mem_usage%${NC} ✓"
    else
        echo "Memory Usage: ${RED}$mem_usage%${NC} ✗ (High usage warning)"
    fi
else
    echo "Memory: ${YELLOW}Unable to determine${NC}"
fi

# Check processes
echo ""
echo "${BLUE}⚙️  Running Processes${NC}"

# Check essential processes
processes_ok=true

if pgrep -f "sshd" >/dev/null; then
    echo "SSH Daemon: ${GREEN}Running${NC} ✓"
else
    echo "SSH Daemon: ${RED}Not Running${NC} ✗"
    processes_ok=false
fi

if pgrep -f "node.*main.js" >/dev/null; then
    echo "Backend: ${GREEN}Running${NC} ✓"
else
    echo "Backend: ${RED}Not Running${NC} ✗"
    processes_ok=false
fi

if pgrep -f "node.*next" >/dev/null; then
    echo "Frontend: ${GREEN}Running${NC} ✓"
else
    echo "Frontend: ${RED}Not Running${NC} ✗"
    processes_ok=false
fi

# Overall health
echo ""
echo "=================================="
if $processes_ok; then
    echo "${GREEN}🎉 Overall Health: HEALTHY${NC}"
    exit 0
else
    echo "${RED}💥 Overall Health: UNHEALTHY${NC}"
    exit 1
fi